import { afterEach, describe, expect, it, vi } from "vitest";
import { findDataProblems, isDevelopment } from "./validate";
import type { ISpacelane, ISystem } from "./types";

const system = (id: string, x = 0, y = 0, color = "red"): ISystem => ({
  id,
  name: id,
  position: { x, y },
  color,
});

const lane = (
  id: string,
  segments: [string, [number, number], [number, number]][],
  color = "blue",
): ISpacelane => ({
  id,
  name: id,
  segments: segments.map(([segmentId, from, to]) => ({
    id: segmentId,
    origin: { x: from[0], y: from[1] },
    destination: { x: to[0], y: to[1] },
    color,
  })),
});

describe("findDataProblems", () => {
  it("finds nothing wrong with valid data", () => {
    expect(
      findDataProblems(
        [system("a"), system("b", 5)],
        [lane("x", [["x0", [0, 0], [1, 0]]])],
      ),
    ).toEqual([]);
  });

  it("reports duplicate ids within a kind, but allows the same id across kinds", () => {
    const problems = findDataProblems(
      [system("a"), system("a", 5)],
      [lane("a", [["s", [0, 0], [1, 0]]]), lane("b", [["s", [2, 0], [3, 0]]])],
    );
    expect(problems).toEqual([
      'Duplicate system id "a".',
      'Duplicate segment id "s".',
    ]);
  });

  it("reports non-finite coordinates", () => {
    expect(findDataProblems([system("a", NaN)], [])).toEqual([
      'System "a" has a non-finite position and will not be drawn.',
    ]);
    expect(
      findDataProblems([], [lane("x", [["s", [0, 0], [Infinity, 0]]])]),
    ).toEqual([
      'Segment "s" in spacelane "x" has a non-finite point and will not be drawn.',
    ]);
  });

  it("reports invalid colors", () => {
    const isValidColor = (color: string) => color !== "notacolor";
    expect(
      findDataProblems([system("a", 0, 0, "notacolor")], [], isValidColor),
    ).toEqual(['System "a" has an invalid color "notacolor".']);
  });

  it("reports segments that almost join, but not intentional gaps", () => {
    const almost = lane("x", [
      ["s0", [0, 0], [1, 0]],
      ["s1", [1.0005, 0], [2, 0]],
    ]);
    const gap = lane("y", [
      ["t0", [0, 0], [1, 0]],
      ["t1", [5, 0], [6, 0]],
    ]);
    const problems = findDataProblems([], [almost, gap]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(
      /^Segments "s0" and "s1" in spacelane "x" almost join/,
    );
  });
});

describe("isDevelopment", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("is true under the test runner", () => {
    expect(isDevelopment()).toBe(true);
  });

  it("is false in a production build", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isDevelopment()).toBe(false);
  });

  it("falls back to import.meta.env.DEV where process does not exist", () => {
    vi.stubGlobal("process", undefined);
    expect(isDevelopment()).toBe(true);
  });
});
