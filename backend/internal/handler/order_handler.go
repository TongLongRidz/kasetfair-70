package handler

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"kaset-fair-backend/internal/model"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Helper to generate prefix based on channel method
func getMethodPrefix(method string) string {
	switch method {
	case "online":
		return "B"
	case "nisit-shop":
		return "C"
	default:
		return "A" // walk-in
	}
}

// Generate unique queue_no for today
func generateQueueNo(db *gorm.DB, method string) (string, error) {
	prefix := getMethodPrefix(method)

	// Count orders created today with this method
	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	var count int64
	if err := db.Model(&model.Order{}).
		Where("method = ? AND created_at >= ?", method, startOfDay).
		Count(&count).Error; err != nil {
		return "", err
	}

	seq := count + 1
	queueNo := fmt.Sprintf("%s%03d", prefix, seq)

	return queueNo, nil
}

// ==========================================
// ORDER HANDLERS
// ==========================================

// GetOrders handles GET /api/v1/orders
// Supports filters: ?status=new_order,preparing &method=walk-in &payment_method=promptpay &date=2026-09-14
func (h *AppHandler) GetOrders(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not initialized"})
		return
	}

	query := h.DB.DB.Model(&model.Order{}).
		Preload("OrderItems.Product.ComboRecipes.Topping").
		Preload("OrderItems.Product.ComboRecipes.BaseProduct").
		Preload("OrderItems.Product").
		Preload("OrderItems.OrderItemToppings.Topping").
		Preload("SlipAdmin")

	// Filter: status (comma separated e.g. status=new_order,preparing,ready)
	if statusParam := c.Query("status"); statusParam != "" {
		statuses := strings.Split(statusParam, ",")
		query = query.Where("order_status IN ?", statuses)
	}

	// Filter: method
	if method := c.Query("method"); method != "" {
		query = query.Where("method = ?", method)
	}

	// Filter: payment_method
	if pm := c.Query("payment_method"); pm != "" {
		query = query.Where("payment_method = ?", pm)
	}

	// Filter: date (YYYY-MM-DD)
	if dateStr := c.Query("date"); dateStr != "" {
		if t, err := time.Parse("2006-01-02", dateStr); err == nil {
			start := time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, t.Location())
			end := start.Add(24 * time.Hour)
			query = query.Where("created_at >= ? AND created_at < ?", start, end)
		}
	}

	// Filter: search by queue_no or uuid
	if search := c.Query("search"); search != "" {
		searchTerm := "%" + strings.TrimSpace(search) + "%"
		query = query.Where("queue_no ILIKE ? OR uuid ILIKE ?", searchTerm, searchTerm)
	}

	// Sort order: default newest first
	sortBy := c.DefaultQuery("sort", "created_at_desc")
	switch sortBy {
	case "created_at_asc":
		query = query.Order("created_at ASC")
	case "id_desc":
		query = query.Order("id DESC")
	default:
		query = query.Order("created_at DESC")
	}

	var orders []model.Order
	if err := query.Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    orders,
		"total":   len(orders),
	})
}

// GetKitchenStats handles GET /api/v1/orders/stats/kitchen
// Returns completed orders count and completed cups count for today vs all-time
func (h *AppHandler) GetKitchenStats(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not initialized"})
		return
	}

	dateParam := c.Query("date") // "today", "all", or "YYYY-MM-DD"

	query := h.DB.DB.Model(&model.Order{}).
		Where("order_status IN ?", []string{"ready", "completed"})

	if dateParam == "today" || dateParam == "วันนี้" {
		now := time.Now()
		startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		query = query.Where("created_at >= ?", startOfDay)
	} else if dateParam != "" && dateParam != "all" && dateParam != "ทั้งงาน" {
		if t, err := time.Parse("2006-01-02", dateParam); err == nil {
			start := time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, t.Location())
			end := start.Add(24 * time.Hour)
			query = query.Where("created_at >= ? AND created_at < ?", start, end)
		}
	}

	var completedOrders []model.Order
	if err := query.Preload("OrderItems").Find(&completedOrders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate stats", "details": err.Error()})
		return
	}

	completedOrdersCount := len(completedOrders)
	completedCupsCount := 0
	for _, o := range completedOrders {
		for _, item := range o.OrderItems {
			completedCupsCount += item.Quantity
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success":                true,
		"completed_orders_count": completedOrdersCount,
		"completed_cups_count":   completedCupsCount,
	})
}

// GetOrderByID handles GET /api/v1/orders/:id (supports both ID number, uuid, and queue_no string)
func (h *AppHandler) GetOrderByID(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not initialized"})
		return
	}

	idParam := c.Param("id")
	var order model.Order

	query := h.DB.DB.
		Preload("OrderItems.Product.ComboRecipes.Topping").
		Preload("OrderItems.Product.ComboRecipes.BaseProduct").
		Preload("OrderItems.Product").
		Preload("OrderItems.OrderItemToppings.Topping").
		Preload("SlipAdmin")

	if idNum, err := strconv.Atoi(idParam); err == nil {
		if err := query.First(&order, idNum).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error", "details": err.Error()})
			return
		}
	} else {
		// Lookup by uuid or queue_no
		if err := query.Where("uuid = ? OR queue_no = ?", idParam, idParam).First(&order).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error", "details": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    order,
	})
}

// CreateOrder handles POST /api/v1/orders (Public & POS Walk-in / Online)
func (h *AppHandler) CreateOrder(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not initialized"})
		return
	}

	var req model.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	if len(req.Items) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Order must contain at least 1 item"})
		return
	}

	// Generate queue_no
	queueNo, err := generateQueueNo(h.DB.DB, req.Method)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate order queue number", "details": err.Error()})
		return
	}

	newOrder := model.Order{
		UUID:                uuid.New().String(),
		QueueNo:             queueNo,
		Method:              req.Method,
		EstimatedPickupTime: req.EstimatedPickupTime,
		TotalAmount:         req.TotalAmount,
		PaymentMethod:       req.PaymentMethod,
		ReceivedAmount:      req.ReceivedAmount,
		SlipURL:             req.SlipURL,
		OrderStatus:         "new_order",
		Note:                req.Note,
	}

	// Begin Transaction to save order, order items, and toppings
	tx := h.DB.DB.Begin()
	if err := tx.Create(&newOrder).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order", "details": err.Error()})
		return
	}

	for _, it := range req.Items {
		orderItem := model.OrderItem{
			OrderID:        newOrder.ID,
			ProductID:      it.ProductID,
			Temperature:    it.Temperature,
			SweetnessLevel: it.SweetnessLevel,
			UnitPrice:      it.UnitPrice,
			Quantity:       it.Quantity,
			Note:           it.Note,
		}

		if err := tx.Create(&orderItem).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order item", "details": err.Error()})
			return
		}

		for _, top := range it.Toppings {
			itemTopping := model.OrderItemTopping{
				OrderItemID:       orderItem.ID,
				ToppingID:         top.ToppingID,
				ToppingPrice:      top.ToppingPrice,
				IsIncludedInCombo: top.IsIncludedInCombo,
			}
			if err := tx.Create(&itemTopping).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create item topping", "details": err.Error()})
				return
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit order transaction", "details": err.Error()})
		return
	}

	// Reload complete order with relations
	var createdOrder model.Order
	h.DB.DB.
		Preload("OrderItems.Product.ComboRecipes.Topping").
		Preload("OrderItems.Product.ComboRecipes.BaseProduct").
		Preload("OrderItems.Product").
		Preload("OrderItems.OrderItemToppings.Topping").
		First(&createdOrder, newOrder.ID)

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Order created successfully",
		"data":    createdOrder,
	})
}

// UpdateOrderStatus handles PATCH /api/v1/orders/:id/status
func (h *AppHandler) UpdateOrderStatus(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not initialized"})
		return
	}

	idParam := c.Param("id")

	var req model.UpdateOrderStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status payload", "details": err.Error()})
		return
	}

	var order model.Order
	if idNum, err := strconv.Atoi(idParam); err == nil {
		if err := h.DB.DB.First(&order, idNum).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error", "details": err.Error()})
			return
		}
	} else {
		// Lookup by uuid or queue_no
		if err := h.DB.DB.Where("uuid = ? OR queue_no = ?", idParam, idParam).First(&order).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error", "details": err.Error()})
			return
		}
	}

	order.OrderStatus = req.OrderStatus
	if err := h.DB.DB.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order status", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Order status updated successfully",
		"data":    order,
	})
}

// VerifyOrderSlip handles POST /api/v1/orders/:id/verify-slip
func (h *AppHandler) VerifyOrderSlip(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not initialized"})
		return
	}

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var req model.VerifyOrderSlipRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid verification payload", "details": err.Error()})
		return
	}

	var order model.Order
	if err := h.DB.DB.First(&order, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error", "details": err.Error()})
		return
	}

	// Retrieve admin from context (set by AuthMiddleware)
	adminVal, exists := c.Get("admin")
	var adminID *uint
	if exists {
		if currentAdmin, ok := adminVal.(*model.Admin); ok && currentAdmin != nil {
			adminID = &currentAdmin.ID
		}
	}

	now := time.Now()
	// Determine status: from req.Status or req.IsVerified
	status := "pending"
	if req.Status != nil && *req.Status != "" {
		switch *req.Status {
		case "verified", "fraud", "pending":
			status = *req.Status
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid verification status. Must be 'verified', 'pending', or 'fraud'"})
			return
		}
	} else if req.IsVerified != nil {
		if *req.IsVerified {
			status = "verified"
		} else {
			status = "pending"
		}
	}

	order.SlipVerificationStatus = status

	if status == "verified" || status == "fraud" {
		order.SlipVerifiedBy = adminID
		order.SlipVerifiedAt = &now
	} else {
		// pending: reset verifier
		order.SlipVerifiedBy = nil
		order.SlipVerifiedAt = nil
	}

	if req.CheckNote != nil {
		order.CheckNote = req.CheckNote
	}
	if req.Note != nil {
		order.Note = req.Note
		if req.CheckNote == nil {
			order.CheckNote = req.Note
		}
	}

	if err := h.DB.DB.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update slip verification", "details": err.Error()})
		return
	}

	// Reload with SlipAdmin
	h.DB.DB.Preload("SlipAdmin").First(&order, id)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Order slip verification updated",
		"data":    order,
	})
}

// UpdateOrder handles PUT /api/v1/orders/:id
func (h *AppHandler) UpdateOrder(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not initialized"})
		return
	}

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var req model.UpdateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	var order model.Order
	if err := h.DB.DB.First(&order, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error", "details": err.Error()})
		return
	}

	if req.EstimatedPickupTime != nil {
		order.EstimatedPickupTime = req.EstimatedPickupTime
	}
	if req.TotalAmount != nil {
		order.TotalAmount = *req.TotalAmount
	}
	if req.PaymentMethod != nil {
		order.PaymentMethod = *req.PaymentMethod
	}
	if req.ReceivedAmount != nil {
		order.ReceivedAmount = req.ReceivedAmount
	}
	if req.SlipURL != nil {
		order.SlipURL = req.SlipURL
	}
	if req.OrderStatus != nil {
		order.OrderStatus = *req.OrderStatus
	}
	if req.Note != nil {
		order.Note = req.Note
	}

	if err := h.DB.DB.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Order updated successfully",
		"data":    order,
	})
}

// DeleteOrder handles DELETE /api/v1/orders/:id
func (h *AppHandler) DeleteOrder(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not initialized"})
		return
	}

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var order model.Order
	if err := h.DB.DB.First(&order, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error", "details": err.Error()})
		return
	}

	// Delete cascades order_items and toppings
	if err := h.DB.DB.Delete(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete order", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Order deleted successfully",
	})
}
