# API Gateway

Single entry point for all frontend requests — routes to the correct microservice.

## Overview

| | |
|---|---|
| **Framework** | None (plain `Bun.serve`) |
| **Runtime** | Bun |
| **Port** | 4000 |

## Architecture

No framework — uses native `Bun.serve` and `fetch` to proxy requests.

```
src/
├── index.ts         # Server entry point
├── router.ts        # Path-prefix routing logic
├── proxy.ts         # Request forwarding with native fetch
└── middleware/       # CORS, auth token validation
```

## Routing

| Path prefix | Target |
|-------------|--------|
| `/api/parts/*` | `parts-service:4001` |
| `/api/builds/*` | `builds-service:4002` |
| `/api/users/*` | `users-service:4003` |

## Cross-Cutting Concerns

- **CORS** — configured for frontend origin
- **Auth** — validates JWT on protected routes, forwards user info to downstream services

## Development

```bash
bun install
bun run dev          # start with --watch
```

## Docker

```bash
docker compose up api-gateway   # from project root
```

**Status:** Not yet implemented.
