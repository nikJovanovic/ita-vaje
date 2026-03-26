import { assertEquals, assertNotEquals } from "@std/assert";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { DrizzleUserRepository } from "../src/identity/infrastructure/drizzle-user-repository.ts";
import * as schema from "../src/identity/infrastructure/schema.ts";

const connectionString = Deno.env.get("DATABASE_URL") ??
  "postgres://postgres:postgres@localhost:5432/users_db";
const client = postgres(connectionString);
const db = drizzle(client, { schema });
const repo = new DrizzleUserRepository(db);

const sampleUser = {
  email: "test@example.com",
  username: "testuser",
  passwordHash: "fakehash:fakesalt",
};

async function cleanup() {
  await db.execute(sql`DELETE FROM users`);
}

Deno.test({
  name: "DrizzleUserRepository",
  async fn(t) {
    await cleanup();

    await t.step("create returns user with generated id", async () => {
      await cleanup();
      const user = await repo.create(sampleUser);

      assertNotEquals(user.id, undefined);
      assertEquals(user.email, sampleUser.email);
      assertEquals(user.username, sampleUser.username);
      assertNotEquals(user.createdAt, undefined);
    });

    await t.step("findById returns user when exists", async () => {
      await cleanup();
      const created = await repo.create(sampleUser);
      const found = await repo.findById(created.id);

      assertNotEquals(found, null);
      assertEquals(found?.id, created.id);
      assertEquals(found?.email, sampleUser.email);
    });

    await t.step("findById returns null when not found", async () => {
      await cleanup();
      const found = await repo.findById(
        "00000000-0000-0000-0000-000000000000",
      );
      assertEquals(found, null);
    });

    await t.step("findByEmail returns user when exists", async () => {
      await cleanup();
      const created = await repo.create(sampleUser);
      const found = await repo.findByEmail(created.email);

      assertNotEquals(found, null);
      assertEquals(found?.id, created.id);
    });

    await t.step("findByEmail returns null when not found", async () => {
      await cleanup();
      const found = await repo.findByEmail("nonexistent@example.com");
      assertEquals(found, null);
    });

    await t.step("create with duplicate email throws", async () => {
      await cleanup();
      await repo.create(sampleUser);

      try {
        await repo.create(sampleUser);
        throw new Error("Should have thrown");
      } catch (err: unknown) {
        assertNotEquals(
          err instanceof Error ? err.message : "",
          "Should have thrown",
        );
      }
    });

    // Cleanup and close connection
    await cleanup();
    await client.end();
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
