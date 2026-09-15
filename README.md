# Kaset Fair - Next.js + Golang + PostgreSQL Architecture

ระบบสั่งเครื่องดื่ม Fullstack (Storefront + Admin POS & Kitchen & Queue System) ที่ใช้ **Next.js 14 (Frontend)**, **Golang (Backend API)** และ **PostgreSQL 16 (Relational DB)** บน **Custom Ports (ขยับพอร์ต ไม่ใช้ default)**

---

## 📌 Port Mapping (Non-Default Ports)

| Service | Container Port | **Host Machine Port** | Notes |
| :--- | :--- | :--- | :--- |
| **Next.js Frontend** | `3050` | **`3050`** | ขยับจาก default 3000 |
| **Go Backend API** | `8585` | **`8585`** | ขยับจาก default 8080/8000 |
| **PostgreSQL Database** | `5432` | **`5488`** | ขยับจาก default 5432 |

---

## 🧭 แผนผังหน้าและฟีเจอร์ระบบ (System Routes & Features)

### 👤 ฝั่งลูกค้า (Customer / Storefront)
- **`/` (Storefront / Menu)**: หน้าหลักเลือกลิสต์เมนูเครื่องดื่ม, ปรับระดับความหวาน, เลือกท็อปปิ้ง และใส่ตะกร้าสินค้า
- **`/order` (Cart & Checkout)**: หน้ารถเข็น ตรวจสอบรายการ สรุปยอดเงิน และเลือกช่องทางชำระเงิน
- **`/order/[uuid]` (Receipt & Live Tracking)**: ใบเสร็จรับเงินแอนิเมชันเครื่องพิมพ์ความร้อน (Thermal POS Printer), QR Code ตรวจสอบสถานะ, บันทึกใบเสร็จเป็นรูปภาพ PNG และ Auto-poll อัปเดตสถานะคิว Real-time
- **`/payment/[uuid]` (Payment & Slip Upload)**: หน้าแสดง QR Code พร้อมเพย์ และอัปโหลดสลิปโอนเงิน
- **`/queue` (Live Queue Board)**: หน้าจอแสดงผลสถานะคิวรวมสำหรับลูกค้า (Fullscreen Mode, แยกคิวที่กำลังทำ Preparing และคิวที่เรียกรับ Ready แบบ FIFO)
- **`/about-us`**: หน้าเกี่ยวกับร้านและช่องทางติดต่อ

### 🛠️ ฝั่งแอดมินและพนักงาน (Admin Portal - `/admin`)
- **`/admin/login`**: หน้าล็อกอินเข้าระบบผู้ดูแล (JWT Token)
- **Management**:
  - **`/admin/management/administrator`**: จัดการแอดมิน (เพิ่ม/แก้ไข/ลบ, กำหนด Superadmin, เปิด/ปิดสถานะ)
  - **`/admin/management/menu`**: จัดการเมนู (เพิ่ม/ลบ/แก้ไข, ครอปรูป 1:1, สลับลำดับ Drag & Drop, เซ็ตสูตรคอมโบ `product_combo_recipe`, ร้อน/เย็น, แนะนำ/ขายหมด)
  - **`/admin/management/toppings`**: จัดการท็อปปิ้ง (เพิ่ม/ลบ/แก้ไข, ครอปรูป 1:1, สลับลำดับ, ร้อน/เย็น, ขายหมด)
  - **`/admin/management/slip-check`**: ตรวจสอบและอนุมัติสลิปโอนเงิน (Modal เลือกสถานะผ่าน Dropdown + ระบุเหตุผลปฏิเสธสลิป) พร้อมสวิตช์เปิด/ปิดตั้งค่าเงื่อนไขรูปภาพการชำระเงิน (`slip_upload_mode` สำหรับ PromptPay QR และ `cash_upload_mode` สำหรับ เงินสด)
  - **`/admin/management/dashboard`**: แดชบอร์ดสรุปยอดขาย รายรับ-รายจ่าย สถิติ (กำลังพัฒนา)
  - **`/admin/management/expense`**: บันทึกรายจ่ายและต้นทุนประจำวัน (กำลังพัฒนา)
  - **`/admin/management/banner`**: จัดการแบนเนอร์ประชาสัมพันธ์ (กำลังพัฒนา)
- **POS & Kitchen Bar**:
  - **`/admin/pos/front-desk`**: หน้าจอแคชเชียร์ขายหน้าร้าน (Walk-in POS) เลือกเมนู/ท็อปปิ้ง/ความหวานลงตะกร้า
  - **`/admin/pos/payment`**: หน้าจอชำระเงินหน้าร้าน (คำนวณเงินสด/เงินทอน, QR พร้อมเพย์, บัตรคิว, ผูกเงื่อนไข Slip Policy)
  - **`/admin/pos/kitchen`**: หน้าจอบาร์น้ำ/ห้องครัว (Kitchen Display System - KDS) แสดงการ์ดออเดอร์ตามลำดับ FIFO, ป้าย Combo Recipe & Toppings, สรุปเวลาออเดอร์ล่าสุด
  - **`/admin/pos/queue`**: หน้าจอจัดการคิว & ส่งมอบเครื่องดื่ม (สแกน QR Code จากใบเสร็จลูกค้าผ่านกล้องหรือเครื่องสแกนเนอร์ USB, กรอกเลขคิวค้นหา, ตรวจสอบสถานะก่อนส่งมอบ, ปุ่มกดเรียกคิว/ยืนยันส่งมอบ)

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
.
├── backend/
│   ├── cmd/
│   │   └── api/
│   │       └── main.go           # Go API Entrypoint, Routing & CORS setup
│   ├── internal/
│   │   ├── config/config.go      # .env loader & config struct
│   │   ├── database/
│   │   │   └── postgres.go       # PostgreSQL GORM connection & Auto Migration
│   │   ├── handler/              # API Handlers (admin, product, topping, order, setting, etc.)
│   │   ├── middleware/           # JWT Auth & Security Middlewares
│   │   ├── model/                # GORM Database Models
│   │   └── repository/           # Database Queries & Business Logic
│   ├── .env.example
│   ├── .env
│   ├── Dockerfile                # Multi-stage Golang Alpine build
│   ├── go.mod
│   └── go.sum
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (storefront)/     # Customer routes: /, /order, /order/[uuid], /payment/[uuid], /queue, /about-us
│   │   │   └── admin/            # Admin routes: /admin/login, /admin/management/*, /admin/pos/*
│   │   ├── components/           # UI Components (Navbar, AdminSidebar, Modals, Forms, Receipt, etc.)
│   │   ├── lib/                  # Utilities, API client, Hooks
│   │   ├── layout.tsx
│   │   └── globals.css           # Modern styling & Glassmorphic UI
│   ├── .env.example
│   ├── .env.local
│   ├── Dockerfile                # Multi-stage Next.js production build
│   ├── package.json              # Scripts bind to port 3050
│   └── tsconfig.json
├── docker-compose.yml            # PostgreSQL + Go Backend + Next.js orchestration
├── Makefile                      # One-click developer command runner
├── note.md                       # Full Requirements, Flow & Database Schema Specification
└── README.md
```

---

## 🛠️ ความต้องการของระบบ (Prerequisites)

- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) & Docker Compose (สำหรับการรันผ่าน Docker)
- [Node.js](https://nodejs.org/) v18+ และ npm (สำหรับการรัน Frontend แบบ Local)
- [Go](https://golang.org/) 1.22+ (สำหรับการรัน Backend แบบ Local)
- [PostgreSQL](https://www.postgresql.org/) 16+ (หากรันฐานข้อมูลแบบ Local)

---

## ⚙️ ขั้นตอนการติดตั้งและตั้งค่าเริ่มต้น (Setup Instructions)

### 1. ตั้งค่าไฟล์ Environment Variables
คัดลอกไฟล์ `.env.example` เป็น `.env` ที่ root directory:
```bash
cp .env.example .env
```
> สามารถปรับแต่งค่าคอนฟิกต่าง ๆ (เช่น พอร์ต หรือ รหัสผ่านฐานข้อมูล) ได้ในไฟล์ `.env`

### 2. ติดตั้ง Dependencies
สามารถติดตั้ง dependencies ของทั้ง Frontend และ Backend ได้ด้วยคำสั่งเดียว:
```bash
make setup
```

---

## ⚡ คำสั่ง Makefile (แนะนำ สะดวกรวดเร็ว)

โปรเจกต์มี Makefile เพื่อให้รันคำสั่งต่าง ๆ ได้สะดวกรวดเร็ว:

```bash
make setup      # ติดตั้ง dependencies ทั้งหมด (Frontend npm install + Backend go mod download)
make db-up      # รัน PostgreSQL database container (พอร์ต 5488)
make db-down    # หยุดการทำงานของ PostgreSQL database container
make backend    # รัน Go Backend API (พอร์ต 8585)
make frontend   # รัน Next.js Frontend dev server (พอร์ต 3050)
make build      # Build ทั้ง backend binary และ frontend
make lint       # ตรวจสอบ code style และ linting ของ frontend
```

---

## 🚀 วิธีการรันระบบ (How to Run)

### วิธีที่ 1: รันด้วย Makefile สำหรับ Local Development (แนะนำ)

1. **เปิด Database:**
   ```bash
   make db-up
   ```
   *(ฐานข้อมูลจะเปิดใช้งานที่พอร์ต `5488` ตามที่ตั้งไว้ใน `.env`)*

2. **เปิด Go Backend API (Terminal ที่ 1):**
   ```bash
   make backend
   ```
   - API จะรันที่ [http://localhost:8585](http://localhost:8585)
   - Health Check: [http://localhost:8585/health](http://localhost:8585/health)

3. **เปิด Next.js Frontend (Terminal ที่ 2):**
   ```bash
   make frontend
   ```
   - Frontend จะรันที่ [http://localhost:3050](http://localhost:3050)

4. **เมื่อต้องการหยุด Database:**
   ```bash
   make db-down
   ```

---

### วิธีที่ 2: รันทุก Service ด้วย Docker Compose (Full Stack)

สั่งรันทั้ง 3 services (PostgreSQL, Go Backend, Next.js Frontend) พร้อมกันใน background:

```bash
docker compose up -d --build
```

- **Frontend**: [http://localhost:3050](http://localhost:3050)
- **Backend API**: [http://localhost:8585](http://localhost:8585)
- **Health Check API**: [http://localhost:8585/health](http://localhost:8585/health)

**คำสั่งจัดการ Docker:**
```bash
docker compose ps       # ตรวจสอบสถานะการทำงาน
docker compose logs -f  # ดู logs รวมแบบ real-time
docker compose down -v  # หยุดการทำงานและ reset ข้อมูล database
```

---

## 🗄️ วิธีการเชื่อมต่อ PostgreSQL ผ่าน DBeaver (Database Connection)

หากต้องการเชื่อมต่อเพื่อดูข้อมูลและจัดการฐานข้อมูล PostgreSQL ในโปรเจกต์ผ่าน GUI Tool เช่น **DBeaver** สามารถตั้งค่าได้ดังนี้:

### 📋 ข้อมูลการเชื่อมต่อ (Connection Settings)

| รายการ (Setting) | ค่าที่ต้องระบุ (Value) | หมายเหตุ |
| :--- | :--- | :--- |
| **Connect Type / Driver** | `PostgreSQL` | เลือกไดรเวอร์ PostgreSQL |
| **Host / Server** | `localhost` | หรือระบุ IP เช่น `192.168.1.xxx` หากผ่าน LAN |
| **Port** | **`5488`** | *(⚠️ สำคัญ: ต้องเปลี่ยนจากพอร์ต default 5432 เป็น 5488)* |
| **Database** | `kaset_db` | ชื่อฐานข้อมูลหลักของโปรเจกต์ |
| **Username** | `kaset_user` | ผู้ใช้ฐานข้อมูล |
| **Password** | `kaset_secret_pass` | รหัสผ่านฐานข้อมูล |
| **SSL Mode** | `disable` | ปิดการใช้งาน SSL สำหรับ Local Development |

### 🛠️ ขั้นตอนการเชื่อมต่อใน DBeaver (Step-by-Step)

1. เปิดโปรแกรม **DBeaver** แล้วกดปุ่ม **New Connection** (ไอคอนปลั๊กไฟสีฟ้ามุมซ้ายบน) หรือกด `Ctrl + Shift + N`
2. เลือกประเภทฐานข้อมูลเป็น **PostgreSQL** แล้วกด **Next**
3. ในแท็บ **Main (General)** กรอกข้อมูลดังนี้:
   - **Host**: `localhost`
   - **Port**: `5488`
   - **Database**: `kaset_db`
   - **Username**: `kaset_user`
   - **Password**: `kaset_secret_pass`
4. หากต้องการปิด SSL ให้ไปที่แท็บ **Driver properties** หรือ **SSL** แล้วตั้งค่า `sslmode` เป็น `disable`
5. กดปุ่ม **Test Connection** ด้านซ้ายล่าง (หาก DBeaver ร้องขอให้ดาวน์โหลด Driver ให้กด **Download**)
6. เมื่อขึ้นข้อความ `Connected` ให้กด **Finish** เพื่อเริ่มจัดการตารางข้อมูล (`admins`, `products`, `toppings`, ฯลฯ) ได้ทันที

---

## 🔑 Environment Variables
 
### Root Level (`.env` / `.env.example`)
กำหนดค่าคอนฟิกกลางสำหรับทั้งระบบ:
- `BACKEND_PORT=8585`
- `APP_ENV=development`
- `DB_HOST=localhost` (หรือ `postgres` ใน Docker)
- `DB_PORT=5488` (หรือ `5432` ใน Docker)
- `DB_USER=kaset_user`
- `DB_PASSWORD=kaset_secret_pass`
- `DB_NAME=kaset_db`
- `DB_SSLMODE=disable`
- `FRONTEND_PORT=3050`
- `NEXT_PUBLIC_API_URL=http://localhost:8585`

---

## 🌐 ระบบหลายภาษา (Localization & i18n Architecture)

ระบบรองรับ 2 ภาษา (**ไทย TH** และ **อังกฤษ EN**) โดยแบ่งความรับผิดชอบออกเป็น 2 ส่วนชัดเจน:

### 1. ข้อมูลไดนามิกใน Database (Dynamic Database Tables)
ตารางที่มีข้อมูลที่ Admin เพิ่ม/แก้ไขได้ จะเก็บแยกฟิลด์ภาษาไทยและอังกฤษ เพื่อให้ผู้ใช้สลับภาษาหน้าร้านได้ทันที:

| ตาราง (Table) | ฟิลด์ภาษาไทย (TH) | ฟิลด์ภาษาอังกฤษ (EN) | คำอธิบาย |
| :--- | :--- | :--- | :--- |
| **`products`** | `name_th`, `desc_th` | `name_en`, `desc_en` | ชื่อเครื่องดื่ม & รายละเอียดสินค้า |
| **`categories`** | `name_th` | `name_en` | ชื่อหมวดหมู่สินค้า |
| **`toppings`** | `name_th` | `name_en` | ชื่อท็อปปิ้งเสริม |
| **`promotions`** | `name_th`, `desc_th` | `name_en`, `desc_en` | ชื่อโปรโมชั่น & เงื่อนไขการแลกแต้ม |
| **`banners`** | `name_th`, `desc_th` | `name_en`, `desc_en` | หัวข้อ & ข้อความบนแบนเนอร์ |

### 2. ข้อความคงที่บน UI (`th.json` / `en.json`)
สำหรับปุ่ม ข้อความระบบ และคำศัพท์ทั่วไปที่ไม่เปลี่ยนแปลงบ่อย (Static UI Translation):
- **Navbar / Footer**: `"หน้าแรก"`, `"เกี่ยวกับเรา"`, `"สถานะคิว"`, `"ตะกร้าสินค้า"`
- **Order Flow**: `"เลือกความหวาน"`, `"ระดับน้ำแข็ง"`, `"เลือกท็อปปิ้ง"`, `"ยืนยันคำสั่งซื้อ"`, `"ชำระเงิน"`
- **Status Badges**: `"รอตรวจสลิป"`, `"กำลังทำ"`, `"พร้อมรับ"`, `"รับแล้ว"`, `"สินค้าหมด (Sold out)"`



