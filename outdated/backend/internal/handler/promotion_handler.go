package handler

import (
	"errors"
	"math"
	"net/http"
	"strconv"
	"time"

	"kaset-fair-backend/internal/model"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ==========================================
// PROMOTION HANDLERS
// ==========================================

// GetPromotions handles GET /api/v1/promotions (Public / Admin)
func (h *AppHandler) GetPromotions(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database is not connected"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	searchQuery := c.Query("q")
	status := c.Query("status") // "active", "inactive", or "all"
	sortBy := c.DefaultQuery("sort_by", "created_desc")

	query := h.DB.DB.Model(&model.Promotion{})

	if searchQuery != "" {
		likeQuery := "%" + searchQuery + "%"
		query = query.Where("name_th ILIKE ? OR name_en ILIKE ? OR desc_th ILIKE ? OR desc_en ILIKE ?", likeQuery, likeQuery, likeQuery, likeQuery)
	}

	if status == "active" {
		query = query.Where("is_active = ?", true)
	} else if status == "inactive" {
		query = query.Where("is_active = ?", false)
	}

	// Sorting
	switch sortBy {
	case "points_asc":
		query = query.Order("point_usage ASC, id DESC")
	case "points_desc":
		query = query.Order("point_usage DESC, id DESC")
	case "created_asc":
		query = query.Order("created_at ASC, id ASC")
	default: // "created_desc"
		query = query.Order("created_at DESC, id DESC")
	}

	var totalItems int64
	if err := query.Count(&totalItems).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count promotions", "details": err.Error()})
		return
	}

	offset := (page - 1) * pageSize
	var promotions []model.Promotion
	if err := query.Offset(offset).Limit(pageSize).Find(&promotions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch promotions", "details": err.Error()})
		return
	}

	// Count redemptions used_count for each promotion
	promoIDs := make([]uint, len(promotions))
	for i, p := range promotions {
		promoIDs[i] = p.ID
	}

	usedCounts := make(map[uint]int64)
	if len(promoIDs) > 0 {
		type RedemptionCount struct {
			PromotionID uint
			Count       int64
		}
		var counts []RedemptionCount
		h.DB.DB.Model(&model.PromotionRedemption{}).
			Select("promotion_id, count(*) as count").
			Where("promotion_id IN ?", promoIDs).
			Group("promotion_id").
			Scan(&counts)

		for _, rc := range counts {
			usedCounts[rc.PromotionID] = rc.Count
		}
	}

	results := make([]model.PromotionResponse, len(promotions))
	for i, p := range promotions {
		results[i] = model.PromotionResponse{
			ID:          p.ID,
			NameTh:      p.NameTh,
			NameEn:      p.NameEn,
			DescTh:      p.DescTh,
			DescEn:      p.DescEn,
			PointUsage:  p.PointUsage,
			AllLimit:    p.AllLimit,
			PersonLimit: p.PersonLimit,
			UsedCount:   usedCounts[p.ID],
			StartDate:   p.StartDate,
			EndDate:     p.EndDate,
			IsActive:    p.IsActive,
			CreatedAt:   p.CreatedAt,
			UpdatedAt:   p.UpdatedAt,
		}
	}

	totalPages := int(math.Ceil(float64(totalItems) / float64(pageSize)))
	if totalPages == 0 {
		totalPages = 1
	}

	c.JSON(http.StatusOK, gin.H{
		"data": results,
		"pagination": gin.H{
			"current_page": page,
			"page_size":    pageSize,
			"total_pages":  totalPages,
			"total_items":  totalItems,
		},
	})
}

// GetPromotionByID handles GET /api/v1/promotions/:id
func (h *AppHandler) GetPromotionByID(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database is not connected"})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid promotion ID"})
		return
	}

	var promo model.Promotion
	if err := h.DB.DB.First(&promo, uint(id)).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Promotion not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch promotion", "details": err.Error()})
		return
	}

	var usedCount int64
	h.DB.DB.Model(&model.PromotionRedemption{}).Where("promotion_id = ?", promo.ID).Count(&usedCount)

	resp := model.PromotionResponse{
		ID:          promo.ID,
		NameTh:      promo.NameTh,
		NameEn:      promo.NameEn,
		DescTh:      promo.DescTh,
		DescEn:      promo.DescEn,
		PointUsage:  promo.PointUsage,
		AllLimit:    promo.AllLimit,
		PersonLimit: promo.PersonLimit,
		UsedCount:   usedCount,
		StartDate:   promo.StartDate,
		EndDate:     promo.EndDate,
		IsActive:    promo.IsActive,
		CreatedAt:   promo.CreatedAt,
		UpdatedAt:   promo.UpdatedAt,
	}

	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// CreatePromotion handles POST /api/v1/promotions (Protected Admin)
func (h *AppHandler) CreatePromotion(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database is not connected"})
		return
	}

	var req model.CreatePromotionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	promo := model.Promotion{
		NameTh:      req.NameTh,
		NameEn:      req.NameEn,
		DescTh:      req.DescTh,
		DescEn:      req.DescEn,
		PointUsage:  req.PointUsage,
		AllLimit:    req.AllLimit,
		PersonLimit: req.PersonLimit,
		StartDate:   req.StartDate,
		EndDate:     req.EndDate,
		IsActive:    isActive,
	}

	if err := h.DB.DB.Create(&promo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create promotion", "details": err.Error()})
		return
	}

	resp := model.PromotionResponse{
		ID:          promo.ID,
		NameTh:      promo.NameTh,
		NameEn:      promo.NameEn,
		DescTh:      promo.DescTh,
		DescEn:      promo.DescEn,
		PointUsage:  promo.PointUsage,
		AllLimit:    promo.AllLimit,
		PersonLimit: promo.PersonLimit,
		UsedCount:   0,
		StartDate:   promo.StartDate,
		EndDate:     promo.EndDate,
		IsActive:    promo.IsActive,
		CreatedAt:   promo.CreatedAt,
		UpdatedAt:   promo.UpdatedAt,
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Promotion created successfully",
		"data":    resp,
	})
}

// UpdatePromotion handles PUT /api/v1/promotions/:id (Protected Admin)
func (h *AppHandler) UpdatePromotion(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database is not connected"})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid promotion ID"})
		return
	}

	var req model.UpdatePromotionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	var promo model.Promotion
	if err := h.DB.DB.First(&promo, uint(id)).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Promotion not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch promotion", "details": err.Error()})
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
	if req.PointUsage != nil {
		updates["point_usage"] = *req.PointUsage
	}
	if req.AllLimit != nil {
		updates["all_limit"] = req.AllLimit
	}
	if req.PersonLimit != nil {
		updates["person_limit"] = req.PersonLimit
	}
	if req.StartDate != nil {
		updates["start_date"] = req.StartDate
	}
	if req.EndDate != nil {
		updates["end_date"] = req.EndDate
	}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}
	updates["updated_at"] = time.Now()

	if len(updates) > 0 {
		if err := h.DB.DB.Model(&promo).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update promotion", "details": err.Error()})
			return
		}
	}

	// Fetch updated
	h.DB.DB.First(&promo, uint(id))

	var usedCount int64
	h.DB.DB.Model(&model.PromotionRedemption{}).Where("promotion_id = ?", promo.ID).Count(&usedCount)

	resp := model.PromotionResponse{
		ID:          promo.ID,
		NameTh:      promo.NameTh,
		NameEn:      promo.NameEn,
		DescTh:      promo.DescTh,
		DescEn:      promo.DescEn,
		PointUsage:  promo.PointUsage,
		AllLimit:    promo.AllLimit,
		PersonLimit: promo.PersonLimit,
		UsedCount:   usedCount,
		StartDate:   promo.StartDate,
		EndDate:     promo.EndDate,
		IsActive:    promo.IsActive,
		CreatedAt:   promo.CreatedAt,
		UpdatedAt:   promo.UpdatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Promotion updated successfully",
		"data":    resp,
	})
}

// DeletePromotion handles DELETE /api/v1/promotions/:id (Protected Admin)
func (h *AppHandler) DeletePromotion(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database is not connected"})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid promotion ID"})
		return
	}

	var promo model.Promotion
	if err := h.DB.DB.First(&promo, uint(id)).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Promotion not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch promotion", "details": err.Error()})
		return
	}

	if err := h.DB.DB.Delete(&promo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete promotion", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Promotion deleted successfully",
		"id":      id,
	})
}
