# Agent Overview

This section provides guidance for AI coding agents (e.g., Claude Code) working in this repository. Agents should read this section before taking on any task.

## What This Repo Is

`@outoforbitdev/galaxy-map` is a React component library that renders interactive SVG galaxy maps. It is a **library**, not an application. Changes affect downstream consumers and must not break the public API without a major version bump.

## Key Files to Understand

| File                           | Why It Matters                                                         |
| ------------------------------ | ---------------------------------------------------------------------- |
| `src/index.ts`                 | Public API surface — only what's exported here is part of the contract |
| `src/components/GalaxyMap.tsx` | Root component; owns visibility state                                  |
| `package.json`                 | Version and dependency management                                      |
| `CHANGELOG.md`                 | Must be updated on every release                                       |
| `README.md`                    | Consumer-facing documentation                                          |

## Important Constraints for Agents

- **Do not break public prop interfaces** (`IMapProps`, `IPlanet`, `ISpacelane`, `IMapOptions`) without bumping the major version.
- **Do not add runtime dependencies** without explicit instruction — every dep increases consumer bundle size.
- **Use Yarn**, not npm, for package management.
- **All commits must follow Conventional Commits** — the pre-commit hook will reject non-conforming messages.
- **Update `CHANGELOG.md` and `package.json` version** together when preparing a release.

## Where to Look for Context

- [Architecture Overview](../architecture/overview.md) — component structure and data flow
- [Data Model](../architecture/data-model.md) — all interfaces and enums
- [Core Functional Requirements](../requirements/core-functional-requirements.md) — what the component must do
- [Constraints](../requirements/constraints.md) — technical, legal, and business limits
- [Context Map](./context-map.md) — where things live in the repo
