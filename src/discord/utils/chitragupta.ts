/* eslint-disable max-len */
import {
  MessageReaction,
  User,
} from 'discord.js';
import {
  getUser, incrementKarma, usersUpdate,
} from '../../global/utils/knex';

// const F = f(__filename);

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
    // log.debug(F, `Ignoring bot interaction`);
    return;
  }
  const target = reaction.message.author;

  // log.debug(F, `${actor} ${action} ${emoji} ${target}!`);

  // Can't give karma to yourself!
  if (actor === target) {
    return;
  }

  // log.debug(F, `actor: ${actor}`);
  if (!reaction.emoji.name) return;
  if (!reaction.emoji.name.includes('upvote')) return;

  // Increment karma of the actor
  await incrementKarma('karma_given', actor.id, action);

  const actorData = await getUser(actor.id, null, null);

  if (actorData.karma_given === undefined) {
    // User doesn't exist in the database
    // log.debug(F, `User doesn't exist in the database: ${actor.id}`);
    // Create new user
    actorData.discord_id = actor.id;
    actorData.karma_given = action;
    actorData.karma_received = 0;

    await usersUpdate(actorData);
  }

  // Increment the karma of the target
  await incrementKarma('karma_received', target.id, action);
  const targetData = await getUser(target.id, null, null);

  if (targetData.karma_given === undefined) {
    // User doesn't exist in the database
    // log.debug(F, `User doesn't exist in the database: ${actor.id}`);
    // Create new user
    targetData.discord_id = target.id;
    targetData.karma_given = 0;
    targetData.karma_received = action;
    await usersUpdate(targetData);
  }
  // log.debug(F, `actorKarma ${JSON.stringify(actorKarma)}!`);
  // log.debug(F, `targetKarma ${JSON.stringify(targetKarma)}!`);
  // log.debug(F, `${user.username} (R:${actorKarma[0].karma_received}|G:${actorKarma[0].karma_given}) ${verb} ${target.username} (R:${targetKarma[0].karma_received}|G:${targetKarma[0].karma_given}) in ${(reaction.message.channel as TextChannel).name}!`);

  // log.debug(F, `${actor.username} has received (${actorKarma[0].karma_received}) and given (${actorKarma[0].karma_given})!`);
  // log.debug(F, `${target.username} has received (${targetKarma[0].karma_received}) and given (${targetKarma[0].karma_given})!`);
}
