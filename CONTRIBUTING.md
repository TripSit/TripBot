# Contributing to TripBot

Thanks for your interest in contributing! This file is the entry point for contribution mechanics. For full
repository conventions (architecture rules, style, safety constraints) see [AGENTS.md](AGENTS.md); for project setup
and local development see [README.MD](README.MD).

## Getting started

1. [Join our Discord guild](https://discord.gg/tripsit) — development discussion happens there.
2. Follow the **How to build** section in [README.MD](README.MD) to get a local instance running.
3. Read [AGENTS.md](AGENTS.md) before making changes — it covers toolchain requirements, architecture rules, style
   conventions, and safety constraints for this repository.

## Branching and pull requests

- `main` is the production branch. `uat` is the staging/integration branch.
- Feature branches are created from `uat` and opened as pull requests **into `uat`**, not `main`. A GitHub Action
  (`GuardMainSource`) enforces that only `uat` may open a pull request into `main`.
- Before opening a pull request, pull the latest `uat` into your feature branch first so it's up to date and the
  push won't be rejected as non-fast-forward. Prefer branching fresh from `uat` over rebasing an existing
  shared/pushed branch, since rewriting history on a branch others may have pulled is riskier.
- Keep commits focused and use the repository's concise, imperative commit message style (see `git log` for
  examples).
- Do not force-push shared branches, rewrite committed migrations, or use destructive Git commands to "clean up" a
  branch.

## Running checks before opening a PR

Every pull request into `main` or `uat` runs lint, type-check/build, tests, and CodeQL. Run the equivalent checks
locally first:

```powershell
# Install dependencies (matches CI)
npm ci

# Lint (repo-wide lint may surface unrelated pre-existing failures; prefer linting just your changed files)
npx eslint --ext .ts,.js path/to/file.ts

# Generate Prisma clients, then type-check
npx prisma generate --schema ./src/prisma/tripbot/schema.prisma
npx prisma generate --schema ./src/prisma/moodle/schema.prisma
npx tsc --noEmit --pretty false

# Run the active Jest suite
npm run tripbot:test -- --runInBand
```

See [AGENTS.md](AGENTS.md#verification-matrix) for the full verification matrix mapping change type to the minimum
checks expected (documentation, TypeScript logic, Discord commands, API routes, Prisma schema/migrations, etc.).

## Scope and safety

- Keep pull requests scoped to the problem they solve — avoid unrelated refactors, formatting, or drive-by renames.
- Treat changes to drug information, dosage text, crisis resources, moderation, privacy, and user records as
  high-impact: preserve established wording and data sources, and don't weaken existing safety checks.
- Never commit `.env`, tokens, passwords, private URLs, production identifiers, database dumps, or user data.

## License

TripBot is source-available under the [PolyForm Noncommercial License 1.0.0](LICENSE). By contributing, you agree
your contributions are provided under the same license.
