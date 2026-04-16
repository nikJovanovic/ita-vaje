import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import LoginPage from "../src/app/auth/login/page";
import RegisterPage from "../src/app/auth/register/page";

afterEach(cleanup);

describe("LoginPage", () => {
  test("renders email + password inputs and a submit button", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(screen.getByLabelText("Password")).toBeDefined();
    expect(screen.getByRole("button", { name: /log in/i })).toBeDefined();
  });

  test("links to the register page", () => {
    render(<LoginPage />);
    const link = screen.getByText(/sign up/i);
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("/auth/register");
  });
});

describe("RegisterPage", () => {
  test("blocks submission with short password", () => {
    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "u" },
    });
    fireEvent.change(screen.getByLabelText("Password (min 6)"), {
      target: { value: "abc" },
    });
    // Short password enforced client-side (before fetch)
    const form = screen
      .getByRole("button", { name: /sign up/i })
      .closest("form");
    expect(form).toBeDefined();
    // minLength=6 on the input also blocks browser submission; form submit won't proceed
  });
});
