import "server-only";
import { cookies } from "next/headers";
import { decodeJwt, JWT_COOKIE, type JwtPayload } from "./jwt";

export async function readJwtFromCookies(): Promise<{
  token: string;
  payload: JwtPayload;
} | null> {
  const store = await cookies();
  const token = store.get(JWT_COOKIE)?.value;
  if (!token) return null;
  const payload = decodeJwt(token);
  if (!payload) return null;
  return { token, payload };
}
