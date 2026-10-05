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
	Type          string  `json:"type" binding:"required"` // "income" or "expense"
	Title         string  `json:"title" binding:"required"`
	Category      string  `json:"category" binding:"required"`
	Amount        float64 `json:"amount" binding:"required"`
	DateTime      string  `json:"date_time"` // ISO or YYYY-MM-DD HH:mm
	Note          string  `json:"note"`
	PaidByStaffID *uint   `json:"paid_by_staff_id"` // Staff ID who paid advance
	IsPaid        *bool   `json:"is_paid"`          // Reimbursed or not
}

type UpdateCashTransactionRequest struct {
	Type          string  `json:"type"`
	Title         string  `json:"title"`
	Category      string  `json:"category"`
	Amount        float64 `json:"amount"`
	DateTime      string  `json:"date_time"`
	Note          string  `json:"note"`
	PaidByStaffID *uint   `json:"paid_by_staff_id"`
	IsPaid        *bool   `json:"is_paid"`
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

	query := h.DB.DB.Model(&model.CashTransaction{}).Preload("Debt.Staff").Preload("Debt.PaidByStaff")

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

	// Calculate total unpaid debt owed to staff
	var totalUnpaidDebt float64
	h.DB.DB.Model(&model.Debt{}).Where("is_paid = ?", false).Select("COALESCE(SUM(amount), 0)").Scan(&totalUnpaidDebt)

	c.JSON(http.StatusOK, gin.H{
		"data":              transactions,
		"page":              page,
		"page_size":         pageSize,
		"total":             total,
		"total_pages":       (total + int64(pageSize) - 1) / int64(pageSize),
		"total_income":      totalIncome,
		"total_expense":     totalExpense,
		"net_balance":       totalIncome - totalExpense,
		"total_unpaid_debt": totalUnpaidDebt,
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

	// Handle Debt table linking if type is expense & paid_by_staff_id is provided
	if txType == "expense" && req.PaidByStaffID != nil && *req.PaidByStaffID > 0 {
		isPaid := false
		var paidAt *time.Time
		if req.IsPaid != nil && *req.IsPaid {
			isPaid = true
			now := time.Now()
			paidAt = &now
		}

		debt := model.Debt{
			CashTransactionID: &tx.ID,
			StaffID:           *req.PaidByStaffID,
			Amount:            tx.Amount,
			IsPaid:            isPaid,
			PaidAt:            paidAt,
			Note:              req.Note,
		}
		_ = h.DB.DB.Create(&debt).Error
	}

	// Reload with Debt & Staff info
	h.DB.DB.Preload("Debt.Staff").Preload("Debt.PaidByStaff").First(&tx, tx.ID)

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

	// Update or Delete linked Debt
	if tx.Type == "expense" && req.PaidByStaffID != nil && *req.PaidByStaffID > 0 {
		var existingDebt model.Debt
		err := h.DB.DB.Where("cash_transaction_id = ?", tx.ID).First(&existingDebt).Error
		if err == nil {
			// Update existing
			existingDebt.StaffID = *req.PaidByStaffID
			existingDebt.Amount = tx.Amount
			existingDebt.Note = tx.Note
			if req.IsPaid != nil {
				existingDebt.IsPaid = *req.IsPaid
				if *req.IsPaid {
					now := time.Now()
					existingDebt.PaidAt = &now
				} else {
					existingDebt.PaidAt = nil
				}
			}
			_ = h.DB.DB.Save(&existingDebt).Error
		} else {
			// Create new
			isPaid := false
			var paidAt *time.Time
			if req.IsPaid != nil && *req.IsPaid {
				isPaid = true
				now := time.Now()
				paidAt = &now
			}
			newDebt := model.Debt{
				CashTransactionID: &tx.ID,
				StaffID:           *req.PaidByStaffID,
				Amount:            tx.Amount,
				IsPaid:            isPaid,
				PaidAt:            paidAt,
				Note:              tx.Note,
			}
			_ = h.DB.DB.Create(&newDebt).Error
		}
	} else if req.PaidByStaffID != nil && *req.PaidByStaffID == 0 {
		// User un-selected staff debt
		_ = h.DB.DB.Where("cash_transaction_id = ?", tx.ID).Delete(&model.Debt{}).Error
	}

	// Reload with Debt & Staff info
	h.DB.DB.Preload("Debt.Staff").Preload("Debt.PaidByStaff").First(&tx, tx.ID)

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

	// Delete linked debt first
	_ = h.DB.DB.Where("cash_transaction_id = ?", uint(id)).Delete(&model.Debt{}).Error

	if err := h.DB.DB.Delete(&model.CashTransaction{}, uint(id)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete transaction: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Transaction deleted successfully",
		"id":      id,
	})
}
