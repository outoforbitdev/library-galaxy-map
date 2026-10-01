# Non-Functional Requirements

> **Status:** Draft for the rebuild

Keywords and the **Source** and **Phase** columns follow the conventions in [Core Functional Requirements](./core-functional-requirements.md). Numeric targets marked need confirming.

## Performance

| ID     | Requirement                                                                                                                                                     | Source        | Phase |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ----- |
| NFR-P1 | The map MUST handle a dataset of 6,000 systems and 500 lanes made of 20,000 segments.                                                                           | Andrea, Gavin | Atlas |
| NFR-P2 | Pan and zoom MUST run at 60 frames per second on desktop and at least 30 frames per second on mid-range phones, at the NFR-P1 scale.                            | Arlo, Priya   | Atlas |
| NFR-P3 | The page MUST contain only elements in or near the current view, not the whole dataset. A typical view holds up to 500 systems and 500 lane segments.           | Arlo, Priya   | Atlas |
| NFR-P4 | The first render of the full NFR-P1 dataset SHOULD complete within 500 ms on desktop.                                                                           | Arlo          | Atlas |
| NFR-P5 | Replacing the entire dataset, such as for a time period change, SHOULD complete within 200 ms on desktop.                                                       | Arlo          | Atlas |
| NFR-P6 | Changing the color or data of a few entities MUST cost time in proportion to what changed. It MUST NOT rebuild spatial indexes or re-render unchanged entities. | Gavin, Priya  | Atlas |
| NFR-P7 | Data updates MUST NOT interrupt or stutter a gesture that is in progress.                                                                                       | Arlo, Priya   | Atlas |
| NFR-P8 | Overlay content on every visible system MUST NOT drop pan and zoom below the NFR-P2 frame rates.                                                                | Priya         | Game  |
| NFR-P9 | The published bundle MUST stay under 50 KB gzipped, excluding peer dependencies.                                                                                | Andrea, Gavin | Atlas |

## Reliability

| ID     | Requirement                                                                                                                 | Source        | Phase |
| ------ | --------------------------------------------------------------------------------------------------------------------------- | ------------- | ----- |
| NFR-R1 | The map MUST NOT throw for any valid input as documented. Invalid data SHOULD produce development warnings, not crashes.    | Andrea, Gavin | Atlas |
| NFR-R2 | The map MUST NOT mutate any data the consumer passes in.                                                                    | Andrea, Gavin | Atlas |
| NFR-R3 | Rendering MUST be deterministic: the same data and viewport MUST produce the same output, including which labels are shown. | Andrea, Gavin | Atlas |

## Compatibility

| ID     | Requirement                                                                                                                           | Source        | Phase |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ----- |
| NFR-C1 | The map MUST work in the current two major versions of Chrome, Firefox, Safari, and Edge, and in Safari on iOS and Chrome on Android. | Arlo, Priya   | Atlas |
| NFR-C2 | The map MUST NOT throw when rendered on the server. It MAY render nothing until it mounts in the browser.                             | Andrea        | Atlas |
| NFR-C3 | The package MUST be consumable as both an ES module and CommonJS, and MUST ship TypeScript type definitions.                          | Andrea, Gavin | Atlas |

## Developer experience

| ID     | Requirement                                                                                                                   | Source        | Phase |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------- | ----- |
| NFR-U1 | All public types MUST be exported. Consumer-attached data MUST be typed without casts.                                        | Andrea, Gavin | Atlas |
| NFR-U2 | State the map exposes, such as selection and viewport, MUST follow React's controlled and uncontrolled component conventions. | Andrea, Gavin | Atlas |
| NFR-U3 | The README MUST include a working example that renders a basic map, and examples of the atlas and game integration patterns.  | Andrea, Gavin | Game  |
| NFR-U4 | The rebuild MUST ship as a new major version, with a migration guide from the current API.                                    | Andrea        | Atlas |

## Maintainability

| ID     | Requirement                                                                                                                                                                                                                                                                                         | Source | Phase |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----- |
| NFR-M1 | Coordinate conversion, visibility culling, label collision, and telling gestures apart from clicks MUST have automated tests.                                                                                                                                                                       | Casey  | Atlas |
| NFR-M2 | Rendering SHOULD have visual regression tests.                                                                                                                                                                                                                                                      | Casey  | Atlas |
| NFR-M3 | All commits MUST follow the Conventional Commits specification.                                                                                                                                                                                                                                     | Casey  | Atlas |
| NFR-M4 | The version in `package.json` and the latest entry in `CHANGELOG.md` MUST match on every release.                                                                                                                                                                                                   | Casey  | Atlas |
| NFR-M5 | The implementation MUST use the simplest design that meets the requirements and performance targets. Any extra layer, abstraction, or optimization MUST be justified by a specific requirement or a measured performance problem, and the justification MUST be recorded in an ADR or code comment. | Casey  | Atlas |
| NFR-M6 | Each concept, such as systems, lanes, or overlays, SHOULD be owned by one module, including its visibility and level-of-detail decisions. Draw order SHOULD come from element order within a single transformed group, not from separate layer components with duplicated logic.                    | Casey  | Atlas |
| NFR-M7 | Core logic, including coordinate conversion, culling, level of detail, label collision, and gesture classification, SHOULD be pure functions that can be tested without React or a browser.                                                                                                         | Casey  | Atlas |
| NFR-M8 | An architecture overview MUST describe the data flow from props to rendered elements and where each concept lives, and MUST be kept current with the code.                                                                                                                                          | Casey  | Atlas |
| NFR-M9 | Every tuning value, such as sizes, margins, thresholds, intervals, and default limits, MUST be a named, documented constant defined in one place, not a literal in logic.                                                                                                                           | Casey  | Atlas |
