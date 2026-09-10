package handler

import (
	"errors"
	"fmt"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"kaset-fair-backend/internal/model"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ==========================================
// PRODUCTS HANDLERS
// ==========================================

// GetProducts handles GET /api/v1/products
func (h *AppHandler) GetProducts(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database is not connected"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	searchQuery := c.Query("q")
	category := c.Query("category")
	status := c.Query("status")

	query := h.DB.DB.Model(&model.Product{})

	if searchQuery != "" {
		likeQuery := "%" + searchQuery + "%"
		query = query.Where("name_th ILIKE ? OR name_en ILIKE ? OR desc_th ILIKE ? OR desc_en ILIKE ?", likeQuery, likeQuery, likeQuery, likeQuery)
	}

	if category == "combos" {
		query = query.Where("is_combo = ?", true)
	} else if category == "flavours" {
		query = query.Where("is_combo = ?", false)
	}

	if status == "available" {
		query = query.Where("is_available = ? AND is_sold_out = ?", true, false)
	} else if status == "soldout" {
		query = query.Where("is_sold_out = ?", true)
	} else if status == "hidden" {
		query = query.Where("is_available = ?", false)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count products"})
		return
	}

	var products []model.Product
	offset := (page - 1) * pageSize
	if err := query.Preload("ComboRecipes.Topping").Preload("ComboRecipes.BaseProduct").Order("is_recommended DESC, sort_order ASC, id ASC").Limit(pageSize).Offset(offset).Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products"})
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	if totalPages == 0 {
		totalPages = 1
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        products,
		"total":       total,
		"page":        page,
		"page_size":   pageSize,
		"total_pages": totalPages,
	})
}

// GetProductByID handles GET /api/v1/products/:id
func (h *AppHandler) GetProductByID(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database is not connected"})
		return
	}

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var product model.Product
	if err := h.DB.DB.Preload("ComboRecipes.Topping").Preload("ComboRecipes.BaseProduct").First(&product, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, product)
}

// CreateProduct handles POST /api/v1/products
func (h *AppHandler) CreateProduct(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database is not connected"})
		return
	}

	var req model.CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	isAvailable := true
	if req.IsAvailable != nil {
		isAvailable = *req.IsAvailable
	}
	isSoldOut := false
	if req.IsSoldOut != nil {
		isSoldOut = *req.IsSoldOut
	}
	isRecommended := false
	if req.IsRecommended != nil {
		isRecommended = *req.IsRecommended
	}
	sortOrder := 0
	if req.SortOrder != nil {
		sortOrder = *req.SortOrder
	}

	// Auto-detect combo if recipes/toppings provided
	isCombo := req.IsCombo
	if len(req.ToppingIDs) > 0 || req.BaseProductID != nil {
		isCombo = true
	}

	product := model.Product{
		NameTh:        req.NameTh,
		NameEn:        req.NameEn,
		DescTh:        req.DescTh,
		DescEn:        req.DescEn,
		PriceHot:      req.PriceHot,
		PriceIced:     req.PriceIced,
		ImageURL:      req.ImageURL,
		IsCombo:       isCombo,
		IsAvailable:   isAvailable,
		IsSoldOut:     isSoldOut,
		IsRecommended: isRecommended,
		SortOrder:     sortOrder,
	}

	err := h.DB.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&product).Error; err != nil {
			return err
		}

		// If combo recipes are specified, save them
		if isCombo && len(req.ToppingIDs) > 0 {
			var baseID uint
			if req.BaseProductID != nil {
				baseID = *req.BaseProductID
			}
			for _, topID := range req.ToppingIDs {
				recipe := model.ProductComboRecipe{
					ComboProductID: product.ID,
					BaseProductID:  baseID,
					ToppingID:      topID,
				}
				if err := tx.Create(&recipe).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product: " + err.Error()})
		return
	}

	h.DB.DB.Preload("ComboRecipes.Topping").Preload("ComboRecipes.BaseProduct").First(&product, product.ID)
	c.JSON(http.StatusCreated, product)
}

// UpdateProduct handles PUT /api/v1/products/:id
func (h *AppHandler) UpdateProduct(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database is not connected"})
		return
	}

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var product model.Product
	if err := h.DB.DB.First(&product, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	var req model.UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload: " + err.Error()})
		return
	}

	updates := make(map[string]interface{})
	if req.NameTh != nil {
		updates["name_th"] = *req.NameTh
	}
	if req.NameEn != nil {
		updates["name_en"] = *req.NameEn
	}
	if req.DescTh != nil {
		updates["desc_th"] = req.DescTh
	}
	if req.DescEn != nil {
		updates["desc_en"] = req.DescEn
	}
	if req.PriceHot != nil {
		updates["price_hot"] = req.PriceHot
	}
	if req.PriceIced != nil {
		updates["price_iced"] = req.PriceIced
	}
	if req.ImageURL != nil {
		updates["image_url"] = req.ImageURL
	}
	if req.IsCombo != nil {
		updates["is_combo"] = *req.IsCombo
	}
	if req.IsAvailable != nil {
		updates["is_available"] = *req.IsAvailable
	}
	if req.IsSoldOut != nil {
		updates["is_sold_out"] = *req.IsSoldOut
	}
	if req.IsRecommended != nil {
		updates["is_recommended"] = *req.IsRecommended
	}
	if req.SortOrder != nil {
		updates["sort_order"] = *req.SortOrder
	}

	txErr := h.DB.DB.Transaction(func(tx *gorm.DB) error {
		if len(updates) > 0 {
			if req.ImageURL != nil && product.ImageURL != nil && *product.ImageURL != "" && *product.ImageURL != *req.ImageURL {
				deleteUploadFile(*product.ImageURL)
			}

			if err := tx.Model(&product).Updates(updates).Error; err != nil {
				return err
			}
		}

		// If ToppingIDs is provided in update payload, sync product_combo_recipes
		if req.ToppingIDs != nil {
			// Delete existing combo recipes for this product
			if err := tx.Where("combo_product_id = ?", product.ID).Delete(&model.ProductComboRecipe{}).Error; err != nil {
				return err
			}

			if len(*req.ToppingIDs) > 0 {
				var baseID uint
				if req.BaseProductID != nil {
					baseID = *req.BaseProductID
				}
				for _, topID := range *req.ToppingIDs {
					recipe := model.ProductComboRecipe{
						ComboProductID: product.ID,
						BaseProductID:  baseID,
						ToppingID:      topID,
					}
					if err := tx.Create(&recipe).Error; err != nil {
						return err
					}
				}
				// Ensure is_combo is set to true
				tx.Model(&product).Update("is_combo", true)
			}
		}
		return nil
	})

	if txErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product: " + txErr.Error()})
		return
	}

	h.DB.DB.Preload("ComboRecipes.Topping").Preload("ComboRecipes.BaseProduct").First(&product, id)
	c.JSON(http.StatusOK, product)
}

// DeleteProduct handles DELETE /api/v1/products/:id
func (h *AppHandler) DeleteProduct(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database is not connected"})
		return
	}

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var product model.Product
	if err := h.DB.DB.First(&product, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if product.ImageURL != nil && *product.ImageURL != "" {
		deleteUploadFile(*product.ImageURL)
	}

	if err := h.DB.DB.Delete(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete product: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully", "id": id})
}

// ReorderProducts handles PUT /api/v1/products/reorder
func (h *AppHandler) ReorderProducts(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database is not connected"})
		return
	}

	var req model.ReorderProductsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	tx := h.DB.DB.Begin()
	for _, item := range req.Items {
		if err := tx.Model(&model.Product{}).Where("id = ?", item.ID).Update("sort_order", item.SortOrder).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product order: " + err.Error()})
			return
		}
	}
	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"message": "Products reordered successfully", "count": len(req.Items)})
}

// ==========================================
// TOPPINGS HANDLERS
// ==========================================

// GetToppings handles GET /api/v1/toppings
func (h *AppHandler) GetToppings(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database is not connected"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	searchQuery := c.Query("q")
	status := c.Query("status")

	query := h.DB.DB.Model(&model.Topping{})

	if searchQuery != "" {
		likeQuery := "%" + searchQuery + "%"
		query = query.Where("name_th ILIKE ? OR name_en ILIKE ?", likeQuery, likeQuery)
	}

	if status == "available" {
		query = query.Where("is_available = ? AND is_sold_out = ?", true, false)
	} else if status == "soldout" {
		query = query.Where("is_sold_out = ?", true)
	} else if status == "hidden" {
		query = query.Where("is_available = ?", false)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count toppings"})
		return
	}

	var toppings []model.Topping
	offset := (page - 1) * pageSize
	if err := query.Order("sort_order ASC, id ASC").Limit(pageSize).Offset(offset).Find(&toppings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch toppings"})
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	if totalPages == 0 {
		totalPages = 1
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        toppings,
		"total":       total,
		"page":        page,
		"page_size":   pageSize,
		"total_pages": totalPages,
	})
}

// GetToppingByID handles GET /api/v1/toppings/:id
func (h *AppHandler) GetToppingByID(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database is not connected"})
		return
	}

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid topping ID"})
		return
	}

	var topping model.Topping
	if err := h.DB.DB.First(&topping, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Topping not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, topping)
}

// CreateTopping handles POST /api/v1/toppings
func (h *AppHandler) CreateTopping(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database is not connected"})
		return
	}

	var req model.CreateToppingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	allowHot := true
	if req.AllowHot != nil {
		allowHot = *req.AllowHot
	}
	allowIced := true
	if req.AllowIced != nil {
		allowIced = *req.AllowIced
	}
	isAvailable := true
	if req.IsAvailable != nil {
		isAvailable = *req.IsAvailable
	}
	isSoldOut := false
	if req.IsSoldOut != nil {
		isSoldOut = *req.IsSoldOut
	}
	sortOrder := 0
	if req.SortOrder != nil {
		sortOrder = *req.SortOrder
	}

	topping := model.Topping{
		NameTh:      req.NameTh,
		NameEn:      req.NameEn,
		Price:       req.Price,
		AllowHot:    allowHot,
		AllowIced:   allowIced,
		ImageURL:    req.ImageURL,
		IsAvailable: isAvailable,
		IsSoldOut:   isSoldOut,
		SortOrder:   sortOrder,
	}

	if err := h.DB.DB.Select("NameTh", "NameEn", "Price", "AllowHot", "AllowIced", "ImageURL", "IsAvailable", "IsSoldOut", "SortOrder").Create(&topping).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create topping: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, topping)
}

// UpdateTopping handles PUT /api/v1/toppings/:id
func (h *AppHandler) UpdateTopping(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database is not connected"})
		return
	}

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid topping ID"})
		return
	}

	var topping model.Topping
	if err := h.DB.DB.First(&topping, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Topping not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	var req model.UpdateToppingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload: " + err.Error()})
		return
	}

	updates := make(map[string]interface{})
	if req.NameTh != nil {
		updates["name_th"] = *req.NameTh
	}
	if req.NameEn != nil {
		updates["name_en"] = *req.NameEn
	}
	if req.Price != nil {
		updates["price"] = *req.Price
	}
	if req.AllowHot != nil {
		updates["allow_hot"] = *req.AllowHot
	}
	if req.AllowIced != nil {
		updates["allow_iced"] = *req.AllowIced
	}
	if req.ImageURL != nil {
		updates["image_url"] = req.ImageURL
	}
	if req.IsAvailable != nil {
		updates["is_available"] = *req.IsAvailable
	}
	if req.IsSoldOut != nil {
		updates["is_sold_out"] = *req.IsSoldOut
	}
	if req.SortOrder != nil {
		updates["sort_order"] = *req.SortOrder
	}

	if len(updates) > 0 {
		if err := h.DB.DB.Model(&topping).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update topping: " + err.Error()})
			return
		}
	}

	h.DB.DB.First(&topping, id)
	c.JSON(http.StatusOK, topping)
}

// DeleteTopping handles DELETE /api/v1/toppings/:id
func (h *AppHandler) DeleteTopping(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database is not connected"})
		return
	}

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid topping ID"})
		return
	}

	var topping model.Topping
	if err := h.DB.DB.First(&topping, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Topping not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if err := h.DB.DB.Delete(&topping).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete topping: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Topping deleted successfully", "id": id})
}

// ReorderToppings handles PUT /api/v1/toppings/reorder
func (h *AppHandler) ReorderToppings(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database is not connected"})
		return
	}

	var req model.ReorderToppingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	tx := h.DB.DB.Begin()
	for _, item := range req.Items {
		if err := tx.Model(&model.Topping{}).Where("id = ?", item.ID).Update("sort_order", item.SortOrder).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update topping order: " + err.Error()})
			return
		}
	}
	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"message": "Toppings reordered successfully", "count": len(req.Items)})
}

// ==========================================
// FILE UPLOAD HANDLER
// ==========================================

// Helper to safely delete file from ./uploads directory
func deleteUploadFile(fileURL string) {
	if !strings.HasPrefix(fileURL, "/uploads/") {
		return
	}
	cleanRelPath := filepath.Clean(strings.TrimPrefix(fileURL, "/uploads/"))
	if strings.Contains(cleanRelPath, "..") || cleanRelPath == "." || cleanRelPath == "/" {
		return
	}
	targetPath := filepath.Join("./uploads", cleanRelPath)
	if _, err := os.Stat(targetPath); err == nil {
		_ = os.Remove(targetPath)
	}
}

// UploadImage handles POST /api/v1/upload
func (h *AppHandler) UploadImage(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded: " + err.Error()})
		return
	}

	// Validate file size (max 5MB)
	if file.Size > 5*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ขนาดไฟล์เกินขีดจำกัด (สูงสุด 5MB)"})
		return
	}

	// Validate extension
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" && ext != ".gif" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รองรับเฉพาะไฟล์รูปภาพ .jpg, .jpeg, .png, .webp, .gif เท่านั้น"})
		return
	}

	// Determine subfolder (e.g. "menu", "toppings", or default "")
	folder := c.DefaultPostForm("folder", c.Query("folder"))
	cleanFolder := ""
	if folder != "" {
		folder = filepath.Clean(folder)
		if !strings.Contains(folder, "..") && folder != "." && folder != "/" {
			cleanFolder = folder
		}
	}

	uploadDir := "./uploads"
	if cleanFolder != "" {
		uploadDir = filepath.Join("./uploads", cleanFolder)
	}

	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	filename := fmt.Sprintf("%d-%s%s", time.Now().UnixNano(), uuid.New().String()[:8], ext)
	dst := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file: " + err.Error()})
		return
	}

	fileURL := fmt.Sprintf("/uploads/%s", filename)
	if cleanFolder != "" {
		fileURL = fmt.Sprintf("/uploads/%s/%s", cleanFolder, filename)
	}

	c.JSON(http.StatusOK, gin.H{
		"url":       fileURL,
		"filename":  filename,
		"size":      file.Size,
		"timestamp": time.Now().Unix(),
	})
}

// DeleteUpload handles DELETE /api/v1/upload
func (h *AppHandler) DeleteUpload(c *gin.Context) {
	var req struct {
		URL string `json:"url" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload: url is required"})
		return
	}

	deleteUploadFile(req.URL)
	c.JSON(http.StatusOK, gin.H{"message": "File deleted successfully", "url": req.URL})
}


