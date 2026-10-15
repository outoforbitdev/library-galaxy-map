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

| v0                                            | Now                                                                                                                     |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `planets`                                     | `systems`, in priority order. The array order decides which systems show when zoomed out.                               |
| `spacelanes`                                  | `spacelanes`, in priority order.                                                                                        |
| `dimensions`                                  | `bounds`, optional. Defaults to the data's extent.                                                                      |
| `renderLimits`                                | `planets`, `planetLabels`, `spacelanes` become `maxSystems`, `maxLabels`, `maxLaneSegments`. Or pass `culling={false}`. |
| `zoom.initial`, `initialCenter`               | `defaultViewport={{ center, zoom }}`. Zoom is now screen pixels per world unit.                                         |
| `zoom.min`, `zoom.max`                        | `minZoom`, `maxZoom`.                                                                                                   |
| `onPlanetSelect`, `onSpaceLaneSelect`         | `onSelect(event)`. Check `event.kind`.                                                                                  |
| `selectedPlanetId`, `selectedSpaceLaneId`     | `selected={{ kind: "system", id }}`.                                                                                    |
| `onZoomChange`, `onCenterChange`              | `onViewportChange(viewport, { settled })`.                                                                              |
| `legendEntries`                               | Removed. Build a legend with `SystemGlyph` and `SpacelaneSegment`.                                                      |
| `mapOptions`, `leftChildren`, `rightChildren` | Removed. Render your own UI next to the map.                                                                            |

## Data

- `IPlanet.color` and `ISpaceLaneSegment.color` were `MapColor` values. They are now any CSS color string, for example `"#4f8cff"` or `"var(--faction-blue)"`.
- Position fields keep their shape: `position` on systems, and `origin` and `destination` on segments.

## Handle

`ref.current.zoomTo({ coordinate, zoom })` is now `ref.current.moveTo({ center, zoom }, { duration })`.

## Coordinates

World y still points up, as in v0.

## Behavior changes

- The map fits the content area once, when it first has one. With no `bounds`, that is the data's extent, so data that arrives after mount is fitted when it arrives. With `bounds`, the map fits those bounds on mount and does not refit when data changes. Pass `defaultViewport` or `viewport` to opt out.
- Children you pass to `GalaxyMap` get `pointer-events: none` by default. Set `pointer-events: auto` on any child that should take clicks.
- Only the primary mouse button pans. Keyboard shortcuts ignore keys held with Ctrl, Cmd, or Alt.
