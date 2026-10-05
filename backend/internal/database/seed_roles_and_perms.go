package database

import (
	"gorm.io/gorm"
	"kaset-fair-backend/internal/model"
)

func SeedRolesAndPermissions(db *gorm.DB) {
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
		{Name: "menu.edit", NameTH: "จัดการเมนูและสินค้า", NameEN: "Edit Menu Items", Description: "เพิ่ม แก้ไข ลบ ซ่อน หรือจัดเรียงลำดับเมนู"},

		// Topping Management
		{Name: "topping.view", NameTH: "ดูรายการท็อปปิ้ง", NameEN: "View Toppings", Description: "ดูรายการท็อปปิ้งและลำดับการแสดงผล"},
		{Name: "topping.edit", NameTH: "จัดการท็อปปิ้ง", NameEN: "Edit Toppings", Description: "เพิ่ม แก้ไข ลบ หรือจัดเรียงลำดับท็อปปิ้ง"},

		// Banner Management
		{Name: "banner.view", NameTH: "ดูแบนเนอร์", NameEN: "View Banners", Description: "ดูแบนเนอร์และภาพประชาสัมพันธ์"},
		{Name: "banner.edit", NameTH: "จัดการแบนเนอร์", NameEN: "Edit Banners", Description: "เพิ่ม แก้ไข หรือลบรูปแบนเนอร์ประชาสัมพันธ์"},

		// Staff Management
		{Name: "staff.view", NameTH: "ดูบัญชีทีมงาน", NameEN: "View Staff Accounts", Description: "ดูรายชื่อบัญชีทีมงาน บทบาท และสถานะการใช้งานในระบบ"},
		{Name: "staff.edit", NameTH: "จัดการบัญชีทีมงาน", NameEN: "Edit Staff Accounts", Description: "เพิ่ม แก้ไขสิทธิ์ บทบาท รหัสผ่าน เปิด/ปิดใช้งาน หรือลบบัญชีทีมงาน"},

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

	// 2. Seed Roles: super_admin, admin, accounting, cashier, barista, public_relations
	roles := []model.Role{
		{
			Key:         "super_admin",
			NameTH:      "ผู้ดูแลระบบสูงสุด",
			NameEN:      "Super Administrator",
			Description: "ผู้ดูแลระบบสูงสุด (Super Administrator) มีสิทธิ์เข้าถึงและจัดการทุกส่วนในระบบแบบ 100%",
		},
		{
			Key:         "admin",
			NameTH:      "ผู้ดูแลระบบ",
			NameEN:      "Administrator",
			Description: "ผู้ดูแลระบบ (Administrator) ดูแลการทำงานทั่วไป จัดการเมนู ออเดอร์ ตรวจสอบสลิป และดูรายงาน",
		},
		{
			Key:         "accounting",
			NameTH:      "ฝ่ายบัญชีและการเงิน",
			NameEN:      "Accounting & Finance",
			Description: "ฝ่ายบัญชีและการเงิน (Accounting & Finance) ดูแลแดชบอร์ด รายรับ-รายจ่าย และตรวจสอบสลิป",
		},
		{
			Key:         "cashier",
			NameTH:      "พนักงานแคชเชียร์",
			NameEN:      "Cashier",
			Description: "พนักงานแคชเชียร์ (Cashier) รับออเดอร์ POS รับชำระเงิน ตรวจสอบสลิป และจัดการคิว",
		},
		{
			Key:         "barista",
			NameTH:      "พนักงานบาร์น้ำ",
			NameEN:      "Barista",
			Description: "พนักงานบาร์น้ำ (Barista) ดูหน้าจอครัว ทำเครื่องดื่ม และอัปเดตสถานะคิว",
		},
		{
			Key:         "public_relations",
			NameTH:      "ฝ่ายประชาสัมพันธ์",
			NameEN:      "Public Relations",
			Description: "ฝ่ายประชาสัมพันธ์ (Public Relations) ดูแลจัดการรูปภาพแบนเนอร์และข้อมูลโปรโมชั่นประชาสัมพันธ์",
		},
	}

	for _, r := range roles {
		var existing model.Role
		if err := db.Where("key = ?", r.Key).First(&existing).Error; err != nil {
			_ = db.Create(&r).Error
		} else {
			existing.NameTH = r.NameTH
			existing.NameEN = r.NameEN
			existing.Description = r.Description
			_ = db.Save(&existing).Error
		}
	}

	// Map permissions helper
	assignPermissionsToRole := func(roleKey string, permNames []string) {
		var role model.Role
		if err := db.Where("key = ?", roleKey).First(&role).Error; err != nil {
			return
		}

		var targetPerms []model.Permission
		if len(permNames) == 0 {
			// All permissions
			db.Find(&targetPerms)
		} else {
			db.Where("name IN ?", permNames).Find(&targetPerms)
		}

		// Clear existing permission links and assign new set cleanly
		db.Where("role_id = ?", role.ID).Delete(&model.PermissionRole{})
		for _, perm := range targetPerms {
			db.Create(&model.PermissionRole{RoleId: role.ID, PermissionId: perm.ID})
		}
	}

	// 3. Assign Granular Permissions to Each Role
	// super_admin & admin: Full Access to all permissions
	assignPermissionsToRole("super_admin", nil)
	assignPermissionsToRole("admin", nil)

	// accounting: dashboard.view, expense.view, expense.edit, menu.view, menu.edit, topping.view, topping.edit, slip_check.view, slip_check.edit, qrcode.view, qrcode.edit
	assignPermissionsToRole("accounting", []string{
		"dashboard.view",
		"expense.view", "expense.edit",
		"menu.view", "menu.edit",
		"topping.view", "topping.edit",
		"slip_check.view", "slip_check.edit",
		"qrcode.view", "qrcode.edit",
	})

	// barista: dashboard.view, expense.view, menu.view, menu.edit, topping.view, topping.edit, kitchen.view, kitchen.edit, queue.view, queue.edit
	assignPermissionsToRole("barista", []string{
		"dashboard.view",
		"expense.view",
		"menu.view", "menu.edit",
		"topping.view", "topping.edit",
		"kitchen.view", "kitchen.edit",
		"queue.view", "queue.edit",
	})

	// cashier: dashboard.view, expense.view, menu.view, topping.view, pos_front.view, pos_front.edit, queue.view, queue.edit
	assignPermissionsToRole("cashier", []string{
		"dashboard.view",
		"expense.view",
		"menu.view",
		"topping.view",
		"pos_front.view", "pos_front.edit",
		"queue.view", "queue.edit",
	})

	// public_relations: dashboard.view, expense.view, menu.view, topping.view, banner.view, banner.edit
	assignPermissionsToRole("public_relations", []string{
		"dashboard.view",
		"expense.view",
		"menu.view",
		"topping.view",
		"banner.view", "banner.edit",
	})
}
