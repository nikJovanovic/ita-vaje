import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import type { BuildService } from "../application/build-service";
import { authMiddleware } from "./auth-middleware";

const ComponentInfoSchema = v.object({
  id: v.string(),
  name: v.string(),
  brand: v.string(),
  type: v.string(),
  price: v.number(),
});

const BuildSchema = v.object({
  id: v.string(),
  name: v.string(),
  userId: v.string(),
  componentIds: v.array(v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
});

const BuildWithComponentsSchema = v.object({
  ...BuildSchema.entries,
  components: v.array(ComponentInfoSchema),
  totalPrice: v.number(),
});

const CreateBuildSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
  componentIds: v.array(v.string()),
});

type AuthEnv = { Variables: { userId: string; email: string } };

export const buildRoutes = (service: BuildService) => {
  const app = new Hono<AuthEnv>();

  app.get(
    "/",
    describeRoute({
      description: "List all builds, optionally filtered by userId",
      tags: ["Builds"],
      responses: {
        200: {
          description: "List of builds",
          content: {
            "application/json": {
              schema: resolver(v.array(BuildSchema)),
            },
          },
        },
      },
    }),
    async (c) => {
      const userId = c.req.query("userId");
      const builds = await service.findAll(userId);
      return c.json(builds);
    },
  );

  app.get(
    "/:id",
    describeRoute({
      description: "Get a build by ID with component details via gRPC",
      tags: ["Builds"],
      responses: {
        200: {
          description: "Build with component details",
          content: {
            "application/json": {
              schema: resolver(BuildWithComponentsSchema),
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
      const build = await service.findById(c.req.param("id"));
      if (!build) {
        return c.json({ error: "Build not found" }, 404);
      }
      return c.json(build);
    },
  );

  app.post(
    "/",
    describeRoute({
      description: "Create a new build",
      tags: ["Builds"],
      responses: {
        201: {
          description: "Created build",
          content: {
            "application/json": {
              schema: resolver(BuildSchema),
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
      const userId = c.get("userId");
      const build = await service.create({ ...body, userId });
      return c.json(build, 201);
    },
  );

  app.delete(
    "/:id",
    describeRoute({
      description: "Delete a build",
      tags: ["Builds"],
      responses: {
        204: { description: "Build deleted" },
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
      const deleted = await service.delete(c.req.param("id"));
      if (!deleted) {
        return c.json({ error: "Build not found" }, 404);
      }
      return c.body(null, 204);
    },
  );

  return app;
};
