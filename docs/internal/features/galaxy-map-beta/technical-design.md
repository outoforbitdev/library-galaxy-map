# Technical Design: GalaxyMap Beta

## Overview

This document describes the internal architecture, algorithms, and implementation decisions for the GalaxyMap beta. It addresses all open questions from the [Product Requirements](./product-requirements.md) and specifies the component hierarchy, state management, zoom/pan mechanics, render cap selection, and label collision detection.

---

## Tech Stack

The beta adds no new runtime dependencies. All implementation relies on the existing stack: React 19, react-dom, and `@outoforbitdev/ood-react`. Animation, collision detection, and coordinate math are implemented with browser-native APIs (`requestAnimationFrame`, `setTimeout`) and plain TypeScript.

New **dev dependencies** are permitted for testing:

| Package                                               | Purpose                                     |
| ----------------------------------------------------- | ------------------------------------------- |
| Storybook                                             | Visual component development and UI testing |
| A React testing library (e.g., React Testing Library) | Unit tests for hooks and components         |
| A test runner (e.g., Vitest or Jest)                  | Test execution                              |

Specific package choices for the testing stack should be confirmed before implementation begins.

---

## Resolved PRD Open Questions

### 1. Animated `zoomTo`

**Decision: `requestAnimationFrame` interpolation.**

A `requestAnimationFrame`-based animation loop interpolates `zoom` and `center` from their current values to the target over a fixed 400ms duration with ease-in-out cubic easing. This approach gives full control over cancellation (e.g., aborting the animation when the user initiates a drag mid-flight) and does not require toggling CSS transitions on and off.

CSS transitions were rejected because composing them with active user gestures (drag, pinch) is fragile — removing the transition during interaction to prevent fighting user input introduces frame-level timing issues.

Animation libraries (e.g., Framer Motion, react-spring) were not considered. The project constraint prohibits new runtime dependencies without justification, and the rAF approach is sufficient for this use case.

### 2. Spacelane label display

**Decision: `ISpacelane.name` is optional; not displayed in the beta.**

Spacelane names are not rendered anywhere in the beta. The field is retained in the data model as optional (`name?: string`) so that consumers can carry the value for their own use (tooltips, sidebars, external lists). Requiring it as a mandatory field with no display location would be misleading.

### 3. Viewport culling

**Decision: In scope for the beta.**

Render caps apply to the viewport-visible subset of each input list. Items outside the current viewport are filtered out before caps are applied, so zooming into a region reveals lower-priority items there rather than them being permanently displaced by off-screen higher-priority items. See [Render Cap Selection](#render-cap-selection-selectrendered) for the updated algorithm.

### 4. `onZoomChange` / `onCenterChange` fire rate

**Decision: Fire on every pointer/touch event, throttled to one call per animation frame.**

Callbacks are dispatched via a `requestAnimationFrame` gate so they fire at most once per rendered frame (~60 times/second). Consumers are responsible for debouncing within their own callback handlers if they need to trigger expensive work. This is documented in the component API.

---

## Component Hierarchy

```
GalaxyMap
├── owns: zoom, center, labelSet, currentLimits
├── owns: containerSize (via ResizeObserver on wrapper div)
├── exposes: IGalaxyMapHandle via useImperativeHandle
│
├── ZoomableCanvas
│   ├── owns: drag state, pinch state
│   ├── renders: <svg>
│   │   ├── <g transform="...">  ← single transformed group
│   │   │   ├── SpacelaneLayer      (empty when currentLimits.spacelanes = 0)
│   │   │   │   └── per spacelane: <g onClick>
│   │   │   │       └── per segment: <line vectorEffect="non-scaling-stroke" />
│   │   │   │                      + invisible hit-area <line vectorEffect="non-scaling-stroke" />
│   │   │   └── PlanetDotLayer      (empty when currentLimits.planets = 0)
│   │   │       └── per planet: <circle /> (radius via CSS zoom-bucket class)
│   │   └── PlanetLabelLayer        (sibling of transform group; screen-space coordinates)
│   │       └── per labeled planet: <text />
│
└── MapOverlay                  ← flex row, full width across top of map
    ├── {leftChildren}          ← leftmost slot
    ├── MapLegend               ← collapsible; absent when legendEntries not provided
    ├── {children}              ← center slot, grows to fill available space
    ├── MapOptions              ← collapsible; render limit controls + customOptions
    └── {rightChildren}         ← rightmost slot
```

**Layer ordering** within the SVG: the transformed `<g>` (containing spacelanes and planet dots) renders first, then `PlanetLabelLayer` as a sibling outside it. Within the transformed group, spacelanes render first (bottom), then planet dots. This ensures labels always render above all map content and are never occluded by planet markers or spacelane lines.

**Within-layer ordering:** Each layer receives items in priority order (index 0 = highest priority) from `selectRendered`, then applies `orderForRendering` before mapping to SVG elements. This function reverses the array (so the highest-priority item is last in the DOM and paints on top) and then moves the selected item, if any, to the very end — ensuring the selected item always renders on top of all others regardless of its position in the input list. `selectRendered` is not responsible for this ordering — it always returns items in priority order, and the rendering concern stays in the layer components.

**Overlay ordering:** `MapOverlay` is a sibling of `ZoomableCanvas`, positioned absolutely to fill the same container. Within `MapOverlay`, slots are ordered left to right: `leftChildren`, `MapLegend`, `children`, `MapOptions`, `rightChildren`. The `children` center slot sits between the two built-in panels.

### Component Responsibilities

| Component          | Responsibility                                                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `GalaxyMap`        | Owns all state; computes viewport; runs selectRendered; wires callbacks and ref; accepts and forwards `IComponentProps` to container div |
| `ZoomableCanvas`   | Renders the SVG; owns drag/pinch gesture state; fires zoom and pan events                                                                |
| `SpacelaneLayer`   | Renders selected spacelanes as grouped `<line>` segments                                                                                 |
| `PlanetDotLayer`   | Renders selected planets as `<circle>` elements                                                                                          |
| `PlanetLabelLayer` | Renders collision-filtered planet labels as `<text>` elements; positioned in screen space outside the zoom transform                     |
| `MapOverlay`       | Flex-row container spanning the top of the map; hosts all five overlay slots                                                             |
| `MapLegend`        | Collapsible panel; renders `legendEntries` as mini-SVG indicator list; absent when entries are absent or empty                           |
| `MapOptions`       | Collapsible panel; render limit controls + `customOptions`; calls back into GalaxyMap                                                    |

---

## State Management

`GalaxyMap` extends `IComponentProps` from `@outoforbitdev/ood-react`. DOM props are forwarded to the container `div` using `lib.getDomProps()`, consistent with the alpha and other components in the library.

`GalaxyMap` owns the following state:

```typescript
const [zoom, setZoom] = useState<number>(props.zoom?.initial ?? 1);
const [center, setCenter] = useState<IMapCoordinate>(
  props.initialCenter ?? mapCenter(props.dimensions),
);
const [labelSet, setLabelSet] = useState<Set<string>>(new Set());
const [currentLimits, setCurrentLimits] = useState<IRenderLimits>(
  props.renderLimits,
);
```

- **`zoom`** — current zoom level, clamped to `[zoom.min, zoom.max]`.
- **`center`** — the map coordinate currently at the center of the viewport.
- **`labelSet`** — the set of planet IDs that have been granted a label by the collision detection algorithm. Updated via debounced recalculation.
- **`currentLimits`** — the active render limits, initialized from `props.renderLimits` and subsequently controlled by the options panel. The user may set any field above `props.renderLimits`; the prop values are the initial defaults and are used only to detect when the user has exceeded the consumer's recommendation. Not synchronized back to props.

`labelSet` is separated from render cap selection because the two have different update frequencies: render cap selection is synchronous with prop and viewport changes, while label collision is debounced and zoom-dependent.

`currentLimits` is separate from `props.renderLimits`. The prop is the consumer's recommended default and is used for two purposes: initializing `currentLimits` on mount, and detecting when the user has raised a limit above the recommendation (to optionally show a warning). `currentLimits` is the live value used for rendering and may be lower or higher than the prop. If `props.renderLimits` changes after mount, `currentLimits` is not updated — the user's manual adjustments are preserved.

**Controls upper bound:** The options panel controls have no hard maximum enforced by the component. To avoid unbounded number inputs, the implementation should constrain controls to a practical ceiling — a reasonable approach is `max(currentLimits.X, props.renderLimits.X) * 2`, which always allows the user to at least double the consumer's default while keeping the control range sensible. The exact ceiling is an implementation detail.

**Optional label cap:** The planet labels control's upper bound may optionally be capped at the current `currentLimits.planets` value rather than the doubled-default ceiling. Since labels can only apply to rendered planets by construction, a label limit above the planet limit is always a no-op. Capping the control would prevent a misleadingly large label input when planets is set to 0. This linkage is not required — the result is correct either way — but it is a reasonable UX enhancement to apply during implementation.

**Warning indicator:** `MapOptions` compares each `currentLimits` field to the corresponding `props.renderLimits` field. If `currentLimits.planets > props.renderLimits.planets` (or either other field), a warning indicator is shown adjacent to that control. The indicator is informational only and does not prevent the user from keeping the higher value.

`GalaxyMap` also tracks `containerSize: { width: number; height: number }` via a `ResizeObserver` attached to its wrapper `div`. This is needed to compute the viewport rectangle in map coordinates. It is not React state — it is stored in a `useRef` and read synchronously during render. If the container size has not yet been measured, the viewport defaults to the full `dimensions` bounds.

---

## SVG Coordinate System and Transform

### Coordinate Space

The SVG element's `viewBox` is **not** set to `dimensions`. Instead, the SVG fills its container with no viewBox (or `viewBox="0 0 svgWidth svgHeight"` in pixel space). Map coordinates are applied to content elements directly, and the entire content group is transformed to implement zoom and pan.

The center of the SVG in pixel space is `(svgWidth / 2, svgHeight / 2)`. The default map center (when `initialCenter` is not provided) is the midpoint of `dimensions`.

### Transform Formula

The transform applied to the content `<g>` element:

```
translate(svgWidth/2, svgHeight/2)
scale(zoom)
translate(-center.x, -center.y)
```

This positions `center` (a map coordinate) at the center of the screen, then scales around it.

As an SVG `transform` attribute string:

```
translate({svgWidth/2}, {svgHeight/2}) scale({zoom}) translate({-center.x}, {-center.y})
```

### Coordinate Conversion

Converting a screen position `(sx, sy)` to map coordinates given the current state:

```
mapX = (sx - svgWidth/2) / zoom + center.x
mapY = (sy - svgHeight/2) / zoom + center.y
```

This is used when determining which planet or spacelane segment was clicked, and when computing the new center after a zoom-to-cursor operation.

---

## Zoom and Pan: `useZoomPan`

All zoom/pan logic lives in a `useZoomPan` hook. `GalaxyMap` calls this hook and passes the resulting state and handlers down to `ZoomableCanvas`.

```typescript
function useZoomPan(options: {
  dimensions: IMapDimensions;
  zoom: { initial: number; min?: number; max?: number };
  initialCenter?: IMapCoordinate;
  onZoomChange?: (zoom: number) => void;
  onCenterChange?: (center: IMapCoordinate) => void;
}): {
  zoom: number;
  center: IMapCoordinate;
  svgTransform: string;
  handlers: ZoomPanHandlers;
  animateTo: (target: { coordinate: IMapCoordinate; zoom?: number }) => void;
};
```

### Mouse Wheel Zoom

Zoom is applied around the cursor position so the point under the mouse stays fixed:

```
// Current map coordinate under cursor
px = (mouseX - svgWidth/2) / zoom + center.x
py = (mouseY - svgHeight/2) / zoom + center.y

// New zoom (clamped)
zoom' = clamp(zoom * scaleFactor, zoom.min, zoom.max)

// Adjust center so (px, py) stays under cursor
center'.x = px - (mouseX - svgWidth/2) / zoom'
center'.y = py - (mouseY - svgHeight/2) / zoom'
```

### Click-and-Drag Pan

On `mousedown`, record the cursor's map coordinate. On `mousemove`, compute the new map coordinate under the cursor and adjust `center` by the delta. This produces 1:1 panning without drift.

### Touch Handling

- **Single-finger drag**: Same as mouse pan, using `touches[0]`.
- **Two-finger pinch**: Track the midpoint and distance between `touches[0]` and `touches[1]`. Apply zoom around the midpoint using the same zoom-to-cursor formula. Pan simultaneously if the midpoint moves.

### `animateTo`

```typescript
function animateTo(target: { coordinate: IMapCoordinate; zoom?: number }) {
  const startZoom = currentZoom;
  const startCenter = currentCenter;
  const targetZoom = clamp(target.zoom ?? currentZoom, zoom.min, zoom.max);
  const startTime = performance.now();
  const duration = 400; // ms — fixed for beta

  // Cancel any in-flight animation
  if (animationFrameRef.current) {
    cancelAnimationFrame(animationFrameRef.current);
  }

  function step(now: number) {
    const t = Math.min((now - startTime) / duration, 1);
    const eased = easeInOutCubic(t);
    setZoom(lerp(startZoom, targetZoom, eased));
    setCenter({
      x: lerp(startCenter.x, target.coordinate.x, eased),
      y: lerp(startCenter.y, target.coordinate.y, eased),
    });
    if (t < 1) {
      animationFrameRef.current = requestAnimationFrame(step);
    }
  }

  animationFrameRef.current = requestAnimationFrame(step);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
```

Any user gesture (wheel, mousedown, touchstart) cancels an in-flight animation by calling `cancelAnimationFrame`.

### Suppressing selection callbacks during gestures

`useZoomPan` maintains an `isDragging` ref that is set to `true` on `mousedown`/`touchstart` and cleared on `mouseup`/`touchend`. `ZoomableCanvas` passes this ref down to `SpacelaneLayer` and `PlanetDotLayer`, which gate their click handlers behind it:

```typescript
onClick={() => {
  if (!isDragging.current) onPlanetSelect?.(planet);
}}
```

This ensures that a `mouseup` that ends a drag does not fire a selection event, even though it is technically a click on a planet or spacelane element. Scroll-wheel zoom does not set `isDragging` since wheel events cannot be mistaken for clicks.

---

## Render Cap Selection: `selectRendered`

A pure utility function that first filters to viewport-visible items, then applies render caps. Being pure makes it trivially unit-testable.

### Viewport Computation

The visible region in map coordinates is derived from the current zoom, center, and container size:

```typescript
interface IViewport {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function computeViewport(
  center: IMapCoordinate,
  zoom: number,
  containerWidth: number,
  containerHeight: number,
): IViewport {
  const halfW = containerWidth / 2 / zoom;
  const halfH = containerHeight / 2 / zoom;
  return {
    minX: center.x - halfW,
    minY: center.y - halfH,
    maxX: center.x + halfW,
    maxY: center.y + halfH,
  };
}
```

### Visibility Checks

A planet is in the viewport if its position falls within the viewport rectangle:

```typescript
function isPlanetInViewport(planet: IPlanet, viewport: IViewport): boolean {
  return (
    planet.position.x >= viewport.minX &&
    planet.position.x <= viewport.maxX &&
    planet.position.y >= viewport.minY &&
    planet.position.y <= viewport.maxY
  );
}
```

A spacelane is in the viewport if at least one segment endpoint falls within the viewport rectangle. Segments that cross the viewport with both endpoints outside are not detected by this test — this is an acceptable approximation for the beta.

```typescript
function isPointInViewport(
  point: IMapCoordinate,
  viewport: IViewport,
): boolean {
  return (
    point.x >= viewport.minX &&
    point.x <= viewport.maxX &&
    point.y >= viewport.minY &&
    point.y <= viewport.maxY
  );
}

function isSpaceLaneInViewport(
  spacelane: ISpacelane,
  viewport: IViewport,
): boolean {
  return spacelane.segments.some(
    (seg) =>
      isPointInViewport(seg.origin, viewport) ||
      isPointInViewport(seg.destination, viewport),
  );
}
```

### Selection

```typescript
function selectRendered(
  planets: IPlanet[],
  spacelanes: ISpacelane[],
  limits: IRenderLimits,
  viewport: IViewport,
): { planets: IPlanet[]; spacelanes: ISpacelane[] } {
  return {
    planets: planets
      .filter((p) => isPlanetInViewport(p, viewport))
      .slice(0, limits.planets),
    spacelanes: spacelanes
      .filter((s) => isSpaceLaneInViewport(s, viewport))
      .slice(0, limits.spacelanes),
  };
}
```

This runs synchronously on every render. The result is passed directly to the layer components.

---

## Label Collision Detection: `useLabelSet`

### Algorithm

Label collision detection runs on a debounced schedule (100ms after the last zoom or pan event, or immediately when `planets` props change). It produces `labelSet: Set<string>` — the set of planet IDs that should have labels rendered.

```typescript
function computeLabelSet(
  planets: IPlanet[],
  limit: number,
  zoom: number,
  selectedPlanetId?: string,
): Set<string> {
  // The selected planet is always a candidate and receives first consideration,
  // even if it falls beyond the label limit.
  const selected = planets.find((p) => p.id === selectedPlanetId);
  const others = selected
    ? planets.filter((p) => p.id !== selectedPlanetId)
    : planets;
  const candidates = selected
    ? [selected, ...others.slice(0, limit)]
    : others.slice(0, limit);

  const placed: Array<{ x: number; y: number; w: number; h: number }> = [];
  const result = new Set<string>();

  for (const planet of candidates) {
    const box = estimateLabelBox(planet, zoom);
    if (!overlapsAny(box, placed)) {
      result.add(planet.id);
      placed.push(box);
    }
  }

  return result;
}
```

### Bounding Box Estimation

Label dimensions cannot be measured without DOM access. The beta uses an estimation approach:

```typescript
const CHAR_WIDTH_PX = 7; // approximate average character width
const LABEL_HEIGHT_PX = 14; // font-size in screen pixels
const LABEL_OFFSET_X = 10; // horizontal offset from planet center (screen px)
const LABEL_OFFSET_Y = -5; // vertical offset from planet center (screen px)

function estimateLabelBox(planet: IPlanet, zoom: number) {
  // Convert screen-pixel offsets to map coordinates
  const w = (planet.name.length * CHAR_WIDTH_PX) / zoom;
  const h = LABEL_HEIGHT_PX / zoom;
  const offsetX = LABEL_OFFSET_X / zoom;
  const offsetY = LABEL_OFFSET_Y / zoom;
  return {
    x: planet.position.x + offsetX,
    y: planet.position.y + offsetY - h,
    w,
    h,
  };
}
```

Dividing pixel dimensions by `zoom` converts them to map coordinate space, where all collision checks are performed. At higher zoom levels, labels take up less map space, so more labels fit — which is the correct behavior.

**Limitation:** Estimation accuracy degrades for variable-width fonts and non-ASCII characters. Exact measurement via `getBBox()` in a two-pass render is a future enhancement.

### Overlap Test

```typescript
function overlapsAny(box: LabelBox, placed: LabelBox[]): boolean {
  return placed.some(
    (p) =>
      box.x < p.x + p.w &&
      box.x + box.w > p.x &&
      box.y < p.y + p.h &&
      box.y + p.h > p.y,
  );
}
```

### Debounce Integration

`useLabelSet` holds the last computed set in a `useRef` (so it never triggers a re-render directly) and schedules recomputation via `setTimeout`:

```typescript
function useLabelSet(
  planets: IPlanet[],
  limit: number,
  zoom: number,
  selectedPlanetId?: string,
): Set<string> {
  const [labelSet, setLabelSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    const id = setTimeout(() => {
      setLabelSet(computeLabelSet(planets, limit, zoom, selectedPlanetId));
    }, 100);
    return () => clearTimeout(id);
  }, [planets, limit, zoom, selectedPlanetId]);

  return labelSet;
}
```

The 100ms debounce ensures that during active zoom or pan, the existing `labelSet` is frozen and no collision recomputation occurs. The frozen set is slightly stale during fast interaction, which is acceptable — labels may not perfectly reflect the current zoom for up to 100ms after interaction stops.

### Label limit vs. planet render limit

`useLabelSet` receives `renderedPlanets` — the already viewport-culled and planet-cap-limited output of `selectRendered` — not the full input list. This means `computeLabelSet` can only ever label planets that are actually rendered. If `currentLimits.planetLabels` exceeds `currentLimits.planets` or the number of in-viewport planets, the slice simply returns all rendered planets and the label limit has no additional effect. Labels are therefore always a subset of rendered planets by construction.

The selected planet override (`planets.find(...)`) also searches within `renderedPlanets`. If the selected planet is outside the viewport or beyond the planet render cap, `selected` is `undefined` and the override does not apply — the selected planet is not labelled if it is not rendered.

---

## Render Limit Controls: Debounced Draft State

Render limit inputs in `MapOptions` must not trigger a re-render of the map for every intermediate input state. A user typing "1000" into a field passes through "1", "10", "100" as intermediate values — each of which would otherwise trigger a full `selectRendered` pass and SVG update.

The debounce is owned entirely by `MapOptions`. This keeps the logic co-located with the input, so that if the inputs are later extracted into a shared component for other applications, the debouncing behavior travels with them.

An explicit apply button was considered and rejected. See [Decisions: render limit input debouncing over an apply button](./decisions.md#render-limit-input-debouncing-over-an-apply-button).

### Pattern

`MapOptions` maintains a local `draft` state that mirrors the input fields. User changes update `draft` immediately (keeping the input responsive), and a debounced effect propagates `draft` to `setCurrentLimits` in `GalaxyMap`:

```typescript
// MapOptions.tsx

const [draft, setDraft] = useState<IRenderLimits>(currentLimits);

useEffect(() => {
  const id = setTimeout(() => {
    setCurrentLimits(draft);
  }, 300);
  return () => clearTimeout(id);
}, [draft]);
```

The 300ms duration matches the conventional debounce window for text inputs — long enough to avoid intermediate-state renders, short enough to feel responsive after the user stops typing.

### Data flow with debounce

```
User types in input
  └── setDraft(newValue)           ← immediate; input stays in sync
        │
        └── useEffect fires        ← clears previous timer, sets new 300ms timer
              │
              (300ms of no further changes)
              │
              └── setCurrentLimits(draft)   ← GalaxyMap re-renders with settled value
```

If the user continues typing within 300ms, the previous timer is cleared and a new one is set. Only the final settled value reaches `GalaxyMap`.

### Relationship between `draft` and `currentLimits` prop

`draft` is initialized from `currentLimits` at mount. External changes to `currentLimits` (e.g., a future "reset to defaults" action) do not automatically sync back into `draft` — the draft represents the user's in-progress input, not the committed state. If a reset mechanism is added in the future, it should call `setDraft` directly alongside `setCurrentLimits`.

---

## Spacelane Rendering

### Segment Rendering

`SpacelaneLayer` passes `renderedSpaceLanes` through `orderForRendering(renderedSpaceLanes, selectedSpaceLaneId)` before mapping to SVG elements, ensuring the highest-priority spacelane paints on top and the selected spacelane paints above all others.

Each `ISpacelane` is rendered as a `<g>` element. Each segment within it is two overlapping `<line>` elements:

1. **Visual line** — thin, colored per `segment.color`, non-interactive.
2. **Hit-area line** — wider (e.g., `strokeWidth={8}`), fully transparent (`opacity={0}`), captures click events.

The hit-area line makes narrow spacelanes clickable without requiring pixel-perfect precision.

```tsx
<g key={spacelane.id} onClick={() => onSpaceLaneSelect?.(spacelane)}>
  {spacelane.segments.map((seg, i) => (
    <g key={i}>
      <line
        x1={seg.origin.x}
        y1={seg.origin.y}
        x2={seg.destination.x}
        y2={seg.destination.y}
        stroke={resolveColor(seg.color)}
        strokeWidth={selectedSpaceLaneId === spacelane.id ? 3 : 1.5}
      />
      <line
        x1={seg.origin.x}
        y1={seg.origin.y}
        x2={seg.destination.x}
        y2={seg.destination.y}
        stroke="transparent"
        strokeWidth={8}
      />
    </g>
  ))}
</g>
```

### Selection Visual

When `selectedSpaceLaneId` matches a spacelane's ID, all of its segments receive an increased `strokeWidth`. A future enhancement could add a glow or highlight color.

---

## Constant Object Size During Zoom

Three complementary techniques keep planet dots, spacelane strokes, and planet labels at a consistent apparent screen-pixel size as zoom changes.

### Spacelane strokes — `vectorEffect="non-scaling-stroke"`

Both the visual `<line>` and the hit-area `<line>` in each spacelane segment include `vectorEffect="non-scaling-stroke"`. The browser renders the stroke at the specified `strokeWidth` in screen pixels regardless of the parent transform's scale factor. No per-frame computation is required; the attribute is static.

```tsx
<line
  x1={seg.origin.x} y1={seg.origin.y}
  x2={seg.destination.x} y2={seg.destination.y}
  stroke={resolveColor(seg.color)}
  strokeWidth={selectedSpaceLaneId === spacelane.id ? 3 : 1.5}
  vectorEffect="non-scaling-stroke"
/>
<line
  x1={seg.origin.x} y1={seg.origin.y}
  x2={seg.destination.x} y2={seg.destination.y}
  stroke="transparent"
  strokeWidth={8}
  vectorEffect="non-scaling-stroke"
/>
```

The hit-area line also carries `vectorEffect="non-scaling-stroke"` so click targets remain consistently sized regardless of zoom level.

### Planet labels — screen-space rendering

`PlanetLabelLayer` is rendered as a `<g>` directly inside the `<svg>`, as a sibling of the `<g transform>` group — not inside it. This means SVG's zoom transform does not affect label positions or sizes.

Each label's screen position is computed from the planet's map coordinate, current zoom, and center:

```typescript
const screenX = (planet.position.x - center.x) * zoom + svgWidth / 2;
const screenY = (planet.position.y - center.y) * zoom + svgHeight / 2;
```

`PlanetLabelLayer` receives `zoom`, `center`, `svgWidth`, and `svgHeight` alongside the planet and label data. Font size is a fixed CSS value. Label positions update on every pan/zoom frame — this is a lightweight `x`/`y` attribute update on `<text>` elements, not a collision recomputation. Collision recomputation remains debounced at `LABEL_COLLISION_DEBOUNCE_MS`.

### Planet dots — CSS zoom-bucket classes

Planet dots remain inside the `<g transform>` for correct map-coordinate positioning. To counteract zoom scaling, dot radius is controlled via a CSS class on the `PlanetDotLayer` `<g>` rather than an inline attribute. Each class corresponds to a zoom range and sets `r` to a value that yields approximately the target screen-pixel radius at that zoom level.

A debounced effect in `PlanetDotLayer` watches the current zoom and, after `PLANET_SIZE_DEBOUNCE_MS` of inactivity, applies the appropriate class:

```typescript
// PlanetDotLayer.tsx
useEffect(() => {
  const id = setTimeout(() => {
    setZoomBucketClass(computeZoomBucket(zoom));
  }, PLANET_SIZE_DEBOUNCE_MS);
  return () => clearTimeout(id);
}, [zoom]);
```

**Tradeoff:** During an active zoom gesture, dots scale with the transform and appear temporarily larger or smaller than their target size. After the debounce settles, the class snaps to the correct bucket. This is the accepted tradeoff: continuous precision would require per-frame inline attribute updates on every rendered circle, while the bucket approach keeps the DOM quiet during interaction at the cost of a brief size correction after each gesture.

Bucket boundaries and exact `r` values per bucket are implementation details. See `docs/internal/features/galaxy-map-beta/assets/example_map.jpg` for the visual target.

### Named debounce constants

All three debounce durations are defined as named constants in `src/components/GalaxyMap/constants.ts` so they can be tuned independently during implementation:

```typescript
export const PLANET_SIZE_DEBOUNCE_MS = 100; // planet dot zoom-bucket update
export const LABEL_COLLISION_DEBOUNCE_MS = 100; // label placement recomputation
export const RENDER_LIMIT_DEBOUNCE_MS = 300; // options panel input settling
```

---

## Imperative Handle

`GalaxyMap` forwards a ref using `useImperativeHandle`:

```typescript
useImperativeHandle(ref, () => ({
  zoomTo(target: { coordinate: IMapCoordinate; zoom?: number }) {
    animateTo(target);
  },
}));
```

`animateTo` comes from `useZoomPan`. The handle is typed as `IGalaxyMapHandle` and exported as a public type.

---

## File Structure

```
src/
  components/
    GalaxyMap/
      GalaxyMap.tsx              # root component; owns all state; wires everything
      GalaxyMap.module.css
      constants.ts               # named debounce durations and other tuneable values
      index.ts                   # public exports: GalaxyMap (default), IGalaxyMapHandle,
                               #   IPlanet, ISpacelane, ISpaceLaneSegment,
                               #   IMapCoordinate, IMapDimensions,
                               #   IRenderLimits, ILegendEntry, IMapOptions,
                               #   MapColor
      hooks/
        useZoomPan.ts            # zoom/pan state, event handlers, animateTo
        useLabelSet.ts           # debounced label collision detection
      ZoomableCanvas/
        ZoomableCanvas.tsx       # <svg> element + event handler attachment
        ZoomableCanvas.module.css
      SpacelaneLayer/
        SpacelaneLayer.tsx       # renders ISpacelane[] from render cap selection
      PlanetDotLayer/
        PlanetDotLayer.tsx       # renders IPlanet[] circles
      PlanetLabelLayer/
        PlanetLabelLayer.tsx     # renders labels for planet IDs in labelSet
      MapOverlay/
        MapOverlay.tsx           # flex-row overlay; hosts five named slots
        MapOverlay.module.css
      MapOptions/
        MapOptions.tsx           # collapsible; render limit controls + customOptions
        MapOptions.module.css
      MapLegend/
        MapLegend.tsx            # collapsible; color swatch list from legendEntries
        MapLegend.module.css
  utils/
    selectRendered.ts            # pure: viewport culling + render cap selection
    orderForRendering.ts         # pure: reverse priority order, selected item last
    labelCollision.ts            # pure: computeLabelSet, estimateLabelBox, overlapsAny
    coordinates.ts               # pure: screen↔map conversion, mapCenter, computeViewport
    animate.ts                   # pure: easeInOutCubic, lerp
  types/
    index.ts                     # all public interfaces and enums
```

`utils/` contains only pure functions with no React dependency. This is intentional: it keeps the unit-testable logic entirely separate from component and hook code, and makes the test surface clear.

---

## Data Flow

```
Consumer
  └── passes: planets[], spacelanes[], dimensions, renderLimits, zoom,
              mapOptions, legendEntries, children, leftChildren, rightChildren,
              callbacks, ref
        │
        ▼
GalaxyMap
  ├── useZoomPan(...)
  │     └── zoom, center, svgTransform, handlers, animateTo
  ├── computeViewport(center, zoom, containerSize)
  │     └── viewport: IViewport
  ├── selectRendered(planets, spacelanes, currentLimits, viewport)
  │     └── renderedPlanets[], renderedSpaceLanes[]
  ├── useLabelSet(renderedPlanets, currentLimits.planetLabels, zoom, selectedPlanetId)
  │     └── labelSet: Set<string>  ← selected planet always included if placeable
  └── useImperativeHandle → ref.zoomTo → animateTo
        │
        ├── ZoomableCanvas(svgTransform, handlers, renderedPlanets, renderedSpaceLanes,
        │               labelSet, zoom, center, svgWidth, svgHeight)
        │   ├── <g transform={svgTransform}>
        │   │   ├── SpacelaneLayer
        │   │   └── PlanetDotLayer          (zoom → debounced CSS zoom-bucket class)
        │   └── PlanetLabelLayer            (zoom + center + svgWidth/svgHeight → screen positions)
        │
        └── MapOverlay(leftChildren, legendEntries, children, mapOptions,
                       currentLimits, maxLimits=renderLimits, setCurrentLimits,
                       rightChildren)
            ├── {leftChildren}
            ├── MapLegend(legendEntries)        ← absent when legendEntries undefined
            ├── {children}
            ├── MapOptions(currentLimits, maxLimits, setCurrentLimits, customOptions)
            └── {rightChildren}
```

---

## Key Design Decisions

### Within-layer render order: reversed priority, selected item last

`selectRendered` returns items with index 0 as highest priority. Each layer component passes its list through `orderForRendering(items, selectedId)` before rendering:

```typescript
function orderForRendering<T extends { id: string }>(
  items: T[],
  selectedId?: string,
): T[] {
  const reversed = [...items].reverse();
  if (!selectedId) return reversed;
  const idx = reversed.findIndex((item) => item.id === selectedId);
  if (idx === -1) return reversed;
  return [...reversed.slice(0, idx), ...reversed.slice(idx + 1), reversed[idx]];
}
```

SVG paints later elements on top of earlier ones. Reversing the priority list puts the highest-priority item last (on top). Moving the selected item to the very end ensures it always renders above all others, regardless of where it falls in the input list. This function is pure and lives in `utils/`, making it directly unit-testable and shared across `SpacelaneLayer`, `PlanetDotLayer`, and `PlanetLabelLayer`.

### No viewBox on the SVG element

Setting `viewBox` to the map's `dimensions` would cause SVG to scale content to fit the element. Instead, the SVG fills its container in pixel space and all scaling is handled explicitly via the transform on the content group. This gives precise control over zoom behavior and avoids interactions between browser SVG scaling and the zoom transform.

### Labels as a separate layer

Planet labels are rendered in `PlanetLabelLayer`, which is a sibling of `PlanetDotLayer` rather than a child. This ensures all planet dots render beneath all labels, preventing a label from being partially occluded by a nearby planet's marker. SVG renders children in document order, so later siblings appear on top.

### Pure utility functions

`selectRendered`, `computeLabelSet`, `estimateLabelBox`, `easeInOutCubic`, and coordinate conversion functions are pure functions with no React dependency. This makes them directly unit-testable without rendering a component or mocking hooks.

### MapOverlay as a sibling, not a child, of ZoomableCanvas

`MapOverlay` is absolutely positioned within `GalaxyMap`'s wrapper `div`, not inside the SVG element. This keeps UI components (options panel, legend, consumer children) in normal HTML DOM, where CSS layout, accessibility attributes, and focus management work correctly. Placing them inside the SVG would require SVG-specific layout and lose standard HTML semantics.

### Overlay layout: flex row with five named slots

`MapOverlay` renders as a full-width flex row along the top of the map container. Slots are ordered: `leftChildren`, `MapLegend`, `children`, `MapOptions`, `rightChildren`. The `children` slot has `flex: 1` so it fills any remaining space. `leftChildren` and `rightChildren` are present in the DOM only when non-null, so the layout degrades cleanly when unused.

The rationale for `leftChildren` and `rightChildren` alongside the center `children` slot: a consumer whose `children` content spans the full width (e.g., a header bar with a title and buttons) would otherwise have no way to place persistent widgets outside the legend and options panels. The outer slots solve this without requiring the consumer to manually replicate the legend/options layout.

### Panel initial collapse state is responsive

Both `MapLegend` and `MapOptions` own their own `expanded: boolean` state locally (it does not need to live in `GalaxyMap`). The initial value is determined at mount time by a `window.matchMedia` check:

```typescript
const LARGE_SCREEN_BREAKPOINT = "(min-width: 768px)";

function useInitiallyExpanded(): boolean {
  return useState<boolean>(
    () => window.matchMedia(LARGE_SCREEN_BREAKPOINT).matches,
  )[0];
}
```

Using the lazy initializer form of `useState` ensures the media query runs once at mount and is not re-evaluated on resize. This means the panel does not re-collapse if the user resizes from large to small, and does not re-expand if they resize from small to large — only manual user toggles change the expanded state after mount. This avoids fighting the user's preference mid-session.

The 768px breakpoint matches the conventional tablet/mobile boundary and requires no external library.

### `currentLimits` is not re-synchronized from props

`currentLimits` is initialized from `props.renderLimits` on mount and then owned entirely by the component. If the consumer raises a `renderLimits` value after mount (e.g., loading more data), `currentLimits` is not automatically updated — this preserves the user's manual adjustments. The options panel reflects the new maximum on the slider range immediately, so the user can choose to raise their own limit. This mirrors React's standard uncontrolled-with-initial-value pattern.

### Three-technique approach to constant object size

The requirement that objects appear constant-size during zoom has no single clean solution when using an SVG transform for all zoom/pan — the transform scales everything inside it uniformly. Three different techniques are used because the three element types have different constraints:

- **Spacelane strokes** — `vectorEffect="non-scaling-stroke"` is a browser-native SVG attribute that suppresses stroke scaling. Zero runtime cost, fully precise. Applies to both visual and hit-area lines.
- **Planet labels** — moved outside the transform group entirely and positioned in screen space. This gives exact sizing at the cost of recomputing `x`/`y` on every frame, which is acceptable because it is a lightweight attribute update on a small number of `<text>` elements. Moving labels inside the transform with a counter-scale would require per-element `transform` attributes and complicate the label layer's relationship with the zoom state.
- **Planet dots** — counter-scaling via CSS zoom-bucket classes with a debounce. Unlike `<line>` elements where `vectorEffect` handles stroke, `<circle>` radius is a geometric property that cannot be decoupled from the parent transform via a simple attribute. Moving planet dots outside the transform (like labels) would require recomputing screen positions for every rendered planet on every frame — potentially hundreds of attribute updates per frame. The zoom-bucket approach keeps dots in the transform group (no per-frame computation), accepting a brief size drift during active gesture and a snap correction after debounce.

### Legend entries use a mini-SVG indicator, not a plain color swatch

Each `ILegendEntry` is rendered with a small inline SVG — a round dot, a short line, and a second round dot — evoking a planet-and-spacelane visual. This matches the alpha's `ExampleMapItem` and provides more visual context than a plain square swatch, making the legend self-explanatory without requiring the user to already know the map's visual language.

The SVG uses zero-length `<line>` elements with `stroke-linecap: round` for the dots and a connecting `<line>` for the route, all colored by `colorToCss(entry.color)`. Exact sizing is an implementation detail; the alpha used `height="1rem"` with `viewBox="0 0 70 30"`.

`ILegendEntry.id` is used as the React `key` when mapping entries. Array index is not used as a key, consistent with the library's general practice.

### `ISpacelane.name` is optional

As resolved above, `name` on `ISpacelane` becomes `name?: string`. The field is not used by the component internally in the beta but is available for consumers who carry it for external display.
