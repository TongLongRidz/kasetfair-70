package handler

import (
	"context"
	"net/http"
	"time"

	"kaset-fair-backend/internal/config"
	"kaset-fair-backend/internal/database"

	"github.com/gin-gonic/gin"
)

type AppHandler struct {
	Cfg   *config.Config
	DB    *database.PostgresDB
	Redis *database.RedisClient
}

func NewAppHandler(cfg *config.Config, db *database.PostgresDB, rdb *database.RedisClient) *AppHandler {
	return &AppHandler{
		Cfg:   cfg,
		DB:    db,
		Redis: rdb,
	}
}

type HealthResponse struct {
	Status    string            `json:"status"`
	Timestamp string            `json:"timestamp"`
	Port      string            `json:"port"`
	Services  map[string]string `json:"services"`
}

func (h *AppHandler) HealthCheck(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	services := make(map[string]string)
	overallStatus := "ok"

	if h.DB != nil {
		if err := h.DB.Ping(ctx); err != nil {
			services["postgres"] = "error: " + err.Error()
			overallStatus = "degraded"
		} else {
			services["postgres"] = "connected (port " + h.Cfg.DBPort + ")"
		}
	} else {
		services["postgres"] = "disconnected"
		overallStatus = "degraded"
	}

	if h.Redis != nil {
		if err := h.Redis.Ping(ctx); err != nil {
			services["redis"] = "error: " + err.Error()
			overallStatus = "degraded"
		} else {
			services["redis"] = "connected (port " + h.Cfg.RedisPort + ")"
		}
	} else {
		services["redis"] = "disconnected"
	}

	c.JSON(http.StatusOK, HealthResponse{
		Status:    overallStatus,
		Timestamp: time.Now().Format(time.RFC3339),
		Port:      h.Cfg.Port,
		Services:  services,
	})
}

func (h *AppHandler) GetSystemInfo(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"app":         "Kaset-Fair API",
		"backendPort": h.Cfg.Port,
		"env":         h.Cfg.AppEnv,
		"status":      "ready",
	})
}
