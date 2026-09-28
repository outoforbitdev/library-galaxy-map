# Core Functional Requirements

> **Status:** Draft for the rebuild

## About this document

These requirements describe what the rebuilt map must do, derived from the [use cases](../product/use-cases.md) and personas. They describe behavior and responsibility boundaries, not API shape. Prop, callback, and export names belong in [API design](../architecture/api-design.md).

Keywords follow RFC 2119: **MUST** is required for the rebuild, **SHOULD** is expected unless there is a good reason to skip it, and **MAY** is optional.

The **Source** column names who needs each requirement:

| Source | Meaning                                                                             |
| ------ | ----------------------------------------------------------------------------------- |
| Andrea | [Andrea the Atlas Builder](../product/personas/persona-andrea-the-atlas-builder.md) |
| Arlo   | [Arlo the Atlas User](../product/personas/persona-arlo-the-atlas-user.md)           |
| Gavin  | [Gavin the Game Developer](../product/personas/persona-gavin-the-game-developer.md) |
| Priya  | [Priya the Player](../product/personas/persona-priya-the-player.md)                 |
| Casey  | [Casey the Contributor](../product/personas/persona-casey-the-contributor.md)       |
| All    | Andrea, Arlo, Gavin, and Priya                                                      |

The **Phase** column says which release delivers each requirement. The rebuild ships in two phases:

| Phase | Meaning                                                                                                                                                                                                                                                         |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Atlas | Delivered in the first release, which meets the atlas use case. This includes game-motivated requirements that shape the architecture and would force a refactor if added later, such as cheap partial updates, typed consumer data, and overlay click routing. |
| Game  | Delivered in the second release, which extends the map for the game use case. These requirements are additive: the atlas release must leave room for them, for example a layer for content at arbitrary positions, but does not need to implement them.         |

## Responsibility boundary

The map owns spatial rendering and interaction: drawing, camera, gestures, hit-testing, and level of detail. Consumers own domain meaning and UI chrome: factions, time periods, routes, game state, legends, infoboxes, search, and settings panels.

| ID    | Requirement                                                                                                                                            | Source        | Phase |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | ----- |
| FR-B1 | The map MUST NOT contain any concept of factions, time periods, routes, or game state. It renders what the consumer passes in.                         | Andrea, Gavin | Atlas |
| FR-B2 | The map MUST NOT render a legend, infobox, search box, or options panel.                                                                               | Andrea, Gavin | Atlas |
| FR-B3 | The package MUST export the components that draw a system glyph and a lane segment, so consumer UI such as legends can reuse the exact same visuals.   | Andrea        | Atlas |
| FR-B4 | Any value the map renders with, such as a color, MUST be the exact value the consumer passed, so consumer UI can match it without a second definition. | Andrea        | Atlas |

## Data

| ID     | Requirement                                                                                                                                                                                                                      | Source              | Phase |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ----- |
| FR-D1  | The map MUST render star systems at consumer-supplied world coordinates. When a system is labeled, the label MUST show its name. Which systems are labeled is governed by FR-L3.                                                 | All                 | Atlas |
| FR-D2  | The map MUST render spacelanes made of multiple segments. Each segment has its own start point, end point, and color. Lanes are defined by coordinates, not by system references.                                                | All                 | Atlas |
| FR-D3  | Lanes MAY contain gaps and branches. The map MUST render them without assuming segments are continuous.                                                                                                                          | Andrea, Gavin       | Atlas |
| FR-D4  | Every system, lane, and lane segment MUST have a stable, consumer-supplied string id. Ids identify the same entity across data updates. Ids MUST be unique among entities of the same kind. A system and a lane MAY share an id. | All                 | Atlas |
| FR-D5  | Colors MUST accept any valid CSS color value supplied by the consumer. The map MUST NOT define a named color palette.                                                                                                            | Andrea, Gavin       | Atlas |
| FR-D6  | The consumer MUST be able to color each lane segment independently.                                                                                                                                                              | Gavin               | Atlas |
| FR-D7  | The consumer MUST be able to attach arbitrary data to systems and lanes. The map MUST return it, with its type preserved, in events and overlay content, and MUST NOT interpret it.                                              | Gavin               | Atlas |
| FR-D8  | The consumer MUST supply systems and lanes in priority order, highest priority first. When items conflict, the map MUST keep the earlier item, and MUST draw higher-priority items on top of lower-priority ones.                | Andrea, Arlo, Gavin | Atlas |
| FR-D9  | The map MUST render an empty, fully interactive map when given no systems or lanes.                                                                                                                                              | All                 | Atlas |
| FR-D10 | In development builds, the map SHOULD warn about invalid data: duplicate ids, non-finite coordinates, invalid CSS colors, and lane segments that almost but do not quite connect.                                                | Andrea, Gavin       | Atlas |
| FR-D11 | World coordinates MUST use positive y for up and negative y for down, the inverse of SVG's default, matching the pre-rebuild map.                                                                                                | Andrea, Gavin       | Atlas |

## Level of detail and legibility

| ID    | Requirement                                                                                                                                                                                                           | Source              | Phase |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ----- |
| FR-L1 | When zoomed out, the map MUST show a sparser view, based on priority (FR-D8). More systems MUST appear as the user zooms in.                                                                                          | Arlo, Priya         | Atlas |
| FR-L2 | System glyphs, labels, and lane stroke widths MUST stay the same size on screen at every zoom level. Only the distances between them change.                                                                          | Arlo, Priya         | Atlas |
| FR-L3 | Labels MUST NOT overlap. When labels would collide, the map MUST hide the labels of lower-priority systems (FR-D8).                                                                                                   | Arlo, Priya         | Atlas |
| FR-L4 | Label visibility SHOULD stay stable during a continuous pan or zoom. A label SHOULD NOT flicker on and off repeatedly during a single gesture.                                                                        | Arlo, Priya         | Atlas |
| FR-L5 | The consumer SHOULD be able to cap the number of systems rendered at once.                                                                                                                                            | Andrea, Gavin       | Atlas |
| FR-L6 | The package MAY export a helper that suggests level-of-detail settings based on how dense the data is. It MUST NOT render any UI.                                                                                     | Andrea              | Game  |
| FR-L7 | The selected system or lane MUST be treated as the highest priority when deciding what to show. It MUST always be shown, a selected system MUST show its label, and labels that would collide with it MUST be hidden. | Andrea, Arlo, Priya | Atlas |
| FR-L8 | Hovering MUST NOT change which systems, lanes, or labels are shown. It only adds a highlight.                                                                                                                         | Arlo, Priya         | Atlas |

## Gestures

| ID    | Requirement                                                                                                                                                                                                                                                          | Source        | Phase |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ----- |
| FR-G1 | Dragging with a mouse, or with one finger on a touch screen, MUST pan the map.                                                                                                                                                                                       | Arlo, Priya   | Atlas |
| FR-G2 | Scrolling MUST zoom the map, anchored at the pointer. This applies to mouse wheels and trackpads alike. Trackpad scrolling MUST NOT pan.                                                                                                                             | Arlo, Priya   | Atlas |
| FR-G3 | Pinching on a trackpad or touch screen MUST zoom the map, anchored at the center of the pinch.                                                                                                                                                                       | Arlo, Priya   | Atlas |
| FR-G4 | Scroll, drag, and pinch gestures over the map MUST NOT scroll or zoom the page. As an accepted tradeoff, the consumer's layout must leave room to scroll past the map.                                                                                               | Arlo          | Atlas |
| FR-G5 | A drag, pinch, or scroll MUST NOT count as a click or tap, even when it starts or ends on a system or lane.                                                                                                                                                          | Arlo, Priya   | Atlas |
| FR-G6 | User gestures MUST respect minimum zoom, maximum zoom, and pan bounds. By default, pan bounds MUST keep the view center within the data's bounding box plus a margin. The consumer MUST be able to configure the zoom limits and supply explicit pan bounds instead. | Andrea, Gavin | Atlas |
| FR-G7 | The consumer MUST be able to disable user panning and user zooming independently, so custom gestures such as drag-to-order don't conflict with the map's own gestures.                                                                                               | Gavin         | Game  |
| FR-G8 | The map MUST fill its container and adapt when the container is resized, keeping the same center point.                                                                                                                                                              | Andrea, Gavin | Atlas |

## Camera

| ID    | Requirement                                                                                                                                                                                                                                                 | Source        | Phase |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ----- |
| FR-C1 | The consumer MUST be able to move the camera to a given center point and zoom level.                                                                                                                                                                        | Andrea, Gavin | Atlas |
| FR-C2 | The consumer MUST be able to frame a set of world points, such as a route or search result, so all of them are visible.                                                                                                                                     | Andrea, Gavin | Atlas |
| FR-C3 | Framing MUST accept padding on each side, so HUD panels or other UI covering part of the map can be accounted for.                                                                                                                                          | Gavin         | Game  |
| FR-C4 | Camera moves MUST support both an instant jump and a smooth animation over a given duration. Animations MUST become instant when the user prefers reduced motion.                                                                                           | Andrea, Gavin | Atlas |
| FR-C5 | The viewport MUST be controllable: the consumer can set it and be notified when it changes, following the same controlled and uncontrolled pattern as selection.                                                                                            | Andrea, Gavin | Atlas |
| FR-C6 | Viewport change notifications MUST distinguish between changes during a gesture or animation and the final settled viewport.                                                                                                                                | Andrea, Gavin | Atlas |
| FR-C7 | The viewport MUST be expressed as a world center point and a zoom scale in screen pixels per world unit, independent of container size. A shared link MUST show the same place at the same level of detail on every device. Smaller screens show less area. | Andrea, Arlo  | Atlas |
| FR-C8 | The consumer MUST be able to find out which systems and lanes are currently visible.                                                                                                                                                                        | Gavin         | Game  |
| FR-C9 | Camera moves made by the consumer MUST obey the same zoom and pan limits as user gestures (FR-G6).                                                                                                                                                          | Andrea, Gavin | Atlas |

## Selection and hover

| ID     | Requirement                                                                                                                                                                              | Source              | Phase |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ----- |
| FR-S1  | Clicking or tapping a system or lane MUST select it, and the map MUST notify the consumer with the entity's kind, id, and attached data.                                                 | All                 | Atlas |
| FR-S2  | At most one entity MUST be selected at a time.                                                                                                                                           | All                 | Atlas |
| FR-S3  | Selection MUST be controllable: the consumer can own the selection state or let the map manage it.                                                                                       | Andrea, Gavin       | Atlas |
| FR-S4  | Clicking or tapping empty space MUST clear the selection. A pan or zoom gesture that starts or ends on empty space MUST NOT clear it (see FR-G5).                                        | Arlo, Priya         | Atlas |
| FR-S5  | On pointer devices, the map MUST report hover over systems and lanes, independently of selection. No map function MUST depend on hover, since touch screens have none.                   | Arlo, Priya         | Atlas |
| FR-S6  | Hovered and selected entities MUST be highlighted in a style that does not depend on their fill color.                                                                                   | Arlo, Priya         | Atlas |
| FR-S7  | Hovering or selecting any part of a lane MUST highlight the whole lane, and events MUST report the lane. The consumer MUST be able to ask which segment was nearest to the interaction.  | Andrea, Gavin       | Atlas |
| FR-S8  | Systems MUST have a tap and click area larger than their glyph. Lanes MUST have a hit area wider than their stroke. Where a system's and a lane's areas overlap, the system MUST win.    | Arlo, Priya         | Atlas |
| FR-S9  | When data changes, the selection MUST persist if the selected id still exists. If it no longer exists, the map MUST notify the consumer. An uncontrolled selection MUST then be cleared. | Andrea, Arlo, Priya | Atlas |
| FR-S10 | Data changes MUST NOT reset the camera or require remounting the map.                                                                                                                    | Andrea, Arlo, Priya | Atlas |

## Overlays and extension

| ID    | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Source               | Phase |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- | ----- |
| FR-O1 | The consumer MUST be able to supply content drawn at each system's position, such as fleets, badges, and income indicators. The map positions it and keeps it in place as the camera moves.                                                                                                                                                                                                                                                                                                            | Gavin                | Atlas |
| FR-O2 | The consumer MUST be able to vary a system's appearance beyond color and label, such as size, shape, or a capital icon, through overlay content.                                                                                                                                                                                                                                                                                                                                                       | Andrea, Gavin        | Atlas |
| FR-O3 | The consumer MUST be able to draw content at arbitrary world positions that are not tied to a system, such as fleets in transit or route markers. Clicking content that has no click behavior of its own MUST act as a click on whatever is beneath it: a lane, a system, or empty space.                                                                                                                                                                                                              | Gavin                | Game  |
| FR-O4 | Clicking or tapping overlay content attached to a system, such as a capital icon, MUST count as clicking that system. The exception is content the consumer gives its own click behavior, such as an income label that opens an economy panel: then only the consumer's behavior runs and the system is not selected. A pan or zoom gesture that starts on overlay content MUST pan or zoom the map, and MUST NOT count as a click on either the overlay content or the system beneath it (see FR-G5). | Andrea, Gavin, Priya | Atlas |
| FR-O5 | The consumer MUST be able to make a route clearly distinguishable from ordinary lanes, beyond color, by assigning a CSS class to individual lanes and styling it. Routes are drawn above ordinary lanes by giving them higher priority (FR-D8).                                                                                                                                                                                                                                                        | Andrea, Arlo         | Atlas |
| FR-O6 | The package MUST let the consumer convert between world and screen coordinates at any time, for anchoring infoboxes to systems as the camera moves and for building custom gestures.                                                                                                                                                                                                                                                                                                                   | Andrea, Gavin        | Atlas |
| FR-O7 | The package SHOULD export a helper that returns the point at a given fraction of the way along a continuous lane, for animating fleets along lanes.                                                                                                                                                                                                                                                                                                                                                    | Gavin                | Game  |

## Visual transitions and theming

| ID    | Requirement                                                                                                                                                                                                            | Source        | Phase |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ----- |
| FR-T1 | The consumer SHOULD be able to turn on a smooth color transition when system or lane colors change. It MUST be off by default and MUST respect reduced motion.                                                         | Gavin, Priya  | Game  |
| FR-T2 | The consumer MUST be able to style the map background, label font and color, and hover and selection highlights, including for dark mode.                                                                              | Andrea, Gavin | Atlas |
| FR-T3 | The package MAY export a perceptual color interpolation helper for consumers building their own transitions. It MAY support only colors it can resolve to concrete values, excluding values such as custom properties. | Gavin         | Game  |

## Accessibility

| ID    | Requirement                                                                                                                                                                                                                  | Source | Phase |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----- |
| FR-A1 | Every system and lane MUST have an accessible name taken from its name.                                                                                                                                                      | Arlo   | Atlas |
| FR-A2 | The map MUST be a single tab stop. Within it, the bracket keys MUST move focus to the next or previous visible system in priority order, Enter or Space MUST select the focused system, and Escape MUST clear the selection. | Arlo   | Atlas |
| FR-A3 | When the map has focus, the arrow keys SHOULD pan the map, and the plus and minus keys SHOULD zoom it.                                                                                                                       | Arlo   | Atlas |
| FR-A4 | Focus MUST NOT be lost when the focused system scrolls out of view or disappears because of a data change.                                                                                                                   | Arlo   | Atlas |

## Resolved questions

- **Zoom units.** Zoom is a scale in screen pixels per world unit, so level of detail is consistent across devices (FR-C7).
- **Pan bounds.** Derived from the data's extent plus a margin by default, with explicit bounds as an override (FR-G6).
- **Camera limits.** Camera moves from code obey the same limits as gestures. Without video rendering, nothing needs to go beyond them (FR-C9).
- **Route emphasis.** Consumers style routes with a CSS class on individual lanes, and layer them with priority order (FR-O5).
- **Keyboard keys.** Arrow keys pan, plus and minus zoom, bracket keys move focus between systems, and Escape clears the selection (FR-A2, FR-A3).
- **Static image export.** Out of scope. The map is plain SVG in the page, so a consumer can serialize it if needed.
- **Game on touch devices.** The game targets desktop only. Game-phase features do not need to be designed for touch, although the atlas phase already requires touch gestures.

## Carried to the architecture design

These are design questions, not requirements. They are recorded here so they aren't lost before the architecture doc exists.

- **Color value or class name.** Does the consumer pass a color value, a CSS class name, or both, for systems and lanes? Route emphasis (FR-O5) already uses a class so consumers can set stroke width and style.
- **Selection event shape.** One callback reporting kind and id, or separate callbacks for systems and lanes. Ids may be shared across kinds (FR-D4), so either shape must identify the kind.
- **Rendering strategy.** Recompute every element's screen position on each frame, or transform one group and counter-scale glyphs and labels.
- **Draw order.** Lanes are drawn before systems, and each system is drawn as one group with its glyph and label, in reverse priority order. Where overlays go relative to glyphs and labels is undecided.
- **Label clicks.** Whether labels ignore clicks or select their system.
- **Selection and hover rendering.** The selected entity is moved to the highest priority and the visible set is culled again, so its label shows (FR-L7). Hover draws only a highlight on top, without reordering (FR-L8).

## Deferred

- Lane labels.
- Nebulae, territory borders, shaded regions, and sector or region labels.
- Animating an advance along a lane, driven by a progress value.
- Exporting the current view as an image. Out of scope for both phases.
- Loading data based on the visible area. The map supports it later through viewport notifications (FR-C6), but does not fetch data itself.
