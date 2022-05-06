'use strict';

const path = require('path');
const logger = require('./logger');

const PREFIX = path.parse(__filename).name;

const { db } = global;
const {
  guild_db_name: guildDbName,
  users_db_name: usersDbName,
} = process.env;

module.exports = {
  getUserInfo: async member => {
    logger.debug(`[${PREFIX}] Looking up member ${member}!`);
    let memberData = null;
    let memberFbid = null;
    const snapshotUser = await db.collection(usersDbName).get();
    snapshotUser.forEach(doc => {
      if (doc.data().discord_id === member.id.toString()) {
        logger.debug(`[${PREFIX}] Member data found!`);
        memberData = doc.data();
        memberFbid = doc.id;
      }
    });
    if (!memberData) {
      logger.debug(`[${PREFIX}] No member data found, creating a blank one!`);
      memberData = {
        discord_username: member.user ? member.user.username : member.username,
        discord_discriminator: member.user ? member.user.discriminator : member.discriminator,
        discord_id: member.id.toString(),
        karma_given: {},
        karma_received: {},
        mod_actions: {},
        roles: [],
        timezone: '',
        birthday: [],
      };
    }
    return [memberData, memberFbid];
  },

  getGuildInfo: async guild => {
    logger.debug(`[${PREFIX}] Looking up guild ${guild}!`);
    let guildData = null;
    let guildFbid = null;
    const snapshotGuild = await db.collection(guildDbName).get();
    snapshotGuild.forEach(doc => {
      if (doc.data().discord_id === guild.id.toString()) {
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
        guild_description: `${guildData.description ? guildData.description : 'No description'}`,
        guild_member_count: guildData.memberCount,
        guild_owner_id: guildData.ownerId,
        guild_icon: guildData.iconURL(),
        guild_banned: false,
        guild_large: guildData.large,
        guild_nsfw: guildData.nsfwLevel,
        guild_partner: guildData.partnered,
        guild_preferredLocale: `${guildData.preferredLocale ? guildData.preferredLocale : 'No Locale'}`,
        guild_region: `${guildData.region ? guildData.region : 'No region'}`,
        mod_actions: {},
      };
    }
    return [guildData, guildFbid];
  },
};
