# Agent Overview

This section provides guidance for AI coding agents (e.g., Claude Code) working in this repository. Agents should read this section before taking on any task.

## What This Repo Is

`@outoforbitdev/galaxy-map` is a React component library that renders interactive SVG galaxy maps. It is a **library**, not an application. Changes affect downstream consumers and must not break the public API without a major version bump.

It exports two components: `Canvas`, a generic pan and zoom surface, and `GalaxyMap`, which draws star systems and spacelanes on a `Canvas`.

## Key Files to Understand

| File                                              | Why It Matters                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| `src/index.ts`                                    | Public API surface. Only what is exported here is part of the contract. |
| `src/map/GalaxyMap.tsx`                           | The map component, its props, and its imperative handle.                |
| `src/canvas/Canvas.tsx`                           | The generic canvas, its props, and its imperative handle.               |
| `src/canvas/constants.ts`, `src/map/constants.ts` | Every tuning value, named and documented.                               |
| `package.json`                                    | Version and dependency management.                                      |
| `CHANGELOG.md`                                    | Must be updated on every release.                                       |
| `README.md`                                       | Consumer-facing documentation.                                          |

## Important Constraints for Agents

- **Do not break public interfaces** (`IGalaxyMapProps`, `IGalaxyMapHandle`, `ICanvasProps`, `ICanvasHandle`, `ISystem`, `ISpacelane`, `ILaneSegment`, and the other types exported from `src/index.ts`) without bumping the major version.
- **Nothing in `src/canvas/` imports from `src/map/`.** A test enforces this.
- **Keep the pure modules pure.** `projection`, `gestures`, `extent`, `spatialIndex`, `lanePaths`, `cull`, `measure`, `keyboardFocus`, and `validate` have no React imports.
- **No literal tuning values in logic.** Sizes, margins, thresholds, and limits are named constants in `constants.ts`.
- **Do not add runtime dependencies** without explicit instruction. Every dependency increases consumer bundle size.
- **Use npm** for package management, through `just install`.
- **All commits must follow Conventional Commits.** The commit-msg hook rejects non-conforming messages.
- **Update `CHANGELOG.md` and the `package.json` version** together when preparing a release.
- **Run `just gate`** (tests, typecheck, lint) before calling a change complete.

## Where to Look for Context

- [Architecture Overview](../architecture/overview.md): component structure and data flow.
- [Data Model](../architecture/data-model.md): all interfaces.
- [API Design](../architecture/api-design.md): props, handles, and events.
- [Core Functional Requirements](../requirements/core-functional-requirements.md): what the component must do.
- [Constraints](../requirements/constraints.md): technical, legal, and business limits.
- [Context Map](./context-map.md): where things live in the repo.
