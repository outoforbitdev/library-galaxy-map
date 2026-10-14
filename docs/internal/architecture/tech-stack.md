# Tech Stack

## Runtime

| Technology               | Version | Role                                       |
| ------------------------ | ------- | ------------------------------------------ |
| React                    | ^19.1.1 | UI component framework                     |
| react-dom                | ^19.1.1 | DOM rendering                              |
| @outoforbitdev/ood-react | ^0.0.3  | Base component utilities and design system |

## Language and Type System

| Technology  | Version | Role                                                                      |
| ----------- | ------- | ------------------------------------------------------------------------- |
| TypeScript  | ^5.7.3  | Primary authoring language                                                |
| CSS Modules | —       | Scoped component styling                                                  |
| SVG         | —       | Map rendering ([ADR-0001](./decisions/adr-0001-svg-for-map-rendering.md)) |

## Build

| Technology               | Version | Role                      |
| ------------------------ | ------- | ------------------------- |
| Rollup                   | ^4.40.0 | Library bundler           |
| rollup-plugin-typescript | ^12.1.2 | TypeScript compilation    |
| rollup-plugin-postcss    | ^4.0.2  | CSS Modules processing    |
| rollup-plugin-dts        | ^6.2.1  | Type declaration bundling |
| @rollup/plugin-terser    | ^0.4.4  | Minification              |
| tslib                    | ^2.8.1  | TypeScript helper runtime |

## Testing and Documentation

| Technology                | Version | Role                                  |
| ------------------------- | ------- | ------------------------------------- |
| Vitest                    | ^3.2.4  | Test runner                           |
| jsdom                     | ^27.0.1 | DOM environment for tests             |
| @testing-library/react    | ^16.3.2 | Component and hook testing            |
| @testing-library/jest-dom | ^6.9.1  | DOM assertions                        |
| Storybook                 | ^10.3.3 | Stories and the full-scale playground |
| Vite                      | ^7.3.1  | Dev server for Storybook and Vitest   |

## Output Formats

| Format | Path                | Description                 |
| ------ | ------------------- | --------------------------- |
| ESM    | `dist/esm/index.js` | Tree-shakeable ES module    |
| CJS    | `dist/cjs/index.js` | CommonJS for older bundlers |
| Types  | `dist/types.d.ts`   | TypeScript declarations     |

## Quality and Tooling

| Tool                    | Role                          |
| ----------------------- | ----------------------------- |
| pre-commit              | Git hooks (lint, commit-msg)  |
| conventional-pre-commit | Enforces Conventional Commits |
| Prettier                | Code formatting               |
| polylint (Docker)       | Multi-language linting        |
| npm                     | Package manager               |
| just                    | Task runner (`Justfile`)      |

## CI/CD

| Workflow    | Trigger        | Purpose                          |
| ----------- | -------------- | -------------------------------- |
| Test        | Pull request   | Version consistency, tests, lint |
| NPM Publish | Push to `main` | Builds and publishes to npm      |
| Release     | Push to `main` | Creates GitHub release           |
| Scorecard   | Schedule       | OpenSSF security scoring         |
| Dependabot  | Weekly         | Automated dependency updates     |
