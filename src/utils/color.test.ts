import { describe, it, expect } from "vitest";
import { colorToCss } from "./color";
import { MapColor } from "../types";

describe("colorToCss", () => {
  it("resolves a MapColor to its CSS custom property", () => {
    expect(colorToCss(MapColor.Red)).toBe("var(--ood-color-red)");
  });

  it("resolves Gray, the zero-value enum member", () => {
    expect(colorToCss(MapColor.Gray)).toBe("var(--ood-color-gray)");
  });
});
