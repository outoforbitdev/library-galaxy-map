import { act, fireEvent, render } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockElementSize } from "../testUtils";
import { GalaxyMap, type IGalaxyMapHandle } from "./GalaxyMap";
import styles from "./GalaxyMap.module.css";
import type { ISpacelane, ISystem } from "./types";

const systems: ISystem<{ fleets: number }>[] = [
  {
    id: "a",
    name: "Alpha",
    position: { x: -100, y: -50 },
    color: "red",
    data: { fleets: 2 },
  },
  { id: "b", name: "Beta", position: { x: 100, y: 50 }, color: "blue" },
];
const lanes: ISpacelane[] = [
  {
    id: "l",
    name: "Link",
    segments: [
      {
        id: "l0",
        origin: { x: -100, y: -50 },
        destination: { x: 100, y: 50 },
        color: "gray",
      },
    ],
  },
];

const SYSTEMS = "[data-kind='system']:not([data-part])";

const systemEl = (container: HTMLElement, id: string) =>
  container.querySelector(`${SYSTEMS}[data-id='${id}']`) as SVGGElement;

const labelEl = (container: HTMLElement, id: string) =>
  container.querySelector(
    `[data-part='label'][data-id='${id}']`,
  ) as SVGGElement;

beforeEach(() => {
  mockElementSize(800, 600);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GalaxyMap rendering", () => {
  it("fits the data on first render, with y up", () => {
    const { container } = render(
      <GalaxyMap systems={systems} spacelanes={lanes} />,
    );
    expect(container.querySelector("svg > g")).toHaveAttribute(
      "transform",
      "matrix(4 0 0 -4 400 300)",
    );
  });

  it("draws lanes before systems, and higher priority systems last", () => {
    const { container } = render(
      <GalaxyMap systems={systems} spacelanes={lanes} />,
    );
    const kinds = Array.from(
      container.querySelectorAll("[data-kind]:not([data-part])"),
    ).map((el) => el.getAttribute("data-id"));
    expect(kinds).toEqual(["l", "b", "a"]);
  });

  it("labels visible systems and gives every entity an accessible name", () => {
    const { container, getByRole } = render(
      <GalaxyMap systems={systems} spacelanes={lanes} />,
    );
    expect(labelEl(container, "a").querySelector("text")).toHaveTextContent(
      "Alpha",
    );
    expect(getByRole("button", { name: "Beta" })).toBeInTheDocument();
    expect(getByRole("button", { name: "Link" })).toBeInTheDocument();
    expect(
      getByRole("application", { name: "Galaxy map" }),
    ).toBeInTheDocument();
  });

  it("draws every label above every glyph, so no label is covered by a later system", () => {
    const { container } = render(
      <GalaxyMap systems={systems} spacelanes={lanes} />,
    );
    const drawn = Array.from(
      container.querySelectorAll(`.${styles.glyph}, text`),
    );
    const lastGlyph = drawn.map((el) => el.tagName).lastIndexOf("circle");
    const firstLabel = drawn.findIndex((el) => el.tagName === "text");
    expect(firstLabel).toBeGreaterThan(-1);
    expect(lastGlyph).toBeLessThan(firstLabel);
  });

  it("draws everything when culling is disabled", () => {
    const crowded = [
      systems[0],
      { ...systems[1], id: "c", position: { x: -100, y: -50 } },
    ];
    const culled = render(<GalaxyMap systems={crowded} spacelanes={[]} />);
    expect(culled.container.querySelectorAll(SYSTEMS)).toHaveLength(1);
    culled.unmount();
    const all = render(
      <GalaxyMap systems={crowded} spacelanes={[]} culling={false} />,
    );
    expect(all.container.querySelectorAll(SYSTEMS)).toHaveLength(2);
  });

  it("renders free children in a group that ignores pointer events", () => {
    const { getByTestId } = render(
      <GalaxyMap systems={systems} spacelanes={lanes}>
        <circle data-testid="fleet" />
      </GalaxyMap>,
    );
    expect(getByTestId("fleet").parentElement).toHaveClass(styles.free);
  });

  it("keeps rendering with duplicate ids, and warns", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    const duplicate = [systems[0], { ...systems[1], id: "a" }];
    const { container } = render(
      <GalaxyMap systems={duplicate} spacelanes={[]} />,
    );
    expect(container.querySelectorAll(SYSTEMS).length).toBeGreaterThan(0);
    expect(warn).toHaveBeenCalledWith('[galaxy-map] Duplicate system id "a".');
  });

  it("puts consumer classes on the root and on entity groups, next to the map's defaults", () => {
    const styled = [{ ...systems[0], className: "capital" }, systems[1]];
    const { container } = render(
      <GalaxyMap systems={styled} spacelanes={lanes} className="my-map" />,
    );
    expect(container.firstChild).toHaveClass(styles.root, "my-map");
    expect(systemEl(container, "a")).toHaveClass(styles.system, "capital");
  });

  it("applies the highlight color only to highlight elements", () => {
    const { container, getAllByTestId } = render(
      <GalaxyMap
        systems={systems}
        spacelanes={lanes}
        highlightColor="gold"
        defaultSelected={{ kind: "system", id: "a" }}
        renderSystemOverlay={() => (
          <rect data-testid="icon" fill="currentColor" />
        )}
      />,
    );
    fireEvent.pointerOver(systemEl(container, "b"), { pointerType: "mouse" });
    expect(
      systemEl(container, "a").querySelector(`.${styles.ring}`),
    ).toHaveAttribute("color", "gold");
    expect(
      container.querySelector(`.${styles.highlight} circle`),
    ).toHaveAttribute("color", "gold");
    let element: Element | null = getAllByTestId("icon")[0];
    while (element) {
      expect(element).not.toHaveAttribute("color");
      expect((element as SVGElement).style?.color ?? "").toBe("");
      element = element.parentElement;
    }
  });

  it("renders on the server without throwing", () => {
    expect(
      renderToString(<GalaxyMap systems={systems} spacelanes={lanes} />),
    ).toContain("<svg");
  });
});

describe("GalaxyMap selection", () => {
  it("selects a clicked system and draws its ring", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <GalaxyMap systems={systems} spacelanes={lanes} onSelect={onSelect} />,
    );
    fireEvent.click(
      systemEl(container, "a").querySelector(`.${styles.glyph}`)!,
    );
    expect(onSelect).toHaveBeenCalledWith({
      kind: "system",
      id: "a",
      system: systems[0],
    });
    expect(
      systemEl(container, "a").querySelector(`.${styles.ring}`),
    ).not.toBeNull();
  });

  it("selects a system when its label is clicked", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <GalaxyMap systems={systems} spacelanes={lanes} onSelect={onSelect} />,
    );
    fireEvent.click(labelEl(container, "b").querySelector("text")!);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "b" }));
  });

  it("selects a lane with the nearest segment", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <GalaxyMap systems={systems} spacelanes={lanes} onSelect={onSelect} />,
    );
    fireEvent.click(container.querySelector(`.${styles.laneHit}`)!, {
      clientX: 400,
      clientY: 300,
    });
    expect(onSelect).toHaveBeenCalledWith({
      kind: "lane",
      id: "l",
      lane: lanes[0],
      segmentId: "l0",
    });
  });

  it("clears the selection when empty space is clicked", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <GalaxyMap
        systems={systems}
        spacelanes={lanes}
        defaultSelected={{ kind: "system", id: "a" }}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(container.querySelector("svg")!);
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("routes overlay clicks to the system unless the overlay handled them", () => {
    const onSelect = vi.fn();
    const { getAllByTestId } = render(
      <GalaxyMap
        systems={systems}
        spacelanes={lanes}
        onSelect={onSelect}
        renderSystemOverlay={(s) => (
          <>
            <rect data-testid={`icon-${s.id}`} />
            <rect
              data-testid={`income-${s.id}`}
              onClick={(e) => e.preventDefault()}
            />
          </>
        )}
      />,
    );
    fireEvent.click(getAllByTestId("income-a")[0]);
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(getAllByTestId("icon-a")[0]);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
  });

  it("ignores clicks when selection is disabled, and uses role img", () => {
    const onSelect = vi.fn();
    const { container, getByRole } = render(
      <GalaxyMap
        systems={systems}
        spacelanes={lanes}
        onSelect={onSelect}
        selectionEnabled={false}
      />,
    );
    fireEvent.click(systemEl(container, "a"));
    expect(onSelect).not.toHaveBeenCalled();
    expect(getByRole("img", { name: "Alpha" })).toBeInTheDocument();
  });

  it("selects through the imperative handle", () => {
    const ref = createRef<IGalaxyMapHandle>();
    const onSelect = vi.fn();
    render(
      <GalaxyMap
        ref={ref}
        systems={systems}
        spacelanes={lanes}
        onSelect={onSelect}
      />,
    );
    act(() => ref.current!.select({ kind: "system", id: "b" }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "b" }));
    expect(ref.current!.getSize()).toEqual({ width: 800, height: 600 });
  });

  it("clears the selection when the selected system leaves the data", () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <GalaxyMap
        systems={systems}
        spacelanes={lanes}
        defaultSelected={{ kind: "system", id: "a" }}
        onSelect={onSelect}
      />,
    );
    rerender(
      <GalaxyMap
        systems={[systems[1]]}
        spacelanes={lanes}
        defaultSelected={{ kind: "system", id: "a" }}
        onSelect={onSelect}
      />,
    );
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });
});

describe("GalaxyMap hover", () => {
  it("reports mouse hover and draws a highlight", () => {
    const onHover = vi.fn();
    const { container } = render(
      <GalaxyMap systems={systems} spacelanes={lanes} onHover={onHover} />,
    );
    fireEvent.pointerOver(
      systemEl(container, "a").querySelector(`.${styles.glyph}`)!,
      { pointerType: "mouse" },
    );
    expect(onHover).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
    expect(container.querySelector(`.${styles.highlight}`)).not.toBeNull();
    fireEvent.pointerOut(
      systemEl(container, "a").querySelector(`.${styles.glyph}`)!,
      {
        pointerType: "mouse",
        relatedTarget: container.querySelector("svg"),
      },
    );
    expect(onHover).toHaveBeenLastCalledWith(null);
  });

  it("ignores touch hover and disabled hover", () => {
    const onHover = vi.fn();
    const { container, rerender } = render(
      <GalaxyMap systems={systems} spacelanes={lanes} onHover={onHover} />,
    );
    fireEvent.pointerOver(systemEl(container, "a"), { pointerType: "touch" });
    rerender(
      <GalaxyMap
        systems={systems}
        spacelanes={lanes}
        onHover={onHover}
        hoverEnabled={false}
      />,
    );
    fireEvent.pointerOver(systemEl(container, "a"), { pointerType: "mouse" });
    expect(onHover).not.toHaveBeenCalled();
  });
});
