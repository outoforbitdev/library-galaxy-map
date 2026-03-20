# Constraints

## Technical Constraints

- **TC-1 React peer dependency** — The library requires React as a peer dependency. It is not usable in non-React environments. The minimum supported version tracks the version used in `devDependencies` (currently React 19).
- **TC-2 SVG rendering** — All map content is rendered as SVG. CSS-in-SVG is limited; complex layout techniques available in HTML are not applicable to map elements.
- **TC-3 CSS custom properties** — Colors are resolved via `--ood-color-*` CSS custom properties defined by the `@outoforbitdev/ood-react` design system. Consumers must include the ood design system styles or define these variables themselves.
- **TC-4 TypeScript** — The library is authored in TypeScript and ships type definitions. Pure JavaScript consumers are supported but lose type safety.
- **TC-5 No test framework** — As of v0.0.11, there is no automated test suite. Manual testing is performed via the `pack` workflow against the `app-galaxy-map` application. This is a known gap.
- **TC-6 Rollup bundler** — The build system is Rollup with TypeScript and PostCSS plugins. Changes to the build pipeline must remain compatible with the existing `rollup.config.ts`.
- **TC-7 Yarn package manager** — The repository uses Yarn 1.x. Do not use npm to install dependencies.

## Legal Constraints

- **LC-1 License** — The library is published under the ISC license. All included or vendored code must be compatible with ISC.
- **LC-2 Dependency licenses** — Dependencies must be reviewed for license compatibility before being added. Copyleft (GPL) licenses are not acceptable for bundled dependencies.

## Business Constraints

- **BC-1 Semantic versioning** — Releases MUST follow semantic versioning. Breaking API changes require a major version bump.
- **BC-2 npm publishing** — The package is published to the public npm registry under the `@outoforbitdev` scope. The publishing pipeline is managed via GitHub Actions.
- **BC-3 Conventional commits** — All commits must pass the commitlint check enforced by Husky pre-commit hooks. This is required for automated changelog and release generation.
- **BC-4 Version consistency** — The version in `package.json` must match the latest entry in `CHANGELOG.md` before a release can be cut.
