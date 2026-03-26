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
import type { ComponentInfo } from "../src/build-management/domain/build";
import type { PartsClient } from "../src/build-management/domain/parts-client";
import { DrizzleBuildRepository } from "../src/build-management/infrastructure/drizzle-build-repository";
import * as schema from "../src/build-management/infrastructure/schema";

const encoder = new TextEncoder();

async function createTestJwt(sub: string, email: string): Promise<string> {
  const secret = process.env.JWT_SECRET ?? "dev-secret-change-me";
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(
    JSON.stringify({ sub, email, iat: now, exp: now + 3600 }),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const signingInput = `${header}.${payload}`;
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signingInput),
  );
  const signature = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${signingInput}.${signature}`;
}

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/builds_db";
const client = postgres(connectionString);
const db = drizzle(client, { schema });
const repo = new DrizzleBuildRepository(db);

const mockPartsClient: PartsClient = {
  getComponentsByIds: async (ids: string[]): Promise<ComponentInfo[]> =>
    ids.map((id) => ({
      id,
      name: "Test Component",
      brand: "Test Brand",
      type: "CPU",
      price: 299.99,
    })),
};

const app = createApp(repo, mockPartsClient);

const sampleBody = {
  name: "Gaming Beast",
  componentIds: [
    "00000000-0000-0000-0000-000000000001",
    "00000000-0000-0000-0000-000000000002",
  ],
};

let authHeader: string;

beforeAll(async () => {
  const token = await createTestJwt("user-1", "test@example.com");
  authHeader = `Bearer ${token}`;
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

describe("GET /health", () => {
  test("returns ok", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});

describe("POST /builds", () => {
  test("returns 401 without token", async () => {
    const res = await app.request("/builds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sampleBody),
    });
    expect(res.status).toBe(401);
  });

  test("creates build and returns 201 with auth", async () => {
    const res = await app.request("/builds", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(sampleBody),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.name).toBe(sampleBody.name);
    expect(body.userId).toBe("user-1");
    expect(body.componentIds).toEqual(sampleBody.componentIds);
  });

  test("returns 400 for invalid body", async () => {
    const res = await app.request("/builds", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({ name: "" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /builds", () => {
  test("returns all builds (public)", async () => {
    await app.request("/builds", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(sampleBody),
    });

    const res = await app.request("/builds");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBe(1);
  });

  test("filters by userId query param", async () => {
    await app.request("/builds", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(sampleBody),
    });

    const token2 = await createTestJwt("user-2", "user2@example.com");
    await app.request("/builds", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token2}`,
      },
      body: JSON.stringify({
        name: "Other Build",
        componentIds: [],
      }),
    });

    const res = await app.request("/builds?userId=user-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBe(1);
    expect(body[0].userId).toBe("user-1");
  });
});

describe("GET /builds/:id", () => {
  test("returns build with components and totalPrice", async () => {
    const createRes = await app.request("/builds", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(sampleBody),
    });
    const created = await createRes.json();

    const res = await app.request(`/builds/${created.id}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe(sampleBody.name);
    expect(body.components.length).toBe(2);
    expect(body.totalPrice).toBe(599.98);
  });

  test("returns 404 for non-existent id", async () => {
    const res = await app.request(
      "/builds/00000000-0000-0000-0000-000000000000",
    );
    expect(res.status).toBe(404);
  });
});

describe("DELETE /builds/:id", () => {
  test("returns 401 without token", async () => {
    const res = await app.request(
      "/builds/00000000-0000-0000-0000-000000000000",
      { method: "DELETE" },
    );
    expect(res.status).toBe(401);
  });

  test("deletes build and returns 204 with auth", async () => {
    const createRes = await app.request("/builds", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(sampleBody),
    });
    const created = await createRes.json();

    const res = await app.request(`/builds/${created.id}`, {
      method: "DELETE",
      headers: { Authorization: authHeader },
    });
    expect(res.status).toBe(204);
  });

  test("returns 404 for non-existent id", async () => {
    const res = await app.request(
      "/builds/00000000-0000-0000-0000-000000000000",
      { method: "DELETE", headers: { Authorization: authHeader } },
    );
    expect(res.status).toBe(404);
  });
});
