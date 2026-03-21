import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { openAPIRouteHandler } from "hono-openapi";
import { buildRoutes } from "./build-management/api/build-routes";
import { logger } from "./build-management/api/logger";
import { BuildService } from "./build-management/application/build-service";
import type { BuildRepository } from "./build-management/domain/build-repository";
import type { PartsClient } from "./build-management/domain/parts-client";

export const createApp = (
  repository: BuildRepository,
  partsClient: PartsClient,
) => {
  const service = new BuildService(repository, partsClient);
  const app = new Hono();

  app.use("*", logger);

  app.get("/health", (c) => c.json({ status: "ok" }));

  app.route("/builds", buildRoutes(service));

  app.get(
    "/openapi",
    openAPIRouteHandler(app, {
      documentation: {
        info: {
          title: "Builds Service",
          version: "1.0.0",
          description: "PC build assembly microservice",
        },
        servers: [
          { url: "http://localhost:4002", description: "Local Server" },
        ],
      },
    }),
  );

  app.get("/scalar", Scalar({ url: "/openapi" }));

  return app;
};
