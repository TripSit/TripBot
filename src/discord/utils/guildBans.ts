// Ban pages must be read in order: each request starts after the last ID of the previous page.
/* eslint-disable no-await-in-loop */
const F = f(__filename);

/** Discord returns at most this many bans per request. */
export const BAN_PAGE_SIZE = 1000;

/**
 * Returns the Discord IDs of everyone currently banned from a guild, or null when the complete list cannot be read
 * (the bot left the guild, lacks the Ban Members permission, or Discord failed part-way). Callers must treat null as
 * "unknown", never as "nobody is banned".
 */
export async function fetchGuildBanIds(guildId: string): Promise<Set<string> | null> {
  try {
    const guild = await discordClient.guilds.fetch(guildId);
    const bannedIds = new Set<string>();
    let after: string | undefined;
    let fullPage = true;
    while (fullPage) {
      const page = await guild.bans.fetch({ limit: BAN_PAGE_SIZE, cache: false, ...(after ? { after } : {}) });
      page.forEach((_ban, userId) => bannedIds.add(userId));
      fullPage = page.size >= BAN_PAGE_SIZE;
      // Snowflakes compare numerically; take the largest instead of relying on the page order
      if (fullPage) {
        after = [...page.keys()].reduce((largest, id) => (BigInt(id) > BigInt(largest) ? id : largest), '0');
      }
    }
    return bannedIds;
  } catch (error) {
    log.error(F, `Could not read the ban list for guild ${guildId}: ${error}`);
    return null;
  }
}

export default fetchGuildBanIds;
