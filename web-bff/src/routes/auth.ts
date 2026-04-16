import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { HttpError, type HttpUsersClient } from "../clients/users-client";

const UserProfileSchema = v.object({
  id: v.string(),
  email: v.string(),
  username: v.string(),
  createdAt: v.string(),
});

const AuthResponseSchema = v.object({
  user: UserProfileSchema,
  token: v.string(),
});

const RegisterSchema = v.object({
  email: v.pipe(v.string(), v.minLength(1)),
  username: v.pipe(v.string(), v.minLength(1)),
  password: v.pipe(v.string(), v.minLength(6)),
});

const LoginSchema = v.object({
  email: v.pipe(v.string(), v.minLength(1)),
  password: v.pipe(v.string(), v.minLength(1)),
});

function forwardError(err: unknown) {
  if (err instanceof HttpError) {
    try {
      return {
        status: err.status as 400 | 401 | 404 | 409 | 422 | 500,
        body: JSON.parse(err.body),
      };
    } catch {
      return {
        status: err.status as 400 | 401 | 404 | 409 | 422 | 500,
        body: { error: err.body || "Upstream error" },
      };
    }
  }
  console.error("[web-bff] unexpected error:", err);
  return { status: 500 as const, body: { error: "Internal server error" } };
}

export const authRoutes = (users: HttpUsersClient) => {
  const app = new Hono();

  app.post(
    "/register",
    describeRoute({
      description: "Register a new user (proxies users-service, rich response)",
      tags: ["Auth"],
      responses: {
        201: {
          description: "Registered",
          content: {
            "application/json": {
              schema: resolver(AuthResponseSchema),
            },
          },
        },
      },
    }),
    validator("json", RegisterSchema),
    async (c) => {
      try {
        const body = c.req.valid("json");
        const result = await users.register(body);
        return c.json(result, 201);
      } catch (err) {
        const { status, body } = forwardError(err);
        return c.json(body, status);
      }
    }
  );

  app.post(
    "/login",
    describeRoute({
      description: "Log in (proxies users-service, returns full user + token)",
      tags: ["Auth"],
      responses: {
        200: {
          description: "Authenticated",
          content: {
            "application/json": {
              schema: resolver(AuthResponseSchema),
            },
          },
        },
      },
    }),
    validator("json", LoginSchema),
    async (c) => {
      try {
        const body = c.req.valid("json");
        const result = await users.login(body);
        return c.json(result);
      } catch (err) {
        const { status, body } = forwardError(err);
        return c.json(body, status);
      }
    }
  );

  return app;
};
