import { describe, it, expect } from "vitest";
import {
  isPlanetInViewport,
  isSpaceLaneInViewport,
  selectRendered,
} from "./selectRendered";
import { IPlanet, IRenderLimits, ISpacelane, MapColor } from "../types";
import { IViewport } from "./coordinates";

function makePlanet(id: string, x: number, y: number): IPlanet {
  return { id, name: id, position: { x, y }, color: MapColor.Gray };
}

function makeSpacelane(
  id: string,
  origin: { x: number; y: number },
  destination: { x: number; y: number },
): ISpacelane {
  return {
    id,
    segments: [{ origin, destination, color: MapColor.Gray }],
  };
}

const viewport: IViewport = { minX: 0, minY: 0, maxX: 100, maxY: 100 };

describe("isPlanetInViewport", () => {
  it("returns true for a planet inside the viewport", () => {
    expect(isPlanetInViewport(makePlanet("a", 50, 50), viewport)).toBe(true);
  });

  it("returns true for a planet exactly on the viewport boundary", () => {
    expect(isPlanetInViewport(makePlanet("a", 0, 100), viewport)).toBe(true);
  });

  it("returns false for a planet just outside the viewport boundary", () => {
    expect(isPlanetInViewport(makePlanet("a", -1, 50), viewport)).toBe(false);
    expect(isPlanetInViewport(makePlanet("a", 50, 101), viewport)).toBe(false);
  });
});

describe("isSpaceLaneInViewport", () => {
  it("returns true when both endpoints are inside the viewport", () => {
    const lane = makeSpacelane("s1", { x: 10, y: 10 }, { x: 90, y: 90 });

    expect(isSpaceLaneInViewport(lane, viewport)).toBe(true);
  });

  it("returns true when one endpoint is inside and the other is outside", () => {
    const lane = makeSpacelane("s1", { x: 50, y: 50 }, { x: 500, y: 500 });

    expect(isSpaceLaneInViewport(lane, viewport)).toBe(true);
  });

  it("returns false when both endpoints of every segment are outside", () => {
    const lane = makeSpacelane("s1", { x: 500, y: 500 }, { x: 600, y: 600 });

    expect(isSpaceLaneInViewport(lane, viewport)).toBe(false);
  });
});

describe("selectRendered", () => {
  const limits: IRenderLimits = { planets: 2, planetLabels: 2, spacelanes: 2 };

  it("applies the render cap only after viewport culling, not before", () => {
    const planets: IPlanet[] = [
      makePlanet("outside-1", 500, 500),
      makePlanet("in-1", 10, 10),
      makePlanet("in-2", 20, 20),
    ];

    const result = selectRendered(planets, [], limits, viewport);

    expect(result.planets.map((p) => p.id)).toEqual(["in-1", "in-2"]);
  });

  it("includes a spacelane fully or not at all when the cap is reached mid-list", () => {
    const spacelanes: ISpacelane[] = [
      makeSpacelane("s1", { x: 10, y: 10 }, { x: 20, y: 20 }),
      makeSpacelane("s2", { x: 30, y: 30 }, { x: 40, y: 40 }),
      makeSpacelane("s3", { x: 50, y: 50 }, { x: 60, y: 60 }),
    ];

    const result = selectRendered(
      [],
      spacelanes,
      { ...limits, spacelanes: 2 },
      viewport,
    );

    expect(result.spacelanes.map((s) => s.id)).toEqual(["s1", "s2"]);
  });

  it("returns empty lists for empty input", () => {
    const result = selectRendered([], [], limits, viewport);

    expect(result).toEqual({ planets: [], spacelanes: [] });
  });
});
