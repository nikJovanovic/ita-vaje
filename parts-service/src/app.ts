import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { componentRoutes } from "./catalog/api/component-routes";
import { logger } from "./catalog/api/logger";
import { ComponentService } from "./catalog/application/component-service";
import type { ComponentRepository } from "./catalog/domain/component-repository";

export const createApp = (repository: ComponentRepository) => {
  const service = new ComponentService(repository);

  return new Elysia()
    .use(logger)
    .use(
      openapi({
        documentation: {
          info: {
            title: "Parts Service",
            version: "1.0.0",
            description: "PC component catalog microservice",
          },
          tags: [
            {
              name: "Components",
              description: "PC component CRUD operations",
            },
          ],
        },
      }),
    )
    .get("/health", () => ({ status: "ok" }), {
      detail: { summary: "Health check", tags: ["Health"] },
    })
    .use(componentRoutes(service));
};
