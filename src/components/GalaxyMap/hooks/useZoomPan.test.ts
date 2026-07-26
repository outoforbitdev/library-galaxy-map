import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useZoomPan } from "./useZoomPan";
import { IMapDimensions } from "../../../types";

const dimensions: IMapDimensions = {
  min: { x: 0, y: 0 },
  max: { x: 100, y: 100 },
};

describe("useZoomPan", () => {
  it("initializes zoom from zoom.initial and center from the dimensions midpoint", () => {
    const { result } = renderHook(() =>
      useZoomPan({ dimensions, zoom: { initial: 2 } }),
    );

    expect(result.current.zoom).toBe(2);
    expect(result.current.center).toEqual({ x: 50, y: 50 });
  });

  it("initializes center from initialCenter when provided", () => {
    const { result } = renderHook(() =>
      useZoomPan({
        dimensions,
        zoom: { initial: 1 },
        initialCenter: { x: 10, y: 20 },
      }),
    );

    expect(result.current.center).toEqual({ x: 10, y: 20 });
  });

  it("clamps zoom to zoom.max when a wheel step would exceed the maximum", () => {
    const { result } = renderHook(() =>
      useZoomPan({ dimensions, zoom: { initial: 1.15, max: 1.2 } }),
    );

    act(() => {
      result.current.handlers.onWheel(makeWheelEvent(-1));
    });

    expect(result.current.zoom).toBe(1.2);
  });

  it("clamps zoom to zoom.min when a wheel step would go below the minimum", () => {
    const { result } = renderHook(() =>
      useZoomPan({ dimensions, zoom: { initial: 0.52, min: 0.5 } }),
    );

    act(() => {
      result.current.handlers.onWheel(makeWheelEvent(1));
    });

    expect(result.current.zoom).toBe(0.5);
  });
});

describe("useZoomPan drag pan", () => {
  it("pans the center by the drag delta so the origin point stays under the cursor", () => {
    const { result } = renderHook(() =>
      useZoomPan({
        dimensions,
        zoom: { initial: 1 },
        initialCenter: { x: 50, y: 50 },
      }),
    );

    act(() => {
      result.current.handlers.onMouseDown(makeMouseEvent(100, 50));
    });
    act(() => {
      result.current.handlers.onMouseMove(makeMouseEvent(110, 50));
    });

    expect(result.current.center).toEqual({ x: 40, y: 50 });
  });

  it("sets isDragging while dragging and clears it on mouseup", () => {
    const { result } = renderHook(() =>
      useZoomPan({
        dimensions,
        zoom: { initial: 1 },
        initialCenter: { x: 50, y: 50 },
      }),
    );

    expect(result.current.isDragging.current).toBe(false);

    act(() => {
      result.current.handlers.onMouseDown(makeMouseEvent(100, 50));
    });
    expect(result.current.isDragging.current).toBe(true);

    act(() => {
      result.current.handlers.onMouseUp(makeMouseEvent(110, 50));
    });
    expect(result.current.isDragging.current).toBe(false);
  });
});

describe("useZoomPan callbacks", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires onZoomChange with the new zoom value, throttled to one call per frame", () => {
    const onZoomChange = vi.fn();
    const { result } = renderHook(() =>
      useZoomPan({ dimensions, zoom: { initial: 1 }, onZoomChange }),
    );

    act(() => {
      result.current.handlers.onWheel(makeWheelEvent(-1));
    });
    expect(onZoomChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(20);
    });

    expect(onZoomChange).toHaveBeenCalledTimes(1);
    expect(onZoomChange).toHaveBeenCalledWith(result.current.zoom);
  });

  it("fires onCenterChange with the new center value, throttled to one call per frame", () => {
    const onCenterChange = vi.fn();
    const { result } = renderHook(() =>
      useZoomPan({
        dimensions,
        zoom: { initial: 1 },
        initialCenter: { x: 50, y: 50 },
        onCenterChange,
      }),
    );

    act(() => {
      result.current.handlers.onMouseDown(makeMouseEvent(100, 50));
    });
    act(() => {
      result.current.handlers.onMouseMove(makeMouseEvent(110, 50));
    });
    expect(onCenterChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(20);
    });

    expect(onCenterChange).toHaveBeenCalledTimes(1);
    expect(onCenterChange).toHaveBeenCalledWith(result.current.center);
  });
});

describe("useZoomPan animateTo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("interpolates zoom and center to the target over time", () => {
    const { result } = renderHook(() =>
      useZoomPan({
        dimensions,
        zoom: { initial: 1 },
        initialCenter: { x: 0, y: 0 },
      }),
    );

    act(() => {
      result.current.animateTo({ coordinate: { x: 100, y: 200 }, zoom: 3 });
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.zoom).toBe(3);
    expect(result.current.center).toEqual({ x: 100, y: 200 });
  });
});

describe("useZoomPan touch", () => {
  it("pans the center via single-finger drag, like mouse drag", () => {
    const { result } = renderHook(() =>
      useZoomPan({
        dimensions,
        zoom: { initial: 1 },
        initialCenter: { x: 50, y: 50 },
      }),
    );

    act(() => {
      result.current.handlers.onTouchStart(makeTouchEvent([{ x: 100, y: 50 }]));
    });
    act(() => {
      result.current.handlers.onTouchMove(makeTouchEvent([{ x: 110, y: 50 }]));
    });

    expect(result.current.center).toEqual({ x: 40, y: 50 });
  });

  it("zooms around the midpoint via two-finger pinch", () => {
    const { result } = renderHook(() =>
      useZoomPan({
        dimensions,
        zoom: { initial: 1 },
        initialCenter: { x: 50, y: 50 },
      }),
    );

    act(() => {
      result.current.handlers.onTouchStart(
        makeTouchEvent([
          { x: 90, y: 50 },
          { x: 110, y: 50 },
        ]),
      );
    });
    act(() => {
      result.current.handlers.onTouchMove(
        makeTouchEvent([
          { x: 80, y: 50 },
          { x: 120, y: 50 },
        ]),
      );
    });

    expect(result.current.zoom).toBe(2);
  });
});

function makeTouchEvent(
  points: { x: number; y: number }[],
): React.TouchEvent<SVGSVGElement> {
  return {
    touches: points.map((p) => ({ clientX: p.x, clientY: p.y })),
    preventDefault: () => {},
    currentTarget: {
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 200,
        height: 100,
      }),
    },
  } as unknown as React.TouchEvent<SVGSVGElement>;
}

function makeMouseEvent(
  clientX: number,
  clientY: number,
): React.MouseEvent<SVGSVGElement> {
  return {
    clientX,
    clientY,
    preventDefault: () => {},
    currentTarget: {
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 200,
        height: 100,
      }),
    },
  } as unknown as React.MouseEvent<SVGSVGElement>;
}

function makeWheelEvent(
  deltaY: number,
): React.WheelEvent<SVGSVGElement> {
  return {
    deltaY,
    clientX: 100,
    clientY: 50,
    preventDefault: () => {},
    currentTarget: {
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 200,
        height: 100,
      }),
    },
  } as unknown as React.WheelEvent<SVGSVGElement>;
}
