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

	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count admins"})
		return
	}

	var admins []model.Admin
	offset := (page - 1) * pageSize
	if err := query.Order("id ASC").Limit(pageSize).Offset(offset).Find(&admins).Error; err != nil {
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
	}

	if err := h.DB.DB.Create(&newAdmin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create admin: " + err.Error()})
		return
	}

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
