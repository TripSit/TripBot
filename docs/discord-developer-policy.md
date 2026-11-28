# Discord Developer Policy: TripBot compliance guide

Official source (always authoritative, and it changes): the Discord Developer Policy (version effective July 8, 2024,
published in the Discord developer support center at <https://support-dev.discord.com>) and the
[Developer Terms of Service](https://dis.gd/discord-developer-terms-of-service). This file is a working summary for
contributors and AI agents. Re-read the official text when making a change that touches Discord data, DMs, third-party
services, or user profiling, and update this file if the policy changes.

## The rules, and what they mean for TripBot

### Protect Discord users
1. **Do not modify a user's account without explicit permission.** Role changes must follow a clear user action (a
   button or command) or a moderator decision, never a hidden automatic one.
2. **Do not start processes on a user's or server's behalf without permission.** Anything a command enables must be
   clearly labeled and describe what it does.
3. **Do not bypass Discord privacy, safety or security features.** Respect users who block the bot or remove it from a
   space; leave guilds the bot is banned from.
4. **Never collect passwords, tokens or login credentials.** No command, modal or DM may ask for them.
5. **Do not DM users without permission.** DMs must be tied to something the user did (a report, an application, a
   reminder they set) and say why they were sent. No unsolicited or promotional DMs.
6. **No advertising or marketing.** Messages must relate to what the bot does.
7. **Do not contact users outside Discord** using API Data (including email addresses obtained through the bot).

### Respect platform rules
8. No dangerous or illegal activity (physical safety risks, scams, illegal gambling). Harm-reduction content must be
   conservative, factual and from the project's established sources.
9. Do not direct the app at people under 13, and keep the app's age rating accurate. Unless the app is age-restricted it
   must be appropriate for under-18 users.
10. Do not enable violations of the Discord Community Guidelines (harassment, illegal media, adult content without
    labels).
11. No violent or violent-extremist content, including in Developer Portal fields.
12. Do not impersonate other apps, Discord staff or Discord services.
13. No fake engagement: no membership inflation and no automated messages whose purpose is to keep a server looking
    active.
14. Do not evade a Discord enforcement action by recreating a removed app.
15. **Provide a way to report issues** (`/report`, the report context menus, `/feedback`), review reports, and be
    reachable for support.

### Handle data with care
16. **Use API Data only to provide the app's stated functionality.** Aggregated or de-identified data may be used to
    improve the app.
17. **No profiling** of users, their identities or their relationships with other users, and no eligibility decisions
    (benefits, employment, housing, insurance). Do not score or rank users using their other-server memberships or
    bans. Do not take in data about under-13s, protected health information, financial information or other sensitive
    data, or send it to Discord, except as Discord's terms allow.
18. **Do not disclose API Data to data brokers, ad networks or monetization services.**
19. **Do not sell, license or commercialize API Data** or Discord's services.
20. **Do not re-identify or de-anonymize** API Data.
21. **Do not mine or scrape** Discord data.
22. **Do not use message content to train machine-learning or AI models** (including LLMs) without Discord's express
    permission.
23. Notify Discord and affected users of any unauthorized access to API Data (Developer Terms, section 5).

### Monetization and limits
24. Paid features must use Discord's Premium Apps where Discord supports them, at prices no higher than elsewhere.
    In-game tokens that cannot be bought for money are not paid features.
25. Do not circumvent API rate limits. Obtain Discord's written consent to exceed them.

## Pre-change checklist

Run through this whenever a change touches any of the following. If an answer is "no" or "unsure", stop and ask.

- **Message content, member lists, presence, invites, bans:** is it needed for a feature users can see? Is it stored,
  logged, or sent anywhere? Is it covered by `/privacy get` and `/privacy delete` and the retention purge?
- **A third-party service (AI provider, moderation API, analytics, webhook):** is it named in `/privacy`
  (`src/global/commands/g.about.ts`) and the README, and is any Discord message content going to it? Message content
  must not go to an undisclosed processor, and must never be used for model training. Restoring AI features is tracked
  in TripSit/TripBot#1577 and is blocked on a terms and privacy policy update.
- **A DM:** is it a direct result of a user action, does it say why it was sent, and is it free of marketing?
- **Role, nickname, timeout or other account changes:** is it triggered by a user's explicit action or by a moderator?
- **Scores, rankings or flags about users:** does it use only data from this server or the user's own account? It must
  not draw on their activity or bans in other servers.
- **Sensitive data (drug-dose logs, health, moderation notes):** is the reply ephemeral, and is the data kept out of
  DMs, logs and public channels?
- **New command or event:** are the intents and contexts the minimum needed, and is the `ephemeral` option present and
  defaulting to true as AGENTS.md requires?
- **Credentials:** does anything ask a user for a password, token or login?
- **Age:** does the change collect data that could identify someone as under 13, or content unsuitable for under-18
  users in non-age-restricted spaces?

## Automatic error reports

In production, `src/global/utils/errorIssue.ts` files a GitHub issue (label `bot-error`) for unexpected errors, and
`.github/workflows/AutoFixErrors.yml` (off unless the `AUTOFIX_ENABLED` repository variable is `true`) lets Claude propose
a fix PR. The issue holds only a redacted stack trace and the command name: snowflake IDs, emails, tokens and home paths
are stripped, and message content or command options are never included. The `/privacy` text names this. If a change
puts anything else into the issue body, re-run the checklist above.

## Developer Portal items (outside the code)

Keep these in sync whenever the bot's behavior changes; a code change cannot verify them:

- Privileged intents (Message Content, Server Members, Presence) each have an accurate justification.
- The app's terms of service and privacy policy links point at text that matches `/privacy`.
- The app profile has an accurate description and age rating.
- Users have a documented way to contact the team (`discord@tripsit.me`, `/feedback`, `/report`).
