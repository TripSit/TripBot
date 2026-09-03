# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

The imported file above is the authoritative, actively maintained instruction set for this repository (workflow,
required commands, architecture rules, style, safety constraints, verification matrix, git hygiene). Read it in full
before making changes. The notes below are quick-reference additions that complement it.

## Quick command reference

```powershell
# Install (reproducible, matches CI/Docker)
npm ci

# Type-check only
npx tsc --noEmit --pretty false

# Lint a specific file (repo-wide lint may surface unrelated pre-existing failures)
npx eslint --ext .ts,.js path/to/file.ts

# Run the active Jest suite (currently API-focused)
npm run tripbot:test -- --runInBand

# Run a single existing test file, even outside the active testMatch
npx jest --config ./src/jest/jest.config.ts --runTestsByPath ./path/to/file.test.ts --runInBand --coverage=false

# Generate Prisma clients before a full type-check/build
npx prisma generate --schema ./src/prisma/tripbot/schema.prisma
npx prisma generate --schema ./src/prisma/moodle/schema.prisma

# Start only the local Postgres service
npm run db:start
```

`tripbot:start`, `tripbot:dev`, and `tripbot:restart` rely on `tmux` and are not native Windows commands — use the
`npx tsc`/`npx prisma` commands above directly on Windows instead.

## Architecture at a glance

TripBot is a strict-TypeScript Discord.js bot (with an Express API) for the TripSit harm-reduction community, backed
by PostgreSQL via Prisma, with a secondary read-oriented MariaDB (Moodle) integration.

The core command flow separates platform UI from business logic:

```text
Discord interaction -> src/discord/commands/.../d.* -> src/global/commands/g.* -> Prisma/external service
```

- `d.*` files (in `src/discord/commands/global|guild/`) own parsing, embeds, buttons, modals, permissions, and
  interaction lifecycle.
- `g.*` files (in `src/global/commands/`) hold reusable, platform-independent business logic — this is what a
  hypothetical Matrix/IRC/Telegram front end would also call.
- `src/discord/commands/index.ts` dynamically loads command modules and registers whichever export has a `.data`
  property; new commands should follow the `SlashCommand`/`MessageCommand`/`UserCommand` contracts in
  `src/discord/@types/commandDef.ts`.

Other structural notes:

- Path aliases (`@global/*`, `@discord/*`, `@database/*`, `@db/tripbot`, `@db/moodle`) are defined in `tsconfig.json`
  and resolved at runtime via `tsc-alias` against `build/`.
- Globals such as `db`, `log`, and `f` are intentionally exposed rather than imported — check `src/global/@types/`
  before introducing a new pattern.
- `src/api/app.ts` mounts `/api/tripsit`, `/api/v1` (legacy JSON), and `/api/v2` (Prisma/Postgres).
- Generated Prisma clients under `src/prisma/*/generated/` are gitignored and must never be hand-edited.
