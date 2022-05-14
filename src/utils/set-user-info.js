'use strict';

const path = require('path');
const logger = require('./logger');

const PREFIX = path.parse(__filename).name;

const { db } = global;
const {
  users_db_name: usersDbName,
} = process.env;

module.exports = {
  setUserInfo: async (fbid, data) => {
    logger.debug(`[${PREFIX}] Saving ${data.discord_username}!`);

    if (fbid !== null && fbid !== undefined) {
      logger.debug(`[${PREFIX}] Updating actor data`);
      try {
        await db.collection(usersDbName).doc(fbid).set(data);
      } catch (err) {
        logger.error(`[${PREFIX}] Error updating actor data: ${err}`);
      }
    } else {
      logger.debug(`[${PREFIX}] Creating actor data`);
      try {
        await db.collection(usersDbName).doc().set(data);
      } catch (err) {
        logger.error(`[${PREFIX}] Error creating actor data: ${err}`);
      }
    }
  },
};
