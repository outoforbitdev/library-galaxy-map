# FAQ

**Q: Why does `just build` fail with a TypeScript error?**
Check that you are on the correct Node.js version and that `just install` has been run. TypeScript errors in `dist/` can indicate stale build artifacts — delete `dist/` and rebuild.

**Q: Why is my commit being rejected?**
The commit-msg hook (conventional-pre-commit) checks your message. It must follow Conventional Commits format: `<type>(<scope>): <description>`. See [Development Process](../workflows/development-process.md) for examples.

**Q: How do I test my changes?**
Run `just gate` for the tests, typecheck, and lint. For a real-browser check, run `just storybook`, or `just pack` to install the build into `app-galaxy-map`. See [Testing Strategy](../workflows/testing-strategy.md).

**Q: How do I add a new color?**
There is no color enum. Systems and spacelane segments take any CSS color string from the consumer. See TC-3 in [Constraints](../requirements/constraints.md).

**Q: How do I change the public API?**
See the "When Modifying the Public API" section in [Agent Rules](../agents/rules.md). Summary: update the interface, README, internal docs, and version — then open a PR.

**Q: Which package manager does this repository use?**
npm. Run `just install`. The lockfile is `package-lock.json`.

**Q: What is `app-galaxy-map`?**
A separate application repository used for manual integration testing of this library. It is not part of this repo but is referenced by the `just pack` workflow.

**Q: Who are Andrea, Arlo, Gavin, Priya, and Casey?**
They are personas. Four come from the two prioritized [use cases](../product/use-cases.md). The atlas use case has [Andrea the Atlas Builder](../product/personas/persona-andrea-the-atlas-builder.md) and [Arlo the Atlas User](../product/personas/persona-arlo-the-atlas-user.md). The game use case has [Gavin the Game Developer](../product/personas/persona-gavin-the-game-developer.md) and [Priya the Player](../product/personas/persona-priya-the-player.md). The fifth, [Casey the Contributor](../product/personas/persona-casey-the-contributor.md), represents whoever maintains the library's internals.
