# Galaxy Map Rebuild (Atlas Phase) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `@outoforbitdev/galaxy-map` as a generic `Canvas` plus a `GalaxyMap` that meets every atlas-phase requirement.

**Architecture:** `Canvas` owns gestures, the viewport, camera moves, and world-to-screen conversion, and writes one SVG transform plus a `--zoom` CSS variable per frame without rendering React. `GalaxyMap` builds spatial indexes from priority-ordered data, culls in priority order when the throttled viewport changes, and draws memoized lane and system nodes in reverse priority order, with selection, hover, and keyboard focus handled by delegation. Pure modules (`projection`, `gestures`, `spatialIndex`, `lanePaths`, `cull`, `validate`) hold all non-trivial logic.

**Tech Stack:** React 19, TypeScript (strict), SVG, CSS modules, Vitest with jsdom and Testing Library, Rollup, Storybook.

**Spec:** `docs/internal/architecture/overview.md`, `docs/internal/architecture/data-model.md`, `docs/internal/architecture/api-design.md`, `docs/internal/architecture/decisions/adr-0002-transform-and-css-variable-rendering.md`, and `docs/internal/requirements/`.

## Global Constraints

- Work on branch `jaymirecki/x-component-rebuild`. Never commit to `main`.
- Commits use Conventional Commits. The pre-commit hook runs `just lint` (Docker) and a commit message check.
- End every commit message with the session's attribution lines, if the session provides them.
- After every task: `just test` and `npm run typecheck` pass. `npm run typecheck` exists from Task 1.
- Every tuning value (size, margin, threshold, interval, default limit) is a named, documented constant in `src/canvas/constants.ts` or `src/map/constants.ts`, never a literal in logic (NFR-M9).
- Nothing in `src/canvas/` imports from `src/map/`. A test enforces this from Task 1.
- `projection.ts`, `gestures.ts`, `spatialIndex.ts`, `lanePaths.ts`, `cull.ts`, `measure.ts`, and `validate.ts` are pure: no React imports and no DOM access beyond what their signatures describe.
- Styles use CSS modules (`*.module.css`), as the existing code does. Components use `styles.<name>`, and tests import the same module and select with `` `.${styles.<name>}` ``, never a hard-coded class string. Task 1 configures Vitest to process CSS modules; without that, Vitest compiles them to an empty object.
- Consumers customize styling with their own classes, never the map's internal ones, which are hashed in builds. A system's or spacelane's `className` goes on that entity's `<g>`, and `GalaxyMap`'s `className` goes on the root. Map defaults are written so consumer classes always win: inheritable defaults (label font and fill, lane stroke width and caps, highlight color through `currentColor`) are set on the root with zero-specificity `:where()` rules and inherited, so a consumer class on the root or on an entity overrides them. Structural rules that must not be overridden (transparent hit areas, `pointer-events`) use normal classes on the element. There are no CSS custom properties for theming.
- `GalaxyMap` world coordinates use positive y for up (`MAP_Y_AXIS = "up"`). `Canvas` defaults to `"down"`.
- Zoom is in screen pixels per world unit.
- Props extend `IComponentProps` from `@outoforbitdev/ood-react`. Use `lib.getDomProps` and `lib.classNames` from that package.
- Use `just` recipes where they exist (`just install`, `just test`, `just lint`, `just build`). Run a single test file with `npx vitest run <path>`.
- Out of scope (game phase): `getVisible()`, `panEnabled`, `zoomEnabled`, `pointAlongLane`, `interpolateColor`, color transitions, README game example. The free-content `<g>` for `children` is in scope.

## Review Focus

The inputs most likely to bite a user that the spec implies but does not spell out. Each has a test in the task that owns the code.

1. **The map mounts in a hidden or zero-size container and becomes visible later.** It should fit the data when it gets a size, not stay at zoom 1. Test in Task 3.
2. **A controlled viewport whose parent ignores `onViewportChange`.** Dragging should emit changes but never move the camera. Test in Task 5.
3. **The consumer passes freshly created but equal arrays and objects on every render.** The spatial index must not rebuild and nodes must not re-render. Tests in Tasks 10 and 11.
4. **A spacelane with zero or one segment.** It should render without errors. Test in Task 7.
5. **Duplicate ids in the data.** The map should warn and keep rendering, not crash. Test in Task 12.

---

## File Structure

```
src/
  setupTests.ts                 modified: canvas getContext stub
  testUtils.ts                  new: mockElementSize for tests
  index.ts, index.test.ts       replaced in Task 14
  canvas/
    types.ts                    IPoint, IBounds, IViewport, IPadding, ISize, YAxis
    constants.ts                canvas tuning constants
    projection.ts               pure: conversions, transform, clamping, fitting, interpolation
    gestures.ts                 pure: drag threshold, pan, zoom at point, wheel, pinch, keys
    useViewport.ts              camera state: controlled and uncontrolled, publishing, animation
    useGestures.ts              pointer, wheel, and click-cancellation handlers
    CanvasContext.ts            context and useCanvas
    screenSpace.ts              screenSpaceClassName
    Canvas.module.css           canvas styles
    Canvas.tsx                  the Canvas component
  map/
    types.ts                    entity, selection, and event types
    constants.ts                map tuning constants
    spatialIndex.ts             pure: grid indexes, geometry change detection, data bounds
    lanePaths.ts                pure: color runs, hit path, nearest segment
    measure.ts                  label width measurement with cache and fallback
    cull.ts                     pure: priority-order culling
    validate.ts                 pure: development data warnings
    keyboardFocus.ts            pure: next focused system
    primitives.tsx              SystemGlyph, SpacelaneSegment, laneStrokeProps
    SystemNode.tsx              memoized system group
    LaneNode.tsx                memoized lane group
    Highlight.tsx               hover and focus highlight
    GalaxyMap.module.css        map styles
    useMapData.ts               indexes, lookups, bounds, dev warnings
    useSelection.ts             selection and hover state
    MapContent.tsx              culling and rendering inside the canvas
    GalaxyMap.tsx               the GalaxyMap component
    GalaxyMap.stories.tsx       stories, including full scale
  stories/
    generateGalaxy.ts           deterministic full-scale test data
```

Old code under `src/components/`, `src/types/`, and `src/utils/` stays in place, with its tests passing, until Task 14 removes it.

---

### Task 1: Tooling and canvas projection

**Files:**

- Modify: `tsconfig.json`, `package.json`, `Justfile`, `vitest.config.ts`, `src/setupTests.ts`
- Create: `src/canvas/types.ts`, `src/canvas/constants.ts`, `src/canvas/projection.ts`, `src/testUtils.ts`
- Test: `src/canvas/projection.test.ts`, `src/canvas/dependencies.test.ts`

**Interfaces:**

- Produces: `IPoint`, `IBounds`, `IViewport`, `IPadding`, `ISize`, `YAxis`, `ILimits`, `IFitOptions`; `ySign(yAxis)`, `worldToScreen(point, viewport, size, yAxis)`, `screenToWorld(point, viewport, size, yAxis)`, `worldTransform(viewport, size, yAxis): string`, `visibleWorldRect(viewport, size, margin?): IBounds`, `clampViewport(target, limits, size, current?): IViewport`, `normalizePadding(padding?): IPadding`, `fitViewport(points, size, options?): IViewport | null`, `interpolateViewport(from, to, t)`, `easeInOut(t)`; `mockElementSize(width, height)`.

- [ ] **Step 1: Update TypeScript and scripts**

The current `es5` target rejects iterating `Set` and `Map`, and `moduleResolution: node` cannot resolve Storybook's types. Both were verified: with the change below, `tsc --noEmit` and `just build` pass on the existing code.

In `tsconfig.json`, change:

```json
    "target": "es5",
```

to:

```json
    "target": "es2019",
```

and change:

```json
    "moduleResolution": "node",
```

to:

```json
    "moduleResolution": "bundler",
```

In `package.json` `scripts`, add after `"test:watch": "vitest",`:

```json
    "typecheck": "tsc --noEmit",
```

In `Justfile`, replace:

```
gate: test lint
```

with:

```
typecheck:
    npm run typecheck

gate: test typecheck lint
```

In `vitest.config.ts`, add a `css` option to `test`, so CSS modules compile to real class names in tests instead of an empty object. This was verified: the existing 130 tests still pass with it.

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    css: {
      include: /\.module\.css$/,
      modules: { classNameStrategy: "stable" },
    },
  },
});
```

At the end of `src/setupTests.ts`, add:

```ts
// jsdom does not implement canvas. Returning null makes label measurement use
// its documented fallback instead of logging "not implemented" errors.
HTMLCanvasElement.prototype.getContext = (() =>
  null) as unknown as HTMLCanvasElement["getContext"];
```

- [ ] **Step 2: Verify tooling**

Run: `just install && npm run typecheck && just test && just build && rm -rf dist`
Expected: typecheck exits 0, all existing tests pass, build writes `dist/cjs/index.js`, `dist/esm/index.js`, and `dist/types.d.ts`.

- [ ] **Step 3: Create canvas types and constants**

Create `src/canvas/types.ts`:

```ts
/** A point in world or screen coordinates. */
export interface IPoint {
  x: number;
  y: number;
}

/** An axis-aligned rectangle, given by its minimum and maximum corners. */
export interface IBounds {
  min: IPoint;
  max: IPoint;
}

/**
 * A camera position. `zoom` is in screen pixels per world unit, so the same
 * viewport shows the same level of detail on every screen size.
 */
export interface IViewport {
  center: IPoint;
  zoom: number;
}

/** Space, in screen pixels, to keep clear on each side when framing. */
export interface IPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** A container size in screen pixels. */
export interface ISize {
  width: number;
  height: number;
}

/** Direction of positive y in world coordinates. */
export type YAxis = "up" | "down";
```

Create `src/canvas/constants.ts`:

```ts
/** Most frequent viewport publishing to children, in milliseconds. */
export const PUBLISH_INTERVAL_MS = 100;

/** Wheel inactivity before a wheel zoom counts as settled, in milliseconds. */
export const WHEEL_SETTLE_MS = 150;

/** Mouse movement, in pixels, that turns a press into a pan. */
export const DRAG_THRESHOLD_MOUSE_PX = 4;

/** Touch movement, in pixels, that turns a press into a pan. */
export const DRAG_THRESHOLD_TOUCH_PX = 8;

/** How far, in views, the view center may move beyond the bounds. */
export const BOUNDS_VIEW_MARGIN = 0.5;

/** Arrow key pan distance, as a fraction of the view. */
export const KEYBOARD_PAN_FRACTION = 0.1;

/** Zoom change per plus or minus key press. */
export const KEYBOARD_ZOOM_FACTOR = 1.25;

/** Zoom change per pixel of wheel delta. Starting value. */
export const WHEEL_ZOOM_SENSITIVITY = 0.002;

/** Zoom change per pixel of trackpad pinch delta (wheel with ctrlKey). Starting value. */
export const PINCH_ZOOM_SENSITIVITY = 0.01;

/** Pixels per line when a wheel event reports its delta in lines. */
export const WHEEL_LINE_HEIGHT_PX = 16;

/** Zoom used when there is no viewport, default viewport, or bounds to fit. */
export const DEFAULT_ZOOM = 1;
```

- [ ] **Step 4: Write the failing projection tests**

Create `src/canvas/projection.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  clampViewport,
  easeInOut,
  fitViewport,
  interpolateViewport,
  screenToWorld,
  visibleWorldRect,
  worldToScreen,
  worldTransform,
} from "./projection";
import type { IViewport } from "./types";

const size = { width: 800, height: 600 };
const viewport: IViewport = { center: { x: 100, y: 50 }, zoom: 2 };

describe("worldToScreen and screenToWorld", () => {
  it("maps the view center to the middle of the screen", () => {
    expect(worldToScreen({ x: 100, y: 50 }, viewport, size, "down")).toEqual({
      x: 400,
      y: 300,
    });
    expect(worldToScreen({ x: 100, y: 50 }, viewport, size, "up")).toEqual({
      x: 400,
      y: 300,
    });
  });

  it("puts larger world y lower on screen when y points down", () => {
    expect(worldToScreen({ x: 110, y: 60 }, viewport, size, "down")).toEqual({
      x: 420,
      y: 320,
    });
  });

  it("puts larger world y higher on screen when y points up", () => {
    expect(worldToScreen({ x: 110, y: 60 }, viewport, size, "up")).toEqual({
      x: 420,
      y: 280,
    });
  });

  it.each(["up", "down"] as const)("round trips with y %s", (yAxis) => {
    const point = { x: -37.5, y: 812.25 };
    const back = screenToWorld(
      worldToScreen(point, viewport, size, yAxis),
      viewport,
      size,
      yAxis,
    );
    expect(back.x).toBeCloseTo(point.x);
    expect(back.y).toBeCloseTo(point.y);
  });
});

describe("worldTransform", () => {
  it("produces a matrix that agrees with worldToScreen", () => {
    expect(worldTransform(viewport, size, "up")).toBe(
      "matrix(2 0 0 -2 200 400)",
    );
    expect(worldTransform(viewport, size, "down")).toBe(
      "matrix(2 0 0 2 200 200)",
    );
  });
});

describe("visibleWorldRect", () => {
  it("returns the world area on screen", () => {
    expect(visibleWorldRect(viewport, size)).toEqual({
      min: { x: -100, y: -100 },
      max: { x: 300, y: 200 },
    });
  });

  it("adds a margin as a fraction of the view on each side", () => {
    const rect = visibleWorldRect(viewport, size, 0.1);
    expect(rect.min.x).toBeCloseTo(-140);
    expect(rect.max.x).toBeCloseTo(340);
  });
});

describe("clampViewport", () => {
  const bounds = { min: { x: 0, y: 0 }, max: { x: 1000, y: 1000 } };

  it("clamps zoom to the limits", () => {
    expect(
      clampViewport({ center: { x: 0, y: 0 }, zoom: 10 }, { maxZoom: 4 }, size)
        .zoom,
    ).toBe(4);
    expect(
      clampViewport(
        { center: { x: 0, y: 0 }, zoom: 0.1 },
        { minZoom: 0.5 },
        size,
      ).zoom,
    ).toBe(0.5);
  });

  it("lets the center move half a view beyond the bounds", () => {
    const clamped = clampViewport(
      { center: { x: 5000, y: -5000 }, zoom: 2 },
      { bounds },
      size,
    );
    expect(clamped.center).toEqual({ x: 1200, y: -150 });
  });

  it("does not move a camera that is already outside the bounds", () => {
    const current = { center: { x: 3000, y: 500 }, zoom: 2 };
    expect(clampViewport(current, { bounds }, size, current)).toEqual(current);
  });

  it("allows moving back toward the bounds but not further away", () => {
    const current = { center: { x: 3000, y: 500 }, zoom: 2 };
    expect(
      clampViewport(
        { center: { x: 2500, y: 500 }, zoom: 2 },
        { bounds },
        size,
        current,
      ).center.x,
    ).toBe(2500);
    expect(
      clampViewport(
        { center: { x: 3500, y: 500 }, zoom: 2 },
        { bounds },
        size,
        current,
      ).center.x,
    ).toBe(3000);
  });

  it("expands zoom limits to include the current zoom", () => {
    const current = { center: { x: 500, y: 500 }, zoom: 10 };
    expect(
      clampViewport(
        { center: current.center, zoom: 8 },
        { maxZoom: 4 },
        size,
        current,
      ).zoom,
    ).toBe(8);
    expect(
      clampViewport(
        { center: current.center, zoom: 12 },
        { maxZoom: 4 },
        size,
        current,
      ).zoom,
    ).toBe(10);
  });
});

describe("fitViewport", () => {
  const points = [
    { x: 0, y: 0 },
    { x: 100, y: 50 },
  ];

  it("returns null for no points or no size", () => {
    expect(fitViewport([], size)).toBeNull();
    expect(fitViewport(points, { width: 0, height: 0 })).toBeNull();
  });

  it("fits the bounding box of the points", () => {
    expect(fitViewport(points, size)).toEqual({
      center: { x: 50, y: 25 },
      zoom: 8,
    });
  });

  it("keeps padding clear on every side", () => {
    expect(fitViewport(points, size, { padding: 100 })).toEqual({
      center: { x: 50, y: 25 },
      zoom: 6,
    });
  });

  it("offsets the center for uneven padding", () => {
    const fitted = fitViewport(points, size, {
      padding: { top: 0, right: 0, bottom: 0, left: 200 },
    });
    expect(fitted?.zoom).toBe(6);
    expect(
      worldToScreen({ x: 50, y: 25 }, fitted!, size, "down").x,
    ).toBeCloseTo(500);
  });

  it("uses maxZoom for a single point", () => {
    expect(fitViewport([{ x: 5, y: 5 }], size, { maxZoom: 3 })).toEqual({
      center: { x: 5, y: 5 },
      zoom: 3,
    });
  });

  it("clamps to the zoom limits", () => {
    expect(fitViewport(points, size, { maxZoom: 4 })?.zoom).toBe(4);
  });
});

describe("interpolateViewport", () => {
  const from = { center: { x: 0, y: 0 }, zoom: 1 };
  const to = { center: { x: 100, y: -50 }, zoom: 4 };

  it("returns the endpoints at 0 and 1", () => {
    expect(interpolateViewport(from, to, 0)).toEqual(from);
    expect(interpolateViewport(from, to, 1)).toEqual(to);
  });

  it("moves the center linearly and the zoom on a log scale", () => {
    const middle = interpolateViewport(from, to, 0.5);
    expect(middle.center).toEqual({ x: 50, y: -25 });
    expect(middle.zoom).toBeCloseTo(2);
  });

  it("eases in and out", () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(0.5)).toBe(0.5);
    expect(easeInOut(1)).toBe(1);
  });
});
```

- [ ] **Step 5: Run the tests to verify they fail**

Run: `npx vitest run src/canvas/projection.test.ts`
Expected: FAIL, with an error that `./projection` cannot be resolved.

- [ ] **Step 6: Implement projection**

Create `src/canvas/projection.ts`:

```ts
import { BOUNDS_VIEW_MARGIN, DEFAULT_ZOOM } from "./constants";
import type {
  IBounds,
  IPadding,
  IPoint,
  ISize,
  IViewport,
  YAxis,
} from "./types";

/** Zoom and pan limits. Bounds describe the content area. */
export interface ILimits {
  bounds?: IBounds;
  minZoom?: number;
  maxZoom?: number;
}

/** Options for fitting points into view. */
export interface IFitOptions extends ILimits {
  padding?: number | IPadding;
  yAxis?: YAxis;
}

/** Screen direction of world +y: -1 when world y points up, 1 when it points down. */
export function ySign(yAxis: YAxis): 1 | -1 {
  return yAxis === "up" ? -1 : 1;
}

/** Converts a world point to pixels relative to the container's top-left corner. */
export function worldToScreen(
  point: IPoint,
  viewport: IViewport,
  size: ISize,
  yAxis: YAxis,
): IPoint {
  return {
    x: size.width / 2 + viewport.zoom * (point.x - viewport.center.x),
    y:
      size.height / 2 +
      ySign(yAxis) * viewport.zoom * (point.y - viewport.center.y),
  };
}

/** Converts pixels relative to the container's top-left corner to a world point. */
export function screenToWorld(
  point: IPoint,
  viewport: IViewport,
  size: ISize,
  yAxis: YAxis,
): IPoint {
  return {
    x: viewport.center.x + (point.x - size.width / 2) / viewport.zoom,
    y:
      viewport.center.y +
      (ySign(yAxis) * (point.y - size.height / 2)) / viewport.zoom,
  };
}

/** The SVG transform for the world group: world coordinates in, screen pixels out. */
export function worldTransform(
  viewport: IViewport,
  size: ISize,
  yAxis: YAxis,
): string {
  const sign = ySign(yAxis);
  const zoom = viewport.zoom;
  const tx = size.width / 2 - zoom * viewport.center.x;
  const ty = size.height / 2 - sign * zoom * viewport.center.y;
  return `matrix(${zoom} 0 0 ${sign * zoom} ${tx} ${ty})`;
}

/**
 * The world area on screen, plus `margin` (a fraction of the view) on each
 * side. Always returned with min below max, whichever way y points.
 */
export function visibleWorldRect(
  viewport: IViewport,
  size: ISize,
  margin = 0,
): IBounds {
  const halfWidth = (size.width / 2 / viewport.zoom) * (1 + 2 * margin);
  const halfHeight = (size.height / 2 / viewport.zoom) * (1 + 2 * margin);
  return {
    min: {
      x: viewport.center.x - halfWidth,
      y: viewport.center.y - halfHeight,
    },
    max: {
      x: viewport.center.x + halfWidth,
      y: viewport.center.y + halfHeight,
    },
  };
}

function clampAxis(
  value: number,
  low: number,
  high: number,
  current?: number,
): number {
  const lo = current === undefined ? low : Math.min(low, current);
  const hi = current === undefined ? high : Math.max(high, current);
  return Math.min(hi, Math.max(lo, value));
}

/**
 * Clamps a target viewport to the limits. The center may move up to half a
 * view beyond the bounds. When `current` is given, the limits are expanded to
 * include it, so clamping never moves a camera that is already outside them:
 * it can move back toward the limits but not further away.
 */
export function clampViewport(
  target: IViewport,
  limits: ILimits,
  size: ISize,
  current?: IViewport,
): IViewport {
  const zoom = clampAxis(
    target.zoom,
    limits.minZoom ?? 0,
    limits.maxZoom ?? Infinity,
    current?.zoom,
  );
  const { bounds } = limits;
  if (!bounds || size.width <= 0 || size.height <= 0) {
    return { center: target.center, zoom };
  }
  const marginX = (size.width * BOUNDS_VIEW_MARGIN) / zoom;
  const marginY = (size.height * BOUNDS_VIEW_MARGIN) / zoom;
  return {
    zoom,
    center: {
      x: clampAxis(
        target.center.x,
        bounds.min.x - marginX,
        bounds.max.x + marginX,
        current?.center.x,
      ),
      y: clampAxis(
        target.center.y,
        bounds.min.y - marginY,
        bounds.max.y + marginY,
        current?.center.y,
      ),
    },
  };
}

/** Expands a single padding number to all four sides. */
export function normalizePadding(padding?: number | IPadding): IPadding {
  if (typeof padding === "number") {
    return { top: padding, right: padding, bottom: padding, left: padding };
  }
  return padding ?? { top: 0, right: 0, bottom: 0, left: 0 };
}

/**
 * The smallest viewport that shows every point inside the padding, clamped to
 * the limits. Returns null when there are no points or no size. A single point
 * is shown at `maxZoom`, or `DEFAULT_ZOOM` when there is none.
 */
export function fitViewport(
  points: IPoint[],
  size: ISize,
  options: IFitOptions = {},
): IViewport | null {
  if (points.length === 0 || size.width <= 0 || size.height <= 0) return null;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const padding = normalizePadding(options.padding);
  const availableWidth = Math.max(1, size.width - padding.left - padding.right);
  const availableHeight = Math.max(
    1,
    size.height - padding.top - padding.bottom,
  );
  let zoom = Math.min(
    maxX > minX ? availableWidth / (maxX - minX) : Infinity,
    maxY > minY ? availableHeight / (maxY - minY) : Infinity,
  );
  if (!Number.isFinite(zoom)) zoom = options.maxZoom ?? DEFAULT_ZOOM;
  zoom = Math.min(
    options.maxZoom ?? Infinity,
    Math.max(options.minZoom ?? 0, zoom),
  );
  const sign = ySign(options.yAxis ?? "down");
  const center = {
    x: (minX + maxX) / 2 - (padding.left - padding.right) / (2 * zoom),
    y: (minY + maxY) / 2 - (sign * (padding.top - padding.bottom)) / (2 * zoom),
  };
  return clampViewport({ center, zoom }, options, size);
}

/** Interpolates the center linearly and the zoom on a log scale. */
export function interpolateViewport(
  from: IViewport,
  to: IViewport,
  t: number,
): IViewport {
  return {
    center: {
      x: from.center.x + (to.center.x - from.center.x) * t,
      y: from.center.y + (to.center.y - from.center.y) * t,
    },
    zoom: from.zoom * Math.pow(to.zoom / from.zoom, t),
  };
}

/** Cubic ease-in-out for camera animations. */
export function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
```

- [ ] **Step 7: Run the projection tests to verify they pass**

Run: `npx vitest run src/canvas/projection.test.ts`
Expected: PASS.

- [ ] **Step 8: Add the dependency rule test and test helper**

Create `src/canvas/dependencies.test.ts`:

```ts
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

const canvasDir = fileURLToPath(new URL(".", import.meta.url));

it("nothing in canvas/ imports from map/, so Canvas stays portable", () => {
  const offenders = readdirSync(canvasDir)
    .filter((file) => /\.(ts|tsx)$/.test(file))
    .filter((file) =>
      /from\s+["'][^"']*\/map(\/[^"']*)?["']/.test(
        readFileSync(join(canvasDir, file), "utf8"),
      ),
    );
  expect(offenders).toEqual([]);
});
```

Create `src/testUtils.ts`:

```ts
import { vi } from "vitest";

/**
 * Gives every HTML element a fixed size in tests. jsdom reports zero for all
 * layout, and the canvas needs a size before it renders content.
 */
export function mockElementSize(width: number, height: number) {
  return vi
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockReturnValue({
      width,
      height,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
}
```

- [ ] **Step 9: Run everything**

Run: `just test && npm run typecheck`
Expected: all tests pass, typecheck exits 0.

- [ ] **Step 10: Commit**

```bash
git add tsconfig.json package.json Justfile vitest.config.ts src/setupTests.ts src/testUtils.ts src/canvas
git commit -m "feat(canvas): add projection math and typecheck tooling"
```

---

### Task 2: Gesture math

**Files:**

- Create: `src/canvas/gestures.ts`
- Test: `src/canvas/gestures.test.ts`

**Interfaces:**

- Consumes: `screenToWorld`, `ySign` from Task 1; canvas constants.
- Produces: `exceedsDragThreshold(start, current, pointerType): boolean`, `panByPixels(viewport, dx, dy, yAxis): IViewport`, `zoomAtPoint(viewport, size, screenPoint, factor, yAxis): IViewport`, `wheelZoomFactor(deltaY, deltaMode, ctrlKey): number`, `pinchUpdate(previous, next, viewport, size, yAxis): IViewport`, `type KeyAction`, `keyAction(key, size): KeyAction | null`.

- [ ] **Step 1: Write the failing tests**

Create `src/canvas/gestures.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  exceedsDragThreshold,
  keyAction,
  panByPixels,
  pinchUpdate,
  wheelZoomFactor,
  zoomAtPoint,
} from "./gestures";
import { screenToWorld } from "./projection";
import type { IPoint } from "./types";

const size = { width: 800, height: 600 };

describe("exceedsDragThreshold", () => {
  it("uses a smaller threshold for mouse than touch", () => {
    expect(exceedsDragThreshold({ x: 0, y: 0 }, { x: 3, y: 0 }, "mouse")).toBe(
      false,
    );
    expect(exceedsDragThreshold({ x: 0, y: 0 }, { x: 5, y: 0 }, "mouse")).toBe(
      true,
    );
    expect(exceedsDragThreshold({ x: 0, y: 0 }, { x: 6, y: 0 }, "touch")).toBe(
      false,
    );
    expect(exceedsDragThreshold({ x: 0, y: 0 }, { x: 9, y: 0 }, "touch")).toBe(
      true,
    );
  });
});

describe("panByPixels", () => {
  const viewport = { center: { x: 0, y: 0 }, zoom: 2 };

  it("moves content with the pointer when y points down", () => {
    expect(panByPixels(viewport, 20, 10, "down").center).toEqual({
      x: -10,
      y: -5,
    });
  });

  it("moves content with the pointer when y points up", () => {
    expect(panByPixels(viewport, 20, 10, "up").center).toEqual({
      x: -10,
      y: 5,
    });
  });
});

describe("zoomAtPoint", () => {
  it.each(["up", "down"] as const)(
    "keeps the world point under the pointer fixed with y %s",
    (yAxis) => {
      const viewport = { center: { x: 10, y: 20 }, zoom: 1 };
      const pointer = { x: 600, y: 450 };
      const before = screenToWorld(pointer, viewport, size, yAxis);
      const zoomed = zoomAtPoint(viewport, size, pointer, 2, yAxis);
      const after = screenToWorld(pointer, zoomed, size, yAxis);
      expect(zoomed.zoom).toBe(2);
      expect(after.x).toBeCloseTo(before.x);
      expect(after.y).toBeCloseTo(before.y);
    },
  );
});

describe("wheelZoomFactor", () => {
  it("zooms in for negative delta and out for positive delta", () => {
    expect(wheelZoomFactor(-100, 0, false)).toBeGreaterThan(1);
    expect(wheelZoomFactor(100, 0, false)).toBeLessThan(1);
  });

  it("treats ctrlKey as a trackpad pinch with its own sensitivity", () => {
    expect(wheelZoomFactor(-10, 0, true)).toBeCloseTo(Math.exp(0.1));
    expect(wheelZoomFactor(-10, 0, false)).toBeCloseTo(Math.exp(0.02));
  });

  it("converts line deltas to pixels", () => {
    expect(wheelZoomFactor(-1, 1, false)).toBeCloseTo(
      wheelZoomFactor(-16, 0, false),
    );
  });
});

describe("pinchUpdate", () => {
  it("zooms by the change in finger distance around the midpoint", () => {
    const viewport = { center: { x: 0, y: 0 }, zoom: 1 };
    const previous: [IPoint, IPoint] = [
      { x: 300, y: 300 },
      { x: 500, y: 300 },
    ];
    const next: [IPoint, IPoint] = [
      { x: 200, y: 300 },
      { x: 600, y: 300 },
    ];
    const result = pinchUpdate(previous, next, viewport, size, "up");
    expect(result.zoom).toBeCloseTo(2);
    const anchorBefore = screenToWorld(
      { x: 400, y: 300 },
      viewport,
      size,
      "up",
    );
    const anchorAfter = screenToWorld({ x: 400, y: 300 }, result, size, "up");
    expect(anchorAfter.x).toBeCloseTo(anchorBefore.x);
    expect(anchorAfter.y).toBeCloseTo(anchorBefore.y);
  });

  it("pans when both fingers move together", () => {
    const viewport = { center: { x: 0, y: 0 }, zoom: 1 };
    const previous: [IPoint, IPoint] = [
      { x: 300, y: 300 },
      { x: 500, y: 300 },
    ];
    const next: [IPoint, IPoint] = [
      { x: 350, y: 300 },
      { x: 550, y: 300 },
    ];
    expect(pinchUpdate(previous, next, viewport, size, "down")).toEqual({
      center: { x: -50, y: 0 },
      zoom: 1,
    });
  });
});

describe("keyAction", () => {
  it("pans a tenth of the view with arrow keys", () => {
    expect(keyAction("ArrowLeft", size)).toEqual({
      type: "pan",
      dx: 80,
      dy: 0,
    });
    expect(keyAction("ArrowRight", size)).toEqual({
      type: "pan",
      dx: -80,
      dy: 0,
    });
    expect(keyAction("ArrowUp", size)).toEqual({ type: "pan", dx: 0, dy: 60 });
    expect(keyAction("ArrowDown", size)).toEqual({
      type: "pan",
      dx: 0,
      dy: -60,
    });
  });

  it("zooms with plus and minus", () => {
    expect(keyAction("+", size)).toEqual({ type: "zoom", factor: 1.25 });
    expect(keyAction("=", size)).toEqual({ type: "zoom", factor: 1.25 });
    expect(keyAction("-", size)).toEqual({ type: "zoom", factor: 0.8 });
  });

  it("ignores other keys", () => {
    expect(keyAction("x", size)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/canvas/gestures.test.ts`
Expected: FAIL, with an error that `./gestures` cannot be resolved.

- [ ] **Step 3: Implement gestures**

Create `src/canvas/gestures.ts`:

```ts
import {
  DRAG_THRESHOLD_MOUSE_PX,
  DRAG_THRESHOLD_TOUCH_PX,
  KEYBOARD_PAN_FRACTION,
  KEYBOARD_ZOOM_FACTOR,
  PINCH_ZOOM_SENSITIVITY,
  WHEEL_LINE_HEIGHT_PX,
  WHEEL_ZOOM_SENSITIVITY,
} from "./constants";
import { screenToWorld, ySign } from "./projection";
import type { IPoint, ISize, IViewport, YAxis } from "./types";

/** Whether a press has moved far enough to count as a pan rather than a click. */
export function exceedsDragThreshold(
  start: IPoint,
  current: IPoint,
  pointerType: string,
): boolean {
  const threshold =
    pointerType === "touch" ? DRAG_THRESHOLD_TOUCH_PX : DRAG_THRESHOLD_MOUSE_PX;
  return Math.hypot(current.x - start.x, current.y - start.y) > threshold;
}

/** Pans so content moves with the pointer by (dx, dy) screen pixels. */
export function panByPixels(
  viewport: IViewport,
  dx: number,
  dy: number,
  yAxis: YAxis,
): IViewport {
  return {
    zoom: viewport.zoom,
    center: {
      x: viewport.center.x - dx / viewport.zoom,
      y: viewport.center.y - (ySign(yAxis) * dy) / viewport.zoom,
    },
  };
}

/** Multiplies zoom by `factor`, keeping the world point under `screenPoint` fixed. */
export function zoomAtPoint(
  viewport: IViewport,
  size: ISize,
  screenPoint: IPoint,
  factor: number,
  yAxis: YAxis,
): IViewport {
  const anchor = screenToWorld(screenPoint, viewport, size, yAxis);
  const zoom = viewport.zoom * factor;
  return {
    zoom,
    center: {
      x: anchor.x - (screenPoint.x - size.width / 2) / zoom,
      y: anchor.y - (ySign(yAxis) * (screenPoint.y - size.height / 2)) / zoom,
    },
  };
}

/**
 * Zoom factor for a wheel event. A wheel event with ctrlKey is a trackpad
 * pinch, which reports small deltas and gets its own sensitivity.
 */
export function wheelZoomFactor(
  deltaY: number,
  deltaMode: number,
  ctrlKey: boolean,
): number {
  const pixels = deltaMode === 1 ? deltaY * WHEEL_LINE_HEIGHT_PX : deltaY;
  const sensitivity = ctrlKey ? PINCH_ZOOM_SENSITIVITY : WHEEL_ZOOM_SENSITIVITY;
  return Math.exp(-pixels * sensitivity);
}

function midpoint(a: IPoint, b: IPoint): IPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Applies a two-finger move: zoom by the distance change, then pan by the midpoint change. */
export function pinchUpdate(
  previous: [IPoint, IPoint],
  next: [IPoint, IPoint],
  viewport: IViewport,
  size: ISize,
  yAxis: YAxis,
): IViewport {
  const previousDistance = Math.hypot(
    previous[0].x - previous[1].x,
    previous[0].y - previous[1].y,
  );
  const nextDistance = Math.hypot(next[0].x - next[1].x, next[0].y - next[1].y);
  const factor = previousDistance > 0 ? nextDistance / previousDistance : 1;
  const previousMid = midpoint(previous[0], previous[1]);
  const nextMid = midpoint(next[0], next[1]);
  const zoomed = zoomAtPoint(viewport, size, previousMid, factor, yAxis);
  return panByPixels(
    zoomed,
    nextMid.x - previousMid.x,
    nextMid.y - previousMid.y,
    yAxis,
  );
}

/** A keyboard camera action: pan content by pixels, or zoom by a factor. */
export type KeyAction =
  | { type: "pan"; dx: number; dy: number }
  | { type: "zoom"; factor: number };

/** Maps a key to a camera action. Arrow keys move the view in their direction. */
export function keyAction(key: string, size: ISize): KeyAction | null {
  const panX = size.width * KEYBOARD_PAN_FRACTION;
  const panY = size.height * KEYBOARD_PAN_FRACTION;
  switch (key) {
    case "ArrowLeft":
      return { type: "pan", dx: panX, dy: 0 };
    case "ArrowRight":
      return { type: "pan", dx: -panX, dy: 0 };
    case "ArrowUp":
      return { type: "pan", dx: 0, dy: panY };
    case "ArrowDown":
      return { type: "pan", dx: 0, dy: -panY };
    case "+":
    case "=":
      return { type: "zoom", factor: KEYBOARD_ZOOM_FACTOR };
    case "-":
    case "_":
      return { type: "zoom", factor: 1 / KEYBOARD_ZOOM_FACTOR };
    default:
      return null;
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/canvas/gestures.test.ts && npm run typecheck`
Expected: PASS, typecheck exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/canvas/gestures.ts src/canvas/gestures.test.ts
git commit -m "feat(canvas): add gesture math"
```

---

### Task 3: Viewport controller hook

**Files:**

- Create: `src/canvas/useViewport.ts`
- Test: `src/canvas/useViewport.test.ts`

**Interfaces:**

- Consumes: `clampViewport`, `fitViewport`, `interpolateViewport`, `easeInOut`, `ILimits` from Task 1; `PUBLISH_INTERVAL_MS`, `DEFAULT_ZOOM`.
- Produces:

```ts
export interface IViewportChangeInfo {
  settled: boolean;
}
export interface IUseViewportOptions extends ILimits {
  viewport?: IViewport;
  defaultViewport?: IViewport;
  onViewportChange?: (viewport: IViewport, info: IViewportChangeInfo) => void;
  size: ISize;
  yAxis: YAxis;
  apply: (viewport: IViewport) => void;
}
export interface IViewportController {
  getViewport(): IViewport;
  moveBy(update: (current: IViewport) => IViewport): void;
  settle(): void;
  animateTo(target: IViewport, durationMs: number): void;
  cancelAnimation(): void;
  published: IViewport;
}
export function useViewport(options: IUseViewportOptions): IViewportController;
```

- [ ] **Step 1: Write the failing tests**

Create `src/canvas/useViewport.test.ts`:

```ts
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ISize, IViewport } from "./types";
import { type IUseViewportOptions, useViewport } from "./useViewport";

const size: ISize = { width: 800, height: 400 };
const start: IViewport = { center: { x: 0, y: 0 }, zoom: 1 };

function setup(overrides: Partial<IUseViewportOptions> = {}) {
  const apply = vi.fn();
  const onViewportChange = vi.fn();
  const initialProps: IUseViewportOptions = {
    size,
    yAxis: "down",
    apply,
    onViewportChange,
    ...overrides,
  };
  const hook = renderHook((props: IUseViewportOptions) => useViewport(props), {
    initialProps,
  });
  return { ...hook, apply, onViewportChange, initialProps };
}

beforeEach(() => {
  vi.useFakeTimers({
    toFake: [
      "setTimeout",
      "clearTimeout",
      "Date",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "performance",
    ],
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useViewport", () => {
  it("applies the default viewport on mount", () => {
    const { apply } = setup({ defaultViewport: start });
    expect(apply).toHaveBeenLastCalledWith(start);
  });

  it("fits the bounds when there is no viewport or default viewport", () => {
    const { apply } = setup({
      bounds: { min: { x: 0, y: 0 }, max: { x: 1000, y: 500 } },
    });
    expect(apply).toHaveBeenLastCalledWith({
      center: { x: 500, y: 250 },
      zoom: 0.8,
    });
  });

  it("fits the bounds once the container gets a size", () => {
    const bounds = { min: { x: 0, y: 0 }, max: { x: 1000, y: 500 } };
    const { apply, rerender, initialProps } = setup({
      bounds,
      size: { width: 0, height: 0 },
    });
    expect(apply).not.toHaveBeenCalled();
    rerender({ ...initialProps, size });
    expect(apply).toHaveBeenLastCalledWith({
      center: { x: 500, y: 250 },
      zoom: 0.8,
    });
  });

  it("applies gesture moves and reports them as unsettled", () => {
    const { result, apply, onViewportChange } = setup({
      defaultViewport: start,
    });
    act(() =>
      result.current.moveBy((v) => ({ ...v, center: { x: 10, y: 0 } })),
    );
    expect(apply).toHaveBeenLastCalledWith({
      center: { x: 10, y: 0 },
      zoom: 1,
    });
    expect(onViewportChange).toHaveBeenLastCalledWith(
      { center: { x: 10, y: 0 }, zoom: 1 },
      { settled: false },
    );
    act(() => result.current.settle());
    expect(onViewportChange).toHaveBeenLastCalledWith(
      { center: { x: 10, y: 0 }, zoom: 1 },
      { settled: true },
    );
  });

  it("throttles publishing during movement and publishes immediately on settle", () => {
    const { result } = setup({ defaultViewport: start });
    act(() => result.current.moveBy((v) => ({ ...v, center: { x: 1, y: 0 } })));
    act(() => result.current.moveBy((v) => ({ ...v, center: { x: 2, y: 0 } })));
    expect(result.current.published).toEqual(start);
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.published.center.x).toBe(2);
    act(() => result.current.moveBy((v) => ({ ...v, center: { x: 3, y: 0 } })));
    act(() => result.current.settle());
    expect(result.current.published.center.x).toBe(3);
  });

  it("in controlled mode, emits moves but only applies the viewport prop", () => {
    const { result, apply, onViewportChange, rerender, initialProps } = setup({
      viewport: start,
    });
    apply.mockClear();
    act(() =>
      result.current.moveBy((v) => ({ ...v, center: { x: 10, y: 0 } })),
    );
    expect(onViewportChange).toHaveBeenLastCalledWith(
      { center: { x: 10, y: 0 }, zoom: 1 },
      { settled: false },
    );
    expect(apply).not.toHaveBeenCalled();
    const next = { center: { x: 10, y: 0 }, zoom: 1 };
    rerender({ ...initialProps, viewport: next });
    expect(apply).toHaveBeenLastCalledWith(next);
  });

  it("clamps gestures with expanding bounds", () => {
    const bounds = { min: { x: 0, y: 0 }, max: { x: 100, y: 100 } };
    const outside = { center: { x: 5000, y: 50 }, zoom: 1 };
    const { result, apply } = setup({ bounds, defaultViewport: outside });
    act(() =>
      result.current.moveBy((v) => ({ ...v, center: { x: 6000, y: 50 } })),
    );
    expect(apply).toHaveBeenLastCalledWith(outside);
    act(() =>
      result.current.moveBy((v) => ({ ...v, center: { x: 4000, y: 50 } })),
    );
    expect(apply).toHaveBeenLastCalledWith({
      center: { x: 4000, y: 50 },
      zoom: 1,
    });
  });

  it("jumps instantly for a zero duration, clamped to the configured limits", () => {
    const { result, onViewportChange } = setup({
      defaultViewport: start,
      maxZoom: 4,
    });
    act(() =>
      result.current.animateTo({ center: { x: 5, y: 5 }, zoom: 10 }, 0),
    );
    expect(onViewportChange).toHaveBeenLastCalledWith(
      { center: { x: 5, y: 5 }, zoom: 4 },
      { settled: true },
    );
  });

  it("animates over the duration and settles at the target", () => {
    const { result, apply, onViewportChange } = setup({
      defaultViewport: start,
    });
    const target = { center: { x: 100, y: 0 }, zoom: 1 };
    act(() => result.current.animateTo(target, 1000));
    act(() => vi.advanceTimersByTime(500));
    const middle = apply.mock.lastCall![0] as IViewport;
    expect(middle.center.x).toBeGreaterThan(0);
    expect(middle.center.x).toBeLessThan(100);
    act(() => vi.advanceTimersByTime(600));
    expect(onViewportChange).toHaveBeenLastCalledWith(target, {
      settled: true,
    });
  });

  it("jumps instantly when the user prefers reduced motion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const { result, onViewportChange } = setup({ defaultViewport: start });
    const target = { center: { x: 100, y: 0 }, zoom: 1 };
    act(() => result.current.animateTo(target, 1000));
    expect(onViewportChange).toHaveBeenLastCalledWith(target, {
      settled: true,
    });
  });

  it("stops an animation when cancelled", () => {
    const { result, onViewportChange } = setup({ defaultViewport: start });
    act(() =>
      result.current.animateTo({ center: { x: 100, y: 0 }, zoom: 1 }, 1000),
    );
    act(() => vi.advanceTimersByTime(200));
    act(() => result.current.cancelAnimation());
    const calls = onViewportChange.mock.calls.length;
    act(() => vi.advanceTimersByTime(1000));
    expect(onViewportChange.mock.calls.length).toBe(calls);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/canvas/useViewport.test.ts`
Expected: FAIL, with an error that `./useViewport` cannot be resolved.

- [ ] **Step 3: Implement the hook**

Create `src/canvas/useViewport.ts`:

```ts
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DEFAULT_ZOOM, PUBLISH_INTERVAL_MS } from "./constants";
import {
  clampViewport,
  easeInOut,
  fitViewport,
  type ILimits,
  interpolateViewport,
} from "./projection";
import type { ISize, IViewport, YAxis } from "./types";

/** Extra information passed with every viewport change. */
export interface IViewportChangeInfo {
  /** True once when a gesture, key press, or camera move ends. */
  settled: boolean;
}

export interface IUseViewportOptions extends ILimits {
  viewport?: IViewport;
  defaultViewport?: IViewport;
  onViewportChange?: (viewport: IViewport, info: IViewportChangeInfo) => void;
  size: ISize;
  yAxis: YAxis;
  /** Writes a viewport to the DOM. Called on every frame the camera moves. */
  apply: (viewport: IViewport) => void;
}

export interface IViewportController {
  /** The live camera: the viewport most recently applied, or emitted in controlled mode. */
  getViewport(): IViewport;
  /** Moves the camera for a user gesture, clamped with expanding bounds. */
  moveBy(update: (current: IViewport) => IViewport): void;
  /** Marks the end of a gesture: emits a settled change and publishes immediately. */
  settle(): void;
  /** Moves to a target clamped to the configured limits, animated when `durationMs` is above 0. */
  animateTo(target: IViewport, durationMs: number): void;
  cancelAnimation(): void;
  /** The viewport published to children: at most every PUBLISH_INTERVAL_MS, and on settle. */
  published: IViewport;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Owns the camera. The live viewport is kept in a ref and written to the DOM
 * through `apply` on every frame, without rendering React. Children receive a
 * throttled copy, `published`.
 */
export function useViewport(options: IUseViewportOptions): IViewportController {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const initial = options.viewport ??
    options.defaultViewport ?? { center: { x: 0, y: 0 }, zoom: DEFAULT_ZOOM };
  const currentRef = useRef<IViewport>(initial);
  const positionedRef = useRef(
    options.viewport !== undefined || options.defaultViewport !== undefined,
  );
  const [published, setPublished] = useState<IViewport>(initial);
  const lastPublishRef = useRef(0);
  const publishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationRef = useRef<number | null>(null);

  const publishNow = useCallback(() => {
    if (publishTimerRef.current !== null) {
      clearTimeout(publishTimerRef.current);
      publishTimerRef.current = null;
    }
    lastPublishRef.current = Date.now();
    setPublished(currentRef.current);
  }, []);

  const schedulePublish = useCallback(() => {
    const wait = PUBLISH_INTERVAL_MS - (Date.now() - lastPublishRef.current);
    if (wait <= 0) publishNow();
    else if (publishTimerRef.current === null)
      publishTimerRef.current = setTimeout(publishNow, wait);
  }, [publishNow]);

  const commit = useCallback(
    (next: IViewport, settled: boolean) => {
      currentRef.current = next;
      if (optionsRef.current.viewport === undefined)
        optionsRef.current.apply(next);
      optionsRef.current.onViewportChange?.(next, { settled });
      if (settled) publishNow();
      else schedulePublish();
    },
    [publishNow, schedulePublish],
  );

  // Controlled mode: the prop is the camera.
  useLayoutEffect(() => {
    if (options.viewport === undefined) return;
    currentRef.current = options.viewport;
    optionsRef.current.apply(options.viewport);
    schedulePublish();
  }, [options.viewport, schedulePublish]);

  // Apply on mount and resize. The first time there is a size and bounds but no
  // viewport, fit the bounds.
  useLayoutEffect(() => {
    const { size, bounds, minZoom, maxZoom, yAxis } = optionsRef.current;
    if (size.width <= 0 || size.height <= 0) return;
    if (!positionedRef.current && bounds) {
      positionedRef.current = true;
      const fitted = fitViewport([bounds.min, bounds.max], size, {
        minZoom,
        maxZoom,
        yAxis,
      });
      if (fitted) {
        commit(fitted, true);
        return;
      }
    }
    optionsRef.current.apply(currentRef.current);
    publishNow();
  }, [
    options.size.width,
    options.size.height,
    options.bounds,
    commit,
    publishNow,
  ]);

  const moveBy = useCallback(
    (update: (current: IViewport) => IViewport) => {
      const { bounds, minZoom, maxZoom, size } = optionsRef.current;
      const current = currentRef.current;
      commit(
        clampViewport(
          update(current),
          { bounds, minZoom, maxZoom },
          size,
          current,
        ),
        false,
      );
    },
    [commit],
  );

  const settle = useCallback(() => commit(currentRef.current, true), [commit]);

  const cancelAnimation = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const animateTo = useCallback(
    (target: IViewport, durationMs: number) => {
      cancelAnimation();
      const { bounds, minZoom, maxZoom, size } = optionsRef.current;
      const to = clampViewport(target, { bounds, minZoom, maxZoom }, size);
      const from = currentRef.current;
      if (durationMs <= 0 || prefersReducedMotion()) {
        commit(to, true);
        return;
      }
      const startTime = performance.now();
      // Read the clock directly rather than trusting the frame timestamp's time origin.
      const step = () => {
        const t = Math.min(1, (performance.now() - startTime) / durationMs);
        const done = t >= 1;
        commit(done ? to : interpolateViewport(from, to, easeInOut(t)), done);
        animationRef.current = done ? null : requestAnimationFrame(step);
      };
      animationRef.current = requestAnimationFrame(step);
    },
    [cancelAnimation, commit],
  );

  useEffect(
    () => () => {
      cancelAnimation();
      if (publishTimerRef.current !== null)
        clearTimeout(publishTimerRef.current);
    },
    [cancelAnimation],
  );

  return useMemo(
    () => ({
      getViewport: () => currentRef.current,
      moveBy,
      settle,
      animateTo,
      cancelAnimation,
      published,
    }),
    [moveBy, settle, animateTo, cancelAnimation, published],
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/canvas/useViewport.test.ts && npm run typecheck`
Expected: PASS, typecheck exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/canvas/useViewport.ts src/canvas/useViewport.test.ts
git commit -m "feat(canvas): add viewport controller hook"
```

---

### Task 4: Canvas component

**Files:**

- Create: `src/canvas/CanvasContext.ts`, `src/canvas/screenSpace.ts`, `src/canvas/Canvas.module.css`, `src/canvas/Canvas.tsx`
- Test: `src/canvas/Canvas.test.tsx`

**Interfaces:**

- Consumes: Tasks 1 to 3.
- Produces:

```ts
export interface ICanvasContext {
  viewport: IViewport;
  size: ISize;
  yAxis: YAxis;
  gesturing: boolean;
  worldToScreen(point: IPoint): IPoint;
  screenToWorld(point: IPoint): IPoint;
}
export function useCanvas(): ICanvasContext;
export const screenSpaceClassName: string; // styles.screenSpace from Canvas.module.css
export interface ICanvasHandle {
  moveTo(
    target: { center?: IPoint; zoom?: number },
    options?: { duration?: number },
  ): void;
  fitPoints(
    points: IPoint[],
    options?: { padding?: number | IPadding; duration?: number },
  ): void;
  getViewport(): IViewport;
  getSize(): ISize;
  worldToScreen(point: IPoint): IPoint;
  screenToWorld(point: IPoint): IPoint;
}
export interface ICanvasProps extends IComponentProps {
  /* see Step 5 */
}
export function Canvas(props: ICanvasProps): JSX.Element;
```

- [ ] **Step 1: Write the failing tests**

Create `src/canvas/Canvas.test.tsx`:

```tsx
import { act, fireEvent, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockElementSize } from "../testUtils";
import { Canvas, type ICanvasHandle } from "./Canvas";
import styles from "./Canvas.module.css";
import { type ICanvasContext, useCanvas } from "./CanvasContext";

const start = { center: { x: 0, y: 0 }, zoom: 1 };

function Probe({
  onContext,
}: {
  onContext: (context: ICanvasContext) => void;
}) {
  onContext(useCanvas());
  return <rect data-testid="child" />;
}

function world(container: HTMLElement): SVGGElement {
  return container.querySelector("svg > g") as SVGGElement;
}

beforeEach(() => {
  mockElementSize(800, 600);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Canvas", () => {
  it("writes the world transform and zoom variables", () => {
    const { container } = render(<Canvas defaultViewport={start} />);
    expect(world(container).getAttribute("transform")).toBe(
      "matrix(1 0 0 1 400 300)",
    );
    expect(world(container).style.getPropertyValue("--zoom")).toBe("1");
    expect(world(container).style.getPropertyValue("--y-sign")).toBe("1");
  });

  it("flips y when world y points up", () => {
    const { container } = render(<Canvas defaultViewport={start} yAxis="up" />);
    expect(world(container).getAttribute("transform")).toBe(
      "matrix(1 0 0 -1 400 300)",
    );
    expect(world(container).style.getPropertyValue("--y-sign")).toBe("-1");
  });

  it("gives children the size, viewport, and conversions", () => {
    let context: ICanvasContext | null = null;
    const { getByTestId } = render(
      <Canvas defaultViewport={start}>
        <Probe onContext={(c) => (context = c)} />
      </Canvas>,
    );
    expect(getByTestId("child")).toBeInTheDocument();
    expect(context!.size).toEqual({ width: 800, height: 600 });
    expect(context!.viewport).toEqual(start);
    expect(context!.worldToScreen({ x: 10, y: 10 })).toEqual({
      x: 410,
      y: 310,
    });
  });

  it("fits the bounds when no viewport is given", () => {
    const onViewportChange = vi.fn();
    render(
      <Canvas
        bounds={{ min: { x: 0, y: 0 }, max: { x: 100, y: 50 } }}
        onViewportChange={onViewportChange}
      />,
    );
    expect(onViewportChange).toHaveBeenLastCalledWith(
      { center: { x: 50, y: 25 }, zoom: 8 },
      { settled: true },
    );
  });

  it("pans with arrow keys and zooms with plus", () => {
    const onViewportChange = vi.fn();
    const { container } = render(
      <Canvas defaultViewport={start} onViewportChange={onViewportChange} />,
    );
    const root = container.firstChild as HTMLElement;
    fireEvent.keyDown(root, { key: "ArrowLeft" });
    expect(onViewportChange).toHaveBeenLastCalledWith(
      { center: { x: -80, y: 0 }, zoom: 1 },
      { settled: true },
    );
    fireEvent.keyDown(root, { key: "+" });
    expect(onViewportChange.mock.lastCall![0].zoom).toBeCloseTo(1.25);
  });

  it("ignores keys that an onKeyDown handler already handled", () => {
    const onViewportChange = vi.fn();
    const { container } = render(
      <Canvas
        defaultViewport={start}
        onViewportChange={onViewportChange}
        onKeyDown={(e) => e.preventDefault()}
      />,
    );
    onViewportChange.mockClear();
    fireEvent.keyDown(container.firstChild as HTMLElement, {
      key: "ArrowLeft",
    });
    expect(onViewportChange).not.toHaveBeenCalled();
  });

  it("is a single tab stop with the given accessibility props", () => {
    const { container } = render(
      <Canvas
        role="application"
        aria-label="Map"
        aria-activedescendant="item-1"
        className="mine"
      />,
    );
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute("tabindex", "0");
    expect(root).toHaveAttribute("role", "application");
    expect(root).toHaveAttribute("aria-label", "Map");
    expect(root).toHaveAttribute("aria-activedescendant", "item-1");
    expect(root).toHaveClass(styles.root, "mine");
  });

  it("moves and fits through the imperative handle", () => {
    const ref = createRef<ICanvasHandle>();
    const onViewportChange = vi.fn();
    render(
      <Canvas
        ref={ref}
        defaultViewport={start}
        onViewportChange={onViewportChange}
      />,
    );
    act(() => ref.current!.moveTo({ center: { x: 30, y: 40 } }));
    expect(ref.current!.getViewport()).toEqual({
      center: { x: 30, y: 40 },
      zoom: 1,
    });
    act(() =>
      ref.current!.fitPoints([
        { x: 0, y: 0 },
        { x: 100, y: 50 },
      ]),
    );
    expect(onViewportChange).toHaveBeenLastCalledWith(
      { center: { x: 50, y: 25 }, zoom: 8 },
      { settled: true },
    );
    expect(ref.current!.getSize()).toEqual({ width: 800, height: 600 });
    expect(ref.current!.screenToWorld({ x: 400, y: 300 })).toEqual({
      x: 50,
      y: 25,
    });
  });

  it("throws when useCanvas is used outside a Canvas", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe onContext={() => {}} />)).toThrow(
      /inside a <Canvas>/,
    );
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/canvas/Canvas.test.tsx`
Expected: FAIL, with an error that `./Canvas` cannot be resolved.

- [ ] **Step 3: Create the context, screen-space class, and styles**

Create `src/canvas/CanvasContext.ts`:

```ts
import { createContext, useContext } from "react";
import type { IPoint, ISize, IViewport, YAxis } from "./types";

/** What content inside a Canvas can read. */
export interface ICanvasContext {
  /** The published viewport: throttled during movement, exact when settled. */
  viewport: IViewport;
  size: ISize;
  yAxis: YAxis;
  /** Whether a pointer gesture is in progress. */
  gesturing: boolean;
  /** Converts a world point to container pixels using the live camera. */
  worldToScreen(point: IPoint): IPoint;
  /** Converts container pixels to a world point using the live camera. */
  screenToWorld(point: IPoint): IPoint;
}

export const CanvasContext = createContext<ICanvasContext | null>(null);

/** Reads the enclosing Canvas. Throws when used outside one. */
export function useCanvas(): ICanvasContext {
  const context = useContext(CanvasContext);
  if (!context) throw new Error("useCanvas must be used inside a <Canvas>.");
  return context;
}
```

Create `src/canvas/screenSpace.ts`:

```ts
import styles from "./Canvas.module.css";

/**
 * Counter-scales an element inside a Canvas so its content is drawn at a fixed
 * screen size, with y pointing down. Put it on a group inside another group
 * translated to a world point. The value is the hashed CSS module class name.
 */
export const screenSpaceClassName: string = styles.screenSpace;
```

Create `src/canvas/Canvas.module.css`:

```css
.root {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  touch-action: none;
  overscroll-behavior: contain;
}

.svg {
  display: block;
  width: 100%;
  height: 100%;
}

/* The world group scales by the zoom. This undoes it, and the y-flip, for
   content that must stay a fixed screen size. See ADR-0002. */
.screenSpace {
  transform: scale(calc(1 / var(--zoom)), calc(var(--y-sign) / var(--zoom)));
}
```

- [ ] **Step 4: Create the Canvas component**

Create `src/canvas/Canvas.tsx`:

```tsx
import { type IComponentProps, lib } from "@outoforbitdev/ood-react";
import {
  type KeyboardEvent,
  type Ref,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./Canvas.module.css";
import { CanvasContext, type ICanvasContext } from "./CanvasContext";
import { keyAction, panByPixels, zoomAtPoint } from "./gestures";
import {
  fitViewport,
  screenToWorld,
  worldToScreen,
  worldTransform,
  ySign,
} from "./projection";
import type {
  IBounds,
  IPadding,
  IPoint,
  ISize,
  IViewport,
  YAxis,
} from "./types";
import { type IViewportChangeInfo, useViewport } from "./useViewport";

/** Camera controls exposed through a Canvas ref. */
export interface ICanvasHandle {
  /** Pans, zooms, or both. Animates when `duration` (ms) is above 0. */
  moveTo(
    target: { center?: IPoint; zoom?: number },
    options?: { duration?: number },
  ): void;
  /** Moves so every point is visible inside the padding. */
  fitPoints(
    points: IPoint[],
    options?: { padding?: number | IPadding; duration?: number },
  ): void;
  getViewport(): IViewport;
  getSize(): ISize;
  worldToScreen(point: IPoint): IPoint;
  screenToWorld(point: IPoint): IPoint;
}

export interface ICanvasProps extends IComponentProps {
  viewport?: IViewport;
  defaultViewport?: IViewport;
  onViewportChange?: (viewport: IViewport, info: IViewportChangeInfo) => void;
  /** The content area. The view center may move up to half a view beyond it. */
  bounds?: IBounds;
  minZoom?: number;
  maxZoom?: number;
  /** Direction of positive world y. Defaults to "down". */
  yAxis?: YAxis;
  /** Runs before the canvas's own keys. Keys it handles with preventDefault are ignored. */
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  role?: string;
  "aria-label"?: string;
  "aria-roledescription"?: string;
  "aria-activedescendant"?: string;
  ref?: Ref<ICanvasHandle>;
}

/**
 * A generic pan and zoom surface. Children are drawn in world coordinates.
 * Camera movement writes one transform per frame without rendering React.
 */
export function Canvas(props: ICanvasProps) {
  const yAxis = props.yAxis ?? "down";
  const rootRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<SVGGElement>(null);
  const [size, setSize] = useState<ISize>({ width: 0, height: 0 });
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const [gesturing, setGesturing] = useState(false);

  useLayoutEffect(() => {
    const element = rootRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize((previous) =>
        previous.width === width && previous.height === height
          ? previous
          : { width, height },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const apply = (viewport: IViewport) => {
    const element = worldRef.current;
    const current = sizeRef.current;
    if (!element || current.width <= 0 || current.height <= 0) return;
    element.setAttribute("transform", worldTransform(viewport, current, yAxis));
    element.style.setProperty("--zoom", String(viewport.zoom));
    element.style.setProperty("--y-sign", String(ySign(yAxis)));
  };

  const camera = useViewport({
    viewport: props.viewport,
    defaultViewport: props.defaultViewport,
    onViewportChange: props.onViewportChange,
    bounds: props.bounds,
    minZoom: props.minZoom,
    maxZoom: props.maxZoom,
    size,
    yAxis,
    apply,
  });

  const toScreen = (point: IPoint) =>
    worldToScreen(point, camera.getViewport(), sizeRef.current, yAxis);
  const toWorld = (point: IPoint) =>
    screenToWorld(point, camera.getViewport(), sizeRef.current, yAxis);

  useImperativeHandle(
    props.ref,
    () => ({
      moveTo(target, options) {
        const current = camera.getViewport();
        camera.animateTo(
          {
            center: target.center ?? current.center,
            zoom: target.zoom ?? current.zoom,
          },
          options?.duration ?? 0,
        );
      },
      fitPoints(points, options) {
        const fitted = fitViewport(points, sizeRef.current, {
          padding: options?.padding,
          bounds: props.bounds,
          minZoom: props.minZoom,
          maxZoom: props.maxZoom,
          yAxis,
        });
        if (fitted) camera.animateTo(fitted, options?.duration ?? 0);
      },
      getViewport: () => camera.getViewport(),
      getSize: () => sizeRef.current,
      worldToScreen: toScreen,
      screenToWorld: toWorld,
    }),
    [camera, props.bounds, props.minZoom, props.maxZoom, yAxis],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    props.onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const current = sizeRef.current;
    const action = keyAction(event.key, current);
    if (!action) return;
    event.preventDefault();
    camera.cancelAnimation();
    camera.moveBy((viewport) =>
      action.type === "pan"
        ? panByPixels(viewport, action.dx, action.dy, yAxis)
        : zoomAtPoint(
            viewport,
            current,
            { x: current.width / 2, y: current.height / 2 },
            action.factor,
            yAxis,
          ),
    );
    camera.settle();
  };

  const context = useMemo<ICanvasContext>(
    () => ({
      viewport: camera.published,
      size,
      yAxis,
      gesturing,
      worldToScreen: toScreen,
      screenToWorld: toWorld,
    }),
    // toScreen and toWorld read the live camera through refs, so they need not be dependencies.
    [camera, size, yAxis, gesturing],
  );

  return (
    <div
      {...lib.getDomProps(props, styles.root)}
      ref={rootRef}
      tabIndex={0}
      role={props.role}
      aria-label={props["aria-label"]}
      aria-roledescription={props["aria-roledescription"]}
      aria-activedescendant={props["aria-activedescendant"]}
      onKeyDown={handleKeyDown}
    >
      <svg className={styles.svg}>
        <g ref={worldRef}>
          {size.width > 0 && size.height > 0 && (
            <CanvasContext.Provider value={context}>
              {props.children}
            </CanvasContext.Provider>
          )}
        </g>
      </svg>
    </div>
  );
}
```

`setGesturing` is used in Task 5.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/canvas && npm run typecheck`
Expected: PASS, typecheck exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/canvas
git commit -m "feat(canvas): add Canvas component with keyboard and camera handle"
```

---

### Task 5: Canvas pointer and wheel gestures

**Files:**

- Create: `src/canvas/useGestures.ts`
- Modify: `src/canvas/Canvas.tsx`
- Test: `src/canvas/Canvas.gestures.test.tsx`

**Interfaces:**

- Consumes: `IViewportController` (Task 3), gesture math (Task 2).
- Produces: `useGestures(options): IGestureHandlers`, where the handlers are `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel`, and `onClickCapture`. It also attaches a non-passive wheel listener to `rootRef`.

- [ ] **Step 1: Write the failing tests**

Create `src/canvas/Canvas.gestures.test.tsx`:

```tsx
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockElementSize } from "../testUtils";
import { Canvas } from "./Canvas";

const start = { center: { x: 0, y: 0 }, zoom: 1 };

function setup(props: Partial<Parameters<typeof Canvas>[0]> = {}) {
  const onViewportChange = vi.fn();
  const onTargetClick = vi.fn();
  const onRootClick = vi.fn();
  const utils = render(
    <Canvas
      defaultViewport={start}
      onViewportChange={onViewportChange}
      onClick={onRootClick}
      {...props}
    >
      <rect
        data-testid="target"
        width={10}
        height={10}
        onClick={onTargetClick}
      />
    </Canvas>,
  );
  const root = utils.container.firstChild as HTMLElement;
  const target = utils.getByTestId("target");
  return {
    ...utils,
    root,
    target,
    onViewportChange,
    onTargetClick,
    onRootClick,
  };
}

function drag(
  element: Element,
  from: [number, number],
  to: [number, number],
  pointerType = "mouse",
) {
  fireEvent.pointerDown(element, {
    pointerId: 1,
    pointerType,
    clientX: from[0],
    clientY: from[1],
  });
  fireEvent.pointerMove(element, {
    pointerId: 1,
    pointerType,
    clientX: to[0],
    clientY: to[1],
  });
  fireEvent.pointerUp(element, {
    pointerId: 1,
    pointerType,
    clientX: to[0],
    clientY: to[1],
  });
}

beforeEach(() => {
  mockElementSize(800, 600);
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Canvas gestures", () => {
  it("pans when a drag passes the threshold", () => {
    const { target, onViewportChange } = setup();
    drag(target, [100, 100], [150, 100]);
    expect(onViewportChange).toHaveBeenLastCalledWith(
      { center: { x: -50, y: 0 }, zoom: 1 },
      { settled: true },
    );
  });

  it("does not pan for movement under the threshold, and the click goes through", () => {
    const { target, onViewportChange, onTargetClick } = setup();
    onViewportChange.mockClear();
    drag(target, [100, 100], [102, 100]);
    fireEvent.click(target);
    expect(onViewportChange).not.toHaveBeenCalled();
    expect(onTargetClick).toHaveBeenCalledTimes(1);
  });

  it("cancels the click that follows a pan", () => {
    const { target, onTargetClick, onRootClick } = setup();
    drag(target, [100, 100], [150, 100]);
    fireEvent.click(target);
    expect(onTargetClick).not.toHaveBeenCalled();
    expect(onRootClick).not.toHaveBeenCalled();
  });

  it("stops suppressing clicks at the next press", () => {
    const { target, onTargetClick } = setup();
    drag(target, [100, 100], [150, 100]);
    fireEvent.pointerDown(target, {
      pointerId: 1,
      pointerType: "mouse",
      clientX: 10,
      clientY: 10,
    });
    fireEvent.pointerUp(target, {
      pointerId: 1,
      pointerType: "mouse",
      clientX: 10,
      clientY: 10,
    });
    fireEvent.click(target);
    expect(onTargetClick).toHaveBeenCalledTimes(1);
  });

  it("zooms around the pointer on wheel, prevents page scroll, and settles later", () => {
    const { root, onViewportChange } = setup();
    const notPrevented = fireEvent.wheel(root, {
      deltaY: -100,
      deltaMode: 0,
      clientX: 400,
      clientY: 300,
    });
    expect(notPrevented).toBe(false);
    const [viewport, info] = onViewportChange.mock.lastCall!;
    expect(viewport.zoom).toBeCloseTo(Math.exp(0.2));
    expect(info).toEqual({ settled: false });
    act(() => vi.advanceTimersByTime(150));
    expect(onViewportChange.mock.lastCall![1]).toEqual({ settled: true });
  });

  it("pinch zooms with two touch pointers", () => {
    const { target, onViewportChange } = setup();
    fireEvent.pointerDown(target, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 300,
      clientY: 300,
    });
    fireEvent.pointerDown(target, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 500,
      clientY: 300,
    });
    fireEvent.pointerMove(target, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 700,
      clientY: 300,
    });
    fireEvent.pointerUp(target, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 700,
      clientY: 300,
    });
    fireEvent.pointerUp(target, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 300,
      clientY: 300,
    });
    expect(onViewportChange.mock.lastCall![0].zoom).toBeCloseTo(2);
    expect(onViewportChange.mock.lastCall![1]).toEqual({ settled: true });
  });

  it("does not move a controlled camera whose parent ignores changes", () => {
    const { target, container, onViewportChange } = setup({
      viewport: start,
      defaultViewport: undefined,
    });
    drag(target, [100, 100], [150, 100]);
    expect(onViewportChange).toHaveBeenCalled();
    const worldGroup = container.querySelector("svg > g")!;
    expect(worldGroup.getAttribute("transform")).toBe(
      "matrix(1 0 0 1 400 300)",
    );
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/canvas/Canvas.gestures.test.tsx`
Expected: FAIL. The drag and wheel tests fail because `onViewportChange` is never called with the expected values.

- [ ] **Step 3: Implement the gesture hook**

Create `src/canvas/useGestures.ts`:

```ts
import {
  type MouseEvent,
  type PointerEvent,
  type RefObject,
  useEffect,
  useRef,
} from "react";
import { WHEEL_SETTLE_MS } from "./constants";
import {
  exceedsDragThreshold,
  panByPixels,
  pinchUpdate,
  wheelZoomFactor,
  zoomAtPoint,
} from "./gestures";
import type { IPoint, ISize, YAxis } from "./types";
import type { IViewportController } from "./useViewport";

export interface IGestureOptions {
  rootRef: RefObject<HTMLDivElement | null>;
  camera: IViewportController;
  sizeRef: { current: ISize };
  yAxis: YAxis;
  setGesturing: (gesturing: boolean) => void;
}

export interface IGestureHandlers {
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLDivElement>) => void;
  onClickCapture: (event: MouseEvent<HTMLDivElement>) => void;
}

/**
 * Drag to pan, pinch to zoom, wheel to zoom around the pointer. A press only
 * becomes a pan past the drag threshold, and the click after a pan is
 * cancelled before any child sees it.
 */
export function useGestures(options: IGestureOptions): IGestureHandlers {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const pointers = useRef(new Map<number, IPoint>());
  const pressStart = useRef<IPoint | null>(null);
  const panning = useRef(false);
  const suppressClick = useRef(false);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toLocal = (event: { clientX: number; clientY: number }): IPoint => {
    const rect = optionsRef.current.rootRef.current?.getBoundingClientRect();
    return {
      x: event.clientX - (rect?.left ?? 0),
      y: event.clientY - (rect?.top ?? 0),
    };
  };

  const beginPan = (event: PointerEvent<HTMLDivElement>) => {
    panning.current = true;
    optionsRef.current.setGesturing(true);
    // Capture only once panning, so a plain click still targets the element under the pointer.
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    suppressClick.current = false;
    optionsRef.current.camera.cancelAnimation();
    const point = toLocal(event);
    pointers.current.set(event.pointerId, point);
    if (pointers.current.size === 1) pressStart.current = point;
    else if (!panning.current) beginPan(event);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const point = toLocal(event);
    const { camera, sizeRef, yAxis } = optionsRef.current;

    if (pointers.current.size >= 2) {
      const [first, second] = Array.from(pointers.current.keys());
      const before: [IPoint, IPoint] = [
        pointers.current.get(first)!,
        pointers.current.get(second)!,
      ];
      pointers.current.set(event.pointerId, point);
      const after: [IPoint, IPoint] = [
        pointers.current.get(first)!,
        pointers.current.get(second)!,
      ];
      camera.moveBy((viewport) =>
        pinchUpdate(before, after, viewport, sizeRef.current, yAxis),
      );
      return;
    }

    pointers.current.set(event.pointerId, point);
    const start = pressStart.current;
    if (!panning.current) {
      if (!start || !exceedsDragThreshold(start, point, event.pointerType))
        return;
      beginPan(event);
      camera.moveBy((viewport) =>
        panByPixels(viewport, point.x - start.x, point.y - start.y, yAxis),
      );
      return;
    }
    camera.moveBy((viewport) =>
      panByPixels(viewport, point.x - previous.x, point.y - previous.y, yAxis),
    );
  };

  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size > 0) {
      // One finger of a pinch lifted: keep panning with the remaining finger.
      pressStart.current = Array.from(pointers.current.values())[0];
      return;
    }
    pressStart.current = null;
    if (panning.current) {
      panning.current = false;
      suppressClick.current = true;
      optionsRef.current.setGesturing(false);
      optionsRef.current.camera.settle();
    }
  };

  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  useEffect(() => {
    const root = options.rootRef.current;
    if (!root) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const { camera, sizeRef, yAxis } = optionsRef.current;
      camera.cancelAnimation();
      const point = toLocal(event);
      const factor = wheelZoomFactor(
        event.deltaY,
        event.deltaMode,
        event.ctrlKey,
      );
      camera.moveBy((viewport) =>
        zoomAtPoint(viewport, sizeRef.current, point, factor, yAxis),
      );
      if (wheelTimer.current !== null) clearTimeout(wheelTimer.current);
      wheelTimer.current = setTimeout(() => {
        wheelTimer.current = null;
        optionsRef.current.camera.settle();
      }, WHEEL_SETTLE_MS);
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      root.removeEventListener("wheel", onWheel);
      if (wheelTimer.current !== null) clearTimeout(wheelTimer.current);
    };
    // toLocal reads through optionsRef, so the listener never goes stale.
  }, [options.rootRef]);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: onPointerEnd,
    onPointerCancel: onPointerEnd,
    onClickCapture,
  };
}
```

- [ ] **Step 4: Wire the gestures into Canvas**

In `src/canvas/Canvas.tsx`, add the import:

```ts
import { useGestures } from "./useGestures";
```

After the `useImperativeHandle(...)` call, add:

```ts
const gestures = useGestures({ rootRef, camera, sizeRef, yAxis, setGesturing });
```

In the returned `<div>`, add `{...gestures}` after `onKeyDown={handleKeyDown}`:

```tsx
      onKeyDown={handleKeyDown}
      {...gestures}
    >
```

Remove the line `` `setGesturing` is used in Task 5. `` if you copied it into the file as a comment.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/canvas && npm run typecheck`
Expected: PASS, typecheck exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/canvas
git commit -m "feat(canvas): add drag, pinch, and wheel gestures"
```

---

### Task 6: Map types, constants, and spatial index

**Files:**

- Create: `src/map/types.ts`, `src/map/constants.ts`, `src/map/spatialIndex.ts`
- Test: `src/map/spatialIndex.test.ts`

**Interfaces:**

- Consumes: canvas types.
- Produces: `ISystem<TData>`, `ILaneSegment`, `ISpacelane<TData>`, `EntityKind`, `IEntityRef`, `MapEntityEvent<TS, TL>`; map constants; `IGridIndex`, `buildSystemIndex(systems)`, `buildLaneIndex(lanes)`, `queryIndex(index, rect): number[]`, `systemGeometryChanged(previous, next)`, `laneGeometryChanged(previous, next)`, `dataBounds(systems, lanes): IBounds | null`, `isFinitePoint(point)`, `isFiniteSegment(segment)`.

- [ ] **Step 1: Create the types and constants**

Create `src/map/types.ts`:

```ts
import type { IPoint } from "../canvas/types";

export type {
  IBounds,
  IPadding,
  IPoint,
  ISize,
  IViewport,
} from "../canvas/types";

/** A star system. Array order in `systems` is priority, highest first. */
export interface ISystem<TData = unknown> {
  /** Unique among systems. */
  id: string;
  /** The label, when shown, and always the accessible name. */
  name: string;
  /** World coordinates, with positive y up. */
  position: IPoint;
  /** Any valid CSS color, used as the glyph fill. */
  color: string;
  /** Optional class on the system's group, for styling beyond color. */
  className?: string;
  /** Consumer data, returned in events and overlay rendering. Never read by the map. */
  data?: TData;
}

/** One straight piece of a spacelane. */
export interface ILaneSegment {
  /** Unique among segments. */
  id: string;
  origin: IPoint;
  destination: IPoint;
  /** Any valid CSS color, used as the stroke. */
  color: string;
}

/** A spacelane. Array order in `spacelanes` is priority, highest first. */
export interface ISpacelane<TData = unknown> {
  /** Unique among spacelanes. May equal a system id. */
  id: string;
  name: string;
  segments: ILaneSegment[];
  className?: string;
  data?: TData;
}

export type EntityKind = "system" | "lane";

/** Identifies a system or lane. */
export interface IEntityRef {
  kind: EntityKind;
  id: string;
}

/** Passed to onSelect and onHover. Narrow on `kind` for a typed entity. */
export type MapEntityEvent<TSystemData = unknown, TLaneData = unknown> =
  | { kind: "system"; id: string; system: ISystem<TSystemData> }
  | {
      kind: "lane";
      id: string;
      lane: ISpacelane<TLaneData>;
      segmentId: string;
    };
```

Create `src/map/constants.ts`:

```ts
import type { YAxis } from "../canvas/types";

/** GalaxyMap world coordinates use positive y for up. */
export const MAP_Y_AXIS: YAxis = "up";

/** Extra area culled on each side of the view, as a fraction of the view. */
export const CULL_MARGIN = 0.1;

/** Default for `maxSystems`. */
export const DEFAULT_MAX_SYSTEMS = 500;

/** Default for `maxLabels`. */
export const DEFAULT_MAX_LABELS = 100;

/** Default for `maxLaneSegments`. */
export const DEFAULT_MAX_LANE_SEGMENTS = 600;

/** Drawn glyph radius in pixels. Also the glyph's collision size in culling. */
export const GLYPH_RADIUS_PX = 4;

/** Minimum gap between placed glyphs, in pixels. Starting value. */
export const GLYPH_SPACING_PX = 4;

/** Horizontal distance from the system center to its label, in pixels. */
export const LABEL_OFFSET_PX = 8;

/** Label box height used for collisions, in pixels. */
export const LABEL_HEIGHT_PX = 14;

/** Estimated character width when text cannot be measured (tests, server). */
export const FALLBACK_CHAR_WIDTH_PX = 7;

/** Radius of a system's click and tap target, in pixels. */
export const SYSTEM_HIT_RADIUS_PX = 12;

/** Width of a lane's click and tap target, in pixels. */
export const LANE_HIT_WIDTH_PX = 12;

/** Width of a lane's selection halo and hover highlight, in pixels. */
export const LANE_HALO_WIDTH_PX = 8;

/** Gap between a glyph and its selection ring, in pixels. */
export const SELECTION_RING_GAP_PX = 3;

/** Gap between a glyph and its hover or focus ring, in pixels. */
export const HIGHLIGHT_RING_GAP_PX = 3;

/** Size of the screen-space buckets used for collision lookups, in pixels. */
export const COLLISION_CELL_PX = 64;

/** Spatial index cells along the larger side of the data's extent. */
export const INDEX_CELLS_PER_AXIS = 64;

/** Half the size, in world units, of the default bounds when there is no data. Starting value. */
export const EMPTY_BOUNDS_HALF_SIZE = 100;

/** Largest gap, in world units, reported as segments that almost join. Starting value. */
export const SEGMENT_JOIN_TOLERANCE = 0.001;
```

- [ ] **Step 2: Write the failing spatial index tests**

Create `src/map/spatialIndex.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  buildLaneIndex,
  buildSystemIndex,
  dataBounds,
  laneGeometryChanged,
  queryIndex,
  systemGeometryChanged,
} from "./spatialIndex";
import type { ISpacelane, ISystem } from "./types";

const system = (id: string, x: number, y: number, color = "red"): ISystem => ({
  id,
  name: id,
  position: { x, y },
  color,
});

const lane = (
  id: string,
  points: [number, number][],
  color = "blue",
): ISpacelane => ({
  id,
  name: id,
  segments: points.slice(1).map((point, i) => ({
    id: `${id}-${i}`,
    origin: { x: points[i][0], y: points[i][1] },
    destination: { x: point[0], y: point[1] },
    color,
  })),
});

const rect = (x0: number, y0: number, x1: number, y1: number) => ({
  min: { x: x0, y: y0 },
  max: { x: x1, y: y1 },
});

describe("system index", () => {
  const systems = [
    system("a", 0, 0),
    system("b", 1000, 1000),
    system("c", 10, 10),
    system("bad", NaN, 0),
  ];

  it("returns systems near the query area in priority order", () => {
    const found = queryIndex(buildSystemIndex(systems), rect(-5, -5, 20, 20));
    expect(found).toEqual([0, 2]);
  });

  it("skips systems with non-finite positions", () => {
    const found = queryIndex(
      buildSystemIndex(systems),
      rect(-1e9, -1e9, 1e9, 1e9),
    );
    expect(found).not.toContain(3);
  });

  it("returns nothing for empty data", () => {
    expect(queryIndex(buildSystemIndex([]), rect(-1, -1, 1, 1))).toEqual([]);
  });
});

describe("lane index", () => {
  it("finds a lane whose segment crosses the area even when its ends are outside", () => {
    const lanes = [
      lane("long", [
        [-1000, 0],
        [1000, 0],
      ]),
      lane("far", [
        [5000, 5000],
        [6000, 5000],
      ]),
    ];
    expect(queryIndex(buildLaneIndex(lanes), rect(-10, -10, 10, 10))).toEqual([
      0,
    ]);
  });
});

describe("geometry change detection", () => {
  it("ignores color, name, and data changes", () => {
    const before = [system("a", 0, 0, "red")];
    const after = [{ ...system("a", 0, 0, "green"), name: "Renamed", data: 1 }];
    expect(systemGeometryChanged(before, after)).toBe(false);
  });

  it("detects moves, reorders, additions, and removals", () => {
    const before = [system("a", 0, 0), system("b", 5, 5)];
    expect(
      systemGeometryChanged(before, [system("a", 1, 0), system("b", 5, 5)]),
    ).toBe(true);
    expect(
      systemGeometryChanged(before, [system("b", 5, 5), system("a", 0, 0)]),
    ).toBe(true);
    expect(systemGeometryChanged(before, [system("a", 0, 0)])).toBe(true);
    expect(systemGeometryChanged(null, before)).toBe(true);
  });

  it("ignores lane color changes but detects a new lane at the front", () => {
    const before = [
      lane(
        "x",
        [
          [0, 0],
          [1, 1],
        ],
        "blue",
      ),
    ];
    expect(
      laneGeometryChanged(before, [
        lane(
          "x",
          [
            [0, 0],
            [1, 1],
          ],
          "red",
        ),
      ]),
    ).toBe(false);
    expect(
      laneGeometryChanged(before, [
        lane("route", [
          [0, 0],
          [2, 2],
        ]),
        ...before,
      ]),
    ).toBe(true);
  });
});

describe("dataBounds", () => {
  it("covers every finite system position and lane point", () => {
    const bounds = dataBounds(
      [system("a", -10, 5), system("bad", Infinity, 0)],
      [
        lane("x", [
          [0, -20],
          [30, 0],
        ]),
      ],
    );
    expect(bounds).toEqual(rect(-10, -20, 30, 5));
  });

  it("returns null for no data", () => {
    expect(dataBounds([], [])).toBeNull();
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run src/map/spatialIndex.test.ts`
Expected: FAIL, with an error that `./spatialIndex` cannot be resolved.

- [ ] **Step 4: Implement the spatial index**

Create `src/map/spatialIndex.ts`:

```ts
import { INDEX_CELLS_PER_AXIS } from "./constants";
import type {
  IBounds,
  ILaneSegment,
  IPoint,
  ISpacelane,
  ISystem,
} from "./types";

/**
 * A uniform grid over world space. Each cell lists the array indexes of the
 * items that touch it. Indexes are priorities, so query results sort by priority.
 */
export interface IGridIndex {
  cellSize: number;
  minCellX: number;
  minCellY: number;
  maxCellX: number;
  maxCellY: number;
  cells: Map<string, number[]>;
}

export function isFinitePoint(point: IPoint): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

export function isFiniteSegment(segment: ILaneSegment): boolean {
  return isFinitePoint(segment.origin) && isFinitePoint(segment.destination);
}

function boundsOf(points: IPoint[]): IBounds | null {
  const finite = points.filter(isFinitePoint);
  if (finite.length === 0) return null;
  const xs = finite.map((p) => p.x);
  const ys = finite.map((p) => p.y);
  return {
    min: { x: Math.min(...xs), y: Math.min(...ys) },
    max: { x: Math.max(...xs), y: Math.max(...ys) },
  };
}

function segmentBox(segment: ILaneSegment): IBounds {
  return {
    min: {
      x: Math.min(segment.origin.x, segment.destination.x),
      y: Math.min(segment.origin.y, segment.destination.y),
    },
    max: {
      x: Math.max(segment.origin.x, segment.destination.x),
      y: Math.max(segment.origin.y, segment.destination.y),
    },
  };
}

function createIndex(extent: IBounds | null): IGridIndex {
  const span = extent
    ? Math.max(extent.max.x - extent.min.x, extent.max.y - extent.min.y)
    : 0;
  return {
    cellSize: span > 0 ? span / INDEX_CELLS_PER_AXIS : 1,
    minCellX: Infinity,
    minCellY: Infinity,
    maxCellX: -Infinity,
    maxCellY: -Infinity,
    cells: new Map(),
  };
}

function addBox(index: IGridIndex, box: IBounds, item: number): void {
  const x0 = Math.floor(box.min.x / index.cellSize);
  const x1 = Math.floor(box.max.x / index.cellSize);
  const y0 = Math.floor(box.min.y / index.cellSize);
  const y1 = Math.floor(box.max.y / index.cellSize);
  for (let cx = x0; cx <= x1; cx++) {
    for (let cy = y0; cy <= y1; cy++) {
      const key = `${cx},${cy}`;
      const list = index.cells.get(key);
      if (list) list.push(item);
      else index.cells.set(key, [item]);
    }
  }
  index.minCellX = Math.min(index.minCellX, x0);
  index.minCellY = Math.min(index.minCellY, y0);
  index.maxCellX = Math.max(index.maxCellX, x1);
  index.maxCellY = Math.max(index.maxCellY, y1);
}

/** Indexes systems by position. Systems with non-finite positions are left out. */
export function buildSystemIndex(systems: readonly ISystem[]): IGridIndex {
  const index = createIndex(boundsOf(systems.map((s) => s.position)));
  systems.forEach((system, i) => {
    if (isFinitePoint(system.position))
      addBox(index, { min: system.position, max: system.position }, i);
  });
  return index;
}

/** Indexes lanes by the bounding box of each finite segment. */
export function buildLaneIndex(lanes: readonly ISpacelane[]): IGridIndex {
  const points = lanes.flatMap((lane) =>
    lane.segments.flatMap((s) => [s.origin, s.destination]),
  );
  const index = createIndex(boundsOf(points));
  lanes.forEach((lane, i) => {
    lane.segments.forEach((segment) => {
      if (isFiniteSegment(segment)) addBox(index, segmentBox(segment), i);
    });
  });
  return index;
}

/** Array indexes of items in cells overlapping `rect`, deduplicated, in priority order. */
export function queryIndex(index: IGridIndex, rect: IBounds): number[] {
  const x0 = Math.max(index.minCellX, Math.floor(rect.min.x / index.cellSize));
  const x1 = Math.min(index.maxCellX, Math.floor(rect.max.x / index.cellSize));
  const y0 = Math.max(index.minCellY, Math.floor(rect.min.y / index.cellSize));
  const y1 = Math.min(index.maxCellY, Math.floor(rect.max.y / index.cellSize));
  const found = new Set<number>();
  for (let cx = x0; cx <= x1; cx++) {
    for (let cy = y0; cy <= y1; cy++) {
      index.cells.get(`${cx},${cy}`)?.forEach((item) => found.add(item));
    }
  }
  return Array.from(found).sort((a, b) => a - b);
}

function samePoint(a: IPoint, b: IPoint): boolean {
  return a.x === b.x && a.y === b.y;
}

/** True when ids, order, or positions differ. Color, name, class, and data are ignored. */
export function systemGeometryChanged(
  previous: readonly ISystem[] | null,
  next: readonly ISystem[],
): boolean {
  if (!previous || previous.length !== next.length) return true;
  return next.some((system, i) => {
    const before = previous[i];
    return (
      before !== system &&
      (before.id !== system.id || !samePoint(before.position, system.position))
    );
  });
}

/** True when lane ids, order, or segment points differ. Colors are ignored. */
export function laneGeometryChanged(
  previous: readonly ISpacelane[] | null,
  next: readonly ISpacelane[],
): boolean {
  if (!previous || previous.length !== next.length) return true;
  return next.some((lane, i) => {
    const before = previous[i];
    if (before === lane) return false;
    if (
      before.id !== lane.id ||
      before.segments.length !== lane.segments.length
    )
      return true;
    return lane.segments.some(
      (segment, j) =>
        !samePoint(segment.origin, before.segments[j].origin) ||
        !samePoint(segment.destination, before.segments[j].destination),
    );
  });
}

/** The bounding box of every finite system position and lane point, or null when there are none. */
export function dataBounds(
  systems: readonly ISystem[],
  lanes: readonly ISpacelane[],
): IBounds | null {
  return boundsOf([
    ...systems.map((s) => s.position),
    ...lanes.flatMap((lane) =>
      lane.segments.flatMap((s) => [s.origin, s.destination]),
    ),
  ]);
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/map/spatialIndex.test.ts && npm run typecheck`
Expected: PASS, typecheck exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/map
git commit -m "feat(map): add types, constants, and spatial index"
```

---

### Task 7: Lane geometry helpers

**Files:**

- Create: `src/map/lanePaths.ts`
- Test: `src/map/lanePaths.test.ts`

**Interfaces:**

- Consumes: `ILaneSegment`, `ISpacelane`, `isFiniteSegment` (Task 6).
- Produces: `ILaneRun { color: string; d: string }`, `laneRuns(segments): ILaneRun[]`, `laneHitPath(segments): string`, `nearestSegmentId(lane, point): string`.

- [ ] **Step 1: Write the failing tests**

Create `src/map/lanePaths.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { laneHitPath, laneRuns, nearestSegmentId } from "./lanePaths";
import type { ILaneSegment, ISpacelane } from "./types";

const seg = (
  id: string,
  from: [number, number],
  to: [number, number],
  color = "red",
): ILaneSegment => ({
  id,
  origin: { x: from[0], y: from[1] },
  destination: { x: to[0], y: to[1] },
  color,
});

describe("laneRuns", () => {
  it("joins connected segments of the same color into one path", () => {
    expect(
      laneRuns([seg("a", [0, 0], [1, 0]), seg("b", [1, 0], [2, 1])]),
    ).toEqual([{ color: "red", d: "M0 0 L1 0 L2 1" }]);
  });

  it("starts a new subpath where segments do not connect exactly", () => {
    expect(
      laneRuns([seg("a", [0, 0], [1, 0]), seg("b", [1.5, 0], [2, 0])]),
    ).toEqual([{ color: "red", d: "M0 0 L1 0 M1.5 0 L2 0" }]);
  });

  it("starts a new run when the color changes", () => {
    expect(
      laneRuns([
        seg("a", [0, 0], [1, 0], "red"),
        seg("b", [1, 0], [2, 0], "blue"),
      ]),
    ).toEqual([
      { color: "red", d: "M0 0 L1 0" },
      { color: "blue", d: "M1 0 L2 0" },
    ]);
  });

  it("skips segments with non-finite points", () => {
    expect(
      laneRuns([seg("a", [0, 0], [NaN, 0]), seg("b", [1, 0], [2, 0])]),
    ).toEqual([{ color: "red", d: "M1 0 L2 0" }]);
  });

  it("handles lanes with zero or one segment", () => {
    expect(laneRuns([])).toEqual([]);
    expect(laneRuns([seg("a", [0, 0], [1, 0])])).toEqual([
      { color: "red", d: "M0 0 L1 0" },
    ]);
  });
});

describe("laneHitPath", () => {
  it("covers every segment regardless of color", () => {
    expect(
      laneHitPath([
        seg("a", [0, 0], [1, 0], "red"),
        seg("b", [1, 0], [2, 0], "blue"),
      ]),
    ).toBe("M0 0 L1 0 L2 0");
  });

  it("is empty for a lane with no segments", () => {
    expect(laneHitPath([])).toBe("");
  });
});

describe("nearestSegmentId", () => {
  const lane: ISpacelane = {
    id: "x",
    name: "X",
    segments: [seg("a", [0, 0], [10, 0]), seg("b", [10, 0], [10, 10])],
  };

  it("returns the segment closest to the point", () => {
    expect(nearestSegmentId(lane, { x: 4, y: 1 })).toBe("a");
    expect(nearestSegmentId(lane, { x: 11, y: 8 })).toBe("b");
  });

  it("returns an empty string for a lane with no segments", () => {
    expect(nearestSegmentId({ ...lane, segments: [] }, { x: 0, y: 0 })).toBe(
      "",
    );
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/map/lanePaths.test.ts`
Expected: FAIL, with an error that `./lanePaths` cannot be resolved.

- [ ] **Step 3: Implement lane paths**

Create `src/map/lanePaths.ts`:

```ts
import { isFiniteSegment } from "./spatialIndex";
import type { ILaneSegment, IPoint, ISpacelane } from "./types";

/** Adjacent same-color segments, drawn as one SVG path. */
export interface ILaneRun {
  color: string;
  d: string;
}

function joins(previous: ILaneSegment | null, next: ILaneSegment): boolean {
  return (
    previous !== null &&
    previous.destination.x === next.origin.x &&
    previous.destination.y === next.origin.y
  );
}

/**
 * Groups adjacent segments of the same color into runs. Within a run, a
 * segment continues the path only when its origin exactly equals the previous
 * segment's destination. Otherwise it starts a new subpath.
 */
export function laneRuns(segments: readonly ILaneSegment[]): ILaneRun[] {
  const runs: ILaneRun[] = [];
  let previous: ILaneSegment | null = null;
  segments.forEach((segment) => {
    if (!isFiniteSegment(segment)) {
      previous = null;
      return;
    }
    const move = `M${segment.origin.x} ${segment.origin.y}`;
    const line = `L${segment.destination.x} ${segment.destination.y}`;
    const last = runs[runs.length - 1];
    if (last && last.color === segment.color) {
      last.d += joins(previous, segment) ? ` ${line}` : ` ${move} ${line}`;
    } else {
      runs.push({ color: segment.color, d: `${move} ${line}` });
    }
    previous = segment;
  });
  return runs;
}

/** One path covering every finite segment, used for hit-testing and highlights. */
export function laneHitPath(segments: readonly ILaneSegment[]): string {
  const parts: string[] = [];
  let previous: ILaneSegment | null = null;
  segments.forEach((segment) => {
    if (!isFiniteSegment(segment)) {
      previous = null;
      return;
    }
    if (!joins(previous, segment))
      parts.push(`M${segment.origin.x} ${segment.origin.y}`);
    parts.push(`L${segment.destination.x} ${segment.destination.y}`);
    previous = segment;
  });
  return parts.join(" ");
}

function distanceToSegment(point: IPoint, segment: ILaneSegment): number {
  const dx = segment.destination.x - segment.origin.x;
  const dy = segment.destination.y - segment.origin.y;
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            ((point.x - segment.origin.x) * dx +
              (point.y - segment.origin.y) * dy) /
              lengthSquared,
          ),
        );
  return Math.hypot(
    point.x - (segment.origin.x + t * dx),
    point.y - (segment.origin.y + t * dy),
  );
}

/** The id of the finite segment nearest a world point, or "" when the lane has none. */
export function nearestSegmentId(lane: ISpacelane, point: IPoint): string {
  let bestId = "";
  let bestDistance = Infinity;
  lane.segments.forEach((segment) => {
    if (!isFiniteSegment(segment)) return;
    const distance = distanceToSegment(point, segment);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestId = segment.id;
    }
  });
  return bestId;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/map/lanePaths.test.ts && npm run typecheck`
Expected: PASS, typecheck exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/map/lanePaths.ts src/map/lanePaths.test.ts
git commit -m "feat(map): add lane path helpers"
```

---

### Task 8: Label measurement and culling

**Files:**

- Create: `src/map/measure.ts`, `src/map/cull.ts`
- Test: `src/map/measure.test.ts`, `src/map/cull.test.ts`

**Interfaces:**

- Consumes: `visibleWorldRect`, `worldToScreen` (Task 1); spatial index (Task 6); map constants.
- Produces: `type MeasureText = (text: string) => number`, `createTextMeasurer(font?: string): MeasureText`; `ICullLimits`, `ICullInput`, `ICulledSystem { index: number; labeled: boolean }`, `ICullResult { systems: ICulledSystem[]; lanes: number[] }` (both in priority order, highest first), `cull(input): ICullResult`.

- [ ] **Step 1: Write the failing tests**

Create `src/map/measure.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { createTextMeasurer } from "./measure";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createTextMeasurer", () => {
  it("estimates widths from character count when canvas is unavailable", () => {
    expect(createTextMeasurer("12px sans-serif")("Alpha")).toBe(35);
    expect(createTextMeasurer()("Alpha")).toBe(35);
  });

  it("measures once per text with a canvas context", () => {
    const measureText = vi.fn((text: string) => ({ width: text.length * 5 }));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      font: "",
      measureText,
    } as unknown as CanvasRenderingContext2D);
    const measure = createTextMeasurer("12px sans-serif");
    expect(measure("Alpha")).toBe(25);
    expect(measure("Alpha")).toBe(25);
    expect(measureText).toHaveBeenCalledTimes(1);
  });
});
```

Create `src/map/cull.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { cull, type ICullInput } from "./cull";
import { buildLaneIndex, buildSystemIndex } from "./spatialIndex";
import type { IEntityRef, ISpacelane, ISystem } from "./types";

const system = (id: string, x: number, y: number, name = id): ISystem => ({
  id,
  name,
  position: { x, y },
  color: "red",
});

const lane = (id: string, points: [number, number][]): ISpacelane => ({
  id,
  name: id,
  segments: points.slice(1).map((point, i) => ({
    id: `${id}-${i}`,
    origin: { x: points[i][0], y: points[i][1] },
    destination: { x: point[0], y: point[1] },
    color: "blue",
  })),
});

function input(
  systems: ISystem[],
  lanes: ISpacelane[] = [],
  overrides: Partial<ICullInput> = {},
): ICullInput {
  return {
    systems,
    lanes,
    systemIndex: buildSystemIndex(systems),
    laneIndex: buildLaneIndex(lanes),
    viewport: { center: { x: 0, y: 0 }, zoom: 1 },
    size: { width: 800, height: 600 },
    selected: null,
    limits: { maxSystems: 500, maxLabels: 100, maxLaneSegments: 600 },
    enabled: true,
    measure: (text) => text.length * 7,
    ...overrides,
  };
}

const select = (kind: IEntityRef["kind"], id: string) => ({
  selected: { kind, id },
});

describe("cull systems", () => {
  it("keeps the earlier system when glyphs collide", () => {
    expect(cull(input([system("A", 0, 0), system("B", 3, 0)])).systems).toEqual(
      [{ index: 0, labeled: true }],
    );
  });

  it("shows a glyph without its label when only the label collides", () => {
    const result = cull(
      input([system("A", 0, 0, "Alpha"), system("F", -30, 0, "Foxtrot")]),
    );
    expect(result.systems).toEqual([
      { index: 0, labeled: true },
      { index: 1, labeled: false },
    ]);
  });

  it("hides a glyph that collides with an earlier label", () => {
    const result = cull(
      input([system("A", 0, 0, "Alpha"), system("D", 20, 0)]),
    );
    expect(result.systems).toEqual([{ index: 0, labeled: true }]);
  });

  it("stops at maxSystems and maxLabels", () => {
    const systems = [
      system("A", 0, 0),
      system("B", 0, 100),
      system("C", 0, -100),
    ];
    expect(
      cull(
        input(systems, [], {
          limits: { maxSystems: 2, maxLabels: 1, maxLaneSegments: 600 },
        }),
      ).systems,
    ).toEqual([
      { index: 0, labeled: true },
      { index: 1, labeled: false },
    ]);
  });

  it("promotes the selected system and always labels it", () => {
    const systems = [system("A", 0, 0), system("B", 3, 0)];
    expect(cull(input(systems, [], select("system", "B"))).systems).toEqual([
      { index: 1, labeled: true },
    ]);
    const noLabels = {
      limits: { maxSystems: 500, maxLabels: 0, maxLaneSegments: 600 },
    };
    expect(
      cull(input(systems, [], { ...select("system", "B"), ...noLabels }))
        .systems[0],
    ).toEqual({
      index: 1,
      labeled: true,
    });
  });

  it("includes systems within the margin and excludes those beyond it", () => {
    const result = cull(input([system("in", 450, 0), system("out", 500, 0)]));
    expect(result.systems.map((s) => s.index)).toEqual([0]);
  });

  it("skips systems with non-finite positions", () => {
    expect(
      cull(input([system("bad", NaN, 0), system("ok", 0, 0)])).systems,
    ).toEqual([{ index: 1, labeled: true }]);
  });

  it("returns every valid system, labeled, when culling is disabled", () => {
    const systems = [
      system("A", 0, 0),
      system("B", 3, 0),
      system("far", 5000, 0),
      system("bad", NaN, 0),
    ];
    expect(cull(input(systems, [], { enabled: false })).systems).toEqual([
      { index: 0, labeled: true },
      { index: 1, labeled: true },
      { index: 2, labeled: true },
    ]);
  });

  it("is deterministic", () => {
    const systems = Array.from({ length: 200 }, (_, i) =>
      system(`s${i}`, (i * 37) % 400, (i * 91) % 300),
    );
    expect(cull(input(systems))).toEqual(cull(input(systems)));
  });
});

describe("cull lanes", () => {
  const lanes = [
    lane("two", [
      [0, 0],
      [10, 0],
      [20, 0],
    ]),
    lane("three", [
      [0, 10],
      [10, 10],
      [20, 10],
      [30, 10],
    ]),
  ];

  it("keeps lanes in priority order until the segment budget", () => {
    const limits = { maxSystems: 500, maxLabels: 100, maxLaneSegments: 4 };
    expect(cull(input([], lanes, { limits })).lanes).toEqual([0]);
  });

  it("puts the selected lane first", () => {
    const limits = { maxSystems: 500, maxLabels: 100, maxLaneSegments: 4 };
    expect(
      cull(input([], lanes, { limits, ...select("lane", "three") })).lanes,
    ).toEqual([1]);
  });

  it("skips lanes with no segment in view", () => {
    expect(
      cull(
        input(
          [],
          [
            lane("far", [
              [5000, 5000],
              [6000, 5000],
            ]),
            ...lanes,
          ],
        ),
      ).lanes,
    ).toEqual([1, 2]);
  });

  it("returns every lane when culling is disabled", () => {
    expect(
      cull(
        input(
          [],
          [
            lane("far", [
              [5000, 5000],
              [6000, 5000],
            ]),
            ...lanes,
          ],
          { enabled: false },
        ),
      ).lanes,
    ).toEqual([0, 1, 2]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/map/measure.test.ts src/map/cull.test.ts`
Expected: FAIL, with errors that `./measure` and `./cull` cannot be resolved.

- [ ] **Step 3: Implement measurement**

Create `src/map/measure.ts`:

```ts
import { FALLBACK_CHAR_WIDTH_PX } from "./constants";

/** Returns a text's rendered width in pixels. */
export type MeasureText = (text: string) => number;

/**
 * Measures label widths with a canvas 2D context in the given CSS font,
 * caching each text. Without a font or a canvas (server rendering, tests), it
 * estimates FALLBACK_CHAR_WIDTH_PX per character, so results stay deterministic.
 */
export function createTextMeasurer(font?: string): MeasureText {
  let context: CanvasRenderingContext2D | null = null;
  if (font && typeof document !== "undefined") {
    context = document.createElement("canvas").getContext("2d");
    if (context) context.font = font;
  }
  const cache = new Map<string, number>();
  return (text: string) => {
    const cached = cache.get(text);
    if (cached !== undefined) return cached;
    const width = context
      ? context.measureText(text).width
      : text.length * FALLBACK_CHAR_WIDTH_PX;
    cache.set(text, width);
    return width;
  };
}
```

- [ ] **Step 4: Implement culling**

Create `src/map/cull.ts`:

```ts
import { visibleWorldRect, worldToScreen } from "../canvas/projection";
import type { ISize, IViewport } from "../canvas/types";
import {
  COLLISION_CELL_PX,
  CULL_MARGIN,
  GLYPH_RADIUS_PX,
  GLYPH_SPACING_PX,
  LABEL_HEIGHT_PX,
  LABEL_OFFSET_PX,
  MAP_Y_AXIS,
} from "./constants";
import type { MeasureText } from "./measure";
import {
  type IGridIndex,
  isFinitePoint,
  isFiniteSegment,
  queryIndex,
} from "./spatialIndex";
import type {
  IBounds,
  IEntityRef,
  ILaneSegment,
  IPoint,
  ISpacelane,
  ISystem,
} from "./types";

export interface ICullLimits {
  maxSystems: number;
  maxLabels: number;
  maxLaneSegments: number;
}

export interface ICullInput {
  systems: readonly ISystem[];
  lanes: readonly ISpacelane[];
  systemIndex: IGridIndex;
  laneIndex: IGridIndex;
  viewport: IViewport;
  size: ISize;
  selected: IEntityRef | null;
  limits: ICullLimits;
  /** False draws everything, labeled, with no viewport query, collisions, or limits. */
  enabled: boolean;
  measure: MeasureText;
}

export interface ICulledSystem {
  index: number;
  labeled: boolean;
}

/** What to draw, each list in priority order, highest first. */
export interface ICullResult {
  systems: ICulledSystem[];
  lanes: number[];
}

interface IBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

function overlaps(a: IBox, b: IBox): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

/** Placed screen boxes, bucketed so collision checks only look nearby. */
class BoxHash {
  private cells = new Map<string, IBox[]>();

  private keys(box: IBox): string[] {
    const keys: string[] = [];
    for (
      let cx = Math.floor(box.x / COLLISION_CELL_PX);
      cx <= Math.floor((box.x + box.w) / COLLISION_CELL_PX);
      cx++
    ) {
      for (
        let cy = Math.floor(box.y / COLLISION_CELL_PX);
        cy <= Math.floor((box.y + box.h) / COLLISION_CELL_PX);
        cy++
      ) {
        keys.push(`${cx},${cy}`);
      }
    }
    return keys;
  }

  collides(box: IBox): boolean {
    return this.keys(box).some((key) =>
      (this.cells.get(key) ?? []).some((other) => overlaps(box, other)),
    );
  }

  add(box: IBox): void {
    this.keys(box).forEach((key) => {
      const list = this.cells.get(key);
      if (list) list.push(box);
      else this.cells.set(key, [box]);
    });
  }
}

function inRect(point: IPoint, rect: IBounds): boolean {
  return (
    point.x >= rect.min.x &&
    point.x <= rect.max.x &&
    point.y >= rect.min.y &&
    point.y <= rect.max.y
  );
}

function segmentTouchesRect(segment: ILaneSegment, rect: IBounds): boolean {
  return (
    Math.max(segment.origin.x, segment.destination.x) >= rect.min.x &&
    Math.min(segment.origin.x, segment.destination.x) <= rect.max.x &&
    Math.max(segment.origin.y, segment.destination.y) >= rect.min.y &&
    Math.min(segment.origin.y, segment.destination.y) <= rect.max.y
  );
}

function withFirst(indexes: number[], first: number): number[] {
  return first < 0 ? indexes : [first, ...indexes.filter((i) => i !== first)];
}

function cullSystems(input: ICullInput, selected: number): ICulledSystem[] {
  const valid = (i: number) => isFinitePoint(input.systems[i].position);
  if (!input.enabled) {
    return withFirst(
      input.systems.map((_, i) => i),
      selected,
    )
      .filter(valid)
      .map((index) => ({ index, labeled: true }));
  }
  const rect = visibleWorldRect(input.viewport, input.size, CULL_MARGIN);
  const candidates = withFirst(
    queryIndex(input.systemIndex, rect).filter((i) =>
      inRect(input.systems[i].position, rect),
    ),
    selected,
  ).filter(valid);

  const placed = new BoxHash();
  const result: ICulledSystem[] = [];
  const half = GLYPH_RADIUS_PX + GLYPH_SPACING_PX / 2;
  let labels = 0;
  for (const index of candidates) {
    if (result.length >= input.limits.maxSystems) break;
    const system = input.systems[index];
    const point = worldToScreen(
      system.position,
      input.viewport,
      input.size,
      MAP_Y_AXIS,
    );
    const glyph = {
      x: point.x - half,
      y: point.y - half,
      w: 2 * half,
      h: 2 * half,
    };
    const forced = index === selected;
    if (!forced && placed.collides(glyph)) continue;
    placed.add(glyph);
    const label = {
      x: point.x + LABEL_OFFSET_PX,
      y: point.y - LABEL_HEIGHT_PX / 2,
      w: input.measure(system.name),
      h: LABEL_HEIGHT_PX,
    };
    const labeled =
      forced || (labels < input.limits.maxLabels && !placed.collides(label));
    if (labeled) {
      placed.add(label);
      labels++;
    }
    result.push({ index, labeled });
  }
  return result;
}

function cullLanes(input: ICullInput, selected: number): number[] {
  if (!input.enabled)
    return withFirst(
      input.lanes.map((_, i) => i),
      selected,
    );
  const rect = visibleWorldRect(input.viewport, input.size, CULL_MARGIN);
  const result: number[] = [];
  let segments = 0;
  for (const index of withFirst(queryIndex(input.laneIndex, rect), selected)) {
    const visible = input.lanes[index].segments.filter(
      (s) => isFiniteSegment(s) && segmentTouchesRect(s, rect),
    ).length;
    if (index !== selected) {
      if (visible === 0) continue;
      if (segments + visible > input.limits.maxLaneSegments) break;
    }
    result.push(index);
    segments += visible;
  }
  return result;
}

/**
 * Decides what to draw. Systems are walked greedily in priority order, with the
 * selected system first: a glyph that collides with anything placed is hidden,
 * and a placed glyph gets its label if the label box is clear. Lanes are kept
 * in priority order, with the selected lane first, until the segment budget.
 */
export function cull(input: ICullInput): ICullResult {
  const selectedSystem =
    input.selected?.kind === "system"
      ? input.systems.findIndex((s) => s.id === input.selected!.id)
      : -1;
  const selectedLane =
    input.selected?.kind === "lane"
      ? input.lanes.findIndex((l) => l.id === input.selected!.id)
      : -1;
  return {
    systems: cullSystems(input, selectedSystem),
    lanes: cullLanes(input, selectedLane),
  };
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/map && npm run typecheck`
Expected: PASS, typecheck exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/map/measure.ts src/map/measure.test.ts src/map/cull.ts src/map/cull.test.ts
git commit -m "feat(map): add priority-order culling"
```

---

### Task 9: Data validation

**Files:**

- Create: `src/map/validate.ts`
- Test: `src/map/validate.test.ts`

**Interfaces:**

- Consumes: map types, `SEGMENT_JOIN_TOLERANCE`, `isFinitePoint`.
- Produces: `type ColorValidator = (color: string) => boolean`, `defaultColorValidator`, `findDataProblems(systems, lanes, isValidColor?): string[]`, `isDevelopment(): boolean`.

- [ ] **Step 1: Write the failing tests**

Create `src/map/validate.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { findDataProblems, isDevelopment } from "./validate";
import type { ISpacelane, ISystem } from "./types";

const system = (id: string, x = 0, y = 0, color = "red"): ISystem => ({
  id,
  name: id,
  position: { x, y },
  color,
});

const lane = (
  id: string,
  segments: [string, [number, number], [number, number]][],
  color = "blue",
): ISpacelane => ({
  id,
  name: id,
  segments: segments.map(([segmentId, from, to]) => ({
    id: segmentId,
    origin: { x: from[0], y: from[1] },
    destination: { x: to[0], y: to[1] },
    color,
  })),
});

describe("findDataProblems", () => {
  it("finds nothing wrong with valid data", () => {
    expect(
      findDataProblems(
        [system("a"), system("b", 5)],
        [lane("x", [["x0", [0, 0], [1, 0]]])],
      ),
    ).toEqual([]);
  });

  it("reports duplicate ids within a kind, but allows the same id across kinds", () => {
    const problems = findDataProblems(
      [system("a"), system("a", 5)],
      [lane("a", [["s", [0, 0], [1, 0]]]), lane("b", [["s", [2, 0], [3, 0]]])],
    );
    expect(problems).toEqual([
      'Duplicate system id "a".',
      'Duplicate segment id "s".',
    ]);
  });

  it("reports non-finite coordinates", () => {
    expect(findDataProblems([system("a", NaN)], [])).toEqual([
      'System "a" has a non-finite position and will not be drawn.',
    ]);
    expect(
      findDataProblems([], [lane("x", [["s", [0, 0], [Infinity, 0]]])]),
    ).toEqual([
      'Segment "s" in spacelane "x" has a non-finite point and will not be drawn.',
    ]);
  });

  it("reports invalid colors", () => {
    const isValidColor = (color: string) => color !== "notacolor";
    expect(
      findDataProblems([system("a", 0, 0, "notacolor")], [], isValidColor),
    ).toEqual(['System "a" has an invalid color "notacolor".']);
  });

  it("reports segments that almost join, but not intentional gaps", () => {
    const almost = lane("x", [
      ["s0", [0, 0], [1, 0]],
      ["s1", [1.0005, 0], [2, 0]],
    ]);
    const gap = lane("y", [
      ["t0", [0, 0], [1, 0]],
      ["t1", [5, 0], [6, 0]],
    ]);
    const problems = findDataProblems([], [almost, gap]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(
      /^Segments "s0" and "s1" in spacelane "x" almost join/,
    );
  });
});

describe("isDevelopment", () => {
  it("is true under the test runner", () => {
    expect(isDevelopment()).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/map/validate.test.ts`
Expected: FAIL, with an error that `./validate` cannot be resolved.

- [ ] **Step 3: Implement validation**

Create `src/map/validate.ts`:

```ts
import { SEGMENT_JOIN_TOLERANCE } from "./constants";
import { isFinitePoint } from "./spatialIndex";
import type { ISpacelane, ISystem } from "./types";

export type ColorValidator = (color: string) => boolean;

/** Uses CSS.supports when available. Environments without it accept every color. */
export function defaultColorValidator(color: string): boolean {
  return (
    typeof CSS === "undefined" ||
    typeof CSS.supports !== "function" ||
    CSS.supports("color", color)
  );
}

function duplicates(ids: string[], label: string): string[] {
  const seen = new Set<string>();
  const problems: string[] = [];
  ids.forEach((id) => {
    if (seen.has(id)) problems.push(`Duplicate ${label} id "${id}".`);
    seen.add(id);
  });
  return problems;
}

/** Human-readable problems with the data. Used for development warnings only. */
export function findDataProblems(
  systems: readonly ISystem[],
  lanes: readonly ISpacelane[],
  isValidColor: ColorValidator = defaultColorValidator,
): string[] {
  const problems = [
    ...duplicates(
      systems.map((s) => s.id),
      "system",
    ),
    ...duplicates(
      lanes.map((l) => l.id),
      "spacelane",
    ),
    ...duplicates(
      lanes.flatMap((l) => l.segments.map((s) => s.id)),
      "segment",
    ),
  ];
  systems.forEach((system) => {
    if (!isFinitePoint(system.position))
      problems.push(
        `System "${system.id}" has a non-finite position and will not be drawn.`,
      );
    if (!isValidColor(system.color))
      problems.push(
        `System "${system.id}" has an invalid color "${system.color}".`,
      );
  });
  lanes.forEach((lane) => {
    lane.segments.forEach((segment, i) => {
      if (
        !isFinitePoint(segment.origin) ||
        !isFinitePoint(segment.destination)
      ) {
        problems.push(
          `Segment "${segment.id}" in spacelane "${lane.id}" has a non-finite point and will not be drawn.`,
        );
      }
      if (!isValidColor(segment.color)) {
        problems.push(
          `Segment "${segment.id}" in spacelane "${lane.id}" has an invalid color "${segment.color}".`,
        );
      }
      const previous = lane.segments[i - 1];
      if (previous) {
        const gap = Math.hypot(
          segment.origin.x - previous.destination.x,
          segment.origin.y - previous.destination.y,
        );
        if (gap > 0 && gap <= SEGMENT_JOIN_TOLERANCE) {
          problems.push(
            `Segments "${previous.id}" and "${segment.id}" in spacelane "${lane.id}" almost join (gap ${gap}). Make the points equal to join them.`,
          );
        }
      }
    });
  });
  return problems;
}

/**
 * True outside production builds. Bundlers replace process.env.NODE_ENV. Where
 * `process` does not exist, validation is skipped.
 */
export function isDevelopment(): boolean {
  return (
    typeof process !== "undefined" && process.env?.NODE_ENV !== "production"
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/map/validate.test.ts && npm run typecheck`
Expected: PASS, typecheck exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/map/validate.ts src/map/validate.test.ts
git commit -m "feat(map): add development data validation"
```

---

### Task 10: Drawing nodes

**Files:**

- Create: `src/map/GalaxyMap.module.css`, `src/map/primitives.tsx`, `src/map/SystemNode.tsx`, `src/map/LaneNode.tsx`, `src/map/Highlight.tsx`
- Test: `src/map/nodes.test.tsx`

**Interfaces:**

- Consumes: `screenSpaceClassName` (Task 4), `laneRuns`, `laneHitPath` (Task 7), map constants and types.
- Produces: `SystemGlyph`, `SpacelaneSegment`, `laneStrokeProps(color)`; `SystemNode` with props `{ system: ISystem; labeled: boolean; selected: boolean; interactive: boolean; elementId: string; renderOverlay?: (system: ISystem) => ReactNode; highlightColor?: string }`; `LaneNode` with props `{ lane: ISpacelane; selected: boolean; interactive: boolean; highlightColor?: string }`; `HighlightTarget`, `Highlight` with props `{ target: HighlightTarget | null; variant: "hover" | "focus"; color?: string }`.

- [ ] **Step 1: Write the failing tests**

Create `src/map/nodes.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { screenSpaceClassName } from "../canvas/screenSpace";
import styles from "./GalaxyMap.module.css";
import { Highlight } from "./Highlight";
import { LaneNode, laneNodePropsEqual } from "./LaneNode";
import { laneStrokeProps, SpacelaneSegment, SystemGlyph } from "./primitives";
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
    labeled: true,
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
    expect(container.querySelector("text")).toHaveTextContent("Alpha");
  });

  it("omits the label when not labeled and shows a ring when selected", () => {
    const { container } = svg(
      <SystemNode {...props} labeled={false} selected />,
    );
    expect(container.querySelector("text")).toBeNull();
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

  it("draws overlay content between the glyph and the label", () => {
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
    const label = children.findIndex((c) => c.tagName === "text");
    const glyph = children.findIndex((c) => c.classList.contains(styles.glyph));
    expect(glyph).toBeLessThan(badge);
    expect(badge).toBeLessThan(label);
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/map/nodes.test.tsx`
Expected: FAIL, with errors that `./Highlight`, `./LaneNode`, `./primitives`, and `./SystemNode` cannot be resolved.

- [ ] **Step 3: Create the styles and primitives**

Create `src/map/GalaxyMap.module.css`. Consumers never target these classes, which are hashed in builds. Defaults use `:where()`, which has zero specificity, so any consumer class wins:

```css
/* Inherited defaults for the whole map. Consumers override them with a class on
   the map root, or on a system's or lane's group. `.laneStroke` also gives a
   standalone SpacelaneSegment the same default stroke as the map. */
:where(.root) {
  color: #ffffff; /* highlight and selection rings, through currentColor */
  fill: #e6e6e6; /* label text */
  font:
    12px system-ui,
    sans-serif; /* label text, also used to measure labels */
}

:where(.root),
:where(.laneStroke) {
  stroke-width: 2px; /* lane width */
  stroke-linecap: round;
}

:where(.label) {
  dominant-baseline: central;
}

:where(.glyph) {
  stroke: none;
}

:where(.system[role="button"]),
:where(.lane[role="button"]) {
  cursor: pointer;
}

:where(.laneHalo),
:where(.highlightLane) {
  fill: none;
  stroke: currentColor;
  stroke-opacity: 0.35;
}

:where(.ring) {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5px;
}

:where(.focusRing) {
  stroke-dasharray: 3 2;
}

/* Structural rules, not meant to be overridden. */
.hit {
  fill: transparent;
}

.laneHit {
  fill: none;
  stroke: transparent;
}

.laneRun,
.laneHalo,
.highlightLane,
.ring,
.highlight,
.free {
  pointer-events: none;
}
```

Create `src/map/primitives.tsx`:

```tsx
import type { SVGProps } from "react";
import { lib } from "@outoforbitdev/ood-react";
import { GLYPH_RADIUS_PX } from "./constants";
import styles from "./GalaxyMap.module.css";
import type { IPoint } from "./types";

export interface ISystemGlyphProps {
  x?: number;
  y?: number;
  color: string;
  radius?: number;
  className?: string;
}

/** The glyph GalaxyMap draws for a system. Renders in any <svg>, for legends and infoboxes. */
export function SystemGlyph({
  x = 0,
  y = 0,
  color,
  radius = GLYPH_RADIUS_PX,
  className,
}: ISystemGlyphProps) {
  return (
    <circle
      className={className ?? styles.glyph}
      cx={x}
      cy={y}
      r={radius}
      fill={color}
    />
  );
}

/**
 * Attributes shared by every drawn lane. Width and caps are deliberately not
 * set here: they are inherited from the map root (or `.laneStroke` on a
 * standalone segment), so a consumer class on the lane can override them.
 */
export function laneStrokeProps(
  color: string,
): SVGProps<SVGPathElement> & SVGProps<SVGLineElement> {
  return {
    fill: "none",
    stroke: color,
    vectorEffect: "non-scaling-stroke",
  };
}

export interface ISpacelaneSegmentProps {
  origin: IPoint;
  destination: IPoint;
  color: string;
  className?: string;
}

/** A single lane segment drawn with the map's default stroke. Renders in any <svg>. */
export function SpacelaneSegment({
  origin,
  destination,
  color,
  className,
}: ISpacelaneSegmentProps) {
  return (
    <line
      className={lib.classNames(styles.laneStroke, className)}
      x1={origin.x}
      y1={origin.y}
      x2={destination.x}
      y2={destination.y}
      {...laneStrokeProps(color)}
    />
  );
}
```

- [ ] **Step 4: Create the nodes and highlight**

Create `src/map/SystemNode.tsx`:

```tsx
import { lib } from "@outoforbitdev/ood-react";
import { memo, type ReactNode } from "react";
import { screenSpaceClassName } from "../canvas/screenSpace";
import {
  GLYPH_RADIUS_PX,
  LABEL_OFFSET_PX,
  SELECTION_RING_GAP_PX,
  SYSTEM_HIT_RADIUS_PX,
} from "./constants";
import styles from "./GalaxyMap.module.css";
import { SystemGlyph } from "./primitives";
import type { ISystem } from "./types";

export interface ISystemNodeProps {
  system: ISystem;
  labeled: boolean;
  selected: boolean;
  /** False when selection is disabled: the node becomes role="img". */
  interactive: boolean;
  /** DOM id, referenced by aria-activedescendant. */
  elementId: string;
  renderOverlay?: (system: ISystem) => ReactNode;
  /** Set only on the selection ring, so overlays using currentColor are unaffected. */
  highlightColor?: string;
}

function SystemNodeView({
  system,
  labeled,
  selected,
  interactive,
  elementId,
  renderOverlay,
  highlightColor,
}: ISystemNodeProps) {
  return (
    <g
      id={elementId}
      className={lib.classNames(styles.system, system.className)}
      transform={`translate(${system.position.x} ${system.position.y})`}
      data-kind="system"
      data-id={system.id}
      role={interactive ? "button" : "img"}
      aria-label={system.name}
      aria-pressed={interactive ? selected : undefined}
    >
      <g className={screenSpaceClassName}>
        <circle className={styles.hit} r={SYSTEM_HIT_RADIUS_PX} />
        <SystemGlyph color={system.color} />
        {selected && (
          <circle
            className={styles.ring}
            r={GLYPH_RADIUS_PX + SELECTION_RING_GAP_PX}
            color={highlightColor}
            aria-hidden="true"
          />
        )}
        {renderOverlay?.(system)}
        {labeled && (
          <text className={styles.label} x={LABEL_OFFSET_PX}>
            {system.name}
          </text>
        )}
      </g>
    </g>
  );
}

/** Equal when every field the node draws is equal, so recreated objects do not re-render. */
export function systemNodePropsEqual(
  a: ISystemNodeProps,
  b: ISystemNodeProps,
): boolean {
  return (
    a.labeled === b.labeled &&
    a.selected === b.selected &&
    a.interactive === b.interactive &&
    a.elementId === b.elementId &&
    a.highlightColor === b.highlightColor &&
    a.renderOverlay === b.renderOverlay &&
    a.system.id === b.system.id &&
    a.system.name === b.system.name &&
    a.system.position.x === b.system.position.x &&
    a.system.position.y === b.system.position.y &&
    a.system.color === b.system.color &&
    a.system.className === b.system.className &&
    a.system.data === b.system.data
  );
}

/** One system: hit area, glyph, selection ring, overlay, then label. */
export const SystemNode = memo(SystemNodeView, systemNodePropsEqual);
```

Create `src/map/LaneNode.tsx`:

```tsx
import { lib } from "@outoforbitdev/ood-react";
import { memo, useMemo } from "react";
import { LANE_HALO_WIDTH_PX, LANE_HIT_WIDTH_PX } from "./constants";
import styles from "./GalaxyMap.module.css";
import { laneHitPath, laneRuns } from "./lanePaths";
import { laneStrokeProps } from "./primitives";
import type { ILaneSegment, ISpacelane } from "./types";

export interface ILaneNodeProps {
  lane: ISpacelane;
  selected: boolean;
  interactive: boolean;
  /** Set only on the selection halo. */
  highlightColor?: string;
}

function LaneNodeView({
  lane,
  selected,
  interactive,
  highlightColor,
}: ILaneNodeProps) {
  const runs = useMemo(() => laneRuns(lane.segments), [lane.segments]);
  const hitPath = useMemo(() => laneHitPath(lane.segments), [lane.segments]);
  return (
    <g
      className={lib.classNames(styles.lane, lane.className)}
      data-kind="lane"
      data-id={lane.id}
      role={interactive ? "button" : "img"}
      aria-label={lane.name}
      aria-pressed={interactive ? selected : undefined}
    >
      {selected && (
        <path
          className={styles.laneHalo}
          d={hitPath}
          color={highlightColor}
          strokeWidth={LANE_HALO_WIDTH_PX}
          vectorEffect="non-scaling-stroke"
          aria-hidden="true"
        />
      )}
      {runs.map((run, i) => (
        <path
          key={i}
          className={styles.laneRun}
          d={run.d}
          {...laneStrokeProps(run.color)}
          aria-hidden="true"
        />
      ))}
      <path
        className={styles.laneHit}
        d={hitPath}
        strokeWidth={LANE_HIT_WIDTH_PX}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

function segmentsEqual(
  a: readonly ILaneSegment[],
  b: readonly ILaneSegment[],
): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  return a.every(
    (s, i) =>
      s.id === b[i].id &&
      s.color === b[i].color &&
      s.origin.x === b[i].origin.x &&
      s.origin.y === b[i].origin.y &&
      s.destination.x === b[i].destination.x &&
      s.destination.y === b[i].destination.y,
  );
}

/** Equal when every field the node draws is equal, so recreated objects do not re-render. */
export function laneNodePropsEqual(
  a: ILaneNodeProps,
  b: ILaneNodeProps,
): boolean {
  return (
    a.selected === b.selected &&
    a.interactive === b.interactive &&
    a.highlightColor === b.highlightColor &&
    a.lane.id === b.lane.id &&
    a.lane.name === b.lane.name &&
    a.lane.className === b.lane.className &&
    a.lane.data === b.lane.data &&
    segmentsEqual(a.lane.segments, b.lane.segments)
  );
}

/** One lane: selection halo, color runs, then the hit path on top. */
export const LaneNode = memo(LaneNodeView, laneNodePropsEqual);
```

Create `src/map/Highlight.tsx`:

```tsx
import { lib } from "@outoforbitdev/ood-react";
import { screenSpaceClassName } from "../canvas/screenSpace";
import {
  GLYPH_RADIUS_PX,
  HIGHLIGHT_RING_GAP_PX,
  LANE_HALO_WIDTH_PX,
} from "./constants";
import styles from "./GalaxyMap.module.css";
import { laneHitPath } from "./lanePaths";
import type { ISpacelane, ISystem } from "./types";

export type HighlightTarget =
  | { kind: "system"; system: ISystem }
  | { kind: "lane"; lane: ISpacelane };

export interface IHighlightProps {
  target: HighlightTarget | null;
  variant: "hover" | "focus";
  /** Any CSS color. Without it, the highlight inherits `color` from the map root. */
  color?: string;
}

/** A hover or focus highlight, drawn above everything. It ignores clicks and screen readers. */
export function Highlight({ target, variant, color }: IHighlightProps) {
  if (!target) return null;
  if (target.kind === "system") {
    const ringClass =
      variant === "focus"
        ? lib.classNames(styles.ring, styles.focusRing)
        : styles.ring;
    return (
      <g
        className={styles.highlight}
        transform={`translate(${target.system.position.x} ${target.system.position.y})`}
        aria-hidden="true"
      >
        <g className={screenSpaceClassName}>
          <circle
            className={ringClass}
            r={GLYPH_RADIUS_PX + HIGHLIGHT_RING_GAP_PX}
            color={color}
          />
        </g>
      </g>
    );
  }
  return (
    <path
      className={lib.classNames(styles.highlight, styles.highlightLane)}
      d={laneHitPath(target.lane.segments)}
      color={color}
      strokeWidth={LANE_HALO_WIDTH_PX}
      vectorEffect="non-scaling-stroke"
      aria-hidden="true"
    />
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/map/nodes.test.tsx && npm run typecheck`
Expected: PASS, typecheck exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/map
git commit -m "feat(map): add system, lane, and highlight nodes"
```

---

### Task 11: Map data and selection hooks

**Files:**

- Create: `src/map/useMapData.ts`, `src/map/useSelection.ts`
- Test: `src/map/useMapData.test.ts`, `src/map/useSelection.test.ts`

**Interfaces:**

- Consumes: spatial index (Task 6), `nearestSegmentId` (Task 7), `findDataProblems`, `isDevelopment` (Task 9).
- Produces:

```ts
export interface IMapData<TS, TL> {
  systems: readonly ISystem<TS>[];
  lanes: readonly ISpacelane<TL>[];
  systemIndex: IGridIndex;
  laneIndex: IGridIndex;
  systemById: Map<string, number>;
  laneById: Map<string, number>;
  bounds: IBounds;
}
export function useMapData<TS, TL>(
  systems: readonly ISystem<TS>[],
  lanes: readonly ISpacelane<TL>[],
): IMapData<TS, TL>;
export function toEntityEvent<TS, TL>(
  data: IMapData<TS, TL>,
  ref: IEntityRef,
  point?: IPoint,
): MapEntityEvent<TS, TL> | null;
export interface ISelectionState {
  selected: IEntityRef | null;
  hovered: IEntityRef | null;
  select(ref: IEntityRef | null, point?: IPoint): void;
  hover(ref: IEntityRef | null): void;
}
export function useSelection<TS, TL>(
  options: IUseSelectionOptions<TS, TL>,
): ISelectionState;
```

- [ ] **Step 1: Write the failing tests**

Create `src/map/useMapData.test.ts`:

```ts
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ISpacelane, ISystem } from "./types";
import { useMapData } from "./useMapData";

const system = (id: string, x: number, y: number, color = "red"): ISystem => ({
  id,
  name: id,
  position: { x, y },
  color,
});
const lane = (id: string): ISpacelane => ({
  id,
  name: id,
  segments: [
    {
      id: `${id}-0`,
      origin: { x: 0, y: 0 },
      destination: { x: 10, y: 10 },
      color: "blue",
    },
  ],
});

afterEach(() => {
  vi.restoreAllMocks();
});

function setup(systems: ISystem[], lanes: ISpacelane[]) {
  return renderHook(({ s, l }) => useMapData(s, l), {
    initialProps: { s: systems, l: lanes },
  });
}

describe("useMapData", () => {
  it("keeps the index when only colors change, even with recreated objects", () => {
    const { result, rerender } = setup([system("a", 0, 0)], [lane("x")]);
    const { systemIndex, laneIndex, bounds } = result.current;
    rerender({ s: [system("a", 0, 0, "green")], l: [lane("x")] });
    expect(result.current.systemIndex).toBe(systemIndex);
    expect(result.current.laneIndex).toBe(laneIndex);
    expect(result.current.bounds).toBe(bounds);
    expect(result.current.systems[0].color).toBe("green");
  });

  it("rebuilds only the index whose geometry changed", () => {
    const lanes = [lane("x")];
    const { result, rerender } = setup([system("a", 0, 0)], lanes);
    const { systemIndex, laneIndex } = result.current;
    rerender({ s: [system("a", 5, 5)], l: lanes });
    expect(result.current.systemIndex).not.toBe(systemIndex);
    expect(result.current.laneIndex).toBe(laneIndex);
  });

  it("looks up entities by id", () => {
    const { result } = setup(
      [system("a", 0, 0), system("b", 1, 1)],
      [lane("a")],
    );
    expect(result.current.systemById.get("b")).toBe(1);
    expect(result.current.laneById.get("a")).toBe(0);
  });

  it("computes data bounds, with a default box for no data", () => {
    expect(
      setup([system("a", -5, 0), system("b", 5, 20)], []).result.current.bounds,
    ).toEqual({
      min: { x: -5, y: 0 },
      max: { x: 5, y: 20 },
    });
    expect(setup([], []).result.current.bounds).toEqual({
      min: { x: -100, y: -100 },
      max: { x: 100, y: 100 },
    });
  });

  it("warns once per data problem", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const duplicates = [system("a", 0, 0), system("a", 1, 1)];
    const { rerender } = setup(duplicates, []);
    rerender({ s: [...duplicates], l: [] });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('[galaxy-map] Duplicate system id "a".');
  });
});
```

Create `src/map/useSelection.test.ts`:

```ts
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { IEntityRef, ISpacelane, ISystem } from "./types";
import { useMapData } from "./useMapData";
import { type IUseSelectionOptions, useSelection } from "./useSelection";

const systems: ISystem<{ fleets: number }>[] = [
  {
    id: "a",
    name: "A",
    position: { x: 0, y: 0 },
    color: "red",
    data: { fleets: 3 },
  },
  { id: "b", name: "B", position: { x: 10, y: 0 }, color: "red" },
];
const lanes: ISpacelane[] = [
  {
    id: "l",
    name: "L",
    segments: [
      {
        id: "l0",
        origin: { x: 0, y: 0 },
        destination: { x: 10, y: 0 },
        color: "blue",
      },
      {
        id: "l1",
        origin: { x: 10, y: 0 },
        destination: { x: 10, y: 10 },
        color: "blue",
      },
    ],
  },
];

type Props = {
  systems: ISystem<{ fleets: number }>[];
  options: Omit<IUseSelectionOptions<{ fleets: number }, unknown>, "data">;
};

function setup(options: Props["options"] = {}) {
  return renderHook(
    ({ systems: s, options: o }: Props) =>
      useSelection({ ...o, data: useMapData(s, lanes) }),
    { initialProps: { systems, options } },
  );
}

describe("useSelection", () => {
  it("selects in uncontrolled mode and emits a typed event", () => {
    const onSelect = vi.fn();
    const { result } = setup({ onSelect });
    act(() => result.current.select({ kind: "system", id: "a" }));
    expect(result.current.selected).toEqual({ kind: "system", id: "a" });
    expect(onSelect).toHaveBeenCalledWith({
      kind: "system",
      id: "a",
      system: systems[0],
    });
    act(() => result.current.select(null));
    expect(result.current.selected).toBeNull();
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it("follows the prop in controlled mode", () => {
    const onSelect = vi.fn();
    const selected: IEntityRef = { kind: "system", id: "b" };
    const { result } = setup({ selected, onSelect });
    act(() => result.current.select({ kind: "system", id: "a" }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
    expect(result.current.selected).toEqual(selected);
  });

  it("ignores ids that are not in the data", () => {
    const onSelect = vi.fn();
    const { result } = setup({ onSelect });
    act(() => result.current.select({ kind: "system", id: "missing" }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(result.current.selected).toBeNull();
  });

  it("reports the lane segment nearest the click", () => {
    const onSelect = vi.fn();
    const { result } = setup({ onSelect });
    act(() =>
      result.current.select({ kind: "lane", id: "l" }, { x: 11, y: 8 }),
    );
    expect(onSelect).toHaveBeenCalledWith({
      kind: "lane",
      id: "l",
      lane: lanes[0],
      segmentId: "l1",
    });
  });

  it("emits hover changes only when the hovered entity changes", () => {
    const onHover = vi.fn();
    const { result } = setup({ onHover });
    act(() => result.current.hover({ kind: "system", id: "a" }));
    act(() => result.current.hover({ kind: "system", id: "a" }));
    act(() => result.current.hover(null));
    expect(onHover.mock.calls).toEqual([
      [{ kind: "system", id: "a", system: systems[0] }],
      [null],
    ]);
  });

  it("clears the selection and hover when their entity leaves the data", () => {
    const onSelect = vi.fn();
    const onHover = vi.fn();
    const { result, rerender } = setup({
      onSelect,
      onHover,
      defaultSelected: { kind: "system", id: "a" },
    });
    act(() => result.current.hover({ kind: "system", id: "a" }));
    rerender({
      systems: [systems[1]],
      options: {
        onSelect,
        onHover,
        defaultSelected: { kind: "system", id: "a" },
      },
    });
    expect(result.current.selected).toBeNull();
    expect(result.current.hovered).toBeNull();
    expect(onSelect).toHaveBeenLastCalledWith(null);
    expect(onHover).toHaveBeenLastCalledWith(null);
  });

  it("keeps the selection when its entity is still in the data", () => {
    const onSelect = vi.fn();
    const options = {
      onSelect,
      defaultSelected: { kind: "system", id: "b" } as IEntityRef,
    };
    const { result, rerender } = setup(options);
    rerender({ systems: [systems[1]], options });
    expect(result.current.selected).toEqual({ kind: "system", id: "b" });
    expect(onSelect).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/map/useMapData.test.ts src/map/useSelection.test.ts`
Expected: FAIL, with errors that `./useMapData` and `./useSelection` cannot be resolved.

- [ ] **Step 3: Implement the data hook**

Create `src/map/useMapData.ts`:

```ts
import { useEffect, useMemo, useRef } from "react";
import { EMPTY_BOUNDS_HALF_SIZE } from "./constants";
import {
  buildLaneIndex,
  buildSystemIndex,
  dataBounds,
  type IGridIndex,
  laneGeometryChanged,
  systemGeometryChanged,
} from "./spatialIndex";
import type { IBounds, ISpacelane, ISystem } from "./types";
import { findDataProblems, isDevelopment } from "./validate";

/** Everything derived from the consumer's data. */
export interface IMapData<TSystemData = unknown, TLaneData = unknown> {
  systems: readonly ISystem<TSystemData>[];
  lanes: readonly ISpacelane<TLaneData>[];
  systemIndex: IGridIndex;
  laneIndex: IGridIndex;
  systemById: Map<string, number>;
  laneById: Map<string, number>;
  /** The data's bounding box, or a small box around the origin when there is no data. */
  bounds: IBounds;
}

const EMPTY_BOUNDS: IBounds = {
  min: { x: -EMPTY_BOUNDS_HALF_SIZE, y: -EMPTY_BOUNDS_HALF_SIZE },
  max: { x: EMPTY_BOUNDS_HALF_SIZE, y: EMPTY_BOUNDS_HALF_SIZE },
};

function boundsEqual(a: IBounds, b: IBounds): boolean {
  return (
    a.min.x === b.min.x &&
    a.min.y === b.min.y &&
    a.max.x === b.max.x &&
    a.max.y === b.max.y
  );
}

/**
 * Derives indexes, lookups, and bounds. Each spatial index is rebuilt only when
 * its geometry (ids, order, positions) changes, so recoloring never rebuilds it.
 */
export function useMapData<TSystemData, TLaneData>(
  systems: readonly ISystem<TSystemData>[],
  lanes: readonly ISpacelane<TLaneData>[],
): IMapData<TSystemData, TLaneData> {
  const systemCache = useRef<{
    source: readonly ISystem[];
    index: IGridIndex;
  } | null>(null);
  const laneCache = useRef<{
    source: readonly ISpacelane[];
    index: IGridIndex;
  } | null>(null);
  const boundsCache = useRef<IBounds | null>(null);
  const warned = useRef(new Set<string>());

  const systemIndex = useMemo(() => {
    const cached = systemCache.current;
    if (cached && !systemGeometryChanged(cached.source, systems)) {
      cached.source = systems;
      return cached.index;
    }
    const index = buildSystemIndex(systems);
    systemCache.current = { source: systems, index };
    return index;
  }, [systems]);

  const laneIndex = useMemo(() => {
    const cached = laneCache.current;
    if (cached && !laneGeometryChanged(cached.source, lanes)) {
      cached.source = lanes;
      return cached.index;
    }
    const index = buildLaneIndex(lanes);
    laneCache.current = { source: lanes, index };
    return index;
  }, [lanes]);

  const bounds = useMemo(() => {
    const next = dataBounds(systems, lanes) ?? EMPTY_BOUNDS;
    const previous = boundsCache.current;
    if (previous && boundsEqual(previous, next)) return previous;
    boundsCache.current = next;
    return next;
    // Bounds only change when geometry changes, which is when an index changes.
  }, [systemIndex, laneIndex]);

  const systemById = useMemo(
    () => new Map(systems.map((s, i) => [s.id, i])),
    [systems],
  );
  const laneById = useMemo(
    () => new Map(lanes.map((l, i) => [l.id, i])),
    [lanes],
  );

  useEffect(() => {
    if (!isDevelopment()) return;
    findDataProblems(systems, lanes).forEach((problem) => {
      if (warned.current.has(problem)) return;
      warned.current.add(problem);
      console.warn(`[galaxy-map] ${problem}`);
    });
  }, [systems, lanes]);

  return useMemo(
    () => ({
      systems,
      lanes,
      systemIndex,
      laneIndex,
      systemById,
      laneById,
      bounds,
    }),
    [systems, lanes, systemIndex, laneIndex, systemById, laneById, bounds],
  );
}
```

- [ ] **Step 4: Implement the selection hook**

Create `src/map/useSelection.ts`:

```ts
import { useCallback, useEffect, useRef, useState } from "react";
import { nearestSegmentId } from "./lanePaths";
import type { IEntityRef, IPoint, MapEntityEvent } from "./types";
import type { IMapData } from "./useMapData";

export interface IUseSelectionOptions<TSystemData, TLaneData> {
  data: IMapData<TSystemData, TLaneData>;
  selected?: IEntityRef | null;
  defaultSelected?: IEntityRef | null;
  onSelect?: (event: MapEntityEvent<TSystemData, TLaneData> | null) => void;
  onHover?: (event: MapEntityEvent<TSystemData, TLaneData> | null) => void;
}

export interface ISelectionState {
  selected: IEntityRef | null;
  hovered: IEntityRef | null;
  /** Selects an entity, or clears with null. `point` is the world position of a lane click. */
  select(ref: IEntityRef | null, point?: IPoint): void;
  hover(ref: IEntityRef | null): void;
}

/** Builds the event for an entity, or null when its id is not in the data. */
export function toEntityEvent<TSystemData, TLaneData>(
  data: IMapData<TSystemData, TLaneData>,
  ref: IEntityRef,
  point?: IPoint,
): MapEntityEvent<TSystemData, TLaneData> | null {
  if (ref.kind === "system") {
    const index = data.systemById.get(ref.id);
    return index === undefined
      ? null
      : { kind: "system", id: ref.id, system: data.systems[index] };
  }
  const index = data.laneById.get(ref.id);
  if (index === undefined) return null;
  const lane = data.lanes[index];
  return {
    kind: "lane",
    id: ref.id,
    lane,
    segmentId: point
      ? nearestSegmentId(lane, point)
      : (lane.segments[0]?.id ?? ""),
  };
}

function sameRef(a: IEntityRef | null, b: IEntityRef | null): boolean {
  return (
    a === b || (a !== null && b !== null && a.kind === b.kind && a.id === b.id)
  );
}

function exists(data: IMapData<unknown, unknown>, ref: IEntityRef): boolean {
  return (ref.kind === "system" ? data.systemById : data.laneById).has(ref.id);
}

/** Selection (controlled or uncontrolled) and hover, cleared when their entity leaves the data. */
export function useSelection<TSystemData, TLaneData>(
  options: IUseSelectionOptions<TSystemData, TLaneData>,
): ISelectionState {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const [uncontrolled, setUncontrolled] = useState<IEntityRef | null>(
    options.defaultSelected ?? null,
  );
  const [hovered, setHovered] = useState<IEntityRef | null>(null);
  const hoveredRef = useRef(hovered);
  hoveredRef.current = hovered;
  const controlled = options.selected !== undefined;
  const selected = controlled ? (options.selected ?? null) : uncontrolled;

  const select = useCallback((ref: IEntityRef | null, point?: IPoint) => {
    const { data, onSelect, selected: controlledValue } = optionsRef.current;
    const event = ref ? toEntityEvent(data, ref, point) : null;
    if (ref && !event) return;
    if (controlledValue === undefined) setUncontrolled(ref);
    onSelect?.(event);
  }, []);

  const hover = useCallback((ref: IEntityRef | null) => {
    if (sameRef(ref, hoveredRef.current)) return;
    const { data, onHover } = optionsRef.current;
    const event = ref ? toEntityEvent(data, ref) : null;
    if (ref && !event) return;
    hoveredRef.current = ref;
    setHovered(ref);
    onHover?.(event);
  }, []);

  useEffect(() => {
    const { data, onSelect, onHover } = optionsRef.current;
    if (selected && !exists(data as IMapData<unknown, unknown>, selected)) {
      if (!controlled) setUncontrolled(null);
      onSelect?.(null);
    }
    if (
      hoveredRef.current &&
      !exists(data as IMapData<unknown, unknown>, hoveredRef.current)
    ) {
      hoveredRef.current = null;
      setHovered(null);
      onHover?.(null);
    }
    // Runs when the data changes, not when the selection does.
  }, [options.data]);

  return { selected, hovered, select, hover };
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/map && npm run typecheck`
Expected: PASS, typecheck exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/map/useMapData.ts src/map/useMapData.test.ts src/map/useSelection.ts src/map/useSelection.test.ts
git commit -m "feat(map): add data and selection hooks"
```

---

### Task 12: GalaxyMap component

**Files:**

- Create: `src/map/MapContent.tsx`, `src/map/GalaxyMap.tsx`
- Test: `src/map/GalaxyMap.test.tsx`

**Interfaces:**

- Consumes: everything above.
- Produces:

```ts
export interface IGalaxyMapHandle extends ICanvasHandle {
  select(ref: IEntityRef | null): void;
}
export interface IGalaxyMapProps<TS = unknown, TL = unknown>
  extends IComponentProps {
  systems: ISystem<TS>[];
  spacelanes: ISpacelane<TL>[];
  selected?: IEntityRef | null;
  defaultSelected?: IEntityRef | null;
  onSelect?: (event: MapEntityEvent<TS, TL> | null) => void;
  onHover?: (event: MapEntityEvent<TS, TL> | null) => void;
  selectionEnabled?: boolean;
  hoverEnabled?: boolean;
  highlightColor?: string;
  renderSystemOverlay?: (system: ISystem<TS>) => ReactNode;
  maxSystems?: number;
  maxLabels?: number;
  maxLaneSegments?: number;
  culling?: boolean;
  bounds?: IBounds;
  minZoom?: number;
  maxZoom?: number;
  viewport?: IViewport;
  defaultViewport?: IViewport;
  onViewportChange?: (viewport: IViewport, info: IViewportChangeInfo) => void;
  "aria-label"?: string;
  ref?: Ref<IGalaxyMapHandle>;
}
export function GalaxyMap<TS = unknown, TL = unknown>(
  props: IGalaxyMapProps<TS, TL>,
): JSX.Element;
```

Click handling lives on the Canvas root through its `onClick` prop, not on the map's group: a click on empty space targets the `<svg>`, which is outside the map's group. Task 15 updates the architecture doc to match.

- [ ] **Step 1: Write the failing tests**

Create `src/map/GalaxyMap.test.tsx`:

```tsx
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

const systemEl = (container: HTMLElement, id: string) =>
  container.querySelector(
    `[data-kind='system'][data-id='${id}']`,
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
    const kinds = Array.from(container.querySelectorAll("[data-kind]")).map(
      (el) => el.getAttribute("data-id"),
    );
    expect(kinds).toEqual(["l", "b", "a"]);
  });

  it("labels visible systems and gives every entity an accessible name", () => {
    const { container, getByRole } = render(
      <GalaxyMap systems={systems} spacelanes={lanes} />,
    );
    expect(systemEl(container, "a").querySelector("text")).toHaveTextContent(
      "Alpha",
    );
    expect(getByRole("button", { name: "Beta" })).toBeInTheDocument();
    expect(getByRole("button", { name: "Link" })).toBeInTheDocument();
    expect(
      getByRole("application", { name: "Galaxy map" }),
    ).toBeInTheDocument();
  });

  it("draws everything when culling is disabled", () => {
    const crowded = [
      systems[0],
      { ...systems[1], id: "c", position: { x: -100, y: -50 } },
    ];
    const culled = render(<GalaxyMap systems={crowded} spacelanes={[]} />);
    expect(
      culled.container.querySelectorAll("[data-kind='system']"),
    ).toHaveLength(1);
    culled.unmount();
    const all = render(
      <GalaxyMap systems={crowded} spacelanes={[]} culling={false} />,
    );
    expect(all.container.querySelectorAll("[data-kind='system']")).toHaveLength(
      2,
    );
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
    expect(
      container.querySelectorAll("[data-kind='system']").length,
    ).toBeGreaterThan(0);
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
    fireEvent.click(systemEl(container, "b").querySelector("text")!);
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/map/GalaxyMap.test.tsx`
Expected: FAIL, with an error that `./GalaxyMap` cannot be resolved.

- [ ] **Step 3: Implement MapContent**

Create `src/map/MapContent.tsx`:

```tsx
import {
  type PointerEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useCanvas } from "../canvas/CanvasContext";
import { cull, type ICullResult } from "./cull";
import styles from "./GalaxyMap.module.css";
import { Highlight, type HighlightTarget } from "./Highlight";
import { LaneNode } from "./LaneNode";
import { createTextMeasurer, type MeasureText } from "./measure";
import { SystemNode } from "./SystemNode";
import type { EntityKind, IEntityRef, ISystem } from "./types";
import type { IMapData } from "./useMapData";

export interface IMapContentProps<TSystemData, TLaneData> {
  data: IMapData<TSystemData, TLaneData>;
  selected: IEntityRef | null;
  hovered: IEntityRef | null;
  focusedId: string | null;
  onHover: (ref: IEntityRef | null) => void;
  onCulled: (result: ICullResult) => void;
  selectionEnabled: boolean;
  hoverEnabled: boolean;
  highlightColor?: string;
  culling: boolean;
  maxSystems: number;
  maxLabels: number;
  maxLaneSegments: number;
  elementIdFor: (systemId: string) => string;
  renderSystemOverlay?: (system: ISystem<TSystemData>) => ReactNode;
  children?: ReactNode;
}

function entityOf(target: EventTarget | null): IEntityRef | null {
  const element =
    target instanceof Element ? target.closest("[data-kind]") : null;
  if (!element) return null;
  return {
    kind: element.getAttribute("data-kind") as EntityKind,
    id: element.getAttribute("data-id") ?? "",
  };
}

function highlightTarget<TS, TL>(
  data: IMapData<TS, TL>,
  ref: IEntityRef | null,
): HighlightTarget | null {
  if (!ref) return null;
  if (ref.kind === "system") {
    const index = data.systemById.get(ref.id);
    return index === undefined
      ? null
      : { kind: "system", system: data.systems[index] };
  }
  const index = data.laneById.get(ref.id);
  return index === undefined ? null : { kind: "lane", lane: data.lanes[index] };
}

/** Culls and draws the map. Must be rendered inside a Canvas. */
export function MapContent<TSystemData, TLaneData>(
  props: IMapContentProps<TSystemData, TLaneData>,
) {
  const canvas = useCanvas();
  const systemsRef = useRef<SVGGElement>(null);
  const [measure, setMeasure] = useState<MeasureText>(() =>
    createTextMeasurer(),
  );

  // Measure labels in the font the stylesheet actually applies.
  useLayoutEffect(() => {
    const element = systemsRef.current;
    if (!element) return;
    const font = getComputedStyle(element).font;
    if (font) setMeasure(() => createTextMeasurer(font));
  }, []);

  const { data, selected, culling, maxSystems, maxLabels, maxLaneSegments } =
    props;
  const result = useMemo(
    () =>
      cull({
        systems: data.systems,
        lanes: data.lanes,
        systemIndex: data.systemIndex,
        laneIndex: data.laneIndex,
        viewport: canvas.viewport,
        size: canvas.size,
        selected,
        limits: { maxSystems, maxLabels, maxLaneSegments },
        enabled: culling,
        measure,
      }),
    [
      data,
      canvas.viewport,
      canvas.size,
      selected,
      maxSystems,
      maxLabels,
      maxLaneSegments,
      culling,
      measure,
    ],
  );

  const { onCulled, onHover } = props;
  useLayoutEffect(() => onCulled(result), [onCulled, result]);

  // Hover pauses during gestures, and a gesture clears it.
  useEffect(() => {
    if (canvas.gesturing) onHover(null);
  }, [canvas.gesturing, onHover]);

  const handlePointerOver = (event: PointerEvent<SVGGElement>) => {
    if (
      !props.hoverEnabled ||
      event.pointerType === "touch" ||
      canvas.gesturing
    )
      return;
    onHover(entityOf(event.target));
  };
  const handlePointerOut = (event: PointerEvent<SVGGElement>) => {
    if (!props.hoverEnabled || event.pointerType === "touch") return;
    onHover(entityOf(event.relatedTarget));
  };

  const isSelected = (kind: EntityKind, id: string) =>
    selected?.kind === kind && selected.id === id;
  // SystemNode takes ISystem<unknown>. The overlay is only ever called with this map's own systems.
  const renderOverlay = props.renderSystemOverlay as
    | ((system: ISystem) => ReactNode)
    | undefined;

  return (
    <g onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
      <g>
        {[...result.lanes].reverse().map((index) => {
          const lane = data.lanes[index];
          return (
            <LaneNode
              key={lane.id}
              lane={lane}
              selected={isSelected("lane", lane.id)}
              interactive={props.selectionEnabled}
              highlightColor={props.highlightColor}
            />
          );
        })}
      </g>
      <g ref={systemsRef}>
        {[...result.systems].reverse().map(({ index, labeled }) => {
          const system = data.systems[index];
          return (
            <SystemNode
              key={system.id}
              system={system}
              labeled={labeled}
              selected={isSelected("system", system.id)}
              interactive={props.selectionEnabled}
              elementId={props.elementIdFor(system.id)}
              renderOverlay={renderOverlay}
              highlightColor={props.highlightColor}
            />
          );
        })}
      </g>
      <Highlight
        target={highlightTarget(data, props.hovered)}
        variant="hover"
        color={props.highlightColor}
      />
      <Highlight
        target={highlightTarget(
          data,
          props.focusedId === null
            ? null
            : { kind: "system", id: props.focusedId },
        )}
        variant="focus"
        color={props.highlightColor}
      />
      <g className={styles.free}>{props.children}</g>
    </g>
  );
}
```

- [ ] **Step 4: Implement GalaxyMap**

Create `src/map/GalaxyMap.tsx`:

```tsx
import { type IComponentProps, lib } from "@outoforbitdev/ood-react";
import {
  type MouseEvent,
  type ReactNode,
  type Ref,
  useCallback,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Canvas, type ICanvasHandle } from "../canvas/Canvas";
import { DEFAULT_ZOOM } from "../canvas/constants";
import type { IViewportChangeInfo } from "../canvas/useViewport";
import {
  DEFAULT_MAX_LABELS,
  DEFAULT_MAX_LANE_SEGMENTS,
  DEFAULT_MAX_SYSTEMS,
  MAP_Y_AXIS,
} from "./constants";
import type { ICullResult } from "./cull";
import styles from "./GalaxyMap.module.css";
import { MapContent } from "./MapContent";
import type {
  EntityKind,
  IBounds,
  IEntityRef,
  ISpacelane,
  ISystem,
  IViewport,
  MapEntityEvent,
} from "./types";
import { useMapData } from "./useMapData";
import { useSelection } from "./useSelection";

/** Camera controls plus map actions, exposed through a GalaxyMap ref. */
export interface IGalaxyMapHandle extends ICanvasHandle {
  /** Selects an entity, or clears with null. In controlled mode it only calls onSelect. */
  select(ref: IEntityRef | null): void;
}

export interface IGalaxyMapProps<TSystemData = unknown, TLaneData = unknown>
  extends IComponentProps {
  /** Star systems in priority order, highest first. */
  systems: ISystem<TSystemData>[];
  /** Spacelanes in priority order, highest first. */
  spacelanes: ISpacelane<TLaneData>[];
  selected?: IEntityRef | null;
  defaultSelected?: IEntityRef | null;
  onSelect?: (event: MapEntityEvent<TSystemData, TLaneData> | null) => void;
  onHover?: (event: MapEntityEvent<TSystemData, TLaneData> | null) => void;
  /** False stops users from changing the selection. `selected` and `select()` still work. */
  selectionEnabled?: boolean;
  /** False turns off hover tracking and onHover. */
  hoverEnabled?: boolean;
  /**
   * Any CSS color for hover, focus, and selection highlights. It is set only on
   * the highlight elements, so overlays and children using currentColor are
   * unaffected. It overrides a `color` on the map's className.
   */
  highlightColor?: string;
  /** Content drawn with each visible system, in pixels relative to its center. Memoize it. */
  renderSystemOverlay?: (system: ISystem<TSystemData>) => ReactNode;
  maxSystems?: number;
  maxLabels?: number;
  maxLaneSegments?: number;
  /** False draws every system, label, and lane. Performance targets do not apply. */
  culling?: boolean;
  /** The content area. Defaults to the data's bounding box. */
  bounds?: IBounds;
  minZoom?: number;
  maxZoom?: number;
  viewport?: IViewport;
  defaultViewport?: IViewport;
  onViewportChange?: (viewport: IViewport, info: IViewportChangeInfo) => void;
  "aria-label"?: string;
  ref?: Ref<IGalaxyMapHandle>;
}

/** An interactive map of star systems and spacelanes. */
export function GalaxyMap<TSystemData = unknown, TLaneData = unknown>(
  props: IGalaxyMapProps<TSystemData, TLaneData>,
) {
  const selectionEnabled = props.selectionEnabled ?? true;
  const data = useMapData(props.systems, props.spacelanes);
  const selection = useSelection({
    data,
    selected: props.selected,
    defaultSelected: props.defaultSelected,
    onSelect: props.onSelect,
    onHover: props.onHover,
  });
  const canvasRef = useRef<ICanvasHandle>(null);
  const visibleRef = useRef<ICullResult>({ systems: [], lanes: [] });
  const [focusedId] = useState<string | null>(null);
  const idPrefix = useId();
  const elementIdFor = useCallback(
    (systemId: string) => `${idPrefix}system-${encodeURIComponent(systemId)}`,
    [idPrefix],
  );

  useImperativeHandle(
    props.ref,
    () => ({
      moveTo: (target, options) => canvasRef.current?.moveTo(target, options),
      fitPoints: (points, options) =>
        canvasRef.current?.fitPoints(points, options),
      getViewport: () =>
        canvasRef.current?.getViewport() ?? {
          center: { x: 0, y: 0 },
          zoom: DEFAULT_ZOOM,
        },
      getSize: () => canvasRef.current?.getSize() ?? { width: 0, height: 0 },
      worldToScreen: (point) =>
        canvasRef.current?.worldToScreen(point) ?? point,
      screenToWorld: (point) =>
        canvasRef.current?.screenToWorld(point) ?? point,
      select: (ref) => selection.select(ref),
    }),
    [selection],
  );

  const handleCulled = useCallback((result: ICullResult) => {
    visibleRef.current = result;
  }, []);

  // Clicks are handled at the canvas root: a click on empty space targets the <svg>.
  const handleClick = (event: MouseEvent) => {
    props.onClick?.(event);
    if (!selectionEnabled || event.defaultPrevented) return;
    const element = (event.target as Element).closest?.("[data-kind]");
    if (!element) {
      selection.select(null);
      return;
    }
    const rect = (event.currentTarget as Element).getBoundingClientRect();
    const world = canvasRef.current?.screenToWorld({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
    selection.select(
      {
        kind: element.getAttribute("data-kind") as EntityKind,
        id: element.getAttribute("data-id") ?? "",
      },
      world,
    );
  };

  return (
    <Canvas
      ref={canvasRef}
      id={props.id}
      className={lib.classNames(styles.root, props.className)}
      style={props.style}
      onClick={handleClick}
      viewport={props.viewport}
      defaultViewport={props.defaultViewport}
      onViewportChange={props.onViewportChange}
      bounds={props.bounds ?? data.bounds}
      minZoom={props.minZoom}
      maxZoom={props.maxZoom}
      yAxis={MAP_Y_AXIS}
      role="application"
      aria-roledescription="galaxy map"
      aria-label={props["aria-label"] ?? "Galaxy map"}
    >
      <MapContent
        data={data}
        selected={selection.selected}
        hovered={selection.hovered}
        focusedId={focusedId}
        onHover={selection.hover}
        onCulled={handleCulled}
        selectionEnabled={selectionEnabled}
        hoverEnabled={props.hoverEnabled ?? true}
        highlightColor={props.highlightColor}
        culling={props.culling ?? true}
        maxSystems={props.maxSystems ?? DEFAULT_MAX_SYSTEMS}
        maxLabels={props.maxLabels ?? DEFAULT_MAX_LABELS}
        maxLaneSegments={props.maxLaneSegments ?? DEFAULT_MAX_LANE_SEGMENTS}
        elementIdFor={elementIdFor}
        renderSystemOverlay={props.renderSystemOverlay}
      >
        {props.children}
      </MapContent>
    </Canvas>
  );
}
```

`focusedId` and `visibleRef` are completed in Task 13.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/map src/canvas && npm run typecheck`
Expected: PASS, typecheck exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/map/MapContent.tsx src/map/GalaxyMap.tsx src/map/GalaxyMap.test.tsx
git commit -m "feat(map): add GalaxyMap with selection and hover"
```

---

### Task 13: Keyboard focus

**Files:**

- Create: `src/map/keyboardFocus.ts`
- Modify: `src/map/GalaxyMap.tsx`
- Test: `src/map/keyboardFocus.test.ts`, `src/map/GalaxyMap.keyboard.test.tsx`

**Interfaces:**

- Consumes: `GalaxyMap` (Task 12), `ICullResult`.
- Produces: `nextFocus(visible: readonly string[], current: string | null, direction: 1 | -1): string | null`.

- [ ] **Step 1: Write the failing tests**

Create `src/map/keyboardFocus.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { nextFocus } from "./keyboardFocus";

describe("nextFocus", () => {
  const visible = ["a", "b", "c"];

  it("starts at the highest priority going forward and the lowest going back", () => {
    expect(nextFocus(visible, null, 1)).toBe("a");
    expect(nextFocus(visible, null, -1)).toBe("c");
  });

  it("moves and wraps", () => {
    expect(nextFocus(visible, "a", 1)).toBe("b");
    expect(nextFocus(visible, "c", 1)).toBe("a");
    expect(nextFocus(visible, "a", -1)).toBe("c");
  });

  it("restarts when the current system is not visible", () => {
    expect(nextFocus(visible, "gone", 1)).toBe("a");
  });

  it("returns null with nothing visible", () => {
    expect(nextFocus([], "a", 1)).toBeNull();
  });
});
```

Create `src/map/GalaxyMap.keyboard.test.tsx`:

```tsx
import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockElementSize } from "../testUtils";
import { GalaxyMap } from "./GalaxyMap";
import styles from "./GalaxyMap.module.css";
import type { ISystem } from "./types";

const systems: ISystem[] = [
  { id: "a", name: "Alpha", position: { x: -100, y: -50 }, color: "red" },
  { id: "b", name: "Beta", position: { x: 100, y: 50 }, color: "blue" },
];

function setup(props: Partial<Parameters<typeof GalaxyMap>[0]> = {}) {
  const onSelect = vi.fn();
  const onViewportChange = vi.fn();
  const utils = render(
    <GalaxyMap
      systems={systems}
      spacelanes={[]}
      onSelect={onSelect}
      onViewportChange={onViewportChange}
      {...props}
    />,
  );
  const root = utils.getByRole("application");
  const key = (k: string) => fireEvent.keyDown(root, { key: k });
  const active = () => {
    const id = root.getAttribute("aria-activedescendant");
    return id ? document.getElementById(id) : null;
  };
  return { ...utils, root, key, active, onSelect, onViewportChange };
}

beforeEach(() => {
  mockElementSize(800, 600);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GalaxyMap keyboard", () => {
  it("moves focus through visible systems in priority order with the bracket keys", () => {
    const { key, active, root } = setup();
    expect(root).not.toHaveAttribute("aria-activedescendant");
    key("]");
    expect(active()).toHaveAttribute("data-id", "a");
    key("]");
    expect(active()).toHaveAttribute("data-id", "b");
    key("[");
    expect(active()).toHaveAttribute("data-id", "a");
  });

  it("draws a focus ring", () => {
    const { key, container } = setup();
    key("]");
    expect(container.querySelector(`.${styles.focusRing}`)).not.toBeNull();
  });

  it("selects with Enter or Space and clears with Escape", () => {
    const { key, onSelect } = setup();
    key("]");
    key("Enter");
    expect(onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "a" }),
    );
    key("]");
    key(" ");
    expect(onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "b" }),
    );
    key("Escape");
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it("still pans with arrow keys", () => {
    const { key, onViewportChange } = setup();
    onViewportChange.mockClear();
    key("ArrowLeft");
    expect(onViewportChange).toHaveBeenCalled();
  });

  it("moves focus but does not select when selection is disabled", () => {
    const { key, active, onSelect } = setup({ selectionEnabled: false });
    key("]");
    key("Enter");
    expect(active()).toHaveAttribute("data-id", "a");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("clears focus, selection, and hover together when the system leaves the data", () => {
    const onHover = vi.fn();
    const { key, root, rerender, container, onSelect, onViewportChange } =
      setup({
        onHover,
        defaultSelected: { kind: "system", id: "a" },
      });
    key("]");
    fireEvent.pointerOver(
      container.querySelector(`[data-id='a'] .${styles.glyph}`)!,
      { pointerType: "mouse" },
    );
    rerender(
      <GalaxyMap
        systems={[systems[1]]}
        spacelanes={[]}
        onSelect={onSelect}
        onHover={onHover}
        onViewportChange={onViewportChange}
        defaultSelected={{ kind: "system", id: "a" }}
      />,
    );
    expect(root).not.toHaveAttribute("aria-activedescendant");
    expect(onSelect).toHaveBeenLastCalledWith(null);
    expect(onHover).toHaveBeenLastCalledWith(null);
    expect(container.querySelector(`.${styles.highlight}`)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/map/keyboardFocus.test.ts src/map/GalaxyMap.keyboard.test.tsx`
Expected: FAIL. `./keyboardFocus` cannot be resolved, and the bracket key tests find no `aria-activedescendant`.

- [ ] **Step 3: Implement nextFocus**

Create `src/map/keyboardFocus.ts`:

```ts
/**
 * The system to focus after a bracket key. `visible` is in priority order,
 * highest first. Focus wraps at both ends.
 */
export function nextFocus(
  visible: readonly string[],
  current: string | null,
  direction: 1 | -1,
): string | null {
  if (visible.length === 0) return null;
  const index = current === null ? -1 : visible.indexOf(current);
  if (index < 0)
    return direction === 1 ? visible[0] : visible[visible.length - 1];
  return visible[(index + direction + visible.length) % visible.length];
}
```

- [ ] **Step 4: Wire keyboard focus into GalaxyMap**

In `src/map/GalaxyMap.tsx`:

Add `type KeyboardEvent` to the `react` import, and add:

```ts
import { nextFocus } from "./keyboardFocus";
```

Replace:

```ts
const [focusedId] = useState<string | null>(null);
```

with:

```ts
const [focusedId, setFocusedId] = useState<string | null>(null);
```

Replace the `handleCulled` callback with:

```ts
// Tracks what is drawn, and drops focus from a system that is no longer drawn.
const handleCulled = useCallback(
  (result: ICullResult) => {
    visibleRef.current = result;
    setFocusedId((id) =>
      id !== null && result.systems.some((s) => data.systems[s.index].id === id)
        ? id
        : null,
    );
  },
  [data],
);

const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
  if (event.key === "]" || event.key === "[") {
    event.preventDefault();
    const visible = visibleRef.current.systems.map(
      (s) => data.systems[s.index].id,
    );
    setFocusedId(nextFocus(visible, focusedId, event.key === "]" ? 1 : -1));
    return;
  }
  if (!selectionEnabled) return;
  if ((event.key === "Enter" || event.key === " ") && focusedId !== null) {
    event.preventDefault();
    selection.select({ kind: "system", id: focusedId });
  } else if (event.key === "Escape") {
    event.preventDefault();
    selection.select(null);
  }
};
```

On the `<Canvas>` element, add after `aria-label={...}`:

```tsx
      aria-activedescendant={focusedId === null ? undefined : elementIdFor(focusedId)}
      onKeyDown={handleKeyDown}
```

Delete the comment line `` `focusedId` and `visibleRef` are completed in Task 13. `` if you copied it into the file.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/map src/canvas && npm run typecheck`
Expected: PASS, typecheck exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/map/keyboardFocus.ts src/map/keyboardFocus.test.ts src/map/GalaxyMap.tsx src/map/GalaxyMap.keyboard.test.tsx
git commit -m "feat(map): add keyboard focus and selection"
```

---

### Task 14: Public API swap and removal of v0 code

**Files:**

- Replace: `src/index.ts`, `src/index.test.ts`
- Delete: `src/components/`, `src/types/`, `src/utils/`
- Create: `src/stories/generateGalaxy.ts`, `src/map/GalaxyMap.stories.tsx`

**Interfaces:**

- Consumes: every public piece above.
- Produces: the package's public exports, as listed in `docs/internal/architecture/api-design.md` (atlas phase).

- [ ] **Step 1: Write the failing export test**

Replace `src/index.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import * as pkg from "./index";
// Type-only import: every public type must be exported from the package root.
// Checked by `npm run typecheck`, erased at runtime.
import type {
  EntityKind,
  IBounds,
  ICanvasContext,
  ICanvasHandle,
  ICanvasProps,
  IEntityRef,
  IGalaxyMapHandle,
  IGalaxyMapProps,
  ILaneSegment,
  IPadding,
  IPoint,
  ISize,
  ISpacelane,
  ISystem,
  IViewport,
  IViewportChangeInfo,
  MapEntityEvent,
  YAxis,
} from "./index";

type _ExportSurfaceCheck = [
  EntityKind,
  IBounds,
  ICanvasContext,
  ICanvasHandle,
  ICanvasProps,
  IEntityRef,
  IGalaxyMapHandle,
  IGalaxyMapProps,
  ILaneSegment,
  IPadding,
  IPoint,
  ISize,
  ISpacelane,
  ISystem,
  IViewport,
  IViewportChangeInfo,
  MapEntityEvent,
  YAxis,
];

describe("package root exports", () => {
  it("exports the atlas-phase API", () => {
    expect(Object.keys(pkg).sort()).toEqual([
      "Canvas",
      "GalaxyMap",
      "SpacelaneSegment",
      "SystemGlyph",
      "fitViewport",
      "screenSpaceClassName",
      "useCanvas",
    ]);
  });

  it("has no default export and no v0 exports", () => {
    expect("default" in pkg).toBe(false);
    expect("MapColor" in pkg).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/index.test.ts`
Expected: FAIL. The key list contains `default` and `MapColor`, and typecheck would report missing type exports.

- [ ] **Step 3: Replace the exports and remove the v0 code**

Replace `src/index.ts` with:

```ts
export { Canvas } from "./canvas/Canvas";
export type { ICanvasHandle, ICanvasProps } from "./canvas/Canvas";
export { useCanvas } from "./canvas/CanvasContext";
export type { ICanvasContext } from "./canvas/CanvasContext";
export { fitViewport } from "./canvas/projection";
export { screenSpaceClassName } from "./canvas/screenSpace";
export type { YAxis } from "./canvas/types";
export type { IViewportChangeInfo } from "./canvas/useViewport";
export { GalaxyMap } from "./map/GalaxyMap";
export type { IGalaxyMapHandle, IGalaxyMapProps } from "./map/GalaxyMap";
export { SpacelaneSegment, SystemGlyph } from "./map/primitives";
export type {
  EntityKind,
  IBounds,
  IEntityRef,
  ILaneSegment,
  IPadding,
  IPoint,
  ISize,
  ISpacelane,
  ISystem,
  IViewport,
  MapEntityEvent,
} from "./map/types";
```

Remove the v0 implementation and its tests:

```bash
git rm -r src/components src/types src/utils
```

- [ ] **Step 4: Add the full-scale data generator and stories**

Create `src/stories/generateGalaxy.ts`:

```ts
import type { ISpacelane, ISystem } from "../map/types";

const PALETTE = [
  "#9aa0a6",
  "#e5484d",
  "#3e8ed0",
  "#46a758",
  "#f5d90a",
  "#d6409f",
  "#12a594",
  "#a18072",
];
const SYLLABLES = [
  "ka",
  "ri",
  "on",
  "tel",
  "mar",
  "zu",
  "ven",
  "sha",
  "dor",
  "ix",
  "lo",
  "que",
  "bra",
  "nis",
  "tor",
];

/** Deterministic pseudo-random numbers, so every story run shows the same galaxy. */
function random(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/**
 * A two-arm spiral galaxy in a ±12,000 world, matching app-galaxy-map's
 * coordinate space. Used for full-scale performance checks (NFR-P1).
 */
export function generateGalaxy(
  systemCount: number,
  laneCount: number,
  segmentsPerLane: number,
) {
  const next = random(42);
  const systems: ISystem[] = [];
  while (systems.length < systemCount) {
    const arm = next() < 0.5 ? 0 : Math.PI;
    const radius = Math.sqrt(next()) * 11500;
    const theta = arm + radius / 2600 + (next() - 0.5) * 1.1;
    const x = Math.round(radius * Math.cos(theta) + (next() - 0.5) * 900);
    const y = Math.round(radius * Math.sin(theta) + (next() - 0.5) * 900);
    if (Math.abs(x) > 12000 || Math.abs(y) > 12000) continue;
    const syllables = 2 + Math.floor(next() * 3);
    let name = "";
    for (let i = 0; i < syllables; i++)
      name += SYLLABLES[Math.floor(next() * SYLLABLES.length)];
    const sector =
      Math.floor(
        ((Math.atan2(y, x) + Math.PI) / (2 * Math.PI)) * PALETTE.length,
      ) % PALETTE.length;
    systems.push({
      id: `s${systems.length}`,
      name: name[0].toUpperCase() + name.slice(1),
      position: { x, y },
      color: PALETTE[sector],
    });
  }
  const lanes: ISpacelane[] = [];
  for (let l = 0; l < laneCount; l++) {
    let current = systems[Math.floor(next() * systems.length)];
    let color = current.color;
    const segments: ISpacelane["segments"] = [];
    for (let s = 0; s < segmentsPerLane; s++) {
      const target = systems[Math.floor(next() * systems.length)];
      const destination = {
        x:
          current.position.x +
          Math.sign(target.position.x - current.position.x) *
            150 *
            (0.5 + next()),
        y:
          current.position.y +
          Math.sign(target.position.y - current.position.y) *
            150 *
            (0.5 + next()),
      };
      if (next() < 0.08) color = PALETTE[Math.floor(next() * PALETTE.length)];
      segments.push({
        id: `l${l}-${s}`,
        origin: current.position,
        destination,
        color,
      });
      current = { ...current, position: destination };
    }
    lanes.push({ id: `l${l}`, name: `Lane ${l}`, segments });
  }
  return { systems, lanes };
}
```

Create `src/map/GalaxyMap.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useRef, useState } from "react";
import { generateGalaxy } from "../stories/generateGalaxy";
import { GalaxyMap, type IGalaxyMapHandle } from "./GalaxyMap";
import type { IEntityRef, ISpacelane, ISystem, IViewport } from "./types";

const small: ISystem[] = [
  { id: "core", name: "Core", position: { x: 0, y: 0 }, color: "#f5d90a" },
  {
    id: "north",
    name: "Northreach",
    position: { x: 0, y: 300 },
    color: "#3e8ed0",
  },
  {
    id: "east",
    name: "Eastmarch",
    position: { x: 300, y: 0 },
    color: "#e5484d",
  },
  {
    id: "south",
    name: "Southhold",
    position: { x: 0, y: -300 },
    color: "#46a758",
  },
];
const smallLanes: ISpacelane[] = [
  {
    id: "spine",
    name: "Spine",
    segments: [
      {
        id: "spine-0",
        origin: { x: 0, y: -300 },
        destination: { x: 0, y: 0 },
        color: "#46a758",
      },
      {
        id: "spine-1",
        origin: { x: 0, y: 0 },
        destination: { x: 0, y: 300 },
        color: "#3e8ed0",
      },
    ],
  },
];

const frame = { width: "100%", height: "80vh", background: "#0b0e14" };

const meta: Meta<typeof GalaxyMap> = {
  title: "GalaxyMap",
  component: GalaxyMap,
};
export default meta;
type Story = StoryObj<typeof GalaxyMap>;

export const Basic: Story = {
  render: () => (
    <div style={frame}>
      <GalaxyMap systems={small} spacelanes={smallLanes} />
    </div>
  ),
};

/** 6,000 systems and 500 lanes of 40 segments: use for performance checks. */
export const FullScale: Story = {
  render: function FullScaleStory() {
    const { systems, lanes } = useMemo(() => generateGalaxy(6000, 500, 40), []);
    return (
      <div style={frame}>
        <GalaxyMap systems={systems} spacelanes={lanes} />
      </div>
    );
  },
};

/** A consumer-built route, drawn first so it sits on top, and framed with fitPoints. */
export const Route: Story = {
  render: function RouteStory() {
    const ref = useRef<IGalaxyMapHandle>(null);
    const [showRoute, setShowRoute] = useState(false);
    const route: ISpacelane = {
      id: "route",
      name: "Route",
      className: "story-route",
      segments: [
        {
          id: "r0",
          origin: { x: 300, y: 0 },
          destination: { x: 0, y: 0 },
          color: "#ffffff",
        },
        {
          id: "r1",
          origin: { x: 0, y: 0 },
          destination: { x: 0, y: 300 },
          color: "#ffffff",
        },
      ],
    };
    const toggle = () => {
      setShowRoute(!showRoute);
      if (!showRoute) {
        ref.current?.fitPoints(
          route.segments.flatMap((s) => [s.origin, s.destination]),
          { padding: 60, duration: 500 },
        );
      }
    };
    return (
      <div style={frame}>
        <style>
          {".story-route { stroke-width: 4px; stroke-dasharray: 8 4; }"}
        </style>
        <button onClick={toggle}>
          {showRoute ? "Clear route" : "Show route"}
        </button>
        <GalaxyMap
          ref={ref}
          systems={small}
          spacelanes={showRoute ? [route, ...smallLanes] : smallLanes}
        />
      </div>
    );
  },
};

/** Controlled selection and viewport, as an atlas would sync them to the URL. */
export const Controlled: Story = {
  render: function ControlledStory() {
    const [selected, setSelected] = useState<IEntityRef | null>(null);
    const [viewport, setViewport] = useState<IViewport>({
      center: { x: 0, y: 0 },
      zoom: 1,
    });
    const [settled, setSettled] = useState(viewport);
    return (
      <div style={frame}>
        <pre style={{ color: "#e6e6e6" }}>
          {JSON.stringify({ selected, settled })}
        </pre>
        <GalaxyMap
          systems={small}
          spacelanes={smallLanes}
          selected={selected}
          onSelect={(event) =>
            setSelected(event && { kind: event.kind, id: event.id })
          }
          viewport={viewport}
          onViewportChange={(next, { settled: isSettled }) => {
            setViewport(next);
            if (isSettled) setSettled(next);
          }}
        />
      </div>
    );
  },
};
```

- [ ] **Step 5: Verify everything**

Run: `just test && npm run typecheck && just build && gzip -c dist/esm/index.js | wc -c && rm -rf dist`
Expected: all tests pass, typecheck exits 0, the build writes the three `dist` outputs, and the gzipped ESM bundle is under 51200 bytes (NFR-P9). If it is larger, stop and report the size.

Run: `npm run storybook`, open the printed URL, and check each story renders. Pan, zoom, click a system, and use the Route story's button. Stop Storybook with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add -A src
git commit -m "feat!: replace the v0 map with the Canvas and GalaxyMap rebuild" -m "BREAKING CHANGE: The package now exports GalaxyMap, Canvas, useCanvas, screenSpaceClassName, fitViewport, SystemGlyph, SpacelaneSegment, and their types. The default export, MapColor, IPlanet, legend, and options panel are removed. See MIGRATION.md."
```

---

### Task 15: Documentation and performance check

**Files:**

- Modify: `README.md`, `docs/internal/architecture/overview.md`, `docs/internal/architecture/decisions/adr-0002-transform-and-css-variable-rendering.md`
- Create: `MIGRATION.md`

**Interfaces:**

- Consumes: the final public API from Task 14.

- [ ] **Step 1: Rewrite the README usage sections**

In `README.md`, keep the title, description, and badges. Replace everything from `## Features` to the end of the file with:

````markdown
## Features

- Star systems and multi-segment spacelanes on a pannable, zoomable SVG map.
- Handles 6,000 systems and 20,000 lane segments by drawing only what is in view.
- Priority order decides which systems and labels show when not everything fits.
- Drag, scroll, and pinch on desktop, trackpad, and touch. Gestures never scroll the page.
- Selection, hover, and keyboard navigation, with controlled and uncontrolled modes.
- No built-in legend, infobox, or settings: build your own from the exported primitives.

## Installation

```bash
npm install @outoforbitdev/galaxy-map
```

## Usage

The map fills its container, so give the container a size.

```tsx
import {
  GalaxyMap,
  type ISpacelane,
  type ISystem,
} from "@outoforbitdev/galaxy-map";

// Highest priority first. World y points up.
const systems: ISystem[] = [
  { id: "core", name: "Core", position: { x: 0, y: 0 }, color: "#f5d90a" },
  {
    id: "rim",
    name: "Rimward",
    position: { x: 400, y: -200 },
    color: "#3e8ed0",
  },
];

const spacelanes: ISpacelane[] = [
  {
    id: "main",
    name: "Main Run",
    segments: [
      {
        id: "main-0",
        origin: { x: 0, y: 0 },
        destination: { x: 400, y: -200 },
        color: "#9aa0a6",
      },
    ],
  },
];

export function Atlas() {
  return (
    <div style={{ height: 600 }}>
      <GalaxyMap
        systems={systems}
        spacelanes={spacelanes}
        onSelect={(event) =>
          console.log(event?.kind === "system" ? event.system.name : event)
        }
      />
    </div>
  );
}
```

### Camera control

```tsx
const map = useRef<IGalaxyMapHandle>(null);

map.current?.moveTo({ center: system.position, zoom: 2 }, { duration: 400 });
map.current?.fitPoints(
  route.segments.flatMap((s) => [s.origin, s.destination]),
  { padding: 40 },
);
```

### Routes

Draw a route as a spacelane placed first in `spacelanes`, so it draws on top and is never culled. Give it a `className` and style it with ordinary CSS. The class goes on the lane's group, and the lane's paths inherit from it:

```css
.route {
  stroke-width: 4px;
  stroke-dasharray: 8 4;
}
```

### Overlays

`renderSystemOverlay` draws content with each visible system, in pixels relative to its center. Wrap it in `useCallback`, or every system re-renders whenever the map does. Clicking overlay content selects the system unless your handler calls `event.preventDefault()`.

### Theming

Style the map with your own classes. The map's defaults have zero specificity, so your rules always win.

- **Map-wide:** pass `className` to `GalaxyMap`. `font` and `fill` set the label font and color, `color` sets the highlight and selection color, and `stroke-width` sets the default lane width. The `highlightColor` prop also sets the highlight color, and takes priority over the map's class.
- **One system or lane:** set `className` on the `ISystem` or `ISpacelane`. The class goes on the entity's group, so properties like `font`, `fill`, and `stroke-width` apply to its label or lane paths. Use descendant selectors, such as `.capital text`, to target one part.

```css
.my-map {
  font:
    14px Georgia,
    serif;
  fill: #cde;
  color: gold;
}
```

### Legends

`SystemGlyph` and `SpacelaneSegment` draw exactly what the map draws:

```tsx
<svg width={16} height={16}>
  <SystemGlyph x={8} y={8} color={faction.color} />
</svg>
```

See [the API design](./docs/internal/architecture/api-design.md) for every prop and method, and [MIGRATION.md](./MIGRATION.md) to upgrade from v0.
````

- [ ] **Step 2: Write the migration guide**

Create `MIGRATION.md`:

```markdown
# Migrating from v0

The rebuild replaces the whole API. The map no longer renders a legend or options panel, colors are CSS values instead of an enum, and planets are now systems.

## Imports

| v0                                                  | Now                                                      |
| --------------------------------------------------- | -------------------------------------------------------- |
| `import GalaxyMap from "@outoforbitdev/galaxy-map"` | `import { GalaxyMap } from "@outoforbitdev/galaxy-map"`  |
| `MapColor`                                          | Removed. Pass any CSS color string.                      |
| `IPlanet`                                           | `ISystem`                                                |
| `ISpacelane`, `ISpaceLaneSegment`                   | `ISpacelane`, `ILaneSegment`. Segments now need an `id`. |
| `IMapCoordinate`, `IMapDimensions`                  | `IPoint`, `IBounds`                                      |
| `IRenderLimits`, `ILegendEntry`, `IMapOptions`      | Removed.                                                 |

## Props

| v0                                            | Now                                                                                       |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `planets`                                     | `systems`, in priority order. The array order decides which systems show when zoomed out. |
| `spacelanes`                                  | `spacelanes`, in priority order.                                                          |
| `dimensions`                                  | `bounds`, optional. Defaults to the data's extent.                                        |
| `renderLimits`                                | `maxSystems`, `maxLabels`, `maxLaneSegments`, or `culling={false}`.                       |
| `zoom.initial`, `initialCenter`               | `defaultViewport={{ center, zoom }}`. Zoom is now screen pixels per world unit.           |
| `zoom.min`, `zoom.max`                        | `minZoom`, `maxZoom`.                                                                     |
| `onPlanetSelect`, `onSpaceLaneSelect`         | `onSelect(event)`. Check `event.kind`.                                                    |
| `selectedPlanetId`, `selectedSpaceLaneId`     | `selected={{ kind: "system", id }}`.                                                      |
| `onZoomChange`, `onCenterChange`              | `onViewportChange(viewport, { settled })`.                                                |
| `legendEntries`                               | Removed. Build a legend with `SystemGlyph` and `SpacelaneSegment`.                        |
| `mapOptions`, `leftChildren`, `rightChildren` | Removed. Render your own UI next to the map.                                              |

## Handle

`ref.current.zoomTo({ coordinate, zoom })` is now `ref.current.moveTo({ center, zoom }, { duration })`.

## Coordinates

World y still points up, as in v0.
```

- [ ] **Step 3: Align the architecture doc with the implementation**

In `docs/internal/architecture/overview.md`, in the "Event delegation" section, replace:

```markdown
Nodes carry `data-kind` and `data-id` but no handlers. `GalaxyMap` attaches one handler per pointer event type (`click`, `pointerover`, `pointerout`) to its root group and resolves the entity with `event.target.closest("[data-kind]")`.
```

with:

```markdown
Nodes carry `data-kind` and `data-id` but no handlers. The `click` handler is on the canvas root, passed through the `onClick` prop, because a click on empty space targets the `<svg>`, outside the map's group. The hover handlers (`pointerover`, `pointerout`) are on the map's root group. Each resolves the entity with `event.target.closest("[data-kind]")`.
```

In the `map/constants.ts` table of the "Tuning constants" section, add these rows after `LANE_HIT_WIDTH_PX`:

```markdown
| `LANE_HALO_WIDTH_PX` | 8 | Width of the lane selection halo and hover highlight. |
| `SELECTION_RING_GAP_PX` | 3 | Gap between a glyph and its selection ring. |
| `HIGHLIGHT_RING_GAP_PX` | 3 | Gap between a glyph and its hover or focus ring. |
| `LABEL_HEIGHT_PX` | 14 | Label box height used for collisions. |
| `FALLBACK_CHAR_WIDTH_PX` | 7 | Estimated character width when text cannot be measured. |
| `COLLISION_CELL_PX` | 64 | Size of the screen-space buckets used for collision lookups. |
| `INDEX_CELLS_PER_AXIS` | 64 | Spatial index cells along the larger side of the data's extent. |
```

In the `canvas/constants.ts` table, add after `PINCH_ZOOM_SENSITIVITY`:

```markdown
| `WHEEL_LINE_HEIGHT_PX` | 16 | Pixels per line when a wheel event reports its delta in lines. |
| `DEFAULT_ZOOM` | 1 | Zoom with no viewport, default viewport, or bounds to fit. |
```

In the `map/constants.ts` table, delete the `LANE_STROKE_WIDTH_PX` row. The default lane width is now defined once, in `GalaxyMap.module.css`.

In `docs/internal/architecture/api-design.md`, add a row to the `GalaxyMap` props table after `hoverEnabled`:

```markdown
| `highlightColor` | `string` | `#ffffff` | Any CSS color for hover, focus, and selection highlights. Set only on highlight elements, so overlays using `currentColor` are unaffected. |
```

In `docs/internal/architecture/overview.md`, replace the paragraph that begins "Values that consumers can theme" with:

```markdown
Visual defaults that consumers may restyle (label font and fill, lane width, highlight color) are defined once in `GalaxyMap.module.css`, with zero-specificity `:where()` rules on the map root that children inherit. Consumers restyle with their own classes: `className` on `GalaxyMap` for the whole map, or on a system or spacelane for that entity's group. Where culling depends on a styled value, it reads the computed style, as it does for the label font. A consumer that changes a glyph's radius with CSS should know culling still uses `GLYPH_RADIUS_PX`.
```

Run: `just lint`
Expected: exits 0. Prettier may realign the tables.

- [ ] **Step 4: Measure real-browser performance**

This closes the open Firefox risk in ADR-0002. It needs a person at the keyboard.

1. Run `npm run storybook` and open the **GalaxyMap / Full Scale** story in Chrome, Firefox, and Safari, each in a normal window.
2. Open each browser's performance tools with an FPS readout: Chrome DevTools, Command Menu, "Show frame rendering stats". Firefox: Performance tab, record. Safari: Develop menu, Show Web Inspector, Timelines, record.
3. For 10 seconds in each browser, zoom from the whole galaxy to a single sector and back with the scroll wheel or trackpad, then drag-pan across the galaxy.
4. Record the typical and worst frame rates for each browser.

In `docs/internal/architecture/decisions/adr-0002-transform-and-css-variable-rendering.md`, add a section before `## Consequences`:

```markdown
## Real-browser measurements

Full Scale story, 6,000 systems and 500 lanes of 40 segments, measured on <machine and date>.

| Browser | Typical fps | Worst fps |
| ------- | ----------- | --------- |
| Chrome  | <value>     | <value>   |
| Firefox | <value>     | <value>   |
| Safari  | <value>     | <value>   |
```

Fill in every `<...>` with the measured values. If any browser's typical rate is below 60 fps on desktop, stop and report it before continuing: NFR-P2 is not met, and the mitigations in ADR-0002 need a decision.

- [ ] **Step 5: Commit**

```bash
git add README.md MIGRATION.md docs/internal/architecture
git commit -m "docs: add usage, migration guide, and performance results for the rebuild"
```
