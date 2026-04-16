# auth-mfe

Next.js micro-frontend zone that owns `/auth/login`, `/auth/register`, `/auth/me`. On successful login/register it sets a JWT in the `jwt` cookie on the shared origin — every other zone reads that cookie (server-side via `cookies()`, client-side via `document.cookie`).

## Run

```bash
bun install
bun run dev           # http://localhost:3003/auth/login
```

Via the shell at http://localhost:3000/auth/login.

## Config

- [next.config.ts](next.config.ts) sets `assetPrefix: '/auth-static'`.
- Pages live at [src/app/auth/](src/app/auth/).
- `/auth` redirects to `/auth/login`.
- `/auth/me` is a server component — reads JWT via `cookies()`, redirects to `/auth/login` if missing; otherwise calls web-bff `/api/me` to render profile + builds summary.

## Tests

```bash
bun test
```
