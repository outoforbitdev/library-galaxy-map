# Testing Strategy

## Current State

As of v0.0.11, this library has no automated unit or integration test suite. This is a known gap acknowledged in [Constraints](../requirements/constraints.md) (TC-5).

## Manual Testing

The primary testing mechanism is the `just pack` workflow:

1. Run `just build` to produce a fresh `dist/`.
2. Run `just pack` to pack the library as a tarball and install it into `app-galaxy-map`.
3. Manually verify the map renders, zooms, pans, and responds to interactions correctly in `app-galaxy-map`.

## Automated CI

The only automated check that runs on PRs is `check-release-match`, which verifies version consistency between `package.json` and `CHANGELOG.md`. This is not a functional test.

## Future Testing Goals

- **Unit tests** — Test individual components (`PlanetMap`, `SpacelaneMap`, `MapOptions`) with a React testing library.
- **Interaction tests** — Test zoom and pan behavior with simulated mouse and touch events.
- **Visual regression tests** — Snapshot or pixel-diff tests to catch rendering regressions.

The testing infrastructure should be prioritized before the library reaches v1.0.
