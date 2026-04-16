# PC Build Planner

A microservices web application where users browse PC components and assemble named PC builds.

## Architecture

Backend-for-Frontend (BFF) pattern: a dedicated gateway per client type, each in a different framework, returning payloads shaped for that client.

```
   ┌──────────────┐        ┌──────────────┐
   │ Next.js web  │        │ Mobile app   │
   └──────┬───────┘        └──────┬───────┘
          │ HTTP (rich)           │ HTTP (slim)
   ┌──────▼───────┐        ┌──────▼───────┐
   │   web-bff    │        │  mobile-bff  │
   │ Bun + Hono   │        │ Bun + Elysia │
   └──┬────┬────┬─┘        └──┬────┬────┬─┘
      │    │    │             │    │    │
      │    │    └───┬─────────┘    │    │
      │    └────────┼───┬──────────┘    │
      └─────────────┼───┼───┬───────────┘
                    │   │   │
          gRPC      │   │   │ REST
    ┌───────────────▼┐ ┌▼───▼───────────┐ ┌─────────────────┐
    │ parts-service  │ │ builds-service │ │  users-service  │
    │  (gRPC / Bun)  │ │ (Hono / Bun)   │ │  (Oak / Deno)   │
    └───────┬────────┘ └───────┬────────┘ └────────┬────────┘
            │                  │                   │
    ┌───────▼────────┐ ┌───────▼────────┐ ┌────────▼────────┐
    │  catalog_db    │ │   builds_db    │ │    users_db     │
    │  (PostgreSQL)  │ │  (PostgreSQL)  │ │  (PostgreSQL)   │
    └────────────────┘ └────────────────┘ └─────────────────┘
```

## Services

| Service | Framework / Protocol | Runtime | Description | README |
|---------|---------------------|---------|-------------|--------|
| `parts-service` | gRPC | Bun | PC component catalog (CRUD) | [README](parts-service/README.md) |
| `builds-service` | Hono | Bun | Named PC build assembly | [README](builds-service/README.md) |
| `users-service` | Oak | Deno | User registration, login, JWT | [README](users-service/README.md) |
| `web-bff` | Hono | Bun | BFF for the Next.js web client — **rich payloads** (full specs, breakdowns, thumbnails) | [README](web-bff/README.md) |
| `mobile-bff` | Elysia | Bun | BFF for mobile clients — **slim payloads** (minimal fields, flat arrays) | [README](mobile-bff/README.md) |
| `frontend` | Next.js 16 | Bun | Web interface | TBD |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtimes | Bun, Deno |
| Backend | gRPC, Hono, Oak, Elysia |
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| Language | TypeScript (strict) |
| Database | PostgreSQL, Drizzle ORM |
| Inter-service | gRPC (builds → parts) |
| Linting | Biome 2.x |

## Quick Start

```bash
# Start PostgreSQL (creates catalog_db, builds_db, users_db)
docker compose up -d

# Parts service (includes auto migration + seed)
cd parts-service && bun install && bun run dev
```

## Project Structure

```
ita-vaje/
├── parts-service/      # PC component catalog (gRPC)
├── builds-service/     # PC build assembly and storage (Hono)
├── users-service/      # Authentication and user profiles (Oak/Deno)
├── web-bff/            # BFF for web (Hono) — rich responses
├── mobile-bff/         # BFF for mobile (Elysia) — slim responses
├── frontend/           # Next.js web application
├── docker-compose.yml  # PostgreSQL + all services
└── init-databases.sql  # Creates all 3 databases on first run
```

## BFF endpoints at a glance

Both BFFs expose the same operations; only the response shapes differ.

| Path | Web BFF (`:4004`) | Mobile BFF (`:4005`) |
|------|-------------------|----------------------|
| `GET /api/catalog` | full components (id, name, brand, type, price, specs, timestamps) | slim (id, name, type, price, brand) |
| `GET /api/catalog/:id` | + related components (same type, ±20% price) | + only top 3 specs |
| `GET /api/builds` | + thumbnails + totalPrice | id, name, totalPrice only |
| `GET /api/builds/:id` | full components + breakdown by category | flat `items[]` of id/name/price |
| `POST /api/auth/register` | `{user, token}` | `{token, userId}` |
| `POST /api/auth/login` | `{user, token}` | `{token}` |
| `GET /api/me` (web) / `/api/me/summary` (mobile) | profile + builds with thumbnails | `{username, buildCount, totalSpent}` |
| Swagger UI | http://localhost:4004/swagger | http://localhost:4005/swagger |
