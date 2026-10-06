# Data Model

> **Status:** Approved design for the rebuild

Public types follow the repo convention of a leading `I` for interfaces. See the [architecture overview](./overview.md) for how the map uses them, and [API design](./api-design.md) for the props that accept them.

## Coordinates

```ts
interface IPoint {
  x: number;
  y: number;
}

interface IBounds {
  min: IPoint;
  max: IPoint;
}
```

- `GalaxyMap` world coordinates use **positive y for up** and negative y for down, the inverse of SVG's default. `Canvas` supports both through its `yAxis` prop.
- Coordinates are in arbitrary world units chosen by the consumer.

## Entities

```ts
interface ISystem<TData = unknown> {
  id: string;
  name: string;
  position: IPoint;
  color: string;
  className?: string;
  data?: TData;
}

interface ILaneSegment {
  id: string;
  origin: IPoint;
  destination: IPoint;
  color: string;
}

interface ISpacelane<TData = unknown> {
  id: string;
  name: string;
  segments: ILaneSegment[];
  className?: string;
  data?: TData;
}
```

| Field       | Meaning                                                                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`        | Stable identifier. Unique among entities of the same kind: a system and a lane may share an id. Segment ids are unique among segments.                               |
| `name`      | Shown as the system's label when level of detail allows, and always used as the accessible name.                                                                     |
| `position`  | The system's location in world coordinates.                                                                                                                          |
| `color`     | Any valid CSS color, including `var(--custom-property)`. Applied as the glyph fill or segment stroke. Consumer UI such as legends can reuse the same string exactly. |
| `className` | Optional class on the system's or lane's group, for styling beyond color, such as a thicker or dashed route.                                                         |
| `data`      | Consumer data, returned fully typed in events and overlay rendering. The map never reads it.                                                                         |
| `segments`  | A lane's segments. Each has its own color, so a lane can show several factions.                                                                                      |

## Priority order

The order of the `systems` and `spacelanes` arrays is their priority, highest first.

- When items conflict during culling, the earlier item is kept.
- Higher-priority items are drawn on top of lower-priority ones.
- A route is drawn above ordinary lanes, and never culled in favor of them, by placing it first in `spacelanes`.
- The selected entity is always treated as the highest priority.

## Lanes and segments

- Lanes are defined by coordinates, not by references to systems. A lane can pass through points where no system exists.
- Segments are not required to connect. Gaps and branches are allowed.
- Adjacent segments with the same color are drawn as one path only where one segment's destination exactly equals the next segment's origin. This is a rendering detail: every segment keeps its id.

## Selection and hover

```ts
type EntityKind = "system" | "lane";

interface IEntityRef {
  kind: EntityKind;
  id: string;
}

type MapEntityEvent<TSystemData = unknown, TLaneData = unknown> =
  | { kind: "system"; id: string; system: ISystem<TSystemData> }
  | {
      kind: "lane";
      id: string;
      lane: ISpacelane<TLaneData>;
      segmentId: string;
    };
```

- `IEntityRef` identifies an entity. It is the type of the controlled `selected` prop and the `select()` method.
- `MapEntityEvent` is passed to `onSelect` and `onHover`. Narrowing on `kind` gives a fully typed `system` or `lane`, including its `data`.
- For lanes, `segmentId` is the segment nearest the pointer.
- `null` means nothing is selected or hovered.

## Viewport

```ts
interface IViewport {
  center: IPoint;
  zoom: number;
}

interface IPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
```

- `zoom` is a scale in **screen pixels per world unit**. At the same viewport, every device shows the same level of detail, and smaller screens show less area.
- The viewport does not depend on container size, so it can be stored in a URL and shared.
- Padding can be given as one number for all sides or as an `IPadding`.

## Validation

In development builds, the map warns once per problem about:

- Duplicate ids within a kind.
- Non-finite coordinates. The affected system or segment is skipped.
- Colors that are not valid CSS colors.
- Lane segments whose ends almost but not exactly meet.

Production builds skip validation.
