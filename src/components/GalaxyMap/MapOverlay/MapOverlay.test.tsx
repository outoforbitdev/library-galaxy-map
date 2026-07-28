import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { MapOverlay } from "./MapOverlay";
import { IRenderLimits } from "../../../types";

const limits: IRenderLimits = { planets: 10, planetLabels: 5, spacelanes: 5 };

describe("MapOverlay", () => {
  it("renders all five slots in order: leftChildren, legend, children, options, rightChildren", () => {
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
    expect(getByText("Legend")).toBeInTheDocument();
    expect(getByTestId("center")).toBeInTheDocument();
    expect(getByText("Map Options")).toBeInTheDocument();
    expect(getByTestId("right")).toBeInTheDocument();
  });

  it("omits leftChildren and rightChildren from the DOM when not provided", () => {
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
    const { queryByText } = render(
      <MapOverlay
        currentLimits={limits}
        maxLimits={limits}
        setCurrentLimits={vi.fn()}
      />,
    );

    expect(queryByText("Legend")).not.toBeInTheDocument();
  });

  it("keeps the center flex spacer present even when children is absent, so options stays right-aligned", () => {
    const { container } = render(
      <MapOverlay
        currentLimits={limits}
        maxLimits={limits}
        setCurrentLimits={vi.fn()}
      />,
    );

    expect(
      container.querySelector("[class*='center']"),
    ).not.toBeNull();
  });

  it("wraps leftChildren and rightChildren so only they, not the whole overlay, capture pointer events", () => {
    const { getByTestId } = render(
      <MapOverlay
        leftChildren={<div data-testid="left">Left</div>}
        rightChildren={<div data-testid="right">Right</div>}
        currentLimits={limits}
        maxLimits={limits}
        setCurrentLimits={vi.fn()}
      />,
    );

    expect(getByTestId("left").closest("[class*='slot']")).not.toBeNull();
    expect(getByTestId("right").closest("[class*='slot']")).not.toBeNull();
  });

  it("renders only the center children slot when no other slots are provided", () => {
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
