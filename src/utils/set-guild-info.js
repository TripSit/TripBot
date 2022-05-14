'use strict';

const path = require('path');
const logger = require('./logger');

const PREFIX = path.parse(__filename).name;

const { db } = global;
const {
  guild_db_name: guildDbName,
} = process.env;

module.exports = {
  setGuildInfo: async (fbid, data) => {
    logger.debug(`[${PREFIX}] Saving ${data.guild_name}!`);
    // logger.debug(`[${PREFIX}] fbid ${fbid}!`);

    if (fbid !== null && fbid !== undefined) {
      logger.debug(`[${PREFIX}] Updating guild data`);
      try {
        await db.collection(guildDbName).doc(fbid).set(data);
      } catch (err) {
        logger.error(`[${PREFIX}] Error updating actor data: ${err}`);
      }
    } else {
      logger.debug(`[${PREFIX}] Creating guild data`);
      try {
        await db.collection(guildDbName).doc().set(data);
      } catch (err) {
        logger.error(`[${PREFIX}] Error creating guild data: ${err}`);
      }
    }
  },
};
