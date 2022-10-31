import {
  MessageReaction,
  User,
  // Role,
} from 'discord.js';
import {db} from '../../global/utils/knex';
// import {
//   Users,
// } from '../../global/@types/pgdb.d';
import env from '../../global/utils/env.config';
import logger from '../../global/utils/logger';
import * as path from 'path';
import {stripIndents} from 'common-tags';
const PREFIX = path.parse(__filename).name;

const mindsetRemovalTime = env.NODE_ENV === 'production' ? 1000 * 60 * 60 * 8 : 1000 * 30;

/**
 * This runs on every reaction to see if it's a reaction role
 * @param {MessageReaction} reaction Reaction used
 * @param {User} user User that reacted
 * @param {boolean} add Whether to add or remove the role
 * @return {Promise<void>}
 */
export async function handleReactionRoles(
  reaction:MessageReaction,
  user:User,
  add:boolean,
): Promise<void> {
  logger.debug(stripIndents`[${PREFIX}] started with params: \
reaction: ${reaction.emoji.name} (${reaction.emoji.id}) {${reaction.emoji.identifier}} | \
user: ${user.username} | \
add: ${add}\
`);
  const messageId = reaction.message.id;
  const reactionId = reaction.emoji.id ?? reaction.emoji.name;
  // logger.debug(`[${PREFIX}] messageId: ${messageId} | reactionId: ${reactionId}`);
  const reactionRole = await db
    .select(db.ref('role_id').as('role_id'))
    .from('reaction_roles')
    .where('message_id', messageId)
    .andWhere('reaction_id', reactionId)
    .first();

  if (reactionRole === undefined) {
    logger.debug(`[${PREFIX}] No reaction role found!`);
    return;
  }

  if (reaction.message.guild) {
    const role = await reaction.message.guild.roles.fetch(reactionRole.role_id);
    if (role === null) {
      logger.debug(`[${PREFIX}] No role found!`);
      return;
    } else {
      // logger.debug(`[${PREFIX}] role: ${role.name}`);
      if (add) {
        // Add the role
        (await reaction.message.guild.members.fetch(user.id)).roles.add(role);
        logger.debug(`[${PREFIX}] Added role ${role.name} to ${user.username}`);
        reaction.message.reactions.cache.each((r) => {
          if (r.emoji.name !== reaction.emoji.name) {
            r.users.remove(user);
          }
        });

        const mindsetEmojis = [
          `${env.EMOJI_DRUNK}`,
          `${env.EMOJI_HIGH}`,
          `${env.EMOJI_ROLLING}`,
          `${env.EMOJI_TRIPPING}`,
          `${env.EMOJI_DISSOCIATING}`,
          `${env.EMOJI_STIMMING}`,
          `${env.EMOJI_SEDATED}`,
          `${env.EMOJI_TALKATIVE}`,
          `${env.EMOJI_WORKING}`,
        ];
        // logger.debug(`[${PREFIX}] mindsetEmojis: ${mindsetEmojis}`);
        // logger.debug(`[${PREFIX}] identifier: <:${reaction.emoji.identifier}>`);
        if (mindsetEmojis.includes(`<:${reaction.emoji.identifier}>`)) {
          // Update the database
          await db
            .insert({
              discord_id: user.id,
              mindset_role: role.id,
              mindset_role_expires_at: new Date(Date.now() + mindsetRemovalTime),
            })
            .into('users')
            .onConflict('discord_id')
            .merge();
          // logger.debug(`[${PREFIX}] Updated mindest DB ${user.username}`);
        };
      } else {
        // Remove the role
        (await reaction.message.guild.members.fetch(user.id)).roles.remove(role);
        logger.debug(`[${PREFIX}] Removed role ${role.name} from ${user.username}`);
      }
    }
  } else {
    logger.debug(`[${PREFIX}] No guild found!`);
    return;
  }
};
