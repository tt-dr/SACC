# SACC API (Gin + Gorm + Redis + MySQL)

## Quick Start

1. Copy env values from project root:
   - `.env.example`
2. Start infrastructure:
   - `docker compose -f deploy/docker-compose.yml up -d mysql redis`
3. Run API locally:
   - `cd server`
   - `go run ./cmd/api`

## Core Endpoints

- `GET /healthz` - liveness check
- `GET /readyz` - readiness check (MySQL + Redis)
- `GET /api/v1/public/bootstrap` - public site bootstrap for frontend
- `POST /api/v1/auth/login` - login, returns JWT
- `GET /api/v1/content` - public content list
- `GET /api/v1/content/:id` - public content detail
- `GET /api/v1/admin/me` - token verification
- `POST /api/v1/admin/content` - create content (auth required)
- `PUT /api/v1/admin/content/:id` - update content (auth required)

## Bootstrap

- Auto migration runs at startup.
- Seed runs at startup when `SEED_ENABLED=true`.
- Seed account defaults are controlled by `SEED_ADMIN_*` env vars.
