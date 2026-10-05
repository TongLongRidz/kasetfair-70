package main

import (
	"log"

	"kaset-fair-backend/internal/config"
	"kaset-fair-backend/internal/database"
	"kaset-fair-backend/internal/model"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	log.Println("🌱 Starting main database seeder (production/initial)...")

	cfg := config.LoadConfig()
	dsn := cfg.GetPostgresDSN()

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}

	// Run AutoMigrate
	if err := db.AutoMigrate(
		&model.Role{},
		&model.Permission{},
		&model.PermissionRole{},
		&model.Staff{},
		&model.Product{},
		&model.Topping{},
		&model.ProductComboRecipe{},
		&model.Order{},
		&model.OrderItem{},
		&model.OrderItemTopping{},
		&model.SystemSetting{},
		&model.CashTransaction{},
		&model.Debt{},
	); err != nil {
		log.Printf("⚠️ AutoMigrate error: %v", err)
	}

	// Run standard initial seeders
	database.SeedRolesAndPermissions(db)
	database.SeedSuperAdmin(db)
	database.SeedSettings(db)
	database.SeedProductsAndToppings(db)

	log.Println("✨ Main seeding completed successfully!")
}
