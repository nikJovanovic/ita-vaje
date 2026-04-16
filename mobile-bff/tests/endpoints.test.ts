import { beforeAll, describe, expect, test } from "bun:test";
import { createApp } from "../src/app";
import type {
  Build,
  BuildWithComponents,
  BuildsClient,
  ComponentInfo,
  PartsClient,
} from "../src/clients/types";
import { HttpError, HttpUsersClient } from "../src/clients/users-client";

const encoder = new TextEncoder();

async function createTestJwt(sub: string, email: string): Promise<string> {
  const secret = process.env.JWT_SECRET ?? "super-secret-dev-key";
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(
    JSON.stringify({ sub, email, iat: now, exp: now + 3600 })
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const signingInput = `${header}.${payload}`;
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signingInput)
  );
  const signature = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${signingInput}.${signature}`;
}

const sampleComponents: ComponentInfo[] = [
  {
    id: "c1",
    name: "Ryzen 7 7800X3D",
    brand: "AMD",
    type: "CPU",
    price: 450,
    specs: { cores: "8", socket: "AM5", tdp: "120W" },
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "c2",
    name: "RTX 4080",
    brand: "NVIDIA",
    type: "GPU",
    price: 1200,
    specs: { vram: "16GB", power: "320W" },
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
];

const fakeParts: PartsClient = {
  async listComponents(type?: string) {
    return type ? sampleComponents.filter((c) => c.type === type) : sampleComponents;
  },
  async getComponent(id: string) {
    return sampleComponents.find((c) => c.id === id) ?? null;
  },
  async getComponentsByIds(ids: string[]) {
    return sampleComponents.filter((c) => ids.includes(c.id));
  },
};

const sampleBuild: Build = {
  id: "b1",
  name: "Gaming Rig",
  userId: "user-1",
  componentIds: ["c1", "c2"],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

const sampleBuildWithComponents: BuildWithComponents = {
  ...sampleBuild,
  components: sampleComponents,
  totalPrice: 1650,
};

const fakeBuilds: BuildsClient = {
  async listBuilds(userId?: string) {
    if (userId && userId !== sampleBuild.userId) return [];
    return [sampleBuild];
  },
  async getBuild(id: string) {
    return id === "b1" ? sampleBuildWithComponents : null;
  },
  async createBuild(_token, body) {
    return { ...sampleBuild, name: body.name, componentIds: body.componentIds };
  },
  async deleteBuild(_token, id) {
    return id === "b1";
  },
};

class FakeUsersClient extends HttpUsersClient {
  override async register(body: { email: string; username: string; password: string }) {
    return {
      user: {
        id: "user-1",
        email: body.email,
        username: body.username,
        createdAt: "2025-01-01T00:00:00Z",
      },
      token: "fake-token",
    };
  }
  override async login(body: { email: string; password: string }) {
    if (body.password === "wrong")
      throw new HttpError(401, JSON.stringify({ error: "Invalid credentials" }));
    return {
      user: {
        id: "user-1",
        email: body.email,
        username: "tester",
        createdAt: "2025-01-01T00:00:00Z",
      },
      token: "fake-token",
    };
  }
  override async getProfile(_token: string) {
    return {
      id: "user-1",
      email: "test@example.com",
      username: "tester",
      createdAt: "2025-01-01T00:00:00Z",
    };
  }
}

const app = createApp({
  parts: fakeParts,
  builds: fakeBuilds,
  users: new FakeUsersClient(),
});

let authHeader: string;

beforeAll(async () => {
  authHeader = `Bearer ${await createTestJwt("user-1", "test@example.com")}`;
});

const request = (path: string, init?: RequestInit) =>
  app.handle(new Request(`http://localhost${path}`, init));

describe("GET /health", () => {
  test("returns ok", async () => {
    const res = await request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", service: "mobile-bff" });
  });
});

describe("GET /api/catalog", () => {
  test("returns slim component list (no specs, no timestamps)", async () => {
    const res = await request("/api/catalog");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBe(2);
    expect(body[0]).not.toHaveProperty("specs");
    expect(body[0]).not.toHaveProperty("createdAt");
    expect(body[0]).toHaveProperty("brand");
    expect(body[0]).toHaveProperty("price");
  });

  test("filters by type", async () => {
    const res = await request("/api/catalog?type=CPU");
    const body = await res.json();
    expect(body.every((c: { type: string }) => c.type === "CPU")).toBe(true);
  });
});

describe("GET /api/catalog/:id", () => {
  test("returns slim detail with only topSpecs (not full specs)", async () => {
    const res = await request("/api/catalog/c1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).not.toHaveProperty("specs");
    expect(body).not.toHaveProperty("related");
    expect(body).toHaveProperty("topSpecs");
    expect(Object.keys(body.topSpecs).length).toBeLessThanOrEqual(3);
  });

  test("returns 404 for missing component", async () => {
    const res = await request("/api/catalog/nope");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/builds", () => {
  test("returns slim builds (only id, name, totalPrice)", async () => {
    const res = await request("/api/builds");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body[0]).not.toHaveProperty("thumbnails");
    expect(body[0]).not.toHaveProperty("userId");
    expect(body[0]).not.toHaveProperty("componentIds");
    expect(body[0]).toHaveProperty("totalPrice");
    expect(body[0].totalPrice).toBe(1650);
  });
});

describe("GET /api/builds/:id", () => {
  test("returns slim build with flat items array (no breakdown, no full components)", async () => {
    const res = await request("/api/builds/b1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).not.toHaveProperty("components");
    expect(body).not.toHaveProperty("breakdown");
    expect(body).not.toHaveProperty("userId");
    expect(body).toHaveProperty("items");
    expect(body.items[0]).not.toHaveProperty("specs");
    expect(body.items[0]).toHaveProperty("price");
  });

  test("returns 404 for missing build", async () => {
    const res = await request("/api/builds/nope");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/builds", () => {
  test("returns 401 without token", async () => {
    const res = await request("/api/builds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "x", componentIds: [] }),
    });
    expect(res.status).toBe(401);
  });

  test("creates build and returns slim detail", async () => {
    const res = await request("/api/builds", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify({ name: "New Build", componentIds: ["c1", "c2"] }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).not.toHaveProperty("components");
    expect(body).toHaveProperty("items");
  });
});

describe("DELETE /api/builds/:id", () => {
  test("returns 401 without token", async () => {
    const res = await request("/api/builds/b1", { method: "DELETE" });
    expect(res.status).toBe(401);
  });

  test("returns 204 No Content on success (slim: no body)", async () => {
    const res = await request("/api/builds/b1", {
      method: "DELETE",
      headers: { Authorization: authHeader },
    });
    expect(res.status).toBe(204);
  });

  test("returns 404 for missing build", async () => {
    const res = await request("/api/builds/missing", {
      method: "DELETE",
      headers: { Authorization: authHeader },
    });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/auth/register", () => {
  test("returns only {token, userId} (slim)", async () => {
    const res = await request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "a@b.com",
        username: "u",
        password: "secret123",
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty("token");
    expect(body).toHaveProperty("userId");
    expect(body).not.toHaveProperty("user");
  });

  test("rejects short password", async () => {
    const res = await request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com", username: "u", password: "123" }),
    });
    expect(res.status).toBe(422);
  });
});

describe("POST /api/auth/login", () => {
  test("returns only {token} (slim)", async () => {
    const res = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com", password: "secret123" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ token: "fake-token" });
    expect(body).not.toHaveProperty("user");
  });

  test("forwards 401 on wrong password", async () => {
    const res = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com", password: "wrong" }),
    });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/me/summary", () => {
  test("returns 401 without token", async () => {
    const res = await request("/api/me/summary");
    expect(res.status).toBe(401);
  });

  test("returns slim summary (username, buildCount, totalSpent only)", async () => {
    const res = await request("/api/me/summary", {
      headers: { Authorization: authHeader },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      username: "tester",
      buildCount: 1,
      totalSpent: 1650,
    });
    expect(body).not.toHaveProperty("builds");
    expect(body).not.toHaveProperty("email");
  });
});

describe("GET /openapi + /swagger", () => {
  test("/openapi returns a valid OpenAPI document", async () => {
    const res = await request("/openapi");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.openapi).toMatch(/^3\./);
    expect(body.info.title).toBe("Mobile BFF");
    const paths = Object.keys(body.paths);
    expect(paths.some((p) => p.startsWith("/api/catalog"))).toBe(true);
    expect(paths.some((p) => p.startsWith("/api/builds"))).toBe(true);
  });

  test("/swagger serves Swagger UI HTML", async () => {
    const res = await request("/swagger");
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("swagger");
  });
});
