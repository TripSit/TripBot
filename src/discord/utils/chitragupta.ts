import {
  MessageReaction,
  User,
} from 'discord.js';
import env from '../../global/utils/env.config';
import logger from '../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

/**
 *
 * @param {MessageReaction} reaction
 * @param {User} user
 * @param {1 | -1} action
 */
export async function chitragupta(
    reaction:MessageReaction,
    user:User,
    action: 1 | -1,
) {
  logger.debug(`[${PREFIX}] start!`);
  const actor = user;
  const emoji = reaction.emoji.toString();
  const target = reaction.message.author!;

  // logger.debug(`[${PREFIX}] ${actor} ${action} ${emoji} ${target}!`);

  // logger.debug(`[${PREFIX}] emoji: ${JSON.stringify(reaction.emoji, null, 2)}`);

  // Can't give karma to yourself!
  if (actor === target) {
    return;
  }

  // logger.debug(`[${PREFIX}] actor: ${actor}`);
  if (!reaction.emoji.name!.includes('upvote')) {
    logger.debug(`[${PREFIX}] Invalid emoji: ${emoji.toString()}`);
    return;
  }

  logger.debug(`[${PREFIX}] ${user.username} gave ${reaction.emoji.name} to \
  ${target.username} in ${reaction.message.guild}!`);

  if (global.db) {
    const actorRef = db.ref(`${env.FIREBASE_DB_USERS}/${actor.id}/discord/karma_given`);
    await actorRef.once('value', (data:any) => {
      let points = 1;
      if (data.val() !== null) {
        points = data.val() + 1;
      }
      actorRef.set(points);
    });
  }

  if (global.db) {
    const targetRef = db.ref(`${env.FIREBASE_DB_USERS}/${target.id}/discord/karma_received`);
    await targetRef.once('value', (data:any) => {
      let points = 1;
      if (data.val() !== null) {
        points = data.val() + 1;
      }
      targetRef.set(points);
    });
  }

  return logger.debug(`[${PREFIX}] finished!`);
};
