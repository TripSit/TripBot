# i18n Wiring Notes

## `getLocale()` accepts `BaseInteraction`

The function signature uses `BaseInteraction` (the base class for all Discord interactions), but in practice it is always called from slash command handlers where the interaction is a `ChatInputCommandInteraction`.

This is safe because `ChatInputCommandInteraction → CommandInteraction → BaseInteraction` — it's a straight inheritance chain. `getLocale()` only reads `interaction.guildId`, which is present on `BaseInteraction`, so no cast or type narrowing is needed at the call site.
