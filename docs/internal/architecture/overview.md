# Architecture Overview

## Summary

`@outoforbitdev/galaxy-map` is a single-purpose React component library. It provides a composable `GalaxyMap` component that renders an SVG-based interactive map with drag, zoom, and optional UI overlays.

## Component Hierarchy

```
GalaxyMap (IMapProps)
├── MapUI
│   ├── MapOptions         ← visibility toggle panel
│   ├── MapLegend          ← optional legend overlay
│   └── children           ← consumer-injected content
└── ZoomableMap
    ├── Zoomable           ← zoom/pan event handling
    └── SVG canvas
        ├── SpacelaneMap[] ← renders ISpacelane items
        └── PlanetMap[]    ← renders IPlanet items
```

## Responsibilities

| Component      | Responsibility                                       |
| -------------- | ---------------------------------------------------- |
| `GalaxyMap`    | Owns visibility state; bridges MapUI and ZoomableMap |
| `MapUI`        | Renders overlay UI (options panel, legend, children) |
| `MapOptions`   | Provides visibility controls to the user (Edward)    |
| `MapLegend`    | Renders an optional color legend                     |
| `ZoomableMap`  | Manages the SVG viewport and renders map items       |
| `Zoomable`     | Handles mouse/touch zoom and pan events              |
| `PlanetMap`    | Renders a single planet as an SVG element with label |
| `SpacelaneMap` | Renders a single spacelane as an SVG line            |

## Data Flow

1. Consumer (Carla) passes `planets`, `spacelanes`, `dimensions`, and optional config to `GalaxyMap`.
2. `GalaxyMap` maintains local state for item visibility (driven by `mapOptions` defaults).
3. Visibility state is passed down to `ZoomableMap` for rendering decisions and to `MapOptions` for the toggle UI.
4. User interactions (zoom, drag, click) are handled in `Zoomable` and `ZoomableMap`, with planet selection propagated up via `onPlanetSelect`.

## Key Design Principles

- **One-way data flow** — Props flow down; events bubble up via callbacks.
- **No global state** — All state lives within `GalaxyMap` or derived from props.
- **SVG for rendering** — All map graphics are SVG for crisp scaling and easy DOM integration.
- **CSS custom properties for theming** — Colors resolve to `--ood-color-*` variables.

See also:

- [Data Model](./data-model.md)
- [API Design](./api-design.md)
- [Tech Stack](./tech-stack.md)
