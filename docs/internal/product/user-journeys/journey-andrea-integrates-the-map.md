# User Journey: Andrea Integrates the Map

> **Persona:** [Andrea the Atlas Builder](../personas/persona-andrea-the-atlas-builder.md) > **Status:** Draft

## Scenario

Andrea is building a React atlas website that needs to display a fictional galaxy. They discover `@outoforbitdev/galaxy-map` and want to get a working map into their app.

## Steps

1. **Discovery:** Andrea finds the package on npm or GitHub. They read the README to understand what it does.
2. **Installation:** They run `npm install @outoforbitdev/galaxy-map` and add the import to their component.
3. **Data preparation:** They map their application's planet objects to `IPlanet[]` and spacelane objects to `ISpacelane[]`, assigning `MapColor` and `FocusLevel` values.
4. **Initial render:** They add `<GalaxyMap planets={...} spacelanes={...} dimensions={...} />` and verify the map appears.
5. **Configuration:** They adjust `zoom.initial`, colors, and `mapOptions` to match their app's design.
6. **Interaction wiring:** They add `onPlanetSelect` to handle planet clicks and route the user to a detail view.
7. **Deployment:** They ship the feature and confirm the map works on both desktop and mobile.

## Success

The map renders correctly, planet clicks trigger the expected behavior, and the integration took less than a day.
