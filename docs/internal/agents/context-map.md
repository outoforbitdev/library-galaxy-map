# Context Map

A quick reference for where things live in the repository.

## Source Code

| Path                                                                         | Contents                                                                                  |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/index.ts`                                                               | Public exports. Only what is exported here is part of the contract.                       |
| `src/canvas/`                                                                | Generic pan and zoom surface. Never imports from `src/map/`.                              |
| `src/canvas/Canvas.tsx`                                                      | The `Canvas` component: root element, `<svg>`, world group, context provider, handle.     |
| `src/canvas/useViewport.ts`                                                  | Camera state, controlled and uncontrolled modes, limits, animation, throttled publishing. |
| `src/canvas/useGestures.ts`                                                  | Pointer, wheel, and click-cancellation handlers.                                          |
| `src/canvas/gestures.ts`                                                     | Pure gesture math: drag threshold, pan, zoom at point, wheel, pinch, key actions.         |
| `src/canvas/projection.ts`                                                   | Pure conversions between world and screen, clamping, `fitViewport`, interpolation.        |
| `src/canvas/extent.ts`                                                       | Pure bounding box of a list of points.                                                    |
| `src/canvas/CanvasContext.ts`                                                | `useCanvas()` and the context type.                                                       |
| `src/canvas/screenSpace.ts`                                                  | `screenSpaceClassName` for content drawn at a fixed screen size.                          |
| `src/canvas/constants.ts`                                                    | Canvas tuning constants.                                                                  |
| `src/map/`                                                                   | Galaxy concepts built on `Canvas`.                                                        |
| `src/map/GalaxyMap.tsx`                                                      | The `GalaxyMap` component and its handle.                                                 |
| `src/map/MapContent.tsx`                                                     | Culling and rendering inside the canvas, event delegation.                                |
| `src/map/useMapData.ts`                                                      | Spatial indexes, id lookups, data bounds, development warnings.                           |
| `src/map/useSelection.ts`                                                    | Selection and hover state.                                                                |
| `src/map/spatialIndex.ts`                                                    | Pure grid indexes over system positions and lane segment bounds.                          |
| `src/map/cull.ts`                                                            | Pure priority-order culling of systems, labels, and lane segments.                        |
| `src/map/lanePaths.ts`                                                       | Pure lane color runs, hit paths, and nearest segment.                                     |
| `src/map/measure.ts`                                                         | Label width measurement with a cache and a fallback.                                      |
| `src/map/keyboardFocus.ts`                                                   | Pure next-focus logic for the bracket keys.                                               |
| `src/map/validate.ts`                                                        | Pure development-only data warnings.                                                      |
| `src/map/SystemNode.tsx`, `LaneNode.tsx`, `SystemLabel.tsx`, `Highlight.tsx` | Memoized drawing components.                                                              |
| `src/map/primitives.tsx`                                                     | `SystemGlyph` and `SpacelaneSegment`, shared with consumers.                              |
| `src/map/types.ts`                                                           | Public entity, selection, and event types.                                                |
| `src/map/constants.ts`                                                       | Map tuning constants.                                                                     |
| `src/map/GalaxyMap.stories.tsx`                                              | Storybook stories, including a full-scale playground.                                     |
| `src/stories/generateGalaxy.ts`                                              | Deterministic full-scale test data.                                                       |
| `src/setupTests.ts`, `src/testUtils.ts`                                      | Test setup and helpers such as `mockElementSize`.                                         |

Tests live next to the code they cover as `*.test.ts` and `*.test.tsx`.

## Configuration

| Path                                   | Contents                                  |
| -------------------------------------- | ----------------------------------------- |
| `package.json`                         | Version, dependencies, scripts            |
| `tsconfig.json`                        | TypeScript compiler options               |
| `vitest.config.ts`                     | Test runner configuration                 |
| `rollup.config.ts`                     | Build configuration                       |
| `.storybook/`                          | Storybook configuration                   |
| `.pre-commit-config.yaml`              | Pre-commit hooks: lint and commit message |
| `.linters/config/.prettierrc`          | Prettier formatting rules                 |
| `.linters/config/commitlint.config.js` | Commit message rules                      |
| `Justfile`                             | Task runner commands                      |

## CI/CD

| Path                                | Contents                                        |
| ----------------------------------- | ----------------------------------------------- |
| `.github/workflows/test.yml`        | PR checks: version consistency, tests, and lint |
| `.github/workflows/npm_publish.yml` | NPM publish on merge to main                    |
| `.github/workflows/release.yml`     | GitHub release creation                         |
| `.github/workflows/scorecard.yml`   | OpenSSF security scoring                        |
| `.github/dependabot.yml`            | Automated dependency updates                    |

## Documentation

| Path             | Contents                                               |
| ---------------- | ------------------------------------------------------ |
| `README.md`      | Consumer-facing documentation                          |
| `CHANGELOG.md`   | Release history                                        |
| `docs/internal/` | This internal documentation                            |
| `docs/public/`   | Consumer-facing guides, such as `migrating-from-v0.md` |
