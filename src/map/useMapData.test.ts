import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ISpacelane, ISystem } from "./types";
import { useMapData } from "./useMapData";

const system = (id: string, x: number, y: number, color = "red"): ISystem => ({
  id,
  name: id,
  position: { x, y },
  color,
});
const lane = (id: string): ISpacelane => ({
  id,
  name: id,
  segments: [
    {
      id: `${id}-0`,
      origin: { x: 0, y: 0 },
      destination: { x: 10, y: 10 },
      color: "blue",
    },
  ],
});

afterEach(() => {
  vi.restoreAllMocks();
});

function setup(systems: ISystem[], lanes: ISpacelane[]) {
  return renderHook(({ s, l }) => useMapData(s, l), {
    initialProps: { s: systems, l: lanes },
  });
}

describe("useMapData", () => {
  it("keeps the index when only colors change, even with recreated objects", () => {
    const { result, rerender } = setup([system("a", 0, 0)], [lane("x")]);
    const { systemIndex, laneIndex, bounds } = result.current;
    rerender({ s: [system("a", 0, 0, "green")], l: [lane("x")] });
    expect(result.current.systemIndex).toBe(systemIndex);
    expect(result.current.laneIndex).toBe(laneIndex);
    expect(result.current.bounds).toBe(bounds);
    expect(result.current.systems[0].color).toBe("green");
  });

  it("rebuilds only the index whose geometry changed", () => {
    const lanes = [lane("x")];
    const { result, rerender } = setup([system("a", 0, 0)], lanes);
    const { systemIndex, laneIndex } = result.current;
    rerender({ s: [system("a", 5, 5)], l: lanes });
    expect(result.current.systemIndex).not.toBe(systemIndex);
    expect(result.current.laneIndex).toBe(laneIndex);
  });

  it("looks up entities by id", () => {
    const { result } = setup(
      [system("a", 0, 0), system("b", 1, 1)],
      [lane("a")],
    );
    expect(result.current.systemById.get("b")).toBe(1);
    expect(result.current.laneById.get("a")).toBe(0);
  });

  it("computes data bounds, with a default box for no data", () => {
    expect(
      setup([system("a", -5, 0), system("b", 5, 20)], []).result.current.bounds,
    ).toEqual({
      min: { x: -5, y: 0 },
      max: { x: 5, y: 20 },
    });
    expect(setup([], []).result.current.bounds).toEqual({
      min: { x: -100, y: -100 },
      max: { x: 100, y: 100 },
    });
  });

  it("warns once per data problem", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const duplicates = [system("a", 0, 0), system("a", 1, 1)];
    const { rerender } = setup(duplicates, []);
    rerender({ s: [...duplicates], l: [] });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('[galaxy-map] Duplicate system id "a".');
  });
});
