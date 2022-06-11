'use strict';

const ms = require('ms');
const logger = require('./logger');
const { getUserInfo, setUserInfo } = require('./firebase');
const template = require('./embed-template');

const {
  discordGuildId,
  roleNeedshelpId,
  roleAdminId,
  roleDiscordopId,
  roleIrcopId,
  roleModeratorId,
  roleTripsitterId,
  roleTeamtripsitId,
  roleTripbot2Id,
  roleTripbotId,
  roleBotId,
  roleDeveloperId,
  roleTreeId,
  roleSproutId,
  roleSeedlingId,
  roleBoosterId,
  roleRedId,
  roleOrangeId,
  roleYellowId,
  roleGreenId,
  roleBlueId,
  rolePurpleId,
  rolePinkId,
  roleBrownId,
  roleBlackId,
  roleWhiteId,
  roleDrunkId,
  roleHighId,
  roleRollingId,
  roleTrippingId,
  roleDissociatingId,
  roleStimmingId,
  roleNoddingId,
  roleSoberId,
} = require('../../env');

const teamRoles = [
  roleAdminId,
  roleDiscordopId,
  roleIrcopId,
  roleModeratorId,
  roleTripsitterId,
  roleTeamtripsitId,
  roleTripbot2Id,
  roleTripbotId,
  roleBotId,
  roleDeveloperId,
  roleTreeId,
  roleSproutId,
  roleSeedlingId,
  roleBoosterId,
];

const colorRoles = [
  roleTreeId,
  roleSproutId,
  roleSeedlingId,
  roleBoosterId,
  roleRedId,
  roleOrangeId,
  roleYellowId,
  roleGreenId,
  roleBlueId,
  rolePurpleId,
  rolePinkId,
  roleBrownId,
  roleBlackId,
  roleWhiteId,

];

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

const ignoredRoles = `${teamRoles},${colorRoles},${mindsetRoles}`;

const PREFIX = require('path').parse(__filename).name; // eslint-disable-line

module.exports = {
  runTimer(client) {
    logger.debug(`[${PREFIX}] started!`);
    let i = 0;
    function checkTimers(c) {
      i += 1;
      setTimeout(
        async () => {
          logger.debug(`[${PREFIX}] iteration ${i}`);
          const now = Date.now();
          // logger.debug(`[${PREFIX}] now: ${now}`);
          // global.userDb.forEach(async doc => {
          // eslint-disable-next-line
          for (const doc of global.userDb) {
            if (doc.value.reminders) {
              if (Object.keys(doc.value.reminders).length > 0) {
                // Loop over doc.value.reminders keys
                // Object.keys(doc.value.reminders).forEach(async reminderDate => {
                // eslint-disable-next-line
                for (const reminderDate of Object.keys(doc.value.reminders)) {
                  // logger.debug(`[${PREFIX}] user_fb_id: ${user_fb_id}`);
                  const userid = doc.value.discord.id;
                  // logger.debug(`[${PREFIX}] userid: ${userid}`);
                  const reminderTime = reminderDate.seconds * 1000
                    || new Date(reminderDate);
                  const timeBetween = reminderTime - now;
                  logger.debug(`[${PREFIX}] ${doc.value.accountName} has a reminder in ${ms(timeBetween, { long: true })}`);
                  const reminder = doc.value.reminders[reminderDate];
                  if (reminderTime <= now) {
                    logger.debug(`[${PREFIX}] Sending reminder to ${userid}`);

                    // Get the guild
                    const guildTripsit = client.guilds.cache.get(discordGuildId);
                    // logger.debug(`[${PREFIX}] guildTripsit: ${guildTripsit}`);

                    // Get the memeber from the guild
                    logger.debug(`[${PREFIX}] userid: ${userid}`);
                    // logger.debug(`[${PREFIX}] typeof userid: ${typeof userid}`);
                    let member = {};
                    try {
                      // logger.debug(`
                      // [${PREFIX}] Getting member ${userid} from guild ${guildTripsit.name}`);
                      // eslint-disable-next-line
                      member = await guildTripsit.members.fetch(userid);
                    } catch (err) {
                      logger.info(`[${PREFIX}] Error getting member ${userid} from guild ${guildTripsit.name}, did they quit?`);
                      // logger.debug(err);
                      try {
                        // logger.debug(`[${PREFIX}] Getting user ${userid} object`);
                        // eslint-disable-next-line
                        member = await client.users.fetch(userid);
                      } catch (err2) {
                        logger.debug(`[${PREFIX}] Error getting user ${userid} object`);
                        // logger.debug(err2);
                        return;
                      }
                    }
                    // logger.debug(`[${PREFIX}] member: ${member}`);

                    // Extract actor data
                    // eslint-disable-next-line
                    const [actorData, actorFbid] = await getUserInfo(member);

                    // Transform actor data
                    delete actorData.reminders[reminderDate];

                    const reminderEmbed = template.embedTemplate()
                      .setTitle('Reminder!')
                      .setDescription(`${reminder}`);
                    member.send({ embeds: [reminderEmbed] });

                    // // Load actor data
                    setUserInfo(actorFbid, actorData);

                    const userDb = [];
                    global.userDb.forEach(subDoc => {
                      if (subDoc.key === actorFbid) {
                        userDb.push({
                          key: subDoc.key,
                          value: actorData,
                        });
                        logger.debug(`[${PREFIX}] Updated actor in userDb`);
                      } else {
                        userDb.push({
                          key: subDoc.key,
                          value: subDoc.value,
                        });
                      }
                    });
                    Object.assign(global, { userDb });
                    logger.debug(`[${PREFIX}] Updated global user data.`);
                  }
                }
              }
            }
            if (doc.value.discord) {
              const discordData = doc.value.discord;
              if (discordData.lastHelpedThreadId) {
                logger.debug(`[${PREFIX}] ${discordData.username} processing!`);

                // Get the guild
                const guildTripsit = client.guilds.cache.get(discordGuildId);
                // logger.debug(`[${PREFIX}] guildTripsit: ${guildTripsit}`);

                // Get the memeber from the guild
                let member = {};
                try {
                  // logger.debug(`[${PREFIX}] Getting member ${discordData.id}
                  // from guild ${guildTripsit.name}`);
                  // eslint-disable-next-line
                  member = await guildTripsit.members.fetch(discordData.id);
                } catch (err) {
                  logger.info(`[${PREFIX}] Error getting member ${discordData.id} from guild ${guildTripsit.name}, did they quit?`);
                  // logger.debug(err);
                  try {
                    // logger.debug(`[${PREFIX}] Getting user ${discordData.id} object`);
                    // eslint-disable-next-line
                    member = await client.users.fetch(discordData.id);
                  } catch (err2) {
                    logger.debug(`[${PREFIX}] Error getting user ${discordData.id} object`);
                    logger.debug(err2);
                    return;
                  }
                }
                // logger.debug(`[${PREFIX}] member: ${member}`);

                // Get the role from the guild
                const roleNeedshelp = guildTripsit.roles.cache.get(roleNeedshelpId);
                // logger.debug(`[${PREFIX}] roleNeedshelp: ${roleNeedshelp.name}`);

                // logger.debug(`[${PREFIX}] lastHelpedThreadId:
                // ${discordData.lastHelpedThreadId}`);
                let channelHelp = {};
                try {
                  // eslint-disable-next-line
                  channelHelp = await guildTripsit.channels.fetch(
                    discordData.lastHelpedThreadId,
                  );
                } catch (err) {
                  logger.info(`[${PREFIX}] Error getting help channel ${discordData.lastHelpedThreadId}, was the channnel deleted?`);
                  // logger.debug(err);
                }
                // logger.debug(`[${PREFIX}] channelHelp: ${channelHelp}`);

                // logger.debug(`[${PREFIX}] lastHelpedThreadId:
                // ${discordData.lastHelpedMetaThreadId}`);
                let channelMeta = {};
                try {
                  // eslint-disable-next-line
                  channelMeta = await guildTripsit.channels.fetch(
                    discordData.lastHelpedMetaThreadId,
                  );
                } catch (err) {
                  logger.info(`[${PREFIX}] Error getting meta channel ${discordData.lastHelpedMetaThreadId}, was the channnel deleted?`);
                  // logger.debug(err);
                }
                // logger.debug(`[${PREFIX}] channelMeta: ${channelMeta}`);

                const lastHelped = discordData.lastHelpedDate.seconds * 1000
                  || new Date(discordData.lastHelpedDate);
                // logger.debug(`[${PREFIX}] last: ${lastHelped}`);
                const yesterday = now - 86400000;
                // logger.debug(`[${PREFIX}] yest: ${yesterday}`);
                const lastWeek = now - 604800000;
                // logger.debug(`[${PREFIX}] week: ${yesterday}`);

                const timeBetween = now - lastHelped;
                const output = channelHelp.archived
                  ? `[${PREFIX}] ${discordData.username} was last helped ${ms(timeBetween, { long: true })} ago in an archived channel`
                  : `[${PREFIX}] ${discordData.username} was last helped ${ms(timeBetween, { long: true })} ago`;
                logger.debug(output);

                if (yesterday > lastHelped && !channelHelp.archived) {
                  try {
                    // Extract actor data
                    // eslint-disable-next-line
                    const [actorData] = await getUserInfo(member);

                    // For each role in targetRoles2, add it to the target
                    if (actorData.discord.roles) {
                      // actorData.discord.roles.forEach(roleName => {
                      // eslint-disable-next-line
                      for (const roleName of actorData.discord.roles) {
                        const roleObj = guildTripsit.roles.cache.find(r => r.name === roleName);
                        if (!ignoredRoles.includes(roleObj.id) && roleName !== '@everyone') {
                          logger.debug(`[${PREFIX}] Adding role ${roleObj.name} to ${member.user.username}`);
                          member.roles.add(roleObj);
                        }
                      }
                    }
                    member.roles.remove(roleNeedshelp);
                    logger.debug(`[${PREFIX}] Removed ${roleNeedshelp.name} from ${member.user.username}`);
                  } catch (err) {
                    logger.debug(`[${PREFIX}] Error removing role ${roleNeedshelp.name} from ${discordData.username}`);
                    // logger.debug(err);
                  }
                  try {
                    /* eslint-disable */
                    if (channelMeta && !channelMeta.archived) {
                      logger.debug(`[${PREFIX}] Archiving meta thread!`);
                      channelMeta.setArchived(true, 'Auto-archiving after 24 hours');
                    }
                  } catch (err) {
                    logger.debug(`[${PREFIX}] Error archiving meta channel ${discordData.lastHelpedMetaThreadId}`);
                    // logger.debug(err);
                  }
                  try {
                    if (channelHelp && !channelHelp.archived) {
                      logger.debug(`[${PREFIX}] Archiving thread!`);
                      channelHelp.setArchived(true, 'Auto-archiving after 24 hours');
                    }
                  } catch (err) {
                    logger.debug(`[${PREFIX}] Error archiving channel ${discordData.lastHelpedThreadId}`);
                    // logger.debug(err);
                  }
                }
                if (lastWeek > lastHelped) {
                  logger.debug(`[${PREFIX}] ${discordData.username} was last helped more than 7 days ago`);

                  // Extract actor data
                  const [actorData, actorFbid] = await getUserInfo(member);

                  // Transform actor data
                  actorData.discord.lastHelpedMetaThreadId = null;
                  actorData.discord.lastHelpedThreadId = null;

                  try {
                    /* eslint-disable */
                    if (channelMeta) {
                      logger.debug(`[${PREFIX}] Removing meta channel ${discordData.lastHelpedMetaThreadId}`);
                      channelMeta.delete();
                    }
                  } catch (err) {
                    logger.debug(`[${PREFIX}] Error deleting meta channel ${discordData.lastHelpedMetaThreadId}`);
                    // logger.debug(err);
                  }
                  try {
                    if (channelHelp) {
                      logger.debug(`[${PREFIX}] Removing thread ${discordData.lastHelpedThreadId}`);
                      channelHelp.delete();
                    }
                  } catch (err) {
                    logger.debug(`[${PREFIX}] Error deleting channel ${discordData.lastHelpedThreadId}`);
                    // logger.debug(err);
                  }

                  // Load actor data
                  setUserInfo(actorFbid, actorData);

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
              if (discordData.lastSetMindsetDate) {
                // logger.debug(`[${PREFIX}] Processing mindset on ${discordData.username}`);
                // logger.debug(`[${PREFIX}] now: ${now}`);

                const lastSetMindsetDate = discordData.lastSetMindsetDate.seconds * 1000
                  || new Date(discordData.lastSetMindsetDate);
                // logger.debug(`[${PREFIX}] lm2: ${lastSetMindsetDate}`);

                const lastSetMindset = discordData.lastSetMindset;
                // logger.debug(`[${PREFIX}] lms: ${lastSetMindset}`);

                const eightHoursAgo = now - 28800000;
                // logger.debug(`[${PREFIX}] 8hr: ${eightHoursAgo}`);

                const timeBetween = now - lastSetMindsetDate;
                logger.debug(`[${PREFIX}] ${discordData.username} added ${lastSetMindset} ${ms(timeBetween, { long: true })} ago`);

                if (eightHoursAgo > lastSetMindsetDate) {
                  logger.debug(`[${PREFIX}] ${discordData.username} added ${lastSetMindset} more than 8 hours ago`);

                  // Get the guild
                  const guildTripsit = client.guilds.cache.get(discordGuildId);
                  // logger.debug(`[${PREFIX}] guildTripsit: ${guildTripsit}`);

                  // Get the memeber from the guild
                  logger.debug(`[${PREFIX}] mem.id: ${discordData.id}`);
                  // logger.debug(`[${PREFIX}] typeof discordData.id: ${typeof discordData.id}`);
                  let member = {};
                  try {
                    // logger.debug(`[${PREFIX}] Getting member ${discordData.id} from guild ${guildTripsit.name}`);
                    member = await guildTripsit.members.fetch(discordData.id);
                  } catch (err) {
                    logger.info(`[${PREFIX}] Error getting member ${discordData.id} from guild ${guildTripsit.name}, did they quit?`);
                    // logger.debug(err);
                    try {
                      // logger.debug(`[${PREFIX}] Getting user ${discordData.id} object`);
                      member = await client.users.fetch(discordData.id);
                    } catch (err2) {
                      logger.debug(`[${PREFIX}] Error getting user ${discordData.id} object`);
                      // logger.debug(err2);
                      return;
                    }
                  }
                  // logger.debug(`[${PREFIX}] member: ${member}`);

                  // Extract actor data
                  const [actorData, actorFbid] = await getUserInfo(member);

                  // Transform actor data
                  actorData.discord.lastSetMindset = null;
                  actorData.discord.lastSetMindsetDate = null;

                  try {
                    // Get the role from the guild
                    logger.debug(`[${PREFIX}] Getting role ${lastSetMindset} from guild ${guildTripsit.name}`);
                    const roleMindset = guildTripsit.roles.cache.find(r => r.name === lastSetMindset);
                    logger.debug(`[${PREFIX}] roleMindset: ${roleMindset.name}`);
                    // Remove the role from the member
                    if (roleMindset) {
                      logger.debug(`[${PREFIX}] Removing role ${roleMindset.name} from ${discordData.username}`);
                      member.roles.remove(roleMindset);
                    }
                  } catch (err) {
                    logger.debug(`[${PREFIX}] Error removing role ${lastSetMindset} from ${discordData.username}`);
                    // logger.debug(err);
                  }

                  // Load actor data
                  setUserInfo(actorFbid, actorData);

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
          };
          checkTimers(c);
        },
        c,
      );
    }
    const seconds = 60;
    const repeat = seconds * 1000;
    checkTimers(repeat);

    logger.debug(`[${PREFIX}] finished!`);
  },
};
