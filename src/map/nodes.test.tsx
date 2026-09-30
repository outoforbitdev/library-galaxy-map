import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { screenSpaceClassName } from "../canvas/screenSpace";
import styles from "./GalaxyMap.module.css";
import { Highlight } from "./Highlight";
import { LaneNode, laneNodePropsEqual } from "./LaneNode";
import { laneStrokeProps, SpacelaneSegment, SystemGlyph } from "./primitives";
import { SystemLabel } from "./SystemLabel";
import { SystemNode } from "./SystemNode";
import type { ISpacelane, ISystem } from "./types";

const svg = (children: ReactNode) => render(<svg>{children}</svg>);

const alpha: ISystem = {
  id: "a",
  name: "Alpha",
  position: { x: 10, y: 20 },
  color: "red",
  className: "capital",
};

const lane: ISpacelane = {
  id: "l",
  name: "Lane",
  segments: [
    {
      id: "s0",
      origin: { x: 0, y: 0 },
      destination: { x: 1, y: 0 },
      color: "red",
    },
    {
      id: "s1",
      origin: { x: 1, y: 0 },
      destination: { x: 2, y: 0 },
      color: "blue",
    },
  ],
};

describe("primitives", () => {
  it("draws a glyph and a segment standalone", () => {
    const { container } = svg(
      <>
        <SystemGlyph x={8} y={8} color="gold" />
        <SpacelaneSegment
          origin={{ x: 0, y: 0 }}
          destination={{ x: 5, y: 5 }}
          color="teal"
        />
      </>,
    );
    expect(container.querySelector("circle")).toHaveAttribute("fill", "gold");
    expect(container.querySelector("line")).toHaveAttribute("stroke", "teal");
    expect(container.querySelector("line")).toHaveAttribute(
      "vector-effect",
      "non-scaling-stroke",
    );
  });

  it("gives a standalone segment the map's default lane stroke, after the consumer's class", () => {
    const { container } = svg(
      <SpacelaneSegment
        origin={{ x: 0, y: 0 }}
        destination={{ x: 5, y: 5 }}
        color="teal"
        className="mine"
      />,
    );
    expect(container.querySelector("line")).toHaveClass(
      styles.laneStroke,
      "mine",
    );
    expect(laneStrokeProps("teal")).not.toHaveProperty("strokeWidth");
  });
});

describe("SystemNode", () => {
  const props = {
    system: alpha,
    selected: false,
    interactive: true,
    elementId: "sys-a",
  };

  it("draws a positioned, accessible system", () => {
    const { container } = svg(<SystemNode {...props} />);
    const group = container.querySelector("[data-kind='system']")!;
    expect(group).toHaveAttribute("data-id", "a");
    expect(group).toHaveAttribute("id", "sys-a");
    expect(group).toHaveAttribute("transform", "translate(10 20)");
    expect(group).toHaveAttribute("role", "button");
    expect(group).toHaveAttribute("aria-label", "Alpha");
    expect(group).toHaveAttribute("aria-pressed", "false");
    expect(group).toHaveClass(styles.system, "capital");
    expect(container.querySelector(`.${styles.glyph}`)).toHaveAttribute(
      "fill",
      "red",
    );
    expect(container.querySelector("text")).toBeNull();
  });

  it("shows a ring when selected", () => {
    const { container } = svg(<SystemNode {...props} selected />);
    expect(container.querySelector(`.${styles.ring}`)).not.toBeNull();
    expect(container.querySelector("[data-kind='system']")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("uses role img when not interactive", () => {
    const { container } = svg(<SystemNode {...props} interactive={false} />);
    const group = container.querySelector("[data-kind='system']")!;
    expect(group).toHaveAttribute("role", "img");
    expect(group).not.toHaveAttribute("aria-pressed");
  });

  it("draws overlay content after the glyph", () => {
    const { container } = svg(
      <SystemNode
        {...props}
        renderOverlay={() => <rect data-testid="badge" />}
      />,
    );
    const children = Array.from(
      container.querySelector(`.${screenSpaceClassName}`)!.children,
    );
    const badge = children.findIndex(
      (c) => c.getAttribute("data-testid") === "badge",
    );
    const glyph = children.findIndex((c) => c.classList.contains(styles.glyph));
    expect(glyph).toBeLessThan(badge);
  });

  it("does not re-render for an equal but newly created system", () => {
    const renderOverlay = vi.fn(() => null);
    const { rerender } = svg(
      <SystemNode {...props} renderOverlay={renderOverlay} />,
    );
    rerender(
      <svg>
        <SystemNode
          {...props}
          system={{ ...alpha, position: { ...alpha.position } }}
          renderOverlay={renderOverlay}
        />
      </svg>,
    );
    expect(renderOverlay).toHaveBeenCalledTimes(1);
    rerender(
      <svg>
        <SystemNode
          {...props}
          system={{ ...alpha, color: "green" }}
          renderOverlay={renderOverlay}
        />
      </svg>,
    );
    expect(renderOverlay).toHaveBeenCalledTimes(2);
  });
});

describe("SystemLabel", () => {
  it("draws the name beside the system, in its own group, hidden from assistive technology", () => {
    const { container } = svg(<SystemLabel system={alpha} interactive />);
    const group = container.querySelector("[data-part='label']")!;
    expect(group).toHaveAttribute("data-kind", "system");
    expect(group).toHaveAttribute("data-id", "a");
    expect(group).toHaveAttribute("transform", "translate(10 20)");
    expect(group).toHaveAttribute("aria-hidden", "true");
    expect(group).toHaveClass(styles.systemLabel, "capital");
    expect(group.querySelector("text")).toHaveTextContent("Alpha");
  });

  it("does not re-render for an equal but newly created system", () => {
    const { container, rerender } = svg(
      <SystemLabel system={alpha} interactive />,
    );
    const text = container.querySelector("text");
    rerender(
      <svg>
        <SystemLabel
          system={{ ...alpha, position: { ...alpha.position } }}
          interactive
        />
      </svg>,
    );
    expect(container.querySelector("text")).toBe(text);
  });
});

describe("LaneNode", () => {
  it("draws one path per color run and the hit path last", () => {
    const { container } = svg(
      <LaneNode lane={lane} selected={false} interactive />,
    );
    const group = container.querySelector("[data-kind='lane']")!;
    const paths = Array.from(group.querySelectorAll("path"));
    expect(paths.map((p) => p.getAttribute("class"))).toEqual([
      styles.laneRun,
      styles.laneRun,
      styles.laneHit,
    ]);
    expect(paths[0]).toHaveAttribute("stroke", "red");
    expect(paths[2]).toHaveAttribute("d", "M0 0 L1 0 L2 0");
    expect(group).toHaveAttribute("aria-label", "Lane");
  });

  it("draws a halo under the runs when selected", () => {
    const { container } = svg(<LaneNode lane={lane} selected interactive />);
    expect(container.querySelector("path")).toHaveClass(styles.laneHalo);
  });

  it("treats equal, newly created segments as unchanged, and a recolor as changed", () => {
    const base = { lane, selected: false, interactive: true };
    const recreated = {
      ...base,
      lane: { ...lane, segments: lane.segments.map((s) => ({ ...s })) },
    };
    const recolored = {
      ...base,
      lane: {
        ...lane,
        segments: [{ ...lane.segments[0], color: "green" }, lane.segments[1]],
      },
    };
    expect(laneNodePropsEqual(base, recreated)).toBe(true);
    expect(laneNodePropsEqual(base, recolored)).toBe(false);
  });

  it("renders a lane with no segments", () => {
    const { container } = svg(
      <LaneNode
        lane={{ ...lane, segments: [] }}
        selected={false}
        interactive
      />,
    );
    expect(container.querySelector(`.${styles.laneHit}`)).toHaveAttribute(
      "d",
      "",
    );
  });
});

describe("Highlight", () => {
  it("draws nothing without a target", () => {
    const { container } = svg(<Highlight target={null} variant="hover" />);
    expect(container.querySelector("svg")!.children).toHaveLength(0);
  });

  it("draws a ring for a system and a path for a lane, hidden from assistive technology", () => {
    const { container } = svg(
      <>
        <Highlight target={{ kind: "system", system: alpha }} variant="focus" />
        <Highlight target={{ kind: "lane", lane }} variant="hover" />
      </>,
    );
    expect(container.querySelector(`.${styles.focusRing}`)).not.toBeNull();
    expect(container.querySelector(`.${styles.highlightLane}`)).toHaveAttribute(
      "d",
      "M0 0 L1 0 L2 0",
    );
    container
      .querySelectorAll(`.${styles.highlight}`)
      .forEach((el) => expect(el).toHaveAttribute("aria-hidden", "true"));
  });
});
