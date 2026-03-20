# Technical Design: Galaxy Map

## Component Structure

See [Architecture Overview](../../architecture/overview.md) for the full component hierarchy.

The `GalaxyMap` component owns all state and delegates rendering to two subtrees:

1. **MapUI** — Overlay UI (options panel, legend, consumer children)
2. **ZoomableMap** — SVG canvas with pan/zoom and map item rendering

## State Management

`GalaxyMap` holds three pieces of local state via `useState`:

```typescript
const [planetLabelVisibility, setPlanetLabelVisibility] =
  useState<MapItemVisibility>(
    props.mapOptions?.planetLabelVisibility ?? "dynamic",
  );
const [planetVisibility, setPlanetVisibility] = useState<MapItemVisibility>(
  props.mapOptions?.planetVisibility ?? "dynamic",
);
const [spacelaneVisibility, setSpacelaneVisibility] =
  useState<MapItemVisibility>(
    props.mapOptions?.spacelaneVisibility ?? "dynamic",
  );
```

These are initialized from props and subsequently controlled by the options panel. They are not synchronized back to props (no controlled component pattern here).

## SVG Coordinate System

The `dimensions` prop defines the viewBox of the SVG. Planets and spacelanes use raw `x`/`y` coordinates from the data — no coordinate transformation is applied by the library. The consuming application is responsible for ensuring coordinates fall within the declared dimensions.

## Zoom and Pan

The `Zoomable` component listens for:

- `wheel` events → zoom
- `mousedown` + `mousemove` + `mouseup` → drag pan
- `touchstart` + `touchmove` → single-finger pan and two-finger pinch zoom

Zoom state (scale + offset) is maintained within `Zoomable`/`ZoomableMap` and applied as SVG transforms.

## CSS and Theming

- Component layout uses CSS Modules (`map.module.css`, `items.module.css`).
- Colors use `var(--ood-color-*)` resolved at runtime from the consuming app's CSS.
- FocusLevel-based visibility is implemented via CSS classes applied per item.
