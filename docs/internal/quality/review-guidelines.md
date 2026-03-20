# Review Guidelines

## Purpose

Code review ensures correctness, maintainability, and API stability before changes reach `main` and are published to npm.

## Reviewer Checklist

### Correctness

- [ ] Does the change do what the PR description says?
- [ ] Are there edge cases that aren't handled (empty arrays, undefined props, extreme zoom values)?
- [ ] Does the build succeed (`just build`)?

### API Stability

- [ ] Does this change break any existing public props (`IMapProps`, `IPlanet`, `ISpacelane`, `IMapOptions`)?
- [ ] If it's a breaking change, is the version bump in `package.json` a major bump?
- [ ] Are new public props typed and documented?

### Code Quality

- [ ] Does the code follow the [Coding Standards](./coding-standards.md)?
- [ ] Are there any `any` types that should be properly typed?
- [ ] Is the change as simple as it can be without sacrificing correctness?

### Documentation

- [ ] Is the README updated if the public API changed?
- [ ] Is `CHANGELOG.md` updated?
- [ ] Are internal docs updated if architecture or workflows changed?

### Release

- [ ] Does the version in `package.json` match the intended release?
- [ ] Does `CHANGELOG.md` have an entry for this version?

## Author Responsibilities

- Write a clear PR description explaining what changed and why.
- Self-review the diff before requesting review.
- Respond to review comments promptly.
- Do not merge without at least one approving review (when team size allows).
