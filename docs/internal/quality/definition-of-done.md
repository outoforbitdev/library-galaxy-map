# Definition of Done

A GitHub issue is considered **done** when all of the following are true:

## Code

- [ ] The implementation matches the issue's acceptance criteria.
- [ ] The build passes: `just build` succeeds without errors.
- [ ] The change has been manually verified in `app-galaxy-map` via `just pack` (for component changes).
- [ ] No `any` types were introduced without justification.
- [ ] Code is formatted (Prettier-compliant).

## Version and Changelog

- [ ] `package.json` version is bumped appropriately (patch/minor/major).
- [ ] `CHANGELOG.md` has an entry for the new version describing the change.

## Documentation

- [ ] The README is updated if the public API changed.
- [ ] Internal docs are updated if architecture, workflows, or requirements changed.

## Review

- [ ] The PR has been reviewed and approved.
- [ ] All review comments have been addressed.

## Merge

- [ ] The PR has been merged into `main`.
- [ ] The GitHub issue has been closed.
