# PC Build Planner

A school microservices project — a web application that lets users browse PC components and assemble named PC builds.

---

## Architecture

The system is composed of five parts: an API gateway, three backend microservices each with its own PostgreSQL database, and a Next.js frontend.

```
                        ┌─────────────────┐
                        │    Frontend     │
                        │   (Next.js)     │
                        └────────┬────────┘
                                 │ HTTP
                        ┌────────▼────────┐
                        │   API Gateway   │
                        └────┬──────┬─────┘
                             │      │      │
               ┌─────────────┘      │      └──────────────┐
               │                    │                      │
      ┌────────▼───────┐  ┌─────────▼──────┐  ┌──────────▼─────┐
      │  parts-service │  │ builds-service │  │  users-service  │
      │   (catalog)    │  │(build-mgmt)    │  │  (identity)     │
      └────────┬───────┘  └───────┬────────┘  └──────────┬──────┘
               │                  │                       │
      ┌────────▼───────┐  ┌───────▼────────┐  ┌──────────▼──────┐
      │   catalog_db   │  │   builds_db    │  │    users_db     │
      │  (PostgreSQL)  │  │  (PostgreSQL)  │  │  (PostgreSQL)   │
      └────────────────┘  └────────────────┘  └─────────────────┘
```

> `builds-service` also calls `parts-service` directly over HTTP to resolve component details when assembling a build.

---

## Services

| Service          | Business concept | Responsibility                                                                   |
| ---------------- | ---------------- | -------------------------------------------------------------------------------- |
| `api-gateway`    | Gateway          | Single entry point — routes requests to the correct microservice                 |
| `parts-service`  | Catalog          | CRUD for PC components (CPU, GPU, RAM, Storage, Motherboard, PSU, Case, Cooling) |
| `builds-service` | Build management | Create, retrieve and delete named PC builds belonging to a user                  |
| `users-service`  | Identity         | User registration, login and JWT issuance                                        |
| `frontend`       | UI               | Next.js App Router web interface                                                 |

---

## Database

Each microservice owns its own PostgreSQL database. All databases run on a single shared PostgreSQL server in Docker — no service may query another service's database directly.

| Service          | Database     |
| ---------------- | ------------ |
| `parts-service`  | `catalog_db` |
| `builds-service` | `builds_db`  |
| `users-service`  | `users_db`   |

---

## Tech Stack

| Layer           | Technology                                        |
| --------------- | ------------------------------------------------- |
| Frontend        | Next.js 16, React 19, Tailwind CSS v4, TypeScript |
| Backend         | TBD                                               |
| Database        | PostgreSQL (Docker)                               |
| Package manager | Bun                                               |

---

## Project Structure

```
ita-vaje/
├── api-gateway/        # Request routing and auth middleware
├── parts-service/      # PC component catalog
├── builds-service/     # PC build assembly and storage
├── users-service/      # Authentication and user profiles
└── frontend/           # Next.js web application
```

Each backend service follows **Clean Architecture**:

```
<service>/src/<business-concept>/
├── domain/          # Entities and interfaces — no framework dependencies
├── application/     # Use cases — pure business logic
├── infrastructure/  # Database implementations
└── api/             # HTTP route handlers
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.x
- [Docker](https://www.docker.com) (for PostgreSQL)

### Frontend

```bash
cd frontend
bun install
bun run dev
```

### Backend services

```bash
cd <service-name>
bun install
bun run dev
```

### Parts Database
`https://github.com/buildcores/buildcores-open-db`
