import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { CreateBuildInput } from "../src/build-management/domain/build";
import { DrizzleBuildRepository } from "../src/build-management/infrastructure/drizzle-build-repository";
import * as schema from "../src/build-management/infrastructure/schema";

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/builds_db";
const client = postgres(connectionString);
const db = drizzle(client, { schema });
const repo = new DrizzleBuildRepository(db);

const sampleBuild: CreateBuildInput = {
  name: "Gaming Beast",
  userId: "user-1",
  componentIds: [
    "00000000-0000-0000-0000-000000000001",
    "00000000-0000-0000-0000-000000000002",
  ],
};

const sampleBuild2: CreateBuildInput = {
  name: "Budget Workstation",
  userId: "user-2",
  componentIds: ["00000000-0000-0000-0000-000000000003"],
};

beforeAll(async () => {
  await db.execute(sql`DELETE FROM build_components`);
  await db.execute(sql`DELETE FROM builds`);
});

beforeEach(async () => {
  await db.execute(sql`DELETE FROM build_components`);
  await db.execute(sql`DELETE FROM builds`);
});

afterAll(async () => {
  await db.execute(sql`DELETE FROM build_components`);
  await db.execute(sql`DELETE FROM builds`);
  await client.end();
});

describe("DrizzleBuildRepository", () => {
  test("create returns build with generated id", async () => {
    const result = await repo.create(sampleBuild);

    expect(result.id).toBeDefined();
    expect(result.name).toBe(sampleBuild.name);
    expect(result.userId).toBe(sampleBuild.userId);
    expect(result.componentIds).toEqual(sampleBuild.componentIds);
    expect(result.createdAt).toBeDefined();
  });

  test("findById returns build when exists", async () => {
    const created = await repo.create(sampleBuild);
    const found = await repo.findById(created.id);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
    expect(found?.name).toBe(sampleBuild.name);
    expect(found?.componentIds).toEqual(sampleBuild.componentIds);
  });

  test("findById returns null when not found", async () => {
    const found = await repo.findById("00000000-0000-0000-0000-000000000000");
    expect(found).toBeNull();
  });

  test("findAll returns all builds", async () => {
    await repo.create(sampleBuild);
    await repo.create(sampleBuild2);

    const all = await repo.findAll();
    expect(all.length).toBe(2);
  });

  test("findAll filters by userId", async () => {
    await repo.create(sampleBuild);
    await repo.create(sampleBuild2);

    const filtered = await repo.findAll("user-1");
    expect(filtered.length).toBe(1);
    expect(filtered[0].userId).toBe("user-1");
  });

  test("create with empty componentIds works", async () => {
    const result = await repo.create({
      name: "Empty Build",
      userId: "user-1",
      componentIds: [],
    });

    expect(result.componentIds).toEqual([]);
  });

  test("delete removes build and returns true", async () => {
    const created = await repo.create(sampleBuild);
    const deleted = await repo.delete(created.id);
    expect(deleted).toBe(true);

    const found = await repo.findById(created.id);
    expect(found).toBeNull();
  });

  test("delete returns false when not found", async () => {
    const deleted = await repo.delete("00000000-0000-0000-0000-000000000000");
    expect(deleted).toBe(false);
  });
});
