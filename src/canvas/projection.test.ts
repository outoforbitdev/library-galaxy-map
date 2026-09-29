import { describe, expect, it } from "vitest";
import {
  clampViewport,
  easeInOut,
  fitViewport,
  interpolateViewport,
  screenToWorld,
  visibleWorldRect,
  worldToScreen,
  worldTransform,
} from "./projection";
import type { IViewport } from "./types";

const size = { width: 800, height: 600 };
const viewport: IViewport = { center: { x: 100, y: 50 }, zoom: 2 };

describe("worldToScreen and screenToWorld", () => {
  it("maps the view center to the middle of the screen", () => {
    expect(worldToScreen({ x: 100, y: 50 }, viewport, size, "down")).toEqual({
      x: 400,
      y: 300,
    });
    expect(worldToScreen({ x: 100, y: 50 }, viewport, size, "up")).toEqual({
      x: 400,
      y: 300,
    });
  });

  it("puts larger world y lower on screen when y points down", () => {
    expect(worldToScreen({ x: 110, y: 60 }, viewport, size, "down")).toEqual({
      x: 420,
      y: 320,
    });
  });

  it("puts larger world y higher on screen when y points up", () => {
    expect(worldToScreen({ x: 110, y: 60 }, viewport, size, "up")).toEqual({
      x: 420,
      y: 280,
    });
  });

  it.each(["up", "down"] as const)("round trips with y %s", (yAxis) => {
    const point = { x: -37.5, y: 812.25 };
    const back = screenToWorld(
      worldToScreen(point, viewport, size, yAxis),
      viewport,
      size,
      yAxis,
    );
    expect(back.x).toBeCloseTo(point.x);
    expect(back.y).toBeCloseTo(point.y);
  });
});

describe("worldTransform", () => {
  it("produces a matrix that agrees with worldToScreen", () => {
    expect(worldTransform(viewport, size, "up")).toBe(
      "matrix(2 0 0 -2 200 400)",
    );
    expect(worldTransform(viewport, size, "down")).toBe(
      "matrix(2 0 0 2 200 200)",
    );
  });
});

describe("visibleWorldRect", () => {
  it("returns the world area on screen", () => {
    expect(visibleWorldRect(viewport, size)).toEqual({
      min: { x: -100, y: -100 },
      max: { x: 300, y: 200 },
    });
  });

  it("adds a margin as a fraction of the view on each side", () => {
    const rect = visibleWorldRect(viewport, size, 0.1);
    expect(rect.min.x).toBeCloseTo(-140);
    expect(rect.max.x).toBeCloseTo(340);
  });
});

describe("clampViewport", () => {
  const bounds = { min: { x: 0, y: 0 }, max: { x: 1000, y: 1000 } };

  it("clamps zoom to the limits", () => {
    expect(
      clampViewport({ center: { x: 0, y: 0 }, zoom: 10 }, { maxZoom: 4 }, size)
        .zoom,
    ).toBe(4);
    expect(
      clampViewport(
        { center: { x: 0, y: 0 }, zoom: 0.1 },
        { minZoom: 0.5 },
        size,
      ).zoom,
    ).toBe(0.5);
  });

  it("lets the center move half a view beyond the bounds", () => {
    const clamped = clampViewport(
      { center: { x: 5000, y: -5000 }, zoom: 2 },
      { bounds },
      size,
    );
    expect(clamped.center).toEqual({ x: 1200, y: -150 });
  });

  it("does not move a camera that is already outside the bounds", () => {
    const current = { center: { x: 3000, y: 500 }, zoom: 2 };
    expect(clampViewport(current, { bounds }, size, current)).toEqual(current);
  });

  it("allows moving back toward the bounds but not further away", () => {
    const current = { center: { x: 3000, y: 500 }, zoom: 2 };
    expect(
      clampViewport(
        { center: { x: 2500, y: 500 }, zoom: 2 },
        { bounds },
        size,
        current,
      ).center.x,
    ).toBe(2500);
    expect(
      clampViewport(
        { center: { x: 3500, y: 500 }, zoom: 2 },
        { bounds },
        size,
        current,
      ).center.x,
    ).toBe(3000);
  });

  it("expands zoom limits to include the current zoom", () => {
    const current = { center: { x: 500, y: 500 }, zoom: 10 };
    expect(
      clampViewport(
        { center: current.center, zoom: 8 },
        { maxZoom: 4 },
        size,
        current,
      ).zoom,
    ).toBe(8);
    expect(
      clampViewport(
        { center: current.center, zoom: 12 },
        { maxZoom: 4 },
        size,
        current,
      ).zoom,
    ).toBe(10);
  });
});

describe("fitViewport", () => {
  const points = [
    { x: 0, y: 0 },
    { x: 100, y: 50 },
  ];

  it("returns null for no points or no size", () => {
    expect(fitViewport([], size)).toBeNull();
    expect(fitViewport(points, { width: 0, height: 0 })).toBeNull();
  });

  it("fits the bounding box of the points", () => {
    expect(fitViewport(points, size)).toEqual({
      center: { x: 50, y: 25 },
      zoom: 8,
    });
  });

  it("keeps padding clear on every side", () => {
    expect(fitViewport(points, size, { padding: 100 })).toEqual({
      center: { x: 50, y: 25 },
      zoom: 6,
    });
  });

  it("offsets the center for uneven padding", () => {
    const fitted = fitViewport(points, size, {
      padding: { top: 0, right: 0, bottom: 0, left: 200 },
    });
    expect(fitted?.zoom).toBe(6);
    expect(
      worldToScreen({ x: 50, y: 25 }, fitted!, size, "down").x,
    ).toBeCloseTo(500);
  });

  it("uses maxZoom for a single point", () => {
    expect(fitViewport([{ x: 5, y: 5 }], size, { maxZoom: 3 })).toEqual({
      center: { x: 5, y: 5 },
      zoom: 3,
    });
  });

  it("clamps to the zoom limits", () => {
    expect(fitViewport(points, size, { maxZoom: 4 })?.zoom).toBe(4);
  });
});

describe("interpolateViewport", () => {
  const from = { center: { x: 0, y: 0 }, zoom: 1 };
  const to = { center: { x: 100, y: -50 }, zoom: 4 };

  it("returns the endpoints at 0 and 1", () => {
    expect(interpolateViewport(from, to, 0)).toEqual(from);
    expect(interpolateViewport(from, to, 1)).toEqual(to);
  });

  it("moves the center linearly and the zoom on a log scale", () => {
    const middle = interpolateViewport(from, to, 0.5);
    expect(middle.center).toEqual({ x: 50, y: -25 });
    expect(middle.zoom).toBeCloseTo(2);
  });

  it("eases in and out", () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(0.5)).toBe(0.5);
    expect(easeInOut(1)).toBe(1);
  });
});
