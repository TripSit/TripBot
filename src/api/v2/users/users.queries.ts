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
        return { success: true, banned: true, reason: ban.reason };
      } catch (error) {
        // User is not banned (Discord throws error if user isn't banned)
        return { success: true, banned: false };
      }
    } catch (error) {
      log.error(F, `Error checking ban status: ${error}`);
      throw error;
    }
  },

  async getDiscordAvatar(discordId: string) {
    try {
      const user = await discordClient.users.fetch(discordId);
      return {
        success: true,
        avatarUrl: user.displayAvatarURL({ size: 128 }),
      };
    } catch (error) {
      log.error(F, `Error fetching Discord user: ${error}`);
      // Return guest avatar
      return {
        success: false,
        avatarUrl: '/assets/img/guest.png',
      };
    }
  },
};
