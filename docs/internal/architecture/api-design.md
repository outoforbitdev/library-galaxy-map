# API Design

> **Status:** Approved design for the rebuild

Types referenced here are defined in the [data model](./data-model.md). The [architecture overview](./overview.md) describes how each piece works.

## Public exports

| Export                                        | Kind       | Phase |
| --------------------------------------------- | ---------- | ----- |
| `GalaxyMap`                                   | Component  | Atlas |
| `Canvas`, `useCanvas`, `screenSpaceClassName` | Canvas     | Atlas |
| `SystemGlyph`, `SpacelaneSegment`             | Primitives | Atlas |
| `fitViewport`                                 | Helper     | Atlas |
| `pointAlongLane`, `interpolateColor`          | Helpers    | Game  |
| Types from the data model, plus handle types  | Types      | Atlas |

## `GalaxyMap`

`GalaxyMap<TSystemData, TLaneData>` is generic over the consumer's data. React 19 passes `ref` as a regular prop, so the component stays generic without `forwardRef`.

### Props

| Prop                                              | Type                                          | Default                      | Purpose                                                                                                                                    |
| ------------------------------------------------- | --------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `systems`                                         | `ISystem<TSystemData>[]`                      | Required                     | Star systems in priority order, highest first.                                                                                             |
| `spacelanes`                                      | `ISpacelane<TLaneData>[]`                     | Required                     | Spacelanes in priority order, highest first.                                                                                               |
| `selected`                                        | `IEntityRef \| null`                          | Uncontrolled                 | Controlled selection.                                                                                                                      |
| `defaultSelected`                                 | `IEntityRef \| null`                          | `null`                       | Initial selection when uncontrolled.                                                                                                       |
| `onSelect`                                        | `(event: MapEntityEvent \| null) => void`     | None                         | Selection changed, including clearing.                                                                                                     |
| `onHover`                                         | `(event: MapEntityEvent \| null) => void`     | None                         | Hover changed. Mouse and pen only.                                                                                                         |
| `selectionEnabled`                                | `boolean`                                     | `true`                       | Set to `false` to stop users from changing the selection. `selected` and `select()` still work.                                            |
| `hoverEnabled`                                    | `boolean`                                     | `true`                       | Set to `false` to turn off hover tracking and `onHover`.                                                                                   |
| `highlightColor`                                  | `string`                                      | `--ood-text`, then `#ffffff` | Any CSS color for hover, focus, and selection highlights. Set only on highlight elements, so overlays using `currentColor` are unaffected. |
| `renderSystemOverlay`                             | `(system: ISystem<TSystemData>) => ReactNode` | None                         | Content drawn with each visible system, in screen pixels relative to its center.                                                           |
| `children`                                        | `ReactNode`                                   | None                         | Free-floating content in world coordinates. Ignores pointer events by default. Game phase.                                                 |
| `maxSystems`                                      | `number`                                      | `500`                        | Most systems drawn at once.                                                                                                                |
| `maxLabels`                                       | `number`                                      | `100`                        | Most labels drawn at once.                                                                                                                 |
| `maxLaneSegments`                                 | `number`                                      | `600`                        | Most visible lane segments drawn at once.                                                                                                  |
| `culling`                                         | `boolean`                                     | `true`                       | Set to `false` to draw every system, label, and lane, with no viewport culling or level of detail. Performance targets do not apply.       |
| `bounds`                                          | `IBounds`                                     | Data extent                  | The content area. Defaults to the data's bounding box.                                                                                     |
| `minZoom`, `maxZoom`                              | `number`                                      | None                         | Zoom limits, in screen pixels per world unit.                                                                                              |
| `viewport`, `defaultViewport`, `onViewportChange` | See `Canvas`                                  |                              | Passed through to `Canvas`.                                                                                                                |
| `panEnabled`, `zoomEnabled`                       | `boolean`                                     | `true`                       | Passed through to `Canvas`. Game phase.                                                                                                    |
| `ref`                                             | `Ref<IGalaxyMapHandle>`                       | None                         | Imperative handle.                                                                                                                         |

Props extend `IComponentProps` from `@outoforbitdev/ood-react`, so DOM props such as `className`, `style`, and `aria-label` go to the root element.

### Imperative handle

`IGalaxyMapHandle` extends `ICanvasHandle` with:

| Method                            | Purpose                                                                                                        | Phase |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----- |
| `select(ref: IEntityRef \| null)` | Selects an entity. In uncontrolled mode it updates the selection. In controlled mode it only calls `onSelect`. | Atlas |
| `getVisible()`                    | Returns `{ systems: string[]; lanes: string[] }`, the ids currently drawn.                                     | Game  |

## `Canvas`

A generic pan and zoom surface with no galaxy concepts.

### Props

| Prop                 | Type                                                        | Default      | Purpose                                                                                                |
| -------------------- | ----------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------ |
| `viewport`           | `IViewport`                                                 | Uncontrolled | Controlled viewport.                                                                                   |
| `defaultViewport`    | `IViewport`                                                 | See below    | Initial viewport when uncontrolled. Defaults to fitting `bounds`, if given.                            |
| `onViewportChange`   | `(viewport: IViewport, info: { settled: boolean }) => void` | None         | Fires every frame during movement, and once with `settled: true` when movement ends.                   |
| `bounds`             | `IBounds`                                                   | None         | The content area. The view center may move up to half a view beyond it. Applied with expanding bounds. |
| `minZoom`, `maxZoom` | `number`                                                    | None         | Zoom limits.                                                                                           |
| `yAxis`              | `"up" \| "down"`                                            | `"down"`     | Direction of positive y in world coordinates.                                                          |
| `panEnabled`         | `boolean`                                                   | `true`       | Enables drag and keyboard panning.                                                                     |
| `zoomEnabled`        | `boolean`                                                   | `true`       | Enables wheel, pinch, and keyboard zooming.                                                            |
| `children`           | `ReactNode`                                                 | None         | Content drawn in world coordinates.                                                                    |
| `ref`                | `Ref<ICanvasHandle>`                                        | None         | Imperative handle.                                                                                     |

Props extend `IComponentProps` from `@outoforbitdev/ood-react`, so DOM props go to the root element, which is the single tab stop. An `onKeyDown` prop runs before the canvas's own key handling, and keys it handles with `preventDefault()` are ignored by the canvas.

### Imperative handle: `ICanvasHandle`

| Method                                                                                       | Purpose                                                                                        |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `moveTo(target: { center?: IPoint; zoom?: number }, options?: { duration?: number })`        | Pans, zooms, or both. Animates when `duration` is above 0 and reduced motion is not preferred. |
| `fitPoints(points: IPoint[], options?: { padding?: number \| IPadding; duration?: number })` | Moves so all points are visible, inside the padding.                                           |
| `getViewport()`                                                                              | Returns the current `IViewport`.                                                               |
| `getSize()`                                                                                  | Returns the container size in pixels.                                                          |
| `worldToScreen(point: IPoint)`                                                               | Converts a world point to pixels relative to the container.                                    |
| `screenToWorld(point: IPoint)`                                                               | Converts container pixels to a world point.                                                    |

In controlled mode, `moveTo` and `fitPoints` emit their frames through `onViewportChange`, and the camera follows as the parent passes the values back.

### `useCanvas()`

For content inside a `Canvas`. Returns:

- `viewport`: the published viewport, updated at most every 100 ms and when movement settles.
- `size`: the container size.
- `worldToScreen` and `screenToWorld`.
- `gesturing`: whether a gesture is in progress.

### `screenSpaceClassName`

A class that counter-scales an element so its content is drawn at a fixed screen size, with y pointing down, at its world position. Use it inside a group translated to a world point.

## Primitives

`SystemGlyph` and `SpacelaneSegment` are the components `GalaxyMap` draws with. They render standalone in any `<svg>`, so legends and infoboxes show exactly what the map shows.

```tsx
<svg width={16} height={16}>
  <SystemGlyph x={8} y={8} color={faction.color} />
</svg>
```

## Helpers

| Helper                               | Purpose                                                                                   | Phase |
| ------------------------------------ | ----------------------------------------------------------------------------------------- | ----- |
| `fitViewport(points, size, options)` | Computes the viewport `fitPoints` would move to, without moving. For building deep links. | Atlas |
| `pointAlongLane(lane, t)`            | The point at fraction `t` of the way along a continuous lane.                             | Game  |
| `interpolateColor(a, b, t)`          | Perceptual interpolation between two concrete colors.                                     | Game  |

## Example

```tsx
const mapRef = useRef<IGalaxyMapHandle>(null);

<GalaxyMap
  ref={mapRef}
  systems={systems}
  spacelanes={route ? [route, ...lanes] : lanes}
  selected={selected}
  onSelect={(event) => setSelected(event && { kind: event.kind, id: event.id })}
/>;

// Jump to a search result.
mapRef.current?.moveTo({ center: result.position, zoom: 2 }, { duration: 400 });

// Frame a route.
mapRef.current?.fitPoints(
  route.segments.flatMap((s) => [s.origin, s.destination]),
  { padding: 40, duration: 500 },
);
```

## Design principles

- **Props are the source of truth for data.** There is no imperative API for changing data. To add a route, pass a new `spacelanes` array.
- **Controlled and uncontrolled state follow React conventions.** Selection and viewport each have a value prop, a default prop, and a change callback.
- **Imperative methods are for actions, not state.** Camera moves and conversions are imperative. `select()` never competes with a controlled `selected` prop.
- **No UI chrome.** Legends, infoboxes, search, and settings belong to the consumer, built from the exported primitives and helpers.

## API stability

- The rebuild ships as a new major version, with a migration guide from the v0 API.
- Required props are stable and are not removed without a major version bump.
- Optional props may be added in minor versions.
