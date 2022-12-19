import {
  Role,
  TextChannel,
  // Message,
} from 'discord.js';
import {
  GuildMemberUpdateEvent,
} from '../@types/eventDef';
// import {
//   ReactionRoleList,
// } from '../../global/@types/database';

// const mindsetRoles = [
//   env.ROLE_DRUNK,
//   env.ROLE_HIGH,
//   env.ROLE_ROLLING,
//   env.ROLE_TRIPPING,
//   env.ROLE_DISSOCIATING,
//   env.ROLE_STIMMING,
//   env.ROLE_SEDATED,
//   env.ROLE_SOBER,
// ];

export default guildMemberUpdate;

export const guildMemberUpdate: GuildMemberUpdateEvent = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    // Only run this on TripSit
    if (newMember.guild.id.toString() !== env.DISCORD_GUILD_ID) return;
    // log.debug(F, `guildMemberUpdate`);
    // log.debug(`${PREFIX} Member.guildId: ${newMember.guild.id}`);
    // log.debug(`${PREFIX} discordGuildId: ${discordGuildId}`);
    // log.debug(F, `Running on TripSit`);
    // log.debug(F, `oldMember: ${JSON.stringify(oldMember, null, 2)}`);
    // log.debug(F, `newMember: ${JSON.stringify(newMember, null, 2)}`);

    const oldRoles = oldMember.roles.cache.map(role => role.id);

    const newRoles = newMember.roles.cache.map(role => role.id);

    // If the oldRoles don't match the new roles
    if (oldRoles.toString() !== newRoles.toString()) {
      // log.debug(F, `roles changed on ${newMember.displayName}!`);
      // log.debug(F, `oldRoles: ${oldRoles}`);
      // log.debug(F, `newRoles: ${newRoles}`);

      // Find the difference between the two arrays
      const rolesAdded = newRoles.filter(x => !oldRoles.includes(x));
      // log.debug(F, `roleAdded: ${rolesAdded}`);
      const rolesRemoved = oldRoles.filter(x => !newRoles.includes(x));
      // log.debug(F, `roleRemoved: ${rolesRemoved}`);

      // If you added/removed more than one role then it wasnt a mindset change, so ignore it
      if (rolesAdded.length > 1 || rolesRemoved.length > 1) {
        return;
      }

      let differenceId = '';
      let action = '';
      if (rolesAdded.length > 0) {
        [differenceId] = rolesAdded;
        action = 'added';
      } else if (rolesRemoved.length > 0) {
        [differenceId] = rolesRemoved;
        action = 'removed';
      }

      // Look up the role name
      const role = await newMember.guild.roles.fetch(differenceId) as Role;
      // log.debug(F, `${newMember.displayName} ${action} ${roleName}`);

      // const userInfo = await getUserInfo(newMember.id);
      const auditlog = client.channels.cache.get(env.CHANNEL_AUDITLOG) as TextChannel;
      await auditlog.send(`${newMember.displayName} ${action} ${role.name}`);

      // Check if the role added was a donator role
      if (role.id === env.ROLE_BOOSTER && action === 'added') {
        // log.debug(F, `${newMember.displayName} boosted the server!`);
        const channelGoldlounge = client.channels.cache.get(env.CHANNEL_GOLDLOUNGE) as TextChannel;
        await channelGoldlounge.send(`${newMember.displayName} boosted the server! Thanks for helping make this place awesome!`); // eslint-disable-line max-len
      }

      // Check if the role added was a donator role
      if (role.id === env.ROLE_PATRON && action === 'added') {
        // log.debug(F, `${newMember.displayName} became a patron!`);
        const channelGoldlounge = client.channels.cache.get(env.CHANNEL_GOLDLOUNGE) as TextChannel;
        await channelGoldlounge.send(`${newMember.displayName} became a patron! Thanks for helping us to keep the lights on!`); // eslint-disable-line max-len
      }
    }
  },
};
