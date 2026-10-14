# Product Strategy

## Priorities

1. **Correctness over features** — The map must render accurately at all zoom levels before new capabilities are added. A broken zoom or mis-rendered system destroys trust immediately.
2. **Consumer DX (developer experience) first** — The integration path for [Andrea the Atlas Builder](./personas/persona-andrea-the-atlas-builder.md) and [Gavin the Game Developer](./personas/persona-gavin-the-game-developer.md) must stay simple. Prop APIs are stable and minimal; breaking changes are avoided or clearly versioned.
3. **Interactive quality for end users** — [Arlo the Atlas User](./personas/persona-arlo-the-atlas-user.md) and [Priya the Player](./personas/persona-priya-the-player.md) need smooth drag, zoom, and touch interactions. Jank or dropped inputs are high-priority bugs.
4. **Small bundle footprint** — This is a library, not an application. Tree-shaking, minimal peer deps, and no bundled runtime bloat are non-negotiable.

## Tradeoffs

| Decision                    | Choice                        | Rationale                                                                             |
| --------------------------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| SVG vs Canvas               | SVG                           | Simpler DOM integration, easier styling, sufficient performance for typical map sizes |
| React dependency            | Required peer dep             | Keeps bundle lean; consumers already have React                                       |
| No built-in data fetching   | Consumers pass data as props  | Keeps the component pure and composable; avoids opinionated data layer                |
| Visibility                  | Priority-ordered data, culled | The array order decides what shows, so consumers need no per-item zoom thresholds     |
| Colors                      | CSS color strings from props  | No enum or theme coupling; consumers pass any CSS color (see TC-3)                    |
| Pure core with direct tests | Pure modules, unit-tested     | Math and culling stay testable without React or a DOM                                 |

## What We Are Not Building

- A general-purpose SVG or mapping library (use D3 or Leaflet for that)
- A 3D space renderer
- A data fetching or state management layer
- A standalone web application
