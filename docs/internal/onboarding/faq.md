# FAQ

**Q: Why does `just build` fail with a TypeScript error?**
Check that you are on the correct Node.js version and that `yarn install` has been run. TypeScript errors in `dist/` can indicate stale build artifacts — delete `dist/` and rebuild.

**Q: Why is my commit being rejected?**
The pre-commit hook runs commitlint. Your commit message must follow Conventional Commits format: `<type>(<scope>): <description>`. See [Development Process](../workflows/development-process.md) for examples.

**Q: How do I test my changes?**
Run `just pack` to build and install the library into `app-galaxy-map`, then manually verify the map in that application. There is no automated test suite yet — see [Testing Strategy](../workflows/testing-strategy.md).

**Q: How do I add a new color to `MapColor`?**
Add the value to the `MapColor` enum in `src/components/Colors.tsx`. Ensure a corresponding `--ood-color-<name>` CSS custom property exists in the ood design system. This is a minor version change (no breaking change).

**Q: How do I change the public API?**
See the "When Modifying the Public API" section in [Agent Rules](../agents/rules.md). Summary: update the interface, README, internal docs, and version — then open a PR.

**Q: Why is there no `npm install`?**
This repository uses Yarn. Run `yarn install` or `just install` instead.

**Q: What is `app-galaxy-map`?**
A separate application repository used for manual integration testing of this library. It is not part of this repo but is referenced by the `just pack` workflow.

**Q: Who are Carla and Edward?**
They are user personas. See [Carla the Consumer](../product/personas/persona-carla-the-consumer.md) and [Edward the Explorer](../product/personas/persona-edward-the-explorer.md).
