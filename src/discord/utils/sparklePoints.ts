import {
  MessageReaction,
  User,
} from 'discord.js';
import env from '../../global/utils/env.config';
// import logger from '../../global/utils/logger';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

/**
 * This function handles the sparkle points reaction to the hydration message
 * @param {MessageReaction} reaction The reaction that was added
 * @param {User} user The user that added the reaction
 */
export async function sparklePoints(reaction:MessageReaction, user:User) {
  // logger.debug(`[${PREFIX}] starting!`);
  // const reactionAuthor = reaction.message.author;
  const reactionEmoji = reaction.emoji;

  // Sparkle points
  if ((reaction.message?.author?.bot && reactionEmoji.name === '💧') && !user.bot) {
    if (global.db) {
      const ref = db.ref(`${env.FIREBASE_DB_USERS}/${user.id}/discord/sparkle_points`);
      await ref.once('value', (data) => {
        let points = 1;
        if (data.val() !== null) {
          points = data.val() + 1;
        }
        ref.update(points);
      });
    }
  }
  // logger.debug(`[${PREFIX}] finished!`);
};
