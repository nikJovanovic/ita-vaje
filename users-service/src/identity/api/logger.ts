import type { Middleware } from "@oak/oak";

export const logger: Middleware = async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(
    `[${
      new Date().toISOString()
    }] ${ctx.request.method} ${ctx.request.url.pathname} ${ctx.response.status} ${duration}ms`,
  );
};
