import { describe, it, expect } from "vitest";
import {
  mapCenter,
  computeViewport,
  mapToScreen,
  screenToMap,
} from "../src/utils/coordinates";

describe("mapCenter", () => {
  it("returns the midpoint of symmetric dimensions", () => {
    const center = mapCenter({
      min: { x: -100, y: -100 },
      max: { x: 100, y: 100 },
    });
    expect(center).toEqual({ x: 0, y: 0 });
  });

  it("returns the midpoint of asymmetric dimensions", () => {
    const center = mapCenter({
      min: { x: 0, y: 200 },
      max: { x: 400, y: 600 },
    });
    expect(center).toEqual({ x: 200, y: 400 });
  });

  it("handles negative-only ranges", () => {
    const center = mapCenter({
      min: { x: -800, y: -600 },
      max: { x: -200, y: -100 },
    });
    expect(center).toEqual({ x: -500, y: -350 });
  });
});

describe("computeViewport", () => {
  it("spans the full container at zoom=1", () => {
    const vp = computeViewport({ x: 0, y: 0 }, 1, 800, 600);
    expect(vp.minX).toBe(-400);
    expect(vp.maxX).toBe(400);
    expect(vp.minY).toBe(-300);
    expect(vp.maxY).toBe(300);
  });

  it("halves the visible range at zoom=2", () => {
    const vp = computeViewport({ x: 0, y: 0 }, 2, 800, 600);
    expect(vp.minX).toBe(-200);
    expect(vp.maxX).toBe(200);
    expect(vp.minY).toBe(-150);
    expect(vp.maxY).toBe(150);
  });

  it("offsets the viewport by center position", () => {
    const vp = computeViewport({ x: 500, y: 300 }, 1, 200, 100);
    expect(vp.minX).toBe(400);
    expect(vp.maxX).toBe(600);
    expect(vp.minY).toBe(250);
    expect(vp.maxY).toBe(350);
  });
});

describe("mapToScreen / screenToMap round-trip", () => {
  const cases: Array<{
    label: string;
    mapX: number;
    mapY: number;
    center: { x: number; y: number };
    zoom: number;
    svgWidth: number;
    svgHeight: number;
  }> = [
    {
      label: "origin at zoom=1, centered at origin",
      mapX: 0,
      mapY: 0,
      center: { x: 0, y: 0 },
      zoom: 1,
      svgWidth: 800,
      svgHeight: 600,
    },
    {
      label: "off-center point at zoom=2",
      mapX: 150,
      mapY: -75,
      center: { x: 100, y: -50 },
      zoom: 2,
      svgWidth: 1024,
      svgHeight: 768,
    },
    {
      label: "large coordinates at fractional zoom",
      mapX: 3000,
      mapY: 1500,
      center: { x: 2500, y: 1000 },
      zoom: 0.5,
      svgWidth: 400,
      svgHeight: 300,
    },
  ];

  for (const {
    label,
    mapX,
    mapY,
    center,
    zoom,
    svgWidth,
    svgHeight,
  } of cases) {
    it(`round-trips correctly: ${label}`, () => {
      const screen = mapToScreen(mapX, mapY, center, zoom, svgWidth, svgHeight);
      const result = screenToMap(
        screen.x,
        screen.y,
        center,
        zoom,
        svgWidth,
        svgHeight,
      );
      expect(result.x).toBeCloseTo(mapX, 10);
      expect(result.y).toBeCloseTo(mapY, 10);
    });
  }

  it("places the center coordinate at the screen center", () => {
    const center = { x: 200, y: 300 };
    const screen = mapToScreen(center.x, center.y, center, 2, 800, 600);
    expect(screen.x).toBeCloseTo(400, 10);
    expect(screen.y).toBeCloseTo(300, 10);
  });

  it("screenToMap of screen center returns map center", () => {
    const center = { x: 200, y: 300 };
    const result = screenToMap(400, 300, center, 2, 800, 600);
    expect(result.x).toBeCloseTo(200, 10);
    expect(result.y).toBeCloseTo(300, 10);
  });

  it("Y axis is inverted: positive mapY maps to screen y < svgHeight/2", () => {
    // A point above center in map space should appear above the screen midpoint
    // (lower screen Y value because SVG Y increases downward).
    const center = { x: 0, y: 0 };
    const screen = mapToScreen(0, 100, center, 1, 800, 600);
    expect(screen.y).toBeLessThan(300);
  });
});
