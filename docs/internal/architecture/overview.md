# Architecture Overview

> **Status:** Approved design for the rebuild

## Summary

`@outoforbitdev/galaxy-map` is built from two components:

- **`Canvas`** is a generic pan and zoom surface. It owns gestures, the viewport, camera moves, and world-to-screen conversion. It has no galaxy concepts, so it can later move to `library-react-core`.
- **`GalaxyMap`** draws star systems and spacelanes onto a `Canvas`, and owns culling, level of detail, selection, hover, and keyboard focus.

The design follows the [requirements](../requirements/core-functional-requirements.md). Its guiding constraint is [NFR-M5](../requirements/non-functional-requirements.md): the simplest design that meets the requirements and performance targets. Types are in the [data model](./data-model.md), and the public API is in [API design](./api-design.md).

## Module structure

```
src/
  canvas/                 generic: no galaxy concepts
    Canvas.tsx            root element, <svg>, world <g>, gestures, context provider, imperative handle
    useViewport.ts        controlled and uncontrolled viewport, limits, camera animation
    gestures.ts           pure: pan versus click classification, wheel and pinch zoom math
    projection.ts         pure: world and screen conversion, fitViewport, clamping
    constants.ts          canvas tuning constants
    CanvasContext.ts      published viewport, container size, conversion functions
  map/
    GalaxyMap.tsx         composes Canvas; selection, hover, keyboard focus, event delegation
    spatialIndex.ts       pure: grid index over system positions and lane segment bounds
    cull.ts               pure: priority-order greedy culling
    constants.ts          map tuning constants
    validate.ts           pure: development-only data warnings
    SystemNode.tsx        one group per system: hit area, glyph, selection ring, overlay, label
    LaneNode.tsx          one group per lane: color runs, halo, hit path
    Highlight.tsx         hover and focus highlight, drawn on top
    primitives.tsx        SystemGlyph and SpacelaneSegment, shared with consumers
    types.ts              public types
  index.ts                public exports
```

**Dependency rule:** `canvas/` never imports from `map/`. A test enforces this, so `Canvas` stays portable.

**Pure core:** `projection`, `gestures`, `spatialIndex`, `cull`, and `validate` are pure functions with no React or DOM dependencies, so they are unit-tested directly ([NFR-M7](../requirements/non-functional-requirements.md)). The React components are thin: they pass pure results to SVG.

## Data flow

1. The consumer passes `systems` and `spacelanes` to `GalaxyMap`, each in priority order, highest first.
2. `GalaxyMap` scans the new arrays once, building an id-to-entity lookup and comparing positions with the previous data. The spatial index is rebuilt only when a position changed or entities were added or removed. Systems and lanes have separate indexes, so adding a lane never rebuilds the system index. Color, class, name, and data changes never touch the index.
3. During gestures and animations, `Canvas` updates the world transform every frame without rendering React. At most every 100 ms, and once when movement settles, it publishes the viewport through context.
4. `GalaxyMap` runs `cull` whenever the published viewport, the data, or the selection changes. The result is the lanes to draw and the systems to draw, each system marked as labeled or not.
5. `GalaxyMap` renders lanes, then systems, each in reverse priority order, so higher-priority items are drawn on top. Hover and focus highlights are drawn after them, then free-floating content.
6. `SystemNode` and `LaneNode` are memoized by value, so only nodes whose drawn fields changed re-render.

## Canvas

### Rendering: one transform and a CSS variable

The world group carries a single transform, `matrix(z, 0, 0, ±z, tx, ty)`, where `z` is the zoom in screen pixels per world unit and the sign of the y scale follows the `yAxis` prop. The same element carries `--zoom: z` and `--y-sign`.

Content that must stay a fixed screen size, such as glyphs, labels, highlight rings, and overlays, sits inside an element with the exported screen-space class:

```css
.screen-space {
  transform: scale(calc(1 / var(--zoom)), calc(var(--y-sign) / var(--zoom)));
}
```

The net transform on that content is the identity, so text renders exactly as unscaled text at every zoom, and the y-flip is undone for text. Lane strokes use `vector-effect: non-scaling-stroke`. See [ADR-0002](./decisions/adr-0002-transform-and-css-variable-rendering.md) for the evidence behind this choice.

The world group MUST NOT be promoted to its own compositor layer (no `will-change: transform`). A composited layer is rasterized once and scaled as a bitmap, which blurs and shrinks text during zoom.

### Viewport state

- The live camera, `{ center, zoom }`, is held in a ref, not React state, and written to the DOM directly on every frame.
- In controlled mode, the `viewport` prop is written the same way. Gestures and camera moves emit `onViewportChange` on every frame, and the camera moves only when the parent passes the new value back.
- `onViewportChange(viewport, { settled })` fires on every frame, with `settled: true` once when movement ends. Context publishes at most every 100 ms plus the settled value. A pan or animation settles when it ends. Wheel zooming settles after 150 ms without input.

### Limits and bounds

- User gestures and camera calls are clamped to `bounds`, `minZoom`, and `maxZoom`. Bounds describe the content area. The view center may move at most half a view beyond them, so the outermost content can reach the edge of the screen but no further, and this feels the same at every zoom.
- **Expanding bounds.** The effective limits are the configured limits expanded to include the camera's current position and zoom. If bounds or zoom limits change while the camera is outside them, for example after a time period switch, the camera does not move. The user cannot move further out, and the expansion shrinks as the camera moves back inside. Clamping therefore never makes the camera jump.
- Camera calls such as `fitPoints` clamp their target to the configured limits and animate there.

### Gestures

- **Drag to pan** with pointer events and pointer capture. Movement beyond a threshold, about 4 px for mouse and 8 px for touch, classifies the gesture as a pan.
- **Click cancellation.** After a pan, a capture-phase listener on the root cancels the next `click` before any child sees it. Children never need to know about gestures.
- **Wheel zoom** around the pointer, with `preventDefault` so the page never scrolls. A wheel event with `ctrlKey` is a trackpad pinch and uses the same math with a different sensitivity.
- **Touch pinch** with two pointers zooms around their midpoint and pans with it.
- The root sets `touch-action: none` and `overscroll-behavior: contain`, so gestures never scroll or zoom the page.
- `panEnabled` and `zoomEnabled` turn gesture handling off without affecting camera calls.

### Camera moves

- `moveTo` and `fitPoints` animate in one `requestAnimationFrame` loop. The center moves linearly in world space and the zoom moves linearly in log space.
- Any user gesture cancels a running animation.
- A `duration` of 0, or a user preference for reduced motion, makes the move instant.
- `fitPoints` uses the pure `fitViewport(points, size, { padding, minZoom, maxZoom, bounds })`: the smallest view containing the points' bounding box plus padding, clamped to the limits. If the points cannot fit at minimum zoom, they are centered.

### Resize and keyboard

- A `ResizeObserver` tracks the container size and keeps the center fixed on resize.
- The root element is the map's single tab stop. Arrow keys pan by 10% of the view, and the plus and minus keys zoom by 1.25x around the center. An `onKeyDown` prop on `Canvas` runs first, and keys it handles with `preventDefault()` are ignored. Focus is on the root, so key events start there and never pass through children.

### What children get

- `useCanvas()` returns the published viewport, the container size, `worldToScreen`, `screenToWorld`, and whether a gesture is in progress.
- The screen-space class, for fixed-size content.

## Map

### Culling

`cull(input)` is pure. Its input is the spatial indexes, the published viewport and container size, the selection, the limits (`maxSystems`, `maxLabels`, `maxLaneSegments`), and a label measuring function.

**Systems:**

1. Query the system index for the view plus a 10% margin on each side, in priority order. The margin is `CULL_MARGIN` (see [Tuning constants](#tuning-constants)). If a system is selected, it goes first.
2. Walk the candidates greedily in screen space:
   - A glyph that collides with an already placed glyph is hidden.
   - Otherwise the glyph is placed. Its label is placed too if the label box collides with no placed label and fewer than `maxLabels` labels are placed. Glyphs and labels never block each other, so label text does not change which systems are visible.
3. Stop after `maxSystems` placed glyphs.

**Lanes:** walk lanes in priority order, with the selected lane first, and keep each lane with at least one segment in the view until `maxLaneSegments` visible segments are reached. Lanes do not collide with each other or with systems.

**Label widths** are measured once per name with canvas `measureText`, in the label font read from computed style at mount, and cached. Tests inject a fixed-width measuring function. Culling is deterministic: the same data, viewport, and fonts always give the same result ([NFR-R3](../requirements/non-functional-requirements.md)).

Culling ignores consumer overlay content, since its size is unknown.

**Disabling culling.** With `culling={false}`, `cull` returns every system, labeled, and every lane, in priority order. There is no viewport query, no collision check, and no limit. Selection promotion still applies. This is for consumers who want the full SVG, and the performance targets do not apply to it.

**Known behavior: systems and labels can disappear while zooming in.** Culling is deterministic and follows priority order, but the greedy walk is not monotonic. Zooming in moves systems apart, so collisions ease, but a system that newly appears can hide a lower-priority one that was visible only because it was hidden. For example, A hides B and B was hiding C. Zooming in separates A and B, so B appears and now hides C. Labels behave the same way, and the `maxSystems` and `maxLabels` limits add a second cause: a higher-priority system that newly qualifies pushes the last one out. A sweep over the 6,000-system data (zoom 0.05 to 1.5 in 5% steps) found 50 glyphs and 11 labels lost while zooming in, almost all below zoom 0.4, where the limits and density dominate. It is accepted for now. Options, if it needs fixing: hide a system only when a higher-priority system is within range whether or not that one is shown, which is monotonic but sparser; add a rank rule so the limits grow with zoom; or prefer systems shown in the previous frame, which is smooth but makes culling depend on history.

### Rendering tree

```
<Canvas yAxis="up" role="application" aria-activedescendant=...>
  <g class="lanes">      LaneNode per culled lane, reverse priority
  <g class="systems">    SystemNode per culled system, reverse priority
  <Highlight>            hovered and focused entities
  <g class="free">       consumer children, pointer-events: none by default
```

**`LaneNode`:** a `<g>` with the lane's `className`, `data-kind="lane"`, and `data-id`, containing:

1. The selection halo, when selected.
2. One `<path>` per run of adjacent same-color segments, with `non-scaling-stroke`, round caps, and `pointer-events: none`. Segments join into one path only where one segment's destination exactly equals the next origin.
3. A transparent hit path about 12 px wide covering all segments, drawn last so it receives events.

**`SystemNode`:** `<g transform="translate(x y)">` with the system's `className`, `data-kind="system"`, and `data-id`, containing one screen-space group with:

1. A transparent hit circle about 12 px in radius.
2. The glyph (`SystemGlyph`), filled with the system's color.
3. The selection ring, when selected.
4. Overlay content from `renderSystemOverlay`, drawn in screen pixels relative to the system center.
5. The label, when culling marked the system as labeled.

The label is drawn last in its group, so a system's name stays readable over its own overlay. Across groups, reverse priority order puts higher-priority systems, overlays, and labels above lower-priority ones.

**Memoization:** both nodes compare the fields they draw by value: id, name, position, color, class name, and `data` identity, plus labeled, selected, and focused. Consumers who recreate every object on each update still only re-render nodes whose drawn fields changed.

**Draw order and hit priority** follow from element order. Systems are drawn after lanes, so where their hit areas overlap, the system receives the click ([FR-S8](../requirements/core-functional-requirements.md)). Labels are drawn in their own layer above every system glyph, so a lower-priority glyph can never cover a label. A label carries its system's `data-kind` and `data-id` (plus `data-part="label"`), so clicking or hovering it acts on the system.

### Default bounds

If the consumer passes no `bounds`, the map uses the bounding box of all system positions and lane points. `Canvas` adds the half-view margin. It is recomputed only when the index is rebuilt, and memoized by value, so `Canvas` does not re-render for data changes that leave the extent unchanged. With no data, bounds default to a small box around the origin.

## Interaction

### Event delegation

Nodes carry `data-kind` and `data-id` but no handlers. The `click` handler is on the canvas root, passed through the `onClick` prop, because a click on empty space targets the `<svg>`, outside the map's group. The hover handlers (`pointerover`, `pointerout`) are on the map's root group. Each resolves the entity with `event.target.closest("[data-kind]")`. Keyboard handling goes through the `onKeyDown` prop of `Canvas`, since key events start at the focused root. Nodes are pure drawing, and all interaction logic is in one place.

### Clicks

1. A click after a pan never arrives, because `Canvas` cancelled it.
2. If `event.defaultPrevented` is set, consumer overlay content handled the click, and the map does nothing.
3. A click on an entity selects it. For a lane, the event includes `segmentId`, the segment nearest the click point in world coordinates.
4. A click on empty space clears the selection. Free-floating content ignores pointer events by default, so clicks on it fall through to whatever is beneath.

### Hover

- Tracked with delegated `pointerover` and `pointerout`, for mouse and pen only. Touch has no hover.
- Paused while a gesture is in progress, so panning across systems produces no hover changes.
- Drawn by `Highlight` above everything as a ring or lane halo, with `pointer-events: none` and `aria-hidden`. Hover never changes culling.

### Selection

- Controlled with `selected` and `onSelect`, or uncontrolled with `defaultSelected`.
- The selected entity is promoted to the highest priority in culling, so it is always drawn, on top, and a selected system always shows its label.
- If the selected id no longer exists in new data, the map calls `onSelect(null)`. An uncontrolled selection is cleared. Hover is handled the same way with `onHover(null)`.

### Disabling hover and selection

- `hoverEnabled={false}` turns off hover tracking: no hover highlight and no `onHover` calls.
- `selectionEnabled={false}` turns off user selection. Clicks, Enter, Space, and Escape no longer change the selection. The controlled `selected` prop and `select()` still work, so the consumer can still highlight an entity from code.
- With selection disabled, systems and lanes use `role="img"` instead of `role="button"`, keep their `aria-label`, and drop `aria-pressed`. The bracket keys still move focus, so screen reader users can still browse systems.

### Keyboard focus

DOM focus always stays on the canvas root. The root's `aria-activedescendant` points at the focused system's element id.

- The bracket keys move focus to the next or previous visible system in priority order, from the current cull result.
- Enter or Space selects the focused system. Escape clears the selection.
- The map handles these keys in the `onKeyDown` it passes to `Canvas`, calling `preventDefault()` so `Canvas` ignores them. Arrow keys and plus and minus reach `Canvas` for panning and zooming.
- If the focused system is culled or removed, the map clears `aria-activedescendant`. Focus stays on the root, so it is never lost.
- A focus ring is drawn by `Highlight`.

### Accessibility semantics

- The root has `role="application"` and `aria-roledescription="galaxy map"`.
- Systems and lanes have `role="button"` and an `aria-label` from their name, whether or not the visible label is shown. The selected entity has `aria-pressed="true"`.
- Highlights, focus rings, and color runs are `aria-hidden`.

## State across data changes

A data change re-renders `GalaxyMap` but never remounts anything.

| State                    | Lives in                       | On a data change                                       |
| ------------------------ | ------------------------------ | ------------------------------------------------------ |
| Camera                   | Ref in `Canvas`                | Kept. `Canvas` does not re-render.                     |
| Running camera animation | `Canvas` animation loop        | Keeps running.                                         |
| Gesture in progress      | Pointer capture on the `<svg>` | Keeps working.                                         |
| Selection and hover      | `GalaxyMap` state, or consumer | Kept, unless the entity's id is no longer in the data. |
| Keyboard focus           | `aria-activedescendant`        | Kept, unless the focused system is culled or removed.  |

## Tuning constants

Every tuning value is a named, documented constant, never a literal in logic ([NFR-M9](../requirements/non-functional-requirements.md)). Each constant is defined once and used everywhere that value matters. For example, `GLYPH_RADIUS_PX` sets both the drawn glyph and its collision size in culling, so the two cannot drift apart.

Values marked _(starting)_ have not been tested yet and are expected to be tuned during implementation.

**`canvas/constants.ts`**

| Constant                  | Value              | Meaning                                                        |
| ------------------------- | ------------------ | -------------------------------------------------------------- |
| `PUBLISH_INTERVAL_MS`     | 100                | Most frequent viewport publishing through context.             |
| `WHEEL_SETTLE_MS`         | 150                | Wheel inactivity before a wheel zoom counts as settled.        |
| `DRAG_THRESHOLD_MOUSE_PX` | 4                  | Mouse movement that turns a press into a pan.                  |
| `DRAG_THRESHOLD_TOUCH_PX` | 8                  | Touch movement that turns a press into a pan.                  |
| `BOUNDS_VIEW_MARGIN`      | 0.5                | How far, in views, the center may move beyond the bounds.      |
| `KEYBOARD_PAN_FRACTION`   | 0.1                | Arrow key pan distance, as a fraction of the view.             |
| `KEYBOARD_ZOOM_FACTOR`    | 1.25               | Zoom change per plus or minus key press.                       |
| `WHEEL_ZOOM_SENSITIVITY`  | 0.002 _(starting)_ | Zoom change per unit of wheel delta.                           |
| `PINCH_ZOOM_SENSITIVITY`  | 0.01 _(starting)_  | Zoom change per unit of trackpad pinch delta.                  |
| `WHEEL_LINE_HEIGHT_PX`    | 16                 | Pixels per line when a wheel event reports its delta in lines. |
| `DEFAULT_ZOOM`            | 1                  | Zoom with no viewport, default viewport, or bounds to fit.     |

**`map/constants.ts`**

| Constant                    | Value              | Meaning                                                                     |
| --------------------------- | ------------------ | --------------------------------------------------------------------------- |
| `CULL_MARGIN`               | 0.1                | Extra area culled on each side of the view, as a fraction of the view.      |
| `DEFAULT_MAX_SYSTEMS`       | 500                | Default for `maxSystems`.                                                   |
| `DEFAULT_MAX_LABELS`        | 100                | Default for `maxLabels`.                                                    |
| `DEFAULT_MAX_LANE_SEGMENTS` | 600                | Default for `maxLaneSegments`.                                              |
| `GLYPH_RADIUS_PX`           | 4                  | Drawn glyph radius, also used for glyph collisions.                         |
| `GLYPH_SPACING_PX`          | 4 _(starting)_     | Minimum gap between placed glyphs.                                          |
| `LABEL_OFFSET_PX`           | 8                  | Horizontal distance from the system center to its label.                    |
| `SYSTEM_HIT_RADIUS_PX`      | 12                 | Radius of a system's click and tap target.                                  |
| `LANE_HIT_WIDTH_PX`         | 12                 | Width of a lane's click and tap target.                                     |
| `LANE_HALO_WIDTH_PX`        | 8                  | Width of the lane selection halo and hover highlight.                       |
| `SELECTION_RING_GAP_PX`     | 3                  | Gap between a glyph and its selection ring.                                 |
| `HIGHLIGHT_RING_GAP_PX`     | 3                  | Gap between a glyph and its hover or focus ring.                            |
| `LABEL_HEIGHT_PX`           | 14                 | Label box height used for collisions.                                       |
| `FALLBACK_CHAR_WIDTH_PX`    | 7                  | Estimated character width when text cannot be measured.                     |
| `COLLISION_CELL_PX`         | 64                 | Size of the screen-space buckets used for collision lookups.                |
| `INDEX_CELLS_PER_AXIS`      | 64                 | Spatial index cells along the larger side of the data's extent.             |
| `EMPTY_BOUNDS_HALF_SIZE`    | 100 _(starting)_   | Half the size, in world units, of the default bounds when there is no data. |
| `SEGMENT_JOIN_TOLERANCE`    | 0.001 _(starting)_ | Largest gap, in world units, reported as segments that almost join.         |

Visual defaults that consumers may restyle (label font and fill, lane width, highlight color) are defined once in `GalaxyMap.module.css`, with zero-specificity `:where()` rules on the map root that children inherit. Consumers restyle with their own classes: `className` on `GalaxyMap` for the whole map, or on a system or spacelane for that entity's group. Where culling depends on a styled value, it reads the computed style, as it does for the label font. A consumer that changes a glyph's radius with CSS should know culling still uses `GLYPH_RADIUS_PX`.

## Performance

| Trigger                                | Work                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------- |
| Every frame of a gesture or animation  | One transform and `--zoom` write. No React work.                                      |
| At most every 100 ms, and when settled | One cull, then re-render of changed nodes only.                                       |
| Data change                            | One linear scan, an index rebuild only if positions changed, one cull, changed nodes. |
| Selection change                       | One cull with the selected entity promoted.                                           |

- Defaults: `maxSystems` 500, `maxLabels` 100, `maxLaneSegments` 600. At these limits the DOM holds about 1,000 map elements regardless of dataset size. With culling disabled, the DOM holds every entity.
- **Known risk:** Firefox paint cost on a real GPU has not been measured. Headless Firefox reached 18 to 40 fps in the spike, with the cost in SVG text and counter-scaled groups. Measure it early in implementation with a full-scale Storybook story. If it misses [NFR-P2](../requirements/non-functional-requirements.md), the first mitigations are lower default label limits and cheaper text rendering during gestures, recorded as NFR-M5 justifications.

## Error handling

- **Development-only validation** in `validate.ts`, removed from production builds, warns once per problem: duplicate ids within a kind, non-finite coordinates, invalid colors (checked with `CSS.supports("color", value)`), and lane segments that almost but not exactly join.
- **Bad entities are skipped, not thrown.** A system with non-finite coordinates is left out of the index and not drawn.
- **Empty data** renders an empty, interactive map.
- **Server rendering** outputs the empty root and `<svg>`. Content renders after mount, once the container size is known. `measureText` is only called in the browser.
- **Props are never mutated.**

## Testing

- **Unit tests** (Vitest) for the pure modules:
  - `projection`: round trips, y-up and y-down, `fitViewport`, clamping including expanding bounds.
  - `gestures`: pan versus click thresholds, zooming keeps the world point under the pointer fixed.
  - `cull`: priority order, selection promotion, the three system outcomes, limits, deterministic output.
  - `spatialIndex`: queries, and rebuilding only when positions change.
  - `validate`: each warning.
- **Component tests** (Testing Library):
  - Click routing: entity, empty space, overlay content that handled the click, a click after a drag.
  - Controlled and uncontrolled selection, and clearing when an entity disappears.
  - Keyboard: bracket keys, Enter, Space, Escape, and `aria-activedescendant`.
  - `onViewportChange` settling, and expanding bounds after a bounds change.
- **Dependency test:** nothing in `canvas/` imports from `map/`.
- **Visual regression** (SHOULD): Playwright screenshots of Storybook stories at fixed viewports and zoom levels.
- **Performance check:** a full-scale Storybook story and a scripted zoom and pan sweep, run manually in Chrome, Firefox, and Safari.
