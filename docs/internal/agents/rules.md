# Agent Rules

Rules that AI coding agents MUST follow when working in this repository.

## Always

- Read the relevant internal docs before starting a task ([Overview](./overview.md), [Context Map](./context-map.md)).
- Run `just build` after making code changes to verify the build succeeds.
- Update `CHANGELOG.md` and bump the version in `package.json` when preparing a release.
- Follow [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages.
- Use **Yarn** (not npm) for dependency management.
- Update `docs` to account for any changes.

## Never

- Break existing public prop interfaces without a major version bump.
- Add runtime dependencies without explicit instruction from the user.
- Push directly to `main` — all changes go through PRs.
- Commit files that contain secrets or credentials.
- Use `--no-verify` to skip the pre-commit hook.
- Use `any` types in TypeScript without a justifying comment.

## When Modifying the Public API

1. Update the interface definition in the relevant component file.
2. Update `src/index.ts` if a new type needs to be exported.
3. Update the API table in `README.md`.
4. Update [Data Model](../architecture/data-model.md) and [API Design](../architecture/api-design.md) in internal docs.
5. Bump the version in `package.json` (minor for additions, major for breaking changes).
6. Add a `CHANGELOG.md` entry.

## When Adding a New Component

1. Create the file in `src/components/`.
2. Export any consumer-facing interfaces from the file.
3. Export from `src/index.ts` if it is part of the public API.
4. Document in [Architecture Overview](../architecture/overview.md).
