import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { Header } from "../src/components/Header";
import { decodeJwt, JWT_COOKIE } from "../src/lib/jwt";

afterEach(() => {
  cleanup();
  document.cookie = `${JWT_COOKIE}=; path=/; max-age=0`;
});

describe("catalog-mfe Header", () => {
  test("renders Log in / Sign up when unauthenticated", () => {
    render(<Header />);
    expect(screen.getByText("Log in")).toBeDefined();
    expect(screen.getByText("Sign up")).toBeDefined();
  });

  test("catalog link points to /catalog (cross-zone via hard nav)", () => {
    render(<Header />);
    const link = screen.getByText("Catalog");
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("/catalog");
  });
});

describe("jwt decode", () => {
  test("rejects malformed tokens", () => {
    expect(decodeJwt("nope")).toBeNull();
    expect(decodeJwt("a.b")).toBeNull();
    expect(decodeJwt("a.b.c")).toBeNull();
  });

  test("rejects expired tokens", () => {
    const header = btoa('{"alg":"HS256","typ":"JWT"}')
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const payload = btoa('{"sub":"u1","email":"x","exp":1}')
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(decodeJwt(`${header}.${payload}.sig`)).toBeNull();
  });
});
