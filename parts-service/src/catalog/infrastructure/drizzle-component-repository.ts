import { eq, inArray } from "drizzle-orm";
import type {
  Component,
  ComponentType,
  CreateComponentInput,
  UpdateComponentInput,
} from "../domain/component";
import type { ComponentRepository } from "../domain/component-repository";
import type { db as DbType } from "./db";
import { components } from "./schema";

export class DrizzleComponentRepository implements ComponentRepository {
  constructor(private db: typeof DbType) {}

  async findAll(type?: ComponentType): Promise<Component[]> {
    if (type) {
      return this.db.select().from(components).where(eq(components.type, type));
    }
    return this.db.select().from(components);
  }

  async findByIds(ids: string[]): Promise<Component[]> {
    if (ids.length === 0) return [];
    return this.db.select().from(components).where(inArray(components.id, ids));
  }

  async findById(id: string): Promise<Component | null> {
    const rows = await this.db
      .select()
      .from(components)
      .where(eq(components.id, id));
    return rows[0] ?? null;
  }

  async create(input: CreateComponentInput): Promise<Component> {
    const rows = await this.db.insert(components).values(input).returning();
    return rows[0];
  }

  async update(
    id: string,
    input: UpdateComponentInput,
  ): Promise<Component | null> {
    const rows = await this.db
      .update(components)
      .set({ ...input, updatedAt: new Date().toISOString() })
      .where(eq(components.id, id))
      .returning();
    return rows[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db
      .delete(components)
      .where(eq(components.id, id))
      .returning({ id: components.id });
    return rows.length > 0;
  }
}
