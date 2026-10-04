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
		&model.Role{},
		&model.Permission{},
		&model.PermissionRole{},
		&model.Admin{},
		&model.Product{},
		&model.Topping{},
		&model.ProductComboRecipe{},
		&model.Order{},
		&model.OrderItem{},
		&model.OrderItemTopping{},
		&model.SystemSetting{},
		&model.CashTransaction{},
	); err != nil {
		log.Printf("⚠️ AutoMigrate error: %v", err)
	} else {
		log.Println("✅ Database migration completed successfully (role, permission, permission_role, admin, product, topping, order, cash_transaction tables ready)")
	}

	// Seed Roles, Permissions, Superadmin, Settings, Products, and Toppings
	seedRolesAndPermissions(db)
	seedSuperAdmin(db)
	seedSettings(db)
	seedProductsAndToppings(db)

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
			}
		}
	}
}

func seedRolesAndPermissions(db *gorm.DB) {
	// 1. Seed Granular View & Edit Permissions for each admin feature page
	permissions := []model.Permission{
		// Dashboard
		{Name: "dashboard.view", NameTH: "ดูแดชบอร์ด", NameEN: "View Dashboard", Description: "เข้าถึงและดูแดชบอร์ดสรุปยอดขาย สถิติ และกราฟแนวโน้ม"},

		// Expense / Accounting
		{Name: "expense.view", NameTH: "ดูรายรับ-รายจ่าย", NameEN: "View Expenses", Description: "ดูรายการรายรับ-รายจ่ายและสรุปการเงิน"},
		{Name: "expense.edit", NameTH: "จัดการรายจ่าย", NameEN: "Edit Expenses", Description: "บันทึก แก้ไข หรือลบรายการรายจ่าย"},

		// Slip Check
		{Name: "slip_check.view", NameTH: "ดูสลิปและการชำระเงิน", NameEN: "View Slip Payments", Description: "ดูรายการการชำระเงินและรูปสลิป/หลักฐานเงินสด"},
		{Name: "slip_check.edit", NameTH: "อนุมัติ/จัดการสลิป", NameEN: "Edit Slip Verification", Description: "อนุมัติ/ปฏิเสธสลิป และปรับเปลี่ยนนโยบาย Slip Policy"},

		// Menu Management
		{Name: "menu.view", NameTH: "ดูรายการเมนู", NameEN: "View Menu Items", Description: "ดูรายการเมนูเครื่องดื่ม สูตรคอมโบ และลำดับการแสดงผล"},
		{Name: "menu.edit", NameTH: "จัดการเมนูและสินค้า", NameEN: "Edit Menu Items", Description: "เพิ่ม แก้ไข ลบ ซ่อน หรือจัดเรียงลำดับเมนูและท็อปปิ้ง"},

		// Banner Management
		{Name: "banner.view", NameTH: "ดูแบนเนอร์", NameEN: "View Banners", Description: "ดูแบนเนอร์และภาพประชาสัมพันธ์"},
		{Name: "banner.edit", NameTH: "จัดการแบนเนอร์", NameEN: "Edit Banners", Description: "เพิ่ม แก้ไข หรือลบรูปแบนเนอร์ประชาสัมพันธ์"},

		// Administrator & Roles Management
		{Name: "administrator.view", NameTH: "ดูผู้ดูแลระบบ", NameEN: "View Admins", Description: "ดูรายชื่อแอดมิน บทบาท และสิทธิ์ในระบบ"},
		{Name: "administrator.edit", NameTH: "จัดการแอดมินและบทบาท", NameEN: "Edit Admins & Roles", Description: "เพิ่ม แก้ไขสิทธิ์ เปิด/ปิดใช้งาน หรือลบบัญชีแอดมิน"},

		// Permissions Management
		{Name: "permission.view", NameTH: "ดูสิทธิ์การใช้งาน", NameEN: "View Permissions", Description: "ดูรายการบทบาทและสิทธิ์การใช้งาน (Permissions)"},
		{Name: "permission.edit", NameTH: "จัดการสิทธิ์การใช้งาน", NameEN: "Edit Permissions", Description: "แก้ไขการกำหนดสิทธิ์สำหรับบทบาทต่างๆ ในระบบ"},

		// QR Code Settings Management
		{Name: "qrcode.view", NameTH: "ดู QR Code รับเงิน", NameEN: "View Payment QR Code", Description: "ดูตั้งค่า QR Code รับเงิน และข้อมูลบัญชีพร้อมเพย์"},
		{Name: "qrcode.edit", NameTH: "จัดการ QR Code รับเงิน", NameEN: "Edit Payment QR Code", Description: "เพิ่ม แก้ไข หรืออัปโหลด QR Code พร้อมเพย์รับเงิน"},

		// POS Front Desk / Cashier
		{Name: "pos_front.view", NameTH: "ดูหน้าจอ POS", NameEN: "View POS Screen", Description: "เข้าถึงและดูหน้าจอ POS สั่งซื้อหน้าร้าน"},
		{Name: "pos_front.edit", NameTH: "ขายหน้าร้าน POS", NameEN: "Use POS Ordering", Description: "สร้างออเดอร์ รับเงินสด สแกนพร้อมเพย์ และออกคิวหน้าร้าน"},

		// Kitchen Display / Barista
		{Name: "kitchen.view", NameTH: "ดูหน้าจอห้องครัว", NameEN: "View Kitchen Display", Description: "ดูหน้าจอบาร์น้ำ/ห้องครัว (Kitchen Display)"},
		{Name: "kitchen.edit", NameTH: "จัดการสถานะคิวครัว", NameEN: "Edit Kitchen Status", Description: "ปรับสถานะคิวเครื่องดื่ม (กำลังทำ / พร้อมรับ / รับของแล้ว)"},

		// Queue Management
		{Name: "queue.view", NameTH: "ดูหน้าจอจัดการคิว", NameEN: "View Queue Screen", Description: "ดูหน้าจอจัดการคิวและสแกนรับสินค้า"},
		{Name: "queue.edit", NameTH: "สแกน/ส่งมอบคิว", NameEN: "Edit Queue Pickup", Description: "สแกน QR / กรอกคิวยืนยันส่งมอบสินค้าให้ลูกค้า"},
	}

	for _, p := range permissions {
		var existing model.Permission
		if err := db.Where("name = ?", p.Name).First(&existing).Error; err != nil {
			_ = db.Create(&p).Error
		} else {
			existing.NameTH = p.NameTH
			existing.NameEN = p.NameEN
			existing.Description = p.Description
			_ = db.Save(&existing).Error
		}
	}

	// 2. Seed Roles: superadmin, admin, accounting, cashier, barista
	roles := []model.Role{
		{
			Name:        "superadmin",
			NameTH:      "ผู้ดูแลระบบสูงสุด",
			NameEN:      "Super Administrator",
			Description: "ผู้ดูแลระบบสูงสุด (Super Administrator) มีสิทธิ์เข้าถึงและจัดการทุกส่วนในระบบแบบ 100%",
		},
		{
			Name:        "admin",
			NameTH:      "ผู้จัดการร้าน",
			NameEN:      "Store Manager",
			Description: "ผู้จัดการร้าน (Store Manager) ดูแลการทำงานทั่วไป จัดการเมนู ออเดอร์ ตรวจสอบสลิป และดูรายงาน",
		},
		{
			Name:        "accounting",
			NameTH:      "ฝ่ายบัญชีและการเงิน",
			NameEN:      "Accounting & Finance",
			Description: "ฝ่ายบัญชีและการเงิน (Accounting & Finance) ดูแลแดชบอร์ด รายรับ-รายจ่าย และตรวจสอบสลิป",
		},
		{
			Name:        "cashier",
			NameTH:      "พนักงานแคชเชียร์/หน้าร้าน",
			NameEN:      "Cashier",
			Description: "พนักงานแคชเชียร์/หน้าร้าน (Cashier) รับออเดอร์ POS รับชำระเงิน ตรวจสอบสลิป และจัดการคิว",
		},
		{
			Name:        "barista",
			NameTH:      "พนักงานบาร์น้ำ/ห้องครัว",
			NameEN:      "Barista & Kitchen Staff",
			Description: "พนักงานบาร์น้ำ/ห้องครัว (Barista) ดูหน้าจอครัว ทำเครื่องดื่ม และอัปเดตสถานะคิว",
		},
	}

	for _, r := range roles {
		var existing model.Role
		if err := db.Where("name = ?", r.Name).First(&existing).Error; err != nil {
			_ = db.Create(&r).Error
		} else {
			existing.NameTH = r.NameTH
			existing.NameEN = r.NameEN
			existing.Description = r.Description
			_ = db.Save(&existing).Error
		}
	}

	// Map permissions helper
	assignPermissionsToRole := func(roleName string, permNames []string) {
		var role model.Role
		if err := db.Where("name = ?", roleName).First(&role).Error; err != nil {
			return
		}

		var targetPerms []model.Permission
		if len(permNames) == 0 {
			// All permissions
			db.Find(&targetPerms)
		} else {
			db.Where("name IN ?", permNames).Find(&targetPerms)
		}

		for _, perm := range targetPerms {
			var linkCount int64
			db.Model(&model.PermissionRole{}).Where("role_id = ? AND permission_id = ?", role.ID, perm.ID).Count(&linkCount)
			if linkCount == 0 {
				db.Create(&model.PermissionRole{RoleId: role.ID, PermissionId: perm.ID})
			}
		}
	}

	// 3. Assign Granular Permissions to Each Role
	// superadmin: Full Access to all permissions
	assignPermissionsToRole("superadmin", nil)

	// admin: Manage all features except admin account editing
	assignPermissionsToRole("admin", []string{
		"dashboard.view",
		"expense.view", "expense.edit",
		"qrcode.view", "qrcode.edit",
		"slip_check.view", "slip_check.edit",
		"menu.view", "menu.edit",
		"banner.view", "banner.edit",
		"administrator.view",
		"pos_front.view", "pos_front.edit",
		"kitchen.view", "kitchen.edit",
		"queue.view", "queue.edit",
	})

	// accounting: Financial Dashboard, Expense Management, QR Settings, and Slip Verification
	assignPermissionsToRole("accounting", []string{
		"dashboard.view",
		"expense.view", "expense.edit",
		"qrcode.view", "qrcode.edit",
		"slip_check.view", "slip_check.edit",
	})

	// cashier: POS Order Taking, Slip Verification, and Queue Management
	assignPermissionsToRole("cashier", []string{
		"pos_front.view", "pos_front.edit",
		"slip_check.view", "slip_check.edit",
		"queue.view", "queue.edit",
	})

	// barista: Kitchen Display, Menu View, and Queue Status Updates
	assignPermissionsToRole("barista", []string{
		"kitchen.view", "kitchen.edit",
		"menu.view",
		"queue.view", "queue.edit",
	})
}

func seedProductsAndToppings(db *gorm.DB) {
	intPtr := func(v int) *int { return &v }
	strPtr := func(v string) *string { return &v }

	products := []model.Product{
		{
			NameTh:        "น้ำเต้าหู้",
			NameEn:        "Original Soy Milk",
			DescTh:        strPtr("อร่อยจุง"),
			DescEn:        strPtr("Delicious"),
			PriceHot:      intPtr(25),
			PriceIced:     intPtr(30),
			ImageURL:      strPtr(""),
			IsCombo:       false,
			IsAvailable:   true,
			IsSoldOut:     false,
			IsRecommended: false,
			SortOrder:     1,
		},
		{
			NameTh:        "น้ำเต้าหู้ชาไทย",
			NameEn:        "Thai Tea Soy Milk",
			DescTh:        strPtr(""),
			DescEn:        strPtr(""),
			PriceHot:      intPtr(30),
			PriceIced:     intPtr(35),
			ImageURL:      strPtr(""),
			IsCombo:       false,
			IsAvailable:   true,
			IsSoldOut:     false,
			IsRecommended: false,
			SortOrder:     2,
		},
		{
			NameTh:        "น้ำเต้าหู้ชมพู",
			NameEn:        "Nom Yen Soy Milk",
			DescTh:        strPtr(""),
			DescEn:        strPtr("Salak (Snake Fruit)"),
			PriceHot:      intPtr(30),
			PriceIced:     intPtr(35),
			ImageURL:      strPtr(""),
			IsCombo:       false,
			IsAvailable:   true,
			IsSoldOut:     false,
			IsRecommended: false,
			SortOrder:     3,
		},
		{
			NameTh:        "น้ำเต้าหู้ช๊อคโก",
			NameEn:        "Choco Soy Milk",
			DescTh:        strPtr(""),
			DescEn:        strPtr(""),
			PriceHot:      intPtr(30),
			PriceIced:     intPtr(35),
			ImageURL:      strPtr(""),
			IsCombo:       false,
			IsAvailable:   true,
			IsSoldOut:     false,
			IsRecommended: false,
			SortOrder:     4,
		},
		{
			NameTh:        "น้ำเต้าหู้มัทฉะ",
			NameEn:        "Matcha Soy Milk",
			DescTh:        strPtr(""),
			DescEn:        strPtr(""),
			PriceHot:      intPtr(35),
			PriceIced:     intPtr(40),
			ImageURL:      strPtr(""),
			IsCombo:       false,
			IsAvailable:   true,
			IsSoldOut:     false,
			IsRecommended: false,
			SortOrder:     5,
		},
	}

	for _, p := range products {
		var count int64
		if err := db.Model(&model.Product{}).Where("name_th = ?", p.NameTh).Count(&count).Error; err == nil && count == 0 {
			_ = db.Create(&p).Error
		}
	}

	toppings := []model.Topping{
		{
			NameTh:      "ไข่มุกบราวน์ชูการ์",
			NameEn:      "Brown Sugar Boba",
			Price:       10,
			AllowHot:    false,
			AllowIced:   true,
			ImageURL:    strPtr(""),
			IsAvailable: true,
			IsSoldOut:   false,
			SortOrder:   1,
		},
		{
			NameTh:      "เม็ดแมงลัก",
			NameEn:      "",
			Price:       10,
			AllowHot:    true,
			AllowIced:   true,
			ImageURL:    strPtr(""),
			IsAvailable: true,
			IsSoldOut:   false,
			SortOrder:   2,
		},
		{
			NameTh:      "เมล็ดเจีย",
			NameEn:      "",
			Price:       10,
			AllowHot:    true,
			AllowIced:   true,
			ImageURL:    strPtr(""),
			IsAvailable: true,
			IsSoldOut:   false,
			SortOrder:   3,
		},
		{
			NameTh:      "สาคู",
			NameEn:      "",
			Price:       10,
			AllowHot:    true,
			AllowIced:   true,
			ImageURL:    strPtr(""),
			IsAvailable: true,
			IsSoldOut:   false,
			SortOrder:   4,
		},
		{
			NameTh:      "เฉาก๊วย",
			NameEn:      "",
			Price:       10,
			AllowHot:    false,
			AllowIced:   true,
			ImageURL:    strPtr(""),
			IsAvailable: true,
			IsSoldOut:   false,
			SortOrder:   5,
		},
		{
			NameTh:      "ถั่วแดง",
			NameEn:      "Red Bean",
			Price:       10,
			AllowHot:    true,
			AllowIced:   true,
			ImageURL:    strPtr(""),
			IsAvailable: true,
			IsSoldOut:   false,
			SortOrder:   6,
		},
	}

	for _, t := range toppings {
		var count int64
		if err := db.Model(&model.Topping{}).Where("name_th = ?", t.NameTh).Count(&count).Error; err == nil && count == 0 {
			_ = db.Create(&t).Error
		}
	}
}
