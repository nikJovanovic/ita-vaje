import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import * as v from "valibot";
import type { ComponentInfo, PartsClient } from "../clients/types";

const ComponentSchema = v.object({
  id: v.string(),
  name: v.string(),
  brand: v.string(),
  type: v.string(),
  price: v.number(),
  specs: v.record(v.string(), v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
});

const ComponentDetailSchema = v.object({
  ...ComponentSchema.entries,
  related: v.array(ComponentSchema),
});

export const catalogRoutes = (parts: PartsClient) => {
  const app = new Hono();

  app.get(
    "/",
    describeRoute({
      description:
        "List all components (web-rich payload: full specs, all metadata)",
      tags: ["Catalog"],
      responses: {
        200: {
          description: "Array of components with full specs",
          content: {
            "application/json": {
              schema: resolver(v.array(ComponentSchema)),
            },
          },
        },
      },
    }),
    async (c) => {
      const type = c.req.query("type");
      const components = await parts.listComponents(type);
      return c.json(components);
    }
  );

  app.get(
    "/:id",
    describeRoute({
      description:
        "Get a component by id, enriched with related components (same type, ±20% price) — fan-out composition",
      tags: ["Catalog"],
      responses: {
        200: {
          description: "Component detail with related components",
          content: {
            "application/json": {
              schema: resolver(ComponentDetailSchema),
            },
          },
        },
        404: {
          description: "Component not found",
          content: {
            "application/json": {
              schema: resolver(v.object({ error: v.string() })),
            },
          },
        },
      },
    }),
    async (c) => {
      const component = await parts.getComponent(c.req.param("id"));
      if (!component) return c.json({ error: "Component not found" }, 404);

      const sameType = await parts.listComponents(component.type);
      const related = sameType
        .filter(
          (other: ComponentInfo) =>
            other.id !== component.id &&
            Math.abs(other.price - component.price) <= component.price * 0.2
        )
        .slice(0, 5);

      return c.json({ ...component, related });
    }
  );

  return app;
};
