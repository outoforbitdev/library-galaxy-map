# Quick Start

Get up and running as a contributor to `@outoforbitdev/galaxy-map`.

## Prerequisites

- Node.js 20 or later (CI uses 20)
- npm
- Docker (for `just lint`)
- [just](https://github.com/casey/just) task runner
- [pre-commit](https://pre-commit.com/)

## Setup

```bash
# Clone the repo
git clone https://github.com/outoforbitdev/library-galaxy-map.git
cd library-galaxy-map

# Install the git hooks, then the dependencies
just bootstrap
just install
```

`just bootstrap` installs the pre-commit hooks: lint before a commit, and a Conventional Commits check on the commit message.

## Run the Checks

```bash
just test       # Vitest
just typecheck  # tsc --noEmit
just lint       # polylint in Docker
just gate       # all three
```

A change is not complete until `just gate` passes.

## Build

```bash
just build
```

Output is written to `dist/` (ESM, CJS, and type declarations).

## Explore in Storybook

```bash
just storybook
```

Opens Storybook on http://localhost:6006. The `GalaxyMap` stories include a full-scale playground for checking performance and interaction in a real browser.

## Test Against a Consuming App

```bash
just pack
```

Builds the library, packs it as a tarball, and installs it into the `app-galaxy-map` project. Verify the map renders correctly there.

## Make a Change

1. Create a branch: `git checkout -b <issue-number>-<description>`
2. Write code and tests.
3. Run `just gate`.
4. Commit with a Conventional Commit message: `feat(map): add X`
5. Push and open a PR against `main`.

## Next Steps

- Read the [Repo Tour](./repo-tour.md)
- Review the [Development Process](../workflows/development-process.md)
- Check the [Agent Rules](../agents/rules.md) if you are an AI agent
