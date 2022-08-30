'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('./logger');
const { getUserInfo, setUserInfo } = require('../services/firebaseAPI');

module.exports = {
  async chitragupta(reaction, user, action) {
    logger.debug(`[${PREFIX}] start!`);
    const actor = user;
    const emoji = reaction.emoji.toString();
    const target = reaction.message.author;

    // logger.debug(`[${PREFIX}] ${actor} ${action} ${emoji} ${target}!`);

    // logger.debug(`[${PREFIX}] emoji: ${JSON.stringify(reaction.emoji, null, 2)}`);

    // Can't give karma to yourself!
    if (actor === target) { return; }

    // logger.debug(`[${PREFIX}] actor: ${actor}`);
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
    actorData.karma_given = actorData.karma_given + action || action;

    // Load actor data
    // logger.debug(`[${PREFIX}] Actor data: ${JSON.stringify(actorData, null, 2)}`);
    await setUserInfo(actorFbid, actorData);

    // Extract target data
    const [targetData, targetFbid] = await getUserInfo(target);
    // logger.debug(`[${PREFIX}] targetData: ${JSON.stringify(targetData, null, 2)}`);

    // Transform target data
    targetData.karma_received = targetData.karma_received + action || action;

    // Load target data
    // logger.debug(`[${PREFIX}] targetData: ${JSON.stringify(targetData, null, 2)}`);
    await setUserInfo(targetFbid, targetData);
    return logger.debug(`[${PREFIX}] finished!`);
  },
};
