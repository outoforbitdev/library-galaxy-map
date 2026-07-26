import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { MapOverlay } from "./MapOverlay";
import { IRenderLimits } from "../../../types";

function mockMatchMedia(matches: boolean) {
  vi.spyOn(window, "matchMedia").mockReturnValue({
    matches,
  } as MediaQueryList);
}

const limits: IRenderLimits = { planets: 10, planetLabels: 5, spacelanes: 5 };

describe("MapOverlay", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders all five slots in order: leftChildren, legend, children, options, rightChildren", () => {
    mockMatchMedia(true);
    const { getByTestId, getByText } = render(
      <MapOverlay
        leftChildren={<div data-testid="left">Left</div>}
        legendEntries={[{ id: "a", label: "Route", color: 0 }]}
        currentLimits={limits}
        maxLimits={limits}
        setCurrentLimits={vi.fn()}
        rightChildren={<div data-testid="right">Right</div>}
      >
        <div data-testid="center">Center</div>
      </MapOverlay>,
    );

    expect(getByTestId("left")).toBeInTheDocument();
    expect(getByText("Route")).toBeInTheDocument();
    expect(getByTestId("center")).toBeInTheDocument();
    expect(getByText("Map Options")).toBeInTheDocument();
    expect(getByTestId("right")).toBeInTheDocument();
  });

  it("omits leftChildren and rightChildren from the DOM when not provided", () => {
    mockMatchMedia(true);
    const { queryByTestId } = render(
      <MapOverlay
        currentLimits={limits}
        maxLimits={limits}
        setCurrentLimits={vi.fn()}
      />,
    );

    expect(queryByTestId("left")).not.toBeInTheDocument();
    expect(queryByTestId("right")).not.toBeInTheDocument();
  });

  it("omits the legend when legendEntries is not provided", () => {
    mockMatchMedia(true);
    const { queryByText } = render(
      <MapOverlay
        currentLimits={limits}
        maxLimits={limits}
        setCurrentLimits={vi.fn()}
      />,
    );

    expect(queryByText("Legend")).not.toBeInTheDocument();
  });

  it("renders only the center children slot when no other slots are provided", () => {
    mockMatchMedia(true);
    const { getByTestId, queryByText } = render(
      <MapOverlay
        currentLimits={limits}
        maxLimits={limits}
        setCurrentLimits={vi.fn()}
      >
        <div data-testid="center">Center</div>
      </MapOverlay>,
    );

    expect(getByTestId("center")).toBeInTheDocument();
    expect(queryByText("Legend")).not.toBeInTheDocument();
  });
});
