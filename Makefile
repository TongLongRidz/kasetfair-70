.PHONY: setup frontend backend db-up db-down db-reset build lint qr-verify qr-ocr qr-start seed seed-test

# ==============================================================================
# OS Detection & Cross-Platform Commands (Windows / macOS / Linux)
# ==============================================================================
ifeq ($(OS),Windows_NT)
    # Windows OS Settings
    PYTHON ?= python
    RUN_FRONTEND = powershell -NoProfile -Command "Set-Location frontend; npm run dev"
    RUN_BACKEND  = powershell -NoProfile -Command "Set-Location backend; go run ./cmd/api"
    RUN_SEED     = powershell -NoProfile -Command "Set-Location backend; go run ./cmd/seed/main"
    RUN_SEED_TEST= powershell -NoProfile -Command "Set-Location backend; go run ./cmd/seed/test"
    RUN_QR       = powershell -NoProfile -Command "Set-Location qr-verify; $(PYTHON) app.py"
    RUN_SETUP    = powershell -NoProfile -Command "Set-Location frontend; npm install; Set-Location ../backend; go mod download; Set-Location ../qr-verify; pip install -r requirements.txt"
else
    # macOS / Linux OS Settings
    PYTHON ?= python3
    RUN_FRONTEND = cd frontend && npm run dev
    RUN_BACKEND  = cd backend && go run ./cmd/api
    RUN_SEED     = cd backend && go run ./cmd/seed/main
    RUN_SEED_TEST= cd backend && go run ./cmd/seed/test
    RUN_QR       = cd qr-verify && $(PYTHON) app.py
    RUN_SETUP    = cd frontend && npm install && cd ../backend && go mod download && cd ../qr-verify && pip install -r requirements.txt
endif

# ==============================================================================
# Targets
# ==============================================================================

setup:
	$(RUN_SETUP)

frontend:
	$(RUN_FRONTEND)

backend:
	$(RUN_BACKEND)

seed:
	$(RUN_SEED)

seed-test:
	$(RUN_SEED_TEST)

qr-verify:
	$(RUN_QR)

qr-ocr:
	$(RUN_QR)

qr-start:
	$(RUN_QR)

db-up:
	docker compose up -d postgres redis

db-down:
	docker compose stop postgres redis

db-reset:
	docker compose down -v

build:
	cd backend && CGO_ENABLED=0 go build -o bin/server ./cmd/api
	cd frontend && npm run build

lint:
	cd frontend && npm run lint
