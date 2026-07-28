import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { MapLegend } from "./MapLegend";
import { MapColor } from "../../../types";

describe("MapLegend", () => {
  it("renders nothing when legendEntries is undefined", () => {
    const { container } = render(<MapLegend />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when legendEntries is empty", () => {
    const { container } = render(<MapLegend legendEntries={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("starts collapsed and shows the title", () => {
    const { getByText, queryByText } = render(
      <MapLegend
        legendEntries={[
          { id: "a", label: "Trade Routes", color: MapColor.Blue },
        ]}
      />,
    );

    expect(getByText("Legend")).toBeInTheDocument();
    expect(queryByText("Trade Routes")).not.toBeInTheDocument();
  });

  it("renders a labeled entry for each legend entry once expanded", () => {
    const { getByRole, getByText } = render(
      <MapLegend
        legendEntries={[
          { id: "a", label: "Trade Routes", color: MapColor.Blue },
          { id: "b", label: "Border", color: MapColor.Red },
        ]}
      />,
    );

    fireEvent.click(getByRole("button"));

    expect(getByText("Trade Routes")).toBeInTheDocument();
    expect(getByText("Border")).toBeInTheDocument();
  });

  it("toggles expansion when the toggle control is clicked", () => {
    const { getByRole, queryByText } = render(
      <MapLegend
        legendEntries={[
          { id: "a", label: "Trade Routes", color: MapColor.Blue },
        ]}
      />,
    );

    expect(queryByText("Trade Routes")).not.toBeInTheDocument();

    fireEvent.click(getByRole("button"));
    expect(queryByText("Trade Routes")).toBeInTheDocument();

    fireEvent.click(getByRole("button"));
    expect(queryByText("Trade Routes")).not.toBeInTheDocument();
  });
});
