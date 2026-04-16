import { Elysia, t } from "elysia";
import type { ComponentInfo, PartsClient } from "../clients/types";

const SlimComponentSchema = t.Object({
  id: t.String(),
  name: t.String(),
  type: t.String(),
  price: t.Number(),
  brand: t.String(),
});

const SlimComponentDetailSchema = t.Intersect([
  SlimComponentSchema,
  t.Object({
    topSpecs: t.Record(t.String(), t.String()),
  }),
]);

function slim(c: ComponentInfo) {
  return {
    id: c.id,
    name: c.name,
    type: c.type,
    price: c.price,
    brand: c.brand,
  };
}

function topThreeSpecs(specs: Record<string, string>): Record<string, string> {
  const entries = Object.entries(specs).slice(0, 3);
  return Object.fromEntries(entries);
}

export const catalogRoutes = (parts: PartsClient) =>
  new Elysia({ prefix: "/api/catalog" })
    .get(
      "/",
      async ({ query }) => {
        const components = await parts.listComponents(query.type);
        return components.map(slim);
      },
      {
        query: t.Object({
          type: t.Optional(t.String()),
        }),
        response: t.Array(SlimComponentSchema),
        detail: {
          summary: "List components (slim)",
          description:
            "Returns only id, name, type, price, brand — no specs, no timestamps. Optimized for mobile list views.",
          tags: ["Catalog"],
        },
      }
    )
    .get(
      "/:id",
      async ({ params, set }) => {
        const component = await parts.getComponent(params.id);
        if (!component) {
          set.status = 404;
          return { error: "Component not found" };
        }
        return { ...slim(component), topSpecs: topThreeSpecs(component.specs) };
      },
      {
        params: t.Object({ id: t.String() }),
        response: {
          200: SlimComponentDetailSchema,
          404: t.Object({ error: t.String() }),
        },
        detail: {
          summary: "Get component detail (slim)",
          description:
            "Returns slim component with only top 3 specs. No related components.",
          tags: ["Catalog"],
        },
      }
    );
