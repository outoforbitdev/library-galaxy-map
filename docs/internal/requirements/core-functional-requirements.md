# Core Functional Requirements

## Map Rendering

- **FR-01** The component MUST render planets as labeled SVG elements at their specified `(x, y)` coordinates within the map's defined `dimensions`.
- **FR-02** The component MUST render spacelanes as SVG lines connecting two `(x, y)` coordinate pairs.
- **FR-03** Planets and spacelanes MUST be colored according to their assigned `MapColor`, resolved through the ood CSS custom property system.
- **FR-04** Items with a `FocusLevel` above the current zoom threshold MUST be hidden when `MapItemVisibility` is `"dynamic"`.

## Navigation

- **FR-05** The map MUST support click-and-drag panning on desktop (mouse).
- **FR-06** The map MUST support scroll-wheel zooming on desktop.
- **FR-07** The map MUST support single-finger drag panning on mobile (touch).
- **FR-08** The map MUST support two-finger pinch-to-zoom on mobile.

## Interaction

- **FR-09** When `onPlanetSelect` is provided, clicking a planet MUST invoke the callback with the selected `IPlanet`.
- **FR-10** The `selectedPlanetId` prop MUST visually distinguish the selected planet from others.

## Options and Visibility

- **FR-11** When `mapOptions` is provided, the component MUST render an options panel allowing the user to toggle planet, planet label, and spacelane visibility.
- **FR-12** Setting `MapItemVisibility` to `"show"` MUST display the item regardless of zoom level.
- **FR-13** Setting `MapItemVisibility` to `"hide"` MUST hide the item regardless of zoom level.
- **FR-14** Custom options (`mapOptions.customOptions`) MUST be rendered within the options panel.

## Legend

- **FR-15** When `legendEntries` is provided, the component MUST render a legend overlay displaying each entry's label and color.

## Zoom Configuration

- **FR-16** The initial zoom level MUST default to `1` when not specified.
- **FR-17** When `zoom.min` is set, the user MUST NOT be able to zoom out beyond that value.
- **FR-18** When `zoom.max` is set, the user MUST NOT be able to zoom in beyond that value.
