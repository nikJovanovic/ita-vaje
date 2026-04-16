# builds-mfe

Next.js micro-frontend zone that owns `/builds`, `/builds/new`, `/builds/:id`. Lists and manages PC builds. Create + delete require a JWT cookie (set by auth-mfe).

## Run

```bash
bun install
bun run dev           # http://localhost:3002/builds
```

Via the shell at http://localhost:3000/builds.

## Config

- [next.config.ts](next.config.ts) sets `assetPrefix: '/builds-static'`.
- Pages live at [src/app/builds/](src/app/builds/).
- `/builds/new` is a server component that redirects unauthenticated users to `/auth/login`.
- `DELETE` uses a client component ([src/app/builds/[id]/delete-button.tsx](src/app/builds/[id]/delete-button.tsx)) that reads the JWT from `document.cookie` and forwards it to web-bff.

## Tests

```bash
bun test
```
