import { describe, it, expect } from "vitest";
import { mapCenter, computeViewport, mapToScreen, screenToMap } from "./coordinates";
import { IMapDimensions } from "../types";

describe("mapCenter", () => {
  it("returns the midpoint of the dimensions", () => {
    const dimensions: IMapDimensions = {
      min: { x: 0, y: 0 },
      max: { x: 100, y: 200 },
    };

    expect(mapCenter(dimensions)).toEqual({ x: 50, y: 100 });
  });
});

describe("computeViewport", () => {
  it("computes the visible region at zoom 1", () => {
    const viewport = computeViewport({ x: 0, y: 0 }, 1, 200, 100);

    expect(viewport).toEqual({ minX: -100, minY: -50, maxX: 100, maxY: 50 });
  });

  it("shrinks the visible region as zoom increases", () => {
    const viewport = computeViewport({ x: 0, y: 0 }, 2, 200, 100);

    expect(viewport).toEqual({ minX: -50, minY: -25, maxX: 50, maxY: 25 });
  });
});

describe("mapToScreen", () => {
  it("places the map center at the center of the SVG", () => {
    const center = { x: 10, y: 20 };

    expect(mapToScreen(10, 20, center, 1, 200, 100)).toEqual({ x: 100, y: 50 });
  });

  it("flips the Y axis so higher map y renders higher on screen", () => {
    const center = { x: 0, y: 0 };

    expect(mapToScreen(0, 10, center, 1, 200, 100)).toEqual({ x: 100, y: 40 });
  });
});

describe("screenToMap", () => {
  it("maps the SVG center back to the map center", () => {
    const center = { x: 10, y: 20 };

    expect(screenToMap(100, 50, center, 1, 200, 100)).toEqual({ x: 10, y: 20 });
  });
});

describe("screen/map coordinate round-trip", () => {
  it("returns the original screen position after converting to map and back", () => {
    const center = { x: 5, y: -3 };
    const zoom = 2.5;
    const svgWidth = 800;
    const svgHeight = 600;
    const screenX = 321;
    const screenY = 214;

    const mapPoint = screenToMap(screenX, screenY, center, zoom, svgWidth, svgHeight);
    const screenPoint = mapToScreen(mapPoint.x, mapPoint.y, center, zoom, svgWidth, svgHeight);

    expect(screenPoint.x).toBeCloseTo(screenX);
    expect(screenPoint.y).toBeCloseTo(screenY);
  });
});
