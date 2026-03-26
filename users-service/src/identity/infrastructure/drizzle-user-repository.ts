import { eq } from "drizzle-orm";
import type { User } from "../domain/user.ts";
import type { UserRepository } from "../domain/user-repository.ts";
import type { db as DbType } from "./db.ts";
import { users } from "./schema.ts";

export class DrizzleUserRepository implements UserRepository {
  constructor(private db: typeof DbType) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  async create(input: {
    email: string;
    username: string;
    passwordHash: string;
  }): Promise<User> {
    const [row] = await this.db
      .insert(users)
      .values({
        email: input.email,
        username: input.username,
        passwordHash: input.passwordHash,
      })
      .returning();
    return this.toDomain(row);
  }

  private toDomain(row: typeof users.$inferSelect): User {
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      passwordHash: row.passwordHash,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
