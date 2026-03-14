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
import { createApp } from "../src/app";
import { DrizzleComponentRepository } from "../src/catalog/infrastructure/drizzle-component-repository";
import * as schema from "../src/catalog/infrastructure/schema";

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/catalog_db";
const client = postgres(connectionString);
const db = drizzle(client, { schema });
const repo = new DrizzleComponentRepository(db);
const app = createApp(repo);

const sampleBody = {
  name: "AMD Ryzen 7 7800X3D",
  brand: "AMD",
  type: "CPU",
  price: 349.99,
  specs: { cores: "8", threads: "16" },
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

describe("GET /health", () => {
  test("returns ok", async () => {
    const res = await app.handle(new Request("http://localhost/health"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});

describe("POST /components", () => {
  test("creates component and returns 201", async () => {
    const res = await app.handle(
      new Request("http://localhost/components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sampleBody),
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.name).toBe(sampleBody.name);
    expect(body.type).toBe("CPU");
  });

  test("returns 422 for invalid body", async () => {
    const res = await app.handle(
      new Request("http://localhost/components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      }),
    );
    expect(res.status).toBe(422);
  });
});

describe("GET /components", () => {
  test("returns all components", async () => {
    await app.handle(
      new Request("http://localhost/components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sampleBody),
      }),
    );

    const res = await app.handle(new Request("http://localhost/components"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBe(1);
  });

  test("filters by type query param", async () => {
    await app.handle(
      new Request("http://localhost/components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sampleBody),
      }),
    );
    await app.handle(
      new Request("http://localhost/components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sampleBody,
          name: "RTX 4090",
          brand: "NVIDIA",
          type: "GPU",
        }),
      }),
    );

    const res = await app.handle(
      new Request("http://localhost/components?type=CPU"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBe(1);
    expect(body[0].type).toBe("CPU");
  });
});

describe("GET /components/:id", () => {
  test("returns component by id", async () => {
    const createRes = await app.handle(
      new Request("http://localhost/components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sampleBody),
      }),
    );
    const created = await createRes.json();

    const res = await app.handle(
      new Request(`http://localhost/components/${created.id}`),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe(sampleBody.name);
  });

  test("returns 404 for non-existent id", async () => {
    const res = await app.handle(
      new Request(
        "http://localhost/components/00000000-0000-0000-0000-000000000000",
      ),
    );
    expect(res.status).toBe(404);
  });
});

describe("PATCH /components/:id", () => {
  test("updates component", async () => {
    const createRes = await app.handle(
      new Request("http://localhost/components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sampleBody),
      }),
    );
    const created = await createRes.json();

    const res = await app.handle(
      new Request(`http://localhost/components/${created.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: 299.99 }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.price).toBe(299.99);
  });

  test("returns 404 for non-existent id", async () => {
    const res = await app.handle(
      new Request(
        "http://localhost/components/00000000-0000-0000-0000-000000000000",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ price: 100 }),
        },
      ),
    );
    expect(res.status).toBe(404);
  });
});

describe("DELETE /components/:id", () => {
  test("deletes component and returns 204", async () => {
    const createRes = await app.handle(
      new Request("http://localhost/components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sampleBody),
      }),
    );
    const created = await createRes.json();

    const res = await app.handle(
      new Request(`http://localhost/components/${created.id}`, {
        method: "DELETE",
      }),
    );
    expect(res.status).toBe(204);
  });

  test("returns 404 for non-existent id", async () => {
    const res = await app.handle(
      new Request(
        "http://localhost/components/00000000-0000-0000-0000-000000000000",
        { method: "DELETE" },
      ),
    );
    expect(res.status).toBe(404);
  });
});
