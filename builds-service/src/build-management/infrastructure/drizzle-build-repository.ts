import { eq } from "drizzle-orm";
import type { Build, CreateBuildInput } from "../domain/build";
import type { BuildRepository } from "../domain/build-repository";
import type { db as DbType } from "./db";
import { buildComponents, builds } from "./schema";

export class DrizzleBuildRepository implements BuildRepository {
  constructor(private db: typeof DbType) {}

  async findAll(userId?: string): Promise<Build[]> {
    const rows = await this.db.query.builds.findMany({
      where: userId ? eq(builds.userId, userId) : undefined,
      with: { buildComponents: { orderBy: (bc, { asc }) => [asc(bc.order)] } },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findById(id: string): Promise<Build | null> {
    const row = await this.db.query.builds.findFirst({
      where: eq(builds.id, id),
      with: { buildComponents: { orderBy: (bc, { asc }) => [asc(bc.order)] } },
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  async create(input: CreateBuildInput): Promise<Build> {
    return this.db.transaction(async (tx) => {
      const [build] = await tx
        .insert(builds)
        .values({
          name: input.name,
          userId: input.userId,
        })
        .returning();

      if (input.componentIds.length > 0) {
        await tx.insert(buildComponents).values(
          input.componentIds.map((componentId, index) => ({
            buildId: build.id,
            componentId,
            order: index,
          })),
        );
      }

      return {
        ...build,
        componentIds: input.componentIds,
      };
    });
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db
      .delete(builds)
      .where(eq(builds.id, id))
      .returning({ id: builds.id });
    return rows.length > 0;
  }

  private toDomain(
    row: typeof builds.$inferSelect & {
      buildComponents: (typeof buildComponents.$inferSelect)[];
    },
  ): Build {
    return {
      id: row.id,
      name: row.name,
      userId: row.userId,
      componentIds: row.buildComponents.map((bc) => bc.componentId),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
