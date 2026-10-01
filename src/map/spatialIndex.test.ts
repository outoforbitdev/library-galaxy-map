import { describe, expect, it } from "vitest";
import {
  buildLaneIndex,
  buildSystemIndex,
  dataBounds,
  laneGeometryChanged,
  queryIndex,
  systemGeometryChanged,
} from "./spatialIndex";
import type { ISpacelane, ISystem } from "./types";

const system = (id: string, x: number, y: number, color = "red"): ISystem => ({
  id,
  name: id,
  position: { x, y },
  color,
});

const lane = (
  id: string,
  points: [number, number][],
  color = "blue",
): ISpacelane => ({
  id,
  name: id,
  segments: points.slice(1).map((point, i) => ({
    id: `${id}-${i}`,
    origin: { x: points[i][0], y: points[i][1] },
    destination: { x: point[0], y: point[1] },
    color,
  })),
});

const rect = (x0: number, y0: number, x1: number, y1: number) => ({
  min: { x: x0, y: y0 },
  max: { x: x1, y: y1 },
});

describe("system index", () => {
  const systems = [
    system("a", 0, 0),
    system("b", 1000, 1000),
    system("c", 10, 10),
    system("bad", NaN, 0),
  ];

  it("returns systems near the query area in priority order", () => {
    const found = queryIndex(buildSystemIndex(systems), rect(-5, -5, 20, 20));
    expect(found).toEqual([0, 2]);
  });

  it("skips systems with non-finite positions", () => {
    const found = queryIndex(
      buildSystemIndex(systems),
      rect(-1e9, -1e9, 1e9, 1e9),
    );
    expect(found).not.toContain(3);
  });

  it("returns nothing for empty data", () => {
    expect(queryIndex(buildSystemIndex([]), rect(-1, -1, 1, 1))).toEqual([]);
  });
});

describe("lane index", () => {
  it("finds a lane whose segment crosses the area even when its ends are outside", () => {
    const lanes = [
      lane("long", [
        [-1000, 0],
        [1000, 0],
      ]),
      lane("far", [
        [5000, 5000],
        [6000, 5000],
      ]),
    ];
    expect(queryIndex(buildLaneIndex(lanes), rect(-10, -10, 10, 10))).toEqual([
      0,
    ]);
  });
});

describe("geometry change detection", () => {
  it("ignores color, name, and data changes", () => {
    const before = [system("a", 0, 0, "red")];
    const after = [{ ...system("a", 0, 0, "green"), name: "Renamed", data: 1 }];
    expect(systemGeometryChanged(before, after)).toBe(false);
  });

  it("detects moves, reorders, additions, and removals", () => {
    const before = [system("a", 0, 0), system("b", 5, 5)];
    expect(
      systemGeometryChanged(before, [system("a", 1, 0), system("b", 5, 5)]),
    ).toBe(true);
    expect(
      systemGeometryChanged(before, [system("b", 5, 5), system("a", 0, 0)]),
    ).toBe(true);
    expect(systemGeometryChanged(before, [system("a", 0, 0)])).toBe(true);
    expect(systemGeometryChanged(null, before)).toBe(true);
  });

  it("ignores lane color changes but detects a new lane at the front", () => {
    const before = [
      lane(
        "x",
        [
          [0, 0],
          [1, 1],
        ],
        "blue",
      ),
    ];
    expect(
      laneGeometryChanged(before, [
        lane(
          "x",
          [
            [0, 0],
            [1, 1],
          ],
          "red",
        ),
      ]),
    ).toBe(false);
    expect(
      laneGeometryChanged(before, [
        lane("route", [
          [0, 0],
          [2, 2],
        ]),
        ...before,
      ]),
    ).toBe(true);
  });
});

describe("dataBounds with very large data", () => {
  it("does not overflow the call stack argument limit", () => {
    const systems = Array.from({ length: 300_000 }, (_, i) =>
      system(`s${i}`, i, 5 - i),
    );
    expect(dataBounds(systems, [])).toEqual({
      min: { x: 0, y: -299_994 },
      max: { x: 299_999, y: 5 },
    });
  });
});

describe("dataBounds", () => {
  it("covers every finite system position and lane point", () => {
    const bounds = dataBounds(
      [system("a", -10, 5), system("bad", Infinity, 0)],
      [
        lane("x", [
          [0, -20],
          [30, 0],
        ]),
      ],
    );
    expect(bounds).toEqual(rect(-10, -20, 30, 5));
  });

  it("returns null for no data", () => {
    expect(dataBounds([], [])).toBeNull();
  });
});
