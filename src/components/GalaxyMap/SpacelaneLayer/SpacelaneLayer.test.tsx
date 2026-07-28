import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { RefObject } from "react";
import { SpacelaneLayer } from "./SpacelaneLayer";
import { ISpacelane, MapColor } from "../../../types";

function makeSpacelane(id: string, segmentCount = 1): ISpacelane {
  return {
    id,
    segments: Array.from({ length: segmentCount }, (_, i) => ({
      origin: { x: i, y: i },
      destination: { x: i + 1, y: i + 1 },
      color: MapColor.Red,
    })),
  };
}

function renderLayer(
  props: Partial<Parameters<typeof SpacelaneLayer>[0]> = {},
) {
  const isDragging: RefObject<boolean> = { current: false };
  const defaultProps: Parameters<typeof SpacelaneLayer>[0] = {
    spacelanes: [makeSpacelane("a"), makeSpacelane("b")],
    isDragging,
    ...props,
  };
  const result = render(
    <svg>
      <SpacelaneLayer {...defaultProps} />
    </svg>,
  );
  return { ...result, isDragging };
}

describe("SpacelaneLayer", () => {
  it("renders a visual line and a hit-area line per segment, both non-scaling-stroke", () => {
    const { container } = renderLayer({
      spacelanes: [makeSpacelane("a", 1)],
    });

    const lines = container.querySelectorAll("line");
    expect(lines).toHaveLength(2);
    lines.forEach((line) => {
      expect(line.getAttribute("vector-effect")).toBe("non-scaling-stroke");
    });
    expect(lines[1].getAttribute("stroke")).toBe("transparent");
  });

  it("renders spacelanes in orderForRendering order", () => {
    const { container } = renderLayer({
      spacelanes: [makeSpacelane("a"), makeSpacelane("b"), makeSpacelane("c")],
    });

    const groups = container.querySelectorAll("[data-testid^='spacelane-']");
    const ids = Array.from(groups).map((g) =>
      g.getAttribute("data-testid")?.replace("spacelane-", ""),
    );
    expect(ids).toEqual(["c", "b", "a"]);
  });

  it("gives the selected spacelane's segments an increased strokeWidth", () => {
    const { container } = renderLayer({
      spacelanes: [makeSpacelane("a"), makeSpacelane("b")],
      selectedSpaceLaneId: "b",
    });

    const selectedGroup = container.querySelector(
      "[data-testid='spacelane-b']",
    );
    const visualLine = selectedGroup?.querySelector("line");
    expect(visualLine?.getAttribute("stroke-width")).toBe("3");
  });

  it("calls onSpaceLaneSelect when clicked and not dragging", () => {
    const onSpaceLaneSelect = vi.fn();
    const { container } = renderLayer({
      spacelanes: [makeSpacelane("a")],
      onSpaceLaneSelect,
    });

    fireEvent.click(container.querySelector("[data-testid='spacelane-a']")!);

    expect(onSpaceLaneSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a" }),
    );
  });

  it("does not call onSpaceLaneSelect when a drag is in progress", () => {
    const onSpaceLaneSelect = vi.fn();
    const { container, isDragging } = renderLayer({
      spacelanes: [makeSpacelane("a")],
      onSpaceLaneSelect,
    });
    isDragging.current = true;

    fireEvent.click(container.querySelector("[data-testid='spacelane-a']")!);

    expect(onSpaceLaneSelect).not.toHaveBeenCalled();
  });
});
