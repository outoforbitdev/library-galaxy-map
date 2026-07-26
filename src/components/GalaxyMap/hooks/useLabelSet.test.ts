import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLabelSet } from "./useLabelSet";
import { IPlanet, MapColor } from "../../../types";
import { LABEL_COLLISION_DEBOUNCE_MS } from "../constants";

function makePlanet(id: string, x: number, y: number): IPlanet {
  return { id, name: id, position: { x, y }, color: MapColor.Gray };
}

describe("useLabelSet", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the computed label set after the debounce settles", () => {
    const planets = [makePlanet("a", 0, 0), makePlanet("b", 1000, 1000)];

    const { result } = renderHook(() => useLabelSet(planets, 5, 1));

    act(() => {
      vi.advanceTimersByTime(LABEL_COLLISION_DEBOUNCE_MS);
    });

    expect(result.current).toEqual(new Set(["a", "b"]));
  });

  it("does not recompute for an intermediate zoom change within the debounce window", () => {
    const planets = [makePlanet("a", 0, 0), makePlanet("b", 1000, 1000)];

    const { result, rerender } = renderHook(
      ({ zoom }) => useLabelSet(planets, 5, zoom),
      { initialProps: { zoom: 1 } },
    );

    act(() => {
      vi.advanceTimersByTime(LABEL_COLLISION_DEBOUNCE_MS - 20);
    });
    expect(result.current).toEqual(new Set());

    rerender({ zoom: 2 });

    act(() => {
      vi.advanceTimersByTime(LABEL_COLLISION_DEBOUNCE_MS - 20);
    });
    expect(result.current).toEqual(new Set());

    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(result.current).toEqual(new Set(["a", "b"]));
  });

  it("forwards selectedPlanetId to computeLabelSet", () => {
    const planets = [
      makePlanet("a", 0, 0),
      makePlanet("b", 1000, 1000),
      makePlanet("far", -1000, -1000),
    ];

    const { result } = renderHook(() =>
      useLabelSet(planets, 2, 1, "far"),
    );

    act(() => {
      vi.advanceTimersByTime(LABEL_COLLISION_DEBOUNCE_MS);
    });

    expect(result.current.has("far")).toBe(true);
  });
});
