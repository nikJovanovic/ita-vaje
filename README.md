# PC Build Planner

A microservices web application where users browse PC components and assemble named PC builds.

## Architecture

```
                        ┌─────────────────┐
                        │    Frontend     │
                        │   (Next.js)     │
                        └────────┬────────┘
                                 │ HTTP
                        ┌────────▼────────┐
                        │   API Gateway   │
                        │  (Bun.serve)    │
                        └────┬──────┬─────┘
                             │      │      │
               ┌─────────────┘      │      └──────────────┐
               │                    │                      │
      ┌────────▼───────┐  ┌────────▼───────┐  ┌──────────▼─────┐
      │ parts-service  │  │ builds-service │  │  users-service  │
      │  (ElysiaJS)    │  │    (Hono)      │  │     (Oak)       │
      └────────┬───────┘  └───┬────┬───────┘  └──────────┬──────┘
               │              │    │                      │
               │    gRPC ◄────┘    │                      │
               │                   │                      │
      ┌────────▼───────┐  ┌───────▼────────┐  ┌──────────▼──────┐
      │   catalog_db   │  │   builds_db    │  │    users_db     │
      │  (PostgreSQL)  │  │  (PostgreSQL)  │  │  (PostgreSQL)   │
      └────────────────┘  └────────────────┘  └─────────────────┘
```

## Services

| Service | Framework | Runtime | Description | README |
|---------|-----------|---------|-------------|--------|
| `parts-service` | ElysiaJS | Bun | PC component catalog (CRUD) | [README](parts-service/README.md) |
| `builds-service` | Hono | Bun | Named PC build assembly | [README](builds-service/README.md) |
| `users-service` | Oak | Deno | User registration, login, JWT | [README](users-service/README.md) |
| `api-gateway` | Bun.serve | Bun | Request routing, CORS, auth | TBD |
| `frontend` | Next.js 16 | Bun | Web interface | TBD |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtimes | Bun, Deno |
| Backend | ElysiaJS, Hono, Oak |
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
├── api-gateway/        # Request routing and auth middleware
├── parts-service/      # PC component catalog
├── builds-service/     # PC build assembly and storage
├── users-service/      # Authentication and user profiles
├── frontend/           # Next.js web application
├── docker-compose.yml  # PostgreSQL + all services
└── init-databases.sql  # Creates all 3 databases on first run
```
