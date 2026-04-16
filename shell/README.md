# shell

Next.js 16 app that serves as the **main zone** of the micro-frontend architecture. Hosts the landing page, shared header/footer, and forwards path-prefixed requests to the other zones via `rewrites` in [next.config.ts](next.config.ts).

## Run

```bash
bun install
bun run dev           # http://localhost:3000
```

With the other zones also running on 3001/3002/3003, the shell transparently proxies `/catalog`, `/builds`, `/auth` to them.

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3000` | HTTP port |
| `CATALOG_URL` | `http://localhost:3001` | catalog-mfe origin |
| `BUILDS_URL` | `http://localhost:3002` | builds-mfe origin |
| `AUTH_URL` | `http://localhost:3003` | auth-mfe origin |
| `NEXT_PUBLIC_WEB_BFF_URL` | `http://localhost:4004` | web-bff URL for browser fetches |
| `WEB_BFF_URL` | `http://localhost:4004` | web-bff URL for server-component fetches |

## Layout

- [src/app/page.tsx](src/app/page.tsx) — landing with zone cards
- [src/components/Header.tsx](src/components/Header.tsx) — shared nav, reads JWT cookie, shows Log in or user email
- [src/components/Footer.tsx](src/components/Footer.tsx) — shared footer
- [src/lib/auth.ts](src/lib/auth.ts) / [src/lib/auth-client.ts](src/lib/auth-client.ts) — JWT cookie helpers (server / client)
- [src/lib/bff.ts](src/lib/bff.ts) — fetch wrapper picking `NEXT_PUBLIC_WEB_BFF_URL` vs `WEB_BFF_URL`

## Tests

```bash
bun test
```

Uses `bun:test` + `@happy-dom/global-registrator` + `@testing-library/react`.
