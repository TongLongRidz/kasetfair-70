.PHONY: setup frontend backend db-up db-down build lint qr-verify qr-ocr qr-all

setup:
	cd frontend && npm install
	cd backend && go mod download
	cd qr-verify && npm install

frontend:
	cd frontend && npm run dev

backend:
	cd backend && go run ./cmd/api

qr-verify:
	cd qr-verify && npm run dev

qr-ocr:
	cd qr-verify && ./ocr_env/bin/python ocr_service.py

qr-start:
	cd qr-verify && (./ocr_env/bin/python ocr_service.py & node --watch server.js)

db-up:
	docker compose up -d postgres redis

db-down:
	docker compose stop postgres redis

build:
	cd backend && CGO_ENABLED=0 go build -o bin/server ./cmd/api
	cd frontend && npm run build

lint:
	cd frontend && npm run lint

