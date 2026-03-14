import { Elysia, t } from "elysia";
import type { ComponentService } from "../application/component-service";
import { COMPONENT_TYPES } from "../domain/component";

const ComponentTypeEnum = t.Union(
  COMPONENT_TYPES.map((type) => t.Literal(type)),
);

const ComponentSchema = t.Object({
  id: t.String({ format: "uuid" }),
  name: t.String(),
  brand: t.String(),
  type: ComponentTypeEnum,
  price: t.Number(),
  specs: t.Record(t.String(), t.String()),
  createdAt: t.String(),
  updatedAt: t.String(),
});

const CreateComponentSchema = t.Object({
  name: t.String({ minLength: 1 }),
  brand: t.String({ minLength: 1 }),
  type: ComponentTypeEnum,
  price: t.Number({ minimum: 0 }),
  specs: t.Record(t.String(), t.String()),
});

const UpdateComponentSchema = t.Partial(CreateComponentSchema);

export const componentRoutes = (service: ComponentService) =>
  new Elysia({ prefix: "/components" })
    .get(
      "/",
      async ({ query }) => {
        return service.findAll(query.type);
      },
      {
        query: t.Object({
          type: t.Optional(ComponentTypeEnum),
        }),
        response: t.Array(ComponentSchema),
        detail: {
          summary: "List components",
          description: "Get all components, optionally filtered by type",
          tags: ["Components"],
        },
      },
    )
    .get(
      "/:id",
      async ({ params, set }) => {
        const component = await service.findById(params.id);
        if (!component) {
          set.status = 404;
          return { error: "Component not found" };
        }
        return component;
      },
      {
        params: t.Object({ id: t.String({ format: "uuid" }) }),
        response: {
          200: ComponentSchema,
          404: t.Object({ error: t.String() }),
        },
        detail: {
          summary: "Get component by ID",
          tags: ["Components"],
        },
      },
    )
    .post(
      "/",
      async ({ body, set }) => {
        set.status = 201;
        return service.create(body);
      },
      {
        body: CreateComponentSchema,
        response: { 201: ComponentSchema },
        detail: {
          summary: "Create component",
          tags: ["Components"],
        },
      },
    )
    .patch(
      "/:id",
      async ({ params, body, set }) => {
        const updated = await service.update(params.id, body);
        if (!updated) {
          set.status = 404;
          return { error: "Component not found" };
        }
        return updated;
      },
      {
        params: t.Object({ id: t.String({ format: "uuid" }) }),
        body: UpdateComponentSchema,
        response: {
          200: ComponentSchema,
          404: t.Object({ error: t.String() }),
        },
        detail: {
          summary: "Update component",
          tags: ["Components"],
        },
      },
    )
    .delete(
      "/:id",
      async ({ params, set }) => {
        const deleted = await service.delete(params.id);
        if (!deleted) {
          set.status = 404;
          return { error: "Component not found" };
        }
        set.status = 204;
      },
      {
        params: t.Object({ id: t.String({ format: "uuid" }) }),
        response: {
          204: t.Void(),
          404: t.Object({ error: t.String() }),
        },
        detail: {
          summary: "Delete component",
          tags: ["Components"],
        },
      },
    );
