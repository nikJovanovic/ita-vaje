import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import * as v from "valibot";
import type {
  BuildsClient,
  ComponentInfo,
  PartsClient,
} from "../clients/types";
import type { HttpUsersClient } from "../clients/users-client";
import { type AuthEnv, authMiddleware } from "../middleware/auth";

const MeSchema = v.object({
  user: v.object({
    id: v.string(),
    email: v.string(),
    username: v.string(),
    createdAt: v.string(),
  }),
  builds: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      totalPrice: v.number(),
      thumbnails: v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          type: v.string(),
        })
      ),
    })
  ),
});

export const meRoutes = (
  users: HttpUsersClient,
  builds: BuildsClient,
  parts: PartsClient
) => {
  const app = new Hono<AuthEnv>();

  app.get(
    "/",
    authMiddleware,
    describeRoute({
      description:
        "Aggregated user profile + their builds with component thumbnails (fan-out: users-service + builds-service + parts-service)",
      tags: ["Me"],
      responses: {
        200: {
          description: "User profile with build summaries",
          content: {
            "application/json": {
              schema: resolver(MeSchema),
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
      },
    }),
    async (c) => {
      const token = c.get("token");
      const userId = c.get("userId");

      const [profile, buildList] = await Promise.all([
        users.getProfile(token),
        builds.listBuilds(userId),
      ]);

      if (!profile) return c.json({ error: "User not found" }, 404);

      const allIds = [...new Set(buildList.flatMap((b) => b.componentIds))];
      const allComponents = allIds.length
        ? await parts.getComponentsByIds(allIds)
        : [];
      const byId = new Map(allComponents.map((c) => [c.id, c]));

      const enrichedBuilds = buildList.map((b) => {
        const comps = b.componentIds
          .map((id) => byId.get(id))
          .filter((c): c is ComponentInfo => c !== undefined);
        return {
          id: b.id,
          name: b.name,
          totalPrice: comps.reduce((sum, c) => sum + c.price, 0),
          thumbnails: comps.map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
          })),
        };
      });

      return c.json({ user: profile, builds: enrichedBuilds });
    }
  );

  return app;
};
