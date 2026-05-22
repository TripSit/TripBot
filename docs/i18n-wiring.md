# i18n Wiring Notes

How i18n "core" is wired in TripBot. Covers init, file layout, the runtime API (`t`, `getLocale`, `getCommandLocalizations`), Discord command localization, and locale resolution.

## Overview

- **Source of truth:** `src/locales/en-US/`. All other locales are synced from it via `npm run i18n:sync`.
- **Engine:** [i18next](https://www.i18next.com/) with `i18next-fs-backend` (loads JSON from disk).
- **One namespace per command.** Each `src/locales/<locale>/<command>.json` file is an i18next namespace; the namespace name is the file name without `.json`.
- **Locales present today:** `en-US` (source) and `fi`. 59 namespaces under `en-US`.
- **Core entrypoint:** `src/i18n/index.ts` exports `initI18n`, `t`, `getLocale`, `getCommandLocalizations`, `getAvailableLocales`.

## Init (`initI18n`)

Called once at boot from [src/start.ts:53](../src/start.ts#L53), after `global.db` is set and before Discord connects:

```ts
await updateDb();
await initI18n();
if (env.DISCORD_CLIENT_TOKEN && validateEnv('DISCORD')) await discordConnect();
```

`initI18n` ([src/i18n/index.ts:12](../src/i18n/index.ts#L12)) does:

1. **Auto-discover locales** — every directory under `src/locales/` is a preload language.
2. **Auto-discover namespaces** — every `*.json` in `en-US/` becomes a namespace. Adding a new command JSON requires **no code change**.
3. **Init i18next** with:
   - `lng: env.LOCALE ?? 'en-US'` — runtime default language.
   - `fallbackLng: 'en-US'` — missing keys fall back to en-US per-key.
   - `defaultNS: 'common'`.
   - `loadPath: src/locales/{{lng}}/{{ns}}.json`.

**Path note:** `LOCALES_DIR` is `process.cwd()/src/locales`, not relative to `__dirname`. At runtime `__dirname` is `build/src/i18n`, and locales are **not** copied into `build/`, so cwd-relative is required.

## File layout

```
src/locales/
  en-US/              ← source of truth
    common.json
    setup.json
    testkits.json
    ... (59 namespaces)
  fi/                 ← synced from en-US via `npm run i18n:sync`
    common.json
    ...
```

Each JSON is a flat key→string map. Reference a string as `<namespace>.<key>` (dot-notation), e.g. `setup.localeSetReply`, `testkits.commandDescription`.

## Runtime translation: `t()`

[src/i18n/index.ts:38](../src/i18n/index.ts#L38). Two call forms (overloaded):

```ts
t(locale, 'setup', 'localeSetReply', { locale: 'fi' })   // separate ns + key
t(locale, 'setup.localeSetReply', { locale: 'fi' })       // dot-notation ref (preferred)
```

The dot form splits on the **first** dot: everything before = namespace, everything after = key. Interpolation vars are passed through to `i18next.t`. `escapeValue: false` (Discord strings, not HTML).

The codebase has migrated to the dot-notation form (`refactor(i18n): migrate all t() ... to dot-notation refs`), and the i18n-ally VS Code regex matches it.

## Locale resolution: `getLocale()`

[src/i18n/index.ts:62](../src/i18n/index.ts#L62). **Simplified** — resolves to env `LOCALE`, falling back to `en-US`:

```ts
export async function getLocale(interaction, ns?): Promise<string> {
  return global.env?.LOCALE ?? 'en-US';
}
```

- Stays `async` and keeps the `interaction`/`ns` params so the ~58 call sites don't change.
- **Per-guild DB locale (`discord_guilds.locale`) and Discord guild/user locale are no longer read.** `/setup locale set` still writes the DB column, but it has no effect on resolution (kept so per-guild support can be re-enabled later). See [i18n-priority.md](i18n-priority.md).

### `getLocale()` accepts `BaseInteraction`

Signature uses `BaseInteraction` (base for all Discord interactions); in practice always called from slash handlers where it's a `ChatInputCommandInteraction`. Safe: `ChatInputCommandInteraction → CommandInteraction → BaseInteraction` straight inheritance. Param is now unused anyway.

## Discord command localization: `getCommandLocalizations()`

[src/i18n/index.ts:93](../src/i18n/index.ts#L93). Builds the localization map Discord wants when registering slash commands (`setNameLocalizations`, `setDescriptionLocalizations`). Reads every locale dir **except `en-US`** and returns `{ <locale>: <string> }` for the given ref. Malformed/missing files are skipped silently.

Used at command-definition time (the `data: new SlashCommandBuilder()...` block), distinct from `t()` which runs per-interaction:

```ts
export default {
  data: new SlashCommandBuilder()
    .setName('drug_testkits')
    .setNameLocalizations(getCommandLocalizations('testkits.commandName'))
    .setDescription('Information on how to get a test kit')          // base en-US string
    .setDescriptionLocalizations(getCommandLocalizations('testkits.commandDescription')),
};
```

The base `setName`/`setDescription` string is the en-US fallback Discord shows when a client's language has no localization. Both layers are needed.

### How Discord handles command localization

Your **client** language must have a translated locale to see command names/descriptions translated — server locale (env `LOCALE`) does **not** affect this. An English client always shows the base `setDescription` English string. That is correct Discord behavior, not a bug.

After adding/changing command localizations, re-register: `npm run tripbot:deployCommands`.

## The two locale axes (don't confuse them)

| | Driven by | Affects |
|---|---|---|
| **Command metadata** (names/descriptions in the slash UI) | viewer's **Discord client** language | `getCommandLocalizations()` at register time |
| **Response content** (`t()` output in replies/embeds) | `getLocale()` → env `LOCALE` | every `t()` call at interaction time |

So a Finnish-client user on a server with `LOCALE=en-US` sees Finnish command descriptions but English reply text — expected, the two axes are independent.

## Adding a locale

1. `mkdir src/locales/<locale>` and `npm run i18n:sync` (creates all 59 namespace files from en-US).
2. Translate the values.
3. `getCommandLocalizations` picks it up automatically; `initI18n` preloads it on next boot.
4. `npm run tripbot:deployCommands` to push command localizations to Discord.
5. To make it the default response language, set env `LOCALE=<locale>`.

## Adding a translatable command

1. Add `src/locales/en-US/<command>.json` with your keys.
2. `npm run i18n:sync` to propagate to other locales.
3. Use `t(locale, '<command>.<key>')` in the handler; `getCommandLocalizations('<command>.<key>')` in the builder.

No registration code needed — namespaces are auto-discovered at init.
