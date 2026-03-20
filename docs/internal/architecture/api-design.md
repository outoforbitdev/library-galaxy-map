# API Design

## Public API Surface

The library exports three symbols from `src/index.ts`:

```typescript
export { default } from "./components/GalaxyMap"; // The GalaxyMap component
export { MapColor } from "./components/Colors";
export { FocusLevel } from "./components/FocusLevels";
```

Consumers import like:

```typescript
import GalaxyMap, { MapColor, FocusLevel } from "@outoforbitdev/galaxy-map";
```

## `GalaxyMap` Component Props (`IMapProps`)

| Prop                | Type                              | Required | Default     | Description                            |
| ------------------- | --------------------------------- | -------- | ----------- | -------------------------------------- |
| `planets`           | `IPlanet[]`                       | Yes      | —           | Planets to render                      |
| `spacelanes`        | `ISpacelane[]`                    | Yes      | —           | Spacelanes to render                   |
| `dimensions.minX`   | `number`                          | Yes      | —           | Left bound of the coordinate space     |
| `dimensions.minY`   | `number`                          | Yes      | —           | Top bound of the coordinate space      |
| `dimensions.maxX`   | `number`                          | Yes      | —           | Right bound of the coordinate space    |
| `dimensions.maxY`   | `number`                          | Yes      | —           | Bottom bound of the coordinate space   |
| `mapOptions`        | `IMapOptions`                     | No       | `undefined` | Visibility defaults and custom options |
| `legendEntries`     | `LegendEntry[]`                   | No       | `undefined` | Entries for the legend overlay         |
| `zoom.initial`      | `number`                          | No       | `1`         | Starting zoom level                    |
| `zoom.min`          | `number`                          | No       | —           | Minimum zoom level (clamp)             |
| `zoom.max`          | `number`                          | No       | —           | Maximum zoom level (clamp)             |
| `onPlanetSelect`    | `(planet: IPlanet) => void`       | No       | `undefined` | Called when a planet is clicked        |
| `onSpacelaneSelect` | `(spacelane: ISpacelane) => void` | No       | `undefined` | Called when a spacelane is clicked     |
| `selectedPlanetId`  | `string`                          | No       | `undefined` | ID of the currently selected planet    |

`IMapProps` also extends `IComponentProps` from `@outoforbitdev/ood-react`, which passes through standard HTML div attributes.

## API Stability

- Props marked **Required** are stable and will not be removed without a major version bump.
- Optional props may be added in minor versions.
- Breaking changes to existing props require a major version bump (semver).

## Design Principles

- **Props are the contract.** The component has no public methods or refs exposed to consumers.
- **Callbacks are optional.** All event callbacks use `?` — the component renders without them.
- **No controlled/uncontrolled ambiguity.** Visibility state is internally managed; `mapOptions` provides initial values only.
