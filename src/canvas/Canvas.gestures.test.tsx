import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockElementSize } from "../testUtils";
import { Canvas } from "./Canvas";

const start = { center: { x: 0, y: 0 }, zoom: 1 };

function setup(props: Partial<Parameters<typeof Canvas>[0]> = {}) {
  const onViewportChange = vi.fn();
  const onTargetClick = vi.fn();
  const onRootClick = vi.fn();
  const utils = render(
    <Canvas
      defaultViewport={start}
      onViewportChange={onViewportChange}
      onClick={onRootClick}
      {...props}
    >
      <rect
        data-testid="target"
        width={10}
        height={10}
        onClick={onTargetClick}
      />
    </Canvas>,
  );
  const root = utils.container.firstChild as HTMLElement;
  const target = utils.getByTestId("target");
  return {
    ...utils,
    root,
    target,
    onViewportChange,
    onTargetClick,
    onRootClick,
  };
}

function drag(
  element: Element,
  from: [number, number],
  to: [number, number],
  pointerType = "mouse",
) {
  fireEvent.pointerDown(element, {
    pointerId: 1,
    pointerType,
    clientX: from[0],
    clientY: from[1],
  });
  fireEvent.pointerMove(element, {
    pointerId: 1,
    pointerType,
    clientX: to[0],
    clientY: to[1],
  });
  fireEvent.pointerUp(element, {
    pointerId: 1,
    pointerType,
    clientX: to[0],
    clientY: to[1],
  });
}

beforeEach(() => {
  mockElementSize(800, 600);
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Canvas gestures", () => {
  it("pans when a drag passes the threshold", () => {
    const { target, onViewportChange } = setup();
    drag(target, [100, 100], [150, 100]);
    expect(onViewportChange).toHaveBeenLastCalledWith(
      { center: { x: -50, y: 0 }, zoom: 1 },
      { settled: true },
    );
  });

  it("does not pan for movement under the threshold, and the click goes through", () => {
    const { target, onViewportChange, onTargetClick } = setup();
    onViewportChange.mockClear();
    drag(target, [100, 100], [102, 100]);
    fireEvent.click(target);
    expect(onViewportChange).not.toHaveBeenCalled();
    expect(onTargetClick).toHaveBeenCalledTimes(1);
  });

  it("cancels the click that follows a pan", () => {
    const { target, onTargetClick, onRootClick } = setup();
    drag(target, [100, 100], [150, 100]);
    fireEvent.click(target);
    expect(onTargetClick).not.toHaveBeenCalled();
    expect(onRootClick).not.toHaveBeenCalled();
  });

  it("stops suppressing clicks at the next press", () => {
    const { target, onTargetClick } = setup();
    drag(target, [100, 100], [150, 100]);
    fireEvent.pointerDown(target, {
      pointerId: 1,
      pointerType: "mouse",
      clientX: 10,
      clientY: 10,
    });
    fireEvent.pointerUp(target, {
      pointerId: 1,
      pointerType: "mouse",
      clientX: 10,
      clientY: 10,
    });
    fireEvent.click(target);
    expect(onTargetClick).toHaveBeenCalledTimes(1);
  });

  it("zooms around the pointer on wheel, prevents page scroll, and settles later", () => {
    const { root, onViewportChange } = setup();
    const notPrevented = fireEvent.wheel(root, {
      deltaY: -100,
      deltaMode: 0,
      clientX: 400,
      clientY: 300,
    });
    expect(notPrevented).toBe(false);
    const [viewport, info] = onViewportChange.mock.lastCall!;
    expect(viewport.zoom).toBeCloseTo(Math.exp(0.2));
    expect(info).toEqual({ settled: false });
    act(() => vi.advanceTimersByTime(150));
    expect(onViewportChange.mock.lastCall![1]).toEqual({ settled: true });
  });

  it("pinch zooms with two touch pointers", () => {
    const { target, onViewportChange } = setup();
    fireEvent.pointerDown(target, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 300,
      clientY: 300,
    });
    fireEvent.pointerDown(target, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 500,
      clientY: 300,
    });
    fireEvent.pointerMove(target, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 700,
      clientY: 300,
    });
    fireEvent.pointerUp(target, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 700,
      clientY: 300,
    });
    fireEvent.pointerUp(target, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 300,
      clientY: 300,
    });
    expect(onViewportChange.mock.lastCall![0].zoom).toBeCloseTo(2);
    expect(onViewportChange.mock.lastCall![1]).toEqual({ settled: true });
  });

  it("does not move a controlled camera whose parent ignores changes", () => {
    const { target, container, onViewportChange } = setup({
      viewport: start,
      defaultViewport: undefined,
    });
    drag(target, [100, 100], [150, 100]);
    expect(onViewportChange).toHaveBeenCalled();
    const worldGroup = container.querySelector("svg > g")!;
    expect(worldGroup.getAttribute("transform")).toBe(
      "matrix(1 0 0 1 400 300)",
    );
  });
});
