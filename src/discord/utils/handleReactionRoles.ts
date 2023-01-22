/* eslint-disable max-len */
import {
  CategoryChannel,
  MessageReaction,
  TextChannel,
  User,
  // Role,
} from 'discord.js';

// import { stripIndents } from 'common-tags';
import { stripIndents } from 'common-tags';
import { db } from '../../global/utils/knex';
// import {
//   Users,
// } from '../../global/@types/pgdb.d';
// import log from '../../global/utils/log';
import { Users, ReactionRoles } from '../../global/@types/pgdb';

// const F = f(__filename);

const mindsetRemovalTime = env.NODE_ENV === 'production' ? 1000 * 60 * 60 * 8 : 1000 * 5;

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

export default handleReactionRoles;

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
  const messageId = reaction.message.id;
  const reactionId = reaction.emoji.id ?? reaction.emoji.name;
  // log.debug(F, `messageId: ${messageId} | reactionId: ${reactionId}`);

  if (!reaction.message.guild) return;

  const ReactionRole = await db<ReactionRoles>('reaction_roles')
    .select(db.ref('role_id'))
    .where('message_id', messageId)
    .andWhere('reaction_id', reactionId)
    .first();

  if (ReactionRole === undefined) {
    // log.debug(F, `No reaction role found!`);
    return;
  }

  const member = await reaction.message.guild.members.fetch(user.id);
  const role = await reaction.message.guild.roles.fetch(ReactionRole.role_id);
  if (role && member) {
    // log.debug(F, `role: ${role.name}`);
    if (add) {
      // Add the role
      await member.roles.add(role);

      // Remove other reactions
      reaction.message.fetch();
      reaction.message.reactions.cache.each(r => {
        if (r.emoji.name !== reaction.emoji.name) {
          r.users.remove(user);
        }
      });

      // If this is a mindset emoji, set the end date
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
        // log.debug(F, `Updated mindest DB ${user.username}`);
      }

      // If this is the contributor role, send a message to the contributor room
      if (role.id === env.ROLE_CONTRIBUTOR) {
        const devCategory = await reaction.message.guild?.channels.fetch(env.CATEGORY_DEVELOPMENT) as CategoryChannel;
        // const channelTripcord = await reaction.message.guild?.channels.fetch(env.CHANNEL_DISCORD) as TextChannel;
        // const channelTripbot = await reaction.message.guild?.channels.fetch(env.CHANNEL_TRIPBOT) as TextChannel;
        // const channelContent = await reaction.message.guild?.channels.fetch(env.CHANNEL_CONTENT) as TextChannel;
        const channelDevelopment = await reaction.message.guild?.channels.fetch(env.CHANNEL_DEVELOPMENT) as TextChannel;
        // const channelIrc = await reaction.message.guild?.channels.fetch(env.CHANNEL_IRC) as TextChannel;
        // const channelMatrix = await reaction.message.guild?.channels.fetch(env.CHANNEL_MATRIX) as TextChannel;

        await channelDevelopment.send(stripIndents`
          Please welcome our newest ${role.name}, ${member}! We're excited to have you here! 
          
          Our ${devCategory} category holds the projects we're working on.
    
          > **We encourage you to make a new thread whenever possible!**
          > This allows us to organize our efforts and not lose track of our thoughts!
    
          TripSit is run by volunteers, so things may be a bit slower than your day job.
          Almost all the code is open source and can be found on our GitHub: <http://github.com/tripsit>
          Discussion of changes happens mostly in the public channels in this category.
          If you have an idea or feedback, make a new thread or chime in to the discussion: 
          We're happy to hear all sorts of input and ideas!
        `);
      }

      // Same of OCCULT
      if (role.id === env.ROLE_OCCULT) {
        const channelOccult = await reaction.message.guild?.channels.fetch(env.CHANNEL_OCCULT) as TextChannel;
        await channelOccult.send(stripIndents`
          Please welcome our newest ${role.name} member, ${member}! We're excited to have you here!

          This room is for discussion of occult topics such as religion, spirituality, psychonautics, and magic.
          If this isn't your cup of tea you can leave the room by removing the role, but please be respectful of others.
        `);
      }

      // Same of RECOVERY
      if (role.id === env.ROLE_RECOVERY) {
        const channelRecovery = await reaction.message.guild?.channels.fetch(env.CHANNEL_RECOVERY) as TextChannel;
        await channelRecovery.send(stripIndents`
          Please welcome our newest ${role.name} member, ${member}! We're excited to have you here!
          The recovery space on tripsit is new and we're still working on it, for now it will hide the drug rooms.
          No judgement if you don't want to be here or want to see those rooms, you can leave the room by removing the role.
        `);
      }
    } else {
      // Remove the role
      await member.roles.remove(role);
      // log.debug(F, `Removed role ${role.name} from ${user.username}`);
    }
  }
}
