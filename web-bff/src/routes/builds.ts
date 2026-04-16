import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import type { BuildsClient, ComponentInfo, PartsClient } from "../clients/types";
import { type AuthEnv, authMiddleware } from "../middleware/auth";

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

const BuildThumbnailSchema = v.object({
  id: v.string(),
  name: v.string(),
  type: v.string(),
});

const BuildListItemSchema = v.object({
  id: v.string(),
  name: v.string(),
  userId: v.string(),
  componentIds: v.array(v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
  thumbnails: v.array(BuildThumbnailSchema),
  totalPrice: v.number(),
});

const BuildDetailSchema = v.object({
  id: v.string(),
  name: v.string(),
  userId: v.string(),
  componentIds: v.array(v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
  components: v.array(ComponentSchema),
  totalPrice: v.number(),
  breakdown: v.record(v.string(), v.number()),
});

const CreateBuildSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
  componentIds: v.array(v.string()),
});

function buildBreakdown(components: ComponentInfo[]): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const c of components) {
    acc[c.type] = (acc[c.type] ?? 0) + c.price;
  }
  return acc;
}

export const buildRoutes = (builds: BuildsClient, parts: PartsClient) => {
  const app = new Hono<AuthEnv>();

  app.get(
    "/",
    describeRoute({
      description:
        "List builds with component thumbnails and totalPrice (web-rich shape). Fan-out: enriches each build with basic component info.",
      tags: ["Builds"],
      responses: {
        200: {
          description: "Array of builds with thumbnails",
          content: {
            "application/json": {
              schema: resolver(v.array(BuildListItemSchema)),
            },
          },
        },
      },
    }),
    async (c) => {
      const userId = c.req.query("userId");
      const buildList = await builds.listBuilds(userId);

      const allIds = [...new Set(buildList.flatMap((b) => b.componentIds))];
      const allComponents = allIds.length
        ? await parts.getComponentsByIds(allIds)
        : [];
      const byId = new Map(allComponents.map((c) => [c.id, c]));

      const enriched = buildList.map((b) => {
        const comps = b.componentIds
          .map((id) => byId.get(id))
          .filter((c): c is ComponentInfo => c !== undefined);
        return {
          ...b,
          thumbnails: comps.map((c) => ({ id: c.id, name: c.name, type: c.type })),
          totalPrice: comps.reduce((sum, c) => sum + c.price, 0),
        };
      });

      return c.json(enriched);
    }
  );

  app.get(
    "/:id",
    describeRoute({
      description:
        "Get a build with fully enriched components, totalPrice, and breakdown by category (web-rich shape).",
      tags: ["Builds"],
      responses: {
        200: {
          description: "Build with full components + breakdown",
          content: {
            "application/json": {
              schema: resolver(BuildDetailSchema),
            },
          },
        },
        404: {
          description: "Build not found",
          content: {
            "application/json": {
              schema: resolver(v.object({ error: v.string() })),
            },
          },
        },
      },
    }),
    async (c) => {
      const build = await builds.getBuild(c.req.param("id"));
      if (!build) return c.json({ error: "Build not found" }, 404);

      return c.json({
        ...build,
        breakdown: buildBreakdown(build.components),
      });
    }
  );

  app.post(
    "/",
    describeRoute({
      description: "Create a new build (JWT required)",
      tags: ["Builds"],
      responses: {
        201: {
          description: "Created build with full component details",
          content: {
            "application/json": {
              schema: resolver(BuildDetailSchema),
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: resolver(v.object({ error: v.string() })),
            },
          },
        },
        422: {
          description: "Validation error",
          content: {
            "application/json": {
              schema: resolver(v.object({ error: v.string() })),
            },
          },
        },
      },
    }),
    authMiddleware,
    validator("json", CreateBuildSchema),
    async (c) => {
      const body = c.req.valid("json");
      const token = c.get("token");

      const created = await builds.createBuild(token, body);
      const enriched = await builds.getBuild(created.id);
      if (!enriched) return c.json(created, 201);

      return c.json(
        { ...enriched, breakdown: buildBreakdown(enriched.components) },
        201
      );
    }
  );

  app.delete(
    "/:id",
    describeRoute({
      description: "Delete a build (JWT required)",
      tags: ["Builds"],
      responses: {
        200: {
          description: "Deletion confirmation",
          content: {
            "application/json": {
              schema: resolver(v.object({ deleted: v.boolean() })),
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: resolver(v.object({ error: v.string() })),
            },
          },
        },
        404: {
          description: "Build not found",
          content: {
            "application/json": {
              schema: resolver(v.object({ error: v.string() })),
            },
          },
        },
      },
    }),
    authMiddleware,
    async (c) => {
      const token = c.get("token");
      const ok = await builds.deleteBuild(token, c.req.param("id"));
      if (!ok) return c.json({ error: "Build not found" }, 404);
      return c.json({ deleted: true });
    }
  );

  return app;
};
