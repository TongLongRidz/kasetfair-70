package handler

import (
	"errors"
	"fmt"
	"log"
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

// Login handles staff authentication with Redis rate-limit (5 attempts = 30s lockout)
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

	var staff model.Staff
	if err := h.DB.DB.Preload("Role.Permissions").Where("username = ?", username).First(&staff).Error; err != nil {
		// Record failed attempt
		h.handleFailedLogin(c, username)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(staff.PasswordHash), []byte(req.Password)); err != nil {
		// Record failed attempt
		h.handleFailedLogin(c, username)
		return
	}

	if !staff.IsActivate {
		c.JSON(http.StatusForbidden, gin.H{"error": "บัญชีนี้ยังไม่ได้รับการเปิดใช้งาน (Inactive) กรุณาติดต่อ Superadmin"})
		return
	}

	// 2. Clear failed login attempts in Redis upon successful password check
	if h.Redis != nil {
		_ = h.Redis.ResetLoginAttempts(c.Request.Context(), username)
	}

	// 3. Create Redis Session
	sessionID := uuid.New().String()
	if h.Redis != nil {
		if err := h.Redis.CreateSession(c.Request.Context(), sessionID, staff.UUID, 24*time.Hour); err != nil {
			log.Printf("⚠️ Redis session creation warning: %v", err)
		}
	}

	token, err := middleware.GenerateToken(&staff, sessionID, h.Cfg.JWTSecret, 24*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Set HttpOnly cookie for security (XSS prevention)
	c.SetCookie("token", token, 86400, "/", "", false, true)

	c.JSON(http.StatusOK, model.LoginResponse{
		Token: token,
		Staff: staff.ToResponse(),
		Admin: staff.ToResponse(),
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
			remainingAttempts := database.MaxLoginAttempts - attempts
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":              fmt.Sprintf("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (เหลือโอกาสอีก %d ครั้ง)", remainingAttempts),
				"remaining_attempts": remainingAttempts,
			})
			return
		}
	}

	c.JSON(http.StatusUnauthorized, gin.H{"error": "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"})
}

// GetMe returns current authenticated staff info
func (h *AppHandler) GetMe(c *gin.Context) {
	val, exists := c.Get("current_admin")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	staff := val.(*model.Staff)
	c.JSON(http.StatusOK, staff.ToResponse())
}

// Logout revokes session from Redis and clears cookie
func (h *AppHandler) Logout(c *gin.Context) {
	if sessVal, exists := c.Get("session_id"); exists {
		if sessID, ok := sessVal.(string); ok && sessID != "" && h.Redis != nil {
			_ = h.Redis.DestroySession(c.Request.Context(), sessID)
		}
	}

	c.SetCookie("token", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// GetStaffs returns a paginated list of staff members
func (h *AppHandler) GetStaffs(c *gin.Context) {
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

	query := h.DB.DB.Model(&model.Staff{})

	if search != "" {
		s := "%" + search + "%"
		query = query.Where("username ILIKE ? OR name ILIKE ? OR uuid ILIKE ?", s, s, s)
	}

	if status == "active" {
		query = query.Where("is_activate = ?", true)
	} else if status == "inactive" {
		query = query.Where("is_activate = ?", false)
	} else if status == "superadmin" {
		query = query.Joins("Role").Where("Role.key = ?", "super_admin")
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count staff"})
		return
	}

	var currentStaffUUID string
	if val, exists := c.Get("current_admin"); exists {
		if curStaff, ok := val.(*model.Staff); ok {
			currentStaffUUID = curStaff.UUID
		}
	}

	orderClause := "created_at DESC, id DESC"
	if currentStaffUUID != "" {
		orderClause = fmt.Sprintf("CASE WHEN uuid = '%s' THEN 0 ELSE 1 END ASC, created_at DESC, id DESC", currentStaffUUID)
	}

	var staffList []model.Staff
	offset := (page - 1) * pageSize
	if err := query.Preload("Role").Order(orderClause).Limit(pageSize).Offset(offset).Find(&staffList).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch staff list"})
		return
	}

	items := make([]model.StaffResponse, len(staffList))
	for i, a := range staffList {
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

// Alias for GetStaffs
func (h *AppHandler) GetAdmins(c *gin.Context) {
	h.GetStaffs(c)
}

// GetRoles returns all system roles with permissions
func (h *AppHandler) GetRoles(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not available"})
		return
	}

	pageStr := c.DefaultQuery("page", "1")
	pageSizeStr := c.DefaultQuery("page_size", "10")
	search := c.Query("search")
	sort := c.DefaultQuery("sort", "id_asc")

	page, _ := strconv.Atoi(pageStr)
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(pageSizeStr)
	if pageSize < 1 {
		pageSize = 10
	}

	query := h.DB.DB.Model(&model.Role{})

	if search != "" {
		s := "%" + search + "%"
		query = query.Where("key ILIKE ? OR name_th ILIKE ? OR name_en ILIKE ? OR description ILIKE ?", s, s, s, s)
	}

	orderClause := "id ASC"
	if sort == "id_desc" {
		orderClause = "id DESC"
	} else if sort == "key_asc" {
		orderClause = "key ASC"
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count roles: " + err.Error()})
		return
	}

	var roles []model.Role
	offset := (page - 1) * pageSize
	if err := query.Preload("Permissions").Order(orderClause).Limit(pageSize).Offset(offset).Find(&roles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch roles: " + err.Error()})
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	if totalPages == 0 {
		totalPages = 1
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        roles,
		"page":        page,
		"page_size":   pageSize,
		"total":       total,
		"total_pages": totalPages,
	})
}

// UpdateRolePermissions updates assigned permissions for a given Role ID
func (h *AppHandler) UpdateRolePermissions(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not available"})
		return
	}

	roleIDStr := c.Param("id")
	roleID, err := strconv.ParseUint(roleIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role ID"})
		return
	}

	var req struct {
		PermissionIDs []uint `json:"permission_ids"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	var role model.Role
	if err := h.DB.DB.First(&role, uint(roleID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Role not found"})
		return
	}

	tx := h.DB.DB.Begin()
	if err := tx.Where("role_id = ?", role.ID).Delete(&model.PermissionRole{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear old permissions"})
		return
	}

	for _, pID := range req.PermissionIDs {
		link := model.PermissionRole{
			RoleId:       role.ID,
			PermissionId: pID,
		}
		if err := tx.Create(&link).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to link permission"})
			return
		}
	}

	tx.Commit()

	h.DB.DB.Preload("Permissions").First(&role, role.ID)

	c.JSON(http.StatusOK, gin.H{
		"message": "Role permissions updated successfully",
		"data":    role,
	})
}

// GetPermissions returns all available system permissions
func (h *AppHandler) GetPermissions(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not available"})
		return
	}

	pageStr := c.DefaultQuery("page", "1")
	pageSizeStr := c.DefaultQuery("page_size", "100")
	search := c.Query("search")
	sort := c.DefaultQuery("sort", "name_asc")

	page, _ := strconv.Atoi(pageStr)
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(pageSizeStr)
	if pageSize < 1 {
		pageSize = 100
	}

	query := h.DB.DB.Model(&model.Permission{})

	if search != "" {
		s := "%" + search + "%"
		query = query.Where("name ILIKE ? OR name_th ILIKE ? OR name_en ILIKE ? OR description ILIKE ?", s, s, s, s)
	}

	orderClause := "name ASC"
	if sort == "name_desc" {
		orderClause = "name DESC"
	} else if sort == "id_asc" {
		orderClause = "id ASC"
	} else if sort == "id_desc" {
		orderClause = "id DESC"
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count permissions: " + err.Error()})
		return
	}

	var permissions []model.Permission
	offset := (page - 1) * pageSize
	if err := query.Order(orderClause).Limit(pageSize).Offset(offset).Find(&permissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch permissions: " + err.Error()})
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	if totalPages == 0 {
		totalPages = 1
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        permissions,
		"page":        page,
		"page_size":   pageSize,
		"total":       total,
		"total_pages": totalPages,
	})
}

// GetStaffByUUID returns a single staff member by UUID
func (h *AppHandler) GetStaffByUUID(c *gin.Context) {
	targetUUID := c.Param("uuid")

	var staff model.Staff
	if err := h.DB.DB.Preload("Role").Where("uuid = ?", targetUUID).First(&staff).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Staff member not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, staff.ToResponse())
}

// Alias for GetStaffByUUID
func (h *AppHandler) GetAdminByUUID(c *gin.Context) {
	h.GetStaffByUUID(c)
}

// CreateStaff creates a new staff member (default is_activate = false)
func (h *AppHandler) CreateStaff(c *gin.Context) {
	var req model.CreateStaffRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	var count int64
	h.DB.DB.Model(&model.Staff{}).Where("username = ?", req.Username).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "ชื่อผู้ใช้นี้ถูกใช้งานแล้วในระบบ"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to encrypt password"})
		return
	}

	newStaff := model.Staff{
		UUID:         uuid.New().String(),
		Username:     req.Username,
		PasswordHash: string(hashedPassword),
		Name:         req.Name,
		IsActivate:   false,
		RoleID:       req.RoleID,
	}

	if err := h.DB.DB.Create(&newStaff).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create staff member: " + err.Error()})
		return
	}

	_ = h.DB.DB.Preload("Role").First(&newStaff, newStaff.ID).Error

	c.JSON(http.StatusCreated, newStaff.ToResponse())
}

// Alias for CreateStaff
func (h *AppHandler) CreateAdmin(c *gin.Context) {
	h.CreateStaff(c)
}

// UpdateStaff updates a staff member by UUID
func (h *AppHandler) UpdateStaff(c *gin.Context) {
	targetUUID := c.Param("uuid")

	val, exists := c.Get("current_admin")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	currentStaff := val.(*model.Staff)

	var targetStaff model.Staff
	if err := h.DB.DB.Where("uuid = ?", targetUUID).First(&targetStaff).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Staff member not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	isSelf := currentStaff.UUID == targetStaff.UUID
	isSuper := currentStaff.Role != nil && (currentStaff.Role.Key == "super_admin" || currentStaff.Role.Key == "admin")

	if !isSelf && !isSuper {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: You cannot modify other staff accounts"})
		return
	}

	var req model.UpdateStaffRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid update payload"})
		return
	}

	if req.Name != nil && *req.Name != "" {
		targetStaff.Name = *req.Name
	}

	if req.RoleID != nil {
		targetStaff.RoleID = req.RoleID
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
		targetStaff.PasswordHash = string(hashedPassword)
	}

	if isSuper {
		if req.IsActivate != nil {
			if targetStaff.UUID == currentStaff.UUID && !*req.IsActivate {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot deactivate your own logged-in admin account"})
				return
			}
			targetStaff.IsActivate = *req.IsActivate
		}
	} else {
		if req.IsActivate != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Only Admin/Superadmin can change account status"})
			return
		}
	}

	if err := h.DB.DB.Save(&targetStaff).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update staff member"})
		return
	}

	_ = h.DB.DB.Preload("Role").First(&targetStaff, targetStaff.ID).Error

	c.JSON(http.StatusOK, targetStaff.ToResponse())
}

// Alias for UpdateStaff
func (h *AppHandler) UpdateAdmin(c *gin.Context) {
	h.UpdateStaff(c)
}

// DeleteStaff deletes a staff member by UUID (Admin/Superadmin)
func (h *AppHandler) DeleteStaff(c *gin.Context) {
	targetUUID := c.Param("uuid")

	val, exists := c.Get("current_admin")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	currentStaff := val.(*model.Staff)

	isSuper := currentStaff.Role != nil && (currentStaff.Role.Key == "super_admin" || currentStaff.Role.Key == "admin")
	if !isSuper {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Only Admin/Superadmin can delete accounts"})
		return
	}

	var targetStaff model.Staff
	if err := h.DB.DB.Where("uuid = ?", targetUUID).First(&targetStaff).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Staff member not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if targetStaff.UUID == currentStaff.UUID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete your own logged-in account"})
		return
	}

	if err := h.DB.DB.Delete(&targetStaff).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete staff member"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Staff member deleted successfully", "uuid": targetUUID})
}

// Alias for DeleteStaff
func (h *AppHandler) DeleteAdmin(c *gin.Context) {
	h.DeleteStaff(c)
}

// GetDashboardStats calculates summary statistics for dashboard from database
func (h *AppHandler) GetDashboardStats(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not available"})
		return
	}

	timeRange := c.DefaultQuery("range", "today")
	now := time.Now()
	var startTime time.Time

	switch timeRange {
	case "today":
		startTime = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	case "all":
		startTime = time.Time{} // Beginning of time
	default:
		startTime = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	}

	// 1. Total Revenue from Verified Orders
	var totalRevenue float64
	revQuery := h.DB.DB.Model(&model.Order{}).Where("slip_verification_status = ?", "verified")
	if !startTime.IsZero() {
		revQuery = revQuery.Where("created_at >= ?", startTime)
	}
	revQuery.Select("COALESCE(SUM(total_amount), 0)").Scan(&totalRevenue)

	// 2. Total Expenses from CashTransaction
	var totalExpenses float64
	expQuery := h.DB.DB.Model(&model.CashTransaction{}).Where("type = ?", "expense")
	if !startTime.IsZero() {
		expQuery = expQuery.Where("date_time >= ?", startTime)
	}
	expQuery.Select("COALESCE(SUM(amount), 0)").Scan(&totalExpenses)

	netProfit := totalRevenue - totalExpenses

	// 3. Total Orders
	var totalOrders int64
	ordQuery := h.DB.DB.Model(&model.Order{})
	if !startTime.IsZero() {
		ordQuery = ordQuery.Where("created_at >= ?", startTime)
	}
	ordQuery.Count(&totalOrders)

	// 4. Total Cups from OrderItems
	var totalCups int64
	cupQuery := h.DB.DB.Table("order_item").
		Joins("JOIN \"order\" ON \"order\".id = order_item.order_id")
	if !startTime.IsZero() {
		cupQuery = cupQuery.Where("\"order\".created_at >= ?", startTime)
	}
	cupQuery.Select("COALESCE(SUM(order_item.quantity), 0)").Scan(&totalCups)

	// 5. Pending Slips
	var pendingSlips int64
	var pendingAmount float64
	h.DB.DB.Model(&model.Order{}).
		Where("slip_verification_status = ?", "pending").
		Count(&pendingSlips)
	h.DB.DB.Model(&model.Order{}).
		Where("slip_verification_status = ?", "pending").
		Select("COALESCE(SUM(total_amount), 0)").
		Scan(&pendingAmount)

	// 6. Channels breakdown (online vs walkin)
	var onlineRevenue float64
	var walkinRevenue float64
	var onlineOrders int64
	var walkinOrders int64

	onlQuery := h.DB.DB.Model(&model.Order{}).Where("method = ? AND slip_verification_status = ?", "online", "verified")
	wlkQuery := h.DB.DB.Model(&model.Order{}).Where("method = ? AND slip_verification_status = ?", "walk-in", "verified")
	if !startTime.IsZero() {
		onlQuery = onlQuery.Where("created_at >= ?", startTime)
		wlkQuery = wlkQuery.Where("created_at >= ?", startTime)
	}
	onlQuery.Select("COALESCE(SUM(total_amount), 0)").Scan(&onlineRevenue)
	onlQuery.Count(&onlineOrders)
	wlkQuery.Select("COALESCE(SUM(total_amount), 0)").Scan(&walkinRevenue)
	wlkQuery.Count(&walkinOrders)

	totalChannelRev := onlineRevenue + walkinRevenue
	var onlinePct, walkinPct int
	if totalChannelRev > 0 {
		onlinePct = int((onlineRevenue / totalChannelRev) * 100)
		walkinPct = 100 - onlinePct
	}

	// 7. Top Selling Products
	type ProductStat struct {
		Name   string  `json:"name"`
		Cups   int     `json:"cups"`
		Amount float64 `json:"amount_raw"`
	}
	var topRaw []ProductStat
	prodQuery := h.DB.DB.Table("order_item").
		Select("COALESCE(product.name_th, 'สินค้า') as name, COALESCE(SUM(order_item.quantity), 0) as cups, COALESCE(SUM(order_item.unit_price * order_item.quantity), 0) as amount_raw").
		Joins("JOIN \"order\" ON \"order\".id = order_item.order_id").
		Joins("LEFT JOIN product ON product.id = order_item.product_id")
	if !startTime.IsZero() {
		prodQuery = prodQuery.Where("\"order\".created_at >= ?", startTime)
	}
	prodQuery.Group("product.name_th").Order("cups DESC").Limit(5).Scan(&topRaw)

	var maxCups int = 1
	for _, p := range topRaw {
		if p.Cups > maxCups {
			maxCups = p.Cups
		}
	}

	type TopProductRes struct {
		Name   string `json:"name"`
		Cups   int    `json:"cups"`
		Amount string `json:"amount"`
		Pct    int    `json:"pct"`
	}
	topProducts := make([]TopProductRes, 0)
	for _, p := range topRaw {
		pct := int((float64(p.Cups) / float64(maxCups)) * 100)
		topProducts = append(topProducts, TopProductRes{
			Name:   p.Name,
			Cups:   p.Cups,
			Amount: fmt.Sprintf("฿%s", formatMoney(p.Amount)),
			Pct:    pct,
		})
	}

	// 8. 14 Days Trend (or weekly)
	type TrendRes struct {
		D   string  `json:"d"`
		Rev float64 `json:"rev"`
		Exp float64 `json:"exp"`
	}
	trendList := make([]TrendRes, 0)
	var maxBar float64 = 5000

	// Generate 14 days trend starting from 13 days ago to today
	for i := 13; i >= 0; i-- {
		dayStart := time.Date(now.Year(), now.Month(), now.Day()-i, 0, 0, 0, 0, now.Location())
		dayEnd := dayStart.AddDate(0, 0, 1)

		var dayRev float64
		h.DB.DB.Model(&model.Order{}).
			Where("slip_verification_status = ? AND created_at >= ? AND created_at < ?", "verified", dayStart, dayEnd).
			Select("COALESCE(SUM(total_amount), 0)").Scan(&dayRev)

		var dayExp float64
		h.DB.DB.Model(&model.CashTransaction{}).
			Where("type = ? AND date_time >= ? AND date_time < ?", "expense", dayStart, dayEnd).
			Select("COALESCE(SUM(amount), 0)").Scan(&dayExp)

		if dayRev > maxBar {
			maxBar = dayRev * 1.15
		}
		if dayExp > maxBar {
			maxBar = dayExp * 1.15
		}

		dayNames := []string{"อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."}
		monthNames := []string{"", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."}
		dayLabel := fmt.Sprintf("%s %d %s", dayNames[dayStart.Weekday()], dayStart.Day(), monthNames[dayStart.Month()])

		trendList = append(trendList, TrendRes{
			D:   dayLabel,
			Rev: dayRev,
			Exp: dayExp,
		})
	}

	// 9. Today's Hourly Breakdown (10:00 to 22:00)
	type HourlySlot struct {
		Time    string  `json:"time"`
		Cups    int     `json:"cups"`
		Online  int     `json:"online"`
		Walkin  int     `json:"walkin"`
		Revenue float64 `json:"revenue"`
	}
	hourlySlots := make([]HourlySlot, 0)
	var maxHourlyCups int = 10
	var totalTodayCups int = 0
	var totalTodayRev float64 = 0
	var peakHourLabel string = "-"
	var maxSlotCups int = 0

	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	for hour := 10; hour <= 22; hour++ {
		hStart := todayStart.Add(time.Duration(hour) * time.Hour)
		hEnd := hStart.Add(time.Hour)
		timeStr := fmt.Sprintf("%02d:00", hour)

		var slotCups int
		h.DB.DB.Table("order_item").
			Joins("JOIN \"order\" ON \"order\".id = order_item.order_id").
			Where("\"order\".slip_verification_status = ? AND \"order\".created_at >= ? AND \"order\".created_at < ?", "verified", hStart, hEnd).
			Select("COALESCE(SUM(order_item.quantity), 0)").Scan(&slotCups)

		var slotOnlineCups int
		h.DB.DB.Table("order_item").
			Joins("JOIN \"order\" ON \"order\".id = order_item.order_id").
			Where("\"order\".method = ? AND \"order\".slip_verification_status = ? AND \"order\".created_at >= ? AND \"order\".created_at < ?", "online", "verified", hStart, hEnd).
			Select("COALESCE(SUM(order_item.quantity), 0)").Scan(&slotOnlineCups)

		var slotWalkinCups int
		h.DB.DB.Table("order_item").
			Joins("JOIN \"order\" ON \"order\".id = order_item.order_id").
			Where("\"order\".method = ? AND \"order\".slip_verification_status = ? AND \"order\".created_at >= ? AND \"order\".created_at < ?", "walk-in", "verified", hStart, hEnd).
			Select("COALESCE(SUM(order_item.quantity), 0)").Scan(&slotWalkinCups)

		var slotRev float64
		h.DB.DB.Model(&model.Order{}).
			Where("slip_verification_status = ? AND created_at >= ? AND created_at < ?", "verified", hStart, hEnd).
			Select("COALESCE(SUM(total_amount), 0)").Scan(&slotRev)

		if slotCups > maxHourlyCups {
			maxHourlyCups = slotCups
		}
		if slotCups > maxSlotCups {
			maxSlotCups = slotCups
			peakHourLabel = fmt.Sprintf("%s (%d แก้ว)", timeStr, slotCups)
		}

		totalTodayCups += slotCups
		totalTodayRev += slotRev

		hourlySlots = append(hourlySlots, HourlySlot{
			Time:    timeStr,
			Cups:    slotCups,
			Online:  slotOnlineCups,
			Walkin:  slotWalkinCups,
			Revenue: slotRev,
		})
	}

	todayData := gin.H{
		"dateLabel":   fmt.Sprintf("วันนี้ %d/%d", now.Day(), now.Month()),
		"shortLabel":  fmt.Sprintf("%d/%d", now.Day(), now.Month()),
		"totalCups":   totalTodayCups,
		"totalRev":    fmt.Sprintf("฿%s", formatMoney(totalTodayRev)),
		"peakSlot":    peakHourLabel,
		"maxCups":     maxHourlyCups,
		"slots":       hourlySlots,
	}

	c.JSON(http.StatusOK, gin.H{
		"kpis": gin.H{
			"total_revenue":  fmt.Sprintf("฿%s", formatMoney(totalRevenue)),
			"total_expenses": fmt.Sprintf("฿%s", formatMoney(totalExpenses)),
			"net_profit":     fmt.Sprintf("฿%s", formatMoney(netProfit)),
			"total_orders":   totalOrders,
			"total_cups":     totalCups,
			"pending_slips":  pendingSlips,
			"pending_amount": fmt.Sprintf("฿%s", formatMoney(pendingAmount)),
		},
		"channels": gin.H{
			"total": fmt.Sprintf("฿%s", formatMoney(totalChannelRev)),
			"online": gin.H{
				"pct":    onlinePct,
				"amount": fmt.Sprintf("฿%s", formatMoney(onlineRevenue)),
			},
			"walkin": gin.H{
				"pct":    walkinPct,
				"amount": fmt.Sprintf("฿%s", formatMoney(walkinRevenue)),
			},
		},
		"top_products": topProducts,
		"trend":        trendList,
		"max_bar":      maxBar,
		"today_hourly": todayData,
	})
}

func formatMoney(n float64) string {
	in := fmt.Sprintf("%.0f", n)
	out := ""
	for i, c := range in {
		if i > 0 && (len(in)-i)%3 == 0 {
			out += ","
		}
		out += string(c)
	}
	return out
}
