# PC Build Planner — Copilot Instructions

## Project Overview

A **school microservices project** implementing a PC Build Planner — users can browse PC components and assemble/save named builds. The system is intentionally minimal: implement only what is asked, no extra features.

Architecture: 3 backend microservices + 1 Next.js frontend. Each backend service owns its own PostgreSQL database on a shared Docker PostgreSQL server.

---

## Monorepo Structure

```
ita-vaje/
├── parts-service/      # Component catalog (CPUs, GPUs, RAM, etc.)
├── builds-service/     # PC build assembly and storage
├── users-service/      # Authentication and user profiles
└── frontend/           # Next.js UI consuming all three services
```

---

## Tech Stack

| Layer              | Technology                              |
| ------------------ | --------------------------------------- |
| Backend runtime    | Bun                                     |
| Backend framework  | ElysiaJS                                |
| Backend language   | TypeScript (strict)                     |
| Frontend framework | Next.js 16 (App Router)                 |
| Frontend styling   | Tailwind CSS v4                         |
| Frontend language  | TypeScript (strict)                     |
| Database           | PostgreSQL (Docker), one DB per service |
| Linting/formatting | Biome 2.x                               |
| Package manager    | Bun (`bun install`, `bun run`)          |

---

## Architecture Principles

This project follows **Clean Architecture** with **Screaming Architecture** naming.

### Folder layout per backend service

```
<service>/src/<business-concept>/
├── domain/          # Entities, interfaces, value objects — NO framework imports
├── application/     # Use cases — orchestrate domain, no HTTP/DB knowledge
├── infrastructure/  # PostgreSQL repository implementations
└── api/             # ElysiaJS route definitions — thin adapters only
```

### Key rules

- **Domain is pure**: no ElysiaJS, no `pg`, no external imports in `domain/`
- **Dependencies flow inward**: `api` → `application` → `domain` ← `infrastructure`
- **Folder names reflect business concepts**, not technology (e.g. `catalog/`, `build-management/`, `identity/`)
- Inter-service communication is plain HTTP (no message brokers for this scope)

---

## Service Responsibilities

### `parts-service` — catalog

- CRUD for PC components (CPU, GPU, RAM, Storage, Motherboard, PSU, Case, Cooling)
- Each component has: name, brand, type, price (EUR), specs (key/value pairs)
- Business concept folder: `src/catalog/`

### `builds-service` — build-management

- Create/retrieve/delete named PC builds belonging to a user
- A build is a list of component IDs fetched from `parts-service` via HTTP
- Business concept folder: `src/build-management/`

### `users-service` — identity

- Register, login, basic profile
- Issues JWTs consumed by the other services (or handled at gateway level)
- Business concept folder: `src/identity/`

### `frontend` — Next.js App Router

- Path alias: `@/*` → `src/*`
- Pages live under `src/app/`
- No `/pages` directory — App Router only

---

## Code Style

Enforced by Biome 2.x (`biome.json` in `frontend/`; replicate for each service):

- **No trailing commas**
- **2-space indentation**
- **LF line endings** (`.gitattributes` per service)
- Import organisation is automatic (`organizeImports: on`)
- Strict TypeScript — no `any`, no implicit returns
- Use `interface` over `type` for object shapes
- Prefer named exports over default exports in services

---

## Common Commands

```bash
# Run a service (from service root)
bun run dev

# Install dependencies
bun install

# Lint + format check
bun run lint        # biome check
bun run format      # biome format --write

# Frontend dev server
cd frontend && bun run dev
```

---

## Database

- PostgreSQL runs in Docker; each service connects to its **own database** on the same server
- No shared tables across services — a service may only query its own DB
- `builds-service` calls `parts-service` HTTP API to resolve component details (not a direct DB join)
- Connection config via environment variables (`DATABASE_URL` or `PGHOST`/`PGPORT`/`PGDATABASE`/`PGUSER`/`PGPASSWORD`)

---

## What NOT to do

- Do not add features beyond what is explicitly requested — this is a minimal school project
- Do not add error handling, fallbacks, or validation for scenarios not asked for
- Do not import framework code into `domain/` layer
- Do not create shared packages/libs between services — keep them fully independent
- Do not use the Pages Router in the frontend — App Router only
