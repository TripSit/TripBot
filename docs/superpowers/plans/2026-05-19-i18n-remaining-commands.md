# i18n Remaining Commands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Internationalize all remaining user-facing Discord command strings (26 commands + `setup locale` subcommand) by extracting hardcoded strings into `en-US` locale JSON files and replacing them with `t()` calls, using the existing i18n wiring.

**Architecture:** Each command gets its own locale namespace file at `src/locales/en-US/<command>.json`. The `d.<command>.ts` Discord layer calls `t(locale, namespace, key, vars?)` for every user-visible string. Slash command option descriptions use `getCommandLocalizations()` for Discord's built-in locale picker. Wave 1 (small) and Wave 2 (medium) run in parallel; Wave 3 (large) runs after.

**Tech Stack:** i18next, i18next-fs-backend, TypeScript, discord.js v14

**Spec:** `docs/superpowers/specs/2026-05-19-i18n-design.md`

---

## Rules (from spec)

- **Never** add `t()` or `getCommandLocalizations()` to: log messages, Sentry/Rollbar errors, developer-facing errors, or any of: `d.admin.ts`, `d.mod.ts`, `d.botmod.ts`, `d.bottest.ts`, `d.botstats.ts`, `d.clearchat.ts`, `d.purge.ts`.
- A command is **fully localized** when: (1) every user-visible string uses `t()`, (2) every `.setName()`/`.setDescription()` on the command and options has a matching `getCommandLocalizations()`, (3) `npm run i18n:sync -- --dry` reports no drift.
- `npm run tripbot:deployCommands` must be run after all commands are localized (option descriptions are registered at deploy time, not runtime).
- `common.json` currently contains only `errorUnexpected`, `yes`, `no` — do not duplicate these keys.

---

## Reference Pattern

Canonical fully-translated command: `src/discord/commands/global/d.drug.ts`.

**i18n imports** to add to every file:
```ts
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';
```
(Path depth: guild commands use `'../../../i18n/index'`; global commands also use `'../../../i18n/index'` — same depth.)

**Inside `execute()`**, add at the top:
```ts
const locale = await getLocale(interaction, 'NAMESPACE');
```

**Command builder** — replace `.setDescription('...')` on the root command:
```ts
.setName('cmdname')
.setNameLocalizations(getCommandLocalizations('cmdname', 'commandName'))
.setDescription(t('en-US', 'cmdname', 'commandDescription'))
.setDescriptionLocalizations(getCommandLocalizations('cmdname', 'commandDescription'))
```

**Option descriptions** — replace `.setDescription('...')` on each option:
```ts
.setDescription(t('en-US', 'cmdname', 'someOption'))
.setDescriptionLocalizations(getCommandLocalizations('cmdname', 'someOption'))
```

**Subcommand descriptions** — same pattern:
```ts
.setDescription(t('en-US', 'cmdname', 'subDesc'))
.setDescriptionLocalizations(getCommandLocalizations('cmdname', 'subDesc'))
```

**String interpolation** — use `{{varName}}` in JSON values:
```json
{ "karmaMsg": "{{name}} has received {{received}} karma and given {{given}} karma" }
```
```ts
t(locale, 'karma', 'karmaMsg', { name: member.displayName, received: userData.karma_received, given: userData.karma_given })
```

**After every task:** `npm run i18n:sync -- --dry` then `npm run tripbot:lint`.

---

## Task 0: setup locale subcommand (new feature, do first)

**Spec:** Section 5 of `docs/superpowers/specs/2026-05-19-i18n-design.md`

**Files:**
- Modify: `src/discord/commands/global/d.setup.ts`
- Modify: `src/locales/en-US/setup.json`
- Modify: `src/discord/events/autocomplete.ts`

- [ ] **Step 1: Extend `src/locales/en-US/setup.json`**

Append these keys to the existing `setup.json` (after the last key before the closing `}`):

```json
  "localeGetSubcommand": "Show the current locale for this guild",
  "localeSetSubcommand": "Set the locale for this guild",
  "localeOptionDescription": "Locale code to set (e.g. en-US, fi)",
  "localeGetReply": "This guild's locale is set to **{{locale}}**.",
  "localeGetReplyDefault": "This guild has no locale set — using **en-US** (default).",
  "localeSetReply": "Locale updated to **{{locale}}**.",
  "localeSetInvalid": "**{{locale}}** is not a valid locale. Available locales: {{available}}.",
  "localeSubgroupDescription": "Manage the locale for this guild"
```

- [ ] **Step 2: Add `localeGet` and `localeSet` handler functions to `d.setup.ts`**

Add these two functions before the `export const setup` declaration (around line 810):

```ts
async function localeGet(
  interaction: ChatInputCommandInteraction,
) {
  const locale = await getLocale(interaction, 'setup');
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const guildData = await db.discord_guilds.findUnique({
    where: { id: interaction.guildId! },
    select: { locale: true },
  });
  if (guildData?.locale) {
    await interaction.editReply({
      content: t(locale, 'setup', 'localeGetReply', { locale: guildData.locale }),
    });
  } else {
    await interaction.editReply({
      content: t(locale, 'setup', 'localeGetReplyDefault'),
    });
  }
}

async function localeSet(
  interaction: ChatInputCommandInteraction,
) {
  const locale = await getLocale(interaction, 'setup');
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const requestedLocale = interaction.options.getString('locale', true);

  const fs = await import('fs');
  const path = await import('path');
  const localesDir = path.join(process.cwd(), 'src/locales');
  const validLocales = fs.readdirSync(localesDir)
    .filter((d: string) => /^[a-zA-Z-]+$/.test(d) && d !== 'en-US');
  // en-US is always valid but we don't store it — it's the fallback
  const allValid = ['en-US', ...validLocales];

  if (!allValid.includes(requestedLocale)) {
    await interaction.editReply({
      content: t(locale, 'setup', 'localeSetInvalid', {
        locale: requestedLocale,
        available: allValid.join(', '),
      }),
    });
    return;
  }

  await db.discord_guilds.upsert({
    where: { id: interaction.guildId! },
    create: { id: interaction.guildId!, locale: requestedLocale },
    update: { locale: requestedLocale },
  });

  await interaction.editReply({
    content: t(locale, 'setup', 'localeSetReply', { locale: requestedLocale }),
  });
}
```

- [ ] **Step 3: Add the locale subcommand group to the SlashCommandBuilder**

In `d.setup.ts`, find the `.addSubcommand(subcommand => subcommand.setName('helper'))` chain end (around line 892-894) and add the subcommand group before the closing `,` of the builder chain:

```ts
    .addSubcommandGroup(group => group
      .setName('locale')
      .setDescription(t('en-US', 'setup', 'localeSubgroupDescription'))
      .setDescriptionLocalizations(getCommandLocalizations('setup', 'localeSubgroupDescription'))
      .addSubcommand(sub => sub
        .setName('get')
        .setDescription(t('en-US', 'setup', 'localeGetSubcommand'))
        .setDescriptionLocalizations(getCommandLocalizations('setup', 'localeGetSubcommand')))
      .addSubcommand(sub => sub
        .setName('set')
        .setDescription(t('en-US', 'setup', 'localeSetSubcommand'))
        .setDescriptionLocalizations(getCommandLocalizations('setup', 'localeSetSubcommand'))
        .addStringOption(option => option
          .setName('locale')
          .setDescription(t('en-US', 'setup', 'localeOptionDescription'))
          .setDescriptionLocalizations(getCommandLocalizations('setup', 'localeOptionDescription'))
          .setRequired(true)
          .setAutocomplete(true))))
```

- [ ] **Step 4: Route the locale subcommand group in `execute()`**

In `d.setup.ts`, find the `const command = interaction.options.getSubcommand();` line (line 913) and update the routing to handle the subcommand group:

Replace:
```ts
    const command = interaction.options.getSubcommand();
    if (command === 'applications') {
```

With:
```ts
    const subcommandGroup = interaction.options.getSubcommandGroup(false);
    const command = interaction.options.getSubcommand();

    if (subcommandGroup === 'locale') {
      if (command === 'get') await localeGet(interaction);
      else if (command === 'set') await localeSet(interaction);
      return true;
    }

    if (command === 'applications') {
```

- [ ] **Step 5: Add locale autocomplete to `src/discord/events/autocomplete.ts`**

Add this function before the `export async function autocomplete` line (around line 350):

```ts
async function autocompleteLocale(interaction: AutocompleteInteraction) {
  const fs = await import('fs');
  const path = await import('path');
  const localesDir = path.join(process.cwd(), 'src/locales');
  const validLocales = fs.readdirSync(localesDir)
    .filter((d: string) => /^[a-zA-Z-]+$/.test(d));
  const focused = interaction.options.getFocused().toLowerCase();
  const filtered = validLocales
    .filter(l => l.toLowerCase().includes(focused))
    .slice(0, 25)
    .map(l => ({ name: l, value: l }));
  await interaction.respond(filtered);
}
```

In the `autocomplete` function, add before the `else` branch:

```ts
  } else if (interaction.commandName === 'setup' && interaction.options.getSubcommandGroup(false) === 'locale') {
    await autocompleteLocale(interaction);
```

- [ ] **Step 6: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/discord/commands/global/d.setup.ts \
  src/locales/en-US/setup.json \
  src/discord/events/autocomplete.ts
git commit -m "feat(i18n): add setup locale subcommand for per-guild locale management"
```

---

## Wave 1 — Small Commands (run in parallel, <100 lines each)

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

- [ ] **Step 2: Replace `src/discord/commands/guild/d.karma.ts`**

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

- [ ] **Step 2: Replace `src/discord/commands/guild/d.timezone.ts`**

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

- [ ] **Step 1: Create locale file**

```json
{
  "commandName": "selftimeout",
  "commandDescription": "Timeout yourself!",
  "durationOption": "How long? Max is 2 weeks!",
  "confirmationOption": "Are you sure? You cannot undo this!",
  "yesChoice": "Yes, I won't ask a mod to undo.",
  "noChoice": "No, I'm just testing.",
  "testingReply": "This works exactly like you think it does, try again when you're sure!",
  "seeYouIn": "We'll see you in {{duration}}!",
  "modlogMsg": "**{{tag}}** self timed out for **{{duration}}**!"
}
```
Save to `src/locales/en-US/selftimeout.json`.

- [ ] **Step 2: Replace `src/discord/commands/guild/d.selftimeout.ts`**

```ts
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  TextChannel,
  MessageFlags,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { parseDuration } from '../../../global/utils/parseDuration';
import commandContext from '../../utils/context';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const selfTimeout: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('selftimeout')
    .setNameLocalizations(getCommandLocalizations('selftimeout', 'commandName'))
    .setDescription(t('en-US', 'selftimeout', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('selftimeout', 'commandDescription'))
    .setIntegrationTypes([0])
    .addStringOption(option => option
      .setName('duration')
      .setDescription(t('en-US', 'selftimeout', 'durationOption'))
      .setDescriptionLocalizations(getCommandLocalizations('selftimeout', 'durationOption'))
      .setRequired(true))
    .addStringOption(option => option
      .setName('confirmation')
      .setDescription(t('en-US', 'selftimeout', 'confirmationOption'))
      .setDescriptionLocalizations(getCommandLocalizations('selftimeout', 'confirmationOption'))
      .addChoices(
        { name: t('en-US', 'selftimeout', 'yesChoice'), value: 'yes' },
        { name: t('en-US', 'selftimeout', 'noChoice'), value: 'no' },
      )
      .setRequired(true)) as SlashCommandBuilder,
  async execute(interaction: ChatInputCommandInteraction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'selftimeout');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    if (!interaction.guild) return false;

    const confirmation = interaction.options.getString('confirmation');

    if (confirmation === 'no') {
      await interaction.editReply({ content: t(locale, 'selftimeout', 'testingReply') });
      return false;
    }

    const target = interaction.member as GuildMember;
    const duration = interaction.options.getString('duration');
    const durationValue = await parseDuration(`${duration}`);
    await target.timeout(durationValue, 'Self timeout');

    await interaction.editReply({ content: t(locale, 'selftimeout', 'seeYouIn', { duration }) });

    const tripsitGuild = await interaction.client.guilds.fetch(env.DISCORD_GUILD_ID);
    const modLog = await tripsitGuild.channels.fetch(env.CHANNEL_MODLOG) as TextChannel;
    await modLog.send(t('en-US', 'selftimeout', 'modlogMsg', { tag: target.user.tag, duration }));

    return true;
  },
};

export default selfTimeout;
```

Note: `modlogMsg` uses `'en-US'` not `locale` because mod log messages are internal and should always be in English.

- [ ] **Step 3: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 4: Commit**

```bash
git add src/locales/en-US/selftimeout.json src/discord/commands/guild/d.selftimeout.ts
git commit -m "feat(i18n): localize selftimeout command"
```

---

### Task 4: donate

**Files:**
- Create: `src/locales/en-US/donate.json`
- Modify: `src/discord/commands/guild/d.donate.ts`

- [ ] **Step 1: Create locale file**

```json
{
  "commandName": "donate",
  "commandDescription": "Get information on supporting TripSit",
  "ephemeralOption": "Set to \"True\" to show the response only to you"
}
```
Save to `src/locales/en-US/donate.json`.

- [ ] **Step 2: Replace `src/discord/commands/guild/d.donate.ts`**

```ts
import {
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { donatePage } from '../global/d.help';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const dDonate: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('donate')
    .setNameLocalizations(getCommandLocalizations('donate', 'commandName'))
    .setDescription(t('en-US', 'donate', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('donate', 'commandDescription'))
    .setIntegrationTypes([0])
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription(t('en-US', 'donate', 'ephemeralOption'))
      .setDescriptionLocalizations(getCommandLocalizations('donate', 'ephemeralOption'))) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await getLocale(interaction, 'donate'); // resolve locale even if unused (keeps pattern consistent)
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    await interaction.editReply(await donatePage('en'));
    return true;
  },
};

export default dDonate;
```

- [ ] **Step 3: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 4: Commit**

```bash
git add src/locales/en-US/donate.json src/discord/commands/guild/d.donate.ts
git commit -m "feat(i18n): localize donate command"
```

---

### Task 5: sheesh

**Files:**
- Create: `src/locales/en-US/sheesh.json`
- Modify: `src/discord/commands/guild/d.sheesh.ts`

- [ ] **Step 1: Create locale file**

```json
{
  "commandName": "sheesh",
  "commandDescription": "Let's sheesh!",
  "lightjointSubcommand": "Let's sheesh!",
  "passjointSubcommand": "Already puffed? Pass to someone else!",
  "lightjointUserOption": "User to sheesh with",
  "passjointUserOption": "User to pass joint to",
  "lightAlone": "<:ts_meditate:1350089899113578529> {{name}} decided to light up joint alone today... <:ts_meditate:1350089899113578529>",
  "lightWithBot": "<:ts_cannabinoids:1350076845021986816> {{name}} is blazing with {{member}}! <:ts_bot:1350076410714128384> 110100100 blaze it! <:ts_cannabinoids:1350076845021986816>",
  "lightWithUser": "<:ts_cannabinoids:1350076845021986816> {{name}} started sheeshin with {{member}} <:ts_cannabinoids:1350076845021986816>",
  "lightedUp": "<:ts_cannabinoids:1350076845021986816> {{name}} lighted up a joint! <:ts_cannabinoids:1350076845021986816>",
  "keptJoint": "<:ts_smile:1350089891798712403> {{name}} decided to keep joint for themselves! Shame on you! <:ts_smile:1350089891798712403>",
  "passedToBot": "<:ts_cannabinoids:1350076845021986816> {{name}} passed joint to TripBot! <:ts_bot:1350076410714128384> Hopefully, TripBot gives it back <:ts_smile:1350089891798712403>",
  "passedTo": "<:ts_cannabinoids:1350076845021986816> {{name}} passed joint to {{member}} <:ts_cannabinoids:1350076845021986816>"
}
```
Save to `src/locales/en-US/sheesh.json`.

- [ ] **Step 2: Replace `src/discord/commands/guild/d.sheesh.ts`**

```ts
/* eslint-disable max-len */
/* eslint-disable eqeqeq */
import {
  SlashCommandBuilder,
  GuildMember,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

const TRIPBOT_ID = '977945272359452713';

export const dSheesh: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('sheesh')
    .setNameLocalizations(getCommandLocalizations('sheesh', 'commandName'))
    .setDescription(t('en-US', 'sheesh', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('sheesh', 'commandDescription'))
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('lightjoint')
      .setDescription(t('en-US', 'sheesh', 'lightjointSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('sheesh', 'lightjointSubcommand'))
      .addUserOption(option => option
        .setName('user')
        .setDescription(t('en-US', 'sheesh', 'lightjointUserOption'))
        .setDescriptionLocalizations(getCommandLocalizations('sheesh', 'lightjointUserOption'))
        .setRequired(false)))
    .addSubcommand(subcommand => subcommand
      .setName('passjoint')
      .setDescription(t('en-US', 'sheesh', 'passjointSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('sheesh', 'passjointSubcommand'))
      .addUserOption(option => option
        .setName('user')
        .setDescription(t('en-US', 'sheesh', 'passjointUserOption'))
        .setDescriptionLocalizations(getCommandLocalizations('sheesh', 'passjointUserOption'))
        .setRequired(true))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'sheesh');
    await interaction.deferReply({});

    const command = interaction.options.getSubcommand() as 'lightjoint' | 'passjoint';
    const user = interaction.member as GuildMember;
    const member = interaction.options.getMember('user') as GuildMember;

    if (command === 'lightjoint') {
      if (user == member) {
        await interaction.editReply({ content: t(locale, 'sheesh', 'lightAlone', { name: user.displayName }) });
      } else if (member?.id === TRIPBOT_ID) {
        await interaction.editReply({ content: t(locale, 'sheesh', 'lightWithBot', { name: user.displayName, member: member.displayName }) });
      } else if (member != null) {
        await interaction.editReply({ content: t(locale, 'sheesh', 'lightWithUser', { name: user.displayName, member: member.displayName }) });
      } else {
        await interaction.editReply({ content: t(locale, 'sheesh', 'lightedUp', { name: user.displayName }) });
      }
    } else if (command === 'passjoint') {
      if (user === member) {
        await interaction.editReply({ content: t(locale, 'sheesh', 'keptJoint', { name: user.displayName }) });
      } else if (member.id === TRIPBOT_ID) {
        await interaction.editReply({ content: t(locale, 'sheesh', 'passedToBot', { name: user.displayName }) });
      } else {
        await interaction.editReply({ content: t(locale, 'sheesh', 'passedTo', { name: user.displayName, member: member?.displayName }) });
      }
    }
    return true;
  },
};

export default dSheesh;
```

- [ ] **Step 3: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 4: Commit**

```bash
git add src/locales/en-US/sheesh.json src/discord/commands/guild/d.sheesh.ts
git commit -m "feat(i18n): localize sheesh command"
```

---

### Task 6: dramacounter

**Files:**
- Create: `src/locales/en-US/dramacounter.json`
- Modify: `src/discord/commands/guild/d.dramacounter.ts`

- [ ] **Step 1: Create locale file**

```json
{
  "commandName": "dramacounter",
  "commandDescription": "How long since the last drama incident?!",
  "getSubcommand": "Get the time since last drama.",
  "setSubcommand": "Set the dramacounter >.<",
  "ephemeralOption": "Set to \"True\" to show the response only to you",
  "dramatimeOption": "When did the drama happen? \"3 hours (ago)\"",
  "dramaissueOption": "What was the drama? Be descriptive, or cryptic.",
  "guildOnlyError": "This command can only be used in a server.",
  "noTimeError": "You need to specify a time for the drama to have happened.",
  "noReasonError": "You need to specify what the drama was.",
  "embedTitle": "Drama Counter",
  "noDramaYet": "There has been no drama yet!",
  "lastDrama": "The last drama was {{timestamp}}: {{reason}}",
  "counterReset": "The drama counter has been reset to {{timestamp}} ago, and the issue was: {{reason}}"
}
```
Save to `src/locales/en-US/dramacounter.json`.

- [ ] **Step 2: Replace `src/discord/commands/guild/d.dramacounter.ts`**

```ts
import {
  time,
  SlashCommandBuilder,
  MessageFlags,
} from 'discord.js';
import { DateTime } from 'luxon';
import { stripIndents } from 'common-tags';
import { dramacounter } from '../../../global/commands/g.dramacounter';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';
import { SlashCommand } from '../../@types/commandDef';
import { parseDuration } from '../../../global/utils/parseDuration';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const dDramacounter: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('dramacounter')
    .setNameLocalizations(getCommandLocalizations('dramacounter', 'commandName'))
    .setDescription(t('en-US', 'dramacounter', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('dramacounter', 'commandDescription'))
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('get')
      .setDescription(t('en-US', 'dramacounter', 'getSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('dramacounter', 'getSubcommand'))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(t('en-US', 'dramacounter', 'ephemeralOption'))
        .setDescriptionLocalizations(getCommandLocalizations('dramacounter', 'ephemeralOption'))))
    .addSubcommand(subcommand => subcommand
      .setName('set')
      .setDescription(t('en-US', 'dramacounter', 'setSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('dramacounter', 'setSubcommand'))
      .addStringOption(option => option
        .setName('dramatime')
        .setDescription(t('en-US', 'dramacounter', 'dramatimeOption'))
        .setDescriptionLocalizations(getCommandLocalizations('dramacounter', 'dramatimeOption'))
        .setRequired(true))
      .addStringOption(option => option
        .setName('dramaissue')
        .setDescription(t('en-US', 'dramacounter', 'dramaissueOption'))
        .setDescriptionLocalizations(getCommandLocalizations('dramacounter', 'dramaissueOption'))
        .setRequired(true))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'dramacounter');
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const command = interaction.options.getSubcommand() as 'get' | 'set';

    if (!interaction.guild) {
      await interaction.editReply({ content: t(locale, 'dramacounter', 'guildOnlyError') });
      return false;
    }

    let lastDramaAt = {} as Date;
    let dramaReason = '';
    if (command === 'set') {
      const dramaVal = interaction.options.getString('dramatime');
      if (!dramaVal) {
        await interaction.editReply({ content: t(locale, 'dramacounter', 'noTimeError') });
        return false;
      }
      const dramatimeValue = await parseDuration(dramaVal);
      const dramaIssue = interaction.options.getString('dramaissue');
      if (!dramaIssue) {
        await interaction.editReply({ content: t(locale, 'dramacounter', 'noReasonError') });
        return false;
      }
      dramaReason = dramaIssue;
      lastDramaAt = DateTime.now().minus(dramatimeValue).toJSDate();
    }

    const response = await dramacounter(command, interaction.guild.id, lastDramaAt, dramaReason);

    const embed = embedTemplate()
      .setTitle(t(locale, 'dramacounter', 'embedTitle'));

    if (command === 'get') {
      if (!response.lastDramaAt) {
        embed.setDescription(t(locale, 'dramacounter', 'noDramaYet'));
      } else {
        embed.setDescription(t(locale, 'dramacounter', 'lastDrama', {
          timestamp: time(new Date(response.lastDramaAt), 'R'),
          reason: response.dramaReason,
        }));
      }
    } else {
      if (!response.lastDramaAt) return false;
      embed.setDescription(stripIndents`${t(locale, 'dramacounter', 'counterReset', {
        timestamp: time(new Date(response.lastDramaAt), 'R'),
        reason: response.dramaReason,
      })}`);
    }
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dDramacounter;
```

- [ ] **Step 3: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 4: Commit**

```bash
git add src/locales/en-US/dramacounter.json src/discord/commands/guild/d.dramacounter.ts
git commit -m "feat(i18n): localize dramacounter command"
```

---

### Task 7: opioidConverter

**Files:**
- Create: `src/locales/en-US/opioidConverter.json`
- Modify: `src/discord/commands/guild/d.opioidConverter.ts`

- [ ] **Step 1: Create locale file**

```json
{
  "commandName": "opioid",
  "commandDescription": "Dosage conversion between two opioids. Note: this does not take changing the ROA into account.",
  "convertSubcommand": "Converts one opioid dosage to another's equivalent.",
  "fromOption": "The opioid to convert from.",
  "dosageOption": "The dose **in milligrams (mg)** you want to convert.",
  "toOption": "The opioid to convert to.",
  "resultTitle": "Conversion Result",
  "resultDescription": "{{dosage}}mg {{from}} ~= **{{result}}mg {{to}}**\n\nPlease note that this is not perfect and does not account for ROA changes."
}
```
Save to `src/locales/en-US/opioidConverter.json`.

- [ ] **Step 2: Replace `src/discord/commands/guild/d.opioidConverter.ts`**

```ts
import {
  Colors,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';
import { mainConversion } from '../../../global/utils/opioidConverter';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const dOpioidConverter: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('opioid')
    .setNameLocalizations(getCommandLocalizations('opioidConverter', 'commandName'))
    .setDescription(t('en-US', 'opioidConverter', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('opioidConverter', 'commandDescription'))
    .addSubcommand(subcommand => subcommand
      .setName('convert')
      .setDescription(t('en-US', 'opioidConverter', 'convertSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('opioidConverter', 'convertSubcommand'))
      .addStringOption(option => option
        .setName('from')
        .setDescription(t('en-US', 'opioidConverter', 'fromOption'))
        .setDescriptionLocalizations(getCommandLocalizations('opioidConverter', 'fromOption'))
        .setRequired(true))
      .addNumberOption(option => option
        .setName('dosage')
        .setDescription(t('en-US', 'opioidConverter', 'dosageOption'))
        .setDescriptionLocalizations(getCommandLocalizations('opioidConverter', 'dosageOption'))
        .setRequired(true))
      .addStringOption(option => option
        .setName('to')
        .setDescription(t('en-US', 'opioidConverter', 'toOption'))
        .setDescriptionLocalizations(getCommandLocalizations('opioidConverter', 'toOption'))
        .setRequired(true))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'opioidConverter');

    const dosage = interaction.options.getNumber('dosage', true);
    const from: string = interaction.options.getString('from', true);
    const to = interaction.options.getString('to', true);
    const result = mainConversion(dosage, from, to);

    const embed = embedTemplate()
      .setTitle(t(locale, 'opioidConverter', 'resultTitle'))
      .setColor(Colors.Blurple)
      .setDescription(t(locale, 'opioidConverter', 'resultDescription', {
        dosage, from, result, to,
      }));

    await interaction.reply({ embeds: [embed] });
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dOpioidConverter;
```

Note: The `commandName` in JSON is `"opioid"` (the slash command name) while the namespace file is `opioidConverter.json`. The namespace arg to `getCommandLocalizations` must match the JSON filename: `'opioidConverter'`.

- [ ] **Step 3: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 4: Commit**

```bash
git add src/locales/en-US/opioidConverter.json src/discord/commands/guild/d.opioidConverter.ts
git commit -m "feat(i18n): localize opioidConverter command"
```

---

### Task 8: tripsitstats

**Files:**
- Create: `src/locales/en-US/tripsitstats.json`
- Modify: `src/discord/commands/guild/d.tripsitstats.ts`

- [ ] **Step 1: Create locale file**

```json
{
  "commandName": "tripsit_stats",
  "commandDescription": "Get stats on a feature of TripSit",
  "sessionSubcommand": "Get stats for TripSit sessions",
  "commandSubcommand": "Get stats for commands",
  "ephemeralOption": "Set to \"True\" to show the response only to you",
  "targetCommandOption": "The command to get stats for",
  "daysOption": "Number of days to look back",
  "embedTitleSession": "TripSit Session Stats",
  "embedTitleCommand": "TripSit Command Stats"
}
```
Save to `src/locales/en-US/tripsitstats.json`.

- [ ] **Step 2: Replace `src/discord/commands/guild/d.tripsitstats.ts`**

```ts
/* eslint-disable sonarjs/no-duplicate-string */
import {
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';
import getTripSitStatistics from '../../../global/commands/g.tripsitstats';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const dTripsitStats: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('tripsit_stats')
    .setNameLocalizations(getCommandLocalizations('tripsitstats', 'commandName'))
    .setDescription(t('en-US', 'tripsitstats', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('tripsitstats', 'commandDescription'))
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('session')
      .setDescription(t('en-US', 'tripsitstats', 'sessionSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('tripsitstats', 'sessionSubcommand'))
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription(t('en-US', 'tripsitstats', 'ephemeralOption'))
        .setDescriptionLocalizations(getCommandLocalizations('tripsitstats', 'ephemeralOption'))))
    .addSubcommand(subcommand => subcommand
      .setName('command')
      .setDescription(t('en-US', 'tripsitstats', 'commandSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('tripsitstats', 'commandSubcommand'))
      .addStringOption(option => option
        .setName('target_command')
        .setDescription(t('en-US', 'tripsitstats', 'targetCommandOption'))
        .setDescriptionLocalizations(getCommandLocalizations('tripsitstats', 'targetCommandOption')))
      .addIntegerOption(option => option
        .setName('days')
        .setDescription(t('en-US', 'tripsitstats', 'daysOption'))
        .setDescriptionLocalizations(getCommandLocalizations('tripsitstats', 'daysOption')))
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription(t('en-US', 'tripsitstats', 'ephemeralOption'))
        .setDescriptionLocalizations(getCommandLocalizations('tripsitstats', 'ephemeralOption')))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'tripsitstats');
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });

    const subcommand = interaction.options.getSubcommand();
    let stats = null;
    if (subcommand === 'command') {
      const command = interaction.options.getString('target_command');
      const days = interaction.options.getInteger('days') || 0;
      stats = await getTripSitStatistics(subcommand, command, days);
    } else if (subcommand === 'session') {
      stats = await getTripSitStatistics(subcommand);
    }

    const titleKey = subcommand === 'session' ? 'embedTitleSession' : 'embedTitleCommand';
    const embed = embedTemplate()
      .setTitle(t(locale, 'tripsitstats', titleKey))
      .setDescription(stats);
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dTripsitStats;
```

- [ ] **Step 3: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 4: Commit**

```bash
git add src/locales/en-US/tripsitstats.json src/discord/commands/guild/d.tripsitstats.ts
git commit -m "feat(i18n): localize tripsitstats command"
```

---

### Task 9: say

**Files:**
- Create: `src/locales/en-US/say.json`
- Modify: `src/discord/commands/guild/d.say.ts`

- [ ] **Step 1: Create locale file**

```json
{
  "commandName": "say",
  "commandDescription": "Say something like a real person!",
  "sayOption": "What do you want to say?",
  "channelOption": "Where should I say it? (Default: 'here')",
  "guildOnlyError": "This command can only be used in a server!",
  "channelNotFoundError": "Channel not found!",
  "announcementModOnlyError": "Only moderators can use this command in announcement channels!",
  "invalidChannelError": "This command can only be used in a server!",
  "confirmedReply": "I said '{{say}}' in {{channel}}",
  "botlogMsg": "{{name}} made me say '{{say}}' in {{channel}}"
}
```
Save to `src/locales/en-US/say.json`.

- [ ] **Step 2: Replace `src/discord/commands/guild/d.say.ts`**

```ts
import {
  ChannelType,
  GuildMember,
  MessageFlags,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const dSay: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setNameLocalizations(getCommandLocalizations('say', 'commandName'))
    .setDescription(t('en-US', 'say', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('say', 'commandDescription'))
    .setIntegrationTypes([0])
    .addStringOption(option => option.setName('say')
      .setDescription(t('en-US', 'say', 'sayOption'))
      .setDescriptionLocalizations(getCommandLocalizations('say', 'sayOption'))
      .setRequired(true))
    .addChannelOption(option => option
      .setDescription(t('en-US', 'say', 'channelOption'))
      .setDescriptionLocalizations(getCommandLocalizations('say', 'channelOption'))
      .setName('channel')) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'say');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    if (!interaction.guild) {
      await interaction.editReply({ content: t(locale, 'say', 'guildOnlyError') });
      return false;
    }
    if (!interaction.member) return false;

    const member: GuildMember = interaction.member as GuildMember;
    const say = interaction.options.getString('say', true);
    let channel = interaction.options.getChannel('channel') ?? interaction.channel;

    if (!channel) {
      await interaction.editReply({ content: t(locale, 'say', 'channelNotFoundError') });
      return false;
    }

    if (
      channel.type === ChannelType.GuildAnnouncement
      && !member.roles.cache.has(env.ROLE_MODERATOR)
    ) {
      await interaction.editReply({ content: t(locale, 'say', 'announcementModOnlyError') });
      return false;
    }

    if (
      channel.type !== ChannelType.GuildText
      && channel.type !== ChannelType.GuildVoice
      && channel.type !== ChannelType.PublicThread
      && channel.type !== ChannelType.PrivateThread
      && channel.type !== ChannelType.GuildAnnouncement
      && channel.type !== ChannelType.GuildForum
    ) {
      await interaction.editReply({ content: t(locale, 'say', 'invalidChannelError') });
      return false;
    }

    channel = channel as TextChannel;
    await channel.sendTyping();
    setTimeout(async () => (channel as TextChannel).send({
      content: say,
      allowedMentions: { parse: ['users'] },
    }), 3000);

    await interaction.editReply({ content: t(locale, 'say', 'confirmedReply', { say, channel: (channel as TextChannel).name }) });

    const channelBotlog = await interaction.guild.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
    if (channelBotlog) {
      await channelBotlog.send(t('en-US', 'say', 'botlogMsg', { name: member.displayName, say, channel: (channel as TextChannel).name }));
    }
    return true;
  },
};

export default dSay;
```

Note: `botlogMsg` uses `'en-US'` because botlog messages are internal staff records.

- [ ] **Step 3: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 4: Commit**

```bash
git add src/locales/en-US/say.json src/discord/commands/guild/d.say.ts
git commit -m "feat(i18n): localize say command"
```

---

### Task 10: report

**Files:**
- Create: `src/locales/en-US/report.json`
- Modify: `src/discord/commands/guild/d.report.ts`
- Note: `m.report.ts` and `u.report.ts` have no user-visible strings beyond what `modResponse()` generates — no changes needed there.

- [ ] **Step 1: Create locale file**

```json
{
  "commandName": "report",
  "commandDescription": "Report a user",
  "targetOption": "User to report!",
  "notSetupMsg": "This server has not been set up for moderation.\n\nPlease contact an administrator to set up moderation.\n\nIf you are the admin, please use /cooperative to set up moderation."
}
```
Save to `src/locales/en-US/report.json`.

- [ ] **Step 2: Replace `src/discord/commands/guild/d.report.ts`**

```ts
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  MessageFlags,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { modResponse } from '../../utils/modUtils';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const dReport: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setNameLocalizations(getCommandLocalizations('report', 'commandName'))
    .setDescription(t('en-US', 'report', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('report', 'commandDescription'))
    .setIntegrationTypes([0])
    .addStringOption(option => option
      .setDescription(t('en-US', 'report', 'targetOption'))
      .setDescriptionLocalizations(getCommandLocalizations('report', 'targetOption'))
      .setRequired(true)
      .setName('target')) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return false;
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'report');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const { guild } = interaction;
    const guildData = await db.discord_guilds.upsert({
      where: { id: guild.id },
      create: { id: guild.id },
      update: {},
    });

    if (!guildData.role_moderator || !guildData.channel_mod_log || !guildData.channel_moderators) {
      await interaction.editReply(t(locale, 'report', 'notSetupMsg'));
      return false;
    }

    const actor = interaction.member as GuildMember;
    const actorIsMod = (!!guildData.role_moderator && actor.roles.cache.has(guildData.role_moderator));
    await interaction.editReply(await modResponse(interaction, 'REPORT', actorIsMod));
    return true;
  },
};

export default dReport;
```

- [ ] **Step 3: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 4: Commit**

```bash
git add src/locales/en-US/report.json src/discord/commands/guild/d.report.ts
git commit -m "feat(i18n): localize report command"
```

---

## Wave 2 — Medium Commands (run in parallel, 100–350+ lines each)

The pattern for each Wave 2 task:
1. Create locale JSON with all user-visible strings extracted
2. Add `import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';` to the file
3. Add `const locale = await getLocale(interaction, 'NAMESPACE');` at top of `execute()`
4. Replace every `.setDescription('...')` on the command and options with `t('en-US', ns, key)` + `setDescriptionLocalizations`
5. Replace every `.setName()`-paired `.setNameLocalizations()` on the root command
6. Replace every hardcoded user-visible string in `execute()` body with `t(locale, ns, key, vars?)`

---

### Task 11: leaderboard

**Files:**
- Create: `src/locales/en-US/leaderboard.json`
- Modify: `src/discord/commands/guild/d.leaderboard.ts`

- [ ] **Step 1: Create locale file**

`d.leaderboard.ts` generates a canvas image; user-visible strings are only in the command builder. Extract:

```json
{
  "commandName": "leaderboard",
  "commandDescription": "Show the experience leaderboard",
  "categoryOption": "What category of experience?",
  "ephemeralOption": "Set to \"True\" to show the response only to you",
  "guildOnlyError": "You can only use this command in a guild!",
  "categoryTotal": "Total (Default)",
  "categoryChat": "Chat",
  "categoryVoice": "Voice",
  "categoryHarmReduction": "Harm Reduction",
  "categoryDevelopment": "Development",
  "categoryTeamTripsit": "Team Tripsit"
}
```
Save to `src/locales/en-US/leaderboard.json`.

- [ ] **Step 2: Add i18n to `d.leaderboard.ts`**

Add import after existing imports:
```ts
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';
```

Replace the `SlashCommandBuilder` chain — change `.setName('leaderboard')` through `.setDescription(...)` and all option descriptions, using the pattern from the Reference Pattern section above.

Replace the `categoryChoices` array name strings with `t('en-US', 'leaderboard', ...)` keys matching the JSON above.

In `execute()`, add `const locale = await getLocale(interaction, 'leaderboard');` as first line.

Replace the guild-only error:
```ts
await interaction.editReply('You can only use this command in a guild!');
```
With:
```ts
await interaction.editReply(t(locale, 'leaderboard', 'guildOnlyError'));
```

- [ ] **Step 3: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 4: Commit**

```bash
git add src/locales/en-US/leaderboard.json src/discord/commands/guild/d.leaderboard.ts
git commit -m "feat(i18n): localize leaderboard command"
```

---

### Task 12: busyness

**Files:**
- Create: `src/locales/en-US/busyness.json`
- Modify: `src/discord/commands/guild/d.busyness.ts`

- [ ] **Step 1: Create locale file**

```json
{
  "commandName": "busyness",
  "commandDescription": "Manage the busyness score of #lounge",
  "postSubcommand": "Post the busyness embed",
  "setSubcommand": "Update the busyness configuration",
  "ephemeralOption": "Set to \"True\" to show the response only to you",
  "keyOption": "The configuration key to update",
  "valueOption": "The new value for the configuration key",
  "keyMessageWeight": "Message Weight",
  "keyUserWeight": "User Weight",
  "keySpamminessWeight": "Spamminess Weight",
  "keyDensityWeight": "Density Weight",
  "keyBusynessThreshold": "Busyness Threshold",
  "noPermissionError": "You do not have permission to use this command.",
  "configUpdated": "Updated `{{key}}` to `{{value}}`."
}
```
Save to `src/locales/en-US/busyness.json`.

Note: `embedTitle` (`'Shows the busyness score of #lounge'`) and `header` (`'Busyness score is being calculated...'`) are module-level constants used in recurring timer callbacks, not in `execute()` responses. They may remain hardcoded unless there is a reliable guild context available at callback time. Localize only the strings inside `execute()`.

- [ ] **Step 2: Add i18n to `d.busyness.ts`**

Add import after existing imports:
```ts
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';
```

Replace the `SlashCommandBuilder` chain with localized versions of all `.setDescription()` and `.setName()` calls using the keys above.

In `execute()`, add `const locale = await getLocale(interaction, 'busyness');` as first line.

Replace the two `interaction.reply`/`editReply` content strings:
```ts
// no permission
content: 'You do not have permission to use this command.'
// becomes:
content: t(locale, 'busyness', 'noPermissionError')

// config updated
content: `Updated \`${key}\` to \`${value}\`.`
// becomes:
content: t(locale, 'busyness', 'configUpdated', { key, value })
```

- [ ] **Step 3: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 4: Commit**

```bash
git add src/locales/en-US/busyness.json src/discord/commands/guild/d.busyness.ts
git commit -m "feat(i18n): localize busyness command"
```

---

### Task 13: issue

**Files:**
- Create: `src/locales/en-US/issue.json`
- Modify: `src/discord/commands/guild/d.issue.ts`

- [ ] **Step 1: Create locale file**

```json
{
  "commandName": "issue",
  "commandDescription": "Create issue on github",
  "typeOption": "What type of issue is this?",
  "priorityOption": "How important is this?",
  "effortOption": "How much effort will this take?",
  "typeBug": "Bug/Problem",
  "typeFeature": "Feature Request",
  "typeEnhancement": "Enhancement",
  "typeIdea": "Idea",
  "typeQuestion": "Question",
  "priorityCritical": "Critical",
  "priorityHigh": "High",
  "priorityMedium": "Medium",
  "priorityLow": "Low",
  "effortHigh": "High",
  "effortMedium": "Medium",
  "effortLow": "Low",
  "effortTrivial": "Trivial",
  "modalTitle": "TripBot Issue Creation",
  "issueTitleLabel": "Issue Title",
  "issueTitlePlaceholder": "Summarize the issue here!",
  "issueBodyLabel": "Issue Body",
  "issueBodyPlaceholder": "Please describe the issue in detail! Include steps to reproduce, any specific circumstances, etc.",
  "issueCreatedTitle": "Issue created!",
  "issueCreatedDescription": "Issue #{{number}} created on TripSit/TripBot!\nClick here to view: {{url}}"
}
```
Save to `src/locales/en-US/issue.json`.

- [ ] **Step 2: Add i18n to `d.issue.ts`**

Add import after existing imports:
```ts
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';
```

Replace the `SlashCommandBuilder` chain with localized versions.

In `execute()`, add `const locale = await getLocale(interaction, 'issue');` as first line.

Replace the `ModalBuilder` strings:
```ts
.setTitle('TripBot Issue Creation')
// → .setTitle(t(locale, 'issue', 'modalTitle'))

.setLabel('Issue Title')
// → .setLabel(t(locale, 'issue', 'issueTitleLabel'))

.setPlaceholder('Summarize the issue here!')
// → .setPlaceholder(t(locale, 'issue', 'issueTitlePlaceholder'))

.setLabel('Issue Body')
// → .setLabel(t(locale, 'issue', 'issueBodyLabel'))

.setPlaceholder('Please describe the issue in detail! ...')
// → .setPlaceholder(t(locale, 'issue', 'issueBodyPlaceholder'))
```

Replace the embed title/description:
```ts
.setTitle('Issue created!')
// → .setTitle(t(locale, 'issue', 'issueCreatedTitle'))

.setDescription(stripIndents`Issue #${results.data.number} created on TripSit/TripBot!\n                  Click here to view: ${results.data.html_url}`)
// → .setDescription(t(locale, 'issue', 'issueCreatedDescription', { number: results.data.number, url: results.data.html_url }))
```

- [ ] **Step 3: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 4: Commit**

```bash
git add src/locales/en-US/issue.json src/discord/commands/guild/d.issue.ts
git commit -m "feat(i18n): localize issue command"
```

---

### Task 14: birthday

**Files:**
- Create: `src/locales/en-US/birthday.json`
- Modify: `src/discord/commands/guild/d.birthday.ts`

- [ ] **Step 1: Create locale file**

```json
{
  "commandName": "birthday",
  "commandDescription": "Birthday info!",
  "getSubcommand": "Get someone's birthday!",
  "setSubcommand": "Set your birthday!",
  "userOption": "User to lookup",
  "ephemeralOption": "Set to \"True\" to show the response only to you",
  "monthOption": "Month value",
  "dayOption": "Day value",
  "immortal": "{{name}} is immortal! (Or has not set their birthday...)",
  "birthdayIs": "{{name}}'s birthday is {{date}}",
  "happyBirthday": "Happy birthday!",
  "daysLeft": "Only {{days}} days left!",
  "noMonthError": "You need to specify a month!",
  "noDayError": "You need to specify a valid day!",
  "tooManyDaysError": "{{month}} only has {{max}} days!",
  "birthdaySet": "Set your birthday to {{date}}"
}
```
Save to `src/locales/en-US/birthday.json`.

- [ ] **Step 2: Add i18n to `d.birthday.ts`**

Add import after existing imports:
```ts
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';
```

Add `locale` parameter to `birthdayGet` and `birthdaySet` helper functions, or resolve locale in `execute()` and pass it through.

Replace all hardcoded reply strings in `birthdayGet`:
```ts
embed.setTitle(`${member.displayName} is immortal! ...`)
// → embed.setTitle(t(locale, 'birthday', 'immortal', { name: member.displayName }))

embed.setTitle(`${member.displayName}'s birthday is ${response.toFormat('LLLL d')}`)
// → embed.setTitle(t(locale, 'birthday', 'birthdayIs', { name: member.displayName, date: response.toFormat('LLLL d') }))

embed.setDescription('Happy birthday!')
// → embed.setDescription(t(locale, 'birthday', 'happyBirthday'))

embed.setDescription(`Only ${daysUntil.toFixed(0)} days left!`)
// → embed.setDescription(t(locale, 'birthday', 'daysLeft', { days: daysUntil.toFixed(0) }))
```

Replace all hardcoded reply strings in `birthdaySet`:
```ts
content: 'You need to specify a month!'
// → content: t(locale, 'birthday', 'noMonthError')

content: 'You need to specify a valid day!'
// → content: t(locale, 'birthday', 'noDayError')

content: `${monthInput} only has 30 days!`  // and 31 and 28 variants
// → content: t(locale, 'birthday', 'tooManyDaysError', { month: monthInput, max: 30 })

embed.setTitle(`Set your birthday to ${(response as DateTime).toFormat('LLLL d')}`)
// → embed.setTitle(t(locale, 'birthday', 'birthdaySet', { date: (response as DateTime).toFormat('LLLL d') }))
```

Replace command builder `.setDescription()` and `.setName()` calls with localized versions.

- [ ] **Step 3: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 4: Commit**

```bash
git add src/locales/en-US/birthday.json src/discord/commands/guild/d.birthday.ts
git commit -m "feat(i18n): localize birthday command"
```

---

### Task 15: profile

**Files:**
- Create: `src/locales/en-US/profile.json`
- Modify: `src/discord/commands/guild/d.profile.ts`

`d.profile.ts` generates a canvas image. The only user-visible strings are in the command builder and one error reply.

- [ ] **Step 1: Create locale file**

```json
{
  "commandName": "profile",
  "commandDescription": "Get someone's profile!",
  "targetOption": "User to lookup",
  "ephemeralOption": "Set to \"True\" to show the response only to you",
  "guildOnlyError": "You can only use this command in a guild!"
}
```
Save to `src/locales/en-US/profile.json`.

- [ ] **Step 2: Add i18n to `d.profile.ts`**

Add import after existing imports:
```ts
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';
```

In `execute()`, add `const locale = await getLocale(interaction, 'profile');` as first line.

Replace command builder calls with localized versions using the pattern from the Reference Pattern section.

Replace:
```ts
await interaction.editReply({ content: 'You can only use this command in a guild!' });
```
With:
```ts
await interaction.editReply({ content: t(locale, 'profile', 'guildOnlyError') });
```

- [ ] **Step 3: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 4: Commit**

```bash
git add src/locales/en-US/profile.json src/discord/commands/guild/d.profile.ts
git commit -m "feat(i18n): localize profile command"
```

---

### Task 16: h2flow

**Files:**
- Create: `src/locales/en-US/h2flow.json`
- Modify: `src/discord/commands/guild/d.h2flow.ts`

- [ ] **Step 1: Create locale file**

```json
{
  "commandName": "h2flow",
  "commandDescription": "Welcome to the H2Flow Club!",
  "ephemeralOption": "Set to \"True\" to show the response only to you",
  "authorName": "What is the H2Flow club?",
  "description": "These are not useless internet points✨\nThis is an emoji-based social🌐media experience!\nThink about H2Flow as app📱for your health 🩺\nEvery so often you'll see a reminder to be healthy🧘‍♂️\nMove around🕴, drink some water💧, or spread love💖\nPerform the action, react to the message, get your points✨!\nYou can only get one point✨ per message, so pay attention!\nIf you get enough ✨ then you're on your way to your first\n**🌊AquaBadge🔰** or **💖LoveCup🏆** or **🏃Move Medal🏅**!\nGet enough 🌊🔰, 💖🏆 or 🏃🏅 and you'll level up!\nLevel up enough and we'll welcome you to the fabled\n☆ﾟ.*･｡ﾟ☆ﾟ.*･｡ﾟ🥇*H2Flow Club*🥇☆ﾟ.*･｡ﾟ☆ﾟ.*･｡ﾟ",
  "footerStatus": "H2Flow Club Status: {{club}}",
  "aquaBadgesField": "**{{count}}** 🌊Aqua Badges🔰",
  "aquaBadgesValue": "{{points}} sparkle points",
  "loveCupsField": "**{{count}}** 💖Love Cups🏆",
  "loveCupsValue": "{{points}} empathy points",
  "moveMedalsField": "**{{count}}** 🏃Move Medals🏅",
  "moveMedalsValue": "{{points}} active points",
  "clubNonMember": "Non-member =(",
  "clubDiamond": "Diamond Club",
  "clubRuby": "Ruby Club",
  "clubSapphire": "Sapphire Club",
  "clubEmerald": "Emerald Club",
  "clubPlatinum": "Platinum Club",
  "clubGold": "Gold Club",
  "clubSilver": "Silver Club",
  "clubBronze": "Bronze Club",
  "clubCopper": "Copper Club",
  "clubTin": "Tin Club",
  "clubAluminum": "Aluminum Club",
  "clubSteel": "Steel Club",
  "clubIron": "Iron Club"
}
```
Save to `src/locales/en-US/h2flow.json`.

- [ ] **Step 2: Add i18n to `d.h2flow.ts`**

Add import after existing imports:
```ts
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';
```

In `execute()`, add `const locale = await getLocale(interaction, 'h2flow');` as first line.

Replace the club tier calculation block — replace each hardcoded string literal (e.g. `'Non-member =('`, `'Diamond Club'`) with `t(locale, 'h2flow', 'clubNonMember')` etc.

Replace the embed construction:
```ts
.setAuthor({ name: 'What is the H2Flow club?', ... })
// → .setAuthor({ name: t(locale, 'h2flow', 'authorName'), ... })

.setDescription(stripIndents`These are not useless internet points✨\n...`)
// → .setDescription(t(locale, 'h2flow', 'description'))

.setFooter({ text: `H2Flow Club Status: ${platinumClub}` })
// → .setFooter({ text: t(locale, 'h2flow', 'footerStatus', { club: platinumClub }) })
```

Replace field names and values:
```ts
name: `**${Math.floor(userData.sparkle_points / 10)}** 🌊Aqua Badges🔰`
// → name: t(locale, 'h2flow', 'aquaBadgesField', { count: Math.floor(userData.sparkle_points / 10) })

value: `${userData.sparkle_points} sparkle points`
// → value: t(locale, 'h2flow', 'aquaBadgesValue', { points: userData.sparkle_points })
```
(Apply same pattern for love cups and move medals fields.)

Replace command builder `.setDescription()` and `.setName()` calls with localized versions.

- [ ] **Step 3: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 4: Commit**

```bash
git add src/locales/en-US/h2flow.json src/discord/commands/guild/d.h2flow.ts
git commit -m "feat(i18n): localize h2flow command"
```

---

### Task 17: reminder

**Files:**
- Create: `src/locales/en-US/reminder.json`
- Modify: `src/discord/commands/guild/d.reminder.ts`

- [ ] **Step 1: Create locale file**

```json
{
  "commandName": "reminder",
  "commandDescription": "Sends a reminder on what the channel is for!",
  "guildOnlyError": "This command can only be used in a server!",
  "channelOnlyError": "This command can only be used in a channel!",
  "noReminderError": "This command can only be used in a channel with a reminder!",
  "reminderSent": "Reminder sent!",
  "botlogMsg": "{{name}} sent a reminder to {{channel}}"
}
```
Save to `src/locales/en-US/reminder.json`.

Note: The reminder title/body strings in `reminderDict` are channel-specific config strings, not general user-facing UI strings — they may stay hardcoded.

- [ ] **Step 2: Add i18n to `d.reminder.ts`**

Add import after existing imports:
```ts
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';
```

In `execute()`, add `const locale = await getLocale(interaction, 'reminder');` as first line.

Replace command builder `.setDescription()` and `.setName()` calls with localized versions.

Replace all `editReply({ content: '...' })` strings:
```ts
content: 'This command can only be used in a server!'
// → content: t(locale, 'reminder', 'guildOnlyError')

content: 'This command can only be used in a channel!'
// → content: t(locale, 'reminder', 'channelOnlyError')

content: 'This command can only be used in a channel with a reminder!'
// → content: t(locale, 'reminder', 'noReminderError')

content: 'Reminder sent!'
// → content: t(locale, 'reminder', 'reminderSent')
```

Replace the botlog send:
```ts
await botlog.send(`${member.displayName} sent a reminder to ${channel.name}`)
// → await botlog.send(t('en-US', 'reminder', 'botlogMsg', { name: member.displayName, channel: channel.name }))
```

- [ ] **Step 3: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 4: Commit**

```bash
git add src/locales/en-US/reminder.json src/discord/commands/guild/d.reminder.ts
git commit -m "feat(i18n): localize reminder command"
```

---

### Task 18: rss

**Files:**
- Create: `src/locales/en-US/rss.json`
- Modify: `src/discord/commands/guild/d.rss.ts`

- [ ] **Step 1: Create locale file**

```json
{
  "commandName": "rss",
  "commandDescription": "Add or remove a subscription to an RSS feed!",
  "addSubcommand": "Add an RSS subscription to this channel",
  "removeSubcommand": "Remove an RSS feed from this channel",
  "listSubcommand": "List all RSS feeds",
  "urlOption": "URL of the RSS feed, ends with .rss",
  "addChannelOption": "Where to post this feed?",
  "removeChannelOption": "Remove RSS feed from which channel?",
  "guildOnlyError": "This command can only be used in a guild!",
  "notRssUrlError": "You must use a URL ending with .rss!",
  "invalidRssError": "This is not a valid RSS URL, please check it and try again!",
  "notTextChannelError": "You must specify a text channel!",
  "addedToChannel": "RSS feed added to {{channel}}!",
  "watchingUrl": "I've started watching {{url}}!",
  "removedFromChannel": "RSS feed removed from {{channel}}!",
  "hasFeeds": "{{guild}} has the following RSS feeds:!",
  "noFeeds": "{{guild}} has no RSS feeds!"
}
```
Save to `src/locales/en-US/rss.json`.

- [ ] **Step 2: Add i18n to `d.rss.ts`**

Add import after existing imports:
```ts
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';
```

In `execute()`, add `const locale = await getLocale(interaction, 'rss');` as first line.

Replace command builder `.setDescription()` and `.setName()` calls with localized versions.

Replace all hardcoded `editReply` content strings and `embed.setTitle()`/`setDescription()` calls:
```ts
content: 'This command can only be used in a guild!'
// → content: t(locale, 'rss', 'guildOnlyError')

content: 'You must use a URL ending with .rss!'
// → content: t(locale, 'rss', 'notRssUrlError')

content: 'This is not a valid RSS URL, please check it and try again!'
// → content: t(locale, 'rss', 'invalidRssError')

content: 'You must specify a text channel!'  // (appears twice)
// → content: t(locale, 'rss', 'notTextChannelError')

embed.setTitle(`RSS feed ${verb} ${preposition} ${channel.name}!`)
// For 'add': embed.setTitle(t(locale, 'rss', 'addedToChannel', { channel: channel.name }))
// For 'remove': embed.setTitle(t(locale, 'rss', 'removedFromChannel', { channel: channel.name }))

embed.setDescription(`I've started watching ${url}!`)
// → embed.setDescription(t(locale, 'rss', 'watchingUrl', { url }))

embed.setTitle(`${interaction.guild.name} has the following RSS feeds:!`)
// → embed.setTitle(t(locale, 'rss', 'hasFeeds', { guild: interaction.guild.name }))

embed.setTitle(`${interaction.guild.name} has no RSS feeds!`)
// → embed.setTitle(t(locale, 'rss', 'noFeeds', { guild: interaction.guild.name }))
```

Note: Remove the `const verb` and `const preposition` dynamic string computation — they are no longer needed.

- [ ] **Step 3: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 4: Commit**

```bash
git add src/locales/en-US/rss.json src/discord/commands/guild/d.rss.ts
git commit -m "feat(i18n): localize rss command"
```

---

### Task 19: levels

**Files:**
- Create: `src/locales/en-US/levels.json`
- Modify: `src/discord/commands/guild/d.levels.ts`

`d.levels.ts` generates a canvas image. The only user-visible strings are in the command builder and one error reply.

- [ ] **Step 1: Create locale file**

```json
{
  "commandName": "levels",
  "commandDescription": "Get someone's current experience levels!",
  "targetOption": "User to lookup",
  "ephemeralOption": "Set to \"True\" to show the response only to you",
  "guildOnlyError": "You can only use this command in a guild!"
}
```
Save to `src/locales/en-US/levels.json`.

- [ ] **Step 2: Add i18n to `d.levels.ts`**

Add import after existing imports:
```ts
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';
```

In `execute()`, add `const locale = await getLocale(interaction, 'levels');` as first line.

Replace command builder `.setDescription()` and `.setName()` calls with localized versions.

Replace:
```ts
await interaction.editReply('You can only use this command in a guild!');
```
With:
```ts
await interaction.editReply(t(locale, 'levels', 'guildOnlyError'));
```

- [ ] **Step 3: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 4: Commit**

```bash
git add src/locales/en-US/levels.json src/discord/commands/guild/d.levels.ts
git commit -m "feat(i18n): localize levels command"
```

---

### Task 20: bountyleaderboard

**Files:**
- Create: `src/locales/en-US/bountyleaderboard.json`
- Modify: `src/discord/commands/guild/d.bountyleaderboard.ts`

- [ ] **Step 1: Create locale file**

```json
{
  "commandName": "bounty_leaderboard",
  "commandDescription": "Display bounty leaderboards for TripBot",
  "typeOption": "Type of leaderboard to display",
  "typeBountiesChoice": "🏆 Most Bounties Claimed",
  "typeXpChoice": "⭐ Most XP Earned",
  "topByXp": "⭐ **Top Bounty Hunters by XP Earned**\n",
  "topByBounties": "🏆 **Top Bounty Hunters by Bounties Claimed**\n",
  "noDataName": "📭 No Data Available",
  "noDataValue": "No bounties have been claimed yet!",
  "serverStatsName": "📊 Server Statistics",
  "serverStatsValue": "**{{users}}** active bounty hunters\n**{{bounties}}** total bounties claimed\n**{{xp}}** total XP earned",
  "onlyUserCanChange": "Only the command user can change the leaderboard type.",
  "errorGenerating": "An error occurred while generating the leaderboard.",
  "selectPlaceholder": "Choose leaderboard type",
  "selectBountiesLabel": "Most Bounties Claimed",
  "selectBountiesDescription": "Sort by number of bounties claimed",
  "selectXpLabel": "Most XP Earned",
  "selectXpDescription": "Sort by total XP earned from bounties"
}
```
Save to `src/locales/en-US/bountyleaderboard.json`.

- [ ] **Step 2: Add i18n to `d.bountyleaderboard.ts`**

Add import after existing imports:
```ts
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';
```

`generateLeaderboardEmbed` and `createSelectMenu` are module-level helpers that do not have access to guild locale. Pass `locale` as a parameter to both.

In `execute()`, add `const locale = await getLocale(interaction, 'bountyleaderboard');` as first line, then pass `locale` through to `generateLeaderboardEmbed(leaderboardType, interaction, locale)` and `createSelectMenu(leaderboardType, locale)`.

Update `generateLeaderboardEmbed` signature:
```ts
async function generateLeaderboardEmbed(
  type: string,
  interaction: CommandInteraction,
  locale: string,
): Promise<EmbedBuilder>
```

Replace all hardcoded strings in `generateLeaderboardEmbed`:
```ts
embed.setDescription('⭐ **Top Bounty Hunters by XP Earned**\n')
// → embed.setDescription(t(locale, 'bountyleaderboard', 'topByXp'))

embed.setDescription('🏆 **Top Bounty Hunters by Bounties Claimed**\n')
// → embed.setDescription(t(locale, 'bountyleaderboard', 'topByBounties'))

name: '📭 No Data Available'
// → name: t(locale, 'bountyleaderboard', 'noDataName')

value: 'No bounties have been claimed yet!'
// → value: t(locale, 'bountyleaderboard', 'noDataValue')

name: '📊 Server Statistics'
// → name: t(locale, 'bountyleaderboard', 'serverStatsName')

value: `**${totalUsers}** active bounty hunters\n**${totalBounties.toLocaleString()}** total bounties claimed\n**${totalXP.toLocaleString()}** total XP earned`
// → value: t(locale, 'bountyleaderboard', 'serverStatsValue', { users: totalUsers, bounties: totalBounties.toLocaleString(), xp: totalXP.toLocaleString() })
```

Update `createSelectMenu` signature:
```ts
function createSelectMenu(currentType: string, locale: string): StringSelectMenuBuilder
```

Replace hardcoded strings in `createSelectMenu`:
```ts
.setPlaceholder('Choose leaderboard type')
// → .setPlaceholder(t(locale, 'bountyleaderboard', 'selectPlaceholder'))

label: 'Most Bounties Claimed'
// → label: t(locale, 'bountyleaderboard', 'selectBountiesLabel')

description: 'Sort by number of bounties claimed'
// → description: t(locale, 'bountyleaderboard', 'selectBountiesDescription')

label: 'Most XP Earned'
// → label: t(locale, 'bountyleaderboard', 'selectXpLabel')

description: 'Sort by total XP earned from bounties'
// → description: t(locale, 'bountyleaderboard', 'selectXpDescription')
```

Replace in `execute()` and the collector callback:
```ts
content: 'Only the command user can change the leaderboard type.'
// → content: t(locale, 'bountyleaderboard', 'onlyUserCanChange')

content: 'An error occurred while generating the leaderboard.'
// → content: t(locale, 'bountyleaderboard', 'errorGenerating')
```

Replace command builder `.setDescription()` and `.setName()` calls with localized versions.

- [ ] **Step 3: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 4: Commit**

```bash
git add src/locales/en-US/bountyleaderboard.json src/discord/commands/guild/d.bountyleaderboard.ts
git commit -m "feat(i18n): localize bountyleaderboard command"
```

---

### Task 21: idose (global command — complete remaining option localizations)

**Files:**
- Modify: `src/locales/en-US/idose.json` (keys already present — add `getCommandLocalizations` wiring only)
- Modify: `src/discord/commands/global/d.idose 2.ts`

- [ ] **Step 1: Verify idose.json is complete**

`src/locales/en-US/idose.json` already has all required keys. Confirm they exist:
```bash
cat src/locales/en-US/idose.json | python3 -m json.tool
```
Expected keys: `commandName`, `commandDescription`, `setSubcommand`, `getSubcommand`, `deleteSubcommand`, `volumeOption`, `unitsOption`, all unit/ROA choice keys, `offsetOption`, `recordOption`, `dosageHistory`, `noDoseRecords`, `noDoseRecordsDesc`, `doseEntryTitle`, `doseEntryField`.

- [ ] **Step 2: Add `getCommandLocalizations` to `"src/discord/commands/global/d.idose 2.ts"`**

The file already uses `t(locale, 'idose', ...)` for response strings and has `getCommandLocalizations` on the root command name/description. What is missing: `setDescriptionLocalizations` on each subcommand and option.

For each subcommand `.setDescription(...)`:
```ts
.setDescription('Record when you dosed something')
// → .setDescription(t('en-US', 'idose', 'setSubcommand'))
//   .setDescriptionLocalizations(getCommandLocalizations('idose', 'setSubcommand'))
```

For each option `.setDescription(...)`:
```ts
.setDescription('How much?')
// → .setDescription(t('en-US', 'idose', 'volumeOption'))
//   .setDescriptionLocalizations(getCommandLocalizations('idose', 'volumeOption'))
```

Apply the same replacement for all subcommands (`setSubcommand`, `getSubcommand`, `deleteSubcommand`) and all options (`volumeOption`, `unitsOption`, `substanceOption`, `roaOption`, `offsetOption`, `recordOption`).

For addChoices on units and ROA options — the choice `name` values should also be localized:
```ts
{ name: 'mg (milligrams)', value: 'mg' }
// → { name: t('en-US', 'idose', 'unitMg'), value: 'mg' }
```
Apply for all unit and ROA choices.

- [ ] **Step 3: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 4: Commit**

```bash
git add "src/discord/commands/global/d.idose 2.ts"
git commit -m "feat(i18n): complete idose command localizations"
```

---

## Wave 3 — Large Commands (sequential after Waves 1+2, 500–750 lines each)

Run these after Waves 1 and 2 are merged. These files have many subcommands and option-dense builders.

---

### Task 22: search

**Files:**
- Create: `src/locales/en-US/search.json`
- Modify: `src/discord/commands/guild/d.search.ts`

- [ ] **Step 1: Read the file and extract all strings**

```bash
cat src/discord/commands/guild/d.search.ts
```

- [ ] **Step 2: Create locale file**

All embed titles and descriptions in `d.search.ts` come from the global function return values (they're in the `result` object passed back from `g.search.ts`) — not hardcoded in the Discord layer. Only the command builder strings are user-visible in this file.

```json
{
  "commandName": "search",
  "commandDescription": "Search various sources",
  "defineSubcommand": "Define from a dictionary",
  "urbandefineSubcommand": "Define on Urban Dictionary",
  "gameSubcommand": "Find a game on Steam",
  "bookSubcommand": "Search for a book and where to buy it",
  "wordOption": "Word to define",
  "defineOption": "Word to define",
  "gameOption": "Game to search for",
  "bookOption": "Book title or author",
  "ephemeralOption": "Set to \"True\" to show the response only to you"
}
```

Read the full file to confirm no additional hardcoded user-visible reply strings exist in `execute()`. Add any you find to the JSON.

Save to `src/locales/en-US/search.json`.

- [ ] **Step 3: Add i18n to `d.search.ts`**

Add import after existing imports:
```ts
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';
```

In `execute()`, add `const locale = await getLocale(interaction, 'search');` as first line.

Replace all command builder `.setDescription()` and `.setName()` calls with localized versions. The file has multiple subcommands — apply the pattern to each.

Replace any hardcoded `editReply` content strings found in Step 1.

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

- [ ] **Step 1: Read the file and extract all strings**

```bash
cat src/discord/commands/guild/d.quote.ts
```

Identify all: command `.setDescription()`, subcommand `.setDescription()`, option `.setDescription()`, embed titles, embed descriptions, embed field names/values, `editReply` content strings.

- [ ] **Step 2: Create locale file**

Create `src/locales/en-US/quote.json` with the following minimum keys (extend with any strings found in Step 1):

```json
{
  "commandName": "quote",
  "commandDescription": "Quote commands",
  "ephemeralOption": "Set to \"True\" to show the response only to you"
}
```

Fill in all subcommand, option, and response keys from what you find in Step 1.

- [ ] **Step 3: Add i18n to `d.quote.ts`**

Add import, `getLocale()` call, replace all hardcoded strings with `t()`, add `getCommandLocalizations()` everywhere.

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

- [ ] **Step 1: Read the file and extract all strings**

```bash
cat src/discord/commands/guild/d.counting.ts
```

- [ ] **Step 2: Create locale file**

Create `src/locales/en-US/counting.json` with all extracted strings. Minimum required:

```json
{
  "commandName": "counting",
  "commandDescription": "Counting game commands",
  "ephemeralOption": "Set to \"True\" to show the response only to you"
}
```

Fill in all subcommand, option, and response keys from Step 1.

- [ ] **Step 3: Add i18n to `d.counting.ts`**

Add import, `getLocale()` call, replace all hardcoded strings, add `getCommandLocalizations()`.

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

### Task 25: voice (tent)

**Files:**
- Create: `src/locales/en-US/voice.json`
- Modify: `src/discord/commands/guild/d.voice.ts`

- [ ] **Step 1: Read the file and extract all strings**

```bash
cat src/discord/commands/guild/d.voice.ts
```

The file contains many embed title/description pairs for tent operations. Key strings include:

```json
{
  "commandName": "tent",
  "commandDescription": "Control your Campfire Tent",
  "nameSubcommand": "Rename your Tent",
  "limitSubcommand": "Set a limit on the number of users in your Tent",
  "hostSubcommand": "Transfer host to another user",
  "lockSubcommand": "Lock/Unlock your Tent",
  "levelSubcommand": "Set a level requirement to see and join your Tent",
  "nameOption": "The new name for your Tent",
  "limitOption": "The new user limit for your Tent (0 = No limit)",
  "hostTargetOption": "The user to transfer host to",
  "tentUpdatedTitle": "Tent updated",
  "tentRenamedTitle": "Tent renamed",
  "userNotConnectedTitle": "User not connected",
  "userNotConnectedDesc": "The new host must be in the tent to be set as the host.",
  "userIsModTitle": "User is a moderator",
  "userIsModDesc": "Moderators are already able to join all tents.",
  "cannotBanModDesc": "You cannot ban a moderator! They can join all tents.",
  "cooldownTitle": "Cooldown",
  "pingSentTitle": "Ping sent",
  "userUnbannedTitle": "User unbanned and added",
  "badErrorTitle": "BAD ERROR"
}
```

Read the full file and add all remaining embed titles, descriptions, and `editReply` content strings to the JSON.

- [ ] **Step 2: Create locale file**

Save `src/locales/en-US/voice.json` with all keys from Step 1.

- [ ] **Step 3: Add i18n to `d.voice.ts`**

Add import, `getLocale()` call in `execute()`, replace all hardcoded strings with `t()`, add `getCommandLocalizations()`.

Note: Several helper functions (`renameTent`, `limitTent`, etc.) are called from `execute()`. Pass `locale` as a parameter to these helpers.

- [ ] **Step 4: Verify and lint**

```bash
npm run i18n:sync -- --dry
npm run tripbot:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/locales/en-US/voice.json src/discord/commands/guild/d.voice.ts
git commit -m "feat(i18n): localize voice/tent command"
```

---

### Task 26: cooperative

**Files:**
- Create: `src/locales/en-US/cooperative.json`
- Modify: `src/discord/commands/guild/d.cooperative.ts`

- [ ] **Step 1: Read the file and extract all strings**

```bash
cat src/discord/commands/guild/d.cooperative.ts
```

Key strings to extract include subcommand descriptions, option descriptions, the modal title/labels, and all `editReply` content strings.

```json
{
  "commandName": "cooperative",
  "commandDescription": "TripSit Discord Cooperative Commands",
  "infoSubcommand": "Help for the TripSit Discord Cooperative Commands",
  "applySubcommand": "Apply to join the TripSit Discord Cooperative",
  "setupSubcommand": "Setup the TripSit Discord Cooperative on your guild",
  "leaveSubcommand": "Leave the TripSit Discord Cooperative",
  "addSubcommand": "Add a guild to the TripSit Discord Cooperative",
  "removeSubcommand": "Remove a guild from the TripSit Discord Cooperative",
  "modChannelOption": "The channel to use for moderation",
  "modlogChannelOption": "The channel to use for moderation logs",
  "modRoleOption": "The role to use for moderators",
  "helpdeskChannelOption": "The channel to use for moderation tickets",
  "trustChannelOption": "The channel to use for trust logging",
  "trustScoreLimitOption": "Below this number sends alerts",
  "guildIdAddOption": "The ID of the guild to add",
  "guildIdRemoveOption": "The ID of the guild to remove",
  "applyModalTitle": "Apply to Join the TripSit Discord Cooperative"
}
```

Read the full file and add all remaining response strings to the JSON.

- [ ] **Step 2: Create locale file**

Save `src/locales/en-US/cooperative.json` with all keys from Step 1.

- [ ] **Step 3: Add i18n to `d.cooperative.ts`**

Add import, `getLocale()` call in `execute()`, replace all hardcoded strings with `t()`, add `getCommandLocalizations()`. Pass `locale` to any helper functions that produce user-visible output.

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

## Final: Full verification and deploy

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

- [ ] **Deploy slash commands to Discord** (required — option descriptions are registered at deploy time)

```bash
npm run tripbot:deployCommands
```

- [ ] **Commit if anything was auto-fixed**

```bash
git add -A
git commit -m "chore(i18n): post-localization sync and lint fixes"
```

---

## Out of scope

- `d.rpg.ts` (4,157 lines) — deferred due to size
- Admin/mod commands: `d.admin.ts`, `d.mod.ts`, `d.botmod.ts`, `d.bottest.ts`, `d.botstats.ts`, `d.clearchat.ts`, `d.purge.ts`
- Finnish (`fi`) locale translation — adding translated values to `src/locales/fi/` for new keys is a separate task
