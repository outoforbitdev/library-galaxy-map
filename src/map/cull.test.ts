import { describe, expect, it } from "vitest";
import { cull, type ICullInput } from "./cull";
import { buildLaneIndex, buildSystemIndex } from "./spatialIndex";
import type { IEntityRef, ISpacelane, ISystem } from "./types";

const system = (id: string, x: number, y: number, name = id): ISystem => ({
  id,
  name,
  position: { x, y },
  color: "red",
});

const lane = (id: string, points: [number, number][]): ISpacelane => ({
  id,
  name: id,
  segments: points.slice(1).map((point, i) => ({
    id: `${id}-${i}`,
    origin: { x: points[i][0], y: points[i][1] },
    destination: { x: point[0], y: point[1] },
    color: "blue",
  })),
});

function input(
  systems: ISystem[],
  lanes: ISpacelane[] = [],
  overrides: Partial<ICullInput> = {},
): ICullInput {
  return {
    systems,
    lanes,
    systemIndex: buildSystemIndex(systems),
    laneIndex: buildLaneIndex(lanes),
    viewport: { center: { x: 0, y: 0 }, zoom: 1 },
    size: { width: 800, height: 600 },
    selected: null,
    limits: { maxSystems: 500, maxLabels: 100, maxLaneSegments: 600 },
    enabled: true,
    measure: (text) => text.length * 7,
    ...overrides,
  };
}

const select = (kind: IEntityRef["kind"], id: string) => ({
  selected: { kind, id },
});

describe("cull systems", () => {
  it("keeps the earlier system when glyphs collide", () => {
    expect(cull(input([system("A", 0, 0), system("B", 3, 0)])).systems).toEqual(
      [{ index: 0, labeled: true }],
    );
  });

  it("shows a glyph without its label when only the label collides", () => {
    const result = cull(
      input([system("A", 0, 0, "Alpha"), system("F", -30, 0, "Foxtrot")]),
    );
    expect(result.systems).toEqual([
      { index: 0, labeled: true },
      { index: 1, labeled: false },
    ]);
  });

  it("keeps a glyph that overlaps an earlier label, and hides only the later label", () => {
    const result = cull(
      input([system("A", 0, 0, "Alpha"), system("D", 20, 0)]),
    );
    expect(result.systems).toEqual([
      { index: 0, labeled: true },
      { index: 1, labeled: false },
    ]);
  });

  it("chooses the same glyphs whatever the labels say", () => {
    const positions: [number, number][] = [
      [0, 0],
      [15, 0],
      [40, 3],
      [70, 0],
      [3, 30],
    ];
    const glyphs = (name: string) =>
      cull(
        input(positions.map(([x, y], i) => system(`s${i}`, x, y, name))),
      ).systems.map((s) => s.index);
    expect(glyphs("A")).toEqual(glyphs("A very long system name"));
  });

  it("stops at maxSystems and maxLabels", () => {
    const systems = [
      system("A", 0, 0),
      system("B", 0, 100),
      system("C", 0, -100),
    ];
    expect(
      cull(
        input(systems, [], {
          limits: { maxSystems: 2, maxLabels: 1, maxLaneSegments: 600 },
        }),
      ).systems,
    ).toEqual([
      { index: 0, labeled: true },
      { index: 1, labeled: false },
    ]);
  });

  it("promotes the selected system and always labels it", () => {
    const systems = [system("A", 0, 0), system("B", 3, 0)];
    expect(cull(input(systems, [], select("system", "B"))).systems).toEqual([
      { index: 1, labeled: true },
    ]);
    const noLabels = {
      limits: { maxSystems: 500, maxLabels: 0, maxLaneSegments: 600 },
    };
    expect(
      cull(input(systems, [], { ...select("system", "B"), ...noLabels }))
        .systems[0],
    ).toEqual({
      index: 1,
      labeled: true,
    });
  });

  it("includes systems within the margin and excludes those beyond it", () => {
    const result = cull(input([system("in", 450, 0), system("out", 500, 0)]));
    expect(result.systems.map((s) => s.index)).toEqual([0]);
  });

  it("skips systems with non-finite positions", () => {
    expect(
      cull(input([system("bad", NaN, 0), system("ok", 0, 0)])).systems,
    ).toEqual([{ index: 1, labeled: true }]);
  });

  it("returns every valid system, labeled, when culling is disabled", () => {
    const systems = [
      system("A", 0, 0),
      system("B", 3, 0),
      system("far", 5000, 0),
      system("bad", NaN, 0),
    ];
    expect(cull(input(systems, [], { enabled: false })).systems).toEqual([
      { index: 0, labeled: true },
      { index: 1, labeled: true },
      { index: 2, labeled: true },
    ]);
  });

  it("is deterministic", () => {
    const systems = Array.from({ length: 200 }, (_, i) =>
      system(`s${i}`, (i * 37) % 400, (i * 91) % 300),
    );
    expect(cull(input(systems))).toEqual(cull(input(systems)));
  });
});

describe("cull lanes", () => {
  const lanes = [
    lane("two", [
      [0, 0],
      [10, 0],
      [20, 0],
    ]),
    lane("three", [
      [0, 10],
      [10, 10],
      [20, 10],
      [30, 10],
    ]),
  ];

  it("keeps lanes in priority order until the segment budget", () => {
    const limits = { maxSystems: 500, maxLabels: 100, maxLaneSegments: 4 };
    expect(cull(input([], lanes, { limits })).lanes).toEqual([0]);
  });

  it("puts the selected lane first", () => {
    const limits = { maxSystems: 500, maxLabels: 100, maxLaneSegments: 4 };
    expect(
      cull(input([], lanes, { limits, ...select("lane", "three") })).lanes,
    ).toEqual([1]);
  });

  it("skips lanes with no segment in view", () => {
    expect(
      cull(
        input(
          [],
          [
            lane("far", [
              [5000, 5000],
              [6000, 5000],
            ]),
            ...lanes,
          ],
        ),
      ).lanes,
    ).toEqual([1, 2]);
  });

  it("returns every lane when culling is disabled", () => {
    expect(
      cull(
        input(
          [],
          [
            lane("far", [
              [5000, 5000],
              [6000, 5000],
            ]),
            ...lanes,
          ],
          { enabled: false },
        ),
      ).lanes,
    ).toEqual([0, 1, 2]);
  });
});
