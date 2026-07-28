import { describe, it, expect } from "vitest";
import { computeVisibleDotSet, overlapsAnyDot } from "./dotCollision";
import { IPlanet, MapColor } from "../types";

function makePlanet(id: string, x: number, y: number): IPlanet {
  return { id, name: id, position: { x, y }, color: MapColor.Blue };
}

describe("overlapsAnyDot", () => {
  it("returns true when the point is within 2x radius of a placed point", () => {
    expect(overlapsAnyDot({ x: 0, y: 0 }, 4, [{ x: 5, y: 0 }])).toBe(true);
  });

  it("returns false when the point is farther than 2x radius from every placed point", () => {
    expect(overlapsAnyDot({ x: 0, y: 0 }, 4, [{ x: 100, y: 0 }])).toBe(false);
  });

  it("returns false against an empty placed list", () => {
    expect(overlapsAnyDot({ x: 0, y: 0 }, 4, [])).toBe(false);
  });
});

describe("computeVisibleDotSet", () => {
  it("returns an empty set for an empty planet list", () => {
    expect(computeVisibleDotSet([], 4, 1)).toEqual(new Set());
  });

  it("includes all dots when none overlap on screen", () => {
    const planets = [
      makePlanet("a", 0, 0),
      makePlanet("b", 1000, 1000),
      makePlanet("c", -1000, -1000),
    ];

    expect(computeVisibleDotSet(planets, 4, 1)).toEqual(
      new Set(["a", "b", "c"]),
    );
  });

  it("skips a lower-priority dot that overlaps a higher-priority one", () => {
    const planets = [makePlanet("a", 0, 0), makePlanet("b", 1, 1)];

    expect(computeVisibleDotSet(planets, 4, 1)).toEqual(new Set(["a"]));
  });

  it("always includes the selected planet first, even if a higher-priority planet would otherwise have claimed its spot", () => {
    const planets = [
      makePlanet("a", 0, 0),
      makePlanet("selected", 1, 1),
      makePlanet("c", 1000, 1000),
    ];

    const result = computeVisibleDotSet(planets, 4, 1, "selected");

    expect(result.has("selected")).toBe(true);
    expect(result.has("a")).toBe(false);
    expect(result.has("c")).toBe(true);
  });

  it("treats the same map distance as overlapping at low zoom but not at high zoom", () => {
    const planets = [makePlanet("a", 0, 0), makePlanet("b", 10, 10)];

    expect(computeVisibleDotSet(planets, 4, 0.1)).toEqual(new Set(["a"]));
    expect(computeVisibleDotSet(planets, 4, 10)).toEqual(new Set(["a", "b"]));
  });

  it("never returns more ids than were given as input", () => {
    const planets = [
      makePlanet("a", 0, 0),
      makePlanet("b", 0, 0),
      makePlanet("c", 0, 0),
    ];

    expect(computeVisibleDotSet(planets, 4, 1).size).toBeLessThanOrEqual(
      planets.length,
    );
  });
});
