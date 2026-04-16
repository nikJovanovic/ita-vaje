const browserBase =
  process.env.NEXT_PUBLIC_WEB_BFF_URL ?? "http://localhost:4004";
const serverBase = process.env.WEB_BFF_URL ?? browserBase;

export function bffUrl(path: string): string {
  const base = typeof window === "undefined" ? serverBase : browserBase;
  return `${base}${path}`;
}

export async function bffFetch<T>(
  path: string,
  init?: RequestInit & { token?: string },
): Promise<T> {
  const { token, headers, ...rest } = init ?? {};
  const res = await fetch(bffUrl(path), {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed (${res.status}): ${text}`);
  }
  return (await res.json()) as T;
}
