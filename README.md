# PC Build Planner

A microservices web application where users browse PC components and assemble named PC builds.

## Architecture

Three stacked patterns:

1. **Microservices** — 3 backend services, each own DB, each different framework.
2. **Backend-for-Frontend (BFF)** — `web-bff` (rich) and `mobile-bff` (slim) compose downstream calls into client-shaped payloads.
3. **Micro-Frontends (Next.js Multi-Zones)** — one shell + 3 feature zones stitched together by path rewrites. Each zone is its own Next.js app, own Dockerfile, own CI pipeline.

```
Browser
  │
  ▼ http://localhost:3000
┌──────────────────────────────────────────────┐
│  shell (Next.js, :3000) — main zone          │
│  rewrites /catalog, /builds, /auth to zones  │
└──────┬─────────────┬──────────────┬──────────┘
       │             │              │
       ▼             ▼              ▼
┌────────────┐ ┌────────────┐ ┌────────────┐
│ catalog-   │ │ builds-mfe │ │ auth-mfe   │
│ mfe :3001  │ │ :3002      │ │ :3003      │
└─────┬──────┘ └─────┬──────┘ └─────┬──────┘
      │              │              │
      └──────────────┼──────────────┘
                     ▼ HTTP
              ┌──────────────┐
              │   web-bff    │  (Hono, :4004)
              │ rich payloads│
              └──┬────┬────┬─┘
                 │    │    │
       gRPC ─────┘    │    └─── REST ───┐
                      ▼                 ▼
         ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
         │ parts-service  │ │ builds-service │ │ users-service  │
         │   (gRPC/Bun)   │ │  (Hono/Bun)    │ │  (Oak/Deno)    │
         └───────┬────────┘ └───────┬────────┘ └────────┬───────┘
         ┌──────▼─────┐     ┌──────▼─────┐      ┌──────▼─────┐
         │ catalog_db │     │ builds_db  │      │ users_db   │
         └────────────┘     └────────────┘      └────────────┘
```

`mobile-bff` (Elysia, :4005) sits alongside `web-bff` for a hypothetical mobile client with slim responses — not wired into the micro-frontend zones.

## Services

### Backend

| Service | Framework / Protocol | Runtime | Description | README |
|---------|---------------------|---------|-------------|--------|
| `parts-service` | gRPC | Bun | PC component catalog (CRUD) | [README](parts-service/README.md) |
| `builds-service` | Hono | Bun | Named PC build assembly | [README](builds-service/README.md) |
| `users-service` | Oak | Deno | User registration, login, JWT | [README](users-service/README.md) |
| `web-bff` | Hono | Bun | BFF — rich payloads (full specs, breakdowns, thumbnails) | [README](web-bff/README.md) |
| `mobile-bff` | Elysia | Bun | BFF — slim payloads (minimal fields, flat arrays) | [README](mobile-bff/README.md) |

### Micro-frontends (Next.js Multi-Zones)

| Zone | Folder | Port | `assetPrefix` | Owns paths |
|------|--------|------|---------------|------------|
| **shell** | [shell/](shell/) | 3000 | — | `/` (landing, rewrites) |
| **catalog-mfe** | [catalog-mfe/](catalog-mfe/) | 3001 | `/catalog-static` | `/catalog`, `/catalog/:id` |
| **builds-mfe** | [builds-mfe/](builds-mfe/) | 3002 | `/builds-static` | `/builds`, `/builds/new`, `/builds/:id` |
| **auth-mfe** | [auth-mfe/](auth-mfe/) | 3003 | `/auth-static` | `/auth/login`, `/auth/register`, `/auth/me` |

All zones share the [shadcn/ui](https://ui.shadcn.com) preset `b1t3ILnrM` so they look like one app despite being deployed independently. Cross-zone auth = JWT in a shared-origin cookie.

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
├── shell/              # MFE shell (Next.js) — rewrites to zones
├── catalog-mfe/        # MFE zone: browse components
├── builds-mfe/         # MFE zone: manage builds
├── auth-mfe/           # MFE zone: register / login / profile
├── docker-compose.yml  # PostgreSQL + all services + all MFE zones
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
