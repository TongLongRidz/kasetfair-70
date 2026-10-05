package main

import (
	"log"

	"kaset-fair-backend/internal/config"
	"kaset-fair-backend/internal/model"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type TestUserSeed struct {
	Username string
	Name     string
	RoleKey  string
}

func main() {
	log.Println("🌱 Starting test account seeder...")

	cfg := config.LoadConfig()
	dsn := cfg.GetPostgresDSN()

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}

	testUsers := []TestUserSeed{
		{
			Username: "test_superadmin",
			Name:     "ผู้ดูแลระบบสูงสุด",
			RoleKey:  "super_admin",
		},
		{
			Username: "test_admin",
			Name:     "แอดมิน",
			RoleKey:  "admin",
		},
		{
			Username: "test_accounting",
			Name:     "บัญชี",
			RoleKey:  "accounting",
		},
		{
			Username: "test_cashier",
			Name:     "แคชเชียร์",
			RoleKey:  "cashier",
		},
		{
			Username: "test_barista",
			Name:     "บาริสต้า",
			RoleKey:  "barista",
		},
		{
			Username: "test_pr",
			Name:     "ประชาสัมพันธ์",
			RoleKey:  "public_relations",
		},
	}

	password := "Hello123"
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("❌ Failed to hash password: %v", err)
	}

	log.Println("------------------------------------------------------------------")
	log.Printf("🔐 Password for all test users: %s", password)
	log.Println("------------------------------------------------------------------")

	for _, u := range testUsers {
		var role model.Role
		if err := db.Where("key = ?", u.RoleKey).First(&role).Error; err != nil {
			log.Printf("⚠️ Role '%s' not found for user '%s', skipping...", u.RoleKey, u.Username)
			continue
		}

		var existingStaff model.Staff
		err := db.Where("username = ?", u.Username).First(&existingStaff).Error
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				// Create new
				newStaff := model.Staff{
					UUID:         uuid.New().String(),
					Username:     u.Username,
					PasswordHash: string(hashedPassword),
					Name:         u.Name,
					IsActivate:   true,
					RoleID:       &role.ID,
				}
				if err := db.Create(&newStaff).Error; err != nil {
					log.Printf("❌ Failed to create user '%s': %v", u.Username, err)
				} else {
					log.Printf("✅ Created test user: %-18s | Role: %-12s | Name: %s", u.Username, u.RoleKey, u.Name)
				}
			} else {
				log.Printf("❌ Error querying user '%s': %v", u.Username, err)
			}
		} else {
			// Update existing to ensure password, role, is_activate and name are correct
			existingStaff.PasswordHash = string(hashedPassword)
			existingStaff.Name = u.Name
			existingStaff.IsActivate = true
			existingStaff.RoleID = &role.ID

			if err := db.Save(&existingStaff).Error; err != nil {
				log.Printf("❌ Failed to update user '%s': %v", u.Username, err)
			} else {
				log.Printf("🔄 Updated test user:  %-18s | Role: %-12s | Name: %s", u.Username, u.RoleKey, u.Name)
			}
		}
	}

	log.Println("------------------------------------------------------------------")
	log.Println("✨ Test accounts seeding completed successfully!")
	log.Println("------------------------------------------------------------------")
}
