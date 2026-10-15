# Agent Rules

Rules that AI coding agents MUST follow when working in this repository.

## Always

- Read the relevant internal docs before starting a task ([Overview](./overview.md), [Context Map](./context-map.md)).
- Run `just gate` after making code changes. It runs the tests, the typecheck, and the linter. A change is incomplete until it passes.
- Add or update tests next to any code you add or change.
- Update `CHANGELOG.md` and bump the version in `package.json` when preparing a release.
- Follow [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages.
- Use **npm** (through `just install`) for dependency management.
- Update `docs` to account for any changes.

## Never

- Break existing public interfaces without a major version bump.
- Add runtime dependencies without explicit instruction from the user.
- Import from `src/map/` inside `src/canvas/`.
- Put a literal tuning value (a size, margin, threshold, interval, or limit) in logic. Add a named constant instead.
- Push directly to `main`. All changes go through PRs.
- Commit files that contain secrets or credentials.
- Use `--no-verify` to skip the pre-commit hooks.
- Use `any` types in TypeScript without a justifying comment.

## When Modifying the Public API

1. Update the interface definition in the relevant component file.
2. Update `src/index.ts` if a type or component needs to be exported.
3. Update the API table in `README.md`, and the [migration guide](../../public/migrating-from-v0.md) if the change affects v0 users.
4. Update [Data Model](../architecture/data-model.md) and [API Design](../architecture/api-design.md) in internal docs.
5. Bump the version in `package.json` (minor for additions, major for breaking changes).
6. Add a `CHANGELOG.md` entry.

## When Adding a New Component

1. Create the file in `src/canvas/` if it has no galaxy concepts, otherwise in `src/map/`.
2. Colocate its `*.module.css` and `*.test.tsx` files with it.
3. Export any consumer-facing interfaces from the file.
4. Export from `src/index.ts` if it is part of the public API.
5. Document it in [Architecture Overview](../architecture/overview.md) and the [Context Map](./context-map.md).
