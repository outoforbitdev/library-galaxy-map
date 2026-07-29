## 0.1.1 (2026-07-29)

### Bug Fixes

- Fixed the npm publish workflow, which was failing with a `404` on release because npm's Trusted Publisher (OIDC) configuration for this package required a newer npm CLI and no longer worked with the legacy `NPM_TOKEN`-based authentication.

## 0.1.0 (2026-07-28)

### Breaking Changes

- Complete rewrite of `GalaxyMap`, replacing the alpha's data model, API, and rendering approach entirely. There is no upgrade path — consumers will need to update their integration code.
  - `dimensions` is now `{ min: { x, y }, max: { x, y } }` instead of `{ minX, maxX, minY, maxY }`.
  - `FocusLevel` is removed. Render priority is now determined solely by position in the `planets`/`spacelanes` input arrays, combined with a new required `renderLimits` prop (`{ planets, planetLabels, spacelanes }`) that caps how many viewport-visible items render. Consumers can no longer assign per-item visibility.
  - `ISpacelane` is now a multi-segment, multi-color route: `{ id, name?, segments: ISpaceLaneSegment[] }`, where each segment carries its own `origin`, `destination`, and `color`.
  - `mapOptions.planetVisibility` and related visibility options are removed; the options panel now exposes render limit controls instead.
  - Zoom/pan is implemented via an SVG transform (wheel, click-drag, touch, and pinch), not per-item CSS classes. Programmatic navigation is available via `ref.zoomTo({ coordinate, zoom? })`, animated with ease-in-out cubic easing.
  - Package exports are now `GalaxyMap` (default) plus `IGalaxyMapHandle`, `IPlanet`, `ISpacelane`, `ISpaceLaneSegment`, `IMapCoordinate`, `IMapDimensions`, `IRenderLimits`, `ILegendEntry`, `IMapOptions`, and `MapColor` — see the updated Storybook stories for usage examples of the full component surface.

### Features

- Priority-ordered render caps with viewport culling: items outside the current viewport don't consume render capacity, so panning into a region reveals lower-priority items there instead of them staying permanently hidden.
- Debounced label collision detection. The selected planet is always a labeling candidate, even beyond the label limit.
- Overlapping planet dots are culled at low zoom so dense clusters stay legible, without ever exceeding `renderLimits.planets`.
- Planet labels are colored to match their planet and rendered with a halo for legibility against planets and spacelanes underneath.
- Collapsible legend and options panel overlay, with `leftChildren`/`rightChildren` slots for consumer-provided UI.

### Bug Fixes

- Planet dots now maintain an approximately constant on-screen size across zoom levels, instead of shrinking to invisible when zoomed out or growing oversized when zoomed in.
- Clicking a planet or label no longer fires selection when it's actually the tail end of a click-and-drag pan gesture.
- The map's default sizing no longer silently overrides a consumer's own height/width styling, regardless of CSS load order.
- Clicking a planet label selects its planet again, matching planet dots (this had been dropped in the rewrite).
- Wheel-zooming or touch gestures on the map no longer scroll or zoom the surrounding page along with it.
- Pinch-zoom and touch-drag pan no longer stutter or produce a much smaller change than the actual gesture, which happened because rapid touch events could be read before the map's zoom/pan state had finished updating from the previous one.

## 0.0.11 (2025-10-16)

### Features

- Added a map legend

### Bug Fixes

- Allow selecting a planet immediately after dragging.

## 0.0.10 (2025-10-02)

### Features

- This update adds support for selecting a planet, via a `onPlanetSelect` function included in the component props.

## 0.0.9 (2025-09-08)

### Breaking Changes

- The zoom direction for scrolling has been reversed to match Google Maps:
  - On Windows scrolling up zooms in and scrolling down zooms out
  - On MacOS scrolling up zooms out and scrolling down zooms in

## 0.0.8 (2025-04-05)

### Breaking Changes

- This update includes a major change in the way that the Map Options window functions.
  - The default options (`hidePlanetLabels`, `showPlanets`, and `showSpacelanes`) have been renamed to `planetLabelVisibility`, `planetVisibility`, and `spacelaneVisbility`, and accept any of the following strings: `show`, `dynamic` (default), or `hide`.
    - Note that the `planetLabelVisibility` may not exceed the the `planetVisibility`. For example, if `planetVisibility` is `dynamic` and `planetLabelVisibility` is `show`, then `planetLabelVisibility` will be ignored.
    - These options are now rendered as dropdown menus in the options window instead of boolean checkboxes.
  - Instead of providing complex objects for `customOptions`, consumers now provide a `ReactNode`. This allows for full components of any type to be added to the options window, greatly expanding the options for consumers.

## 0.0.7 (2025-03-20)

### Breaking Changes

- This update includes a major change in the way that the map is rendered. Instead of redrawing the SVG with every change in zoom, the map is now an SVG that is scaled, using CSS classes to scale and selectively hide planets and spacelanes. To accomplish this, the method of specifying the focus level of a map object is now to use the new `FocusLevel` enum rather than an integer that represented the current amount of zoom.

- This update also removes support for labeling Spacelanes. The labels just weren't good enough so we've removed them until we can implement them with the quality we want.

## 0.0.6 (2025-02-07)

### Bug Fixes

- include relevant files in npm release

## 0.0.1 (2025-02-02)

### Features

- first release of prototype library
