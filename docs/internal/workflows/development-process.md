# Development Process

## Overview

Development follows a GitHub issue-driven workflow. Work is tracked via GitHub Issues and delivered through pull requests into `main`.

## Workflow

1. **Pick up an issue** — Find or create a GitHub issue describing the work. Assign it to yourself.
2. **Create a branch** — Branch from `main` using the naming convention described in [Branching Strategy](./branching-strategy.md).
3. **Implement** — Write code, keeping commits small and focused. Each commit must follow Conventional Commits format (enforced by commitlint + Husky).
4. **Build and test locally** — Run `just build` to verify the build succeeds. Run `just pack` to test against `app-galaxy-map`.
5. **Open a pull request** — Submit a PR to `main`. The CI pipeline checks version consistency.
6. **Review and merge** — After review, merge the PR. The release pipeline runs on merge to `main`.

## Local Setup

See [Quick Start](../onboarding/quick-start.md) for environment setup instructions.

## Commit Messages

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

Examples:
feat(planet-map): add click handler for planet selection
fix(zoom): clamp zoom level to configured min/max
docs(readme): update usage example
chore(deps): bump react to 19.1.1
```

The Husky pre-commit hook runs `commitlint` to enforce this format.
