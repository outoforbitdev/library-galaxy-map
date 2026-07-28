import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { RefObject } from "react";
import { ZoomableCanvas } from "./ZoomableCanvas";
import { IPlanet, ISpacelane, MapColor } from "../../../types";
import { ZoomPanHandlers } from "../hooks/useZoomPan";

function makePlanet(id: string, x: number, y: number): IPlanet {
  return { id, name: id, position: { x, y }, color: MapColor.Blue };
}

function makeSpacelane(id: string): ISpacelane {
  return {
    id,
    segments: [
      {
        origin: { x: 0, y: 0 },
        destination: { x: 1, y: 1 },
        color: MapColor.Red,
      },
    ],
  };
}

function makeHandlers(): ZoomPanHandlers {
  return {
    onWheel: vi.fn(),
    onMouseDown: vi.fn(),
    onMouseMove: vi.fn(),
    onMouseUp: vi.fn(),
    onTouchStart: vi.fn(),
    onTouchMove: vi.fn(),
    onTouchEnd: vi.fn(),
  };
}

describe("ZoomableCanvas", () => {
  beforeEach(() => {
    vi.spyOn(SVGSVGElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 200,
      height: 100,
      left: 0,
      top: 0,
      right: 200,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the spacelane and planet-dot layers inside a transformed group, and the label layer as a sibling", () => {
    const isDragging: RefObject<boolean> = { current: false };
    const { container } = render(
      <ZoomableCanvas
        planets={[makePlanet("a", 0, 0)]}
        spacelanes={[makeSpacelane("s1")]}
        labelSet={new Set(["a"])}
        zoom={1}
        center={{ x: 0, y: 0 }}
        handlers={makeHandlers()}
        isDragging={isDragging}
      />,
    );

    const transformGroup = container.querySelector("svg > g[transform]");
    expect(
      transformGroup?.querySelector("[data-testid='spacelane-s1']"),
    ).not.toBeNull();
    expect(
      transformGroup?.querySelector("[data-testid='planet-dot-a']"),
    ).not.toBeNull();

    const labelLayer = container.querySelector(
      "svg > [data-testid='planet-label-layer']",
    );
    expect(labelLayer).not.toBeNull();
    expect(transformGroup?.contains(labelLayer)).toBe(false);
  });

  it("computes the svg transform from zoom, center, and the measured svg size", () => {
    const isDragging: RefObject<boolean> = { current: false };
    const { container } = render(
      <ZoomableCanvas
        planets={[]}
        spacelanes={[]}
        labelSet={new Set()}
        zoom={2}
        center={{ x: 5, y: 10 }}
        handlers={makeHandlers()}
        isDragging={isDragging}
      />,
    );

    const transformGroup = container.querySelector("svg > g[transform]");
    expect(transformGroup?.getAttribute("transform")).toBe(
      "translate(100, 50) scale(2, -2) translate(-5, -10)",
    );
  });

  it("wires the wheel handler from props.handlers to the svg element", () => {
    const isDragging: RefObject<boolean> = { current: false };
    const handlers = makeHandlers();
    const { container } = render(
      <ZoomableCanvas
        planets={[]}
        spacelanes={[]}
        labelSet={new Set()}
        zoom={1}
        center={{ x: 0, y: 0 }}
        handlers={handlers}
        isDragging={isDragging}
      />,
    );

    fireEvent.wheel(container.querySelector("svg")!);

    expect(handlers.onWheel).toHaveBeenCalled();
  });

  it("prevents the browser's native scroll/zoom on wheel, so the page doesn't scroll along with map zoom", () => {
    const isDragging: RefObject<boolean> = { current: false };
    const { container } = render(
      <ZoomableCanvas
        planets={[]}
        spacelanes={[]}
        labelSet={new Set()}
        zoom={1}
        center={{ x: 0, y: 0 }}
        handlers={makeHandlers()}
        isDragging={isDragging}
      />,
    );

    const svg = container.querySelector("svg")!;
    const event = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: -1,
    });
    svg.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("prevents the browser's native pinch-zoom/scroll on touchstart and touchmove, so the page doesn't move along with map gestures", () => {
    const isDragging: RefObject<boolean> = { current: false };
    const handlers = makeHandlers();
    const { container } = render(
      <ZoomableCanvas
        planets={[]}
        spacelanes={[]}
        labelSet={new Set()}
        zoom={1}
        center={{ x: 0, y: 0 }}
        handlers={handlers}
        isDragging={isDragging}
      />,
    );

    const svg = container.querySelector("svg")!;

    const touchStart = new Event("touchstart", {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(touchStart, "touches", {
      value: [{ clientX: 10, clientY: 10 }],
    });
    svg.dispatchEvent(touchStart);
    expect(touchStart.defaultPrevented).toBe(true);
    expect(handlers.onTouchStart).toHaveBeenCalled();

    const touchMove = new Event("touchmove", {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(touchMove, "touches", {
      value: [{ clientX: 20, clientY: 20 }],
    });
    svg.dispatchEvent(touchMove);
    expect(touchMove.defaultPrevented).toBe(true);
    expect(handlers.onTouchMove).toHaveBeenCalled();
  });

  it("passes the measured svg size to PlanetLabelLayer for screen-space positioning", () => {
    const isDragging: RefObject<boolean> = { current: false };
    const { container } = render(
      <ZoomableCanvas
        planets={[makePlanet("a", 10, 20)]}
        spacelanes={[]}
        labelSet={new Set(["a"])}
        zoom={1}
        center={{ x: 0, y: 0 }}
        handlers={makeHandlers()}
        isDragging={isDragging}
      />,
    );

    const label = container.querySelector("[data-testid='planet-label-a']");
    expect(label?.getAttribute("x")).toBe("110");
    expect(label?.getAttribute("y")).toBe("30");
  });
});
