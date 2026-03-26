# Tasks: GalaxyMap Beta

Implementation tasks derived from the [Technical Design](./technical-design.md) and [Product Requirements](./product-requirements.md). Tasks are grouped into phases that respect implementation dependencies — later phases depend on earlier ones. Tasks within a phase may be parallelized unless a `Depends on` note says otherwise.

---

## Phase 0 — Prerequisites

### 0.1 Install and configure a test runner

Neither a test runner nor a React testing library is currently installed. Select and install a test runner (e.g., Vitest) and a React testing library (e.g., React Testing Library). Add a working `test` script to `package.json` and verify a trivial test passes.

> The TDD defers specific package choices to implementation time. Confirm selections before proceeding.

**References:** TDD § Tech Stack

### 0.2 Install and configure Storybook

Storybook is not currently installed or configured. Install Storybook for React and add a working `storybook` script to `package.json`. Verify that a trivial story renders.

**References:** TDD § Tech Stack

---

## Phase 1 — Foundation

### 1.1 Create directory structure and stub files

Create the full directory structure specified in the TDD under `src/components/GalaxyMap/` and `src/utils/`. Stub each file with an empty export or a `// TODO` comment. This makes imports resolvable across the codebase before any implementation begins.

**References:** TDD § File Structure

### 1.2 Define all public types

Implement `src/types/index.ts` with all public interfaces and enums: `IPlanet`, `ISpacelane`, `ISpaceLaneSegment`, `IMapCoordinate`, `IMapDimensions`, `IRenderLimits`, `ILegendEntry`, `IMapOptions`, `IGalaxyMapHandle`, and `MapColor`. These types are the contracts that every other task depends on.

**References:** PRD § Data Model, PRD § Component API

### 1.3 Create `constants.ts`

Implement `src/components/GalaxyMap/constants.ts` with the three named debounce durations. Initial values are defaults to be tuned during implementation; keeping them named and centralized makes them easy to adjust independently.

```typescript
export const PLANET_SIZE_DEBOUNCE_MS = 100; // planet dot zoom-bucket update
export const LABEL_COLLISION_DEBOUNCE_MS = 100; // label placement recomputation
export const RENDER_LIMIT_DEBOUNCE_MS = 300; // options panel input settling
```

**References:** TDD § Constant Object Size During Zoom § Named debounce constants

---

## Phase 2 — Pure utilities

All utilities in this phase are pure functions with no React dependency. Each task includes unit tests. These can be written and tested before any component exists.

### 2.1 Implement coordinate utilities

Implement `src/utils/coordinates.ts`:

- `mapCenter(dimensions)` — returns the midpoint of `IMapDimensions`
- `computeViewport(center, zoom, containerWidth, containerHeight)` — returns the visible region as `IViewport`
- `screenToMap(screenX, screenY, center, zoom, svgWidth, svgHeight)` — converts a screen position to a map coordinate (used for zoom-to-cursor and click hit testing)
- `mapToScreen(mapX, mapY, center, zoom, svgWidth, svgHeight)` — converts a map coordinate to a screen position (used by `PlanetLabelLayer`)

**Unit tests:** Viewport dimensions at various zoom levels; center calculation from `IMapDimensions`; round-trip coordinate conversion (screen → map → screen).

**References:** TDD § SVG Coordinate System and Transform, TDD § Render Cap Selection: `selectRendered` § Viewport Computation

### 2.2 Implement animation utilities

Implement `src/utils/animate.ts`:

- `lerp(a, b, t)` — linear interpolation between two values
- `easeInOutCubic(t)` — ease-in-out cubic easing function

**Unit tests:** Boundary values (`t=0`, `t=1`) return the start and end values exactly; midpoint (`t=0.5`) is symmetric.

**References:** TDD § Zoom and Pan: `useZoomPan` § `animateTo`

### 2.3 Implement `selectRendered`

Implement `src/utils/selectRendered.ts`:

- `isPlanetInViewport(planet, viewport)` — point-in-rect test for a planet's position
- `isPointInViewport(point, viewport)` — point-in-rect test for an `IMapCoordinate`
- `isSpaceLaneInViewport(spacelane, viewport)` — true if any segment endpoint is in the viewport
- `selectRendered(planets, spacelanes, limits, viewport)` — viewport cull then render cap

**Unit tests:** Planets at and just outside viewport boundary; spacelanes with one endpoint in and one out; render cap applied after culling (not before); all-or-nothing spacelane behavior when cap is reached mid-list; empty input lists.

**References:** TDD § Render Cap Selection: `selectRendered`

**Depends on:** 1.2 (types)

### 2.4 Implement `orderForRendering`

Implement `src/utils/orderForRendering.ts`:

- `orderForRendering<T extends { id: string }>(items, selectedId?)` — reverses the input list (so index 0 paints on top in SVG document order) and moves the selected item to the very end (top of stack)

**Unit tests:** No selected item returns reversed list; selected item at various input positions always ends up last; single-item list; empty list.

**References:** TDD § Key Design Decisions § Within-layer render order: reversed priority, selected item last

### 2.5 Implement label collision utilities

Implement `src/utils/labelCollision.ts`:

- `estimateLabelBox(planet, zoom)` — estimates the label bounding box in map coordinates from character count and fixed pixel constants divided by zoom
- `overlapsAny(box, placed)` — AABB overlap test against a list of already-placed boxes
- `computeLabelSet(planets, limit, zoom, selectedPlanetId?)` — runs collision detection and returns `Set<string>` of planet IDs that should receive labels; selected planet is always a candidate and receives first consideration

**Unit tests:** Overlapping labels are skipped in priority order; non-overlapping labels are all included; selected planet included even beyond the limit; label limit respected after collision filtering; empty planet list returns empty set.

**References:** TDD § Label Collision Detection: `useLabelSet` § Algorithm, § Bounding Box Estimation

---

## Phase 3 — Hooks

### 3.1 Implement `useZoomPan`

Implement `src/components/GalaxyMap/hooks/useZoomPan.ts`. This hook owns all zoom and pan state and produces the SVG transform string consumed by `ZoomableCanvas`.

Responsibilities:

- Mouse wheel zoom with zoom-to-cursor formula (point under cursor stays fixed)
- Click-and-drag pan (1:1 map-coordinate delta)
- Single-finger touch pan; two-finger pinch zoom with simultaneous pan
- `animateTo` — rAF interpolation, ease-in-out cubic, 400ms fixed duration, cancellable on any gesture start
- `isDragging` ref — set on `mousedown`/`touchstart`, cleared on `mouseup`/`touchend`
- Zoom bounds clamping to `zoom.min` / `zoom.max`
- `onZoomChange` / `onCenterChange` callbacks throttled to one call per animation frame via a rAF gate

**Unit tests:** Zoom is clamped to bounds; `onZoomChange` fires with the correct value; `onCenterChange` fires with the correct value; `animateTo` updates state to the target.

**References:** TDD § Zoom and Pan: `useZoomPan`

**Depends on:** 1.2 (types), 1.3 (constants), 2.1 (coordinate conversion), 2.2 (animation utilities)

### 3.2 Implement `useLabelSet`

Implement `src/components/GalaxyMap/hooks/useLabelSet.ts`. Wraps `computeLabelSet` in a debounced `useEffect`, returning `Set<string>`. The debounce duration is `LABEL_COLLISION_DEBOUNCE_MS` from `constants.ts`. Receives `renderedPlanets` (already viewport-culled and capped) rather than the full planet list, so labels can never apply to unrendered planets.

**Unit tests:** Intermediate zoom/pan changes during the debounce window do not trigger recomputation; output updates correctly after the debounce settles; selected planet ID is forwarded to `computeLabelSet`.

**References:** TDD § Label Collision Detection: `useLabelSet` § Debounce Integration, § Label limit vs. planet render limit

**Depends on:** 1.3 (constants), 2.5 (`computeLabelSet`)

---

## Phase 4 — SVG layer components

### 4.1 Implement `SpacelaneLayer`

Implement `src/components/GalaxyMap/SpacelaneLayer/SpacelaneLayer.tsx`. Renders an `ISpacelane[]` as grouped `<line>` elements inside the SVG transform group.

- Applies `orderForRendering(spacelanes, selectedSpaceLaneId)` before mapping
- Each segment renders two overlapping `<line>` elements: a visual line and a wider hit-area line, both with `vectorEffect="non-scaling-stroke"`
- Selected spacelane segments receive an increased `strokeWidth`
- Click handler on each `<g>` is gated behind `isDragging.current` from `useZoomPan`

**References:** TDD § Spacelane Rendering, TDD § Constant Object Size During Zoom § Spacelane strokes — `vectorEffect="non-scaling-stroke"`

**Depends on:** 1.2 (types), 2.4 (`orderForRendering`), 3.1 (`isDragging` ref)

### 4.2 Implement `PlanetDotLayer`

Implement `src/components/GalaxyMap/PlanetDotLayer/PlanetDotLayer.tsx` and `PlanetDotLayer.module.css`. Renders an `IPlanet[]` as `<circle>` elements inside the SVG transform group.

- Applies `orderForRendering(planets, selectedPlanetId)` before mapping
- Dot radius is controlled by a CSS zoom-bucket class on the layer `<g>`, not an inline attribute
- A debounced effect (`PLANET_SIZE_DEBOUNCE_MS`) updates the active class when zoom settles; during active zoom the dots scale with the transform
- Bucket boundaries and `r` values should be calibrated against the visual target in `docs/internal/features/galaxy-map-beta/assets/example_map.jpg`
- Click handler gated behind `isDragging.current`

**References:** TDD § Constant Object Size During Zoom § Planet dots — CSS zoom-bucket classes, TDD § Key Design Decisions § Three-technique approach to constant object size

**Depends on:** 1.2 (types), 1.3 (constants), 2.4 (`orderForRendering`), 3.1 (`isDragging` ref)

### 4.3 Implement `PlanetLabelLayer`

Implement `src/components/GalaxyMap/PlanetLabelLayer/PlanetLabelLayer.tsx`. Renders `<text>` elements for each planet whose ID is in `labelSet`. This component is rendered **outside** the SVG transform group as a sibling, so it receives explicit positioning data.

- Receives `renderedPlanets`, `labelSet`, `selectedPlanetId`, `zoom`, `center`, `svgWidth`, `svgHeight`
- Screen position computed per label using `mapToScreen`; updates on every render (lightweight attribute update)
- Font size is a fixed CSS value; labels are never scaled by the zoom transform

**References:** TDD § Constant Object Size During Zoom § Planet labels — screen-space rendering, TDD § Component Hierarchy

**Depends on:** 1.2 (types), 2.1 (`mapToScreen`)

---

## Phase 5 — Canvas

### 5.1 Implement `ZoomableCanvas`

Implement `src/components/GalaxyMap/ZoomableCanvas/ZoomableCanvas.tsx`. Renders the `<svg>` element with two direct children:

1. `<g transform={svgTransform}>` containing `SpacelaneLayer` and `PlanetDotLayer`
2. `PlanetLabelLayer` as a sibling of the transform group (outside it)

Attaches wheel, mouse, and touch event handlers from `useZoomPan`. Tracks SVG pixel dimensions needed for coordinate conversion and label positioning.

**References:** TDD § Component Hierarchy, TDD § SVG Coordinate System and Transform § Transform Formula

**Depends on:** 3.1 (`useZoomPan`), 4.1, 4.2, 4.3

---

## Phase 6 — Overlay components

### 6.1 Implement `MapLegend`

Implement `src/components/GalaxyMap/MapLegend/MapLegend.tsx` and `MapLegend.module.css`. Collapsible panel rendered only when `legendEntries` is provided and non-empty.

- Each entry renders a mini-SVG indicator (round dot → short line → round dot, all in `entry.color`) alongside the entry label; `entry.id` is used as the React key
- Initial expanded state determined once at mount via `window.matchMedia("(min-width: 768px)")`; not reactive to resize

**References:** TDD § Key Design Decisions § Legend entries use a mini-SVG indicator, TDD § Key Design Decisions § Panel initial collapse state is responsive

**Depends on:** 1.2 (`ILegendEntry`, `MapColor`)

### 6.2 Implement `MapOptions`

Implement `src/components/GalaxyMap/MapOptions/MapOptions.tsx` and `MapOptions.module.css`. Collapsible panel with numeric inputs for planet, planet label, and spacelane render limits.

- Local `draft` state mirrors inputs; a debounced effect (`RENDER_LIMIT_DEBOUNCE_MS`) propagates to `setCurrentLimits` in `GalaxyMap`
- Warning indicator shown when any `currentLimits` field exceeds the corresponding `props.renderLimits` field
- Planet labels input maximum may optionally be capped at `currentLimits.planets` (see TDD § State Management § Optional label cap)
- `customOptions` rendered below the built-in controls
- Initial expanded state determined once at mount via `window.matchMedia`

**Unit tests:** Debounce prevents intermediate propagation to `setCurrentLimits`; limits can be set both below and above the consumer default; warning indicator appears when a limit exceeds the default; warning absent when at or below default.

**References:** TDD § Render Limit Controls: Debounced Draft State, TDD § State Management § Optional label cap

**Depends on:** 1.2 (`IRenderLimits`), 1.3 (`RENDER_LIMIT_DEBOUNCE_MS`)

### 6.3 Implement `MapOverlay`

Implement `src/components/GalaxyMap/MapOverlay/MapOverlay.tsx` and `MapOverlay.module.css`. Full-width flex-row container, absolutely positioned to overlay the map canvas without affecting its layout. Five named slots in order: `leftChildren`, `MapLegend`, `children` (flex: 1), `MapOptions`, `rightChildren`. Slots not provided are absent from the DOM.

**References:** TDD § Key Design Decisions § MapOverlay as a sibling, not a child, of ZoomableCanvas, TDD § Key Design Decisions § Overlay layout: flex row with five named slots

**Depends on:** 6.1, 6.2

---

## Phase 7 — Root component

### 7.1 Implement `GalaxyMap`

Implement `src/components/GalaxyMap/GalaxyMap.tsx`. This is the root component that owns all state and wires everything together.

Responsibilities:

- `useZoomPan` for `zoom`, `center`, `svgTransform`, `animateTo`, `isDragging`
- `useState` for `currentLimits`, initialized from `props.renderLimits`
- `containerSize` via `ResizeObserver` on the wrapper div, stored in a `useRef`
- `computeViewport` called each render from `center`, `zoom`, and `containerSize`
- `selectRendered` called each render with the current viewport and `currentLimits`
- `useLabelSet` called with `renderedPlanets`, `currentLimits.planetLabels`, `zoom`, `selectedPlanetId`
- `useImperativeHandle` exposing `IGalaxyMapHandle.zoomTo` → `animateTo`
- `IComponentProps` forwarded to the container div via `lib.getDomProps()`
- Default center: `mapCenter(dimensions)` when `initialCenter` is not provided

**Unit tests:** Updating `planets` or `spacelanes` props does not reset zoom or pan state; `onZoomChange` fires with the correct zoom value; `onCenterChange` fires with the correct center value; `zoomTo` navigates to the target coordinate and zoom.

**References:** TDD § State Management, TDD § Data Flow, TDD § Imperative Handle

**Depends on:** all Phase 3–6 tasks

---

## Phase 8 — Exports

### 8.1 Update `src/index.ts`

Export all public types and the `GalaxyMap` component from the package root: `GalaxyMap` (default), `IGalaxyMapHandle`, `IPlanet`, `ISpacelane`, `ISpaceLaneSegment`, `IMapCoordinate`, `IMapDimensions`, `IRenderLimits`, `ILegendEntry`, `IMapOptions`, `MapColor`.

Verify that a consumer can import everything they need from the package root without importing from internal paths.

**References:** TDD § File Structure (`index.ts`)

**Depends on:** 7.1

---

## Phase 9 — Storybook stories

### 9.1 Write Storybook stories

Write all stories specified in the PRD. Stories serve as development sandboxes and the basis for visual regression testing.

Required stories:

- Default map with a representative set of planets and spacelanes
- Map at render cap limits (planets and spacelanes at maximum)
- Dense planet layout demonstrating label collision resolution
- Multi-segment spacelane with varying colors per segment
- Selected planet and selected spacelane states
- Zoom bounds (min and max) enforced
- Empty state (no planets, no spacelanes)
- Legend visible with entries; legend absent without entries
- Legend collapsed and expanded states
- Options panel with render limit controls at various values (including zero and above-default for each field)
- Options panel with a limit above the consumer's default, showing the warning indicator
- Options panel collapsed and expanded states
- Legend and options panel on a simulated small-screen viewport (both collapsed by default)
- Options panel with `customOptions` content injected
- All five overlay slots populated: `leftChildren`, legend, `children`, options, `rightChildren`
- Center `children` slot only (no legend, no `leftChildren`/`rightChildren`)

**References:** PRD § Testing Requirements § UI Tests (Storybook)

**Depends on:** 8.1
