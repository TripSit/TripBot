import {
  Client,
} from 'discord.js';
import env from './env.config';
import ms from 'ms';
import logger from './logger';
import {embedTemplate} from '../../discord/utils/embedTemplate';

const teamRoles = [
  env.ROLE_ADMIN,
  env.ROLE_DISCORDOP,
  env.ROLE_IRCOP,
  env.ROLE_MODERATOR,
  env.ROLE_TRIPSITTER,
  env.ROLE_TEAMTRIPSIT,
  env.ROLE_TRIPBOT2,
  env.ROLE_TRIPBOT,
  env.ROLE_BOT,
  env.ROLE_DEVELOPER,
  env.ROLE_TREE,
  env.ROLE_SPROUT,
  env.ROLE_SEEDLING,
  env.ROLE_BOOSTER,
];

const colorRoles = [
  env.ROLE_TREE,
  env.ROLE_SPROUT,
  env.ROLE_SEEDLING,
  env.ROLE_BOOSTER,
  env.ROLE_RED,
  env.ROLE_ORANGE,
  env.ROLE_YELLOW,
  env.ROLE_GREEN,
  env.ROLE_BLUE,
  env.ROLE_PURPLE,
  env.ROLE_PINK,
  // env.ROLE_BROWN,
  env.ROLE_BLACK,
  env.ROLE_WHITE,
];

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

const ignoredRoles = `${teamRoles},${colorRoles},${mindsetRoles}`;

  const PREFIX = require('path').parse(__filename).name; // eslint-disable-line

let seconds = 60;
if (env.NODE_ENV === 'development') {
  seconds = 5;
}

  type timerEntry = {
    type: 'reminder' | 'mindset' | 'helpthread'
    value: string
  }

/**
   * Template
   */
export async function runTimer() {
  logger.info(`[${PREFIX}] started!`);
  // eslint-disable-next-line
    let i = 0;
  /**
     *
     * @param {number} c how often to run the loop
     */
  function checkTimers(c:number) {
    i += 1;
    setTimeout(
        async () => {
          // logger.debug(`[${PREFIX}] iteration ${i}`);
          const now = Date.now();
          // logger.debug(`[${PREFIX}] now: ${now}`);
          // global.userDb.forEach(async doc => {
          if (Object.keys(global.userDb).length > 0) {
            // eslint-disable-next-line
              for (const userKey of Object.keys(global.userDb)) {
              if (global.userDb[userKey].reminders) {
                if (Object.keys(global.userDb[userKey].reminders).length > 0) {
                  // Loop over global.userDb[userKey].reminders keys
                  // Object.keys(global.userDb[userKey].reminders).forEach(async reminderDate => {
                  // eslint-disable-next-line
                    for (const reminderDate of Object.keys(global.userDb[userKey].reminders)) {
                    // logger.debug(`[${PREFIX}] user_fb_id: ${user_fb_id}`);
                    const userid = global.userDb[userKey].discord.id;
                    // logger.debug(`[${PREFIX}] userid: ${userid}`);
                    const reminderTime = reminderDate.seconds * 1000 ||
                        new Date(reminderDate);
                    const timeBetween = reminderTime - now;
                    logger.debug(`[${PREFIX}] ${userKey} has a reminder in ${ms(timeBetween, {long: true})}`);
                    const reminder = global.userDb[userKey].reminders[reminderDate];
                    if (reminderTime <= now) {
                      logger.debug(`[${PREFIX}] Sending reminder to ${userid}`);

                      // Get the guild
                      const guildTripsit = global.client.guilds.cache.get(DISCORD_GUILD_ID);
                      // logger.debug(`[${PREFIX}] guildTripsit: ${guildTripsit}`);

                      // Get the memeber from the guild
                      // logger.debug(`[${PREFIX}] userid: ${userid}`);
                      // logger.debug(`[${PREFIX}] typeof userid: ${typeof userid}`);
                      let member = {};
                      try {
                        // logger.debug(`
                        // [${PREFIX}] Getting member ${userid} from guild ${guildTripsit.name}`);
                        // eslint-disable-next-line
                          member = await guildTripsit.members.fetch(userid);
                      } catch (err) {
                        logger.debug(`[${PREFIX}] Error getting member ${userid} from guild ${guildTripsit.name}, did they quit? (A)`);
                        // Extract actor data
                        // eslint-disable-next-line
  
                        const {db} = global;
                        const ref = db.ref(`${FIREBASE_DB_USERS}/${userKey}`);
                        // eslint-disable-next-line
                          await ref.once('value', data => {
                          if (data.val() !== null) {
                            const actorData = data.val();

                            // Transform actor data
                            delete actorData.reminders[reminderDate];
                            try {
                              db.ref(FIREBASE_DB_USERS).update({
                                [userKey]: actorData,
                              });
                            } catch (error) {
                              logger.error(`[${PREFIX}] ${error}`);
                              logger.debug(`[${PREFIX}] id: ${userKey}`);
                              logger.debug(`[${PREFIX}] data: ${JSON.stringify(data, null, 4)}`);
                            }
                          }
                        });
                        // eslint-disable-next-line
                          continue;
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
                      member.send({embeds: [reminderEmbed]});

                      // // Load actor data
                      setUserInfo(actorFbid, actorData);
                    }
                  }
                }
              }
              if (global.userDb[userKey].discord) {
                const discordData = global.userDb[userKey].discord;
                if (discordData.communityMod) {
                  logger.debug(`[${PREFIX}] processing communityMod on ${discordData.username}!`);
                  // logger.debug(`[${PREFIX}] Processing communityMod on ${discordData.username}`);

                  const autoActionTime = new Date(discordData.communityMod.date.valueOf());
                  // logger.debug(`[${PREFIX}] autoActionTime: ${autoActionTime}`);

                  const autoActionName = discordData.communityMod.action;
                  // logger.debug(`[${PREFIX}] autoActionName: ${autoActionName}`);

                  const oneDayAgo = now - (1000 * 60 * 60 * 24);
                  // logger.debug(`[${PREFIX}] 24hr: ${oneDayAgo}`);

                  // const eightHoursAgo = now - 28800000 * 4;
                  // logger.debug(`[${PREFIX}] 8hr: ${eightHoursAgo}`);

                  const timeBetween = now - autoActionTime;
                  logger.debug(`[${PREFIX}] ${discordData.username} was ${autoActionName} ${ms(timeBetween, {long: true})} ago on ${autoActionTime}`);

                  if (oneDayAgo > autoActionTime) {
                    logger.debug(`[${PREFIX}] Added ${autoActionTime} more than 24 hours ago`);

                    // Get the guild
                    const guildTripsit = global.client.guilds.cache.get(DISCORD_GUILD_ID);
                    // logger.debug(`[${PREFIX}] guildTripsit: ${guildTripsit}`);

                    // Get the memeber from the guild
                    // logger.debug(`[${PREFIX}] mem.id: ${discordData.id}`);
                    // logger.debug(`[${PREFIX}] typeof discordData.id: ${typeof discordData.id}`);
                    let member = {};
                    try {
                      // eslint-disable-next-line
                        // logger.debug(`[${PREFIX}] Getting member ${discordData.id} from guild ${guildTripsit.name}`);
                      // eslint-disable-next-line
                        member = await guildTripsit.members.fetch(discordData.id);
                    } catch (err) {
                      logger.debug(`[${PREFIX}] Error getting member ${discordData.id} from guild ${guildTripsit.name}, did they quit? (B)`);

                      const {db} = global;
                      const ref = db.ref(`${FIREBASE_DB_USERS}/${userKey}`);
                      // eslint-disable-next-line
                        await ref.once('value', data => {
                        if (data.val() !== null) {
                          const actorData = data.val();

                          // Transform actor data
                          if (autoActionName === 'vote_ban') {
                            actorData.isBanned = true;
                          }
                          actorData.discord.communityMod = null;

                          // Load actor data
                          try {
                            db.ref(FIREBASE_DB_USERS).update({
                              [userKey]: actorData,
                            });
                          } catch (error) {
                            logger.error(`[${PREFIX}] ${error}`);
                            logger.debug(`[${PREFIX}] id: ${userKey}`);
                            logger.debug(`[${PREFIX}] data: ${JSON.stringify(data, null, 4)}`);
                          }
                        }
                      });
                      // eslint-disable-next-line
                        continue;
                    }
                    // logger.debug(`[${PREFIX}] member: ${member}`);

                    try {
                      if (autoActionName === 'vote_kick') {
                        logger.debug(`[${PREFIX}] Kicking ${discordData.username}`);
                        guildTripsit.members.kick(member, 'Auto-action: communityMod vote_kick');
                      } else if (autoActionName === 'vote_ban') {
                        logger.debug(`[${PREFIX}] Banning ${discordData.username}`);
                        guildTripsit.members.ban(member, {
                          days: 7,
                          reason: 'Auto-action: communityMod vote_ban',
                        });
                      }
                    } catch (err) {
                      logger.debug(`[${PREFIX}] Error ${autoActionName}`);
                      logger.debug(err);
                      return;
                    }

                    // Extract actor data
                    // eslint-disable-next-line
                      const [actorData, actorFbid] = await getUserInfo(member);

                    if (autoActionName === 'vote_ban') {
                      actorData.isBanned = true;
                    }

                    // Transform actor data
                    actorData.discord.communityMod = null;

                    // Load actor data
                    setUserInfo(actorFbid, actorData);
                  }
                }
                if (discordData.lastSetMindsetDate) {
                  // logger.debug(`[${PREFIX}] Processing
                  // lastSetMindsetDate on ${discordData.username}`);

                  const lastSetMindset = discordData.lastSetMindset;
                  // logger.debug(`[${PREFIX}] lms: ${lastSetMindset}`);

                  const eightHoursAgo = now - 28800000;
                  // logger.debug(`[${PREFIX}] 8hr: ${eightHoursAgo}`);

                  // logger.debug(`[${PREFIX}] discordData.lastSetMindsetDate:
                  // ${discordData.lastSetMindsetDate}`);

                  const lastSetMindsetDate = new Date(discordData.lastSetMindsetDate);
                  // logger.debug(`[${PREFIX}] lastSetMindsetDate: ${lastSetMindsetDate}`);

                  // if (!Number.isInteger(lastSetMindsetDate)) {
                  //   // Set lastSetMindsetDate to 7 days ago
                  //   lastSetMindsetDate = new Date(now - (1000 * 60 * 60 * 24 * 7)).valueOf();
                  // }
                  // logger.debug(`[${PREFIX}] lastSetMindsetDate B: ${lastSetMindsetDate}`);

                  const timeBetween = now - lastSetMindsetDate;
                  // logger.debug(`[${PREFIX}] Time between ${timeBetween}`);

                  try {
                    logger.debug(`[${PREFIX}] ${discordData.username} added ${lastSetMindset} ${ms(timeBetween, {long: true})} ago`);
                  } catch (err) {
                    logger.error(`[${PREFIX}] error: ${err}`);
                    logger.debug(`[${PREFIX}] Username: ${discordData.username}`);
                    logger.debug(`[${PREFIX}] lastSetMindsetDate: ${discordData.lastSetMindsetDate}`);
                    const {db} = global;
                    const ref = db.ref(`${FIREBASE_DB_USERS}/${userKey}`);
                    // eslint-disable-next-line
                      await ref.once('value', data => {
                      if (data.val() !== null) {
                        const actorData = data.val();

                        // Transform actor data
                        actorData.discord.lastSetMindset = null;
                        actorData.discord.lastSetMindsetDate = null;

                        // Load actor data
                        try {
                          db.ref(FIREBASE_DB_USERS).update({
                            [userKey]: actorData,
                          });
                        } catch (error) {
                          logger.error(`[${PREFIX}] ${error}`);
                          logger.debug(`[${PREFIX}] id: ${userKey}`);
                          logger.debug(`[${PREFIX}] data: ${JSON.stringify(data, null, 4)}`);
                        }
                      }
                    });
                  }

                  if (eightHoursAgo > lastSetMindsetDate) {
                    logger.debug(`[${PREFIX}] ${discordData.username} added ${lastSetMindset} more than 8 hours ago`);

                    // Get the guild
                    const guildTripsit = global.client.guilds.cache.get(DISCORD_GUILD_ID);
                    // logger.debug(`[${PREFIX}] guildTripsit: ${guildTripsit}`);

                    // Get the memeber from the guild
                    // logger.debug(`[${PREFIX}] mem.id: ${discordData.id}`);
                    // logger.debug(`[${PREFIX}] typeof discordData.id: ${typeof discordData.id}`);
                    let member = {};
                    try {
                      // eslint-disable-next-line
                        // logger.debug(`[${PREFIX}] Getting member ${discordData.id} from guild ${guildTripsit.name}`);
                      // eslint-disable-next-line
                        member = await guildTripsit.members.fetch(discordData.id);
                    } catch (err) {
                      logger.debug(`[${PREFIX}] Error getting member ${discordData.tag} from guild ${guildTripsit.name}, did they quit? (C)`);

                      const {db} = global;
                      const ref = db.ref(`${FIREBASE_DB_USERS}/${userKey}`);
                      // eslint-disable-next-line
                        await ref.once('value', data => {
                        if (data.val() !== null) {
                          const actorData = data.val();

                          // Transform actor data
                          actorData.discord.lastSetMindset = null;
                          actorData.discord.lastSetMindsetDate = null;

                          // Load actor data
                          try {
                            db.ref(FIREBASE_DB_USERS).update({
                              [userKey]: actorData,
                            });
                          } catch (error) {
                            logger.error(`[${PREFIX}] ${error}`);
                            logger.debug(`[${PREFIX}] id: ${userKey}`);
                            logger.debug(`[${PREFIX}] data: ${JSON.stringify(data, null, 4)}`);
                          }
                        }
                      });
                      // eslint-disable-next-line
                        continue;
                    }
                    // logger.debug(`[${PREFIX}] member: ${member}`);

                    try {
                      // Get the role from the guild
                      // logger.debug(`[${PREFIX}] Getting role
                      // ${lastSetMindset} from guild ${guildTripsit.name}`);
                      // eslint-disable-next-line
                        const roleMindset = guildTripsit.roles.cache.find(r => r.name === lastSetMindset);
                      logger.debug(`[${PREFIX}] roleMindset: ${roleMindset.name}`);
                      // Remove the role from the member
                      if (roleMindset) {
                        logger.debug(`[${PREFIX}] Removing role ${roleMindset.name} from ${discordData.username}`);
                        member.roles.remove(roleMindset);
                      }
                    } catch (err) {
                      logger.debug(`[${PREFIX}] Error removing role ${lastSetMindset} from ${discordData.username}`);
                      return;
                      // logger.debug(err);
                    }

                    // Extract actor data
                    // eslint-disable-next-line
                      const [actorData, actorFbid] = await getUserInfo(member);

                    // Transform actor data
                    delete actorData.discord.lastSetMindset;
                    delete actorData.discord.lastSetMindsetDate;

                    // Load actor data
                    setUserInfo(actorFbid, actorData);
                  }
                }
                if (discordData.lastHelpedThreadId) {
                  logger.debug(`[${PREFIX}] processing lastHelpedThreadId on ${discordData.username}!`);
                  // Get the guild
                  const guildTripsit = global.client.guilds.cache.get(DISCORD_GUILD_ID);
                  // logger.debug(`[${PREFIX}] guildTripsit: ${guildTripsit}`);

                  // Get the memeber from the guild
                  let member = {};
                  try {
                    // logger.debug(`[${PREFIX}] Getting member ${discordData.id}
                    // from guild ${guildTripsit.name}`);
                    // eslint-disable-next-line
                      member = await guildTripsit.members.fetch(discordData.id);
                  } catch (err) {
                    logger.debug(`[${PREFIX}] Error getting member ${discordData.id} from guild ${guildTripsit.name}, did they quit? (D)`);

                    const {db} = global;
                    const ref = db.ref(`${FIREBASE_DB_USERS}/${userKey}`);
                    // eslint-disable-next-line
                      await ref.once('value', data => {
                      if (data.val() !== null) {
                        const actorData = data.val();

                        // Transform actor data
                        delete actorData.discord.lastHelpedMetaThreadId;
                        delete actorData.discord.lastHelpedThreadId;
                        try {
                          db.ref(FIREBASE_DB_USERS).update({
                            [userKey]: actorData,
                          });
                        } catch (error) {
                          logger.error(`[${PREFIX}] ${error}`);
                          logger.debug(`[${PREFIX}] id: ${userKey}`);
                          logger.debug(`[${PREFIX}] data: ${JSON.stringify(data, null, 4)}`);
                        }
                      }
                    });
                    // eslint-disable-next-line
                      continue;
                  }
                  // logger.debug(`[${PREFIX}] member: ${member}`);

                  // Get the role from the guild
                  const roleNeedshelp = guildTripsit.roles.cache.get(ROLE_NEEDSHELP);
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
                    // logger.debug(`[${PREFIX}] Error getting help channel
                    // ${discordData.lastHelpedThreadId}, was the channnel deleted?`);
                    // logger.debug(err);
                  }
                  // logger.debug(`[${PREFIX}] channelHelp:
                  // ${JSON.stringify(channelHelp, null, 2)}`);

                  // logger.debug(`[${PREFIX}] lastHelpedThreadId:
                  // ${discordData.lastHelpedMetaThreadId}`);
                  let channelMeta = {};
                  try {
                    // eslint-disable-next-line
                      channelMeta = await guildTripsit.channels.fetch(
                        discordData.lastHelpedMetaThreadId,
                    );
                  } catch (err) {
                    // logger.debug(`[${PREFIX}] Error getting meta channel
                    // ${discordData.lastHelpedMetaThreadId}, was the channnel deleted?`);
                    // logger.debug(err);
                  }
                  // logger.debug(`[${PREFIX}] channelMeta: ${channelMeta}`);

                  const lastHelped = new Date(discordData.lastHelpedDate.valueOf());
                  // logger.debug(`[${PREFIX}] last: ${lastHelped}`);
                  const yesterday = now - 86400000;
                  // logger.debug(`[${PREFIX}] yest: ${yesterday}`);
                  const lastWeek = now - 604800000;
                  // logger.debug(`[${PREFIX}] week: ${yesterday}`);

                  const timeBetween = now - lastHelped;
                  let output = '';
                  if (channelHelp.id) {
                    try {
                      output = channelHelp.archived ?
                          `[${PREFIX}] ${discordData.username} was last helped ${ms(timeBetween, {long: true})} ago in an archived channel` :
                          `[${PREFIX}] ${discordData.username} was last helped ${ms(timeBetween, {long: true})} ago`;
                    } catch (err) {
                      logger.debug(`[${PREFIX}] Error getting time between lastHelped and now`);
                      logger.debug(err);
                      logger.debug(`[${PREFIX}] discordData: ${JSON.stringify(output, null, 2)}`);
                    }
                  } else {
                    // Extract actor data
                    // eslint-disable-next-line
                      const [actorData, actorFbid] = await getUserInfo(member);

                    // Transform actor data
                    delete actorData.discord.lastHelpedMetaThreadId;
                    delete actorData.discord.lastHelpedThreadId;

                    // Load actor data
                    setUserInfo(actorFbid, actorData);
                    logger.debug(`[${PREFIX}] Channel does not exist anymore, removed lastHelpedThreadId`);
                  }

                  // eslint-disable-next-line
                    if (yesterday > lastHelped && (Object.keys(channelHelp).length > 0 && !channelHelp.archived)) {
                    logger.debug(`[${PREFIX}] ${discordData.username} was last helped more than 24 hours ago`);
                    try {
                      // Extract actor data
                      // eslint-disable-next-line
                        const [actorData] = await getUserInfo(member);

                      // For each role in targetRoles2, add it to the target
                      if (actorData.discord.roles) {
                        // actorData.discord.roles.forEach(roleName => {
                        // eslint-disable-next-line
                          for (const roleName of actorData.discord.roles) {
                          const roleObj = guildTripsit.roles.cache.find((r) => r.name === roleName);
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
                          channelMeta.setArchived(true, 'Auto-archiving after 24 hours');
                          logger.debug(`[${PREFIX}] Archived meta thread!`);
                        }
                      } catch (err) {
                        logger.debug(`[${PREFIX}] Error archiving meta channel ${discordData.lastHelpedMetaThreadId}`);
                        // logger.debug(err);
                      }
                      try {
                        if (channelHelp && !channelHelp.archived) {
                          channelHelp.setArchived(true, 'Auto-archiving after 24 hours');
                          logger.debug(`[${PREFIX}] Archived thread!`);
                        }
                      } catch (err) {
                        logger.debug(`[${PREFIX}] Error archiving channel ${discordData.lastHelpedThreadId}`);
                        // logger.debug(err);
                      }
                    }
                    if (lastWeek > lastHelped) {
                      logger.debug(`[${PREFIX}] ${discordData.username} was last helped more than 7 days ago`);
  
                      try {
                        /* eslint-disable */
                        if (channelMeta) {
                          channelMeta.delete();
                          logger.debug(`[${PREFIX}] Removed meta channel ${discordData.lastHelpedMetaThreadId}`);
                        }
                      } catch (err) {
                        logger.debug(`[${PREFIX}] Error deleting meta channel ${discordData.lastHelpedMetaThreadId}`);
                        // logger.debug(err);
                      }
                      try {
                        if (channelHelp) {
                          channelHelp.delete();
                          logger.debug(`[${PREFIX}] Removed thread ${discordData.lastHelpedThreadId}`);
                        }
                      } catch (err) {
                        logger.debug(`[${PREFIX}] Error deleting channel ${discordData.lastHelpedThreadId}`);
                        // logger.debug(err);
                      }
  
                      // Extract actor data
                      const [actorData, actorFbid] = await getUserInfo(member);
  
                      // Transform actor data
                      delete actorData.discord.lastHelpedMetaThreadId;
                      delete actorData.discord.lastHelpedThreadId;
  
                      // Load actor data
                      setUserInfo(actorFbid, actorData);
                    }
                  }
                }
              };
            }
            checkTimers(c);
          },
          c,
        );
      }
      const repeat = seconds * 1000;
      checkTimers(repeat);
  };
  