import type { Meta, StoryObj } from "@storybook/react";
import {
  expect,
  fn,
  userEvent,
  fireEvent,
  waitFor,
  within,
} from "storybook/test";
import GalaxyMap from "./GalaxyMap";
import { MapColor } from "./Colors";
import { FocusLevel } from "./FocusLevels";

// --- Sample data ---

const samplePlanets = [
  {
    id: "velarion",
    name: "Velarion",
    x: 0,
    y: 0,
    color: MapColor.Blue,
    focusLevel: FocusLevel.Primary,
  },
  {
    id: "duskara",
    name: "Duskara",
    x: 100,
    y: -50,
    color: MapColor.Yellow,
    focusLevel: FocusLevel.Secondary,
  },
  {
    id: "frostheim",
    name: "Frostheim",
    x: -80,
    y: 60,
    color: MapColor.Gray,
    focusLevel: FocusLevel.Tertiary,
  },
];

const sampleSpaceLanes = [
  {
    id: "lane-1",
    name: "Velarion-Duskara",
    xOne: 0,
    yOne: 0,
    xTwo: 100,
    yTwo: -50,
    color: MapColor.Gray,
    focusLevel: FocusLevel.Primary,
  },
];

const sampleDimensions = { minX: -200, minY: -200, maxX: 200, maxY: 200 };

// --- Meta ---

const meta = {
  title: "GalaxyMap",
  component: GalaxyMap,
  args: {
    planets: samplePlanets,
    spacelanes: sampleSpaceLanes,
    dimensions: sampleDimensions,
    zoom: { initial: 10 },
    onPlanetSelect: fn(),
  },
} satisfies Meta<typeof GalaxyMap>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- Documentation stories ---

/** Full map with planets, spacelanes, and map controls. Use the Controls panel to experiment with all props. */
export const Default: Story = {};

/** Demonstrates the `selectedPlanetId` prop — Duskara is highlighted. */
export const WithSelectedPlanet: Story = {
  args: {
    selectedPlanetId: "duskara",
  },
};

/** Demonstrates rendering with an empty planet and spacelane list. */
export const EmptyMap: Story = {
  args: {
    planets: [],
    spacelanes: [],
  },
};

/** Demonstrates the `legendEntries` prop with colour-coded entries. */
export const WithLegend: Story = {
  args: {
    legendEntries: [
      { id: "core", label: "Inner Worlds", color: MapColor.Blue },
      { id: "outer", label: "Outer Ring", color: MapColor.Yellow },
      { id: "wild", label: "Uncharted Space", color: MapColor.Gray },
    ],
  },
};

/** Demonstrates the `zoom` prop with custom initial, min, and max values. */
export const WithCustomZoom: Story = {
  args: {
    zoom: { initial: 10, min: 5, max: 20 },
  },
};

/** Demonstrates that updating `planets`, `spacelanes`, and `selectedPlanetId` props re-renders the map. Use the Controls panel to change these values. */
export const UpdatedProps: Story = {
  args: {
    planets: [
      {
        id: "velarion",
        name: "Velarion",
        x: 0,
        y: 0,
        color: MapColor.Blue,
        focusLevel: FocusLevel.Primary,
      },
    ],
    spacelanes: [],
    selectedPlanetId: "velarion",
  },
};

// --- Automated test stories ---

/** Verifies that planet names are rendered in the DOM. */
export const BasicRendering: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Velarion")).toBeInTheDocument();
    await expect(canvas.getByText("Duskara")).toBeInTheDocument();
    await expect(canvas.getByText("Frostheim")).toBeInTheDocument();
  },
};

/** Verifies that scroll-wheel events zoom the map by changing the SVG dimensions. */
export const ScrollZoom: Story = {
  play: async ({ canvasElement }) => {
    // Use svg[width] to target the Zoomable map SVG, not any icon SVGs in the UI
    const svg = canvasElement.querySelector("svg[width]");
    if (!svg) throw new Error("Map SVG element not found");

    const initialWidth = svg.getAttribute("width");
    await fireEvent.wheel(svg, { deltaY: -100 });
    await waitFor(() =>
      expect(svg.getAttribute("width")).not.toBe(initialWidth),
    );
  },
};

/** Verifies that a two-finger pinch gesture zooms the map by changing the SVG dimensions. */
export const PinchZoom: Story = {
  play: async ({ canvasElement }) => {
    // Use svg[width] to target the Zoomable map SVG, not any icon SVGs in the UI
    const svg = canvasElement.querySelector("svg[width]");
    if (!svg) throw new Error("Map SVG element not found");

    const initialWidth = svg.getAttribute("width");

    // Real browsers require Touch objects — plain objects are rejected by the Touch constructor
    const t1start = new Touch({
      identifier: 1,
      target: svg,
      pageX: 300,
      pageY: 250,
      clientX: 300,
      clientY: 250,
    });
    const t2start = new Touch({
      identifier: 2,
      target: svg,
      pageX: 500,
      pageY: 250,
      clientX: 500,
      clientY: 250,
    });
    const t1end = new Touch({
      identifier: 1,
      target: svg,
      pageX: 200,
      pageY: 250,
      clientX: 200,
      clientY: 250,
    });
    const t2end = new Touch({
      identifier: 2,
      target: svg,
      pageX: 600,
      pageY: 250,
      clientX: 600,
      clientY: 250,
    });

    await fireEvent.touchStart(svg, {
      touches: [t1start, t2start],
      targetTouches: [t1start, t2start],
      changedTouches: [t1start, t2start],
    });
    await fireEvent.touchMove(svg, {
      touches: [t1end, t2end],
      targetTouches: [t1end, t2end],
      changedTouches: [t1end, t2end],
    });
    await fireEvent.touchEnd(svg, {
      touches: [],
      targetTouches: [],
      changedTouches: [t1end, t2end],
    });

    await waitFor(() =>
      expect(svg.getAttribute("width")).not.toBe(initialWidth),
    );
  },
};

/** Verifies that click-and-drag pans the map by changing the inner container's position. */
export const ClickAndDragPan: Story = {
  play: async ({ canvasElement }) => {
    const draggable = canvasElement.querySelector('[class*="draggable"]');
    if (!draggable) throw new Error("Draggable element not found");

    const inner = draggable.querySelector("div");
    if (!inner) throw new Error("Inner div not found");

    // PointerEvent constructor accepts clientX/clientY (not pageX/pageY — those are
    // computed read-only properties). In a page with no scroll, pageX === clientX,
    // so Draggable's `o.pageX` correctly reads the clientX value we provide here.
    await fireEvent.pointerDown(draggable, {
      button: 0,
      clientX: 400,
      clientY: 300,
      pointerId: 1,
      bubbles: true,
    });

    // Draggable registers pointermove/pointerup on document via useEffect after
    // state commit. Wait for that re-render before firing move.
    await new Promise((r) => setTimeout(r, 5));

    await fireEvent.pointerMove(document, {
      clientX: 450,
      clientY: 320,
      pointerId: 1,
    });
    await fireEvent.pointerUp(document, {
      clientX: 450,
      clientY: 320,
      pointerId: 1,
    });

    await waitFor(() => expect(inner.style.left).not.toBe("0px"));
  },
};

/** Verifies that clicking a planet calls the `onPlanetSelect` callback with the planet data. */
export const PlanetSelectCallback: Story = {
  play: async ({ canvasElement, args }) => {
    const planetGroup = canvasElement.querySelector('[data-testid="velarion"]');
    if (!planetGroup) throw new Error("Planet group not found");

    await userEvent.click(planetGroup);
    await expect(args.onPlanetSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "velarion" }),
    );
  },
};
