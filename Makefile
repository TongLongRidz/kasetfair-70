.PHONY: setup frontend backend db-up db-down build lint

setup:
	cd frontend && npm install
	cd backend && go mod download

frontend:
	cd frontend && npm run dev

backend:
	cd backend && go run ./cmd/api

db-up:
	docker compose up -d postgres redis

db-down:
	docker compose stop postgres redis

build:
	cd backend && CGO_ENABLED=0 go build -o bin/server ./cmd/api
	cd frontend && npm run build

lint:
	cd frontend && npm run lint
