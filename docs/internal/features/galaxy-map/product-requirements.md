# Product Requirements: Galaxy Map

## Overview

The `GalaxyMap` component is the primary deliverable of this library. It allows consuming applications to render a navigable, zoomable 2D map of planets and spacelanes.

## User Stories

- As **Carla the Consumer**, I want to pass my planet and spacelane data to a single component and get an interactive map, so that I don't have to implement SVG rendering myself.
- As **Edward the Explorer**, I want to zoom and pan the map fluidly on desktop and mobile, so that I can navigate large coordinate spaces without losing orientation.
- As **Edward the Explorer**, I want to click on a planet to trigger an action in the application, so that the map is interactive and not just decorative.
- As **Edward the Explorer**, I want to toggle the visibility of labels, planets, and spacelanes, so that I can reduce clutter when exploring.

## Acceptance Criteria

- [ ] Planets render at their specified coordinates with correct color and label.
- [ ] Spacelanes render as lines connecting two coordinate pairs.
- [ ] Zoom and pan work on both desktop (mouse) and mobile (touch).
- [ ] Clicking a planet calls `onPlanetSelect` with the correct `IPlanet`.
- [ ] The options panel toggles visibility of planets, labels, and spacelanes.
- [ ] An optional legend renders when `legendEntries` is provided.
- [ ] Items with `FocusLevel.Primary` are always visible at default zoom.
- [ ] Items with `FocusLevel.Quaternary` are hidden at default zoom in dynamic mode.
