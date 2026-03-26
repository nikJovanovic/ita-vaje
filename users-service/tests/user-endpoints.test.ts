import { assertEquals, assertNotEquals } from "@std/assert";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createApp } from "../src/app.ts";
import { AuthService } from "../src/identity/application/auth-service.ts";
import { DrizzleUserRepository } from "../src/identity/infrastructure/drizzle-user-repository.ts";
import { NoopEventBus } from "../src/identity/infrastructure/rabbitmq-event-bus.ts";
import * as schema from "../src/identity/infrastructure/schema.ts";

const connectionString = Deno.env.get("DATABASE_URL") ??
  "postgres://postgres:postgres@localhost:5432/users_db";
const client = postgres(connectionString);
const db = drizzle(client, { schema });
const repo = new DrizzleUserRepository(db);
const eventBus = new NoopEventBus();
const service = new AuthService(repo, eventBus);
const app = createApp(service);

let controller: AbortController;
let baseUrl: string;

async function cleanup() {
  await db.execute(sql`DELETE FROM users`);
}

function startServer(): Promise<void> {
  return new Promise((resolve) => {
    controller = new AbortController();
    app.addEventListener("listen", ({ port }) => {
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
    app.listen({ port: 0, signal: controller.signal });
  });
}

function stopServer() {
  controller.abort();
}

const sampleRegister = {
  email: "test@example.com",
  username: "testuser",
  password: "password123",
};

Deno.test({
  name: "User Endpoints",
  async fn(t) {
    await cleanup();
    await startServer();

    await t.step("GET /health returns ok", async () => {
      const res = await fetch(`${baseUrl}/health`);
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(body.status, "ok");
    });

    await t.step(
      "POST /api/users/register creates user and returns 201",
      async () => {
        await cleanup();
        const res = await fetch(`${baseUrl}/api/users/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sampleRegister),
        });
        assertEquals(res.status, 201);
        const body = await res.json();
        assertNotEquals(body.user.id, undefined);
        assertEquals(body.user.email, sampleRegister.email);
        assertEquals(body.user.username, sampleRegister.username);
        assertNotEquals(body.token, undefined);
      },
    );

    await t.step(
      "POST /api/users/register returns 409 for duplicate email",
      async () => {
        const res = await fetch(`${baseUrl}/api/users/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sampleRegister),
        });
        assertEquals(res.status, 409);
        const body = await res.json();
        assertEquals(body.error, "Email already registered");
      },
    );

    await t.step(
      "POST /api/users/register returns 422 for missing fields",
      async () => {
        const res = await fetch(`${baseUrl}/api/users/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "x@y.com" }),
        });
        assertEquals(res.status, 422);
      },
    );

    await t.step(
      "POST /api/users/login returns 200 with token",
      async () => {
        const res = await fetch(`${baseUrl}/api/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: sampleRegister.email,
            password: sampleRegister.password,
          }),
        });
        assertEquals(res.status, 200);
        const body = await res.json();
        assertNotEquals(body.token, undefined);
        assertEquals(body.user.email, sampleRegister.email);
      },
    );

    await t.step(
      "POST /api/users/login returns 401 for invalid credentials",
      async () => {
        const res = await fetch(`${baseUrl}/api/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: sampleRegister.email,
            password: "wrongpassword",
          }),
        });
        assertEquals(res.status, 401);
      },
    );

    await t.step(
      "GET /api/users/me returns profile with valid token",
      async () => {
        const loginRes = await fetch(`${baseUrl}/api/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: sampleRegister.email,
            password: sampleRegister.password,
          }),
        });
        const loginBody = await loginRes.json();

        const res = await fetch(`${baseUrl}/api/users/me`, {
          headers: { Authorization: `Bearer ${loginBody.token}` },
        });
        assertEquals(res.status, 200);
        const body = await res.json();
        assertEquals(body.email, sampleRegister.email);
      },
    );

    await t.step(
      "GET /api/users/me returns 401 without token",
      async () => {
        const res = await fetch(`${baseUrl}/api/users/me`);
        assertEquals(res.status, 401);
        const body = await res.json();
        assertEquals(body.error, "Missing or invalid token");
      },
    );

    stopServer();
    await cleanup();
    await client.end();
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
