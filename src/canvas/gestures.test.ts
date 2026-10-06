import { describe, expect, it } from "vitest";
import {
  exceedsDragThreshold,
  keyAction,
  panByPixels,
  pinchUpdate,
  wheelZoomFactor,
  zoomAtPoint,
} from "./gestures";
import { screenToWorld } from "./projection";
import type { IPoint } from "./types";

const size = { width: 800, height: 600 };

describe("exceedsDragThreshold", () => {
  it("uses a smaller threshold for mouse than touch", () => {
    expect(exceedsDragThreshold({ x: 0, y: 0 }, { x: 3, y: 0 }, "mouse")).toBe(
      false,
    );
    expect(exceedsDragThreshold({ x: 0, y: 0 }, { x: 5, y: 0 }, "mouse")).toBe(
      true,
    );
    expect(exceedsDragThreshold({ x: 0, y: 0 }, { x: 6, y: 0 }, "touch")).toBe(
      false,
    );
    expect(exceedsDragThreshold({ x: 0, y: 0 }, { x: 9, y: 0 }, "touch")).toBe(
      true,
    );
  });
});

describe("panByPixels", () => {
  const viewport = { center: { x: 0, y: 0 }, zoom: 2 };

  it("moves content with the pointer when y points down", () => {
    expect(panByPixels(viewport, 20, 10, "down").center).toEqual({
      x: -10,
      y: -5,
    });
  });

  it("moves content with the pointer when y points up", () => {
    expect(panByPixels(viewport, 20, 10, "up").center).toEqual({
      x: -10,
      y: 5,
    });
  });
});

describe("zoomAtPoint", () => {
  it.each(["up", "down"] as const)(
    "keeps the world point under the pointer fixed with y %s",
    (yAxis) => {
      const viewport = { center: { x: 10, y: 20 }, zoom: 1 };
      const pointer = { x: 600, y: 450 };
      const before = screenToWorld(pointer, viewport, size, yAxis);
      const zoomed = zoomAtPoint(viewport, size, pointer, 2, yAxis);
      const after = screenToWorld(pointer, zoomed, size, yAxis);
      expect(zoomed.zoom).toBe(2);
      expect(after.x).toBeCloseTo(before.x);
      expect(after.y).toBeCloseTo(before.y);
    },
  );

  it.each([
    ["maxZoom", 4, 2, { maxZoom: 4 }],
    ["minZoom", 0.5, 0.5, { minZoom: 0.5 }],
  ])(
    "does not move the center when already at %s",
    (_, zoom, factor, limits) => {
      const viewport = { center: { x: 10, y: 20 }, zoom };
      const zoomed = zoomAtPoint(
        viewport,
        size,
        { x: 600, y: 450 },
        factor === 2 ? 2 : 0.5,
        "up",
        limits,
      );
      expect(zoomed).toEqual(viewport);
    },
  );

  it("clamps a partial zoom step to the limit and anchors at the clamped zoom", () => {
    const viewport = { center: { x: 0, y: 0 }, zoom: 3 };
    const pointer = { x: 600, y: 450 };
    const before = screenToWorld(pointer, viewport, size, "up");
    const zoomed = zoomAtPoint(viewport, size, pointer, 2, "up", {
      maxZoom: 4,
    });
    const after = screenToWorld(pointer, zoomed, size, "up");
    expect(zoomed.zoom).toBe(4);
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
  });
});

describe("wheelZoomFactor", () => {
  it("zooms in for negative delta and out for positive delta", () => {
    expect(wheelZoomFactor(-100, 0, false)).toBeGreaterThan(1);
    expect(wheelZoomFactor(100, 0, false)).toBeLessThan(1);
  });

  it("converts page deltas to pixels", () => {
    expect(wheelZoomFactor(-1, 2, false)).toBeGreaterThan(
      wheelZoomFactor(-1, 1, false),
    );
  });

  it("treats ctrlKey as a trackpad pinch with its own sensitivity", () => {
    expect(wheelZoomFactor(-10, 0, true)).toBeCloseTo(Math.exp(0.1));
    expect(wheelZoomFactor(-10, 0, false)).toBeCloseTo(Math.exp(0.02));
  });

  it("converts line deltas to pixels", () => {
    expect(wheelZoomFactor(-1, 1, false)).toBeCloseTo(
      wheelZoomFactor(-16, 0, false),
    );
  });
});

describe("pinchUpdate", () => {
  it("zooms by the change in finger distance around the midpoint", () => {
    const viewport = { center: { x: 0, y: 0 }, zoom: 1 };
    const previous: [IPoint, IPoint] = [
      { x: 300, y: 300 },
      { x: 500, y: 300 },
    ];
    const next: [IPoint, IPoint] = [
      { x: 200, y: 300 },
      { x: 600, y: 300 },
    ];
    const result = pinchUpdate(previous, next, viewport, size, "up");
    expect(result.zoom).toBeCloseTo(2);
    const anchorBefore = screenToWorld(
      { x: 400, y: 300 },
      viewport,
      size,
      "up",
    );
    const anchorAfter = screenToWorld({ x: 400, y: 300 }, result, size, "up");
    expect(anchorAfter.x).toBeCloseTo(anchorBefore.x);
    expect(anchorAfter.y).toBeCloseTo(anchorBefore.y);
  });

  it("pans when both fingers move together", () => {
    const viewport = { center: { x: 0, y: 0 }, zoom: 1 };
    const previous: [IPoint, IPoint] = [
      { x: 300, y: 300 },
      { x: 500, y: 300 },
    ];
    const next: [IPoint, IPoint] = [
      { x: 350, y: 300 },
      { x: 550, y: 300 },
    ];
    expect(pinchUpdate(previous, next, viewport, size, "down")).toEqual({
      center: { x: -50, y: 0 },
      zoom: 1,
    });
  });
});

describe("keyAction", () => {
  it("pans a tenth of the view with arrow keys", () => {
    expect(keyAction("ArrowLeft", size)).toEqual({
      type: "pan",
      dx: 80,
      dy: 0,
    });
    expect(keyAction("ArrowRight", size)).toEqual({
      type: "pan",
      dx: -80,
      dy: 0,
    });
    expect(keyAction("ArrowUp", size)).toEqual({ type: "pan", dx: 0, dy: 60 });
    expect(keyAction("ArrowDown", size)).toEqual({
      type: "pan",
      dx: 0,
      dy: -60,
    });
  });

  it("zooms with plus and minus", () => {
    expect(keyAction("+", size)).toEqual({ type: "zoom", factor: 1.25 });
    expect(keyAction("=", size)).toEqual({ type: "zoom", factor: 1.25 });
    expect(keyAction("-", size)).toEqual({ type: "zoom", factor: 0.8 });
  });

  it("ignores other keys", () => {
    expect(keyAction("x", size)).toBeNull();
  });
});
