/**
 * Smoke test to verify fast-check property-based testing is configured correctly.
 */
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

describe("Property-based testing setup", () => {
  it("fast-check is working", () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        // Commutativity of addition
        return a + b === b + a;
      }),
      { numRuns: 100 }
    );
  });

  it("fast-check string generator works", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        return typeof s === "string";
      }),
      { numRuns: 100 }
    );
  });
});
