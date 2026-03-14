# Frontend

Web interface for PC Build Planner — browse components, assemble builds, manage account.

## Overview

| | |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Runtime** | Bun |
| **UI** | React 19, Tailwind CSS v4 |
| **Port** | 3000 |

## Architecture

```
src/
├── app/             # App Router pages and layouts
├── components/      # Reusable UI components
└── lib/             # API client, utilities
```

All API calls go through the API gateway at `localhost:4000`.

## Development

```bash
bun install
bun run dev          # start dev server on :3000
```

## Building

```bash
bun run build        # production build
bun run start        # start production server
```

## Linting

```bash
bun run lint         # biome check
bun run format       # biome format --write
```

## Docker

```bash
docker compose up frontend   # from project root
```

**Status:** Scaffolded, not yet implemented.
