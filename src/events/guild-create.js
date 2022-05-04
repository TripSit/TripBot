'use strict';

const path = require('path');
const logger = require('../utils/logger');
const { getGuildInfo } = require('../utils/get-user-info');

const PREFIX = path.parse(__filename).name;

const { db } = global;
const { guild_db_name: guildDbName } = process.env;

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

    await db.collection(guildDbName)
      .doc(targetFbid)
      .set(targetData)
      .catch(ex => {
        logger.error(`[${PREFIX}] Error adding guild data to firebase:`, ex);
      });
  },
};
