# Builds Service

PC build management microservice — lets users create, retrieve, and delete named PC builds.

## Overview

| | |
|---|---|
| **Framework** | Hono |
| **Runtime** | Bun |
| **Database** | PostgreSQL (`builds_db`) |
| **ORM** | Drizzle |
| **Port** | 4002 |

## Architecture

```
src/build-management/
├── domain/          # Build entity, repository interface
├── application/     # BuildService — business logic
├── infrastructure/  # Drizzle schema, PostgreSQL repository, migrations
└── api/             # Hono route handlers, logger middleware
```

## API Endpoints

Base path: `/api/builds`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/builds` | List all builds (optional `?userId=` filter) |
| `GET` | `/api/builds/:id` | Get build by ID (includes component details) |
| `POST` | `/api/builds` | Create a new build |
| `DELETE` | `/api/builds/:id` | Delete a build |

### OpenAPI / Swagger

Available at `/swagger` when the service is running.

## Development

```bash
bun install
bun run dev          # start with --watch
```

## Database

```bash
bun run db:generate  # generate Drizzle migrations
bun run db:migrate   # apply migrations
```

## Testing

```bash
bun test             # run all tests
```

## Linting

```bash
bun run lint         # biome check
bun run format       # biome format --write
```

## Docker

```bash
docker compose up builds-service   # from project root
```

## Inter-Service Communication

This service calls `parts-service` via **gRPC** to resolve component details when assembling a build.

**Status:** Not yet implemented.
