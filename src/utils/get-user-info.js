'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('./logger');

module.exports = {
  getUserInfo(member) {
    logger.debug(`[${PREFIX}] Looking up member ${member}!`);
    let memberData = null;
    let memberFbid = '';
    global.user_db.forEach(doc => {
      if (doc.value.discord_id === member.id.toString()) {
        logger.debug(`[${PREFIX}] Member data found!`);
        memberData = doc.value;
        memberFbid = doc.key;
      }
    });
    if (!memberData) {
      logger.debug(`[${PREFIX}] No member data found, creating a blank one!`);
      memberData = {
        discord_username: member.user.username,
        discord_discriminator: member.user.discriminator,
        discord_id: member.id.toString(),
        karma_given: {},
        karma_received: {},
        mod_actions: {},
        roles: [],
        timezone: '',
      };
    }
    return [memberData, memberFbid];
  },

  getGuildInfo(guild) {
    logger.debug(`[${PREFIX}] Looking up guild ${guild}!`);
    let guildData = null;
    let guildFbid = '';
    global.user_db.forEach(doc => {
      if (doc.value.discord_id === guild.id.toString()) {
        guildData = doc.value;
        guildFbid = doc.key;
      }
    });

    if (!guildData) {
      logger.debug(`[${PREFIX}] No target data found, creating a blank one`);
      guildData = {
        guild_name: guildData.name,
        guild_id: guildData.id,
        guild_createdAt: guildData.createdAt,
        guild_joinedAt: guildData.joinedAt,
        guild_description: `${guildData.description || 'No description'}`,
        guild_member_count: guildData.memberCount,
        guild_owner_id: guildData.ownerId,
        guild_icon: guildData.iconURL(),
        guild_banned: false,
        guild_large: guildData.large,
        guild_nsfw: guildData.nsfwLevel,
        guild_partner: guildData.partnered,
        guild_preferredLocale: `${guildData.preferredLocale || 'No Locale'}`,
        guild_region: `${guildData.region || 'No region'}`,
        mod_actions: {},
      };
    }
    return [guildData, guildFbid];
  },
};
