import {
  Invite,
} from 'discord.js';
import logger from '../../global/utils/logger';
import env from '../../global/utils/env.config';
const PREFIX = require('path').parse(__filename).name;

module.exports = {
  name: 'inviteDelete',

  async execute(invite: Invite) {
    // Only run on Tripsit
    if (invite.guild?.id !== env.DISCORD_GUILD_ID.toString()) {
      return;
    }
    logger.info(`[${PREFIX}] Invite deleted: ${invite}`);
    // Delete the Invite from Cache
    global.guildInvites.get(invite.guild.id).delete(invite.code);
  },
};
