/**
 * AI consent: a user has opted in to AI translation only once they have agreed to BOTH the terms of
 * service and the privacy policy (`/ai tos`, `/ai privacy`). Nothing a user writes may be sent to an
 * AI provider or copied into an AI prompt until then. Revoking (deleting ai_info) removes consent.
 */

/** Returns the subset of the given Discord ids that have agreed to both the AI TOS and privacy policy. */
export async function getAiConsentedIds(discordIds: string[]): Promise<Set<string>> {
  const unique = [...new Set(discordIds)];
  if (unique.length === 0) return new Set();

  const rows = await db.users.findMany({
    where: {
      discord_id: { in: unique },
      ai_info: {
        is: {
          ai_tos_agree: { not: null },
          ai_privacy_agree: { not: null },
        },
      },
    },
    select: { discord_id: true },
  });

  return new Set(rows.flatMap(row => (row.discord_id ? [row.discord_id] : [])));
}

export async function hasAiConsent(discordId: string): Promise<boolean> {
  return (await getAiConsentedIds([discordId])).has(discordId);
}
