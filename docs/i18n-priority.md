┌─────────────────────────────────────────────────────────┐
│                  Interaction received                    │
└────────────────────────┬────────────────────────────────┘
                         │  (guildId, DB, Discord locale all ignored)
                         ▼
              ┌─────────────────────┐
              │  env.LOCALE set?    │
              └──────┬──────────────┘
                     │
           ┌─────────┴──────────┐
           │ yes                │ no
           ▼                    ▼
       env.LOCALE            "en-US"

─── getLocale() returns locale string ──────────────────

                         │
                         ▼
              ┌─────────────────────┐
              │   t(locale, ...)    │
              │  i18next.t() called │
              │  with { lng }       │
              └──────────┬──────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │ Key found in locale?   │
            └────────┬───────────────┘
                     │
           ┌─────────┴──────────┐
           │ yes                │ no (missing key)
           ▼                    ▼
    return translation   fallbackLng: "en-US"
                                │
                         ┌──────┴───────┐
                         │ found in     │
                         │ en-US?       │
                         └──────┬───────┘
                                │
                      ┌─────────┴────────┐
                      │ yes              │ no
                      ▼                  ▼
               return en-US      return key string
               translation         (raw key)
```

**Priority chain for `getLocale()`:**
1. `env.LOCALE` — from `.env`
2. `"en-US"` — hardcoded fallback

Per-guild DB locale (`discord_guilds.locale`) and Discord guild/user locale are **no longer read**. `/setup locale set` still writes the DB column, but it has no effect on resolution.

**`env.LOCALE` also sets i18next `lng`** at init time (line 23), so it's both runtime default and i18next default language.

**Note:** Discord client/user locale (`interaction.locale`) is **not used at all** — `getLocale()` ignores it. Only locale env matter.