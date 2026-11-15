/* eslint-disable max-len */
import {
  MessageReaction,
  User,
} from 'discord.js';

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
  const actor = user;
  if (reaction.message.author === null) {
    return;
  }
  const target = reaction.message.author;

  // Can't give karma to yourself!
  if (actor === target) {
    return;
  }

  if (!reaction.emoji.name) return;
  if (!reaction.emoji.name.includes('upvote')) return;

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
}
