'use strict';

const path = require('path');
const logger = require('./logger');

const PREFIX = path.parse(__filename).name;

const { db } = global;
const {
  users_db_name: usersDbName,
} = process.env;

module.exports = {
  getUserInfo: async member => {
    logger.debug(`[${PREFIX}] Looking up member ${member}!`);
    let memberData = null;
    let memberFbid = null;
    logger.debug(`[${PREFIX}] usersDbName: ${usersDbName}`);
    logger.debug(`[${PREFIX}] member.id: ${member.id}`);
    const snapshotUser = await db.collection(usersDbName).get();
    await snapshotUser.forEach(doc => {
      if (doc.data().discord_id === member.id.toString()) {
        logger.debug(`[${PREFIX}] Member data found!`);
        // logger.debug(`[${PREFIX}] doc.data(): ${JSON.stringify(doc.data())}`);
        // logger.debug(`[${PREFIX}] doc.data().discord_id: ${doc.data().discord_id}`);
        memberData = doc.data();
        memberFbid = doc.id;
      }
    });
    if (!memberData) {
      logger.debug(`[${PREFIX}] No member data found, creating a blank one!`);
      memberData = {
        discord_username: member.user ? member.user.username : member.username,
        discord_discriminator: member.user ? member.user.discriminator : member.discriminator,
        discord_id: member.id.toString(),
        karma_given: {},
        karma_received: {},
        mod_actions: {},
        roles: [],
        timezone: '',
        birthday: [],
      };
    }
    return [memberData, memberFbid];
  },
};
