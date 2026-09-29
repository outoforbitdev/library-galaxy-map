import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ISize, IViewport } from "./types";
import { type IUseViewportOptions, useViewport } from "./useViewport";

const size: ISize = { width: 800, height: 400 };
const start: IViewport = { center: { x: 0, y: 0 }, zoom: 1 };

function setup(overrides: Partial<IUseViewportOptions> = {}) {
  const apply = vi.fn();
  const onViewportChange = vi.fn();
  const initialProps: IUseViewportOptions = {
    size,
    yAxis: "down",
    apply,
    onViewportChange,
    ...overrides,
  };
  const hook = renderHook((props: IUseViewportOptions) => useViewport(props), {
    initialProps,
  });
  return { ...hook, apply, onViewportChange, initialProps };
}

beforeEach(() => {
  vi.useFakeTimers({
    toFake: [
      "setTimeout",
      "clearTimeout",
      "Date",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "performance",
    ],
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useViewport", () => {
  it("applies the default viewport on mount", () => {
    const { apply } = setup({ defaultViewport: start });
    expect(apply).toHaveBeenLastCalledWith(start);
  });

  it("fits the bounds when there is no viewport or default viewport", () => {
    const { apply } = setup({
      bounds: { min: { x: 0, y: 0 }, max: { x: 1000, y: 500 } },
    });
    expect(apply).toHaveBeenLastCalledWith({
      center: { x: 500, y: 250 },
      zoom: 0.8,
    });
  });

  it("fits the bounds once the container gets a size", () => {
    const bounds = { min: { x: 0, y: 0 }, max: { x: 1000, y: 500 } };
    const { apply, rerender, initialProps } = setup({
      bounds,
      size: { width: 0, height: 0 },
    });
    expect(apply).not.toHaveBeenCalled();
    rerender({ ...initialProps, size });
    expect(apply).toHaveBeenLastCalledWith({
      center: { x: 500, y: 250 },
      zoom: 0.8,
    });
  });

  it("applies gesture moves and reports them as unsettled", () => {
    const { result, apply, onViewportChange } = setup({
      defaultViewport: start,
    });
    act(() =>
      result.current.moveBy((v) => ({ ...v, center: { x: 10, y: 0 } })),
    );
    expect(apply).toHaveBeenLastCalledWith({
      center: { x: 10, y: 0 },
      zoom: 1,
    });
    expect(onViewportChange).toHaveBeenLastCalledWith(
      { center: { x: 10, y: 0 }, zoom: 1 },
      { settled: false },
    );
    act(() => result.current.settle());
    expect(onViewportChange).toHaveBeenLastCalledWith(
      { center: { x: 10, y: 0 }, zoom: 1 },
      { settled: true },
    );
  });

  it("throttles publishing during movement and publishes immediately on settle", () => {
    const { result } = setup({ defaultViewport: start });
    act(() => result.current.moveBy((v) => ({ ...v, center: { x: 1, y: 0 } })));
    act(() => result.current.moveBy((v) => ({ ...v, center: { x: 2, y: 0 } })));
    expect(result.current.published).toEqual(start);
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.published.center.x).toBe(2);
    act(() => result.current.moveBy((v) => ({ ...v, center: { x: 3, y: 0 } })));
    act(() => result.current.settle());
    expect(result.current.published.center.x).toBe(3);
  });

  it("in controlled mode, emits moves but only applies the viewport prop", () => {
    const { result, apply, onViewportChange, rerender, initialProps } = setup({
      viewport: start,
    });
    apply.mockClear();
    act(() =>
      result.current.moveBy((v) => ({ ...v, center: { x: 10, y: 0 } })),
    );
    expect(onViewportChange).toHaveBeenLastCalledWith(
      { center: { x: 10, y: 0 }, zoom: 1 },
      { settled: false },
    );
    expect(apply).not.toHaveBeenCalled();
    const next = { center: { x: 10, y: 0 }, zoom: 1 };
    rerender({ ...initialProps, viewport: next });
    expect(apply).toHaveBeenLastCalledWith(next);
  });

  it("clamps gestures with expanding bounds", () => {
    const bounds = { min: { x: 0, y: 0 }, max: { x: 100, y: 100 } };
    const outside = { center: { x: 5000, y: 50 }, zoom: 1 };
    const { result, apply } = setup({ bounds, defaultViewport: outside });
    act(() =>
      result.current.moveBy((v) => ({ ...v, center: { x: 6000, y: 50 } })),
    );
    expect(apply).toHaveBeenLastCalledWith(outside);
    act(() =>
      result.current.moveBy((v) => ({ ...v, center: { x: 4000, y: 50 } })),
    );
    expect(apply).toHaveBeenLastCalledWith({
      center: { x: 4000, y: 50 },
      zoom: 1,
    });
  });

  it("jumps instantly for a zero duration, clamped to the configured limits", () => {
    const { result, onViewportChange } = setup({
      defaultViewport: start,
      maxZoom: 4,
    });
    act(() =>
      result.current.animateTo({ center: { x: 5, y: 5 }, zoom: 10 }, 0),
    );
    expect(onViewportChange).toHaveBeenLastCalledWith(
      { center: { x: 5, y: 5 }, zoom: 4 },
      { settled: true },
    );
  });

  it("animates over the duration and settles at the target", () => {
    const { result, apply, onViewportChange } = setup({
      defaultViewport: start,
    });
    const target = { center: { x: 100, y: 0 }, zoom: 1 };
    act(() => result.current.animateTo(target, 1000));
    act(() => vi.advanceTimersByTime(500));
    const middle = apply.mock.lastCall![0] as IViewport;
    expect(middle.center.x).toBeGreaterThan(0);
    expect(middle.center.x).toBeLessThan(100);
    act(() => vi.advanceTimersByTime(600));
    expect(onViewportChange).toHaveBeenLastCalledWith(target, {
      settled: true,
    });
  });

  it("jumps instantly when the user prefers reduced motion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const { result, onViewportChange } = setup({ defaultViewport: start });
    const target = { center: { x: 100, y: 0 }, zoom: 1 };
    act(() => result.current.animateTo(target, 1000));
    expect(onViewportChange).toHaveBeenLastCalledWith(target, {
      settled: true,
    });
  });

  it("stops an animation when cancelled", () => {
    const { result, onViewportChange } = setup({ defaultViewport: start });
    act(() =>
      result.current.animateTo({ center: { x: 100, y: 0 }, zoom: 1 }, 1000),
    );
    act(() => vi.advanceTimersByTime(200));
    act(() => result.current.cancelAnimation());
    const calls = onViewportChange.mock.calls.length;
    act(() => vi.advanceTimersByTime(1000));
    expect(onViewportChange.mock.calls.length).toBe(calls);
  });
});
