package handler

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"kaset-fair-backend/internal/model"

	"github.com/gin-gonic/gin"
)

type CreateCashTransactionRequest struct {
	Type     string  `json:"type" binding:"required"` // "income" or "expense"
	Title    string  `json:"title" binding:"required"`
	Category string  `json:"category" binding:"required"`
	Amount   float64 `json:"amount" binding:"required"`
	DateTime string  `json:"date_time"` // ISO or YYYY-MM-DD HH:mm
	Note     string  `json:"note"`
}

type UpdateCashTransactionRequest struct {
	Type     string  `json:"type"`
	Title    string  `json:"title"`
	Category string  `json:"category"`
	Amount   float64 `json:"amount"`
	DateTime string  `json:"date_time"`
	Note     string  `json:"note"`
}

// GetCashTransactions handles GET /api/v1/cash-transactions with pagination & filtering
func (h *AppHandler) GetCashTransactions(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not available"})
		return
	}

	pageStr := c.DefaultQuery("page", "1")
	pageSizeStr := c.DefaultQuery("page_size", "10")
	typeFilter := c.Query("type") // "income", "expense", "all"
	search := strings.TrimSpace(c.Query("search"))
	sort := c.DefaultQuery("sort", "date_desc")

	page, _ := strconv.Atoi(pageStr)
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(pageSizeStr)
	if pageSize < 1 {
		pageSize = 10
	}

	query := h.DB.DB.Model(&model.CashTransaction{})

	if typeFilter != "" && typeFilter != "all" {
		query = query.Where("type = ?", typeFilter)
	}

	if search != "" {
		searchPattern := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(title) LIKE ? OR LOWER(category) LIKE ? OR LOWER(note) LIKE ?", searchPattern, searchPattern, searchPattern)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count transactions: " + err.Error()})
		return
	}

	orderClause := "date_time DESC, id DESC"
	if sort == "date_asc" {
		orderClause = "date_time ASC, id ASC"
	}

	var transactions []model.CashTransaction
	offset := (page - 1) * pageSize
	if err := query.Order(orderClause).Limit(pageSize).Offset(offset).Find(&transactions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transactions: " + err.Error()})
		return
	}

	// Calculate overall totals
	var totalIncome float64
	var totalExpense float64
	h.DB.DB.Model(&model.CashTransaction{}).Where("type = ?", "income").Select("COALESCE(SUM(amount), 0)").Scan(&totalIncome)
	h.DB.DB.Model(&model.CashTransaction{}).Where("type = ?", "expense").Select("COALESCE(SUM(amount), 0)").Scan(&totalExpense)

	c.JSON(http.StatusOK, gin.H{
		"data":          transactions,
		"page":          page,
		"page_size":     pageSize,
		"total":         total,
		"total_pages":   (total + int64(pageSize) - 1) / int64(pageSize),
		"total_income":  totalIncome,
		"total_expense": totalExpense,
		"net_balance":   totalIncome - totalExpense,
	})
}

// CreateCashTransaction handles POST /api/v1/cash-transactions
func (h *AppHandler) CreateCashTransaction(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not available"})
		return
	}

	var req CreateCashTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	txType := strings.ToLower(req.Type)
	if txType != "income" && txType != "expense" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Type must be income or expense"})
		return
	}

	txTime := time.Now()
	if req.DateTime != "" {
		if parsed, err := time.Parse(time.RFC3339, req.DateTime); err == nil {
			txTime = parsed
		} else if parsed, err := time.Parse("2006-01-02 15:04", req.DateTime); err == nil {
			txTime = parsed
		} else if parsed, err := time.Parse("2006-01-02T15:04", req.DateTime); err == nil {
			txTime = parsed
		}
	}

	tx := model.CashTransaction{
		Type:      txType,
		Title:     req.Title,
		Category:  req.Category,
		Amount:    req.Amount,
		DateTime:  txTime,
		Note:      req.Note,
		CreatedAt: time.Now(),
	}

	if err := h.DB.DB.Create(&tx).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create transaction: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Transaction created successfully",
		"data":    tx,
	})
}

// UpdateCashTransaction handles PUT /api/v1/cash-transactions/:id
func (h *AppHandler) UpdateCashTransaction(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not available"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction ID"})
		return
	}

	var tx model.CashTransaction
	if err := h.DB.DB.First(&tx, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	var req UpdateCashTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	if req.Type != "" {
		tx.Type = strings.ToLower(req.Type)
	}
	if req.Title != "" {
		tx.Title = req.Title
	}
	if req.Category != "" {
		tx.Category = req.Category
	}
	if req.Amount > 0 {
		tx.Amount = req.Amount
	}
	if req.DateTime != "" {
		if parsed, err := time.Parse(time.RFC3339, req.DateTime); err == nil {
			tx.DateTime = parsed
		} else if parsed, err := time.Parse("2006-01-02 15:04", req.DateTime); err == nil {
			tx.DateTime = parsed
		} else if parsed, err := time.Parse("2006-01-02T15:04", req.DateTime); err == nil {
			tx.DateTime = parsed
		}
	}
	tx.Note = req.Note

	if err := h.DB.DB.Save(&tx).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update transaction: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Transaction updated successfully",
		"data":    tx,
	})
}

// DeleteCashTransaction handles DELETE /api/v1/cash-transactions/:id
func (h *AppHandler) DeleteCashTransaction(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not available"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction ID"})
		return
	}

	if err := h.DB.DB.Delete(&model.CashTransaction{}, uint(id)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete transaction: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Transaction deleted successfully",
		"id":      id,
	})
}
