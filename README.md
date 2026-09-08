# Kaset Fair - Next.js + Golang + PostgreSQL Architecture

ระบบสั่งเครื่องดื่ม Fullstack (Storefront + Admin POS & Queue System) ที่ใช้ **Next.js (Frontend)**, **Golang (Backend API)** และ **PostgreSQL 16 (Single DB with JSONB)** บน **Custom Ports (ขยับพอร์ต ไม่ใช้ default)**

---

## 📌 Port Mapping (Non-Default Ports)

| Service | Container Port | **Host Machine Port** | Notes |
| :--- | :--- | :--- | :--- |
| **Next.js Frontend** | `3050` | **`3050`** | ขยับจาก default 3000 |
| **Go Backend API** | `8585` | **`8585`** | ขยับจาก default 8080/8000 |
| **PostgreSQL Database** | `5432` | **`5488`** | ขยับจาก default 5432 |

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
.
├── backend/
│   ├── cmd/
│   │   └── api/
│   │       └── main.go           # Go API Entrypoint & CORS setup
│   ├── internal/
│   │   ├── config/config.go      # .env loader & config struct
│   │   ├── database/
│   │   │   └── postgres.go       # PostgreSQL GORM connection & Auto Migration
│   │   └── handler/health.go     # Health check & system stats
│   ├── .env.example
│   ├── .env
│   ├── Dockerfile                # Multi-stage Golang Alpine build
│   ├── go.mod
│   └── go.sum
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── layout.tsx
│   │       ├── page.tsx          # Real-time dashboard status
│   │       └── globals.css       # Dark glassmorphic modern styling
│   ├── .env.example
│   ├── .env.local
│   ├── Dockerfile                # Multi-stage Next.js production build
│   ├── package.json              # Scripts bind to port 3050
│   └── tsconfig.json
├── docker-compose.yml            # PostgreSQL + Go Backend + Next.js orchestration
├── note.md                       # Requirements & Database Schema Specification
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
docker compose down     # หยุดการทำงานทั้งหมด
docker compose down -v  # หยุดการทำงานและ reset ข้อมูล database
```

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



