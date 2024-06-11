/* eslint-disable max-len */
import {
  MessageReaction,
  User,
} from 'discord.js';

const F = f(__filename);

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
  // log.debug(F, `actor: ${actor.username} target: ${target.username} action: ${action}`);

  // Increment karma given of the actor
  await db.users.upsert({
    where: { discord_id: actor.id },
    create: {
      discord_id: actor.id,
      karma_given: action,
      karma_received: 0,
    },
    update: {
      karma_given: {
        increment: action,
      },
    },
  });

  // const actorData = await getUser(actor.id, null, null);

  // Increment the karma received of the target
  await db.users.upsert({
    where: { discord_id: target.id },
    create: {
      discord_id: target.id,
      karma_given: 0,
      karma_received: action,
    },
    update: {
      karma_received: {
        increment: action,
      },
    },
  });

  // log.debug(F, `actorKarma ${JSON.stringify(actorKarma)}!`);
  // log.debug(F, `targetKarma ${JSON.stringify(targetKarma)}!`);
  // log.debug(F, `${user.username} (R:${actorKarma[0].karma_received}|G:${actorKarma[0].karma_given}) ${verb} ${target.username} (R:${targetKarma[0].karma_received}|G:${targetKarma[0].karma_given}) in ${(reaction.message.channel as TextChannel).name}!`);

  // log.debug(F, `${actor.username} has received (${actorKarma[0].karma_received}) and given (${actorKarma[0].karma_given})!`);
  // log.debug(F, `${target.username} has received (${targetKarma[0].karma_received}) and given (${targetKarma[0].karma_given})!`);
}
