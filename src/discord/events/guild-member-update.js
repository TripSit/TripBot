'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/logger');
const { getUserInfo, setUserInfo } = require('../../global/firebase');

const {
  discordGuildId,
  channelModlogId,
  roleDrunkId,
  roleHighId,
  roleRollingId,
  roleTrippingId,
  roleDissociatingId,
  roleStimmingId,
  roleNoddingId,
  roleSoberId,
} = require('../../../env');

const mindsetRoles = [
  roleDrunkId,
  roleHighId,
  roleRollingId,
  roleTrippingId,
  roleDissociatingId,
  roleStimmingId,
  roleNoddingId,
  roleSoberId,
];

// {
//   "guildId": "960606557622657026",
//   "joinedTimestamp": 1649096850692,
//   "premiumSinceTimestamp": null,
//   "nickname": null,
//   "pending": false,
//   "communicationDisabledUntilTimestamp": null,
//   "userId": "177537158419054592",
//   "avatar": null,
//   "displayName": "MoonBear",
//   "roles": [
//     "960606558071435314",
//     "960606558134362217",
//     "960606558050480151",
//     "960606558134362215",
//     "960606558109188097",
//     "960606558134362216",
//     "960606558134362214",
//     "960606557622657026"
//   ],
//   "avatarURL": null,
//   "displayAvatarURL": "https://cdn.discordapp.com/avatars/177537158419054592/6be89e31c477b7809a4b3351a060da61.webp"
// }

module.exports = {
  name: 'guildMemberUpdate',

  async execute(oldMember, newMember) {
    logger.debug(`[${PREFIX}] starting!`);
    // logger.debug(`[${PREFIX}] guildMemberUpdate`);
    // logger.debug(`${PREFIX} Member.guildId: ${newMember.guild.id}`);
    // logger.debug(`${PREFIX} discordGuildId: ${discordGuildId}`);
    // Only run this on TripSit
    if (newMember.guild.id.toString() === discordGuildId.toString()) {
      // logger.debug(`[${PREFIX}] Running on TripSit`);
      // logger.debug(`[${PREFIX}] oldMember: ${JSON.stringify(oldMember, null, 2)}`);
      // logger.debug(`[${PREFIX}] newMember: ${JSON.stringify(newMember, null, 2)}`);

      const oldRoles = oldMember.roles.cache.map(role => role.id);

      const newRoles = newMember.roles.cache.map(role => role.id);

      // If the oldRoles don't match the new roles
      if (oldRoles.toString() !== newRoles.toString()) {
        logger.debug(`[${PREFIX}] roles changed on ${newMember.displayName}!`);
        // logger.debug(`[${PREFIX}] oldRoles: ${oldRoles}`);
        // logger.debug(`[${PREFIX}] newRoles: ${newRoles}`);

        // Find the difference between the two arrays
        const rolesAdded = newRoles.filter(x => !oldRoles.includes(x));
        // logger.debug(`[${PREFIX}] roleAdded: ${rolesAdded}`);
        const rolesRemoved = oldRoles.filter(x => !newRoles.includes(x));
        // logger.debug(`[${PREFIX}] roleRemoved: ${rolesRemoved}`);

        // If you added/removed more than one role then it wasnt a mindset change, so ignore it
        if (rolesAdded.length > 1 || rolesRemoved.length > 1) { return; }

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
          .find(role => role.id === differenceId);

        logger.debug(`[${PREFIX}] ${newMember.displayName} ${action} ${differentRole.name} (${differentRole.id})`);

        // The following code only cares if you add a mindset role
        if (mindsetRoles.includes(differenceId)) {
          // Look up the role name
          const roleName = await newMember.guild.roles.fetch(differenceId).then(role => role.name);
          // logger.debug(`[${PREFIX}] ${newMember.displayName} ${action} ${roleName}`);

          // const userInfo = await getUserInfo(newMember.id);
          const channel = newMember.guild.channels.cache.get(channelModlogId);
          channel.send(`${newMember.displayName} ${action} ${roleName}`);

          // Extract actor data
          const [actorData, actorFbid] = await getUserInfo(newMember);

          // Transform actor data
          if (action === 'added') {
            if ('discord' in actorData) {
              actorData.discord.lastSetMindset = roleName;
              actorData.discord.lastSetMindsetDate = new Date();
            } else {
              actorData.discord = {
                lastSetMindset: roleName,
                lastSetMindsetDate: new Date(),
              };
            }
          } else if (action === 'removed') {
            if ('discord' in actorData) {
              if ('lastSetMindsetDate' in actorData.discord) {
                actorData.discord.lastSetMindsetDate = null;
                actorData.discord.lastSetMindset = null;
              }
            }
          }

          // Load actor data
          await setUserInfo(actorFbid, actorData);

          const userDb = [];
          global.userDb.forEach(doc => {
            if (doc.key === actorFbid) {
              userDb.push({
                key: doc.key,
                value: actorData,
              });
              logger.debug(`[${PREFIX}] Updated actor in userDb`);
            } else {
              userDb.push({
                key: doc.key,
                value: doc.value,
              });
            }
          });
          Object.assign(global, { userDb });
          logger.debug(`[${PREFIX}] Updated global user data.`);
        }
      }
    }
    // logger.debug(`[${PREFIX}] Done!`);
  },
};
