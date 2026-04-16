import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NewBuildForm } from "../src/app/builds/new/new-build-form";

const components = [
  { id: "c1", name: "Ryzen 7", brand: "AMD", type: "CPU", price: 400 },
  { id: "c2", name: "RTX 4080", brand: "NVIDIA", type: "GPU", price: 1200 },
  { id: "c3", name: "Corsair 32GB", brand: "Corsair", type: "RAM", price: 100 },
];

afterEach(cleanup);

describe("NewBuildForm", () => {
  test("groups components by type", () => {
    render(<NewBuildForm components={components} />);
    expect(screen.getByText("CPU")).toBeDefined();
    expect(screen.getByText("GPU")).toBeDefined();
    expect(screen.getByText("RAM")).toBeDefined();
    expect(screen.getByText("Ryzen 7")).toBeDefined();
    expect(screen.getByText("RTX 4080")).toBeDefined();
  });

  test("initial state shows 0 selected and total 0.00 €", () => {
    render(<NewBuildForm components={components} />);
    expect(screen.getByText("0 components")).toBeDefined();
    expect(screen.getByText("0.00 €")).toBeDefined();
  });

  test("requires a name and at least one component", () => {
    render(<NewBuildForm components={components} />);
    fireEvent.submit(screen.getByRole("button", { name: /save build/i }));
    expect(
      screen.getByText(/name and at least one component are required/i),
    ).toBeDefined();
  });
});
