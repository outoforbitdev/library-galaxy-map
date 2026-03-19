# Pattern: Focus Level Visibility

## Summary

Map items (planets and spacelanes) declare a `FocusLevel` that determines the minimum zoom threshold at which they appear when `MapItemVisibility` is set to `"dynamic"`.

## Intent

Avoid cluttering the map at low zoom levels. Show only high-importance items when zoomed out, progressively revealing detail as the user zooms in.

## How It Works

- `FocusLevel.Primary` — visible at all zoom levels (most important items)
- `FocusLevel.Secondary` — visible at medium zoom and above
- `FocusLevel.Tertiary` — visible at high zoom
- `FocusLevel.Quaternary` — visible only at maximum zoom (least important items)

The `getFocusClassName()` utility in `FocusLevels.tsx` maps a `FocusLevel` to a CSS class. The CSS then uses `@media`-like rules or class-based visibility driven by the current zoom state.

## Usage

Assign `focusLevel` when creating `IPlanet` or `ISpacelane` objects:

```typescript
const majorPlanet: IPlanet = {
  id: "earth",
  name: "Earth",
  x: 100,
  y: 0,
  color: MapColor.Blue,
  focusLevel: FocusLevel.Primary, // Always visible
};

const minorOutpost: IPlanet = {
  id: "outpost-7",
  name: "Outpost 7",
  x: 150,
  y: 50,
  color: MapColor.Gray,
  focusLevel: FocusLevel.Quaternary, // Only visible when zoomed in
};
```

## Override

Set `MapItemVisibility` to `"show"` or `"hide"` on individual item categories to bypass this pattern entirely for that category.
