/* eslint-disable no-unused-vars*/
/* eslint-disable max-len*/

import {
  MessageReaction,
  TextChannel,
  User,
} from 'discord.js';
import env from '../../global/utils/env.config';
import {DateTime} from 'luxon';
import {db} from '../../global/utils/knex';
import {Users, UserExperience} from '../../global/@types/pgdb';
import logger from '../../global/utils/logger';
import * as path from 'path';
import {stripIndents} from 'common-tags';
const PREFIX = path.parse(__filename).name;

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
  // logger.debug(`[${PREFIX}] starting!`);
  const verb = action === 1 ? 'upvoted' : 'downvoted';
  const actor = user;
  const emoji = reaction.emoji.toString();
  if (reaction.message.author === null) {
    logger.debug(`[${PREFIX}] Ignoring bot interaction`);
    return;
  }
  const target = reaction.message.author;

  // logger.debug(`[${PREFIX}] ${actor} ${action} ${emoji} ${target}!`);

  // Can't give karma to yourself!
  if (actor === target) {
    return;
  }

  // logger.debug(`[${PREFIX}] actor: ${actor}`);
  if (!reaction.emoji.name!.includes('upvote')) {
    // logger.debug(`[${PREFIX}] Invalid emoji: ${emoji.toString()}`);
    return;
  }

  // Increment karma of the actor
  let actorKarma = await db('users')
    .where('discord_id', actor.id)
    .increment('karma_given', action)
    .returning(['karma_received', 'karma_given']);

  if (actorKarma.length === 0) {
    // User doesn't exist in the database
    logger.debug(`[${PREFIX}] User doesn't exist in the database: ${actor.id}`);
    // Create new user
    const newUser = {
      discord_id: actor.id,
      karma_given: action,
      karma_received: 0,
    };
    actorKarma = await db('users')
      .insert(newUser)
      .returning(['karma_received', 'karma_given']);
  }

  // Increment the karma of the target
  let targetKarma = await db('users')
    .where('discord_id', target.id)
    .increment('karma_received', action)
    .returning(['karma_received', 'karma_given']);

  if (targetKarma.length === 0) {
    // User doesn't exist in the database
    logger.debug(`[${PREFIX}] User doesn't exist in the database: ${actor.id}`);
    // Create new user
    const newUser = {
      discord_id: target.id,
      karma_given: 0,
      karma_received: action,
    };
    targetKarma = await db('users')
      .insert(newUser)
      .returning(['karma_received', 'karma_given']);
  }
  // logger.debug(`[${PREFIX}] actorKarma ${JSON.stringify(actorKarma)}!`);
  // logger.debug(`[${PREFIX}] targetKarma ${JSON.stringify(targetKarma)}!`);
  logger.debug(`[${PREFIX}] ${user.username} (R:${actorKarma[0].karma_received}|G:${actorKarma[0].karma_given}) ${verb} ${target.username} (R:${targetKarma[0].karma_received}|G:${targetKarma[0].karma_given}) in ${(reaction.message.channel as TextChannel).name}!`);

  // logger.debug(`[${PREFIX}] ${actor.username} has received (${actorKarma[0].karma_received}) and given (${actorKarma[0].karma_given})!`);
  // logger.debug(`[${PREFIX}] ${target.username} has received (${targetKarma[0].karma_received}) and given (${targetKarma[0].karma_given})!`);
  // return logger.debug(`[${PREFIX}] finished!`);
};
