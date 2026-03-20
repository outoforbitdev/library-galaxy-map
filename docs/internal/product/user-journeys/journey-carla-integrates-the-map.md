# User Journey: Carla Integrates the Map

> **Persona:** [Carla the Consumer](../personas/persona-carla-the-consumer.md) > **Status:** Draft

## Scenario

Carla is building a React application that needs to display a fictional galaxy. She discovers `@outoforbitdev/galaxy-map` and wants to get a working map into her app.

## Steps

1. **Discovery** — Carla finds the package on npm or GitHub. She reads the README to understand what it does.
2. **Installation** — She runs `npm install @outoforbitdev/galaxy-map` and adds the import to her component.
3. **Data preparation** — She maps her application's planet objects to `IPlanet[]` and spacelane objects to `ISpacelane[]`, assigning `MapColor` and `FocusLevel` values.
4. **Initial render** — She adds `<GalaxyMap planets={...} spacelanes={...} dimensions={...} />` and verifies the map appears.
5. **Configuration** — She adjusts `zoom.initial`, colors, and `mapOptions` to match her app's design.
6. **Interaction wiring** — She adds `onPlanetSelect` to handle planet clicks and route the user to a detail view.
7. **Deployment** — She ships the feature and confirms the map works on both desktop and mobile.

## Success

The map renders correctly, planet clicks trigger the expected behavior, and the integration took less than a day.
