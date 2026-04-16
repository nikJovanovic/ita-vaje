import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { Header } from "../src/components/Header";
import { JWT_COOKIE } from "../src/lib/jwt";

afterEach(() => {
  cleanup();
  document.cookie = `${JWT_COOKIE}=; path=/; max-age=0`;
});

function makeToken(
  payload: Record<string, unknown> = { sub: "u1", email: "a@b.com" },
) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const now = Math.floor(Date.now() / 1000);
  const body = btoa(
    JSON.stringify({ iat: now, exp: now + 3600, ...payload }),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${header}.${body}.fakesig`;
}

describe("Header", () => {
  test("renders Log in / Sign up when no jwt cookie is set", () => {
    render(<Header />);
    expect(screen.getByText("Log in")).toBeDefined();
    expect(screen.getByText("Sign up")).toBeDefined();
    expect(screen.getByText("PC Build Planner")).toBeDefined();
  });

  test("renders user email and Log out when jwt cookie is set", async () => {
    const token = makeToken({ sub: "u1", email: "alice@example.com" });
    document.cookie = `${JWT_COOKIE}=${token}; path=/`;
    // Sanity: cookie is actually set in happy-dom
    expect(document.cookie).toContain(JWT_COOKIE);
    render(<Header />);
    await waitFor(
      () => {
        expect(screen.getByText("alice@example.com")).toBeDefined();
      },
      { timeout: 2000 },
    );
    expect(screen.getByText("Log out")).toBeDefined();
  });

  test("exposes cross-zone nav links as <a> (not next/link)", () => {
    render(<Header />);
    const catalogLink = screen.getByText("Catalog");
    const buildsLink = screen.getByText("Builds");
    expect(catalogLink.tagName).toBe("A");
    expect(buildsLink.tagName).toBe("A");
    expect(catalogLink.getAttribute("href")).toBe("/catalog");
    expect(buildsLink.getAttribute("href")).toBe("/builds");
  });
});
