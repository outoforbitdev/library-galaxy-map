import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { MapLegend } from "./MapLegend";
import { MapColor } from "../../../types";

function mockMatchMedia(matches: boolean) {
  vi.spyOn(window, "matchMedia").mockReturnValue({
    matches,
  } as MediaQueryList);
}

describe("MapLegend", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when legendEntries is undefined", () => {
    mockMatchMedia(true);
    const { container } = render(<MapLegend />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when legendEntries is empty", () => {
    mockMatchMedia(true);
    const { container } = render(<MapLegend legendEntries={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders a labeled entry for each legend entry when expanded", () => {
    mockMatchMedia(true);
    const { getByText } = render(
      <MapLegend
        legendEntries={[
          { id: "a", label: "Trade Routes", color: MapColor.Blue },
          { id: "b", label: "Border", color: MapColor.Red },
        ]}
      />,
    );

    expect(getByText("Trade Routes")).toBeInTheDocument();
    expect(getByText("Border")).toBeInTheDocument();
  });

  it("starts expanded on a large screen and collapsed on a small screen", () => {
    mockMatchMedia(false);
    const { queryByText } = render(
      <MapLegend
        legendEntries={[{ id: "a", label: "Trade Routes", color: MapColor.Blue }]}
      />,
    );

    expect(queryByText("Trade Routes")).not.toBeInTheDocument();
  });

  it("toggles expansion when the toggle control is clicked", () => {
    mockMatchMedia(false);
    const { getByRole, queryByText } = render(
      <MapLegend
        legendEntries={[{ id: "a", label: "Trade Routes", color: MapColor.Blue }]}
      />,
    );

    expect(queryByText("Trade Routes")).not.toBeInTheDocument();

    fireEvent.click(getByRole("button"));

    expect(queryByText("Trade Routes")).toBeInTheDocument();
  });
});
