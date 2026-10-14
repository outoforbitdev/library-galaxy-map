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
- Non-component utility files use `.ts`, or `.tsx` when they contain JSX.
- CSS Modules files (`*.module.css`) are colocated with their component and imported as `styles`.
- Tests are colocated as `*.test.ts` and `*.test.tsx`. Select elements with the imported `styles` class, never a hard-coded class string.
- Props extend `IComponentProps` from `@outoforbitdev/ood-react`. Use `lib.getDomProps` and `lib.classNames` from that package.

## Interfaces and Types

- Public-facing interfaces are named with a leading `I` (e.g., `ISystem`, `ISpacelane`).
- Export all public interfaces from the file where they are defined.
- Re-export from `src/index.ts` only what consumers need.

## Structure

- Nothing in `src/canvas/` imports from `src/map/`. A test enforces this.
- Keep logic in pure modules (`projection`, `gestures`, `spatialIndex`, `lanePaths`, `cull`, `measure`, `validate`) with no React imports, and test them directly.
- Every tuning value (size, margin, threshold, interval, default limit) is a named, documented constant in `constants.ts`, never a literal in logic.
- Consumers style the map with their own classes. Do not add CSS custom properties for theming.

## Commits

- All commits must follow Conventional Commits. See [Development Process](../workflows/development-process.md).
- The pre-commit `commit-msg` hook (conventional-pre-commit) enforces this.

## Dependencies

- Do not add runtime dependencies without discussion. This is a library — every dependency increases consumer bundle size.
- Prefer dev dependencies for build tools and type definitions.
- Use npm to install, through `just install`.
