# Context Map

A quick reference for where things live in the repository.

## Source Code

| Path                                         | Contents                                              |
| -------------------------------------------- | ----------------------------------------------------- |
| `src/index.ts`                               | Public exports (GalaxyMap, MapColor, FocusLevel)      |
| `src/components/GalaxyMap.tsx`               | Root component, state management, IMapProps interface |
| `src/components/ZoomableMap.tsx`             | SVG canvas, planet/spacelane rendering                |
| `src/components/Zoomable.tsx`                | Zoom and pan event handling                           |
| `src/components/PlanetMap.tsx`               | Single planet rendering, IPlanet interface            |
| `src/components/SpacelaneMap.tsx`            | Single spacelane rendering, ISpacelane interface      |
| `src/components/MapOptions.tsx`              | Options panel UI                                      |
| `src/components/MapUI.tsx`                   | Overlay container (options + legend + children)       |
| `src/components/MapLegend.tsx`               | Legend overlay                                        |
| `src/components/MapItemVisibilitySelect.tsx` | MapItemVisibility type and toggle control             |
| `src/components/FocusLevels.tsx`             | FocusLevel enum and CSS class mapping                 |
| `src/components/Colors.tsx`                  | MapColor enum and CSS variable resolution             |
| `src/styles/map.module.css`                  | Layout styles for map container                       |
| `src/styles/items.module.css`                | Styles for map items and focus levels                 |

## Configuration

| Path                                   | Contents                       |
| -------------------------------------- | ------------------------------ |
| `package.json`                         | Version, dependencies, scripts |
| `tsconfig.json`                        | TypeScript compiler options    |
| `rollup.config.ts`                     | Build configuration            |
| `.linters/config/.prettierrc`          | Prettier formatting rules      |
| `.linters/config/commitlint.config.js` | Commit message rules           |
| `Justfile`                             | Task runner commands           |

## CI/CD

| Path                                | Contents                       |
| ----------------------------------- | ------------------------------ |
| `.github/workflows/test.yml`        | PR check (version consistency) |
| `.github/workflows/npm_publish.yml` | NPM publish on merge to main   |
| `.github/workflows/release.yml`     | GitHub release creation        |
| `.github/workflows/scorecard.yml`   | OpenSSF security scoring       |
| `.github/dependabot.yml`            | Automated dependency updates   |

## Documentation

| Path             | Contents                      |
| ---------------- | ----------------------------- |
| `README.md`      | Consumer-facing documentation |
| `CHANGELOG.md`   | Release history               |
| `docs/internal/` | This internal documentation   |
