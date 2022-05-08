'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const PREFIX = require('path').parse(__filename).name; // eslint-disable-line
const { db } = global;
const { users_db_name: usersDbName } = process.env;
const { getUserInfo } = require('../../utils/get-user-info');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chitragupta')
    .setDescription('Keep it positive please!'),

  async execute(interaction, actor, action, emoji, target) {
    logger.debug(`[${PREFIX}] ${actor} ${action} ${emoji} ${target}!`);

    if (actor === target) { return; }
    // logger.debug(`[${PREFIX}] actor.id: ${actor.id}`);
    const [actorData, actorFbid] = await getUserInfo(actor);

    if ('karma_given' in actorData) {
      logger.debug(`[${PREFIX}] Updating karma_given info!`);
      actorData.karma_given[emoji] = (actorData.karma_given[emoji] || 0) + action;
    } else {
      logger.debug(`[${PREFIX}] Creating karma_given info!`);
      actorData.karma_given = { [emoji]: action };
    }

    if (actorFbid !== '') {
      logger.debug(`[${PREFIX}] Updating actor data in firebase`);
      await db.collection(usersDbName)
        .doc(actorFbid)
        .set(actorData)
        .catch(ex => {
          logger.error(`[${PREFIX}] Error creating actor data in firebase:`, ex);
          return Promise.reject(ex);
        });
    } else {
      logger.debug(`[${PREFIX}] Creating actor data in firebase`);
      await db.collection(usersDbName)
        .doc()
        .set(actorData)
        .catch(ex => {
          logger.error(`[${PREFIX}] Error creating actor data in firebase:`, ex);
          return Promise.reject(ex);
        });
    }

    const [targetData, targetFbid] = await getUserInfo(target);
    if ('karma_recieved' in targetData) {
      logger.debug(`[${PREFIX}] Updating karma_recieved info!`);
      targetData.karma_recieved[emoji] = (targetData.karma_recieved[emoji] || 0) + action;
    } else {
      logger.debug(`[${PREFIX}] Creating karma_given info!`);
      targetData.karma_recieved = { [emoji]: action };
    }

    if (targetFbid !== '') {
      logger.debug(`[${PREFIX}] Updating target data in firebase`);
      await db.collection(usersDbName)
        .doc(targetFbid)
        .set(targetData)
        .catch(ex => {
          logger.error(`[${PREFIX}] Error updating target data in firebase:`, ex);
          return Promise.reject(ex);
        });
    } else {
      logger.debug(`[${PREFIX}] Creating target data in firebase`);
      await db.collection(usersDbName)
        .doc()
        .set(targetData)
        .catch(ex => {
          logger.error(`[${PREFIX}] Error creating target data in firebase:`, ex);
          return Promise.reject(ex);
        });
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
