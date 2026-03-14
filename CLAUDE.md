# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PC Build Planner — a school microservices project where users browse PC components and assemble named builds. **Intentionally minimal: implement only what is explicitly asked.**

## Architecture

3 backend microservices (each a different framework) + API gateway + Next.js frontend. Each backend service owns its own PostgreSQL database on a shared Docker PostgreSQL server. No service may query another service's database directly.

| Service | DB | Framework | Runtime | Business concept folder |
|---------|----|-----------|---------|------------------------|
| `parts-service` | `catalog_db` | ElysiaJS | Bun | `src/catalog/` |
| `builds-service` | `builds_db` | Hono | Bun | `src/build-management/` |
| `users-service` | `users_db` | Oak | Deno | `src/identity/` |
| `api-gateway` | — | None (plain `Bun.serve`) | Bun | — |
| `frontend` | — | Next.js 16, React 19, Tailwind v4 | Bun | `src/app/` |

### API Gateway

Plain `Bun.serve` + native `fetch` proxy — no framework. Routes by path prefix:
- `/api/parts/*` → `parts-service:4001`
- `/api/builds/*` → `builds-service:4002`
- `/api/users/*` → `users-service:4003`

Handles cross-cutting concerns: CORS, auth token validation.

### Clean Architecture (per backend service)

```
<service>/src/<business-concept>/
├── domain/          # Entities, interfaces — NO framework imports
├── application/     # Use cases — pure business logic, no HTTP/DB knowledge
├── infrastructure/  # PostgreSQL repository implementations
└── api/             # Route handlers (ElysiaJS / Hono / Oak) — thin adapters only
```

- Dependencies flow inward: `api` → `application` → `domain` ← `infrastructure`

### Inter-Service Communication

- **Mandatory**: at least one service must use **gRPC** (not REST) for inter-service calls
- `parts-service` exposes a **gRPC interface** for internal service-to-service communication
- `builds-service` calls `parts-service` via **gRPC client** to resolve component details
- External access (frontend → gateway → services) remains **REST/HTTP**
- `.proto` definitions live in `parts-service/proto/`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtimes | Bun (parts, builds, gateway, frontend), Deno (users) |
| Backend frameworks | ElysiaJS, Hono, Oak (one per service) |
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
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
