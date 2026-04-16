# catalog-mfe

Next.js micro-frontend zone that owns `/catalog` and `/catalog/:id`. Fetches from [web-bff](../web-bff/) and renders rich component cards + fan-out related components.

## Run

```bash
bun install
bun run dev           # http://localhost:3001/catalog
```

Via the shell at http://localhost:3000/catalog (rewrites handle the proxy).

## Config

- [next.config.ts](next.config.ts) sets `assetPrefix: '/catalog-static'` so `_next/*` assets don't collide with other zones on the shared origin.
- Pages live at [src/app/catalog/](src/app/catalog/).

## Tests

```bash
bun test
```
