import { Router } from "@oak/oak";
import { firstValueFrom } from "rxjs";
import type { AuthService } from "../application/auth-service.ts";
import { authMiddleware } from "./auth-middleware.ts";

export function createUserRouter(service: AuthService): Router {
  const router = new Router({ prefix: "/api/users" });

  router.post("/register", async (ctx) => {
    try {
      const body = await ctx.request.body.json();
      if (!body.email || !body.username || !body.password) {
        ctx.response.status = 422;
        ctx.response.body = { error: "email, username, and password required" };
        return;
      }

      const result = await firstValueFrom(service.register(body));
      ctx.response.status = 201;
      ctx.response.body = result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message === "Email already registered") {
        ctx.response.status = 409;
        ctx.response.body = { error: message };
      } else {
        console.error(`[${new Date().toISOString()}] Register error:`, err);
        ctx.response.status = 500;
        ctx.response.body = { error: "Internal server error" };
      }
    }
  });

  router.post("/login", async (ctx) => {
    try {
      const body = await ctx.request.body.json();
      if (!body.email || !body.password) {
        ctx.response.status = 422;
        ctx.response.body = { error: "email and password required" };
        return;
      }

      const result = await firstValueFrom(service.login(body));
      ctx.response.body = result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message === "Invalid credentials") {
        ctx.response.status = 401;
        ctx.response.body = { error: message };
      } else {
        console.error(`[${new Date().toISOString()}] Login error:`, err);
        ctx.response.status = 500;
        ctx.response.body = { error: "Internal server error" };
      }
    }
  });

  router.get("/me", authMiddleware, async (ctx) => {
    try {
      const profile = await firstValueFrom(
        service.getProfile(ctx.state.userId),
      );
      ctx.response.body = profile;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message === "User not found") {
        ctx.response.status = 404;
        ctx.response.body = { error: message };
      } else {
        console.error(`[${new Date().toISOString()}] Profile error:`, err);
        ctx.response.status = 500;
        ctx.response.body = { error: "Internal server error" };
      }
    }
  });

  return router;
}
