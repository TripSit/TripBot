# Project Instructions: TripBot

TripSits Discord bot which provides harm reduction resources.

## Main Facts

- `src/start.ts`: bootstraps the app and configures `global.db`.
- Command pattern: `src/global/commands/*` (core) and `src/discord/commands/*` (platform).
- Database: Prisma schemas under `src/prisma/` and generated clients (`npm run db:generate`).
- i18n: `src/i18n/index.ts` plus `src/locales/<locale>/` (use `npm run i18n:sync`).
- Dev scripts & Docker: key scripts in `package.json` (e.g. `tripbot:start`) and `docker/Dockerfile.tripbot`.

## Building

### Build

TypeScript compiles to `./build/` via `tsc-watch`. The dev workflow (`npm run tripbot:start`) watches `src/` and re-runs `node ./build/src/start.js` on each successful compile. Source maps are enabled; `source-map-support` is installed at startup.

### Tests

Jest config is at `src/jest/jest.config.ts`. Tests currently cover `src/api/**` and `src/i18n/**`. Discord command tests are not yet present. The config sets up `src/global/utils/log.ts` and `src/global/utils/env.config.ts` as `setupFilesAfterFramework` globals.

## Commands

```bash
# Run the bot (uses tsc-watch + tmux; attaches to session for logs)
npm run tripbot:start
npm run tripbot:logs
npm run tripbot:stop

# Lint (airbnb-typescript ESLint rules, auto-fixes)
npm run tripbot:lint

# Tests (Jest, ts-jest)
npm run tripbot:test

# Deploy slash commands to Discord (required after adding/modifying commands)
npm run tripbot:deployCommands

# Database
npm run db:start          # start postgres container
npm run db:migrateDev     # create new migration (rename CHANGE_ME in the name flag)
npm run db:generate       # regenerate Prisma clients (tripbot + moodle)
npm run db:seed           # seed the database

# i18n
npm run i18n:sync         # sync all locale files against en-US (source of truth)
npm run i18n:sync -- --dry  # preview without writing
```
## Architechture

### Platform pattern

Commands have a **global core** (`src/global/commands/g.<name>.ts`) that contains business logic and database interaction, and a **platform UI layer** (`src/discord/commands/*/d.<name>.ts`) that handles platform-specific input/output and delegates to the global function. This allows the same logic to be reused on IRC, Matrix, and Telegram (currently dormant — those clients are commented out in `src/start.ts`).

### Module aliases

Path aliases are configured in `tsconfig.json` and `package.json` (`_moduleAliases`):
- `@global/*` → `src/global/*`
- `@discord/*` → `src/discord/*`
- `@database/*` → `src/prisma/*`
- `@db/tripbot` → `src/prisma/tripbot/generated`
- `@db/moodle` → `src/prisma/moodle/generated`

At runtime the build output uses `module-alias`; TypeScript uses `tsconfig-paths`.

### Database

Two Prisma schemas coexist:
- **tripbot** (`src/prisma/tripbot/schema.prisma`) — main app database (PostgreSQL via `@prisma/adapter-pg`)
- **moodle** (`src/prisma/moodle/`) — read-only connection to a Moodle LMS database (MariaDB via `@prisma/adapter-mariadb`)

The active Prisma client is exposed as `global.db` (set in `src/start.ts`) and typed as `any` to avoid the dual-schema complexity. Import the client directly from `src/prisma/tripbot/client.ts` in non-global contexts.

### Environment

`src/global/utils/env.config.ts` is the single source of all environment variables and hardcoded channel/role IDs. IDs switch between production and development values based on `NODE_ENV`. All env vars come from `.env` (copy `.env.example` to get started). The `env` object is also set on `global.env` for global access.

### Logging

`src/global/utils/log.ts` exports a Winston logger as `log`. Every file uses `const F = f(__filename)` (a helper that extracts the filename) to tag its log output. Log destinations include console, Rollbar, and Sentry depending on env.

### i18n

Translation files live in `src/locales/<locale>/<namespace>.json`. `en-US` is the source of truth; all other locales are synced from it via `npm run i18n:sync`. Each namespace corresponds to a command — one JSON file per command. The `initI18n()` function in `src/i18n/index.ts` auto-discovers namespaces from `en-US` file names, so adding a new namespace file requires no code change.

## Agents
### Analysis Strategy

When asked to analyze or understand a large section of the codebase:

1. Do NOT read all files directly. First map the directory structure.
2. Use the Task tool to delegate file reading to sub-agents.
3. Each sub-agent should read no more than 10–15 files and return a structured summary.
4. Use Claude Haiku for sub-agent tasks where possible.
5. Collect summaries before drawing conclusions.