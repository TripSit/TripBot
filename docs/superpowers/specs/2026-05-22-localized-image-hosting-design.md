# Localized Image Hosting Design

## Problem

Bot embeds use hardcoded external URLs (imgur, gyazo) for infographic images. These cannot be localized. Goal: host locale-specific infographics (e.g. Finnish dosage charts) without requiring a public HTTP server.

## Solution

Upload localized images to a private Discord "dump" channel on first use. Cache the resulting CDN URL in the database. Commands use the URL directly in `setImage`.

## Architecture

### Resolution order

`getLocalizedImage(assetName, locale, client)` resolves in this order:

1. DB cache hit for `(asset_name, locale)` → return CDN URL immediately
2. Local file exists at `assets/localized_images/<locale>/<assetName>` → upload + cache
3. Local file exists at `assets/localized_images/en-US/<assetName>` → upload + cache under `en-US` key (not the requested locale — so adding a locale image later works immediately)
4. No file found → return `null` (caller skips `setImage`)

### Components

**`src/discord/utils/getLocalizedImage.ts`** — new utility function

```ts
export async function getLocalizedImage(
  assetName: string,
  locale: string,
  client: Client,
): Promise<string | null>
```

**`assets/localized_images/<lang>/`** — directory structure for locale-specific images. `en-US` is the source of truth fallback.

**`image_cache` Prisma table** (tripbot schema):

| column | type | notes |
|--------|------|-------|
| id | Int | PK, autoincrement |
| asset_name | String | filename, e.g. `nasal_spray_dosage.png` |
| locale | String | e.g. `fi`, `en-US` |
| cdn_url | String | Discord CDN URL |
| created_at | DateTime | for debugging |

Unique constraint on `(asset_name, locale)`.

**`IMAGE_DUMP_CHANNEL_ID`** — new env var in `env.config.ts` (separate dev/prod values). The channel must be accessible to the bot with `SendMessages` + `AttachFiles` permissions.

### Command integration

Commands that use localized images replace their hardcoded `setThumbnail`/`setImage` URL with:

```ts
const imageUrl = await getLocalizedImage('nasal_spray_dosage.png', locale, interaction.client);
if (imageUrl) embed.setImage(imageUrl);
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Dump channel not found or missing permissions | Log error, skip `setImage` |
| No local file for locale or `en-US` | Log warning, return `null`, skip `setImage` |
| Discord upload fails | Log error, do not cache, return `null` |
| Cached CDN URL becomes stale (dump message deleted) | Discord renders broken image silently; no active invalidation — acceptable until re-deploy clears cache |

## Testing

- **Unit:** mock Discord client + Prisma, verify resolution order (locale hit → en-US fallback → null)
- **Unit:** verify cache hit skips upload call
- **Integration:** place image in `assets/localized_images/fi/`, call function, assert CDN URL stored in DB
- **Manual:** run command as Finnish locale user, verify correct image appears in embed

## Files Changed

| File | Change |
|------|--------|
| `src/discord/utils/getLocalizedImage.ts` | New |
| `src/prisma/tripbot/schema.prisma` | Add `image_cache` model |
| `src/global/utils/env.config.ts` | Add `IMAGE_DUMP_CHANNEL_ID` |
| `assets/localized_images/en-US/` | Seed with existing infographics |
| Commands using localized images | Replace hardcoded URLs |

## Out of Scope

- Icons, badges, backgrounds — not text-bearing, no localization needed
- Automatic CDN URL invalidation / cache refresh
- HTTP server for self-hosting
