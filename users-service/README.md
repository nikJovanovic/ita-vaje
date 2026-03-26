# Users Service

Identity microservice — handles user registration, login, and JWT token
issuance.

## Overview

|               |                         |
| ------------- | ----------------------- |
| **Framework** | Oak                     |
| **Runtime**   | Deno                    |
| **Database**  | PostgreSQL (`users_db`) |
| **ORM**       | Drizzle                 |
| **Port**      | 4003                    |

## Architecture

```
src/identity/
├── domain/          # User entity, repository interface
├── application/     # AuthService — business logic
├── infrastructure/  # Drizzle schema, PostgreSQL repository, migrations
└── api/             # Oak route handlers, logger middleware
```

## API Endpoints

Base path: `/api/users`

| Method | Path                  | Description                              |
| ------ | --------------------- | ---------------------------------------- |
| `POST` | `/api/users/register` | Register a new user                      |
| `POST` | `/api/users/login`    | Login and receive JWT                    |
| `GET`  | `/api/users/me`       | Get current user profile (requires auth) |

### OpenAPI / Swagger

Available at `/swagger` when the service is running.

## Development

```bash
deno task dev        # start with --watch
```

## Database

```bash
deno task db:generate  # generate Drizzle migrations
deno task db:migrate   # apply migrations
```

## Testing

```bash
deno test            # run all tests
```

## Linting

```bash
deno lint            # built-in Deno linter
deno fmt             # built-in Deno formatter
```

## Docker

```bash
docker compose up users-service   # from project root
```

**Status:** Not yet implemented.
