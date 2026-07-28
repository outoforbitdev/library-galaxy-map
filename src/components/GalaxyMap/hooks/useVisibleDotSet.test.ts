import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVisibleDotSet } from "./useVisibleDotSet";
import { IPlanet, MapColor } from "../../../types";
import { PLANET_SIZE_DEBOUNCE_MS } from "../constants";

function makePlanet(id: string, x: number, y: number): IPlanet {
  return { id, name: id, position: { x, y }, color: MapColor.Blue };
}

describe("useVisibleDotSet", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the computed visible dot set after the debounce settles", () => {
    const planets = [makePlanet("a", 0, 0), makePlanet("b", 1000, 1000)];

    const { result } = renderHook(() => useVisibleDotSet(planets, 1));

    act(() => {
      vi.advanceTimersByTime(PLANET_SIZE_DEBOUNCE_MS);
    });

    expect(result.current).toEqual(new Set(["a", "b"]));
  });

  it("seeds the initial value synchronously at mount, so dots are never briefly hidden", () => {
    const planets = [makePlanet("a", 0, 0), makePlanet("b", 1000, 1000)];

    const { result } = renderHook(() => useVisibleDotSet(planets, 1));

    // No timer advance at all — the very first render should already
    // reflect the computed set, not an empty placeholder.
    expect(result.current).toEqual(new Set(["a", "b"]));
  });

  it("does not recompute for an intermediate zoom change within the debounce window", () => {
    // At an extremely high zoom these two nearby planets don't overlap on
    // screen; at an extremely low zoom they do. Using extreme, far-apart
    // zoom values keeps this test about debounce timing, not about being
    // precisely on the right side of a tier boundary.
    const planets = [makePlanet("a", 0, 0), makePlanet("b", 1, 1)];

    const { result, rerender } = renderHook(
      ({ zoom }) => useVisibleDotSet(planets, zoom),
      { initialProps: { zoom: 1000 } },
    );
    expect(result.current).toEqual(new Set(["a", "b"]));

    rerender({ zoom: 0.0001 });

    act(() => {
      vi.advanceTimersByTime(PLANET_SIZE_DEBOUNCE_MS - 20);
    });
    expect(result.current).toEqual(new Set(["a", "b"]));

    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(result.current).toEqual(new Set(["a"]));
  });

  it("uses the effective on-screen radius (css radius * zoom), not the raw css radius, so overlap verdicts stay consistent across zoom levels", () => {
    // A screen distance safely greater than 2x the target dot radius
    // (~8px) should never register as overlapping, at any zoom — the
    // css radius returned by computeZoomCompensatedRadius grows huge at
    // low zoom specifically so that, once multiplied by the transform's
    // scale(zoom), it settles back to roughly the same on-screen size.
    // Comparing raw css radius directly against screen distances skips
    // that multiplication and breaks worst at low zoom.
    const screenDistance = 20;

    const lowZoom = 0.001;
    const { result: lowZoomResult } = renderHook(() =>
      useVisibleDotSet(
        [makePlanet("a", 0, 0), makePlanet("b", screenDistance / lowZoom, 0)],
        lowZoom,
      ),
    );
    expect(lowZoomResult.current).toEqual(new Set(["a", "b"]));

    const highZoom = 100;
    const { result: highZoomResult } = renderHook(() =>
      useVisibleDotSet(
        [makePlanet("a", 0, 0), makePlanet("b", screenDistance / highZoom, 0)],
        highZoom,
      ),
    );
    expect(highZoomResult.current).toEqual(new Set(["a", "b"]));
  });

  it("forwards selectedPlanetId so the selected planet is always visible", () => {
    const planets = [makePlanet("a", 0, 0), makePlanet("selected", 1, 1)];

    const { result } = renderHook(() =>
      useVisibleDotSet(planets, 10, "selected"),
    );

    act(() => {
      vi.advanceTimersByTime(PLANET_SIZE_DEBOUNCE_MS);
    });

    expect(result.current.has("selected")).toBe(true);
  });
});
