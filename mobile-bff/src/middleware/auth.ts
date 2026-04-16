import { Elysia } from "elysia";

const encoder = new TextEncoder();

function base64urlDecode(str: string): Uint8Array {
  const padded = str + "=".repeat((4 - (str.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export async function verifyJwt(
  token: string
): Promise<{ sub: string; email: string } | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const secret = process.env.JWT_SECRET ?? "super-secret-dev-key";
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signingInput = `${parts[0]}.${parts[1]}`;
    const signature = base64urlDecode(parts[2]);

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature.buffer as ArrayBuffer,
      encoder.encode(signingInput)
    );
    if (!valid) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(base64urlDecode(parts[1]))
    );
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export const authPlugin = new Elysia({ name: "auth" }).derive(
  { as: "scoped" },
  async ({ headers }) => {
    const h = headers.authorization;
    if (!h?.startsWith("Bearer ")) {
      return { userId: null as string | null, token: null as string | null };
    }
    const token = h.slice(7);
    const payload = await verifyJwt(token);
    if (!payload) {
      return { userId: null as string | null, token: null as string | null };
    }
    return {
      userId: payload.sub as string | null,
      token: token as string | null,
    };
  }
);

export const requireAuth = ({
  userId,
  set,
}: {
  userId: string | null;
  set: { status?: number | string };
}) => {
  if (!userId) {
    set.status = 401;
    return { error: "Missing or invalid token" };
  }
  return undefined;
};
