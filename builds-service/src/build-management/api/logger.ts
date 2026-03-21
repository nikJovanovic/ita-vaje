import type { MiddlewareHandler } from "hono";

export const logger: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  const url = new URL(c.req.url);
  console.log(
    `[${new Date().toISOString()}] ${c.req.method} ${url.pathname} ${c.res.status} ${duration}ms`,
  );
};
