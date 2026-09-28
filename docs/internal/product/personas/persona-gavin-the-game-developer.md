# Persona: Gavin the Game Developer

> **Status:** Draft

## Overview

Gavin represents the **developer who builds a galactic conquest strategy game** using `@outoforbitdev/galaxy-map`. See [Use case 2: Galactic conquest strategy game](../use-cases.md#use-case-2-galactic-conquest-strategy-game).

## Profile

- **Role:** Game developer building a single-player strategy game whose UI is written in React.
- **Tech familiarity:** Comfortable with React and TypeScript, and with managing frequently changing application state. Cares about frame rate and update cost.
- **Data:** Owns the full game state: factions, fleets, economy, and turn resolution. The map shows a projection of that state.
- **Relationship to this library:** A consumer, not a contributor. The map is one component inside a larger game UI that Gavin controls.

## Goals

- Show the current game state on the map, including ownership colors for systems and individual lane segments.
- Draw game-specific content on the map, such as fleets, badges, and income indicators, without reimplementing positioning or zoom math.
- Attach game data to systems and lanes and get it back, fully typed, when drawing that content or handling events.
- Update a few systems or lanes each turn cheaply, without disturbing the camera or selection.
- Build custom interactions, such as dragging fleet orders, on top of the map without forking it.
- Move the camera from code, accounting for HUD panels that cover part of the map.
- Know which systems are currently visible, so other parts of the game UI can react.

## Pain Points

- Small state changes that cause the whole map to re-render or rebuild internal structures.
- Maps that assume they own the screen, or render UI that conflicts with the game's HUD.
- Having no way to add custom gestures or content except forking the library.
- Opaque data fields that force `any` casts in game code.
- Overlays that drift out of position, or cover the system underneath so it can't be clicked.

## How Gavin Uses the Library

1. Renders the map inside the game layout, alongside HUD panels.
2. Derives system and lane colors from game state each turn and passes them to the map.
3. Attaches fleet and economy data to systems and supplies content for the map to draw on top of each system.
4. Responds to selection events by opening game panels with detailed stats.
5. Builds order-giving gestures using coordinate conversion helpers and by disabling map panning when needed.
6. Moves the camera in response to game events, such as notifications.

## Success Criteria

Gavin is successful when the map reflects game state at a steady frame rate through many turns, and every game-specific feature is built with documented extension points rather than by forking or reaching into the map's internals.
