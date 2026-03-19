# Product Vision

## Problem We Solve

Building interactive, data-driven galactic maps in React requires significant custom SVG work, touch/mouse event handling, and zoom/pan logic. Developers building space-themed applications — games, lore wikis, simulation UIs — have no off-the-shelf component that handles this domain specifically.

`@outoforbitdev/galaxy-map` solves this by providing a ready-made React component that renders planets and spacelanes on a coordinate-based SVG canvas, with built-in zoom, pan, and dynamic visibility — so consuming applications can focus on their data and logic rather than map infrastructure.

## Long-Term Direction

- **Richer interaction** — Support for clicking planets/spacelanes to trigger application-defined actions, with a growing selection callback API.
- **Expanded customization** — More color palette options, theming hooks, and per-item styling overrides.
- **Performance at scale** — Efficient rendering for maps with hundreds or thousands of planets and spacelanes using virtualization or level-of-detail techniques.
- **Accessibility** — Keyboard navigation, screen reader support, and ARIA labeling for map elements.
- **Embeddable legend and mini-map** — Built-in legend and optional overview mini-map for large coordinate spaces.
- **Framework neutrality** — Evaluate wrapping the core SVG logic in a framework-agnostic package, leaving React bindings as a thin layer.
