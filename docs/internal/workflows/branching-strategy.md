# Branching Strategy

## Main Branch

`main` is the single long-lived branch. All work merges into `main` via pull requests. Direct commits to `main` are not permitted.

## Feature Branches

Branch names should follow the pattern:

```
<issue-number>-<short-description>
```

Examples:
- `89-docs-create-internal-documentation`
- `42-feat-planet-click-handler`
- `17-fix-zoom-clamp`

## Branch Lifecycle

1. Branch from `main`.
2. Work in the feature branch.
3. Open a PR targeting `main`.
4. Merge via GitHub (squash or merge commit — no preference enforced).
5. Delete the branch after merge.

## No Long-Lived Feature Branches

Avoid branches that live longer than a few days. Break large features into smaller PRs.
