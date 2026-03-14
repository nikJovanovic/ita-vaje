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
import type { CreateComponentInput } from "../src/catalog/domain/component";
import { DrizzleComponentRepository } from "../src/catalog/infrastructure/drizzle-component-repository";
import * as schema from "../src/catalog/infrastructure/schema";

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/catalog_db";
const client = postgres(connectionString);
const db = drizzle(client, { schema });
const repo = new DrizzleComponentRepository(db);

const sampleCPU: CreateComponentInput = {
  name: "AMD Ryzen 7 7800X3D",
  brand: "AMD",
  type: "CPU",
  price: 349.99,
  specs: { cores: "8", threads: "16", socket: "AM5" },
};

const sampleGPU: CreateComponentInput = {
  name: "NVIDIA RTX 4070",
  brand: "NVIDIA",
  type: "GPU",
  price: 549.99,
  specs: { vram: "12GB", bus: "PCIe 4.0" },
};

beforeAll(async () => {
  await db.execute(sql`DELETE FROM components`);
});

beforeEach(async () => {
  await db.execute(sql`DELETE FROM components`);
});

afterAll(async () => {
  await db.execute(sql`DELETE FROM components`);
  await client.end();
});

describe("DrizzleComponentRepository", () => {
  test("create returns component with generated id", async () => {
    const result = await repo.create(sampleCPU);

    expect(result.id).toBeDefined();
    expect(result.name).toBe(sampleCPU.name);
    expect(result.brand).toBe(sampleCPU.brand);
    expect(result.type).toBe(sampleCPU.type);
    expect(result.price).toBe(sampleCPU.price);
    expect(result.specs).toEqual(sampleCPU.specs);
    expect(result.createdAt).toBeDefined();
  });

  test("findById returns component when exists", async () => {
    const created = await repo.create(sampleCPU);
    const found = await repo.findById(created.id);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
    expect(found?.name).toBe(sampleCPU.name);
  });

  test("findById returns null when not found", async () => {
    const found = await repo.findById("00000000-0000-0000-0000-000000000000");
    expect(found).toBeNull();
  });

  test("findAll returns all components", async () => {
    await repo.create(sampleCPU);
    await repo.create(sampleGPU);

    const all = await repo.findAll();
    expect(all.length).toBe(2);
  });

  test("findAll filters by type", async () => {
    await repo.create(sampleCPU);
    await repo.create(sampleGPU);

    const cpus = await repo.findAll("CPU");
    expect(cpus.length).toBe(1);
    expect(cpus[0].type).toBe("CPU");
  });

  test("update modifies component fields", async () => {
    const created = await repo.create(sampleCPU);
    const updated = await repo.update(created.id, { price: 299.99 });

    expect(updated).not.toBeNull();
    expect(updated?.price).toBe(299.99);
    expect(updated?.name).toBe(sampleCPU.name);
  });

  test("update returns null when not found", async () => {
    const result = await repo.update("00000000-0000-0000-0000-000000000000", {
      price: 100,
    });
    expect(result).toBeNull();
  });

  test("delete removes component and returns true", async () => {
    const created = await repo.create(sampleCPU);
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
