/**
 * The configured TripSit guild ID. Startup validation (env.validate.ts) requires it, so a missing value here means
 * the process was started without validation and failing loudly beats passing `undefined` to Discord.
 */
export default function requireGuildId(): string {
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId) throw new Error('DISCORD_GUILD_ID is not configured');
  return guildId;
}
