import { DiscordAPIError, RESTJSONErrorCodes } from 'discord.js';
import requireGuildId from '../../../global/utils/requireGuildId';

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
      const guild = await discordClient.guilds.fetch(requireGuildId());

      try {
        const ban = await guild.bans.fetch(discordId);
        return { success: true, banned: true, reason: ban.reason };
      } catch (error) {
        // Only Discord's explicit "Unknown Ban" answer confirms the user is not banned. Network failures or missing
        // permissions must not read as "not banned", so everything else goes to the caller's failure handling.
        if (error instanceof DiscordAPIError && error.code === RESTJSONErrorCodes.UnknownBan) {
          return { success: true, banned: false };
        }
        throw error;
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
