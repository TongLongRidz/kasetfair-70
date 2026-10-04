package handler

import (
	"errors"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"time"

	"kaset-fair-backend/internal/database"
	"kaset-fair-backend/internal/middleware"
	"kaset-fair-backend/internal/model"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Login handles admin authentication with Redis rate-limit (5 attempts = 30s lockout)
func (h *AppHandler) Login(c *gin.Context) {
	var req model.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	username := req.Username

	// 1. Check if username is currently locked out in Redis
	if h.Redis != nil {
		isLocked, remainingSeconds, err := h.Redis.CheckLoginLock(c.Request.Context(), username)
		if err == nil && isLocked {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":             fmt.Sprintf("คุณกรอกรหัสผ่านผิดเกิน %d ครั้ง บัญชีถูกระงับชั่วคราว กรุณารออีก %d วินาที", database.MaxLoginAttempts, remainingSeconds),
				"is_locked":         true,
				"remaining_seconds": remainingSeconds,
			})
			return
		}
	}

	var admin model.Admin
	if err := h.DB.DB.Where("username = ?", username).First(&admin).Error; err != nil {
		// Record failed attempt
		h.handleFailedLogin(c, username)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(admin.PasswordHash), []byte(req.Password)); err != nil {
		// Record failed attempt
		h.handleFailedLogin(c, username)
		return
	}

	if !admin.IsActivate {
		c.JSON(http.StatusForbidden, gin.H{"error": "บัญชีนี้ยังไม่ได้รับการเปิดใช้งาน (Inactive) กรุณาติดต่อ Superadmin"})
		return
	}

	// Successful login: Reset failed attempts in Redis
	if h.Redis != nil {
		_ = h.Redis.ResetLoginAttempts(c.Request.Context(), username)
	}

	token, err := middleware.GenerateToken(&admin, h.Cfg.JWTSecret, 24*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Set HttpOnly cookie for security (XSS prevention)
	c.SetCookie("admin_token", token, 86400, "/", "", false, true)

	c.JSON(http.StatusOK, model.LoginResponse{
		Token: token,
		Admin: admin.ToResponse(),
	})
}

func (h *AppHandler) handleFailedLogin(c *gin.Context, username string) {
	if h.Redis != nil {
		attempts, isLockedNow, remainingSeconds, err := h.Redis.RecordFailedLogin(c.Request.Context(), username)
		if err == nil {
			if isLockedNow {
				c.JSON(http.StatusTooManyRequests, gin.H{
					"error":             fmt.Sprintf("คุณกรอกรหัสผ่านผิดเกิน %d ครั้ง บัญชีถูกระงับชั่วคราว กรุณารออีก %d วินาที", database.MaxLoginAttempts, remainingSeconds),
					"is_locked":         true,
					"remaining_seconds": remainingSeconds,
				})
				return
			}
			remaining := database.MaxLoginAttempts - attempts
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":              fmt.Sprintf("ชื่อผู้ดูแลระบบหรือรหัสผ่านไม่ถูกต้อง (เหลือโอกาสอีก %d ครั้ง)", remaining),
				"remaining_attempts": remaining,
			})
			return
		}
	}

	c.JSON(http.StatusUnauthorized, gin.H{"error": "ชื่อผู้ดูแลระบบหรือรหัสผ่านไม่ถูกต้อง"})
}

// GetMe returns the currently authenticated admin's details
func (h *AppHandler) GetMe(c *gin.Context) {
	val, exists := c.Get("current_admin")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	admin := val.(*model.Admin)
	c.JSON(http.StatusOK, admin.ToResponse())
}

// Logout clears the HttpOnly admin_token cookie
func (h *AppHandler) Logout(c *gin.Context) {
	c.SetCookie("admin_token", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// GetAdmins returns a paginated list of admins
func (h *AppHandler) GetAdmins(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	search := c.Query("q")
	status := c.Query("status") // all, active, inactive, superadmin

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	query := h.DB.DB.Model(&model.Admin{})

	if search != "" {
		s := "%" + search + "%"
		query = query.Where("username ILIKE ? OR name ILIKE ? OR uuid ILIKE ?", s, s, s)
	}

	if status == "active" {
		query = query.Where("is_activate = ?", true)
	} else if status == "inactive" {
		query = query.Where("is_activate = ?", false)
	} else if status == "superadmin" {
		query = query.Where("is_superadmin = ?", true)
	}

	roleIDQuery := c.Query("role_id")
	if roleIDQuery != "" {
		rID, err := strconv.Atoi(roleIDQuery)
		if err == nil {
			query = query.Where("role_id = ?", rID)
		}
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count admins"})
		return
	}

	var currentAdminUUID string
	if val, exists := c.Get("current_admin"); exists {
		if curAdmin, ok := val.(*model.Admin); ok {
			currentAdminUUID = curAdmin.UUID
		}
	}

	orderClause := "is_superadmin DESC, created_at DESC, id DESC"
	if currentAdminUUID != "" {
		// Place current authenticated admin at the very top, followed by superadmins, then latest created_at
		orderClause = fmt.Sprintf("CASE WHEN uuid = '%s' THEN 0 ELSE 1 END ASC, is_superadmin DESC, created_at DESC, id DESC", currentAdminUUID)
	}

	var admins []model.Admin
	offset := (page - 1) * pageSize
	if err := query.Preload("Role").Order(orderClause).Limit(pageSize).Offset(offset).Find(&admins).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch admins"})
		return
	}

	items := make([]model.AdminResponse, len(admins))
	for i, a := range admins {
		items[i] = a.ToResponse()
	}

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	if totalPages == 0 {
		totalPages = 1
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        items,
		"total":       total,
		"page":        page,
		"page_size":   pageSize,
		"total_pages": totalPages,
	})
}

// GetRoles returns all system roles with permissions, supporting search, sorting, and pagination
func (h *AppHandler) GetRoles(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not available"})
		return
	}

	search := c.Query("q")
	sortField := c.DefaultQuery("sort", "id")
	sortOrder := c.DefaultQuery("order", "asc")
	pageStr := c.Query("page")
	pageSizeStr := c.Query("page_size")

	query := h.DB.DB.Model(&model.Role{})

	if search != "" {
		s := "%" + search + "%"
		query = query.Where("name ILIKE ? OR name_th ILIKE ? OR name_en ILIKE ? OR description ILIKE ?", s, s, s, s)
	}

	allowedSorts := map[string]string{
		"id":         "id",
		"name":       "name",
		"name_th":    "name_th",
		"created_at": "created_at",
	}
	dbSortField, ok := allowedSorts[sortField]
	if !ok {
		dbSortField = "id"
	}
	if sortOrder != "desc" {
		sortOrder = "asc"
	}

	query = query.Order(fmt.Sprintf("%s %s", dbSortField, sortOrder))

	if pageStr != "" && pageSizeStr != "" {
		page, _ := strconv.Atoi(pageStr)
		if page < 1 {
			page = 1
		}
		pageSize, _ := strconv.Atoi(pageSizeStr)
		if pageSize < 1 {
			pageSize = 10
		}

		var total int64
		if err := query.Count(&total).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count roles"})
			return
		}

		var roles []model.Role
		offset := (page - 1) * pageSize
		if err := query.Preload("Permissions").Limit(pageSize).Offset(offset).Find(&roles).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch roles"})
			return
		}

		totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
		if totalPages == 0 {
			totalPages = 1
		}

		c.JSON(http.StatusOK, gin.H{
			"data":        roles,
			"total":       total,
			"page":        page,
			"page_size":   pageSize,
			"total_pages": totalPages,
		})
		return
	}

	var roles []model.Role
	if err := query.Preload("Permissions").Find(&roles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch roles"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": roles})
}

// UpdateRolePermissions updates permission mappings for a specific role
func (h *AppHandler) UpdateRolePermissions(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not available"})
		return
	}

	roleIDStr := c.Param("id")
	roleID, err := strconv.Atoi(roleIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role ID"})
		return
	}

	var req struct {
		PermissionIDs []uint `json:"permission_ids"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	var role model.Role
	if err := h.DB.DB.First(&role, roleID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Role not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Begin transaction to replace permissions
	tx := h.DB.DB.Begin()

	// Clear existing mappings for this role
	if err := tx.Where("role_id = ?", role.ID).Delete(&model.PermissionRole{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear existing role permissions"})
		return
	}

	// Insert new mappings
	for _, permID := range req.PermissionIDs {
		mapping := model.PermissionRole{
			RoleId:       role.ID,
			PermissionId: permID,
		}
		if err := tx.Create(&mapping).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign permission"})
			return
		}
	}

	tx.Commit()

	// Return updated role with preloaded permissions
	_ = h.DB.DB.Preload("Permissions").First(&role, role.ID)
	c.JSON(http.StatusOK, gin.H{"message": "Role permissions updated successfully", "data": role})
}

// GetPermissions returns system permissions supporting search, sorting, and pagination
func (h *AppHandler) GetPermissions(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not available"})
		return
	}

	search := c.Query("q")
	sortField := c.DefaultQuery("sort", "id")
	sortOrder := c.DefaultQuery("order", "asc")
	pageStr := c.Query("page")
	pageSizeStr := c.Query("page_size")

	query := h.DB.DB.Model(&model.Permission{})

	if search != "" {
		s := "%" + search + "%"
		query = query.Where("name ILIKE ? OR name_th ILIKE ? OR description ILIKE ?", s, s, s)
	}

	allowedSorts := map[string]string{
		"id":         "id",
		"name":       "name",
		"name_th":    "name_th",
		"created_at": "created_at",
	}
	dbSortField, ok := allowedSorts[sortField]
	if !ok {
		dbSortField = "id"
	}
	if sortOrder != "desc" {
		sortOrder = "asc"
	}

	query = query.Order(fmt.Sprintf("%s %s", dbSortField, sortOrder))

	if pageStr != "" && pageSizeStr != "" {
		page, _ := strconv.Atoi(pageStr)
		if page < 1 {
			page = 1
		}
		pageSize, _ := strconv.Atoi(pageSizeStr)
		if pageSize < 1 {
			pageSize = 10
		}

		var total int64
		if err := query.Count(&total).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count permissions"})
			return
		}

		var permissions []model.Permission
		offset := (page - 1) * pageSize
		if err := query.Limit(pageSize).Offset(offset).Find(&permissions).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch permissions"})
			return
		}

		totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
		if totalPages == 0 {
			totalPages = 1
		}

		c.JSON(http.StatusOK, gin.H{
			"data":        permissions,
			"total":       total,
			"page":        page,
			"page_size":   pageSize,
			"total_pages": totalPages,
		})
		return
	}

	var permissions []model.Permission
	if err := query.Find(&permissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch permissions"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": permissions})
}

// GetAdminByUUID returns a single admin by UUID
func (h *AppHandler) GetAdminByUUID(c *gin.Context) {
	targetUUID := c.Param("uuid")

	var admin model.Admin
	if err := h.DB.DB.Where("uuid = ?", targetUUID).First(&admin).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Admin not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, admin.ToResponse())
}

// CreateAdmin creates a new admin (default is_activate = false)
func (h *AppHandler) CreateAdmin(c *gin.Context) {
	var req model.CreateAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	// Check if username already exists
	var count int64
	h.DB.DB.Model(&model.Admin{}).Where("username = ?", req.Username).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "ชื่อผู้ใช้นี้ถูกใช้งานแล้วในระบบ"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to encrypt password"})
		return
	}

	newAdmin := model.Admin{
		UUID:         uuid.New().String(),
		Username:     req.Username,
		PasswordHash: string(hashedPassword),
		Name:         req.Name,
		IsActivate:   false, // Default inactive
		IsSuperadmin: false, // Default false
		RoleID:       req.RoleID,
	}

	if err := h.DB.DB.Create(&newAdmin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create admin: " + err.Error()})
		return
	}

	_ = h.DB.DB.Preload("Role").First(&newAdmin, newAdmin.ID).Error

	c.JSON(http.StatusCreated, newAdmin.ToResponse())
}

// UpdateAdmin updates an admin by UUID
// - Superadmin can update name, password, is_activate, is_superadmin for anyone
// - Normal admin can only update their own name and password
func (h *AppHandler) UpdateAdmin(c *gin.Context) {
	targetUUID := c.Param("uuid")

	val, exists := c.Get("current_admin")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	currentAdmin := val.(*model.Admin)

	var targetAdmin model.Admin
	if err := h.DB.DB.Where("uuid = ?", targetUUID).First(&targetAdmin).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Admin not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Permission checks
	isSelf := currentAdmin.UUID == targetAdmin.UUID
	isSuper := currentAdmin.IsSuperadmin

	if !isSelf && !isSuper {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: You cannot modify other admin accounts"})
		return
	}

	var req model.UpdateAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid update payload"})
		return
	}

	// Update fields
	if req.Name != nil && *req.Name != "" {
		targetAdmin.Name = *req.Name
	}

	if req.RoleID != nil {
		targetAdmin.RoleID = req.RoleID
	}

	if req.Password != nil && *req.Password != "" {
		if len(*req.Password) < 6 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 6 characters"})
			return
		}
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to encrypt password"})
			return
		}
		targetAdmin.PasswordHash = string(hashedPassword)
	}

	// Only Superadmin can modify is_activate and is_superadmin
	if isSuper {
		if req.IsActivate != nil {
			// Superadmin cannot deactivate oneself if they are the only superadmin
			if targetAdmin.UUID == currentAdmin.UUID && !*req.IsActivate {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot deactivate your own superadmin account"})
				return
			}
			targetAdmin.IsActivate = *req.IsActivate
		}

		if req.IsSuperadmin != nil {
			// Prevent removing superadmin status from yourself if you are the only one
			if targetAdmin.UUID == currentAdmin.UUID && !*req.IsSuperadmin {
				var superCount int64
				h.DB.DB.Model(&model.Admin{}).Where("is_superadmin = ?", true).Count(&superCount)
				if superCount <= 1 {
					c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot remove superadmin privilege: at least one superadmin must remain"})
					return
				}
			}
			targetAdmin.IsSuperadmin = *req.IsSuperadmin
		}
	} else {
		// Non-superadmin cannot change is_activate or is_superadmin
		if req.IsActivate != nil || req.IsSuperadmin != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Only Superadmin can change account status or role"})
			return
		}
	}

	if err := h.DB.DB.Save(&targetAdmin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update admin"})
		return
	}

	c.JSON(http.StatusOK, targetAdmin.ToResponse())
}

// DeleteAdmin deletes an admin by UUID (Superadmin only)
func (h *AppHandler) DeleteAdmin(c *gin.Context) {
	targetUUID := c.Param("uuid")

	val, exists := c.Get("current_admin")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	currentAdmin := val.(*model.Admin)

	if !currentAdmin.IsSuperadmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Only Superadmin can delete accounts"})
		return
	}

	var targetAdmin model.Admin
	if err := h.DB.DB.Where("uuid = ?", targetUUID).First(&targetAdmin).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Admin not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if targetAdmin.UUID == currentAdmin.UUID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete your own logged-in account"})
		return
	}

	if err := h.DB.DB.Delete(&targetAdmin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete admin"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Admin deleted successfully", "uuid": targetUUID})
}

// GetDashboardStats returns real-time aggregated metrics and trend statistics calculated directly from Postgres DB
func (h *AppHandler) GetDashboardStats(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not available"})
		return
	}

	rangeParam := c.DefaultQuery("range", "today") // "today", "all"

	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	// Build Order Query based on range
	orderQuery := h.DB.DB.Model(&model.Order{}).Where("order_status NOT IN ?", []string{"cancelled"})
	if rangeParam == "today" || rangeParam == "วันนี้" {
		orderQuery = orderQuery.Where("created_at >= ?", startOfDay)
	}

	var orders []model.Order
	if err := orderQuery.Preload("OrderItems.Product").Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query dashboard orders: " + err.Error()})
		return
	}

	// Calculate Sales Revenue, Order Count, Cup Count
	var totalRevenue float64 = 0
	totalOrders := len(orders)
	totalCups := 0
	onlineCount := 0
	walkinCount := 0
	onlineRevenue := float64(0)
	walkinRevenue := float64(0)

	productCupsMap := make(map[string]int)
	productAmountMap := make(map[string]float64)

	for _, o := range orders {
		totalRevenue += float64(o.TotalAmount)
		if o.Method == "online" || o.Method == "nisit-shop" {
			onlineCount++
			onlineRevenue += float64(o.TotalAmount)
		} else {
			walkinCount++
			walkinRevenue += float64(o.TotalAmount)
		}

		for _, item := range o.OrderItems {
			totalCups += item.Quantity
			pName := "สินค้า"
			if item.Product.NameTh != "" {
				pName = item.Product.NameTh
			}
			productCupsMap[pName] += item.Quantity
			productAmountMap[pName] += float64(item.UnitPrice) * float64(item.Quantity)
		}
	}

	// Cash Transactions (Expenses and custom Income records)
	cashTxQuery := h.DB.DB.Model(&model.CashTransaction{})
	if rangeParam == "today" || rangeParam == "วันนี้" {
		cashTxQuery = cashTxQuery.Where("date_time >= ?", startOfDay)
	}

	var cashTxs []model.CashTransaction
	_ = cashTxQuery.Find(&cashTxs).Error

	var totalExpenses float64 = 0
	var additionalIncome float64 = 0
	for _, tx := range cashTxs {
		if tx.Type == "expense" {
			totalExpenses += tx.Amount
		} else if tx.Type == "income" {
			additionalIncome += tx.Amount
		}
	}

	grossIncome := totalRevenue + additionalIncome
	netProfit := grossIncome - totalExpenses

	// Count pending slip verification orders
	var pendingSlipCount int64 = 0
	var pendingSlipSum float64 = 0
	h.DB.DB.Model(&model.Order{}).
		Where("payment_method IN ? AND slip_verification_status = ? AND order_status NOT IN ?", []string{"promptpay", "promptpay_qr"}, "pending", []string{"cancelled"}).
		Count(&pendingSlipCount)

	h.DB.DB.Model(&model.Order{}).
		Where("payment_method IN ? AND slip_verification_status = ? AND order_status NOT IN ?", []string{"promptpay", "promptpay_qr"}, "pending", []string{"cancelled"}).
		Select("COALESCE(SUM(total_amount), 0)").Scan(&pendingSlipSum)

	// Top Selling Products Array
	type TopProductRes struct {
		Name   string  `json:"name"`
		Cups   int     `json:"cups"`
		Amount string  `json:"amount"`
		Pct    float64 `json:"pct"`
	}

	var topProductsRes []TopProductRes
	maxCups := 1
	for name, cups := range productCupsMap {
		if cups > maxCups {
			maxCups = cups
		}
		topProductsRes = append(topProductsRes, TopProductRes{
			Name:   name,
			Cups:   cups,
			Amount: fmt.Sprintf("฿%.0f", productAmountMap[name]),
		})
	}

	for i := range topProductsRes {
		topProductsRes[i].Pct = math.Round((float64(topProductsRes[i].Cups) / float64(maxCups)) * 100)
	}

	// Channels Ratio
	onlinePct := 0.0
	walkinPct := 0.0
	if grossIncome > 0 {
		onlinePct = math.Round((onlineRevenue / grossIncome) * 100)
		walkinPct = 100 - onlinePct
	} else if totalOrders > 0 {
		onlinePct = math.Round((float64(onlineCount) / float64(totalOrders)) * 100)
		walkinPct = 100 - onlinePct
	}

	// Dynamic 14-Day Trend Data Calculation from DB
	type TrendItem struct {
		Date string  `json:"d"`
		Rev  float64 `json:"rev"`
		Exp  float64 `json:"exp"`
	}

	thaiDays := []string{"อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."}
	thaiMonths := []string{"", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."}

	dailyRevMap := make(map[string]float64)
	dailyExpMap := make(map[string]float64)

	var allOrders []model.Order
	_ = h.DB.DB.Model(&model.Order{}).Where("order_status NOT IN ?", []string{"cancelled"}).Find(&allOrders).Error
	for _, o := range allOrders {
		dateStr := o.CreatedAt.Format("2006-01-02")
		dailyRevMap[dateStr] += float64(o.TotalAmount)
	}

	var allCashTxs []model.CashTransaction
	_ = h.DB.DB.Find(&allCashTxs).Error
	for _, tx := range allCashTxs {
		dateStr := tx.DateTime.Format("2006-01-02")
		if tx.Type == "expense" {
			dailyExpMap[dateStr] += tx.Amount
		} else if tx.Type == "income" {
			dailyRevMap[dateStr] += tx.Amount
		}
	}

	var trendList []TrendItem
	var maxBarVal float64 = 1000.0

	startDate := now.AddDate(0, 0, -13)
	for i := 0; i < 14; i++ {
		cur := startDate.AddDate(0, 0, i)
		dateKey := cur.Format("2006-01-02")
		rev := dailyRevMap[dateKey]
		exp := dailyExpMap[dateKey]

		if rev > maxBarVal {
			maxBarVal = rev
		}
		if exp > maxBarVal {
			maxBarVal = exp
		}

		dayLabel := fmt.Sprintf("%s %d %s", thaiDays[cur.Weekday()], cur.Day(), thaiMonths[cur.Month()])
		trendList = append(trendList, TrendItem{
			Date: dayLabel,
			Rev:  rev,
			Exp:  exp,
		})
	}

	// Dynamic Hourly Sales Calculation for Today / Specified Range
	type HourlySlot struct {
		Time    string  `json:"time"`
		Cups    int     `json:"cups"`
		Online  int     `json:"online"`
		Walkin  int     `json:"walkin"`
		Revenue float64 `json:"revenue"`
	}

	hourlySlotsMap := make(map[string]*HourlySlot)
	timeSlots := []string{"10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"}
	for _, ts := range timeSlots {
		hourlySlotsMap[ts] = &HourlySlot{Time: ts}
	}

	for _, o := range orders {
		hStr := fmt.Sprintf("%02d:00", o.CreatedAt.Hour())
		if slot, exists := hourlySlotsMap[hStr]; exists {
			slot.Revenue += float64(o.TotalAmount)
			isOnline := o.Method == "online" || o.Method == "nisit-shop"
			for _, item := range o.OrderItems {
				slot.Cups += item.Quantity
				if isOnline {
					slot.Online += item.Quantity
				} else {
					slot.Walkin += item.Quantity
				}
			}
		}
	}

	var hourlySlotsList []HourlySlot
	maxHourlyCups := 1
	peakSlotStr := "-"
	peakCupsVal := 0

	for _, ts := range timeSlots {
		slot := *hourlySlotsMap[ts]
		if slot.Cups > maxHourlyCups {
			maxHourlyCups = slot.Cups
		}
		if slot.Cups > 0 && slot.Cups >= peakCupsVal {
			peakCupsVal = slot.Cups
			peakSlotStr = fmt.Sprintf("%s (%d แก้ว)", ts, slot.Cups)
		}
		hourlySlotsList = append(hourlySlotsList, slot)
	}

	c.JSON(http.StatusOK, gin.H{
		"range": rangeParam,
		"kpis": gin.H{
			"total_revenue":  fmt.Sprintf("฿%.0f", grossIncome),
			"total_expenses": fmt.Sprintf("฿%.0f", totalExpenses),
			"net_profit":     fmt.Sprintf("฿%.0f", netProfit),
			"total_orders":   totalOrders,
			"total_cups":     totalCups,
			"pending_slips":  pendingSlipCount,
			"pending_amount": fmt.Sprintf("฿%.0f", pendingSlipSum),
		},
		"channels": gin.H{
			"total":  fmt.Sprintf("฿%.0f", grossIncome),
			"online": gin.H{"pct": onlinePct, "amount": fmt.Sprintf("฿%.0f", onlineRevenue)},
			"walkin": gin.H{"pct": walkinPct, "amount": fmt.Sprintf("฿%.0f", walkinRevenue)},
		},
		"top_products": topProductsRes,
		"trend":        trendList,
		"max_bar":      maxBarVal * 1.15,
		"today_hourly": gin.H{
			"dateLabel":  fmt.Sprintf("%sที่ %d %s", thaiDays[now.Weekday()], now.Day(), thaiMonths[now.Month()]),
			"shortLabel": fmt.Sprintf("%s %d %s", thaiDays[now.Weekday()], now.Day(), thaiMonths[now.Month()]),
			"totalCups":  totalCups,
			"totalRev":   fmt.Sprintf("฿%.0f", grossIncome),
			"peakSlot":   peakSlotStr,
			"maxCups":    maxHourlyCups,
			"slots":      hourlySlotsList,
		},
	})
}

