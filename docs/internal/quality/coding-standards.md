# Coding Standards

## Language

- All source code is TypeScript. Do not add plain `.js` files to `src/`.
- Use strict TypeScript (`strict: true` in `tsconfig.json`). Do not use `any` unless absolutely necessary and justified with a comment.

## Formatting

- Code is formatted with [Prettier](https://prettier.io/). Run `just lint` or let the pre-commit hook handle it.
- Prettier config is at `.linters/config/.prettierrc`.
- Do not manually adjust formatting that Prettier would change.

## Component Conventions

- One component per file.
- Component files use `.tsx` extension.
- Non-component utility files use `.tsx` or `.ts` as appropriate.
- CSS Modules files are colocated in `src/styles/` and imported as `styles`.

## Interfaces and Types

- Public-facing interfaces (consumed by Carla) are named with a leading `I` (e.g., `IPlanet`, `ISpacelane`).
- Export all public interfaces from the component file where they are defined.
- Re-export from `src/index.ts` only what consumers need.

## Commits

- All commits must follow Conventional Commits. See [Development Process](../workflows/development-process.md).
- The Husky pre-commit hook enforces this via commitlint.

## Dependencies

- Do not add runtime dependencies without discussion. This is a library — every dependency increases consumer bundle size.
- Prefer dev dependencies for build tools and type definitions.
- Use Yarn 1.x to install. Do not use npm.
