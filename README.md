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
- Handles 6,000 systems and 20,000 lane segments by drawing only what is in view.
- Priority order decides which systems and labels show when not everything fits.
- Drag, scroll, and pinch on desktop, trackpad, and touch. Gestures never scroll the page.
- Selection, hover, and keyboard navigation, with controlled and uncontrolled modes.
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
    <div style={{ height: 600 }}>
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

Draw a route as a spacelane placed first in `spacelanes`, so it draws on top and is never culled. Give it a `className` and style it with ordinary CSS. The class goes on the lane's group, and the lane's paths inherit from it:

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

- **Map-wide:** pass `className` to `GalaxyMap`. `font` sets the label font, `color` sets the highlight and selection color, `stroke-width` sets the default lane width, and `.my-map text { stroke: ...; }` changes the label outline (a dark outline by default, so labels stay readable over a glyph of the same color). The `highlightColor` prop also sets the highlight color, and takes priority over the map's class.
- **One system or lane:** set `className` on the `ISystem` or `ISpacelane`. The class goes on the entity's group, so properties like `font`, `fill`, and `stroke-width` apply to its label or lane paths. Labels are filled with the system's color by default, and a class on the system overrides that with `fill`. Use descendant selectors, such as `.capital text`, to target one part.

```css
.my-map {
  font:
    14px Georgia,
    serif;
  color: gold;
}
```

### Legends

`SystemGlyph` and `SpacelaneSegment` draw exactly what the map draws:

```tsx
<svg width={16} height={16}>
  <SystemGlyph x={8} y={8} color={faction.color} />
</svg>
```

See [the API design](./docs/internal/architecture/api-design.md) for every prop and method, and [MIGRATION.md](./MIGRATION.md) to upgrade from v0.
