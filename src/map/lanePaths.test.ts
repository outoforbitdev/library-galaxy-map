import { describe, expect, it } from "vitest";
import { laneHitPath, laneRuns, nearestSegmentId } from "./lanePaths";
import type { ILaneSegment, ISpacelane } from "./types";

const seg = (
  id: string,
  from: [number, number],
  to: [number, number],
  color = "red",
): ILaneSegment => ({
  id,
  origin: { x: from[0], y: from[1] },
  destination: { x: to[0], y: to[1] },
  color,
});

describe("laneRuns", () => {
  it("joins connected segments of the same color into one path", () => {
    expect(
      laneRuns([seg("a", [0, 0], [1, 0]), seg("b", [1, 0], [2, 1])]),
    ).toEqual([{ color: "red", d: "M0 0 L1 0 L2 1" }]);
  });

  it("starts a new subpath where segments do not connect exactly", () => {
    expect(
      laneRuns([seg("a", [0, 0], [1, 0]), seg("b", [1.5, 0], [2, 0])]),
    ).toEqual([{ color: "red", d: "M0 0 L1 0 M1.5 0 L2 0" }]);
  });

  it("starts a new run when the color changes", () => {
    expect(
      laneRuns([
        seg("a", [0, 0], [1, 0], "red"),
        seg("b", [1, 0], [2, 0], "blue"),
      ]),
    ).toEqual([
      { color: "red", d: "M0 0 L1 0" },
      { color: "blue", d: "M1 0 L2 0" },
    ]);
  });

  it("skips segments with non-finite points", () => {
    expect(
      laneRuns([seg("a", [0, 0], [NaN, 0]), seg("b", [1, 0], [2, 0])]),
    ).toEqual([{ color: "red", d: "M1 0 L2 0" }]);
  });

  it("handles lanes with zero or one segment", () => {
    expect(laneRuns([])).toEqual([]);
    expect(laneRuns([seg("a", [0, 0], [1, 0])])).toEqual([
      { color: "red", d: "M0 0 L1 0" },
    ]);
  });
});

describe("laneHitPath", () => {
  it("covers every segment regardless of color", () => {
    expect(
      laneHitPath([
        seg("a", [0, 0], [1, 0], "red"),
        seg("b", [1, 0], [2, 0], "blue"),
      ]),
    ).toBe("M0 0 L1 0 L2 0");
  });

  it("is empty for a lane with no segments", () => {
    expect(laneHitPath([])).toBe("");
  });
});

describe("nearestSegmentId", () => {
  const lane: ISpacelane = {
    id: "x",
    name: "X",
    segments: [seg("a", [0, 0], [10, 0]), seg("b", [10, 0], [10, 10])],
  };

  it("returns the segment closest to the point", () => {
    expect(nearestSegmentId(lane, { x: 4, y: 1 })).toBe("a");
    expect(nearestSegmentId(lane, { x: 11, y: 8 })).toBe("b");
  });

  it("returns an empty string for a lane with no segments", () => {
    expect(nearestSegmentId({ ...lane, segments: [] }, { x: 0, y: 0 })).toBe(
      "",
    );
  });
});
