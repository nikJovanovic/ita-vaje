import type { Middleware } from "@oak/oak";
import { verifyJwt } from "../application/jwt.ts";

export const authMiddleware: Middleware = async (ctx, next) => {
  const header = ctx.request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Missing or invalid token" };
    return;
  }

  const token = header.slice(7);
  const payload = await verifyJwt(token);
  if (!payload) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Invalid or expired token" };
    return;
  }

  ctx.state.userId = payload.sub;
  ctx.state.email = payload.email;
  await next();
};
