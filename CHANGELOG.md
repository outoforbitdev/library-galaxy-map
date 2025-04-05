## Next

### Breaking Changes

- This update includes a major change in the way that the Map Options window functions.
  - The default options (`hidePlanetLabels`, `showPlanets`, and `showSpacelanes`) have been renamed to `planetLabelVisibility`, `planetVisibility`, and `spacelaneVisbility`, and accept any of the following strings: `show`, `dynamic` (default), or `hide`.
    - Note that the `planetLabelVisibility` may not exceed the the `planetVisibility`. For example, if `planetVisibility` is `dynamic` and `planetLabelVisibility` is `show`, then `planetLabelVisibility` will be ignored.
    - These options are now rendered as dropdown menus in the options window instead of boolean checkboxes.
  - Instead of providing complex objects for `customOptions`, consumers now provide a `ReactNode`. This allows for full components of any type to be added to the options window, greatly expanding the options for consumers.

## 0.0.7 (2025-03-20)

### Breaking Changes

- This update includes a major change in the way that the map is rendered. Instead of redrawing the SVG with every change in zoom, the map is now an SVG that is scaled, using CSS classes to scale and selectively hide planets and spacelanes. To accomplish this, the method of specifying the focus level of a map object is now to use the new `FocusLevel` enum rather than an integer that represented the current amount of zoom.

- This update also removes support for labeling Spacelanes. The labels just weren't good enough so we've removed them until we can implement them with the quality we want.

## 0.0.6 (2025-02-07)

### Bug Fixes

- include relevant files in npm release

## 0.0.1 (2025-02-02)

### Features

- first release of prototype library
