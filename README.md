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

## 🚀 วิธีการรันระบบ (How to Run)

### รันทุกอย่างด้วย Docker Compose (แนะนำ)

สั่งรันทั้ง 3 services (PostgreSQL, Go Backend, Next.js Frontend) พร้อมกัน:

```bash
docker compose up -d --build
```

- **Frontend**: [http://localhost:3050](http://localhost:3050)
- **Backend Health API**: [http://localhost:8585/health](http://localhost:8585/health) หรือ [http://localhost:8585/api/v1/health](http://localhost:8585/api/v1/health)

ตรวจสอบสถานะ:
```bash
docker compose ps
```

หยุดการทำงาน:
```bash
docker compose down
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
- `PORT=8585`
- `DB_HOST=localhost` (หรือ `postgres` เมื่อรันบน Docker)
- `DB_PORT=5488` (หรือ `5432` เมื่อรันบน Docker)
- `DB_USER=kaset_user`
- `DB_PASSWORD=kaset_secret_pass`
- `DB_NAME=kaset_db`
- `DB_SSLMODE=disable`

### Frontend (`frontend/.env.local`)
- `PORT=3050`
- `NEXT_PUBLIC_API_URL=http://localhost:8585`
