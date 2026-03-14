# Parts Service

PC component catalog microservice — manages CRUD operations for PC hardware components.

## Overview

| | |
|---|---|
| **Framework** | ElysiaJS |
| **Runtime** | Bun |
| **Database** | PostgreSQL (`catalog_db`) |
| **ORM** | Drizzle |
| **Port** | 4001 |

## Architecture

```
src/catalog/
├── domain/          # Component entity, repository interface
├── application/     # ComponentService — business logic
├── infrastructure/  # Drizzle schema, PostgreSQL repository, migrations, seed
└── api/             # ElysiaJS route handlers, logger middleware
```

## API Endpoints

Base path: `/api/components`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/components` | List all components (optional `?type=` filter) |
| `GET` | `/api/components/:id` | Get component by ID |
| `POST` | `/api/components` | Create a new component |
| `PATCH` | `/api/components/:id` | Update a component |
| `DELETE` | `/api/components/:id` | Delete a component |

### Component Types

`CPU`, `GPU`, `RAM`, `Storage`, `Motherboard`, `PSU`, `Case`, `Cooling`

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
bun run db:seed      # seed ~50 real-world PC components
```

## Testing

```bash
bun test             # run all tests
```

Tests cover the repository layer and all API endpoints.

## Linting

```bash
bun run lint         # biome check
bun run format       # biome format --write
```

## Docker

```bash
docker compose up parts-service   # from project root
```

The container automatically runs migrations, seeds data, and starts the server.

## gRPC

This service also exposes a gRPC interface for inter-service communication. `builds-service` uses the gRPC client to resolve component details. Proto definitions are in `proto/`.

**Status:** Not yet implemented.
