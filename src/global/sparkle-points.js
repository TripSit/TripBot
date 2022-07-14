'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('./logger');
const { getUserInfo, setUserInfo } = require('./firebaseAPI');

module.exports = {
  async sparklePoints(reaction, user) {
    logger.debug(`[${PREFIX}] starting!`);
    // const reactionAuthor = reaction.message.author;
    const reactionEmoji = reaction.emoji;

    // Sparkle points
    if ((reaction.message.author.bot && reactionEmoji.name === '💧') && !user.bot) {
      const [actorData, actorFbid] = await getUserInfo(user);
      if ('discord' in actorData) {
        if ('sparkle_points' in actorData.discord) {
          actorData.discord.sparkle_points += 1;
        } else {
          actorData.discord.sparkle_points = 1;
        }
      } else {
        actorData.discord = { sparkle_points: 1 };
      }

      await setUserInfo(actorFbid, actorData);
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
