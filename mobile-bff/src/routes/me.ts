import { Elysia, t } from "elysia";
import type {
  BuildsClient,
  ComponentInfo,
  PartsClient,
} from "../clients/types";
import type { HttpUsersClient } from "../clients/users-client";
import { authPlugin, requireAuth } from "../middleware/auth";

const SlimSummarySchema = t.Object({
  username: t.String(),
  buildCount: t.Number(),
  totalSpent: t.Number(),
});

const ErrorSchema = t.Object({ error: t.String() });

export const meRoutes = (
  users: HttpUsersClient,
  builds: BuildsClient,
  parts: PartsClient
) =>
  new Elysia({ prefix: "/api/me" })
    .use(authPlugin)
    .get(
      "/summary",
      async ({ userId, token, set }) => {
        const authErr = requireAuth({ userId, set });
        if (authErr) return authErr;

        const [profile, buildList] = await Promise.all([
          users.getProfile(token as string),
          builds.listBuilds(userId as string),
        ]);

        if (!profile) {
          set.status = 404;
          return { error: "User not found" };
        }

        const allIds = [...new Set(buildList.flatMap((b) => b.componentIds))];
        const components = allIds.length
          ? await parts.getComponentsByIds(allIds)
          : [];
        const byId = new Map(components.map((c) => [c.id, c]));

        const totalSpent = buildList.reduce((sum, b) => {
          const comps = b.componentIds
            .map((id) => byId.get(id))
            .filter((c): c is ComponentInfo => c !== undefined);
          return sum + comps.reduce((s, c) => s + c.price, 0);
        }, 0);

        return {
          username: profile.username,
          buildCount: buildList.length,
          totalSpent,
        };
      },
      {
        response: {
          200: SlimSummarySchema,
          401: ErrorSchema,
          404: ErrorSchema,
        },
        detail: {
          summary: "Get slim user summary",
          description:
            "Returns only {username, buildCount, totalSpent} — fan-out aggregation across users + builds + parts, slimmed for mobile.",
          tags: ["Me"],
          security: [{ bearerAuth: [] }],
        },
      }
    );
