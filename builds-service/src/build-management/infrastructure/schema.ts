import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const builds = pgTable("builds", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

export const buildComponents = pgTable("build_components", {
  id: uuid().defaultRandom().primaryKey(),
  buildId: uuid("build_id")
    .notNull()
    .references(() => builds.id, { onDelete: "cascade" }),
  componentId: uuid("component_id").notNull(),
  order: integer().notNull().default(0),
});

export const buildsRelations = relations(builds, ({ many }) => ({
  buildComponents: many(buildComponents),
}));

export const buildComponentsRelations = relations(
  buildComponents,
  ({ one }) => ({
    build: one(builds, {
      fields: [buildComponents.buildId],
      references: [builds.id],
    }),
  }),
);
