# Glossary

| Term | Definition |
|------|------------|
| **Planet** | A named point of interest rendered as an SVG element at a given `(x, y)` coordinate on the map. |
| **Spacelane** | A named connection between two points on the map, rendered as an SVG line. Represents a route or relationship between locations. |
| **FocusLevel** | An enum (`Primary`, `Secondary`, `Tertiary`, `Quaternary`) that controls at which zoom level a planet or spacelane becomes visible. Lower ordinal = visible at lower zoom. |
| **MapColor** | An enum of named colors (`Gray`, `Red`, `Blue`, etc.) that map to CSS custom properties (`--ood-color-*`) for theming. |
| **MapItemVisibility** | A string union (`"dynamic"`, `"show"`, `"hide"`) that overrides the default zoom-driven visibility of map items. |
| **Zoom level** | A numeric scale factor applied to the SVG viewport. Higher values zoom in. |
| **Dimensions** | The bounding box (`minX`, `minY`, `maxX`, `maxY`) of the coordinate space rendered by the map. |
| **Legend** | An optional overlay listing named items with their colors, rendered via `MapLegend`. |
| **Options panel** | A collapsible UI panel rendered by `MapOptions` that lets Edward toggle item visibility. |
| **Consumer** | A React application or developer that installs and uses `@outoforbitdev/galaxy-map` as a dependency. See [Carla the Consumer](./personas/persona-carla-the-consumer.md). |
| **Explorer** | An end user interacting with the embedded map in a consuming application. See [Edward the Explorer](./personas/persona-edward-the-explorer.md). |
| **ood-react** | The `@outoforbitdev/ood-react` peer library that provides base component utilities used internally by this library. |
