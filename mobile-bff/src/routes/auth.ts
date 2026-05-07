import { Elysia, t } from "elysia";
import type { UsersClient } from "../clients/types";
import { HttpError } from "../clients/users-client";

const SlimRegisterResponse = t.Object({
  token: t.String(),
  userId: t.String(),
});

const SlimLoginResponse = t.Object({
  token: t.String(),
});

const ErrorSchema = t.Object({ error: t.String() });

function mapError(err: unknown, set: { status?: number | string }) {
  if (err instanceof HttpError) {
    set.status = err.status;
    try {
      return JSON.parse(err.body);
    } catch {
      return { error: err.body || "Upstream error" };
    }
  }
  console.error("[mobile-bff] unexpected error:", err);
  set.status = 500;
  return { error: "Internal server error" };
}

export const authRoutes = (users: UsersClient) =>
  new Elysia({ prefix: "/api/auth" })
    .post(
      "/register",
      async ({ body, set }) => {
        try {
          const result = await users.register(body);
          set.status = 201;
          return { token: result.token, userId: result.user.id };
        } catch (err) {
          return mapError(err, set);
        }
      },
      {
        body: t.Object({
          email: t.String({ minLength: 1 }),
          username: t.String({ minLength: 1 }),
          password: t.String({ minLength: 6 }),
        }),
        response: {
          201: SlimRegisterResponse,
          409: ErrorSchema,
          422: ErrorSchema,
          500: ErrorSchema,
        },
        detail: {
          summary: "Register (slim)",
          description:
            "Returns only {token, userId} — no full user object. Saves mobile bandwidth.",
          tags: ["Auth"],
        },
      }
    )
    .post(
      "/login",
      async ({ body, set }) => {
        try {
          const result = await users.login(body);
          return { token: result.token };
        } catch (err) {
          return mapError(err, set);
        }
      },
      {
        body: t.Object({
          email: t.String({ minLength: 1 }),
          password: t.String({ minLength: 1 }),
        }),
        response: {
          200: SlimLoginResponse,
          401: ErrorSchema,
          500: ErrorSchema,
        },
        detail: {
          summary: "Login (slim)",
          description:
            "Returns only {token} — no user object. Client stores token and fetches /api/me/summary when needed.",
          tags: ["Auth"],
        },
      }
    );
