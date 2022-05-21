'use strict';

const path = require('path');
const logger = require('./logger');

const PREFIX = path.parse(__filename).name;

const { db } = global;
const {
  firebaseGuildDbName,
} = require('../../env');

module.exports = {
  getGuildInfo: async guild => {
    logger.debug(`[${PREFIX}] Looking up guild ${guild}!`);
    let guildData = null;
    let guildFbid = null;
    // logger.debug(`[${PREFIX}] firebaseGuildDbName: ${firebaseGuildDbName}`);
    // logger.debug(`[${PREFIX}] guild.id: ${guild.id}`);
    const snapshotGuild = await db.collection(firebaseGuildDbName).get();
    await snapshotGuild.forEach(doc => {
      if (doc.data().guild_id === guild.id.toString()) {
        logger.debug(`[${PREFIX}] Guild data found!`);
        // logger.debug(`[${PREFIX}] doc.data().guild_id: ${doc.data().guild_id}`);
        // logger.debug(`[${PREFIX}] doc.data(): ${JSON.stringify(doc.data())}`);
        guildData = doc.data();
        guildFbid = doc.id;
      }
    });

    // logger.debug(`[${PREFIX}] guildData: ${JSON.stringify(guildData)}`);

    if (!guildData) {
      logger.debug(`[${PREFIX}] No target data found, creating a blank one`);
      guildData = {
        guild_name: guild.name,
        guild_id: guild.id,
        guild_createdAt: guild.createdAt,
        guild_joinedAt: guild.joinedAt,
        guild_description: `${guild.description ? guild.description : 'No description'}`,
        guild_member_count: guild.memberCount,
        guild_owner_id: guild.discordOwnerId,
        guild_icon: guild.iconURL(),
        guild_banned: false,
        guild_large: guild.large,
        guild_nsfw: guild.nsfwLevel,
        guild_partner: guild.partnered,
        guild_preferredLocale: `${guild.preferredLocale ? guild.preferredLocale : 'No Locale'}`,
        guild_region: `${guild.region ? guild.region : 'No region'}`,
        mod_actions: {},
      };
    }
    return [guildData, guildFbid];
  },
};
