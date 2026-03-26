import { Application } from "@oak/oak";
import { Router } from "@oak/oak";
import type { AuthService } from "./identity/application/auth-service.ts";
import { logger } from "./identity/api/logger.ts";
import { openApiRouter } from "./identity/api/openapi.ts";
import { createUserRouter } from "./identity/api/user-routes.ts";

export function createApp(service: AuthService): Application {
  const app = new Application();

  app.use(logger);

  const healthRouter = new Router();
  healthRouter.get("/health", (ctx) => {
    ctx.response.body = { status: "ok" };
  });

  const userRouter = createUserRouter(service);
  const oaRouter = openApiRouter();

  app.use(healthRouter.routes());
  app.use(healthRouter.allowedMethods());
  app.use(userRouter.routes());
  app.use(userRouter.allowedMethods());
  app.use(oaRouter.routes());
  app.use(oaRouter.allowedMethods());

  return app;
}
