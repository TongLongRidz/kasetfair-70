package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"kaset-fair-backend/internal/config"
	"kaset-fair-backend/internal/database"
	"kaset-fair-backend/internal/handler"
	"kaset-fair-backend/internal/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.LoadConfig()

	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize PostgreSQL
	postgresDB, err := database.ConnectPostgres(cfg.GetPostgresDSN())
	if err != nil {
		log.Printf("⚠️ PostgreSQL connection warning: %v (backend will continue running)", err)
	}

	// Initialize Redis
	redisClient, err := database.ConnectRedis(cfg)
	if err != nil {
		log.Printf("⚠️ Redis connection warning: %v (login rate limiting will be in-memory disabled)", err)
	}

	r := gin.Default()

	// CORS Setup
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	h := handler.NewAppHandler(cfg, postgresDB, redisClient)

	// Static file serving for uploads
	r.Static("/uploads", "./uploads")

	// API Routes
	r.GET("/health", h.HealthCheck)
	r.GET("/api/v1/health", h.HealthCheck)
	r.GET("/api/v1/info", h.GetSystemInfo)

	// Auth & Admin Routes
	v1 := r.Group("/api/v1")
	{
		// Public Auth
		v1.POST("/auth/login", h.Login)
		v1.POST("/admin/login", h.Login) // alias for convenience

		// Public Menu, Topping & Promotion Read (Customer or Public viewing)
		v1.GET("/products", h.GetProducts)
		v1.GET("/products/:id", h.GetProductByID)
		v1.GET("/toppings", h.GetToppings)
		v1.GET("/toppings/:id", h.GetToppingByID)
		v1.GET("/promotions", h.GetPromotions)
		v1.GET("/promotions/:id", h.GetPromotionByID)
		v1.GET("/settings", h.GetSettings)
		v1.GET("/settings/:key", h.GetSettingByKey)

		// Protected Admin Routes (Requires valid JWT and is_activate == true)
		if postgresDB != nil && postgresDB.DB != nil {
			adminGroup := v1.Group("")
			adminGroup.Use(middleware.AuthMiddleware(postgresDB.DB, cfg.JWTSecret))
			{
				adminGroup.GET("/auth/me", h.GetMe)
				adminGroup.GET("/admins", h.GetAdmins)
				adminGroup.GET("/admins/:uuid", h.GetAdminByUUID)
				adminGroup.POST("/admins", h.CreateAdmin)
				adminGroup.PUT("/admins/:uuid", h.UpdateAdmin)
				adminGroup.DELETE("/admins/:uuid", h.DeleteAdmin)

				// Admin Product Management
				adminGroup.PUT("/products/reorder", h.ReorderProducts)
				adminGroup.POST("/products", h.CreateProduct)
				adminGroup.PUT("/products/:id", h.UpdateProduct)
				adminGroup.DELETE("/products/:id", h.DeleteProduct)

				// Admin Topping Management
				adminGroup.PUT("/toppings/reorder", h.ReorderToppings)
				adminGroup.POST("/toppings", h.CreateTopping)
				adminGroup.PUT("/toppings/:id", h.UpdateTopping)
				adminGroup.DELETE("/toppings/:id", h.DeleteTopping)

				// Admin Promotion Management
				adminGroup.POST("/promotions", h.CreatePromotion)
				adminGroup.PUT("/promotions/:id", h.UpdatePromotion)
				adminGroup.DELETE("/promotions/:id", h.DeletePromotion)

				// Admin System Settings Management
				adminGroup.PUT("/settings/:key", h.UpdateSetting)

				// Uploads (Images)
				adminGroup.POST("/upload", h.UploadImage)
				adminGroup.DELETE("/upload", h.DeleteUpload)
			}
		}
	}

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	go func() {
		log.Printf("🚀 Backend service listening on port :%s (PostgreSQL Port: %s)", cfg.Port, cfg.DBPort)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exiting")
}
