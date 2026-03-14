import {
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const componentTypeEnum = pgEnum("component_type", [
  "CPU",
  "GPU",
  "RAM",
  "Storage",
  "Motherboard",
  "PSU",
  "Case",
  "Cooling",
]);

export const components = pgTable("components", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  brand: text().notNull(),
  type: componentTypeEnum().notNull(),
  price: real().notNull(),
  specs: jsonb().$type<Record<string, string>>().notNull().default({}),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});
