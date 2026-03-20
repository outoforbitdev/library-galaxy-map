# Tech Stack

## Runtime

| Technology               | Version | Role                                       |
| ------------------------ | ------- | ------------------------------------------ |
| React                    | ^19.1.1 | UI component framework                     |
| react-dom                | ^19.1.1 | DOM rendering                              |
| @outoforbitdev/ood-react | ^0.0.3  | Base component utilities and design system |

## Language and Type System

| Technology  | Version | Role                       |
| ----------- | ------- | -------------------------- |
| TypeScript  | ^5.7.3  | Primary authoring language |
| CSS Modules | —       | Scoped component styling   |

## Build

| Technology               | Version | Role                      |
| ------------------------ | ------- | ------------------------- |
| Rollup                   | ^4.40.0 | Library bundler           |
| rollup-plugin-typescript | ^12.1.2 | TypeScript compilation    |
| rollup-plugin-postcss    | ^4.0.2  | CSS Modules processing    |
| rollup-plugin-dts        | ^6.2.1  | Type declaration bundling |
| @rollup/plugin-terser    | ^0.4.4  | Minification              |
| tslib                    | ^2.8.1  | TypeScript helper runtime |

## Output Formats

| Format | Path                | Description                 |
| ------ | ------------------- | --------------------------- |
| ESM    | `dist/esm/index.js` | Tree-shakeable ES module    |
| CJS    | `dist/cjs/index.js` | CommonJS for older bundlers |
| Types  | `dist/types.d.ts`   | TypeScript declarations     |

## Quality and Tooling

| Tool              | Role                          |
| ----------------- | ----------------------------- |
| Husky             | Git hooks (pre-commit)        |
| commitlint        | Enforces Conventional Commits |
| Prettier          | Code formatting               |
| polylint (Docker) | Multi-language linting        |
| Yarn 1.x          | Package manager               |
| just              | Task runner (`Justfile`)      |

## CI/CD

| Workflow    | Trigger        | Purpose                      |
| ----------- | -------------- | ---------------------------- |
| Test        | Pull request   | Checks version consistency   |
| NPM Publish | Push to `main` | Builds and publishes to npm  |
| Release     | Push to `main` | Creates GitHub release       |
| Scorecard   | Schedule       | OpenSSF security scoring     |
| Dependabot  | Weekly         | Automated dependency updates |
