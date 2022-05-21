'use strict';

const path = require('path');
const logger = require('./logger');

const PREFIX = path.parse(__filename).name;

const { db } = global;
const {
  firebaseGuildDbName,
} = require('../../env');

module.exports = {
  setGuildInfo: async (fbid, data) => {
    logger.debug(`[${PREFIX}] Saving ${data.guild_name}!`);
    // logger.debug(`[${PREFIX}] fbid ${fbid}!`);

    if (fbid !== null && fbid !== undefined) {
      logger.debug(`[${PREFIX}] Updating guild data`);
      try {
        await db.collection(firebaseGuildDbName).doc(fbid).set(data);
      } catch (err) {
        logger.error(`[${PREFIX}] Error updating actor data: ${err}`);
      }
    } else {
      logger.debug(`[${PREFIX}] Creating guild data`);
      try {
        await db.collection(firebaseGuildDbName).doc().set(data);
      } catch (err) {
        logger.error(`[${PREFIX}] Error creating guild data: ${err}`);
      }
    }
  },
};
