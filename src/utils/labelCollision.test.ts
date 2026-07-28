import { describe, it, expect } from "vitest";
import {
  overlapsAny,
  estimateLabelBox,
  computeLabelSet,
} from "./labelCollision";
import { IPlanet, MapColor } from "../types";

function makePlanet(name: string, x: number, y: number): IPlanet {
  return { id: name, name, position: { x, y }, color: MapColor.Gray };
}

describe("overlapsAny", () => {
  it("returns true when the box overlaps a placed box", () => {
    const box = { x: 0, y: 0, w: 10, h: 10 };
    const placed = [{ x: 5, y: 5, w: 10, h: 10 }];

    expect(overlapsAny(box, placed)).toBe(true);
  });

  it("returns false when the box does not overlap any placed box", () => {
    const box = { x: 0, y: 0, w: 10, h: 10 };
    const placed = [{ x: 100, y: 100, w: 10, h: 10 }];

    expect(overlapsAny(box, placed)).toBe(false);
  });

  it("returns false against an empty placed list", () => {
    const box = { x: 0, y: 0, w: 10, h: 10 };

    expect(overlapsAny(box, [])).toBe(false);
  });
});

describe("estimateLabelBox", () => {
  it("scales box dimensions and offsets down as zoom increases", () => {
    const planet = makePlanet("AB", 0, 0);

    const atZoom1 = estimateLabelBox(planet, 1);
    const atZoom2 = estimateLabelBox(planet, 2);

    expect(atZoom1).toEqual({ x: 10, y: -19, w: 14, h: 14 });
    expect(atZoom2).toEqual({ x: 5, y: -9.5, w: 7, h: 7 });
  });
});

describe("computeLabelSet", () => {
  it("returns an empty set for an empty planet list", () => {
    expect(computeLabelSet([], 5, 1)).toEqual(new Set());
  });

  it("includes all labels when none overlap", () => {
    const planets = [
      makePlanet("a", 0, 0),
      makePlanet("b", 1000, 1000),
      makePlanet("c", -1000, -1000),
    ];

    expect(computeLabelSet(planets, 5, 1)).toEqual(new Set(["a", "b", "c"]));
  });

  it("skips a lower-priority label that overlaps a higher-priority one", () => {
    const planets = [makePlanet("a", 0, 0), makePlanet("b", 1, 1)];

    expect(computeLabelSet(planets, 5, 1)).toEqual(new Set(["a"]));
  });

  it("respects the label limit after collision filtering", () => {
    const planets = [
      makePlanet("a", 0, 0),
      makePlanet("b", 1000, 1000),
      makePlanet("c", -1000, -1000),
    ];

    expect(computeLabelSet(planets, 2, 1)).toEqual(new Set(["a", "b"]));
  });

  it("always includes the selected planet, even beyond the limit", () => {
    const planets = [
      makePlanet("a", 0, 0),
      makePlanet("b", 1000, 1000),
      makePlanet("selected", -1000, -1000),
    ];

    const result = computeLabelSet(planets, 2, 1, "selected");

    expect(result.has("selected")).toBe(true);
  });
});
