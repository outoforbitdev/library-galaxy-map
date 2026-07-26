import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PlanetLabelLayer } from "./PlanetLabelLayer";
import { IPlanet, MapColor } from "../../../types";

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
        />
      </svg>,
    );

    const ids = Array.from(container.querySelectorAll("text")).map((t) =>
      t.getAttribute("data-testid")?.replace("planet-label-", ""),
    );
    expect(ids).toEqual(["b", "a"]);
  });
});
