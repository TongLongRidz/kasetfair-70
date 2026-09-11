package handler

import (
	"net/http"
	"time"

	"kaset-fair-backend/internal/model"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type UpdateSettingRequest struct {
	Value       string `json:"value" binding:"required"`
	Description string `json:"description"`
}

// GetSettings returns all system settings as a map
func (h *AppHandler) GetSettings(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not available"})
		return
	}

	var settings []model.SystemSetting
	if err := h.DB.DB.Find(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch settings: " + err.Error()})
		return
	}

	settingsMap := make(map[string]string)
	for _, s := range settings {
		settingsMap[s.Key] = s.Value
	}

	c.JSON(http.StatusOK, gin.H{
		"data":     settings,
		"settings": settingsMap,
	})
}

// GetSettingByKey returns a specific setting by key
func (h *AppHandler) GetSettingByKey(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not available"})
		return
	}

	key := c.Param("key")
	var setting model.SystemSetting
	if err := h.DB.DB.Where("key = ?", key).First(&setting).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// If not found in DB, return default if known
			if key == "slip_upload_mode" {
				c.JSON(http.StatusOK, gin.H{
					"key":   key,
					"value": "immediate",
				})
				return
			}
			c.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query setting: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"key":         setting.Key,
		"value":       setting.Value,
		"description": setting.Description,
		"updated_at":  setting.UpdatedAt,
	})
}

// UpdateSetting creates or updates a system setting by key (Protected Admin endpoint)
func (h *AppHandler) UpdateSetting(c *gin.Context) {
	if h.DB == nil || h.DB.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not available"})
		return
	}

	key := c.Param("key")
	var req UpdateSettingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	setting := model.SystemSetting{
		Key:         key,
		Value:       req.Value,
		Description: req.Description,
		UpdatedAt:   time.Now(),
	}

	// Upsert setting
	if err := h.DB.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "key"}},
		DoUpdates: clause.AssignmentColumns([]string{"value", "description", "updated_at"}),
	}).Create(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save setting: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Setting updated successfully",
		"setting": setting,
	})
}
