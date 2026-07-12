# AGENTS.md

Repository instructions for AI coding agents working on TripBot. This file applies to the entire repository unless a
more specific `AGENTS.md` exists below the file being edited.

## Instruction priority

1. Follow the user's current request.
2. Follow the nearest applicable `AGENTS.md`.
3. Preserve established repository behavior and conventions.
4. Prefer the smallest complete change that solves the requested problem.

If instructions conflict or a requested operation could affect production data, Discord users, credentials, or an
external service, stop and ask before taking the risky action.

## Non-negotiable rules

- Use Node.js with npm for dependency installation and package command execution. Do not use Bun, Yarn, or pnpm.
- Prefer existing `package.json` scripts when they perform the required task without creating unrelated changes.
- Do not add new tests unless the user explicitly asks for tests. Run relevant existing tests when practical.
- Do not edit generated Prisma clients under `src/prisma/*/generated/`.
- Do not edit `archive`, `legacy`, placeholder, Matrix, IRC, or Telegram code unless the task specifically targets it.
- Never commit `.env`, tokens, passwords, private URLs, production identifiers, database dumps, or user data.
- Never run a production migration, deploy Discord commands, push a branch, or mutate an external service unless the
  user explicitly requested that operation.
- Preserve unrelated user changes. Never discard, reset, overwrite, or reformat files outside the requested scope.
- Do not use broad auto-fix commands against the whole repository. They can create large unrelated diffs.

## Project summary

TripBot is a strict TypeScript application whose primary runtime is Node.js. It contains:

- a Discord.js bot;
- an Express API;
- a PostgreSQL TripBot database accessed through Prisma;
- a read-oriented Moodle MariaDB integration with its own Prisma schema;
- Docker-based local services;
- Jest tests, with the active Jest configuration currently focused on API tests.

TripBot provides harm-reduction and community tooling. Treat changes to drug information, interactions, dosage text,
crisis resources, moderation, privacy, and user records as high-impact. Preserve established wording and data sources;
do not invent medical claims or silently weaken safety checks.

## Toolchain and repository reality

- Required Node version: `22.14.0` from `.nvmrc`; `package.json` allows Node `>=22.14.0`.
- Package manager: npm.
- Application runtime: Node.js.
- TypeScript target: ES2022.
- Module format: CommonJS for application code.
- Type checking: strict.
- Style: ESLint with Airbnb TypeScript and SonarJS rules.
- Database toolkit: Prisma 7 with PostgreSQL and MariaDB adapters.
- Test runner: Jest with `ts-jest`.
- Dependency lockfile: `package-lock.json`.
- Package scripts, Docker files, hooks, and CI workflows use npm/npx.

## Initial workflow

Before editing:

1. Run `git status --short --branch` and note pre-existing changes.
2. Read this file and any more specific `AGENTS.md` in the target subtree.
3. Read the relevant implementation, its callers, adjacent types, and existing tests before choosing a fix.
4. Check `package.json`, `tsconfig.json`, `.eslintrc`, and the relevant Prisma schema only when the task touches them.
5. Keep the requested scope narrow. Do not turn a targeted fix into cleanup or modernization work.

After editing:

1. Review `git diff -- <changed paths>` for correctness and accidental churn.
2. Run the smallest relevant verification set from this document.
3. Run `git diff --check`.
4. Confirm `git status --short` contains only intended files or clearly identify pre-existing changes.
5. Report what changed, what was verified, and any verification that could not be run.

## Installing dependencies

For an unchanged checkout, perform the reproducible lockfile install used by CI and Docker:

```powershell
npm ci
```

Avoid dependency changes unless the task requires them. If a dependency must be added, removed, or upgraded:

- use `npm install <package>`, `npm install --save-dev <package>`, or `npm uninstall <package>`;
- commit both `package.json` and `package-lock.json` when both change;
- do not hand-edit dependency versions in only one of those files;
- run `npm ci` after the change to confirm the lockfile is reproducible.

Do not create or commit `bun.lock`, `yarn.lock`, or `pnpm-lock.yaml`.

## Common Node.js/npm commands

Use `npm run <script>` for repository scripts and `npx <binary>` for locally installed command-line tools.

### Read-only checks

```powershell
# Type-check without writing build output
npx tsc --noEmit --pretty false

# Lint only files touched by the task
npx eslint --ext .ts,.js path/to/file.ts

# Lint the repository without auto-fixing
npx eslint --ext .ts,.js .

# Run the active Jest suite
npm run tripbot:test -- --runInBand

# Run one existing test file even if it is outside the active testMatch
npx jest --config ./src/jest/jest.config.ts --runTestsByPath ./path/to/file.test.ts --runInBand --coverage=false
```

Use targeted lint and tests first. Repository-wide lint may expose unrelated pre-existing failures.

### Build

Prisma clients must exist before a full type-check or build:

```powershell
npx prisma generate --schema ./src/prisma/tripbot/schema.prisma
npx prisma generate --schema ./src/prisma/moodle/schema.prisma
npx tsc
npx tsc-alias
npx tsc --project tsconfig.prisma.json
```

Build output goes to `build/` and must not be committed.

### Local environment and database

Create a local `.env` from `.env.example`, fill in only the values needed for the task, and never commit it.

```powershell
# Start only the local PostgreSQL service
npm run db:start

# Inspect its logs
npm run db:logs

# Validate and format the default TripBot schema
npx prisma validate
npx prisma format

# Apply already-committed TripBot migrations to the configured local database
npx prisma migrate deploy
```

`prisma.config.ts` selects the TripBot schema by default. It selects Moodle only when `PRISMA_SCHEMA=moodle`. In
PowerShell, scope that variable carefully and remove it after the command:

```powershell
$env:PRISMA_SCHEMA = 'moodle'
npx prisma generate
Remove-Item Env:PRISMA_SCHEMA
```

Database commands can mutate data. Use only a disposable/local database unless the user explicitly authorizes another
target. Do not run `prisma db push`, `prisma migrate reset`, or destructive SQL as routine verification.

### Running services

- Use `npm run <script>` for the scripts defined in `package.json`.
- `tripbot:start`, `tripbot:dev`, and `tripbot:restart` assume `tmux`, so they are not native Windows development
  commands.
- `db:generate` and related scripts use POSIX inline environment-variable syntax. On Windows PowerShell, use explicit
  `npx prisma` commands and `$env:PRISMA_SCHEMA` as shown above.
- Docker Compose is the preferred portable way to start the database service.

Deploying Discord commands changes the registered commands for a real application. Only when explicitly requested and
the target environment is confirmed, use:

```powershell
npm run tripbot:deployCommands
```

## Repository map

```text
src/start.ts                         Process entry point; starts API, database setup, and Discord
src/api/                             Express application, middleware, v1 and v2 routes
src/discord/discord.ts               Discord client startup
src/discord/commands/global/         Commands available across supported Discord contexts
src/discord/commands/guild/          Guild-oriented Discord commands
src/discord/commands/archive/        Archived commands; leave untouched unless requested
src/discord/events/                  Discord event handlers
src/discord/utils/                   Command deployment, context, embeds, and Discord helpers
src/discord/@types/                  Discord command contracts and type augmentation
src/global/commands/                 Platform-independent business logic, conventionally g.*
src/global/utils/                    Shared utilities, environment, logging, experience, and database updates
src/global/@types/                   Global declarations and shared ambient types
src/prisma/tripbot/schema.prisma      Primary PostgreSQL schema
src/prisma/tripbot/migrations/        Primary database migration history
src/prisma/tripbot/client.ts          PostgreSQL Prisma client adapter
src/prisma/moodle/schema.prisma       Moodle MariaDB schema
src/prisma/moodle/client.ts           Moodle Prisma client adapter
src/prisma/*/generated/               Generated clients; ignored and never edited manually
src/jest/jest.config.ts               Active Jest configuration
src/docker/                           Container build, startup, and wait scripts
assets/                               Runtime data, fonts, and images
build/                                Generated TypeScript output; ignored
```

Inactive or partially maintained areas such as Matrix, IRC, Telegram, archive, legacy, placeholder, and many Discord
test directories are excluded by TypeScript, ESLint, CI, or Jest patterns. Do not assume a repository-wide command
validates those areas.

## Architecture rules

### Keep shared logic separate from Discord UI

The intended command flow is:

```text
Discord interaction -> src/discord/commands/.../d.* -> src/global/commands/g.* -> Prisma/external service
```

- Keep parsing, embeds, buttons, modals, permissions, and interaction lifecycle in `d.*` command files.
- Put reusable business logic in `src/global/commands/g.*` when it can be platform-independent.
- Do not make global command logic depend on Discord interaction objects without a strong existing precedent.
- Reuse existing helpers rather than duplicating database or formatting logic.

### Discord command discovery

`src/discord/commands/index.ts` dynamically loads `.ts`/`.js` modules from the `global` and `guild` command folders and
registers an exported object that has a `.data` property.

When adding or changing a command:

- start from the nearest real command, not only a template;
- use the `SlashCommand`, `MessageCommand`, or `UserCommand` contract from
  `src/discord/@types/commandDef.ts`;
- keep the command builder name and exported command object coherent;
- place it in `global/` or `guild/` according to its intended Discord contexts;
- set contexts and integration types deliberately; do not broaden availability accidentally;
- preserve permission, role, guild, and environment checks;
- log command context using the established `commandContext` pattern where adjacent commands do so;
- defer or reply exactly once, then use `editReply`/`followUp` consistently;
- use `MessageFlags.Ephemeral` where the surrounding code does, especially for private or sensitive responses;
- return the boolean required by the command type;
- redeploy command definitions only when the user explicitly requests it.

If options, subcommands, contexts, integration types, or descriptions change, state in the handoff that Discord command
registration must be redeployed.

### Globals and aliases

The codebase intentionally exposes values such as `db`, `log`, `f`, environment data, and Discord state through global
declarations. Check `src/global/@types/` and startup/logging code before replacing an established global with a new import
or dependency-injection pattern.

Source aliases are defined in `tsconfig.json`:

- `@global/*` -> `src/global/*`
- `@discord/*` -> `src/discord/*`
- `@database/*` -> `src/prisma/*`
- `@db/tripbot` -> generated TripBot client
- `@db/moodle` -> generated Moodle client

Application builds require `tsc-alias` because runtime aliases point into `build/`. Follow the import style of nearby
files and do not introduce a second alias scheme.

### Express API

- `src/api/app.ts` configures middleware and mounts `/api/tripsit`, `/api/v1`, and `/api/v2`.
- Put route handling in `*.routes.ts` and database/query helpers in `*.queries.ts` where that pattern already exists.
- Preserve rate limiting, Helmet, body-size limits, authentication middleware, centralized not-found handling, and error
  handling.
- Validate and normalize request input at the boundary.
- Do not return secrets, raw internal errors, private moderation data, or more user data than the existing contract.
- Forward unexpected async errors to the established error handler rather than swallowing them.
- Keep v1 compatibility unless the task explicitly authorizes a breaking API change.

### Prisma and database changes

- TripBot uses PostgreSQL; Moodle uses MariaDB/MySQL. Do not apply one schema's assumptions to the other.
- Generated clients live beside each schema and are gitignored. Regenerate; never hand-edit them.
- Import the primary client through the existing `db` global or `src/prisma/tripbot/client.ts` pattern.
- Import Moodle through `src/prisma/moodle/client.ts`.
- For a TripBot schema change, update `src/prisma/tripbot/schema.prisma`, create a named migration in
  `src/prisma/tripbot/migrations/`, format/validate, regenerate, and inspect the SQL.
- Migration names must describe the change; never leave `CHANGE_ME`.
- Do not rewrite or delete committed migrations unless the user explicitly asks and understands the compatibility cost.
- Avoid `db push` for changes intended to ship; use migrations.
- Preserve unique constraints, indexes, nullability, defaults, relation behavior, and existing data compatibility.
- Treat the large Moodle schema as externally governed. Do not create TripBot migrations for Moodle or casually format
  the entire schema.

## TypeScript and style conventions

- Keep TypeScript strict; do not weaken `tsconfig.json` or add broad suppressions to make a change compile.
- Prefer precise types and narrow unions over `any`, non-null assertions, and unsafe casts.
- Follow nearby code style: two-space indentation, single quotes, semicolons, trailing commas in multiline structures,
  and a preferred maximum line length of 120.
- Use async/await consistently and await operations whose completion affects behavior.
- Handle nullable Discord/API/database values explicitly.
- Keep exported names, default exports, filenames, and command names consistent with adjacent modules.
- Preserve existing public behavior unless the request is explicitly a behavior change.
- Avoid drive-by renames, import sorting, comment cleanup, or formatting unrelated code.
- Add comments only for non-obvious constraints or reasoning; do not narrate straightforward code.
- Do not introduce a new abstraction for one call site unless it materially improves correctness.
- Prefer the existing logger over `console.log`; never log tokens, authorization headers, raw credentials, or sensitive
  user content.

## Domain and safety constraints

- Harm-reduction output must be conservative, factual, and consistent with the project's established data source.
- Do not invent dose ranges, interaction severities, contraindications, crisis contacts, or medical conclusions.
- Do not remove disclaimers, escalation language, privacy controls, moderation checks, or rate limits as “cleanup.”
- Treat moderation actions, bans, appeals, reports, AI moderation, and role checks as security-sensitive.
- Treat Discord IDs and public configuration differently from secrets, but do not expose identifiers unnecessarily.
- Preserve user privacy in logs, API responses, errors, tests, fixtures, and screenshots.

## Verification matrix

Choose checks proportional to the change; do not claim checks you did not run.

| Change | Minimum verification |
| --- | --- |
| Documentation only | Review rendered/plain Markdown, `git diff --check` |
| TypeScript logic | Targeted ESLint, `npx tsc --noEmit --pretty false`, relevant existing test |
| Discord command | Type-check, targeted ESLint, relevant existing test if configured, inspect interaction lifecycle |
| Command definition/options | Discord-command checks plus note that deployment is required; do not deploy automatically |
| API route/query | Type-check, targeted ESLint, targeted API Jest file |
| Prisma schema | `prisma format`, `prisma validate`, generate both affected clients, type-check, inspect migration SQL |
| Migration | Schema checks plus apply to a disposable local database and verify data compatibility |
| Dependency/tooling | `npm ci`, type-check, relevant tests, and confirm `package-lock.json` is coherent |
| Docker/runtime | Build or start only the affected service, inspect logs, stop only containers started for the task |

The active `src/jest/jest.config.ts` currently matches API tests and collects API coverage. Many Discord tests exist but
are not part of the default suite. Use `--runTestsByPath` for a relevant existing test and report failures honestly;
do not broaden Jest configuration unless requested.

If dependencies or generated Prisma clients are unavailable, say so clearly. Do not disguise an environment/setup
failure as a source-code failure.

## Git and change hygiene

- Work on the current branch unless the user asks for a new one.
- Do not commit, amend, rebase, merge, push, force-push, or open a pull request unless explicitly asked.
- Never use destructive Git commands to clean the workspace.
- Keep commits, when requested, focused and use the repository's concise imperative style.
- Check both `git diff` and `git diff --cached` before committing.
- Do not include generated `build/`, coverage, `.env`, generated Prisma clients, logs, caches, or local database data.
- For PR conflict work, inspect the actual canonical PR and its real base before resolving conflicts; do not assume a fork's
  `origin` is the authoritative upstream.

## Definition of done

A task is complete only when:

- the requested behavior or artifact is fully implemented;
- the diff is scoped and contains no accidental edits;
- applicable types, lint rules, existing tests, schema checks, or runtime checks pass, or limitations are reported;
- no secrets, generated output, local state, or unrelated lockfile changes were introduced;
- externally visible follow-up work, such as a Discord command deployment or production migration, is called out but not
  performed without authorization;
- the final handoff states the changed files, verification performed, and any remaining risk or blocker.
