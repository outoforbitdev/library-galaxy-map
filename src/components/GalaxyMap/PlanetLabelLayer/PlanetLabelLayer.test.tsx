import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { RefObject } from "react";
import { PlanetLabelLayer } from "./PlanetLabelLayer";
import { IPlanet, MapColor } from "../../../types";
import { colorToCss } from "../../../utils/color";

function makePlanet(id: string, x: number, y: number): IPlanet {
  return { id, name: id, position: { x, y }, color: MapColor.Blue };
}

describe("PlanetLabelLayer", () => {
  it("renders a text label only for planets in labelSet", () => {
    const planets = [makePlanet("a", 0, 0), makePlanet("b", 10, 10)];

    const { container } = render(
      <svg>
        <PlanetLabelLayer
          planets={planets}
          labelSet={new Set(["a"])}
          zoom={1}
          center={{ x: 0, y: 0 }}
          svgWidth={200}
          svgHeight={100}
          isDragging={{ current: false }}
        />
      </svg>,
    );

    expect(container.querySelectorAll("text")).toHaveLength(1);
    expect(
      container.querySelector("[data-testid='planet-label-a']"),
    ).not.toBeNull();
  });

  it("positions the label using mapToScreen", () => {
    const planets = [makePlanet("a", 10, 20)];

    const { container } = render(
      <svg>
        <PlanetLabelLayer
          planets={planets}
          labelSet={new Set(["a"])}
          zoom={1}
          center={{ x: 0, y: 0 }}
          svgWidth={200}
          svgHeight={100}
          isDragging={{ current: false }}
        />
      </svg>,
    );

    const text = container.querySelector("[data-testid='planet-label-a']");
    expect(text?.getAttribute("x")).toBe("110");
    expect(text?.getAttribute("y")).toBe("30");
  });

  it("renders the planet name as the label text content", () => {
    const planets = [{ ...makePlanet("a", 0, 0), name: "Tatooine" }];

    const { container } = render(
      <svg>
        <PlanetLabelLayer
          planets={planets}
          labelSet={new Set(["a"])}
          zoom={1}
          center={{ x: 0, y: 0 }}
          svgWidth={200}
          svgHeight={100}
          isDragging={{ current: false }}
        />
      </svg>,
    );

    expect(
      container.querySelector("[data-testid='planet-label-a']")?.textContent,
    ).toBe("Tatooine");
  });

  it("renders the selected planet's label last so it paints on top", () => {
    const planets = [makePlanet("a", 0, 0), makePlanet("b", 0, 0)];

    const { container } = render(
      <svg>
        <PlanetLabelLayer
          planets={planets}
          labelSet={new Set(["a", "b"])}
          selectedPlanetId="a"
          zoom={1}
          center={{ x: 0, y: 0 }}
          svgWidth={200}
          svgHeight={100}
          isDragging={{ current: false }}
        />
      </svg>,
    );

    const ids = Array.from(container.querySelectorAll("text")).map((t) =>
      t.getAttribute("data-testid")?.replace("planet-label-", ""),
    );
    expect(ids).toEqual(["b", "a"]);
  });

  it("colors the label to match its planet's color", () => {
    const planets = [
      { ...makePlanet("a", 0, 0), color: MapColor.Red },
      { ...makePlanet("b", 10, 10), color: MapColor.Green },
    ];

    const { container } = render(
      <svg>
        <PlanetLabelLayer
          planets={planets}
          labelSet={new Set(["a", "b"])}
          zoom={1}
          center={{ x: 0, y: 0 }}
          svgWidth={200}
          svgHeight={100}
          isDragging={{ current: false }}
        />
      </svg>,
    );

    expect(
      container
        .querySelector("[data-testid='planet-label-a']")
        ?.getAttribute("fill"),
    ).toBe(colorToCss(MapColor.Red));
    expect(
      container
        .querySelector("[data-testid='planet-label-b']")
        ?.getAttribute("fill"),
    ).toBe(colorToCss(MapColor.Green));
  });

  it("calls onPlanetSelect when a label is clicked and not dragging", () => {
    const onPlanetSelect = vi.fn();
    const isDragging: RefObject<boolean> = { current: false };
    const planets = [makePlanet("a", 0, 0)];

    const { container } = render(
      <svg>
        <PlanetLabelLayer
          planets={planets}
          labelSet={new Set(["a"])}
          zoom={1}
          center={{ x: 0, y: 0 }}
          svgWidth={200}
          svgHeight={100}
          onPlanetSelect={onPlanetSelect}
          isDragging={isDragging}
        />
      </svg>,
    );

    fireEvent.click(container.querySelector("[data-testid='planet-label-a']")!);

    expect(onPlanetSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a" }),
    );
  });

  it("does not call onPlanetSelect when a drag is in progress", () => {
    const onPlanetSelect = vi.fn();
    const isDragging: RefObject<boolean> = { current: true };
    const planets = [makePlanet("a", 0, 0)];

    const { container } = render(
      <svg>
        <PlanetLabelLayer
          planets={planets}
          labelSet={new Set(["a"])}
          zoom={1}
          center={{ x: 0, y: 0 }}
          svgWidth={200}
          svgHeight={100}
          onPlanetSelect={onPlanetSelect}
          isDragging={isDragging}
        />
      </svg>,
    );

    fireEvent.click(container.querySelector("[data-testid='planet-label-a']")!);

    expect(onPlanetSelect).not.toHaveBeenCalled();
  });
});
