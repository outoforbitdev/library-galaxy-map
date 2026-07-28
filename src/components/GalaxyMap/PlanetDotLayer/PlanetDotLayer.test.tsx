import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { RefObject } from "react";
import { PlanetDotLayer } from "./PlanetDotLayer";
import { IPlanet, MapColor } from "../../../types";
import { PLANET_SIZE_DEBOUNCE_MS } from "../constants";

function makePlanet(id: string): IPlanet {
  return { id, name: id, position: { x: 0, y: 0 }, color: MapColor.Blue };
}

function renderLayer(
  props: Partial<Parameters<typeof PlanetDotLayer>[0]> = {},
) {
  const isDragging: RefObject<boolean> = { current: false };
  const defaultProps: Parameters<typeof PlanetDotLayer>[0] = {
    planets: [makePlanet("a"), makePlanet("b")],
    zoom: 1,
    isDragging,
    ...props,
  };
  const result = render(
    <svg>
      <PlanetDotLayer {...defaultProps} />
    </svg>,
  );
  return { ...result, isDragging };
}

describe("PlanetDotLayer", () => {
  it("renders a circle per planet in orderForRendering order", () => {
    const { container } = renderLayer({
      planets: [makePlanet("a"), makePlanet("b"), makePlanet("c")],
    });

    const circles = container.querySelectorAll("circle");
    const ids = Array.from(circles).map((c) => c.getAttribute("data-testid"));
    expect(ids).toEqual(["planet-dot-c", "planet-dot-b", "planet-dot-a"]);
  });

  it("calls onPlanetSelect when clicked and not dragging", () => {
    const onPlanetSelect = vi.fn();
    const { container } = renderLayer({
      planets: [makePlanet("a")],
      onPlanetSelect,
    });

    fireEvent.click(container.querySelector("[data-testid='planet-dot-a']")!);

    expect(onPlanetSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a" }),
    );
  });

  it("does not call onPlanetSelect when a drag is in progress", () => {
    const onPlanetSelect = vi.fn();
    const { container, isDragging } = renderLayer({
      planets: [makePlanet("a")],
      onPlanetSelect,
    });
    isDragging.current = true;

    fireEvent.click(container.querySelector("[data-testid='planet-dot-a']")!);

    expect(onPlanetSelect).not.toHaveBeenCalled();
  });
});

describe("PlanetDotLayer zoom-compensated radius", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sets the initial --planet-dot-radius synchronously on mount", () => {
    const { container } = renderLayer({ zoom: 1 });

    const g = container.querySelector("g[data-testid='planet-dot-layer']");
    expect(g?.getAttribute("style")).toContain("--planet-dot-radius");
  });

  it("only updates --planet-dot-radius after the debounce settles", () => {
    const { container, rerender } = render(
      <svg>
        <PlanetDotLayer
          planets={[makePlanet("a")]}
          zoom={1}
          isDragging={{ current: false }}
        />
      </svg>,
    );
    const g = () =>
      container.querySelector("g[data-testid='planet-dot-layer']");
    const initialStyle = g()?.getAttribute("style");

    rerender(
      <svg>
        <PlanetDotLayer
          planets={[makePlanet("a")]}
          zoom={10}
          isDragging={{ current: false }}
        />
      </svg>,
    );
    expect(g()?.getAttribute("style")).toBe(initialStyle);

    act(() => {
      vi.advanceTimersByTime(PLANET_SIZE_DEBOUNCE_MS);
    });
    expect(g()?.getAttribute("style")).not.toBe(initialStyle);
  });
});
