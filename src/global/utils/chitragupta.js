'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('./logger');
const { getUserInfo, setUserInfo } = require('../../global/services/firebaseAPI');

module.exports = {
  async karma(reaction, user, action) {
    logger.debug(`[${PREFIX}] start!`);
    const actor = user;
    const emoji = reaction.emoji.toString();
    const target = reaction.message.author;

    // logger.debug(`[${PREFIX}] ${actor} ${action} ${emoji} ${target}!`);

    // logger.debug(`[${PREFIX}] emoji: ${JSON.stringify(reaction.emoji, null, 2)}`);

    if (actor === target) { return; }

    if (!reaction.emoji.name.includes('upvote') && !reaction.emoji.name.includes('downvote')) {
      logger.debug(`[${PREFIX}] Invalid emoji: ${emoji.toString()}`);
      logger.debug(`[${PREFIX}] finished!`);
      return;
    }

    logger.debug(`[${PREFIX}] ${user.username} gave ${reaction.emoji.name} to ${target.username} in ${reaction.message.guild}!`);

    // Extract actor data
    const [actorData, actorFbid] = await getUserInfo(actor);
    // logger.debug(`[${PREFIX}] Actor data: ${JSON.stringify(actorData, null, 2)}`);

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
