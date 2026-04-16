# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PC Build Planner — a school microservices project where users browse PC components and assemble named builds. **Intentionally minimal: implement only what is explicitly asked.**

## Architecture

3 backend microservices (each a different framework) + 2 BFFs (one per client type) + 4-zone Next.js micro-frontend. Each backend service owns its own PostgreSQL database. No service may query another service's database directly. **BFFs and MFEs have no database** — they compose upstream calls.

### Backend

| Service | DB | Framework / Protocol | Runtime | Business concept folder |
|---------|----|---------------------|---------|------------------------|
| `parts-service` | `catalog_db` | gRPC (`@grpc/grpc-js`) | Bun | `src/catalog/` |
| `builds-service` | `builds_db` | Hono | Bun | `src/build-management/` |
| `users-service` | `users_db` | Oak | Deno | `src/identity/` |
| `web-bff` | — | Hono + `@hono/swagger-ui` | Bun | `src/` (routes, clients, middleware) |
| `mobile-bff` | — | Elysia + `@elysiajs/openapi` | Bun | `src/` (routes, clients, middleware) |

### Micro-frontends (Next.js Multi-Zones)

| Zone | Port | `assetPrefix` | Owns |
|------|------|---------------|------|
| `shell` | 3000 | — (main zone) | landing + rewrites |
| `catalog-mfe` | 3001 | `/catalog-static` | `/catalog/*` |
| `builds-mfe` | 3002 | `/builds-static` | `/builds/*` |
| `auth-mfe` | 3003 | `/auth-static` | `/auth/*` |

All zones are independent Next.js 16 apps. Each uses shadcn/ui with the shared preset `b1t3ILnrM` for consistent design tokens. Cross-zone navigation uses plain `<a>` tags (never `next/link`). Shared auth = `jwt` cookie on the shared origin; each zone has both server-side (`src/lib/auth.ts` via `cookies()`) and client-side (`src/lib/auth-client.ts` via `document.cookie`) helpers. Every MFE fetches from `web-bff` — the shared `src/lib/bff.ts` picks between `NEXT_PUBLIC_WEB_BFF_URL` (browser) and `WEB_BFF_URL` (server-component).

### BFFs (Backends-for-Frontends)

Two gateways in **different frameworks**, same operations, different response shapes:
- **web-bff** (`:4004`, Bun + Hono) — rich composed payloads for the Next.js client: full specs, related-component fan-out, category breakdowns, thumbnail arrays.
- **mobile-bff** (`:4005`, Bun + Elysia) — slim bandwidth-friendly payloads: minimal fields, flat arrays, no timestamps.

Both BFFs:
- call `parts-service` via gRPC (proto mounted at `/proto/parts.proto`)
- call `builds-service` and `users-service` via REST (`fetch`)
- validate JWT at the edge and forward the `Authorization` header downstream
- expose Swagger UI at `/swagger` and the OpenAPI spec at `/openapi`
- have no database, no migrations, no seeds

### Clean Architecture (per backend service)

```
<service>/src/<business-concept>/
├── domain/          # Entities, interfaces — NO framework imports
├── application/     # Use cases — pure business logic, no HTTP/DB knowledge
├── infrastructure/  # PostgreSQL repository implementations, gRPC server/client
└── api/             # Route handlers (Hono / Oak) — thin adapters only (REST services)
```

- Dependencies flow inward: `api` → `application` → `domain` ← `infrastructure`

### Inter-Service Communication

- `parts-service` is a **full gRPC service** — all CRUD operations are served via gRPC (no REST endpoints)
- `builds-service` calls `parts-service` via **gRPC client** to resolve component details
- `builds-service` and `users-service` expose **REST/HTTP** endpoints
- The API gateway will use a gRPC client for parts-service and REST for other services
- `.proto` definitions live in `parts-service/proto/`
- Server reflection is enabled on parts-service for tooling (gRPCox)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtimes | Bun (parts, builds, web-bff, mobile-bff, shell, catalog-mfe, builds-mfe, auth-mfe), Deno (users) |
| Backend frameworks | gRPC (parts), Hono (builds, web-bff), Oak (users), Elysia (mobile-bff) |
| Frontend | Next.js 16 Multi-Zones, React 19, Tailwind v4, shadcn/ui (preset `b1t3ILnrM`) |
| Language | TypeScript (strict) everywhere |
| Database | PostgreSQL (Docker), Drizzle ORM |
| Linting/formatting | Biome 2.x |
| Package manager | Bun / Deno (per service runtime) |

## Commands

```bash
# Bun services (parts, builds, gateway, frontend)
bun install           # install deps
bun run dev           # run dev server
bun run lint          # biome check
bun run format        # biome format --write
bun run build         # frontend production build
bun run db:generate   # generate Drizzle migrations
bun run db:migrate    # run Drizzle migrations
bun run db:seed       # seed database with sample PC components

# Deno service (users-service)
deno task dev         # run dev server

# Docker
docker compose up -d  # start PostgreSQL
```

## Database Seeding

Each service has a `bun run db:seed` command. For `parts-service`, this seeds ~50 real-world PC components (real names/brands/specs, made-up prices) across 8 categories: CPU, GPU, RAM, Storage, Motherboard, PSU, Case, Cooling.

## Code Style (Biome 2.x)

- 2-space indentation, no trailing commas, LF line endings
- Automatic import organization (`organizeImports: on`)
- Strict TypeScript: no `any`, no implicit returns
- `interface` over `type` for object shapes
- Named exports over default exports in backend services
- `biome.json` in `frontend/` — replicate for each backend service

## Constraints

- Do not add features beyond what is explicitly requested
- Do not import framework code into `domain/` layer
- Do not create shared packages/libs between services — fully independent
- **Prefer native/built-in APIs over external libraries** (e.g. use Bun's native JWT/password hashing instead of `jose`/`bcrypt`)
- Frontend: App Router only, path alias `@/*` → `src/*`
- Database config via env vars (`DATABASE_URL` or `PGHOST`/`PGPORT`/etc.)
