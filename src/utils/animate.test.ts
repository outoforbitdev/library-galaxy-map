import { describe, it, expect } from "vitest";
import { lerp, easeInOutCubic } from "./animate";

describe("lerp", () => {
  it("returns the start value at t=0", () => {
    expect(lerp(10, 20, 0)).toBe(10);
  });

  it("returns the end value at t=1", () => {
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it("returns the midpoint at t=0.5", () => {
    expect(lerp(10, 20, 0.5)).toBe(15);
  });
});

describe("easeInOutCubic", () => {
  it("returns 0 at t=0", () => {
    expect(easeInOutCubic(0)).toBe(0);
  });

  it("returns 1 at t=1", () => {
    expect(easeInOutCubic(1)).toBe(1);
  });

  it("returns 0.5 at the midpoint", () => {
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5);
  });
});
