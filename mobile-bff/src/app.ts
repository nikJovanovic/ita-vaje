import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import type { BuildsClient, PartsClient, UsersClient } from "./clients/types";
import { authRoutes } from "./routes/auth";
import { buildsRoutes } from "./routes/builds";
import { catalogRoutes } from "./routes/catalog";
import { meRoutes } from "./routes/me";

export interface AppDeps {
  parts: PartsClient;
  builds: BuildsClient;
  users: UsersClient;
}

export const createApp = (deps: AppDeps) =>
  new Elysia()
    .onRequest(({ request }) => {
      (request as { _start?: number })._start = Date.now();
    })
    .onAfterResponse(({ request, set }) => {
      const start = (request as { _start?: number })._start ?? Date.now();
      const url = new URL(request.url);
      console.log(
        `[${new Date().toISOString()}] [mobile-bff] ${request.method} ${url.pathname} ${set.status ?? 200} ${Date.now() - start}ms`
      );
    })
    .use(
      cors({
        origin: true,
        allowedHeaders: ["Content-Type", "Authorization"],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      })
    )
    .use(
      openapi({
        provider: "swagger-ui",
        path: "/swagger",
        specPath: "/openapi",
        documentation: {
          info: {
            title: "Mobile BFF",
            version: "1.0.0",
            description:
              "Backend-for-Frontend serving mobile clients. Returns slim bandwidth-friendly payloads (no full specs, no timestamps, flat arrays). Calls parts-service (gRPC), builds-service (REST), users-service (REST).",
          },
          servers: [
            { url: "http://localhost:4005", description: "Local mobile-bff" },
          ],
          components: {
            securitySchemes: {
              bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
              },
            },
          },
        },
      })
    )
    .get("/health", () => ({ status: "ok", service: "mobile-bff" }))
    .use(catalogRoutes(deps.parts))
    .use(buildsRoutes(deps.builds, deps.parts))
    .use(authRoutes(deps.users))
    .use(meRoutes(deps.users, deps.builds, deps.parts));
