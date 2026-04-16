import { Elysia, t } from "elysia";
import type {
  BuildsClient,
  ComponentInfo,
  PartsClient,
} from "../clients/types";
import { authPlugin, requireAuth } from "../middleware/auth";

const SlimBuildSchema = t.Object({
  id: t.String(),
  name: t.String(),
  totalPrice: t.Number(),
});

const SlimBuildDetailSchema = t.Object({
  id: t.String(),
  name: t.String(),
  totalPrice: t.Number(),
  items: t.Array(
    t.Object({
      id: t.String(),
      name: t.String(),
      price: t.Number(),
    })
  ),
});

const ErrorSchema = t.Object({ error: t.String() });

export const buildsRoutes = (builds: BuildsClient, parts: PartsClient) =>
  new Elysia({ prefix: "/api/builds" })
    .use(authPlugin)
    .get(
      "/",
      async ({ query }) => {
        const list = await builds.listBuilds(query.userId);
        const allIds = [...new Set(list.flatMap((b) => b.componentIds))];
        const components = allIds.length
          ? await parts.getComponentsByIds(allIds)
          : [];
        const byId = new Map(components.map((c) => [c.id, c]));

        return list.map((b) => {
          const comps = b.componentIds
            .map((id) => byId.get(id))
            .filter((c): c is ComponentInfo => c !== undefined);
          return {
            id: b.id,
            name: b.name,
            totalPrice: comps.reduce((sum, c) => sum + c.price, 0),
          };
        });
      },
      {
        query: t.Object({ userId: t.Optional(t.String()) }),
        response: t.Array(SlimBuildSchema),
        detail: {
          summary: "List builds (slim)",
          description:
            "Returns only id, name, totalPrice — no userId, componentIds, thumbnails.",
          tags: ["Builds"],
        },
      }
    )
    .get(
      "/:id",
      async ({ params, set }) => {
        const build = await builds.getBuild(params.id);
        if (!build) {
          set.status = 404;
          return { error: "Build not found" };
        }
        return {
          id: build.id,
          name: build.name,
          totalPrice: build.totalPrice,
          items: build.components.map((c) => ({
            id: c.id,
            name: c.name,
            price: c.price,
          })),
        };
      },
      {
        params: t.Object({ id: t.String() }),
        response: {
          200: SlimBuildDetailSchema,
          404: ErrorSchema,
        },
        detail: {
          summary: "Get build detail (slim)",
          description:
            "Returns slim build with a flat items array of {id,name,price}. No specs, no breakdown, no userId, no timestamps.",
          tags: ["Builds"],
        },
      }
    )
    .post(
      "/",
      async ({ body, userId, token, set }) => {
        const authErr = requireAuth({ userId, set });
        if (authErr) return authErr;

        const created = await builds.createBuild(token as string, body);
        const enriched = await builds.getBuild(created.id);
        if (!enriched) {
          return {
            id: created.id,
            name: created.name,
            totalPrice: 0,
            items: [],
          };
        }
        return {
          id: enriched.id,
          name: enriched.name,
          totalPrice: enriched.totalPrice,
          items: enriched.components.map((c) => ({
            id: c.id,
            name: c.name,
            price: c.price,
          })),
        };
      },
      {
        body: t.Object({
          name: t.String({ minLength: 1 }),
          componentIds: t.Array(t.String()),
        }),
        response: {
          200: SlimBuildDetailSchema,
          401: ErrorSchema,
        },
        detail: {
          summary: "Create build (slim response)",
          description: "Requires JWT. Returns slim build shape.",
          tags: ["Builds"],
          security: [{ bearerAuth: [] }],
        },
      }
    )
    .delete(
      "/:id",
      async ({ params, userId, token, set }) => {
        const authErr = requireAuth({ userId, set });
        if (authErr) return authErr;

        const ok = await builds.deleteBuild(token as string, params.id);
        if (!ok) {
          set.status = 404;
          return { error: "Build not found" };
        }
        set.status = 204;
        return null;
      },
      {
        params: t.Object({ id: t.String() }),
        response: {
          204: t.Null(),
          401: ErrorSchema,
          404: ErrorSchema,
        },
        detail: {
          summary: "Delete build",
          description:
            "Requires JWT. Returns 204 No Content (no body) — slimmer than web-bff's {deleted: true}.",
          tags: ["Builds"],
          security: [{ bearerAuth: [] }],
        },
      }
    );
