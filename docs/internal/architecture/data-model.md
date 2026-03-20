# Data Model

## Core Interfaces

### `IPlanet`

Represents a named location on the map.

| Field        | Type         | Required | Description                                                 |
| ------------ | ------------ | -------- | ----------------------------------------------------------- |
| `id`         | `string`     | Yes      | Unique identifier used for selection tracking               |
| `name`       | `string`     | Yes      | Display name shown as an SVG label                          |
| `x`          | `number`     | Yes      | Horizontal coordinate in the map's coordinate space         |
| `y`          | `number`     | Yes      | Vertical coordinate in the map's coordinate space           |
| `color`      | `MapColor`   | Yes      | Color of the planet marker                                  |
| `focusLevel` | `FocusLevel` | Yes      | Minimum zoom at which the planet is visible in dynamic mode |

### `ISpacelane`

Represents a route or connection between two points on the map.

| Field        | Type         | Required | Description                                                    |
| ------------ | ------------ | -------- | -------------------------------------------------------------- |
| `id`         | `string`     | Yes      | Unique identifier                                              |
| `name`       | `string`     | Yes      | Display name (shown in legend or on hover, if implemented)     |
| `xOne`       | `number`     | Yes      | X coordinate of the first endpoint                             |
| `yOne`       | `number`     | Yes      | Y coordinate of the first endpoint                             |
| `xTwo`       | `number`     | Yes      | X coordinate of the second endpoint                            |
| `yTwo`       | `number`     | Yes      | Y coordinate of the second endpoint                            |
| `color`      | `MapColor`   | Yes      | Color of the spacelane line                                    |
| `focusLevel` | `FocusLevel` | Yes      | Minimum zoom at which the spacelane is visible in dynamic mode |

## Enums

### `MapColor`

```typescript
enum MapColor {
  Gray,
  Red,
  Blue,
  Green,
  Yellow,
  Magenta,
  Aqua,
  Brown,
}
```

Each value resolves to a CSS custom property: `var(--ood-color-<name>)`.

### `FocusLevel`

```typescript
enum FocusLevel {
  Primary, // 0 — visible at the lowest zoom
  Secondary, // 1
  Tertiary, // 2
  Quaternary, // 3 — visible only at the highest zoom
}
```

### `MapItemVisibility`

```typescript
type MapItemVisibility = "dynamic" | "show" | "hide";
```

- `"dynamic"` — visibility follows the FocusLevel threshold for the current zoom
- `"show"` — always visible regardless of zoom
- `"hide"` — always hidden regardless of zoom

## Configuration Interfaces

### `IMapOptions`

Controls default visibility behavior, overridable by the user at runtime.

| Field                   | Type                | Default     | Description                                     |
| ----------------------- | ------------------- | ----------- | ----------------------------------------------- |
| `planetLabelVisibility` | `MapItemVisibility` | `"dynamic"` | Visibility of planet text labels                |
| `planetVisibility`      | `MapItemVisibility` | `"dynamic"` | Visibility of planet markers                    |
| `spacelaneVisibility`   | `MapItemVisibility` | `"dynamic"` | Visibility of spacelane lines                   |
| `customOptions`         | `ReactNode`         | `undefined` | Additional UI rendered inside the options panel |

### `LegendEntry`

| Field   | Type       | Description                          |
| ------- | ---------- | ------------------------------------ |
| `label` | `string`   | Text shown in the legend             |
| `color` | `MapColor` | Color swatch shown next to the label |
