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
├── .storybook/     ← Storybook configuration
├── ci/             ← CI helper scripts
├── Justfile        ← Task runner commands
├── package.json    ← npm package manifest
├── vitest.config.ts← Test runner configuration
├── tsconfig.json   ← TypeScript configuration
├── rollup.config.ts← Build configuration
├── README.md       ← Consumer-facing documentation
└── CHANGELOG.md    ← Release history
```

## `src/` — Source Code

```
src/
├── index.ts          ← Public exports (Canvas, GalaxyMap, primitives, types)
├── Globals.d.ts      ← Global TypeScript declarations (CSS module types)
├── setupTests.ts     ← Test setup
├── testUtils.ts      ← Test helpers (mockElementSize)
├── canvas/           ← Generic pan and zoom surface. Never imports from map/.
│   ├── Canvas.tsx        ← The Canvas component
│   ├── useViewport.ts    ← Camera state, limits, animation, publishing
│   ├── useGestures.ts    ← Pointer, wheel, and click-cancellation handlers
│   ├── gestures.ts       ← Pure gesture math
│   ├── projection.ts     ← Pure world and screen conversion, fitting, clamping
│   ├── constants.ts      ← Tuning constants
│   └── ...
├── map/              ← Galaxy concepts built on Canvas
│   ├── GalaxyMap.tsx     ← The GalaxyMap component
│   ├── MapContent.tsx    ← Culling and rendering
│   ├── cull.ts           ← Pure priority-order culling
│   ├── spatialIndex.ts   ← Pure grid indexes
│   ├── SystemNode.tsx    ← One memoized system
│   ├── LaneNode.tsx      ← One memoized spacelane
│   ├── constants.ts      ← Tuning constants
│   └── ...
└── stories/
    └── generateGalaxy.ts ← Deterministic full-scale test data
```

Tests sit next to the code they cover. See the [Context Map](../agents/context-map.md) for every file.

## `docs/internal/` — Internal Documentation

See [README](../README.md) for the full structure.

## `.github/workflows/` — CI/CD

- `test.yml` — Runs on PRs; checks version consistency, then runs tests and lint
- `npm_publish.yml` — Publishes to npm on merge to `main`
- `release.yml` — Creates GitHub release on merge to `main`

## `Justfile` — Common Commands

| Command          | What It Does                            |
| ---------------- | --------------------------------------- |
| `just bootstrap` | Install the pre-commit git hooks        |
| `just install`   | Install dependencies                    |
| `just build`     | Build the library                       |
| `just test`      | Run the test suite                      |
| `just typecheck` | Run the TypeScript typecheck            |
| `just lint`      | Run linters (requires Docker)           |
| `just gate`      | Run tests, typecheck, and lint          |
| `just storybook` | Start Storybook on port 6006            |
| `just pack`      | Build, pack, and test in app-galaxy-map |
