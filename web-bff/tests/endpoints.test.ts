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
  {
    id: "c3",
    name: "Ryzen 9 7950X",
    brand: "AMD",
    type: "CPU",
    price: 520,
    specs: { cores: "16", socket: "AM5" },
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
  components: [sampleComponents[0] as ComponentInfo, sampleComponents[1] as ComponentInfo],
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
    if (body.password === "wrong") throw new HttpError(401, JSON.stringify({ error: "Invalid credentials" }));
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

describe("GET /health", () => {
  test("returns ok", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", service: "web-bff" });
  });
});

describe("GET /api/catalog", () => {
  test("returns full component list with specs (rich shape)", async () => {
    const res = await app.request("/api/catalog");
    expect(res.status).toBe(200);
    const body = (await res.json()) as ComponentInfo[];
    expect(body.length).toBe(3);
    expect(body[0]).toHaveProperty("specs");
    expect(body[0]).toHaveProperty("createdAt");
    expect(body[0]).toHaveProperty("brand");
  });

  test("filters by type", async () => {
    const res = await app.request("/api/catalog?type=CPU");
    const body = (await res.json()) as ComponentInfo[];
    expect(body.every((c) => c.type === "CPU")).toBe(true);
  });
});

describe("GET /api/catalog/:id", () => {
  test("returns component with related items (rich fan-out)", async () => {
    const res = await app.request("/api/catalog/c1");
    expect(res.status).toBe(200);
    const body = (await res.json()) as ComponentInfo & { related: ComponentInfo[] };
    expect(body.id).toBe("c1");
    expect(body.specs).toBeDefined();
    expect(Array.isArray(body.related)).toBe(true);
    expect(body.related.every((r) => r.type === "CPU")).toBe(true);
    expect(body.related.every((r) => r.id !== "c1")).toBe(true);
  });

  test("returns 404 for unknown id", async () => {
    const res = await app.request("/api/catalog/unknown");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/builds", () => {
  test("returns builds with thumbnails + totalPrice (rich shape)", async () => {
    const res = await app.request("/api/builds");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body[0]).toHaveProperty("thumbnails");
    expect(body[0]).toHaveProperty("totalPrice");
    expect(body[0].totalPrice).toBe(1650);
    expect(body[0].thumbnails.length).toBe(2);
  });
});

describe("GET /api/builds/:id", () => {
  test("returns build with full components and breakdown (rich shape)", async () => {
    const res = await app.request("/api/builds/b1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("components");
    expect(body).toHaveProperty("breakdown");
    expect(body).toHaveProperty("totalPrice");
    expect(body.breakdown.CPU).toBe(450);
    expect(body.breakdown.GPU).toBe(1200);
    expect(body.components[0]).toHaveProperty("specs");
  });

  test("returns 404 for missing build", async () => {
    const res = await app.request("/api/builds/nope");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/builds", () => {
  test("returns 401 without token", async () => {
    const res = await app.request("/api/builds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "x", componentIds: [] }),
    });
    expect(res.status).toBe(401);
  });

  test("creates build and returns enriched detail (rich shape)", async () => {
    const res = await app.request("/api/builds", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify({ name: "New Build", componentIds: ["c1", "c2"] }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty("components");
    expect(body).toHaveProperty("breakdown");
  });

  test("returns 400 for invalid body", async () => {
    const res = await app.request("/api/builds", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify({ name: "" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/builds/:id", () => {
  test("returns 401 without token", async () => {
    const res = await app.request("/api/builds/b1", { method: "DELETE" });
    expect(res.status).toBe(401);
  });

  test("returns 200 with {deleted: true}", async () => {
    const res = await app.request("/api/builds/b1", {
      method: "DELETE",
      headers: { Authorization: authHeader },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: true });
  });

  test("returns 404 for missing build", async () => {
    const res = await app.request("/api/builds/missing", {
      method: "DELETE",
      headers: { Authorization: authHeader },
    });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/auth/register", () => {
  test("returns full user + token (rich shape)", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com", username: "u", password: "secret123" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty("user");
    expect(body).toHaveProperty("token");
    expect(body.user).toHaveProperty("email");
    expect(body.user).toHaveProperty("createdAt");
  });

  test("rejects short password", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com", username: "u", password: "123" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  test("returns full user + token", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com", password: "secret123" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.username).toBe("tester");
    expect(body.token).toBe("fake-token");
  });

  test("forwards 401 on wrong password", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com", password: "wrong" }),
    });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/me", () => {
  test("returns 401 without token", async () => {
    const res = await app.request("/api/me");
    expect(res.status).toBe(401);
  });

  test("returns aggregated profile + builds with thumbnails", async () => {
    const res = await app.request("/api/me", {
      headers: { Authorization: authHeader },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toHaveProperty("username");
    expect(body.builds[0]).toHaveProperty("thumbnails");
    expect(body.builds[0]).toHaveProperty("totalPrice");
    expect(body.builds[0].totalPrice).toBe(1650);
  });
});

describe("GET /openapi + /swagger", () => {
  test("/openapi returns a valid OpenAPI 3.x document", async () => {
    const res = await app.request("/openapi");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.openapi).toMatch(/^3\./);
    expect(body.info.title).toBe("Web BFF");
    expect(body.paths).toHaveProperty("/api/catalog");
    expect(body.paths).toHaveProperty("/api/builds");
  });

  test("/swagger serves Swagger UI HTML", async () => {
    const res = await app.request("/swagger");
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("swagger");
  });
});
