import { act, fireEvent, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockElementSize } from "../testUtils";
import { Canvas, type ICanvasHandle } from "./Canvas";
import styles from "./Canvas.module.css";
import { type ICanvasContext, useCanvas } from "./CanvasContext";

const start = { center: { x: 0, y: 0 }, zoom: 1 };

function Probe({
  onContext,
}: {
  onContext: (context: ICanvasContext) => void;
}) {
  onContext(useCanvas());
  return <rect data-testid="child" />;
}

function world(container: HTMLElement): SVGGElement {
  return container.querySelector("svg > g") as SVGGElement;
}

beforeEach(() => {
  mockElementSize(800, 600);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Canvas", () => {
  it("writes the world transform and zoom variables", () => {
    const { container } = render(<Canvas defaultViewport={start} />);
    expect(world(container).getAttribute("transform")).toBe(
      "matrix(1 0 0 1 400 300)",
    );
    expect(world(container).style.getPropertyValue("--zoom")).toBe("1");
    expect(world(container).style.getPropertyValue("--y-sign")).toBe("1");
  });

  it("flips y when world y points up", () => {
    const { container } = render(<Canvas defaultViewport={start} yAxis="up" />);
    expect(world(container).getAttribute("transform")).toBe(
      "matrix(1 0 0 -1 400 300)",
    );
    expect(world(container).style.getPropertyValue("--y-sign")).toBe("-1");
  });

  it("gives children the size, viewport, and conversions", () => {
    let context: ICanvasContext | null = null;
    const { getByTestId } = render(
      <Canvas defaultViewport={start}>
        <Probe onContext={(c) => (context = c)} />
      </Canvas>,
    );
    expect(getByTestId("child")).toBeInTheDocument();
    expect(context!.size).toEqual({ width: 800, height: 600 });
    expect(context!.viewport).toEqual(start);
    expect(context!.worldToScreen({ x: 10, y: 10 })).toEqual({
      x: 410,
      y: 310,
    });
  });

  it("fits the bounds when no viewport is given", () => {
    const onViewportChange = vi.fn();
    render(
      <Canvas
        bounds={{ min: { x: 0, y: 0 }, max: { x: 100, y: 50 } }}
        onViewportChange={onViewportChange}
      />,
    );
    expect(onViewportChange).toHaveBeenLastCalledWith(
      { center: { x: 50, y: 25 }, zoom: 8 },
      { settled: true },
    );
  });

  it("pans with arrow keys and zooms with plus", () => {
    const onViewportChange = vi.fn();
    const { container } = render(
      <Canvas defaultViewport={start} onViewportChange={onViewportChange} />,
    );
    const root = container.firstChild as HTMLElement;
    fireEvent.keyDown(root, { key: "ArrowLeft" });
    expect(onViewportChange).toHaveBeenLastCalledWith(
      { center: { x: -80, y: 0 }, zoom: 1 },
      { settled: true },
    );
    fireEvent.keyDown(root, { key: "+" });
    expect(onViewportChange.mock.lastCall![0].zoom).toBeCloseTo(1.25);
  });

  it("ignores keys that an onKeyDown handler already handled", () => {
    const onViewportChange = vi.fn();
    const { container } = render(
      <Canvas
        defaultViewport={start}
        onViewportChange={onViewportChange}
        onKeyDown={(e) => e.preventDefault()}
      />,
    );
    onViewportChange.mockClear();
    fireEvent.keyDown(container.firstChild as HTMLElement, {
      key: "ArrowLeft",
    });
    expect(onViewportChange).not.toHaveBeenCalled();
  });

  it("is a single tab stop with the given accessibility props", () => {
    const { container } = render(
      <Canvas
        role="application"
        aria-label="Map"
        aria-activedescendant="item-1"
        className="mine"
      />,
    );
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute("tabindex", "0");
    expect(root).toHaveAttribute("role", "application");
    expect(root).toHaveAttribute("aria-label", "Map");
    expect(root).toHaveAttribute("aria-activedescendant", "item-1");
    expect(root).toHaveClass(styles.root, "mine");
  });

  it("does not let a double click select text inside the canvas", () => {
    const { container } = render(<Canvas defaultViewport={start} />);
    expect(
      getComputedStyle(container.firstChild as HTMLElement).userSelect,
    ).toBe("none");
  });

  it("moves and fits through the imperative handle", () => {
    const ref = createRef<ICanvasHandle>();
    const onViewportChange = vi.fn();
    render(
      <Canvas
        ref={ref}
        defaultViewport={start}
        onViewportChange={onViewportChange}
      />,
    );
    act(() => ref.current!.moveTo({ center: { x: 30, y: 40 } }));
    expect(ref.current!.getViewport()).toEqual({
      center: { x: 30, y: 40 },
      zoom: 1,
    });
    act(() =>
      ref.current!.fitPoints([
        { x: 0, y: 0 },
        { x: 100, y: 50 },
      ]),
    );
    expect(onViewportChange).toHaveBeenLastCalledWith(
      { center: { x: 50, y: 25 }, zoom: 8 },
      { settled: true },
    );
    expect(ref.current!.getSize()).toEqual({ width: 800, height: 600 });
    expect(ref.current!.screenToWorld({ x: 400, y: 300 })).toEqual({
      x: 50,
      y: 25,
    });
  });

  it("throws when useCanvas is used outside a Canvas", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe onContext={() => {}} />)).toThrow(
      /inside a <Canvas>/,
    );
  });
});
