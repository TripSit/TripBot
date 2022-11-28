/* eslint-disable max-len */

import {
  MessageReaction,
  // TextChannel,
  User,
} from 'discord.js';
// import { DateTime } from 'luxon';
// import { parse } from 'path';
// import { stripIndents } from 'common-tags';
// import env from '../../global/utils/env.config';
import { db } from '../../global/utils/knex';
import {
  Users,
  // UserExperience
} from '../../global/@types/pgdb';
// import log from '../../global/utils/log';

// const PREFIX = parse(__filename).name;

export default chitragupta;

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
  // const verb = action === 1 ? 'upvoted' : 'downvoted';
  const actor = user;
  // const emoji = reaction.emoji.toString();
  if (reaction.message.author === null) {
    // log.debug(`[${PREFIX}] Ignoring bot interaction`);
    return;
  }
  const target = reaction.message.author;

  // log.debug(`[${PREFIX}] ${actor} ${action} ${emoji} ${target}!`);

  // Can't give karma to yourself!
  if (actor === target) {
    return;
  }

  // log.debug(`[${PREFIX}] actor: ${actor}`);
  if (!reaction.emoji.name) return;
  if (!reaction.emoji.name.includes('upvote')) return;

  // Increment karma of the actor
  let actorKarma = await db<Users>('users')
    .increment('karma_given', action)
    .where('discord_id', actor.id)
    .returning(['karma_received', 'karma_given']);

  if (actorKarma.length === 0) {
    // User doesn't exist in the database
    // log.debug(`[${PREFIX}] User doesn't exist in the database: ${actor.id}`);
    // Create new user
    const newUser = {
      discord_id: actor.id,
      karma_given: action,
      karma_received: 0,
    };
    actorKarma = await db<Users>('users')
      .insert(newUser)
      .returning(['karma_received', 'karma_given']);
  }

  // Increment the karma of the target
  let targetKarma = await db<Users>('users')
    .increment('karma_received', action)
    .where('discord_id', target.id)
    .returning(['karma_received', 'karma_given']);

  if (targetKarma.length === 0) {
    // User doesn't exist in the database
    // log.debug(`[${PREFIX}] User doesn't exist in the database: ${actor.id}`);
    // Create new user
    const newUser = {
      discord_id: target.id,
      karma_given: 0,
      karma_received: action,
    };
    targetKarma = await db<Users>('users')
      .insert(newUser)
      .returning(['karma_received', 'karma_given']);
  }
  // log.debug(`[${PREFIX}] actorKarma ${JSON.stringify(actorKarma)}!`);
  // log.debug(`[${PREFIX}] targetKarma ${JSON.stringify(targetKarma)}!`);
  // log.debug(`[${PREFIX}] ${user.username} (R:${actorKarma[0].karma_received}|G:${actorKarma[0].karma_given}) ${verb} ${target.username} (R:${targetKarma[0].karma_received}|G:${targetKarma[0].karma_given}) in ${(reaction.message.channel as TextChannel).name}!`);

  // log.debug(`[${PREFIX}] ${actor.username} has received (${actorKarma[0].karma_received}) and given (${actorKarma[0].karma_given})!`);
  // log.debug(`[${PREFIX}] ${target.username} has received (${targetKarma[0].karma_received}) and given (${targetKarma[0].karma_given})!`);
}
