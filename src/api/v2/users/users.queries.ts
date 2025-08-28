const F = f(__filename);

export default {
  async getUser(DiscordId:string) {
    return db.users.findFirst({
      where: {
        discord_id: DiscordId,
      },
    });
  },

  async checkBanStatus(discordId: string) {
    try {
      const guild = await discordClient.guilds.fetch(process.env.DISCORD_GUILD_ID);

      try {
        const ban = await guild.bans.fetch(discordId);
        return { banned: true, reason: ban.reason };
      } catch (error) {
        // User is not banned (Discord throws error if user isn't banned)
        return { banned: false };
      }
    } catch (error) {
      log.error(F, `Error checking ban status: ${error}`);
      throw error;
    }
  },
};
