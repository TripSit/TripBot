'use strict';

const path = require('path');
const logger = require('./logger');

const PREFIX = path.parse(__filename).name;

const { db } = global;
const {
  firebaseTicketDbName,
  firebaseGuildDbName,
  firebaseUserDbName,
} = require('../../env');

module.exports = {
  getUserInfo: async member => {
    // logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}`);
    // {
    //   "nick": "Teknos",
    //   "user": "~teknos",
    //   "host": "tripsit/founder/Teknos",
    //   "realname": "Eric",
    //   "channels": [
    //   ],
    //   "server": "innsbruck.tripsit.me",
    //   "serverinfo": "TripSit IRC Private Jet Receipt Server",
    //   "operator": "Cantillating grace and they can't keep my pace",
    //   "idle": "0",
    //   "account": "Teknos",
    //   "accountinfo": "is logged in as"
    // }

    // {
    //   "nick": "Test",
    //   "user": "~Test",
    //   "host": "98.46.kp.sup",
    //   "realname": "Test @ Webchat",
    //   "channels": [
    //     "#sandbox"
    //   ],
    //   "server": "innsbruck.tripsit.me",
    //   "serverinfo": "TripSit IRC Private Jet Receipt Server",
    //   "idle": "0"
    // }
    let name = '';
    if (member.host) {
      logger.debug(`[${PREFIX}] member.host: ${JSON.stringify(member.host, null, 2)}`);
      name = member.nick;
    } else if (member.user) {
      logger.debug(`[${PREFIX}] member.user: ${JSON.stringify(member.user, null, 2)}`);
      name = member.user.username;
    } else if (member.username) {
      logger.debug(`[${PREFIX}] member.username: ${JSON.stringify(member.username, null, 2)}`);
      name = member.username;
    } else if (member.account) {
      logger.debug(`[${PREFIX}] member.account: ${JSON.stringify(member.account, null, 2)}`);
      name = member.account.name;
    }

    logger.debug(`[${PREFIX}] Looking up ${name}!`);
    let memberFbid = null;
    let memberData = {};
    let memberType = '';
    // If the member object has an ID value, then this is a message from discord
    if (member.id) {
      logger.debug(`[${PREFIX}] Member is from Discord!`);
      logger.debug(`[${PREFIX}] member.id: ${member.id}`);
      memberType = 'discord';
      memberData = {
        name: member.user ? member.user.username : member.username,
        discord: {
          id: member.id.toString(),
          tag: member.user ? member.user.tag : member.tag,
          username: member.user ? member.user.username : member.username,
          discriminator: member.user ? member.user.discriminator : member.discriminator,
        },
      };
    }
    // If the member object has a host value, then this is a message from IRC
    if (member.host) {
      logger.debug(`[${PREFIX}] Member is from IRC!`);
      logger.debug(`[${PREFIX}] member.host: ${member.host}`);

      memberType = 'irc';
      // If the user is registered on IRC:
      memberData = {
        accountName: member.account ? member.account : member.host,
        irc: {
          accountName: member.account ? member.account : null,
          vhost: member.host,
          nickname: member.nick,
        },
      };
    }

    if (db !== undefined) {
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
            if (doc.data().irc.accountName) {
              if (doc.data().irc.accountName === member.account) {
                logger.debug(`[${PREFIX}] IRC member data found!`);
                memberData = doc.data();
                memberFbid = doc.id;
              }
            } else if (doc.data().irc.vhost) {
              if (doc.data().irc.vhost === member.host) {
                logger.debug(`[${PREFIX}] Irc member data found!`);
                memberData = doc.data();
                memberFbid = doc.id;
              }
            }
          }
        }
      });
    }
    return [memberData, memberFbid];
  },
  setUserInfo: async (fbid, data) => {
    logger.debug(`[${PREFIX}] Saving ${data.accountName}!`);

    if (fbid !== null && fbid !== undefined) {
      // logger.debug(`[${PREFIX}] Updating actor data`);
      try {
        await db.collection(firebaseUserDbName).doc(fbid).set(data);
      } catch (err) {
        logger.error(`[${PREFIX}] Error updating actor data: ${err}`);
      }
    } else {
      // logger.debug(`[${PREFIX}] Creating actor data`);
      try {
        await db.collection(firebaseUserDbName).doc().set(data);
      } catch (err) {
        logger.error(`[${PREFIX}] Error creating actor data: ${err}`);
      }
    }
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
  getTicketInfo: async (id, type) => {
    logger.debug(`[${PREFIX}] Looking up ticket from ${type} ${id}!`);
    let ticketFbid = null;
    let ticketData = {};
    let ticketBlocked = false;

    if (db !== undefined) {
      const snapshotTicket = await db.collection(firebaseTicketDbName).get();
      await snapshotTicket.forEach(doc => {
        if (type === 'user') {
          if (doc.data().issueUser === id) {
            if (doc.data().issueStatus !== 'closed') {
              logger.debug(`[${PREFIX}] Ticket data found!`);
              ticketData = doc.data();
              ticketFbid = doc.id;
            }
            if (doc.data().issueStatus === 'blocked') {
              logger.debug(`[${PREFIX}] User is blocked!`);
              ticketBlocked = true;
            }
          }
        }
        if (type === 'channel') {
          if (doc.data().issueThread === id) {
            if (doc.data().issueStatus !== 'closed') {
              logger.debug(`[${PREFIX}] Ticket data found!`);
              ticketData = doc.data();
              ticketFbid = doc.id;
            }
            if (doc.data().issueStatus === 'blocked') {
              logger.debug(`[${PREFIX}] User is blocked!`);
              ticketBlocked = true;
            }
          }
        }
      });
    }
    if (ticketBlocked) { ticketData = 'blocked'; }
    return [ticketData, ticketFbid];
  },
  setTicketInfo: async (fbid, data) => {
    logger.debug(`[${PREFIX}] Saving ${data.issueUsername}!`);
    // logger.debug(`[${PREFIX}] fbid ${fbid}!`);

    if (fbid !== null && fbid !== undefined) {
      logger.debug(`[${PREFIX}] Updating ticket data`);
      try {
        await db.collection(firebaseTicketDbName).doc(fbid).set(data);
      } catch (err) {
        logger.error(`[${PREFIX}] Error updating ticket data: ${err}`);
      }
    } else {
      logger.debug(`[${PREFIX}] Creating ticket data`);
      try {
        await db.collection(firebaseTicketDbName).doc().set(data);
      } catch (err) {
        logger.error(`[${PREFIX}] Error creating ticket data: ${err}`);
      }
    }
  },
};
