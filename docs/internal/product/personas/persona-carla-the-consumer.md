# Persona: Carla the Consumer

## Overview

Carla represents the **developer or React application** that integrates `@outoforbitdev/galaxy-map` as a dependency.

## Profile

- **Role:** Frontend developer building a space-themed application (game UI, lore wiki, simulation dashboard, etc.)
- **Tech familiarity:** Comfortable with React, TypeScript, and npm. Familiar with component props and JSX.
- **Relationship to this library:** Carla is a consumer, not a contributor. She installs the package, passes data via props, and expects things to work.

## Goals

- Render a galaxy map with her application's planet and spacelane data quickly, without writing custom SVG logic.
- Customize colors and visibility to match her application's design language.
- Hook into user interactions (planet clicks) to drive her own application state.
- Keep her bundle size reasonable; she doesn't want a heavy dependency.

## Pain Points

- Confusing or unstable APIs that require changes when the library updates.
- Missing TypeScript types forcing her to write `any` casts.
- Props that are hard to discover — she relies on IntelliSense and README examples.
- Unexpected re-renders or performance issues when her planet list changes.

## How She Uses the Library

1. Installs `@outoforbitdev/galaxy-map` via npm/yarn.
2. Imports `GalaxyMap` and `MapColor` in her component file.
3. Constructs `IPlanet[]` and `ISpacelane[]` arrays from her data source.
4. Passes them to `<GalaxyMap>` along with `dimensions` and optional `zoom` config.
5. Wires `onPlanetSelect` to her own state or router to respond to clicks.
6. Optionally adds a `legendEntries` array or `mapOptions.customOptions` for app-specific UI.

## Success Criteria

Carla is successful when she can go from `npm install` to a working, styled map in her application without reading more than the README.
