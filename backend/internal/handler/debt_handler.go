package handler

import (
	"net/http"
	"strconv"
	"time"

	"kaset-fair-backend/internal/model"

	"github.com/gin-gonic/gin"
)

type UpdateDebtStatusRequest struct {
	IsPaid        bool  `json:"is_paid"`
	PaidByStaffID *uint `json:"paid_by_staff_id"`
}

type StaffDebtSummary struct {
	StaffID      uint    `json:"staff_id"`
	StaffName    string  `json:"staff_name"`
	UnpaidAmount float64 `json:"unpaid_amount"`
	UnpaidCount  int64   `json:"unpaid_count"`
	PaidAmount   float64 `json:"paid_amount"`
}

// GetDebts handles GET /api/v1/debts
func (h *AppHandler) GetDebts(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not available"})
		return
	}

	isPaidStr := c.Query("is_paid") // "true", "false", or empty
	staffIDStr := c.Query("staff_id")

	query := h.DB.DB.Model(&model.Debt{}).Preload("Staff").Preload("PaidByStaff").Preload("CashTransaction")

	if isPaidStr == "true" {
		query = query.Where("is_paid = ?", true)
	} else if isPaidStr == "false" {
		query = query.Where("is_paid = ?", false)
	}

	if staffIDStr != "" {
		if sID, err := strconv.ParseUint(staffIDStr, 10, 32); err == nil {
			query = query.Where("staff_id = ?", uint(sID))
		}
	}

	var debts []model.Debt
	if err := query.Order("created_at DESC").Find(&debts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch debts: " + err.Error()})
		return
	}

	// Calculate overall totals
	var totalUnpaid float64
	var totalPaid float64
	h.DB.DB.Model(&model.Debt{}).Where("is_paid = ?", false).Select("COALESCE(SUM(amount), 0)").Scan(&totalUnpaid)
	h.DB.DB.Model(&model.Debt{}).Where("is_paid = ?", true).Select("COALESCE(SUM(amount), 0)").Scan(&totalPaid)

	// Summary by Staff
	var summaries []StaffDebtSummary
	rows, err := h.DB.DB.Raw(`
		SELECT 
			d.staff_id, 
			COALESCE(s.name, 'ไม่ระบุ') as staff_name,
			COALESCE(SUM(CASE WHEN d.is_paid = false THEN d.amount ELSE 0 END), 0) as unpaid_amount,
			COUNT(CASE WHEN d.is_paid = false THEN 1 END) as unpaid_count,
			COALESCE(SUM(CASE WHEN d.is_paid = true THEN d.amount ELSE 0 END), 0) as paid_amount
		FROM debt d
		LEFT JOIN staff s ON s.id = d.staff_id
		GROUP BY d.staff_id, s.name
		ORDER BY unpaid_amount DESC, s.name ASC
	`).Rows()

	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var s StaffDebtSummary
			if err := rows.Scan(&s.StaffID, &s.StaffName, &s.UnpaidAmount, &s.UnpaidCount, &s.PaidAmount); err == nil {
				summaries = append(summaries, s)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data":                debts,
		"total_unpaid_amount": totalUnpaid,
		"total_paid_amount":   totalPaid,
		"staff_summaries":     summaries,
	})
}

// ToggleDebtPaidStatus handles PUT/PATCH /api/v1/debts/:id/pay
func (h *AppHandler) ToggleDebtPaidStatus(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not available"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid debt ID"})
		return
	}

	var debt model.Debt
	if err := h.DB.DB.First(&debt, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Debt record not found"})
		return
	}

	var req UpdateDebtStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// If no body provided, toggle current status
		debt.IsPaid = !debt.IsPaid
	} else {
		debt.IsPaid = req.IsPaid
	}

	if debt.IsPaid {
		now := time.Now()
		debt.PaidAt = &now
		if req.PaidByStaffID != nil && *req.PaidByStaffID > 0 {
			debt.PaidByStaffID = req.PaidByStaffID
		} else if currentAdmin, exists := c.Get("current_admin"); exists {
			if adminObj, ok := currentAdmin.(*model.Staff); ok {
				debt.PaidByStaffID = &adminObj.ID
			}
		}
	} else {
		debt.PaidAt = nil
		debt.PaidByStaffID = nil
	}

	if err := h.DB.DB.Save(&debt).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update debt status: " + err.Error()})
		return
	}

	// Preload staff for response
	h.DB.DB.Preload("Staff").Preload("PaidByStaff").Preload("CashTransaction").First(&debt, debt.ID)

	c.JSON(http.StatusOK, gin.H{
		"message": "Debt payment status updated successfully",
		"data":    debt,
	})
}
