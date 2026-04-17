/**
 * Smoke test to verify the test framework is configured correctly.
 */
import { describe, it, expect } from "vitest";

describe("Test framework setup", () => {
  it("vitest is working", () => {
    expect(1 + 1).toBe(2);
  });

  it("TypeScript types are available", () => {
    const value: string = "hello";
    expect(typeof value).toBe("string");
  });
});
