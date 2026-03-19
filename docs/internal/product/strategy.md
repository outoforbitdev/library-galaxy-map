# Product Strategy

## Priorities

1. **Correctness over features** — The map must render accurately at all zoom levels before new capabilities are added. A broken zoom or mis-rendered planet destroys trust immediately.
2. **Consumer DX (developer experience) first** — Carla the Consumer's integration path must stay simple. Prop APIs are stable and minimal; breaking changes are avoided or clearly versioned.
3. **Interactive quality for end users** — Edward the Explorer needs smooth drag, zoom, and touch interactions. Jank or dropped inputs are high-priority bugs.
4. **Small bundle footprint** — This is a library, not an application. Tree-shaking, minimal peer deps, and no bundled runtime bloat are non-negotiable.

## Tradeoffs

| Decision                       | Choice                       | Rationale                                                                             |
| ------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------- |
| SVG vs Canvas                  | SVG                          | Simpler DOM integration, easier styling, sufficient performance for typical map sizes |
| React dependency               | Required peer dep            | Keeps bundle lean; consumers already have React                                       |
| No built-in data fetching      | Consumers pass data as props | Keeps the component pure and composable; avoids opinionated data layer                |
| FocusLevel enum for visibility | Coarse 4-level system        | Simpler than continuous zoom thresholds; covers most use cases                        |
| CSS variables for colors       | `var(--ood-color-*)`         | Enables theming without JS; piggybacks on the ood design system                       |
| No unit tests yet              | Known gap                    | Accepted early-stage tradeoff; test infrastructure is a backlog priority              |

## What We Are Not Building

- A general-purpose SVG or mapping library (use D3 or Leaflet for that)
- A 3D space renderer
- A data fetching or state management layer
- A standalone web application
