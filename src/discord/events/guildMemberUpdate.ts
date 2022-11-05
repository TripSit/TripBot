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
import log from '../../global/utils/log';
import env from '../../global/utils/env.config';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

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
    // log.debug(`[${PREFIX}] guildMemberUpdate`);
    // log.debug(`${PREFIX} Member.guildId: ${newMember.guild.id}`);
    // log.debug(`${PREFIX} discordGuildId: ${discordGuildId}`);
    // Only run this on TripSit
    if (newMember.guild.id.toString() === env.DISCORD_GUILD_ID.toString()) {
      // log.debug(`[${PREFIX}] Running on TripSit`);
      // log.debug(`[${PREFIX}] oldMember: ${JSON.stringify(oldMember, null, 2)}`);
      // log.debug(`[${PREFIX}] newMember: ${JSON.stringify(newMember, null, 2)}`);

      const oldRoles = oldMember.roles.cache.map((role) => role.id);

      const newRoles = newMember.roles.cache.map((role) => role.id);

      // If the oldRoles don't match the new roles
      if (oldRoles.toString() !== newRoles.toString()) {
        // log.debug(`[${PREFIX}] roles changed on ${newMember.displayName}!`);
        // log.debug(`[${PREFIX}] oldRoles: ${oldRoles}`);
        // log.debug(`[${PREFIX}] newRoles: ${newRoles}`);

        // Find the difference between the two arrays
        const rolesAdded = newRoles.filter((x) => !oldRoles.includes(x));
        // log.debug(`[${PREFIX}] roleAdded: ${rolesAdded}`);
        const rolesRemoved = oldRoles.filter((x) => !newRoles.includes(x));
        // log.debug(`[${PREFIX}] roleRemoved: ${rolesRemoved}`);

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

        // log.debug(`[${PREFIX}] differenceId: ${differenceId}`);
        // log.debug(`[${PREFIX}] action: ${action}`);

        const differentRole = newMember.guild.roles.cache
          .find((role) => role.id === differenceId);

        // log.debug(`[${PREFIX}] ${newMember.displayName} ${action} ${differentRole?.name} (${differentRole?.id})`);

        // The following code only cares if you add a mindset role
        if (mindsetRoles.includes(differenceId)) {
          // Look up the role name
          const roleName = await newMember.guild.roles.fetch(differenceId).then((role) => role?.name);
          // log.debug(`[${PREFIX}] ${newMember.displayName} ${action} ${roleName}`);

          // const userInfo = await getUserInfo(newMember.id);
          const channelBotlog = newMember.guild.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
          if (channelBotlog) {
            channelBotlog.send(`${newMember.displayName} ${action} ${roleName}`);
          }
        }
      }
    }
  },
};
