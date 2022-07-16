'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');

const {
  discordGuildId,
} = require('../../../env');

module.exports = {
  name: 'inviteDelete',

  async execute(invite) {
    // Only run on Tripsit
    if (invite.guild.id !== discordGuildId) { return; }
    logger.info(`[${PREFIX}] Invite deleted:`, invite);
  },
};
