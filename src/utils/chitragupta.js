'use strict';

const logger = require('./logger');
const { getUserInfo, setUserInfo } = require('./firebase');

const PREFIX = require('path').parse(__filename).name; // eslint-disable-line

module.exports = {
  async update(actor, action, emoji, target) {
    logger.debug(`[${PREFIX}] ${actor} ${action} ${emoji} ${target}!`);

    if (actor === target) { return; }
    // Extract actor data
    const [actorData, actorFbid] = await getUserInfo(actor);
    // logger.debug(`[${PREFIX}] Actor data: ${JSON.stringify(actorData, null, 2)}`);

    if (emoji !== '<:ts_voteup:958721361587630210>' && emoji !== '<:ts_votedown:960161563849932892>') {
      logger.debug(`[${PREFIX}] Invalid emoji: ${emoji.toString()}`);
      return;
    }

    // Transform actor data
    if ('discord' in actorData) {
      logger.debug(`[${PREFIX}] Actor data has a discord property`);
      if ('karma_given' in actorData.discord) {
        logger.debug(`[${PREFIX}] Updating karma_given info!`);
        actorData.discord.karma_given[emoji] = (actorData.discord.karma_given[emoji] || 0) + action;
      } else {
        logger.debug(`[${PREFIX}] Creating karma_given info!`);
        actorData.discord.karma_given = { [emoji]: action };
      }
    } else {
      logger.debug(`[${PREFIX}] Actor data does not have a discord property`);
      logger.debug(`[${PREFIX}] Creating discord info!`);
      actorData.discord = { karma_given: { [emoji]: action } };
    }

    // Load actor data
    // logger.debug(`[${PREFIX}] Actor data: ${JSON.stringify(actorData, null, 2)}`);
    await setUserInfo(actorFbid, actorData);

    // Extract target data
    const [targetData, targetFbid] = await getUserInfo(target);
    // logger.debug(`[${PREFIX}] targetData: ${JSON.stringify(targetData, null, 2)}`);

    // Transform target data
    if ('discord' in targetData) {
      logger.debug(`[${PREFIX}] targetData has a discord property`);
      if ('karma_received' in targetData.discord) {
        logger.debug(`[${PREFIX}] Updating karma_received info!`);
        targetData.discord.karma_received[emoji] = (
          targetData.discord.karma_received[emoji] || 0) + action;
      } else {
        logger.debug(`[${PREFIX}] Creating karma_given info!`);
        targetData.discord.karma_received = { [emoji]: action };
      }
    } else {
      logger.debug(`[${PREFIX}] targetData does not have a discord property`);
      logger.debug(`[${PREFIX}] Creating discord info!`);
      targetData.discord = { karma_received: { [emoji]: action } };
    }

    // Load target data
    // logger.debug(`[${PREFIX}] targetData: ${JSON.stringify(targetData, null, 2)}`);
    await setUserInfo(targetFbid, targetData);
    return logger.debug(`[${PREFIX}] finished!`);
  },
};
