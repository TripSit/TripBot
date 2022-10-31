import {
  GuildMember,
  TextChannel,
  // Message,
} from 'discord.js';
import {
  guildMemberUpdateEvent,
} from '../@types/eventDef';
// import {
//   reactionRoleList,
// } from '../../global/@types/database';
import logger from '../../global/utils/logger';
import env from '../../global/utils/env.config';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

const mindsetRoles = [
  env.ROLE_DRUNK,
  env.ROLE_HIGH,
  env.ROLE_ROLLING,
  env.ROLE_TRIPPING,
  env.ROLE_DISSOCIATING,
  env.ROLE_STIMMING,
  env.ROLE_NODDING,
  env.ROLE_SOBER,
];

export const guildMemberUpdate: guildMemberUpdateEvent = {
  name: 'guildMemberUpdate',
  async execute(oldMember: GuildMember, newMember: GuildMember) {
    logger.debug(`[${PREFIX}] started on ${newMember.user.username}`);
    // logger.debug(`[${PREFIX}] guildMemberUpdate`);
    // logger.debug(`${PREFIX} Member.guildId: ${newMember.guild.id}`);
    // logger.debug(`${PREFIX} discordGuildId: ${discordGuildId}`);
    // Only run this on TripSit
    if (newMember.guild.id.toString() === env.DISCORD_GUILD_ID.toString()) {
      // logger.debug(`[${PREFIX}] Running on TripSit`);
      // logger.debug(`[${PREFIX}] oldMember: ${JSON.stringify(oldMember, null, 2)}`);
      // logger.debug(`[${PREFIX}] newMember: ${JSON.stringify(newMember, null, 2)}`);

      const oldRoles = oldMember.roles.cache.map((role) => role.id);

      const newRoles = newMember.roles.cache.map((role) => role.id);

      // If the oldRoles don't match the new roles
      if (oldRoles.toString() !== newRoles.toString()) {
        // logger.debug(`[${PREFIX}] roles changed on ${newMember.displayName}!`);
        // logger.debug(`[${PREFIX}] oldRoles: ${oldRoles}`);
        // logger.debug(`[${PREFIX}] newRoles: ${newRoles}`);

        // Find the difference between the two arrays
        const rolesAdded = newRoles.filter((x) => !oldRoles.includes(x));
        // logger.debug(`[${PREFIX}] roleAdded: ${rolesAdded}`);
        const rolesRemoved = oldRoles.filter((x) => !newRoles.includes(x));
        // logger.debug(`[${PREFIX}] roleRemoved: ${rolesRemoved}`);

        // If you added/removed more than one role then it wasnt a mindset change, so ignore it
        if (rolesAdded.length > 1 || rolesRemoved.length > 1) {
          return;
        }

        let differenceId = '';
        let action = '';
        if (rolesAdded.length > 0) {
          differenceId = rolesAdded[0];
          action = 'added';
        } else if (rolesRemoved.length > 0) {
          differenceId = rolesRemoved[0];
          action = 'removed';
        }

        // logger.debug(`[${PREFIX}] differenceId: ${differenceId}`);
        // logger.debug(`[${PREFIX}] action: ${action}`);

        const differentRole = newMember.guild.roles.cache
          .find((role) => role.id === differenceId);

        logger.debug(`[${PREFIX}] ${newMember.displayName} ${action} ${differentRole?.name} (${differentRole?.id})`);

        // The following code only cares if you add a mindset role
        if (mindsetRoles.includes(differenceId)) {
          // Look up the role name
          const roleName = await newMember.guild.roles.fetch(differenceId).then((role) => role?.name);
          // logger.debug(`[${PREFIX}] ${newMember.displayName} ${action} ${roleName}`);

          // const userInfo = await getUserInfo(newMember.id);
          const channelBotlog = newMember.guild.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
          if (channelBotlog) {
            channelBotlog.send(`${newMember.displayName} ${action} ${roleName}`);
          }

          // if (action === 'added') {
          //   // const mindsetRemovalTime = new Date();
          //   // // define one week in milliseconds
          //   // const fiveSec = 1000 * 5;
          //   // // const oneWeek = 1000 * 60 * 60 * 24 * 7;
          //   // mindsetRemovalTime.setTime(mindsetRemovalTime.getTime() + fiveSec);
          //   // logger.debug(`[${PREFIX}] reminderDatetime: ${mindsetRemovalTime}`);

          //   //   const ref = db.ref(`${env.FIREBASE_DB_TIMERS}/${newMember.user.id}`);
          //   //   ref.update({
          //   //     [mindsetRemovalTime.valueOf()]: {
          //   //       type: 'mindset',
          //   //       value: differenceId,
          //   //     },
          //   //   });
          // }
          // if (action === 'removed' ) {
          //   const ref = db.ref(`${env.FIREBASE_DB_GUILDS}/${newMember.guild.id}/reactionRoles/`);
          //   await ref.once('value', async (data) => {
          //     if (data.val() !== null) {
          //       const allReactionRoles = data.val() as reactionRoleList;
          //       // logger.debug(`[${PREFIX}] differenceId: ${differenceId}`);
          //       Object.keys(allReactionRoles).forEach(async (channelId) => {
          //         const channelMessages = allReactionRoles[channelId];
          //         Object.keys(channelMessages).forEach(async (messageId) => {
          //           // logger.debug(`[${PREFIX}] messageId: ${messageId}`);
          //           const reactionRoles = allReactionRoles[channelId][messageId];
          //           // logger.debug(`[${PREFIX}] reactionRoles: ${JSON.stringify(reactionRoles, null, 2)}`);
          //           reactionRoles.forEach(async (reactionRole) => {
          //             if (reactionRole.roleId === differenceId) {
          //               logger.debug(`[${PREFIX}] reactionRole: ${reactionRole.name}`);
          //               const tripsitGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
          //               logger.debug(`[${PREFIX}] channelId: ${channelId}`);
          //               const channel = await tripsitGuild.channels.fetch(channelId) as TextChannel;
          //               logger.debug(`[${PREFIX}] messageId: ${messageId}`);
          //               const message = await channel.messages.fetch(messageId) as Message;

          //               for (let i = 0; i < message.reactions.cache.size; i++) {
          //                 logger.debug(`[${PREFIX}] key: ${message.reactions.cache.keyAt(i)}`);
          //                 const mreaction = message.reactions.resolve(
          //                   message.reactions.cache.keyAt(i)!);
          //                 mreaction?.users.remove(newMember.id);
          //                 // if (message.reactions.cache.keyAt(i) !== reaction.emoji.name &&
          //                 //     message.reactions.cache.keyAt(i) !== reaction.emoji.id) {
          //                 //   const mreaction = message.reactions.resolve(
          //                 //     message.reactions.cache.keyAt(i)!);
          //                 //   mreaction?.users.remove(user);
          //                 //   continue;
          //                 // } else {
          //                 //   logger.debug(`[${PREFIX}] skipping ${message.reactions.cache.keyAt(i)}`);
          //                 // }
          //               }
          //             }
          //           });
          //         });
          //       });
          //     }
          //   });
          // }
        }
      }
    }
    // logger.debug(`[${PREFIX}] Done!`);
  },
};
