"use client";

import { decodeJwt, JWT_COOKIE, type JwtPayload } from "./jwt";

export function readJwtFromDocument(): {
  token: string;
  payload: JwtPayload;
} | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${JWT_COOKIE}=([^;]*)`),
  );
  if (!match) return null;
  const token = decodeURIComponent(match[1] as string);
  const payload = decodeJwt(token);
  if (!payload) return null;
  return { token, payload };
}

export function setJwtCookie(token: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${JWT_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24}; samesite=lax`;
}

export function clearJwtCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${JWT_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
