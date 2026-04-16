# mobile-bff

Backend-for-Frontend for mobile clients. Written in **Bun + Elysia**.

Returns **slim, bandwidth-optimized payloads**: only the fields a small screen actually renders — no full specs, no timestamps, no userIds, flat arrays. Same operations as web-bff, different shapes.

Calls downstream services:
- `parts-service` via **gRPC** (`PARTS_GRPC_HOST`)
- `builds-service` via **REST** (`BUILDS_SERVICE_URL`)
- `users-service` via **REST** (`USERS_SERVICE_URL`)

No database. Stateless.

## Run

```bash
bun install
bun run dev           # http://localhost:4005
```

Swagger UI: http://localhost:4005/swagger
OpenAPI spec: http://localhost:4005/openapi

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `4005` | HTTP port |
| `JWT_SECRET` | `super-secret-dev-key` | Shared with users-service + builds-service |
| `PARTS_GRPC_HOST` | `localhost:50051` | parts-service gRPC |
| `PARTS_PROTO_PATH` | `../parts-service/proto/parts.proto` | proto file location |
| `BUILDS_SERVICE_URL` | `http://localhost:4002` | builds-service REST |
| `USERS_SERVICE_URL` | `http://localhost:4003` | users-service REST |

## Endpoints

| Method | Path | Auth | Shape highlight |
|--------|------|------|-----------------|
| GET | `/health` | — | `{status, service}` |
| GET | `/api/catalog` | — | `{id, name, type, price, brand}` only |
| GET | `/api/catalog/:id` | — | slim + `topSpecs` (max 3 entries) |
| GET | `/api/builds` | — | `{id, name, totalPrice}` only |
| GET | `/api/builds/:id` | — | slim + flat `items[]` of `{id, name, price}` |
| POST | `/api/builds` | JWT | same slim detail shape |
| DELETE | `/api/builds/:id` | JWT | 204 No Content (empty body) |
| POST | `/api/auth/register` | — | `{token, userId}` (no user object) |
| POST | `/api/auth/login` | — | `{token}` (no user object) |
| GET | `/api/me/summary` | JWT | `{username, buildCount, totalSpent}` |

## Example — slim build detail

```bash
TOKEN=$(curl -sX POST http://localhost:4005/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@b","username":"u","password":"secret123"}' | jq -r .token)

# get detail — note the flat `items`, no `components`, no `breakdown`, no `userId`
curl -s http://localhost:4005/api/builds/<build-id>
# {
#   "id": "...",
#   "name": "Gaming Beast",
#   "totalPrice": 1650,
#   "items": [{"id":"...","name":"Ryzen 7 7800X3D","price":450}, ...]
# }
```

Compare the same call against `web-bff` (port 4004) to see the rich variant.

## Tests

```bash
bun test
```

21 endpoint tests with fake downstream clients. No database required.

## Why Elysia (and not Hono)?

The assignment calls for ≥ 2 BFFs in **different technologies**. Elysia is a good counterpart to Hono:
- native Bun, end-to-end TypeScript via TypeBox (`t.Object`, `t.String`, …)
- built-in OpenAPI generation via `@elysiajs/openapi` (`provider: 'swagger-ui'`)
- lifecycle hooks (`onRequest`, `onAfterResponse`) for cross-cutting concerns

The JWT verification logic is the same HMAC-SHA256 code as builds-service and web-bff — copied per the monorepo rule "no shared packages between services".
