'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');

const {
  DISCORD_GUILD_ID,
} = require('../../../env');

module.exports = {
  name: 'inviteDelete',

  async execute(invite) {
    // Only run on Tripsit
    if (invite.guild.id !== DISCORD_GUILD_ID) { return; }
    logger.info(`[${PREFIX}] Invite deleted:`, invite);
  },
};
