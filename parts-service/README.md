# Parts Service

PC component catalog microservice — manages CRUD operations for PC hardware components via **gRPC**.

## Overview

| | |
|---|---|
| **Protocol** | gRPC |
| **Runtime** | Bun |
| **Database** | PostgreSQL (`catalog_db`) |
| **ORM** | Drizzle |
| **gRPC Port** | 50051 |
| **Health HTTP Port** | 4001 |

## Architecture

```
src/catalog/
├── domain/          # Component entity, repository interface
├── application/     # ComponentService — business logic
└── infrastructure/  # Drizzle schema, PostgreSQL repository, gRPC server, migrations, seed
```

## gRPC API

Proto definition: `proto/parts.proto`

| RPC | Description |
|-----|-------------|
| `ListComponents` | List all components (optional `type` filter) |
| `GetComponent` | Get component by ID |
| `GetComponentsByIds` | Get multiple components by IDs |
| `CreateComponent` | Create a new component |
| `UpdateComponent` | Update a component |
| `DeleteComponent` | Delete a component |

### Component Types

`CPU`, `GPU`, `RAM`, `Storage`, `Motherboard`, `PSU`, `Case`, `Cooling`

### gRPC Web UI (gRPCox)

A Swagger-like web UI for gRPC is available via Docker:

```bash
docker compose up grpcox     # from project root
```

Open `http://localhost:6969`, enter `parts-service:50051` (Docker) or `localhost:50051` (local), and browse services.

Server reflection is enabled, so gRPCox auto-discovers all services and methods.

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

Tests cover the repository layer and all gRPC endpoints.

## Linting

```bash
bun run lint         # biome check
bun run format       # biome format --write
```

## Docker

```bash
docker compose up parts-service   # from project root
```

The container automatically runs migrations, seeds data, and starts the gRPC server.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgres://...localhost:5432/catalog_db` | PostgreSQL connection string |
| `GRPC_PORT` | `50051` | gRPC server port |
| `PORT` | `4001` | HTTP health check port |
