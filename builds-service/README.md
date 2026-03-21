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
├── domain/          # Build entity, repository interface, PartsClient interface
├── application/     # BuildService — business logic
├── infrastructure/  # Drizzle schema, PostgreSQL repository, gRPC client, migrations
└── api/             # Hono route handlers, logger middleware
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/builds` | List all builds (optional `?userId=` filter) |
| `GET` | `/builds/:id` | Get build by ID (includes component details via gRPC) |
| `POST` | `/builds` | Create a new build |
| `DELETE` | `/builds/:id` | Delete a build |
| `GET` | `/health` | Health check |

### API Documentation

- **OpenAPI spec**: `/openapi`
- **Scalar UI**: `/scalar`

## Development

```bash
bun install
bun run dev          # start with --watch
```

## Database

```bash
bun run db:generate  # generate Drizzle migrations
bun run db:migrate   # apply migrations
bun run db:seed      # seed sample builds
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

This service calls `parts-service` via **gRPC** to resolve component details when fetching a build by ID.

- Proto definition: `parts-service/proto/parts.proto`
- gRPC host configured via `PARTS_GRPC_HOST` env var (default: `localhost:50051`)
- Graceful degradation: if parts-service is unavailable, builds are returned with empty components and `totalPrice: 0`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgres://...localhost:5432/builds_db` | PostgreSQL connection string |
| `PORT` | `4002` | HTTP server port |
| `PARTS_GRPC_HOST` | `localhost:50051` | parts-service gRPC address |
| `PARTS_PROTO_PATH` | `../parts-service/proto/parts.proto` | Path to proto file |
