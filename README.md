# @outoforbitdev/galaxy-map

A React component for displaying a galactic map.

<p>
  <a href="https://github.com/outoforbitdev/library-galaxy-map/actions?query=workflow%3ATest+branch%3Amaster">
    <img alt="Test build states" src="https://github.com/outoforbitdev/library-galaxy-map/workflows/Test/badge.svg">
  </a>
  <a href="https://github.com/outoforbitdev/library-galaxy-map/actions?query=workflow%3ATest+branch%3Amaster">
    <img alt="Release build states" src="https://github.com/outoforbitdev/library-galaxy-map/workflows/NPM Publish/badge.svg">
  </a>
  <a href="https://securityscorecards.dev/viewer/?uri=github.com/outoforbitdev/library-galaxy-map">
    <img alt="OpenSSF Scorecard" src="https://api.securityscorecards.dev/projects/github.com/outoforbitdev/library-galaxy-map/badge">
  </a>
  <a href="https://github.com/outoforbitdev/library-galaxy-map/releases/latest">
    <img alt="Latest github release" src="https://img.shields.io/github/v/release/outoforbitdev/library-galaxy-map?logo=github">
  </a>
  <a href ="https://www.npmjs.com/package/@outoforbitdev/galaxy-map">
    <img alt="NPM Version" src="https://img.shields.io/npm/v/%40outoforbitdev%2Fgalaxy-map" />
  </a>
  <a href="https://github.com/outoforbitdev/library-galaxy-map/issues">
    <img alt="Open issues" src="https://img.shields.io/github/issues/outoforbitdev/library-galaxy-map?logo=github">
  </a>
</p>

## Features

- Star systems and multi-segment spacelanes on a pannable, zoomable SVG map.
- Built for maps of about 6,000 systems and 20,000 lane segments by drawing only what is in view. These are design targets, not measured frame rates.
- Priority order decides which systems and labels show when not everything fits.
- Drag, scroll, and pinch on desktop, trackpad, and touch. Gestures never scroll the page.
- Selection, hover, and keyboard navigation, with controlled and uncontrolled modes. A selection whose id is not in the data is cleared (`onSelect(null)`), so set it after the data has loaded.
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
    <div className="ood-primary" style={{ height: 600 }}>
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

Draw a route as a spacelane placed first in `spacelanes`, so it draws on top and is first in line for the segment budget. The segment budget (`maxLaneSegments`) is a hard limit, so a route with more visible segments than the budget is dropped, and `maxSystems={0}` hides every system, including the selected one. Give it a `className` and style it with ordinary CSS. The class goes on the lane's group, and the lane's paths inherit from it:

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

- **Map-wide:** pass `className` to `GalaxyMap`. `font` sets the label font, `color` sets the highlight and selection color (by default the theme's `--ood-text`, or white without a theme class), `stroke-width` sets the default lane width, and `.my-map text { stroke: ...; }` changes the label outline (see Theme colors). The `highlightColor` prop also sets the highlight color, and takes priority over the map's class.
- **One system or lane:** set `className` on the `ISystem` or `ISpacelane`. The class goes on the entity's group, so properties like `font`, `fill`, and `stroke-width` apply to its label or lane paths. Labels are filled with the system's color by default, and a class on the system overrides that with `fill`. Use descendant selectors, such as `.capital text`, to target one part.

```css
.my-map {
  font:
    14px Georgia,
    serif;
  color: gold;
}
```

### Highlight color

Hover, focus, and selection highlights share one color across every system and spacelane. A system's own `color` and `className` do not change it. Set it in one of three ways, listed from highest to lowest priority:

1. The `highlightColor` prop: `<GalaxyMap highlightColor="gold" />`.
2. A `color` on the map's `className`: `.my-map { color: gold; }`.
3. The default, used when you set neither: the theme's `--ood-text` from an [ood-react](https://www.npmjs.com/package/@outoforbitdev/ood-react) theme class on an ancestor, or white (`#ffffff`) without one.

Set a `color` on the map root, not on a system's or spacelane's `className`. A `color` there also recolors that entity's selection ring or halo.

### Theme colors

Labels are outlined with `var(--ood-background)` from the [ood-react](https://www.npmjs.com/package/@outoforbitdev/ood-react) theme system, so they stay readable over a glyph of the same color. Put an ood-react theme class such as `ood-primary` on a parent of the map. It sets `--ood-background` and paints the surface behind the map. Without one, the outline falls back to a dark color. The `--ood-text` variable from the same class sets the default highlight and selection color, and `highlightColor` overrides it.

```tsx
<div className="ood-primary" style={{ height: 600 }}>
  <GalaxyMap systems={systems} spacelanes={spacelanes} />
</div>
```

### Legends

`SystemGlyph` and `SpacelaneSegment` draw exactly what the map draws:

```tsx
<svg width={16} height={16}>
  <SystemGlyph x={8} y={8} color={faction.color} />
</svg>
```

See [the API design](./docs/internal/architecture/api-design.md) for every prop and method, and [MIGRATION.md](./MIGRATION.md) to upgrade from v0.
