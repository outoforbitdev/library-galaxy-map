import { describe, it, expect } from "vitest";
import {
  computeZoomCompensatedRadius,
  TARGET_DOT_RADIUS_PX,
} from "./zoomCompensatedRadius";

describe("computeZoomCompensatedRadius", () => {
  it("returns the target radius at zoom 1", () => {
    expect(computeZoomCompensatedRadius(1)).toBe(TARGET_DOT_RADIUS_PX);
  });

  it("keeps the effective on-screen size (radius * zoom) within a tight ratio of the target across a wide zoom range", () => {
    const zooms = [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10, 100, 1000];
    for (const zoom of zooms) {
      const radius = computeZoomCompensatedRadius(zoom);
      const effectiveScreenSize = radius * zoom;
      const ratio = effectiveScreenSize / TARGET_DOT_RADIUS_PX;
      expect(ratio).toBeGreaterThan(0.95);
      expect(ratio).toBeLessThan(1.06);
    }
  });

  it("keeps drift small even for a zoom that doesn't cross a tier boundary", () => {
    // A small zoom nudge that lands at the worst-case midpoint between two
    // tiers should still stay close to the target, not drift ~40% like a
    // coarse power-of-two tier step would allow.
    const worstCaseZoom = 1 * Math.sqrt(1.1);
    const radius = computeZoomCompensatedRadius(worstCaseZoom);
    const ratio = (radius * worstCaseZoom) / TARGET_DOT_RADIUS_PX;

    expect(Math.abs(ratio - 1)).toBeLessThan(0.06);
  });

  it("returns a smaller css radius as zoom increases, to compensate for the transform scale", () => {
    const radiusAtLowZoom = computeZoomCompensatedRadius(0.25);
    const radiusAtHighZoom = computeZoomCompensatedRadius(4);

    expect(radiusAtHighZoom).toBeLessThan(radiusAtLowZoom);
  });
});
