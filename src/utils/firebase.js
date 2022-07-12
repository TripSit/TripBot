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
      logger.debug(`[${PREFIX}] member.host: ${member.host}`);
      name = member.nick;
    } else if (member.user) {
      logger.debug(`[${PREFIX}] member.user: ${JSON.stringify(member.user, null, 2)}`);
      name = member.user.username;
    } else if (member.username) {
      logger.debug(`[${PREFIX}] member.username: ${member.username}`);
      name = member.username;
    }

    logger.debug(`[${PREFIX}] Looking up ${name}!`);
    let memberFbid = null;
    let memberData = {};
    let memberType = '';
    let memberAccount = '';
    let memberRole = '';
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
      logger.debug(`[${PREFIX}] member.host: ${typeof member.host}`);

      if (member.host.startsWith('tripsit')) {
        memberRole = member.host.split('/')[1];
        memberAccount = member.host.split('/')[2];
      }

      memberType = 'irc';
      // If the user is registered on IRC:
      memberData = {
        accountName: memberAccount || member.host,
        irc: {
          accountName: memberAccount || member.host,
          vhost: member.host,
          nickname: member.nick,
          role: memberRole,
        },
      };
    }

    // Find the user in the local DB
    // We use for..of here because it's syncronus and we want to wait for it to finish
    let dataFound = false;
    if (global.userDb) {
      // eslint-disable-next-line
      for (const doc of global.userDb) {
        if (memberType === 'discord') {
          if ('discord' in doc.value) {
            if (doc.value.discord.id === member.id.toString()) {
              logger.debug(`[${PREFIX}] Discord member data found!`);
              dataFound = true;
              memberData = doc.value;
              memberFbid = doc.key;
            }
          }
        }
        if (memberType === 'irc') {
          if ('irc' in doc.value) {
            if (doc.value.irc) {
              if (doc.value.irc.vhost) {
                // logger.debug(`[${PREFIX}] doc.value.irc.vhost: ${doc.value.irc.vhost}`);
                if (doc.value.irc.vhost === member.host) {
                  logger.debug(`[${PREFIX}] irc.vhost data found for ${member.host}!`);
                  // logger.debug(`[${PREFIX}] doc.value: ${JSON.stringify(doc.value, null, 2)}`);
                  dataFound = true;
                  memberData = doc.value;
                  memberFbid = doc.key;
                }
              }
            }
          }
        }
      }
    }

    // If the user isnt found above, query firebase
    if (!dataFound) {
      logger.warn(`[${PREFIX}] Local data not found, querying firebase!`);
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
            // logger.debug(`[${PREFIX}] Looking for where `);
            if (doc.data().irc) {
              if (doc.data().irc.vhost) {
                // logger.debug(`[${PREFIX}] doc.data().irc.vhost: ${doc.data().irc.vhost}`);
                if (doc.data().irc.vhost === member.host) {
                  logger.debug(`[${PREFIX}] Irc member data found (vhost)!`);
                  memberData = doc.data();
                  memberFbid = doc.id;
                }
              }
            }
          }
        });
      }
    }
    if (memberFbid === null) {
      logger.warn(`[${PREFIX}] Member not found, returning blank record!`);
    }
    return [memberData, memberFbid];
  },
  setUserInfo: async (fbid, data) => {
    logger.debug(`[${PREFIX}] Saving ${data.accountName}!`);

    if (fbid !== null && fbid !== undefined) {
      // logger.debug(`[${PREFIX}] Updating actor data`);
      try {
        await db.collection(firebaseUserDbName).doc(fbid).set(data);
        logger.debug(`[${PREFIX}] Updated FB data`);
        const userDb = [];
        global.userDb.forEach(doc => {
          if (doc.key === fbid) {
            userDb.push({
              key: doc.key,
              value: data,
            });
            // logger.debug(`[${PREFIX}] Updated actor in userDb`);
          } else {
            userDb.push({
              key: doc.key,
              value: doc.value,
            });
          }
        });
        Object.assign(global, { userDb });
        logger.debug(`[${PREFIX}] Updated global userDB.`);
      } catch (err) {
        logger.error(`[${PREFIX}] Error updating actor data: ${err}`);
      }
    } else {
      // logger.debug(`[${PREFIX}] Creating actor data`);
      try {
        await db.collection(firebaseUserDbName).doc().set(data);
        logger.debug(`[${PREFIX}] Created FB data`);
        const userDb = [];
        if (db !== undefined) {
          // Get user information
          const snapshotUser = await db.collection(firebaseUserDbName).get();
          snapshotUser.forEach(doc => {
            userDb.push({
              key: doc.id,
              value: doc.data(),
            });
          });
        }
        Object.assign(global, { userDb });
        // logger.debug(`[${PREFIX}] User database loaded.`);
        // logger.debug(`[${PREFIX}] userDb: ${JSON.stringify(global.userDb, null, 4)}`);
        logger.debug(`[${PREFIX}] Global User DB loaded!`);
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
      guild_owner_id: guild.discordOwnerId || 'No Owner',
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
