# i18n Remaining Commands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Internationalize all remaining user-facing Discord command strings (26 commands) by extracting hardcoded strings into `en-US` locale JSON files and replacing them with `t()` calls, using the existing i18n wiring.

**Architecture:** Each command gets its own locale namespace file at `src/locales/en-US/<command>.json`. The `d.<command>.ts` Discord layer calls `t(locale, namespace, key, vars?)` for every user-visible string. Slash command option descriptions use `getCommandLocalizations()` for Discord's built-in locale picker. Wave 1 (small) and Wave 2 (medium) run in parallel; Wave 3 (large) runs after.

**Tech Stack:** i18next, i18next-fs-backend, TypeScript, discord.js v14

---

## Reference Pattern

The canonical fully-translated command is `src/discord/commands/global/d.drug.ts`. Use it as the model.

**i18n imports to add to every file:**
```ts
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';
```
(For guild commands the path is `../../../i18n/index`; adjust depth if needed.)

**Inside `execute()`**, add at the top:
```ts
const locale = await getLocale(interaction, 'NAMESPACE');
```

**Slash command option descriptions** — replace `.setDescription('...')` with:
```ts
.setDescription(t('en-US', 'NAMESPACE', 'someKey'))
.setDescriptionLocalizations(getCommandLocalizations('NAMESPACE', 'someKey'))
```

**Name localizations** on the command itself:
```ts
.setNameLocalizations(getCommandLocalizations('NAMESPACE', 'commandName'))
.setDescriptionLocalizations(getCommandLocalizations('NAMESPACE', 'commandDescription'))
```

**String interpolation** — use `{{varName}}` in JSON values, pass `{ varName: value }` as fourth arg to `t()`:
```json
{ "karmaMsg": "{{name}} has received {{received}} karma and given {{given}} karma" }
```
```ts
t(locale, 'karma', 'karmaMsg', { name: member.displayName, received: userData.karma_received, given: userData.karma_given })
```

**After every task:** run `npm run i18n:sync -- --dry` to verify no key drift, then `npm run tripbot:lint`.

---

## Wave 1 — Small Commands (run in parallel, <100 lines each)

These 11 commands have fewer than 10 user-visible strings each. Each task is self-contained.

---

### Task 1: karma

**Files:**
- Create: `src/locales/en-US/karma.json`
- Modify: `src/discord/commands/guild/d.karma.ts`

- [ ] **Step 1: Create locale file**

```json
{
  "commandName": "karma",
  "commandDescription": "Get someone's karma!",
  "targetOption": "User to lookup",
  "ephemeralOption": "Set to \"True\" to show the response only to you",
  "karmaMsg": "{{name}} has received {{received}} karma and given {{given}} karma"
}
```
Save to `src/locales/en-US/karma.json`.

- [ ] **Step 2: Update the command**

Replace the entire `d.karma.ts` file with:

```ts
import {
  SlashCommandBuilder,
  GuildMember,
  MessageFlags,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const dKarma: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('karma')
    .setNameLocalizations(getCommandLocalizations('karma', 'commandName'))
    .setDescription(t('en-US', 'karma', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('karma', 'commandDescription'))
    .setIntegrationTypes([0])
    .addUserOption(option => option
      .setName('target')
      .setDescription(t('en-US', 'karma', 'targetOption'))
      .setDescriptionLocalizations(getCommandLocalizations('karma', 'targetOption')))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription(t('en-US', 'karma', 'ephemeralOption'))
      .setDescriptionLocalizations(getCommandLocalizations('karma', 'ephemeralOption'))) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'karma');
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const member = interaction.options.getMember('target')
      ? interaction.options.getMember('target') as GuildMember
      : interaction.member as GuildMember;

    const userData = await db.users.upsert({
      where: { discord_id: member.id },
      create: { discord_id: member.id },
      update: {},
    });

    const embed = embedTemplate()
      .setTitle(t(locale, 'karma', 'karmaMsg', {
        name: member.displayName,
        received: userData.karma_received,
        given: userData.karma_given,
      }));
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dKarma;
```

- [ ] **Step 3: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/locales/en-US/karma.json src/discord/commands/guild/d.karma.ts
git commit -m "feat(i18n): localize karma command"
```

---

### Task 2: timezone

**Files:**
- Create: `src/locales/en-US/timezone.json`
- Modify: `src/discord/commands/guild/d.timezone.ts`

- [ ] **Step 1: Create locale file**

```json
{
  "commandName": "timezone",
  "commandDescription": "Get or set timezones!",
  "getSubcommand": "Get someone's timezone!",
  "setSubcommand": "Set your timezone!",
  "userOption": "User to lookup",
  "ephemeralOption": "Set to \"True\" to show the response only to you",
  "timezoneOption": "Timezone value",
  "notSet": "{{name}} is a timeless treasure <3\n(Has not set a time zone)",
  "invalid": "Invalid timezone!\nPlease only use the options from the autocomplete list.",
  "updated": "I updated your timezone to {{tz}}",
  "currentTime": "{{time}} wherever {{name}} is located"
}
```
Save to `src/locales/en-US/timezone.json`.

- [ ] **Step 2: Update the command**

```ts
/* eslint-disable max-len */
import {
  SlashCommandBuilder,
  GuildMember,
  MessageFlags,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { timezone } from '../../../global/commands/g.timezone';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const dTimezone: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('timezone')
    .setNameLocalizations(getCommandLocalizations('timezone', 'commandName'))
    .setDescription(t('en-US', 'timezone', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('timezone', 'commandDescription'))
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('get')
      .setDescription(t('en-US', 'timezone', 'getSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('timezone', 'getSubcommand'))
      .addUserOption(option => option
        .setName('user')
        .setDescription(t('en-US', 'timezone', 'userOption'))
        .setDescriptionLocalizations(getCommandLocalizations('timezone', 'userOption')))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(t('en-US', 'timezone', 'ephemeralOption'))
        .setDescriptionLocalizations(getCommandLocalizations('timezone', 'ephemeralOption'))))
    .addSubcommand(subcommand => subcommand
      .setName('set')
      .setDescription(t('en-US', 'timezone', 'setSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('timezone', 'setSubcommand'))
      .addStringOption(option => option
        .setName('timezone')
        .setDescription(t('en-US', 'timezone', 'timezoneOption'))
        .setDescriptionLocalizations(getCommandLocalizations('timezone', 'timezoneOption'))
        .setRequired(true)
        .setAutocomplete(true))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'timezone');
    let command = interaction.options.getSubcommand() as 'get' | 'set' | undefined;
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    if (command === 'set') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    } else {
      await interaction.deferReply({ flags: ephemeral });
    }
    const tzValue = interaction.options.getString('timezone');
    let member = interaction.options.getMember('user') as GuildMember | null;

    if (command === undefined) command = 'get';
    if (member === null) member = interaction.member as GuildMember;

    const response = await timezone(command, member.id, tzValue);

    if (command === 'get') {
      const embed = embedTemplate();
      if (response === '') {
        embed.setTitle(t(locale, 'timezone', 'notSet', { name: member.displayName }));
      } else if (response === 'invalid') {
        embed.setTitle(t(locale, 'timezone', 'invalid'));
      } else if (response === 'updated') {
        embed.setTitle(t(locale, 'timezone', 'updated', { tz: tzValue }));
      } else {
        embed.setTitle(t(locale, 'timezone', 'currentTime', { time: response, name: member.displayName }));
      }
      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply({ content: response as string });
    }
    return true;
  },
};

export default dTimezone;
```

- [ ] **Step 3: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 4: Commit**

```bash
git add src/locales/en-US/timezone.json src/discord/commands/guild/d.timezone.ts
git commit -m "feat(i18n): localize timezone command"
```

---

### Task 3: selftimeout

**Files:**
- Create: `src/locales/en-US/selftimeout.json`
- Modify: `src/discord/commands/guild/d.selftimeout.ts`

- [ ] **Step 1: Read the file first**

Read `src/discord/commands/guild/d.selftimeout.ts` in full to identify every user-visible string.

- [ ] **Step 2: Create locale file**

Extract all user-visible strings (setDescription on options, embed titles/descriptions, reply content) into `src/locales/en-US/selftimeout.json` using camelCase keys. Include `commandName` and `commandDescription`.

- [ ] **Step 3: Update the command**

Add i18n imports, `getLocale()` call in `execute()`, replace every hardcoded user-visible string with `t(locale, 'selftimeout', 'key')`, add `getCommandLocalizations()` to all option `.setDescription()` and the command `.setDescription()`/`.setName()`.

- [ ] **Step 4: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/locales/en-US/selftimeout.json src/discord/commands/guild/d.selftimeout.ts
git commit -m "feat(i18n): localize selftimeout command"
```

---

### Task 4: donate

**Files:**
- Create: `src/locales/en-US/donate.json`
- Modify: `src/discord/commands/guild/d.donate.ts`

- [ ] **Step 1: Read the file**

Read `src/discord/commands/guild/d.donate.ts` in full.

- [ ] **Step 2: Create locale file**

Extract all user-visible strings into `src/locales/en-US/donate.json`.

- [ ] **Step 3: Update the command**

Add i18n imports, `getLocale()`, replace hardcoded strings with `t()`, add `getCommandLocalizations()`.

- [ ] **Step 4: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/locales/en-US/donate.json src/discord/commands/guild/d.donate.ts
git commit -m "feat(i18n): localize donate command"
```

---

### Task 5: sheesh

**Files:**
- Create: `src/locales/en-US/sheesh.json`
- Modify: `src/discord/commands/guild/d.sheesh.ts`

- [ ] **Step 1: Read the file**

Read `src/discord/commands/guild/d.sheesh.ts` in full.

- [ ] **Step 2: Create locale file**

Extract all user-visible strings into `src/locales/en-US/sheesh.json`.

- [ ] **Step 3: Update the command**

Add i18n imports, `getLocale()`, replace hardcoded strings with `t()`, add `getCommandLocalizations()`.

- [ ] **Step 4: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/locales/en-US/sheesh.json src/discord/commands/guild/d.sheesh.ts
git commit -m "feat(i18n): localize sheesh command"
```

---

### Task 6: dramacounter

**Files:**
- Create: `src/locales/en-US/dramacounter.json`
- Modify: `src/discord/commands/guild/d.dramacounter.ts`

- [ ] **Step 1: Read the file**

Read `src/discord/commands/guild/d.dramacounter.ts` in full.

- [ ] **Step 2: Create locale file**

Extract all user-visible strings into `src/locales/en-US/dramacounter.json`.

- [ ] **Step 3: Update the command**

Add i18n imports, `getLocale()`, replace hardcoded strings, add `getCommandLocalizations()`.

- [ ] **Step 4: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/locales/en-US/dramacounter.json src/discord/commands/guild/d.dramacounter.ts
git commit -m "feat(i18n): localize dramacounter command"
```

---

### Task 7: opioidConverter

**Files:**
- Create: `src/locales/en-US/opioidConverter.json`
- Modify: `src/discord/commands/guild/d.opioidConverter.ts`

- [ ] **Step 1: Read the file**

Read `src/discord/commands/guild/d.opioidConverter.ts` in full.

- [ ] **Step 2: Create locale file**

Extract all user-visible strings into `src/locales/en-US/opioidConverter.json`.

- [ ] **Step 3: Update the command**

Add i18n imports, `getLocale()`, replace hardcoded strings, add `getCommandLocalizations()`.

- [ ] **Step 4: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/locales/en-US/opioidConverter.json src/discord/commands/guild/d.opioidConverter.ts
git commit -m "feat(i18n): localize opioidConverter command"
```

---

### Task 8: tripsitstats

**Files:**
- Create: `src/locales/en-US/tripsitstats.json`
- Modify: `src/discord/commands/guild/d.tripsitstats.ts`

- [ ] **Step 1: Read the file**

Read `src/discord/commands/guild/d.tripsitstats.ts` in full.

- [ ] **Step 2: Create locale file**

Extract all user-visible strings into `src/locales/en-US/tripsitstats.json`.

- [ ] **Step 3: Update the command**

Add i18n imports, `getLocale()`, replace hardcoded strings, add `getCommandLocalizations()`.

- [ ] **Step 4: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/locales/en-US/tripsitstats.json src/discord/commands/guild/d.tripsitstats.ts
git commit -m "feat(i18n): localize tripsitstats command"
```

---

### Task 9: say

**Files:**
- Create: `src/locales/en-US/say.json`
- Modify: `src/discord/commands/guild/d.say.ts`

- [ ] **Step 1: Read the file**

Read `src/discord/commands/guild/d.say.ts` in full.

- [ ] **Step 2: Create locale file**

Extract all user-visible strings into `src/locales/en-US/say.json`.

- [ ] **Step 3: Update the command**

Add i18n imports, `getLocale()`, replace hardcoded strings, add `getCommandLocalizations()`.

- [ ] **Step 4: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/locales/en-US/say.json src/discord/commands/guild/d.say.ts
git commit -m "feat(i18n): localize say command"
```

---

### Task 10: bountyleaderboard

**Files:**
- Create: `src/locales/en-US/bountyleaderboard.json`
- Modify: `src/discord/commands/guild/d.bountyleaderboard.ts`

- [ ] **Step 1: Read the file**

Read `src/discord/commands/guild/d.bountyleaderboard.ts` in full.

- [ ] **Step 2: Create locale file**

Extract all user-visible strings into `src/locales/en-US/bountyleaderboard.json`.

- [ ] **Step 3: Update the command**

Add i18n imports, `getLocale()`, replace hardcoded strings, add `getCommandLocalizations()`.

- [ ] **Step 4: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/locales/en-US/bountyleaderboard.json src/discord/commands/guild/d.bountyleaderboard.ts
git commit -m "feat(i18n): localize bountyleaderboard command"
```

---

### Task 11: report

**Files:**
- Create: `src/locales/en-US/report.json`
- Modify: `src/discord/commands/guild/d.report.ts`
- Modify: `src/discord/commands/guild/m.report.ts` (if it has user-visible strings)
- Modify: `src/discord/commands/guild/u.report.ts` (if it has user-visible strings)

- [ ] **Step 1: Read all three report files**

Read `src/discord/commands/guild/d.report.ts`, `m.report.ts`, and `u.report.ts` in full.

- [ ] **Step 2: Create locale file**

Extract all user-visible strings from all three files into `src/locales/en-US/report.json`.

- [ ] **Step 3: Update all three files**

Add i18n imports, `getLocale()`, replace hardcoded strings, add `getCommandLocalizations()` in `d.report.ts`.

- [ ] **Step 4: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/locales/en-US/report.json \
  src/discord/commands/guild/d.report.ts \
  src/discord/commands/guild/m.report.ts \
  src/discord/commands/guild/u.report.ts
git commit -m "feat(i18n): localize report command"
```

---

## Wave 2 — Medium Commands (run in parallel, 100–350 lines each)

These 10 commands have 10–37 user-visible strings each. Same pattern as Wave 1 but more strings to extract.

---

### Task 12: leaderboard

**Files:**
- Create: `src/locales/en-US/leaderboard.json`
- Modify: `src/discord/commands/guild/d.leaderboard.ts`

- [ ] **Step 1: Read the file**

Read `src/discord/commands/guild/d.leaderboard.ts` in full (326 lines).

- [ ] **Step 2: Create locale file**

Extract every user-visible string — embed titles, field names, field values with placeholders, option descriptions, footer text — into `src/locales/en-US/leaderboard.json`. Use `{{varName}}` for interpolated values.

- [ ] **Step 3: Update the command**

Add i18n imports, `getLocale()` at top of `execute()`, replace every hardcoded string with `t(locale, 'leaderboard', 'key', vars?)`, add `getCommandLocalizations()` to all option `.setDescription()` calls and the command `.setName()`/`.setDescription()`.

- [ ] **Step 4: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/locales/en-US/leaderboard.json src/discord/commands/guild/d.leaderboard.ts
git commit -m "feat(i18n): localize leaderboard command"
```

---

### Task 13: busyness

**Files:**
- Create: `src/locales/en-US/busyness.json`
- Modify: `src/discord/commands/guild/d.busyness.ts`

- [ ] **Step 1: Read the file**

Read `src/discord/commands/guild/d.busyness.ts` in full (285 lines).

- [ ] **Step 2: Create locale file**

Extract all user-visible strings into `src/locales/en-US/busyness.json`.

- [ ] **Step 3: Update the command**

Add i18n imports, `getLocale()`, replace hardcoded strings, add `getCommandLocalizations()`.

- [ ] **Step 4: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/locales/en-US/busyness.json src/discord/commands/guild/d.busyness.ts
git commit -m "feat(i18n): localize busyness command"
```

---

### Task 14: issue

**Files:**
- Create: `src/locales/en-US/issue.json`
- Modify: `src/discord/commands/guild/d.issue.ts`

- [ ] **Step 1: Read the file**

Read `src/discord/commands/guild/d.issue.ts` in full (123 lines).

- [ ] **Step 2: Create locale file**

Extract all user-visible strings into `src/locales/en-US/issue.json`.

- [ ] **Step 3: Update the command**

Add i18n imports, `getLocale()`, replace hardcoded strings, add `getCommandLocalizations()`.

- [ ] **Step 4: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/locales/en-US/issue.json src/discord/commands/guild/d.issue.ts
git commit -m "feat(i18n): localize issue command"
```

---

### Task 15: birthday

**Files:**
- Create: `src/locales/en-US/birthday.json`
- Modify: `src/discord/commands/guild/d.birthday.ts`

- [ ] **Step 1: Read the file**

Read `src/discord/commands/guild/d.birthday.ts` in full (205 lines).

- [ ] **Step 2: Create locale file**

Extract all user-visible strings into `src/locales/en-US/birthday.json`. Pay attention to date/name interpolation placeholders.

- [ ] **Step 3: Update the command**

Add i18n imports, `getLocale()`, replace hardcoded strings, add `getCommandLocalizations()`.

- [ ] **Step 4: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/locales/en-US/birthday.json src/discord/commands/guild/d.birthday.ts
git commit -m "feat(i18n): localize birthday command"
```

---

### Task 16: profile

**Files:**
- Create: `src/locales/en-US/profile.json`
- Modify: `src/discord/commands/guild/d.profile.ts`

- [ ] **Step 1: Read the file**

Read `src/discord/commands/guild/d.profile.ts` in full (803 lines). This is the largest medium file — take care to catch all embed field names and descriptions.

- [ ] **Step 2: Create locale file**

Extract all user-visible strings into `src/locales/en-US/profile.json`. Group related keys with consistent prefixes (e.g. `xpField`, `karmaField`, `levelField`).

- [ ] **Step 3: Update the command**

Add i18n imports, `getLocale()`, replace hardcoded strings, add `getCommandLocalizations()`.

- [ ] **Step 4: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/locales/en-US/profile.json src/discord/commands/guild/d.profile.ts
git commit -m "feat(i18n): localize profile command"
```

---

### Task 17: h2flow

**Files:**
- Create: `src/locales/en-US/h2flow.json`
- Modify: `src/discord/commands/guild/d.h2flow.ts`

- [ ] **Step 1: Read the file**

Read `src/discord/commands/guild/d.h2flow.ts` in full (104 lines).

- [ ] **Step 2: Create locale file**

Extract all user-visible strings into `src/locales/en-US/h2flow.json`.

- [ ] **Step 3: Update the command**

Add i18n imports, `getLocale()`, replace hardcoded strings, add `getCommandLocalizations()`.

- [ ] **Step 4: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/locales/en-US/h2flow.json src/discord/commands/guild/d.h2flow.ts
git commit -m "feat(i18n): localize h2flow command"
```

---

### Task 18: reminder

**Files:**
- Create: `src/locales/en-US/reminder.json`
- Modify: `src/discord/commands/guild/d.reminder.ts`

- [ ] **Step 1: Read the file**

Read `src/discord/commands/guild/d.reminder.ts` in full (104 lines).

- [ ] **Step 2: Create locale file**

Extract all user-visible strings into `src/locales/en-US/reminder.json`.

- [ ] **Step 3: Update the command**

Add i18n imports, `getLocale()`, replace hardcoded strings, add `getCommandLocalizations()`.

- [ ] **Step 4: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/locales/en-US/reminder.json src/discord/commands/guild/d.reminder.ts
git commit -m "feat(i18n): localize reminder command"
```

---

### Task 19: rss

**Files:**
- Create: `src/locales/en-US/rss.json`
- Modify: `src/discord/commands/guild/d.rss.ts`

- [ ] **Step 1: Read the file**

Read `src/discord/commands/guild/d.rss.ts` in full (127 lines).

- [ ] **Step 2: Create locale file**

Extract all user-visible strings into `src/locales/en-US/rss.json`.

- [ ] **Step 3: Update the command**

Add i18n imports, `getLocale()`, replace hardcoded strings, add `getCommandLocalizations()`.

- [ ] **Step 4: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/locales/en-US/rss.json src/discord/commands/guild/d.rss.ts
git commit -m "feat(i18n): localize rss command"
```

---

### Task 20: levels

**Files:**
- Create: `src/locales/en-US/levels.json`
- Modify: `src/discord/commands/guild/d.levels.ts`

- [ ] **Step 1: Read the file**

Read `src/discord/commands/guild/d.levels.ts` in full (739 lines). Despite the high line count, most lines are logic — there are ~10 user-visible string locations.

- [ ] **Step 2: Create locale file**

Extract all user-visible strings into `src/locales/en-US/levels.json`.

- [ ] **Step 3: Update the command**

Add i18n imports, `getLocale()`, replace hardcoded strings, add `getCommandLocalizations()`.

- [ ] **Step 4: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/locales/en-US/levels.json src/discord/commands/guild/d.levels.ts
git commit -m "feat(i18n): localize levels command"
```

---

### Task 21: idose (global)

**Files:**
- Modify: `src/locales/en-US/idose.json` (already exists — extend it)
- Modify: `src/discord/commands/global/d.idose 2.ts`

- [ ] **Step 1: Read both files**

Read `src/discord/commands/global/d.idose 2.ts` (221 lines) and `src/locales/en-US/idose.json`.

- [ ] **Step 2: Extend locale file**

Add missing keys to `src/locales/en-US/idose.json` — subcommand descriptions, option descriptions, choice labels (unit names, ROA names), and all response strings. Do not remove existing keys.

- [ ] **Step 3: Update the command**

The import path depth from a global command is `'../../../i18n/index'`. Add `getLocale()` in `execute()`, replace all hardcoded option `.setDescription()` strings and response strings with `t()` calls, add `getCommandLocalizations()`.

- [ ] **Step 4: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/locales/en-US/idose.json "src/discord/commands/global/d.idose 2.ts"
git commit -m "feat(i18n): localize idose command"
```

---

## Wave 3 — Large Commands (sequential, 500–750 lines each)

Run these after Waves 1 and 2 are merged. Each is large enough to warrant careful attention.

---

### Task 22: search

**Files:**
- Create: `src/locales/en-US/search.json`
- Modify: `src/discord/commands/guild/d.search.ts`

- [ ] **Step 1: Read the file**

Read `src/discord/commands/guild/d.search.ts` in full (742 lines).

- [ ] **Step 2: Create locale file**

Extract all user-visible strings into `src/locales/en-US/search.json`. Group by subcommand if the command has subcommands (use key prefixes like `drugSearch_`, `userSearch_`).

- [ ] **Step 3: Update the command**

Add i18n imports, `getLocale()`, replace hardcoded strings, add `getCommandLocalizations()`.

- [ ] **Step 4: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/locales/en-US/search.json src/discord/commands/guild/d.search.ts
git commit -m "feat(i18n): localize search command"
```

---

### Task 23: quote

**Files:**
- Create: `src/locales/en-US/quote.json`
- Modify: `src/discord/commands/guild/d.quote.ts`

- [ ] **Step 1: Read the file**

Read `src/discord/commands/guild/d.quote.ts` in full (584 lines).

- [ ] **Step 2: Create locale file**

Extract all user-visible strings into `src/locales/en-US/quote.json`.

- [ ] **Step 3: Update the command**

Add i18n imports, `getLocale()`, replace hardcoded strings, add `getCommandLocalizations()`.

- [ ] **Step 4: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/locales/en-US/quote.json src/discord/commands/guild/d.quote.ts
git commit -m "feat(i18n): localize quote command"
```

---

### Task 24: counting

**Files:**
- Create: `src/locales/en-US/counting.json`
- Modify: `src/discord/commands/guild/d.counting.ts`

- [ ] **Step 1: Read the file**

Read `src/discord/commands/guild/d.counting.ts` in full (717 lines).

- [ ] **Step 2: Create locale file**

Extract all user-visible strings into `src/locales/en-US/counting.json`.

- [ ] **Step 3: Update the command**

Add i18n imports, `getLocale()`, replace hardcoded strings, add `getCommandLocalizations()`.

- [ ] **Step 4: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/locales/en-US/counting.json src/discord/commands/guild/d.counting.ts
git commit -m "feat(i18n): localize counting command"
```

---

### Task 25: voice

**Files:**
- Create: `src/locales/en-US/voice.json`
- Modify: `src/discord/commands/guild/d.voice.ts`

- [ ] **Step 1: Read the file**

Read `src/discord/commands/guild/d.voice.ts` in full (576 lines).

- [ ] **Step 2: Create locale file**

Extract all user-visible strings into `src/locales/en-US/voice.json`.

- [ ] **Step 3: Update the command**

Add i18n imports, `getLocale()`, replace hardcoded strings, add `getCommandLocalizations()`.

- [ ] **Step 4: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/locales/en-US/voice.json src/discord/commands/guild/d.voice.ts
git commit -m "feat(i18n): localize voice command"
```

---

### Task 26: cooperative

**Files:**
- Create: `src/locales/en-US/cooperative.json`
- Modify: `src/discord/commands/guild/d.cooperative.ts`

- [ ] **Step 1: Read the file**

Read `src/discord/commands/guild/d.cooperative.ts` in full (745 lines).

- [ ] **Step 2: Create locale file**

Extract all user-visible strings into `src/locales/en-US/cooperative.json`.

- [ ] **Step 3: Update the command**

Add i18n imports, `getLocale()`, replace hardcoded strings, add `getCommandLocalizations()`.

- [ ] **Step 4: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/locales/en-US/cooperative.json src/discord/commands/guild/d.cooperative.ts
git commit -m "feat(i18n): localize cooperative command"
```

---

## Final Step: Sync and test

- [ ] **Run full sync check**

```bash
npm run i18n:sync -- --dry
```
Expected: no missing keys, no extra keys in en-US vs other locales.

- [ ] **Run lint**

```bash
npm run tripbot:lint
```
Expected: 0 errors.

- [ ] **Run tests**

```bash
npm run tripbot:test
```
Expected: all pass.

- [ ] **Commit if anything was auto-fixed**

```bash
git add -A
git commit -m "chore(i18n): post-localization sync and lint fixes"
```

---

## Out of scope (separate future task)

- `d.rpg.ts` (4,157 lines) — deferred due to size
- Admin/mod commands: `d.admin.ts`, `d.mod.ts`, `d.botmod.ts`, `d.bottest.ts`, `d.botstats.ts`, `d.clearchat.ts`, `d.purge.ts`
- Finnish (`fi`) locale translation — adding translated values to `src/locales/fi/` for new keys is a separate task for a human translator or AI translation pass
