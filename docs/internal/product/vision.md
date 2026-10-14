# Product Vision

## Problem We Solve

Building interactive, data-driven galactic maps in React requires significant custom SVG work, touch/mouse event handling, and zoom/pan logic. Developers building space-themed applications — games, lore wikis, simulation UIs — have no off-the-shelf component that handles this domain specifically.

`@outoforbitdev/galaxy-map` solves this by providing a ready-made React component that renders star systems and spacelanes on a coordinate-based SVG canvas, with built-in zoom, pan, and priority-based culling — so consuming applications can focus on their data and logic rather than map infrastructure.

## Long-Term Direction

- **Richer interaction** — Selection, hover, and keyboard focus for systems and spacelanes exist today. Extend them with the actions consumers ask for.
- **Expanded customization** — More color palette options, theming hooks, and per-item styling overrides.
- **Performance at scale** — Keep rendering efficient for maps with thousands of systems and spacelanes, using spatial indexes and culling.
- **Accessibility** — Keyboard navigation and ARIA labeling exist today. Keep improving screen reader support.
- **Overview mini-map** — An optional overview map for large coordinate spaces. Legends are built by consumers from `SystemGlyph` and `SpacelaneSegment`.
- **Framework neutrality** — Evaluate wrapping the core SVG logic in a framework-agnostic package, leaving React bindings as a thin layer.
