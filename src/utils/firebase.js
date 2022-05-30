'use strict';

const path = require('path');
const logger = require('./logger');

const PREFIX = path.parse(__filename).name;

const { db } = global;
const {
  firebaseGuildDbName,
  firebaseUserDbName,
} = require('../../env');

module.exports = {
  getUserInfo: async member => {
    // logger.debug(`[${PREFIX}] Looking up member ${JSON.stringify(member, null, 2)}!`);
    let memberFbid = null;
    let memberData = {};
    let memberType = '';
    logger.debug(`[${PREFIX}] member.id: ${member.id}`);
    if (member.id) {
      logger.debug(`[${PREFIX}] Member is from Discord!`);
      memberType = 'discord';
      memberData = {
        name: member.user ? member.user.username : member.username,
        discord: {
          id: member.id.toString(),
          tag: member.user ? member.user.tag : member.tag,
          avatar: member.user ? member.user.avatarURL : member.avatarURL,
          username: member.user ? member.user.username : member.username,
          discriminator: member.user ? member.user.discriminator : member.discriminator,
        },
      };
    }
    logger.debug(`[${PREFIX}] member.host: ${member.host}`);
    if (member.host) {
      logger.debug(`[${PREFIX}] Member is from IRC!`);
      memberType = 'irc';
      memberData = {
        name: member.account,
        irc: {
          accountName: member.account,
          vhost: member.host,
          nickname: member.nickname,
        },
      };
    }

    if (db !== undefined) {
      logger.debug(`[${PREFIX}] firebaseUserDbName: ${firebaseUserDbName}`);
      const snapshotUser = await db.collection(firebaseUserDbName).get();
      await snapshotUser.forEach(doc => {
        if (memberType === 'discord') {
          if (doc.data().discord) {
            if (doc.data().discord.id === member.id.toString()) {
              logger.debug(`[${PREFIX}] Discord member data found!`);
              memberData = doc.data();
              memberFbid = doc.id;
              return;
            }
          }
        }
        if (memberType === 'irc') {
          if (doc.data().irc) {
            if (doc.data().irc.accountName === member.account) {
              logger.debug(`[${PREFIX}] Irc member data found!`);
              memberData = doc.data();
              memberFbid = doc.id;
            }
          }
        }
      });
    }
    return [memberData, memberFbid];
  },
  getGuildInfo: async guild => {
    logger.debug(`[${PREFIX}] Looking up guild ${guild}!`);
    let guildData = {
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
      modActions: {},
    };
    let guildFbid = null;
    // logger.debug(`[${PREFIX}] firebaseGuildDbName: ${firebaseGuildDbName}`);
    // logger.debug(`[${PREFIX}] guild.id: ${guild.id}`);
    if (db !== undefined) {
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
    }
    // logger.debug(`[${PREFIX}] guildData: ${JSON.stringify(guildData)}`);
    return [guildData, guildFbid];
  },
  setUserInfo: async (fbid, data) => {
    logger.debug(`[${PREFIX}] Saving ${data.discord.username}!`);

    if (fbid !== null && fbid !== undefined) {
      logger.debug(`[${PREFIX}] Updating actor data`);
      try {
        await db.collection(firebaseUserDbName).doc(fbid).set(data);
      } catch (err) {
        logger.error(`[${PREFIX}] Error updating actor data: ${err}`);
      }
    } else {
      logger.debug(`[${PREFIX}] Creating actor data`);
      try {
        await db.collection(firebaseUserDbName).doc().set(data);
      } catch (err) {
        logger.error(`[${PREFIX}] Error creating actor data: ${err}`);
      }
    }
  },
  setGuildInfo: async (fbid, data) => {
    logger.debug(`[${PREFIX}] Saving ${data.guild_name}!`);
    // logger.debug(`[${PREFIX}] fbid ${fbid}!`);

    if (fbid !== null && fbid !== undefined) {
      logger.debug(`[${PREFIX}] Updating guild data`);
      try {
        await db.collection(firebaseGuildDbName).doc(fbid).set(data);
      } catch (err) {
        logger.error(`[${PREFIX}] Error updating actor data: ${err}`);
      }
    } else {
      logger.debug(`[${PREFIX}] Creating guild data`);
      try {
        await db.collection(firebaseGuildDbName).doc().set(data);
      } catch (err) {
        logger.error(`[${PREFIX}] Error creating guild data: ${err}`);
      }
    }
  },
};
