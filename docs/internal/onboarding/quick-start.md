# Quick Start

Get up and running as a contributor to `@outoforbitdev/galaxy-map`.

## Prerequisites

- Node.js (current LTS)
- Yarn 1.x (`npm install -g yarn`)
- Docker (for `just lint`)
- [just](https://github.com/casey/just) task runner

## Setup

```bash
# Clone the repo
git clone https://github.com/outoforbitdev/library-galaxy-map.git
cd library-galaxy-map

# Install dependencies and set up git hooks
just install
```

This installs npm/yarn dependencies and configures the Husky pre-commit hook (commitlint).

## Build

```bash
just build
```

Output is written to `dist/` (ESM, CJS, and type declarations).

## Lint

```bash
just lint
```

Runs the Docker-based polylint tool across the repository.

## Test Against a Consuming App

```bash
just pack
```

Builds the library, packs it as a tarball, and installs it into the `app-galaxy-map` project. Verify the map renders correctly there.

## Make a Change

1. Create a branch: `git checkout -b <issue-number>-<description>`
2. Write code.
3. Commit with a Conventional Commit message: `feat: add X`
4. Push and open a PR against `main`.

## Next Steps

- Read the [Repo Tour](./repo-tour.md)
- Review the [Development Process](../workflows/development-process.md)
- Check the [Agent Rules](../agents/rules.md) if you are an AI agent
