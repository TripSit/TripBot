'use strict';

const path = require('path');
const logger = require('../utils/logger');
const { getGuildInfo } = require('../utils/get-user-info');
const { setGuildInfo } = require('../utils/set-user-info');

const PREFIX = path.parse(__filename).name;

module.exports = {
  name: 'guildCreate',

  async execute(guild) {
    logger.info(`[${PREFIX}] Joined guild: ${guild.name} (id: ${guild.id})`);

    const [targetData, targetFbid] = getGuildInfo(guild);
    if (targetData.guild_banned) {
      logger.info(`[${PREFIX}] I'm banned from ${guild.name}, leaving!`);
      guild.leave();
      return;
    }

    await setGuildInfo(targetFbid, targetData);
  },
};
