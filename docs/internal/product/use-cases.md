# Use Cases

> **Status:** Draft

## Purpose

This document describes the use cases that the galaxy map rebuild is designed around. It captures _what_ each consumer needs to accomplish, not _how_ the map provides it. Requirements are derived from this document and live in [requirements/](../requirements/).

The rebuild prioritizes two use cases:

1. [Galactic atlas website](#use-case-1-galactic-atlas-website).
2. [Galactic conquest strategy game](#use-case-2-galactic-conquest-strategy-game).

Both use cases render the same kind of data: star systems and multi-segment spacelanes, each with coordinates and colors, on a pannable and zoomable map. They differ in how often that data changes, what is drawn on top of it, and how users interact with it.

## Use case 1: Galactic atlas website

**Personas:** [Andrea the Atlas Builder](./personas/persona-andrea-the-atlas-builder.md) builds it. [Arlo the Atlas User](./personas/persona-arlo-the-atlas-user.md) uses it.

### Summary

A mostly static, informational website for exploring a fictional galaxy. The map is the centerpiece of the page. Users explore the galaxy, look up systems, see how faction control changed over time, and plan routes between systems.

### Scale

- About 6,000 star systems and 500 spacelanes, made up of about 20,000 lane segments.
- The full dataset is loaded once. It is small enough to hold in memory on the client.

### Scenarios

| Scenario                 | Description                                                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Explore the galaxy       | Arlo pans and zooms around the galaxy on desktop or mobile. Zoomed out, the map shows a sparser overview; zoomed in, it shows more systems and labels.                               |
| Inspect a system or lane | Arlo clicks or taps a system or spacelane. Andrea's site shows an infobox with lore about it.                                                                                        |
| Switch time periods      | Arlo picks a different era. Faction control, and which systems and lanes exist, change instantly. The camera stays where it was, and the selection stays if the entity still exists. |
| Search for a system      | Arlo types a system name into Andrea's search box. The map centers on the result and selects it.                                                                                     |
| Plan a route             | Arlo picks two systems. Andrea's site computes a route, draws it on the map so it stands out from ordinary lanes, and frames the camera around it.                                   |
| Read the legend          | Arlo checks Andrea's legend to see which color belongs to which faction. Legend swatches match the map exactly.                                                                      |
| Share a view             | Arlo copies the page URL. Opening it on another device restores the same place on the map and the same selection.                                                                    |

### What makes this use case distinct

- **Data changes rarely, and all at once.** A time period change swaps in an entirely new set of systems and lanes. Between changes, the data is static.
- **The page owns the chrome.** Andrea builds the infobox, legend, search box, time period control, and settings in the site's own layout and style.
- **Mobile is a real target.** Many atlas readers arrive on phones, so touch navigation and tap selection must work as well as mouse input.
- **The map may be embedded in a scrolling page.** Scroll, drag, and pinch gestures over the map belong to the map and must never scroll the page instead. As an accepted tradeoff, readers cannot scroll the page by dragging on the map, so the atlas layout must leave room to scroll past it, for example with a fixed map height and scrollable margins.

## Use case 2: Galactic conquest strategy game

**Personas:** [Gavin the Game Developer](./personas/persona-gavin-the-game-developer.md) builds it. [Priya the Player](./personas/persona-priya-the-player.md) plays it.

### Summary

A single-player galactic conquest strategy game with a React UI. The map is one component among many in a live game interface, surrounded by HUD panels. It shows the current game state and serves as the main surface for reading and acting on that state.

### Scale

- The same order of magnitude as the atlas: thousands of systems and hundreds of spacelanes.
- Game state changes frequently, usually a handful of systems or lanes at a time.

### Scenarios

| Scenario                     | Description                                                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Read the state of the galaxy | Priya scans the map to see which faction controls which systems and lanes.                                                                                                     |
| See per-system game data     | Priya sees fleets orbiting systems and persistent indicators such as taxable income, drawn on or next to each system.                                                          |
| Inspect a system             | Priya selects a system. Gavin's game shows a panel with detailed stats such as fleet strength and income.                                                                      |
| Watch the state change       | When a turn resolves, systems and lanes change owner. The map updates without losing the camera position or the current selection.                                             |
| Issue orders                 | Priya gives fleet orders, for example by dragging from a fleet to a destination system. Gavin builds this interaction on top of the map rather than inside it.                 |
| Watch fleets move            | Nice to have. Fleets animate along spacelanes toward their destinations.                                                                                                       |
| Jump to a location           | Gavin's UI centers the map on a system, for example when Priya clicks an event notification. Parts of the map covered by HUD panels are accounted for when framing the camera. |

### What makes this use case distinct

- **Data changes often, and in small pieces.** Most updates recolor or annotate a few systems or lanes. Updates must stay cheap and must not disturb the camera or selection.
- **Rich content is drawn on the map.** Fleets, badges, and stat indicators are part of the map, not a separate panel.
- **The game adds its own interactions.** Gavin needs to build custom gestures, such as drag-to-order, without forking the map.
- **The map shares the screen.** HUD panels cover parts of the map, and the rest of the game UI needs to react to what the map is showing.

## Needs shared by both use cases

- Render thousands of systems and lanes smoothly on desktop and mobile.
- Pan and zoom with mouse, trackpad, and touch.
- Select and hover systems and lanes, and let the consumer react to it.
- Keep systems and labels readable at every zoom level, without clutter or overlapping labels.
- Let the consumer move the camera programmatically.
- Let the consumer own domain concepts such as factions, time, routes, and game state. The map renders what it is given.
- Let the consumer own UI chrome such as infoboxes, legends, search, and settings, while matching the map's visuals exactly.

## How the use cases differ

| Dimension             | Atlas                                      | Game                                          |
| --------------------- | ------------------------------------------ | --------------------------------------------- |
| Data update frequency | Rare, whole-dataset swaps                  | Frequent, small partial updates               |
| Content drawn on map  | Systems, lanes, labels, highlighted routes | Systems, lanes, labels, fleets, badges, stats |
| Interaction           | Explore, select, search, share             | Select, plus custom game gestures             |
| Surrounding UI        | Page layout owned by the atlas             | HUD panels overlapping the map                |
| Primary devices       | Desktop and mobile                         | Desktop only                                  |
| Persistence           | Viewport and selection in the URL          | Owned by the game's own state                 |

## Non-goals

- **Video rendering.** Rendering scripted, frame-accurate lore videos was considered and dropped. It requires deterministic, frame-by-frame capture that conflicts with optimizing for the interactive use cases.
- **Multiplayer and fog of war.** The game use case is single-player, with full information shown on the map.
- **Non-React consumers.** All consumers are React applications.

## Deferred

- **Non-system geography.** Nebulae, territory borders, shaded regions, and sector or region labels will be discussed separately.
- **Lane labels.** Lanes carry names, but placing labels along lanes is deferred.
