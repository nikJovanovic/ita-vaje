# web-bff

Backend-for-Frontend for the Next.js web client. Written in **Bun + Hono**.

Returns **rich, composed payloads** optimized for a desktop browser: full component specs, related-component fan-out, category breakdowns, thumbnail arrays.

Calls downstream services:
- `parts-service` via **gRPC** (`PARTS_GRPC_HOST`)
- `builds-service` via **REST** (`BUILDS_SERVICE_URL`)
- `users-service` via **REST** (`USERS_SERVICE_URL`)

No database. Stateless.

## Run

```bash
bun install
bun run dev           # http://localhost:4004
```

Swagger UI: http://localhost:4004/swagger
OpenAPI spec: http://localhost:4004/openapi

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `4004` | HTTP port |
| `JWT_SECRET` | `super-secret-dev-key` | Shared with users-service + builds-service |
| `PARTS_GRPC_HOST` | `localhost:50051` | parts-service gRPC |
| `PARTS_PROTO_PATH` | `../parts-service/proto/parts.proto` | proto file location |
| `BUILDS_SERVICE_URL` | `http://localhost:4002` | builds-service REST |
| `USERS_SERVICE_URL` | `http://localhost:4003` | users-service REST |

## Endpoints

| Method | Path | Auth | Shape highlight |
|--------|------|------|-----------------|
| GET | `/health` | — | `{status, service}` |
| GET | `/api/catalog` | — | full components with `specs`, `createdAt`, `updatedAt` |
| GET | `/api/catalog/:id` | — | full component + `related[]` (same type, ±20% price, ≤5 items) |
| GET | `/api/builds` | — | full build + `thumbnails[]` + `totalPrice` |
| GET | `/api/builds/:id` | — | full components + `totalPrice` + `breakdown` by category |
| POST | `/api/builds` | JWT | returns enriched build with components + breakdown |
| DELETE | `/api/builds/:id` | JWT | `{deleted: true}` |
| POST | `/api/auth/register` | — | `{user, token}` |
| POST | `/api/auth/login` | — | `{user, token}` |
| GET | `/api/me` | JWT | profile + builds with thumbnails + totalPrice each |

## Example — rich build detail

```bash
TOKEN=$(curl -sX POST http://localhost:4004/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@b","username":"u","password":"secret123"}' | jq -r .token)

# create a build
curl -sX POST http://localhost:4004/api/builds \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Gaming Beast","componentIds":["<cpu-id>","<gpu-id>"]}'

# get detail — note `components`, `breakdown`, `totalPrice` all present
curl -s http://localhost:4004/api/builds/<build-id>
# {
#   "id": "...",
#   "name": "Gaming Beast",
#   "components": [{"id":"...","name":"...","specs":{...}, ...}, ...],
#   "totalPrice": 1650,
#   "breakdown": {"CPU": 450, "GPU": 1200}
# }
```

Compare the same call against `mobile-bff` (port 4005) to see the slim variant.

## Tests

```bash
bun test
```

22 endpoint tests with fake downstream clients. No database required.
