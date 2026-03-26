# Product Requirements: GalaxyMap Beta

## Overview

The GalaxyMap beta is a complete redesign of the `GalaxyMap` component. It addresses the core pain points identified in the alpha — particularly the burden placed on consumers to manage item visibility through the `FocusLevel` system, and the performance cost of recalculating SVG positions on every zoom and pan event. The beta makes the component significantly easier to adopt for new consumers, with no per-item visibility metadata required and no upgrade-path compatibility goals.

## Goals

- Make the component easy to implement for new consumers, prioritizing DX over upgrade-path compatibility with the alpha.
- Eliminate consumer responsibility for per-item visibility management (replace `FocusLevel` with automatic priority-based rendering).
- Improve performance through SVG-transform-based zoom/pan and consumer-configurable render caps.
- Support multi-segment, multi-color spacelanes as a first-class concept.
- Give consumers visibility into and programmatic control over map state (zoom/pan).

## Non-Goals

- Backward compatibility with the alpha data model or component API.
- A low-friction upgrade path for existing consumers.
- Configurable debounce duration (deferred to a future version).
- 3D rendering.
- Built-in data fetching or state management.

## Constraints

- **No new runtime dependencies** without explicit justification. The beta must continue to rely solely on React, react-dom, and `@outoforbitdev/ood-react` as runtime dependencies. Any proposed addition must be justified by a capability that cannot reasonably be implemented without it.
- **New dev dependencies are acceptable** for testing and tooling. Storybook and supporting test libraries (e.g., a test runner, a React testing library) may be added. New dev dependencies should still be evaluated for maintenance burden and bundle impact on the development workflow.

---

## User Stories

- As **Carla the Consumer**, I want to pass a priority-ordered list of planets and spacelanes and have the map automatically decide what to show, so that I don't have to manage per-item visibility myself.
- As **Carla the Consumer**, I want to programmatically navigate the map to a specific coordinate or planet, so that I can build interactions like "click a planet in a sidebar to fly there."
- As **Carla the Consumer**, I want to observe the current zoom level and center position, so that I can synchronize other UI elements with the map state.
- As **Edward the Explorer**, I want to zoom and pan the map fluidly on desktop and mobile, so that I can navigate large galaxy maps comfortably.
- As **Edward the Explorer**, I want to click a planet or spacelane to trigger an action in the application, so that the map is interactive and not just decorative.
- As **Edward the Explorer**, I want planet labels to be readable without overlapping each other, so that the map is legible even when many planets are close together.

---

## Core Capabilities

### 1. Map Rendering

The component renders planets and spacelanes on a 2D SVG canvas defined by a consumer-supplied coordinate space (`dimensions`).

Zoom and pan are implemented via SVG `transform` — planet and spacelane positions are not recalculated on each zoom or pan event. This replaces the alpha's approach of recomputing all SVG coordinates on every interaction.

**Constant object sizes:** Planet dots, spacelane strokes, and planet labels maintain consistent apparent screen-pixel sizes at all zoom levels. As the user zooms in, map content spreads out but individual elements do not visually grow. Three complementary techniques achieve this (detailed in the technical design): stroke scaling is suppressed for spacelane lines via a non-scaling stroke effect; labels are rendered outside the zoom transform in screen space; and planet dot sizes are updated via CSS zoom-bucket classes on a short debounce after each gesture completes.

### 2. Priority-Based Render Caps

The alpha required consumers to assign a `FocusLevel` to each item, controlling when it became visible as a function of zoom. This placed an unreasonable burden on consumers to anticipate zoom behavior and map density in advance.

In the beta, consumers provide **priority-ordered** lists of planets and spacelanes. The component renders items in order from the front of each list, stopping when the applicable cap is reached. No per-item visibility metadata is required.

Render caps are applied **after viewport culling**: only items that fall within the current viewport are considered. This ensures that zooming into a region of the map reveals lower-priority items in that region, rather than those items being permanently hidden behind higher-priority items elsewhere on the map.

**Planets:**

- The component filters planets to those within the current viewport, then renders up to `renderLimits.planets` from that set, in input list order.
- The component places labels for up to `renderLimits.planetLabels` of the rendered planets.
- Label collision detection is applied: if a label's bounding box would overlap an already-placed label, that label is skipped and the next candidate is evaluated. Priority follows input order.

**Spacelanes:**

- The component filters spacelanes to those with at least one segment endpoint within the current viewport, then renders up to `renderLimits.spacelanes` from that set, in input list order.
- A spacelane renders all-or-nothing: either every segment renders or none do. When a spacelane is selected for rendering, all of its segments are drawn, including any that extend outside the viewport.

### 3. Multi-Segment, Multi-Color Spacelanes

A spacelane represents a route connecting multiple planets in sequence. It is composed of an ordered list of segments, where each segment is a line between two adjacent points. Each segment carries its own color, allowing a spacelane to change color as it passes through different planets (e.g., red from planet X to planet Y, blue from planet Y to planet Z).

A spacelane is selected as a unit — clicking any segment of a spacelane selects the entire spacelane.

### 4. Label Collision Detection

When placing planet labels, the component tracks the bounding boxes of already-placed labels. A candidate label is skipped if it would overlap any previously placed label. Items earlier in the input list take precedence. Labels are not re-evaluated on every frame; recalculation is debounced (fixed internal duration) so that visual rendering remains immediate while collision resolution is deferred.

### 5. Navigation

The component supports the following user-initiated navigation interactions:

| Interaction   | Mechanism          |
| ------------- | ------------------ |
| Zoom in/out   | Mouse scroll wheel |
| Pan           | Click-and-drag     |
| Pinch to zoom | Two-finger touch   |
| Touch pan     | Single-finger drag |

Zoom is bounded by optional `zoom.min` and `zoom.max` props.

### 6. Interaction and Selection

- Clicking a planet calls `onPlanetSelect` with the selected `IPlanet`.
- Clicking any segment of a spacelane calls `onSpaceLaneSelect` with the parent `ISpacelane`.
- `selectedPlanetId` and `selectedSpaceLaneId` props allow the consumer to visually distinguish the current selection.
- Selection callbacks are suppressed while a pan or zoom gesture is active. A click that ends a drag does not fire a selection event.

### 7. Dynamic Data Updates

The `planets` and `spacelanes` props are live. When the consumer updates either list (adding, removing, or reordering items), the component re-renders with the new data while preserving the current zoom level and center position. No special API is needed for this — it is standard React prop behavior, and the component's internal zoom/pan state is maintained across re-renders as long as the component is not unmounted.

If the component is unmounted and remounted (e.g., due to conditional rendering), zoom/pan state will reset to `zoom.initial` and `initialCenter`. Consumers who need to restore state across remounts can do so by recording the last known values via `onZoomChange` and `onCenterChange` and supplying them as initial props on remount.

### 8. UI Overlays

The component renders a horizontal overlay bar along the top of the map canvas. The bar has five slots arranged left to right:

```
[ leftChildren ] [ Legend ] [ children ] [ Options ] [ rightChildren ]
```

The legend is anchored to the left, the options panel to the right, and the consumer's primary `children` fill the space in between. `leftChildren` and `rightChildren` are additional optional slots outside the built-in panels, for consumers who need persistent widgets (e.g., a compass, action buttons) anchored at the edges without interfering with the legend or options panel.

**Legend:** When `legendEntries` is provided and non-empty, a collapsible panel is rendered on the left. Each entry displays the entry's label alongside a small SVG indicator — a dot connected to a line by a dot, evoking a planet-and-spacelane style — rendered in the entry's color. The panel is collapsed by default on small screens and expanded by default on large screens. No legend is rendered when `legendEntries` is absent or empty.

**Options panel:** A collapsible panel on the right that allows the user to adjust the render limits for planets, planet labels, and spacelanes. The consumer-provided `renderLimits` values are the initial defaults shown when the panel opens. The user may decrease any limit toward zero (which effectively hides that layer) or increase it above the consumer's default. The component may optionally display a warning indicator when a limit exceeds its default, to signal that the consumer's recommended performance threshold has been exceeded. The panel is collapsed by default on small screens and expanded by default on large screens. Consumers may inject additional controls via `mapOptions.customOptions`.

### 9. Consumer State Integration

**Observing state:** The consumer can subscribe to zoom and pan changes via optional callback props. These fire when the user interacts with the map and when state is set programmatically.

**Setting state:** The consumer can programmatically set zoom level and center position via a ref-based imperative API. This supports interactions like navigating the map to a specific planet when the user clicks it in an external list.

**Animated navigation:** Programmatic navigation should transition smoothly to the target position. Two implementation approaches are viable; the technical design should evaluate both:

- _Option A — `requestAnimationFrame` interpolation:_ Custom animation loop that interpolates the SVG transform from the current state to the target. More implementation complexity, highest control over easing and cancellation.
- _Option B — CSS transition:_ A CSS `transition` on the SVG transform group achieves a similar effect with less custom code, but may be harder to cancel mid-animation or compose with user-initiated gestures.

If animation proves too costly for the beta scope, an instant jump (immediate transform update) is an acceptable fallback. The PRD treats smooth animation as the target behavior.

---

## Data Model

### `IPlanet`

| Field      | Type             | Required | Description                            |
| ---------- | ---------------- | -------- | -------------------------------------- |
| `id`       | `string`         | Yes      | Unique identifier                      |
| `name`     | `string`         | Yes      | Display name shown as a label          |
| `position` | `IMapCoordinate` | Yes      | Position in the map's coordinate space |
| `color`    | `MapColor`       | Yes      | Color of the planet marker             |

> `FocusLevel` is removed. Render priority is determined solely by position in the input array.

### `ISpacelane`

| Field      | Type                  | Required | Description                                                              |
| ---------- | --------------------- | -------- | ------------------------------------------------------------------------ |
| `id`       | `string`              | Yes      | Unique identifier                                                        |
| `name`     | `string`              | No       | Display name (not rendered by the component; available for consumer use) |
| `segments` | `ISpaceLaneSegment[]` | Yes      | Ordered list of segments forming the lane                                |

### `ISpaceLaneSegment`

| Field         | Type             | Required | Description                     |
| ------------- | ---------------- | -------- | ------------------------------- |
| `origin`      | `IMapCoordinate` | Yes      | Start coordinate of the segment |
| `destination` | `IMapCoordinate` | Yes      | End coordinate of the segment   |
| `color`       | `MapColor`       | Yes      | Color of this segment           |

### `IMapCoordinate`

A position in the map's 2D coordinate space. Used for planet positions, spacelane segment endpoints, the map center, and programmatic navigation targets.

```typescript
interface IMapCoordinate {
  x: number;
  y: number;
}
```

**Coordinate system:** The map uses a standard mathematical Y axis — `y` increases upward. A planet with a lower `y` value appears lower on screen; a planet with a higher `y` value appears higher. This is the inverse of SVG's native coordinate system (where `y` increases downward), and the component is responsible for applying the axis flip internally.

### `IMapDimensions`

| Field | Type             | Required | Description                                   |
| ----- | ---------------- | -------- | --------------------------------------------- |
| `min` | `IMapCoordinate` | Yes      | Left and bottom bound of the coordinate space |
| `max` | `IMapCoordinate` | Yes      | Right and top bound of the coordinate space   |

### `IRenderLimits`

Specifies the default render limits shown in the options panel when the component mounts. These are the consumer's recommended values; the user may adjust them in either direction at runtime.

| Field          | Type     | Required | Description                                                          |
| -------------- | -------- | -------- | -------------------------------------------------------------------- |
| `planets`      | `number` | Yes      | Default number of planets rendered                                   |
| `planetLabels` | `number` | Yes      | Default number of planet labels rendered (after collision filtering) |
| `spacelanes`   | `number` | Yes      | Default number of spacelanes rendered                                |

### `ILegendEntry`

| Field   | Type       | Required | Description                                        |
| ------- | ---------- | -------- | -------------------------------------------------- |
| `id`    | `string`   | Yes      | Unique identifier; used as the React key           |
| `label` | `string`   | Yes      | Text shown in the legend                           |
| `color` | `MapColor` | Yes      | Color of the mini-SVG indicator shown in the entry |

### `IMapOptions`

Optional configuration for the options panel. All fields are optional.

| Field           | Type        | Default | Description                                           |
| --------------- | ----------- | ------- | ----------------------------------------------------- |
| `customOptions` | `ReactNode` | —       | Additional controls rendered inside the options panel |

### `MapColor` (unchanged from alpha)

```typescript
enum MapColor {
  Gray,
  Red,
  Blue,
  Green,
  Yellow,
  Magenta,
  Aqua,
  Brown,
}
```

Each value resolves to a CSS custom property: `var(--ood-color-<name>)`.

### `IGalaxyMapHandle`

The imperative handle exposed via `ref`.

```typescript
interface IGalaxyMapHandle {
  zoomTo(target: { coordinate: IMapCoordinate; zoom?: number }): void;
}
```

---

## Component API

### `GalaxyMap` Props

`GalaxyMap` extends `IComponentProps` from `@outoforbitdev/ood-react`. Standard HTML div props (`className`, `id`, `style`, etc.) are accepted and forwarded to the component's container `div` via `lib.getDomProps()`.

| Prop                  | Type                               | Required | Default | Description                                                             |
| --------------------- | ---------------------------------- | -------- | ------- | ----------------------------------------------------------------------- |
| `planets`             | `IPlanet[]`                        | Yes      | —       | Priority-ordered list of planets to render                              |
| `spacelanes`          | `ISpacelane[]`                     | Yes      | —       | Priority-ordered list of spacelanes to render                           |
| `dimensions`          | `IMapDimensions`                   | Yes      | —       | Coordinate space bounds                                                 |
| `renderLimits`        | `IRenderLimits`                    | Yes      | —       | Default render limits; user may adjust at runtime via the options panel |
| `zoom.initial`        | `number`                           | No       | `1`     | Starting zoom level                                                     |
| `zoom.min`            | `number`                           | No       | —       | Minimum zoom level                                                      |
| `zoom.max`            | `number`                           | No       | —       | Maximum zoom level                                                      |
| `initialCenter`       | `IMapCoordinate`                   | No       | —       | Starting center position in coordinate space                            |
| `onPlanetSelect`      | `(planet: IPlanet) => void`        | No       | —       | Called when a planet is clicked                                         |
| `onSpaceLaneSelect`   | `(spacelane: ISpacelane) => void`  | No       | —       | Called when any segment of a spacelane is clicked                       |
| `selectedPlanetId`    | `string`                           | No       | —       | ID of the currently selected planet                                     |
| `selectedSpaceLaneId` | `string`                           | No       | —       | ID of the currently selected spacelane                                  |
| `onZoomChange`        | `(zoom: number) => void`           | No       | —       | Called when the zoom level changes                                      |
| `onCenterChange`      | `(center: IMapCoordinate) => void` | No       | —       | Called when the center position changes                                 |
| `legendEntries`       | `ILegendEntry[]`                   | No       | —       | Entries for the legend panel; legend absent when not provided           |
| `mapOptions`          | `IMapOptions`                      | No       | —       | Custom options panel content                                            |
| `children`            | `ReactNode`                        | No       | —       | Consumer UI rendered in the center overlay slot                         |
| `leftChildren`        | `ReactNode`                        | No       | —       | Consumer UI rendered left of the legend panel                           |
| `rightChildren`       | `ReactNode`                        | No       | —       | Consumer UI rendered right of the options panel                         |
| `ref`                 | `React.Ref<IGalaxyMapHandle>`      | No       | —       | Imperative handle for programmatic navigation                           |

---

## Acceptance Criteria

- [ ] Planets with higher `y` coordinate values appear higher on screen than planets with lower `y` values (Y axis is upward, inverse of SVG).
- [ ] Render caps apply to viewport-visible items only — items outside the current viewport do not consume capacity.
- [ ] Planets render at their specified coordinates in priority order, up to `renderLimits.planets` within the viewport.
- [ ] Spacelanes render as multi-segment polylines in priority order, up to `renderLimits.spacelanes` within the viewport.
- [ ] Higher-priority items render on top of lower-priority items when they overlap.
- [ ] The selected planet renders on top of all other planets, regardless of its position in the input list.
- [ ] The selected planet is always a candidate for a label, even if it falls beyond `renderLimits.planetLabels`, and it receives first consideration in collision detection.
- [ ] The selected spacelane renders on top of all other spacelanes, regardless of its position in the input list.
- [ ] Each segment within a spacelane renders with its own color.
- [ ] A spacelane renders fully or not at all — no partial segment rendering.
- [ ] Planet labels are placed for up to `renderLimits.planetLabels` planets, with collisions resolved in favor of higher-priority items.
- [ ] Zoom and pan work on desktop (mouse scroll and click-drag) and mobile (pinch and single-finger drag).
- [ ] Zoom respects `zoom.min` and `zoom.max` bounds when provided.
- [ ] Clicking a planet calls `onPlanetSelect` with the correct `IPlanet`.
- [ ] Clicking any segment of a spacelane calls `onSpaceLaneSelect` with the parent `ISpacelane`.
- [ ] Selection callbacks are not fired while a pan or zoom gesture is active.
- [ ] A mouseup or touchend that concludes a drag does not fire a selection callback.
- [ ] `selectedPlanetId` visually distinguishes the selected planet.
- [ ] `selectedSpaceLaneId` visually distinguishes all segments of the selected spacelane.
- [ ] `onZoomChange` fires when the zoom level changes.
- [ ] `onCenterChange` fires when the map center changes.
- [ ] `mapRef.current.zoomTo(...)` navigates to the target coordinate and zoom level.
- [ ] SVG transforms are used for zoom and pan — planet and spacelane positions are not recalculated on interaction. (Planet label positions are rendered in screen space and update each frame, but this is a lightweight attribute update, not a layout recalculation.)
- [ ] Planet dots maintain approximately constant screen-pixel size at all zoom levels.
- [ ] Spacelane strokes maintain constant screen-pixel size at all zoom levels.
- [ ] Planet labels render at a consistent font size regardless of zoom level.
- [ ] Updating `planets` or `spacelanes` props re-renders map content without resetting zoom or pan state.
- [ ] The options panel provides controls to adjust the render limits for planets, planet labels, and spacelanes independently.
- [ ] Render limit controls accept values from 0 upward, with no hard cap at the consumer's default.
- [ ] Adjusting a render limit updates which items are rendered after a short debounce delay; intermediate input states do not trigger re-renders.
- [ ] A warning indicator is optionally shown when a limit exceeds the consumer's default `renderLimits` value.
- [ ] `mapOptions.customOptions` content is rendered inside the options panel.
- [ ] The options panel is collapsible; it starts expanded on large screens (≥768px) and collapsed on small screens.
- [ ] A legend panel is rendered on the left when `legendEntries` is provided, with correct labels and color swatches.
- [ ] No legend is rendered when `legendEntries` is absent or empty.
- [ ] The legend panel is collapsible; it starts expanded on large screens (≥768px) and collapsed on small screens.
- [ ] `children` are rendered in the center overlay slot, between the legend and options panels.
- [ ] `leftChildren` are rendered left of the legend panel.
- [ ] `rightChildren` are rendered right of the options panel.

---

## Testing Requirements

### Unit Tests

Functional logic that does not depend on visual output must be covered by unit tests. This includes:

- **Viewport culling** — only items within the current viewport are candidates for rendering.
- **Render cap selection** — given a viewport-filtered, priority-ordered list and a cap, the correct items are selected.
- **Label collision detection** — the collision algorithm correctly skips labels that would overlap already-placed labels, in priority order.
- **All-or-nothing spacelane rendering** — a spacelane is either fully included or fully excluded when the cap is reached.
- **Zoom bounds enforcement** — zoom is clamped to `zoom.min` and `zoom.max`.
- **`onZoomChange` / `onCenterChange` callbacks** — callbacks fire with correct values when state changes.
- **Dynamic data updates** — updating `planets` or `spacelanes` props does not reset zoom or pan state.
- **Render limit adjustment** — adjusting a render limit changes how many items are rendered; limits can be set both below and above the consumer's default `renderLimits` value.

### UI Tests (Storybook)

Visual components must have Storybook stories. Stories serve as both development sandboxes and the basis for visual regression testing. Required stories include:

- Default map with a representative set of planets and spacelanes.
- Map at render cap limits (planets and spacelanes at maximum).
- Dense planet layout demonstrating label collision resolution.
- Multi-segment spacelane with varying colors per segment.
- Selected planet and selected spacelane states.
- Zoom bounds (min and max) enforced.
- Empty state (no planets, no spacelanes).
- Legend visible with entries; legend absent without entries.
- Legend collapsed and expanded states.
- Options panel with render limit controls at various values (including zero and above-default for each field).
- Options panel with a limit set above the consumer's default, showing the optional warning indicator.
- Options panel collapsed and expanded states.
- Legend and options panel on a simulated small-screen viewport (both collapsed by default).
- Options panel with `customOptions` content injected.
- All five overlay slots populated: `leftChildren`, legend, `children`, options, `rightChildren`.
- Center `children` slot only (no legend, no `leftChildren`/`rightChildren`).

---

## Open Questions

These questions are unresolved at the product level and should be addressed during technical design.

1. ~~**Animated `zoomTo`:**~~ Resolved in technical design. `requestAnimationFrame` interpolation with ease-in-out cubic easing over 400ms. CSS transitions were rejected due to difficulty composing with active user gestures.

2. ~~**Spacelane label display:**~~ Resolved in technical design. `ISpacelane.name` is optional and not displayed by the component in the beta. Consumers may use the field for their own display purposes.

3. ~~**Render cap and viewport culling:**~~ Resolved. Viewport culling is in scope for the beta. Render caps apply to the viewport-visible subset of each input list. See Core Capability 2.

4. ~~**`onZoomChange` and `onCenterChange` fire rate:**~~ Resolved in technical design. Callbacks fire at most once per animation frame (~60/s) via a `requestAnimationFrame` gate. Consumers are responsible for further debouncing if their handlers are expensive.
