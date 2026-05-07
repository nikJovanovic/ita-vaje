import { swaggerUI } from "@hono/swagger-ui";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { openAPIRouteHandler } from "hono-openapi";
import type { BuildsClient, PartsClient, UsersClient } from "./clients/types";
import { logger } from "./middleware/logger";
import { authRoutes } from "./routes/auth";
import { buildRoutes } from "./routes/builds";
import { catalogRoutes } from "./routes/catalog";
import { meRoutes } from "./routes/me";

export interface AppDeps {
  parts: PartsClient;
  builds: BuildsClient;
  users: UsersClient;
}

export const createApp = (deps: AppDeps) => {
  const app = new Hono();

  app.use("*", logger);
  app.use(
    "*",
    cors({
      origin: "*",
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  );

  app.get("/health", (c) => c.json({ status: "ok", service: "web-bff" }));

  app.route("/api/catalog", catalogRoutes(deps.parts));
  app.route("/api/builds", buildRoutes(deps.builds, deps.parts));
  app.route("/api/auth", authRoutes(deps.users));
  app.route("/api/me", meRoutes(deps.users, deps.builds, deps.parts));

  app.get(
    "/openapi",
    openAPIRouteHandler(app, {
      documentation: {
        info: {
          title: "Web BFF",
          version: "1.0.0",
          description:
            "Backend-for-Frontend serving the Next.js web client. Returns rich composed payloads (full specs, component thumbnails, breakdowns). Calls parts-service (gRPC), builds-service (REST), users-service (REST).",
        },
        servers: [
          { url: "http://localhost:4004", description: "Local web-bff" },
        ],
      },
    })
  );

  app.get("/swagger", swaggerUI({ url: "/openapi" }));

  return app;
};
