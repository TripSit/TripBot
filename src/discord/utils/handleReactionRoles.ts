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
import log from '../../global/utils/log';
import {parse} from 'path';
import {stripIndents} from 'common-tags';
import {Users, ReactionRoles} from '../../global/@types/pgdb';
const PREFIX = parse(__filename).name;

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
  let message = `[${PREFIX}] via ${user.tag} (${user.id})`;
  if (add) message += ' added';
  else message += ' removed';
  message += ` ${reaction.emoji.name} (${reaction.emoji.id}) {${reaction.emoji.identifier}}`;
  log.info(stripIndents`${message}`);

  const messageId = reaction.message.id;
  const reactionId = reaction.emoji.id ?? reaction.emoji.name;
  // log.debug(`[${PREFIX}] messageId: ${messageId} | reactionId: ${reactionId}`);
  const reactionRole = await db<ReactionRoles>('reaction_roles')
    .select(db.ref('role_id'))
    .where('message_id', messageId)
    .andWhere('reaction_id', reactionId)
    .first();

  if (reactionRole === undefined) {
    // log.debug(`[${PREFIX}] No reaction role found!`);
    return;
  }

  if (reaction.message.guild) {
    const role = await reaction.message.guild.roles.fetch(reactionRole.role_id);
    if (role === null) {
      log.debug(`[${PREFIX}] No role found!`);
      return;
    } else {
      // log.debug(`[${PREFIX}] role: ${role.name}`);
      if (add) {
        // Add the role
        (await reaction.message.guild.members.fetch(user.id)).roles.add(role);
        log.debug(`[${PREFIX}] Added role ${role.name} to ${user.username}`);
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
        // log.debug(`[${PREFIX}] mindsetEmojis: ${mindsetEmojis}`);
        // log.debug(`[${PREFIX}] identifier: <:${reaction.emoji.identifier}>`);
        if (mindsetEmojis.includes(`<:${reaction.emoji.identifier}>`)) {
          // Update the database
          await db<Users>('users')
            .insert({
              discord_id: user.id,
              mindset_role: role.id,
              mindset_role_expires_at: new Date(Date.now() + mindsetRemovalTime),
            })
            .onConflict('discord_id')
            .merge();
          // log.debug(`[${PREFIX}] Updated mindest DB ${user.username}`);
        };
      } else {
        // Remove the role
        (await reaction.message.guild.members.fetch(user.id)).roles.remove(role);
        log.debug(`[${PREFIX}] Removed role ${role.name} from ${user.username}`);
      }
    }
  } else {
    log.debug(`[${PREFIX}] No guild found!`);
    return;
  }
};
