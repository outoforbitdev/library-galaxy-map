import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { createRef } from "react";
import { GalaxyMap } from "./GalaxyMap";
import {
  IGalaxyMapHandle,
  IMapDimensions,
  IPlanet,
  IRenderLimits,
  MapColor,
} from "../../types";

function makePlanet(id: string, x = 0, y = 0): IPlanet {
  return { id, name: id, position: { x, y }, color: MapColor.Blue };
}

const dimensions: IMapDimensions = {
  min: { x: -100, y: -100 },
  max: { x: 100, y: 100 },
};

const renderLimits: IRenderLimits = {
  planets: 10,
  planetLabels: 5,
  spacelanes: 5,
};

function mockRect(width: number, height: number) {
  const rect = {
    width,
    height,
    left: 0,
    top: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON: () => {},
  };
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
    rect,
  );
  vi.spyOn(SVGSVGElement.prototype, "getBoundingClientRect").mockReturnValue(
    rect,
  );
}

describe("GalaxyMap", () => {
  beforeEach(() => {
    mockRect(200, 100);
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
    } as MediaQueryList);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("does not reset zoom or pan state when planets or spacelanes props update", () => {
    const { container, rerender } = render(
      <GalaxyMap
        planets={[makePlanet("a")]}
        spacelanes={[]}
        dimensions={dimensions}
        renderLimits={renderLimits}
      />,
    );

    fireEvent.wheel(container.querySelector("svg")!, { deltaY: -1 });
    const transformAfterZoom = container
      .querySelector("svg > g[transform]")
      ?.getAttribute("transform");

    rerender(
      <GalaxyMap
        planets={[makePlanet("a"), makePlanet("b")]}
        spacelanes={[]}
        dimensions={dimensions}
        renderLimits={renderLimits}
      />,
    );

    const transformAfterRerender = container
      .querySelector("svg > g[transform]")
      ?.getAttribute("transform");
    expect(transformAfterRerender).toBe(transformAfterZoom);
    expect(transformAfterRerender).not.toContain("scale(1,");
  });

  it("fires onZoomChange with the new zoom value after a wheel zoom", () => {
    const onZoomChange = vi.fn();
    const { container } = render(
      <GalaxyMap
        planets={[]}
        spacelanes={[]}
        dimensions={dimensions}
        renderLimits={renderLimits}
        onZoomChange={onZoomChange}
      />,
    );

    fireEvent.wheel(container.querySelector("svg")!, { deltaY: -1 });
    act(() => {
      vi.advanceTimersByTime(20);
    });

    expect(onZoomChange).toHaveBeenCalledWith(1.1);
  });

  it("fires onCenterChange with the new center value after a drag pan", () => {
    const onCenterChange = vi.fn();
    const { container } = render(
      <GalaxyMap
        planets={[]}
        spacelanes={[]}
        dimensions={dimensions}
        renderLimits={renderLimits}
        onCenterChange={onCenterChange}
      />,
    );

    const svg = container.querySelector("svg")!;
    fireEvent.mouseDown(svg, { clientX: 100, clientY: 50 });
    fireEvent.mouseMove(svg, { clientX: 110, clientY: 50 });
    act(() => {
      vi.advanceTimersByTime(20);
    });

    expect(onCenterChange).toHaveBeenCalledWith({ x: -10, y: 0 });
  });

  it("navigates to the target coordinate and zoom via the imperative handle", () => {
    const ref = createRef<IGalaxyMapHandle>();
    const { container } = render(
      <GalaxyMap
        ref={ref}
        planets={[]}
        spacelanes={[]}
        dimensions={dimensions}
        renderLimits={renderLimits}
      />,
    );

    act(() => {
      ref.current?.zoomTo({ coordinate: { x: 40, y: 60 }, zoom: 3 });
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    const transform = container
      .querySelector("svg > g[transform]")
      ?.getAttribute("transform");
    expect(transform).toBe(
      "translate(100, 50) scale(3, -3) translate(-40, -60)",
    );
  });
});
