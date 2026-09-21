package database

import (
	"context"
	"crypto/rand"
	"fmt"
	"log"
	"math/big"
	"time"

	"kaset-fair-backend/internal/model"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type PostgresDB struct {
	DB *gorm.DB
}

func ConnectPostgres(dsn string) (*PostgresDB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to open PostgreSQL connection: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get sql.DB: %w", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping PostgreSQL: %w", err)
	}

	log.Println("Successfully connected to PostgreSQL database")

	// Drop ref_no / order_no / change column if exists from previous schema
	db.Exec(`DO $$ BEGIN
		IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'order' AND column_name = 'ref_no') THEN
			ALTER TABLE "order" DROP COLUMN IF EXISTS ref_no CASCADE;
		END IF;
		IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'order' AND column_name = 'order_no') THEN
			ALTER TABLE "order" DROP COLUMN IF EXISTS order_no CASCADE;
		END IF;
		IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'order' AND column_name = 'change') THEN
			ALTER TABLE "order" DROP COLUMN IF EXISTS change CASCADE;
		END IF;
	END $$;`)

	// Run AutoMigrate for models
	if err := db.AutoMigrate(
		&model.Admin{},
		&model.Product{},
		&model.Topping{},
		&model.ProductComboRecipe{},
		&model.Order{},
		&model.OrderItem{},
		&model.OrderItemTopping{},
		&model.SystemSetting{},
	); err != nil {
		log.Printf("⚠️ AutoMigrate error: %v", err)
	} else {
		log.Println("✅ Database migration completed successfully (admin, product, topping, product_combo_recipe, order, order_item, order_item_topping, system_setting tables ready)")
	}

	// Seed Superadmin and Settings if not exists
	seedSuperAdmin(db)
	seedSettings(db)

	return &PostgresDB{DB: db}, nil
}

func (p *PostgresDB) Ping(ctx context.Context) error {
	if p == nil || p.DB == nil {
		return fmt.Errorf("PostgreSQL database not initialized")
	}
	sqlDB, err := p.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.PingContext(ctx)
}

// GenerateRandomPassword creates a secure random alphanumeric string
func GenerateRandomPassword(length int) (string, error) {
	const charset = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*"
	bytes := make([]byte, length)
	for i := 0; i < length; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		bytes[i] = charset[num.Int64()]
	}
	return string(bytes), nil
}

func seedSuperAdmin(db *gorm.DB) {
	var count int64
	if err := db.Model(&model.Admin{}).Where("is_superadmin = ?", true).Count(&count).Error; err != nil {
		log.Printf("⚠️ Error checking superadmin count: %v", err)
		return
	}

	if count > 0 {
		return
	}

	// Generate random password for initial superadmin
	rawPassword, err := GenerateRandomPassword(12)
	if err != nil {
		rawPassword = "admin" + fmt.Sprintf("%d", time.Now().Unix()%10000)
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(rawPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("⚠️ Failed to hash superadmin password: %v", err)
		return
	}

	superadmin := model.Admin{
		UUID:         uuid.New().String(),
		Username:     "superadmin",
		PasswordHash: string(hashedPassword),
		Name:         "Super Administrator",
		IsActivate:   true,
		IsSuperadmin: true,
	}

	if err := db.Create(&superadmin).Error; err != nil {
		log.Printf("⚠️ Failed to seed initial superadmin: %v", err)
		return
	}

	log.Println("==================================================================")
	log.Println("🔑 [INITIAL SEED] Superadmin account created successfully!")
	log.Printf("👉 Username : %s", superadmin.Username)
	log.Printf("👉 Password : %s", rawPassword)
	log.Printf("👉 UUID     : %s", superadmin.UUID)
	log.Println("⚠️ Please copy this password and change it upon first login!")
	log.Println("==================================================================")
}

func seedSettings(db *gorm.DB) {
	defaultSettings := []model.SystemSetting{
		{
			Key:         "slip_upload_mode",
			Value:       "immediate",
			Description: "เงื่อนไขการแนบสลิป PromptPay: immediate (ต้องอัพสลิปเลย) หรือ later (อัพสลิปทีหลังได้)",
			UpdatedAt:   time.Now(),
		},
		{
			Key:         "cash_upload_mode",
			Value:       "immediate",
			Description: "เงื่อนไขการถ่ายรูปเงินสด: immediate (ต้องถ่ายรูป/อัพรูป) หรือ later (ไม่ต้องถ่ายรูป)",
			UpdatedAt:   time.Now(),
		},
		{
			Key:         "promptpay_target",
			Value:       "",
			Description: "หมายเลขบัญชีพร้อมเพย์สำหรับรับชำระเงิน (เบอร์โทรศัพท์ หรือ เลขประจำตัวผู้เสียภาษี/บัตรประชาชน)",
			UpdatedAt:   time.Now(),
		},
		{
			Key:         "promptpay_name",
			Value:       "",
			Description: "ชื่อบัญชีพร้อมเพย์สำหรับรับชำระเงิน",
			UpdatedAt:   time.Now(),
		},
	}

	for _, setting := range defaultSettings {
		var count int64
		if err := db.Model(&model.SystemSetting{}).Where("key = ?", setting.Key).Count(&count).Error; err == nil && count == 0 {
			if err := db.Create(&setting).Error; err != nil {
				log.Printf("⚠️ Failed to seed default setting %s: %v", setting.Key, err)
			} else {
				log.Printf("✅ Seeded default system setting: %s = %s", setting.Key, setting.Value)
			}
		}
	}
}

