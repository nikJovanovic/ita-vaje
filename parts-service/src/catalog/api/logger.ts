import { Elysia } from "elysia";

export const logger = new Elysia({ name: "logger" })
  .onRequest(({ store }) => {
    (store as Record<string, unknown>).startTime = Date.now();
  })
  .onAfterResponse(({ request, set, store }) => {
    const duration =
      Date.now() - ((store as Record<string, unknown>).startTime as number);
    const url = new URL(request.url);
    console.log(
      `[${new Date().toISOString()}] ${request.method} ${url.pathname} ${set.status ?? 200} ${duration}ms`,
    );
  })
  .onError(({ request, error }) => {
    const url = new URL(request.url);
    console.error(
      `[${new Date().toISOString()}] ERROR ${request.method} ${url.pathname} ${error.message}`,
    );
  });
