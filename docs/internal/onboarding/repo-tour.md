# Repo Tour

A guided walkthrough of the repository structure.

## Top-Level

```
library-galaxy-map/
├── src/            ← All source code
├── dist/           ← Build output (generated, not committed)
├── docs/           ← Documentation
├── .github/        ← GitHub Actions workflows and Dependabot config
├── .linters/       ← Linter configurations
├── ci/             ← CI helper scripts
├── Justfile        ← Task runner commands
├── package.json    ← npm package manifest
├── tsconfig.json   ← TypeScript configuration
├── rollup.config.ts← Build configuration
├── README.md       ← Consumer-facing documentation
└── CHANGELOG.md    ← Release history
```

## `src/` — Source Code

```
src/
├── index.ts              ← Public exports (GalaxyMap, MapColor, FocusLevel)
├── Globals.d.ts          ← Global TypeScript declarations (CSS module types)
├── components/
│   ├── GalaxyMap.tsx     ← Root component
│   ├── ZoomableMap.tsx   ← SVG canvas + item rendering
│   ├── Zoomable.tsx      ← Zoom/pan event handling
│   ├── PlanetMap.tsx     ← Planet rendering
│   ├── SpacelaneMap.tsx  ← Spacelane rendering
│   ├── MapOptions.tsx    ← Options panel
│   ├── MapUI.tsx         ← Overlay container
│   ├── MapLegend.tsx     ← Legend overlay
│   ├── MapItemVisibilitySelect.tsx ← Visibility toggle
│   ├── FocusLevels.tsx   ← FocusLevel enum
│   └── Colors.tsx        ← MapColor enum
└── styles/
    ├── map.module.css    ← Container layout
    └── items.module.css  ← Item and focus level styles
```

## `docs/internal/` — Internal Documentation

See [README](../README.md) for the full structure.

## `.github/workflows/` — CI/CD

- `test.yml` — Runs on PRs; checks version consistency
- `npm_publish.yml` — Publishes to npm on merge to `main`
- `release.yml` — Creates GitHub release on merge to `main`

## `Justfile` — Common Commands

| Command | What It Does |
|---------|-------------|
| `just install` | Install deps + set up git hooks |
| `just build` | Build the library |
| `just lint` | Run linters (requires Docker) |
| `just pack` | Build, pack, and test in app-galaxy-map |
