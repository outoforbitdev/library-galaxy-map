# Release Process

## Trigger

A release is triggered automatically when a PR merges into `main`. The GitHub Actions `Release` and `NPM Publish` workflows run on push to `main`.

## Pre-Release Checklist

Before merging a release PR, verify:

- [ ] `version` in `package.json` is updated to the new version (e.g., `0.0.12`).
- [ ] `CHANGELOG.md` has an entry for the new version.
- [ ] The version in `package.json` matches the latest entry in `CHANGELOG.md` (enforced by the CI `check-release-match` job).
- [ ] The build passes locally: `just build`.

## Version Bump Guidelines

Follow [Semantic Versioning](https://semver.org/):

| Change Type                       | Version Part    |
| --------------------------------- | --------------- |
| Bug fix                           | Patch (`0.0.x`) |
| New feature, backwards-compatible | Minor (`0.x.0`) |
| Breaking API change               | Major (`x.0.0`) |

## What Happens on Merge

1. `Release` workflow creates a GitHub release and tag.
2. `NPM Publish` workflow builds the package and publishes to npm under `@outoforbitdev/galaxy-map`.

## Hotfixes

For urgent fixes, follow the same process — branch from `main`, fix, PR, and merge. There is no separate hotfix branch.
