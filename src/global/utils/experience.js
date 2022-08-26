'use strict';

const PREFIX = require('path').parse(__filename).name;
const { stripIndents } = require('common-tags');
const logger = require('./logger');
const template = require('../../discord/utils/embed-template');
const { getUserInfo, setUserInfo } = require('../services/firebaseAPI');

const {
  // DISCORD_GUILD_ID,
  channelTripbotlogsId,
  CHANNEL_TRIPSIT,
  channelSanctuaryId,
  channelTripsittersId,
  channelHowToTripsitId,
  channelDrugQuestionsId,
  channelOpentripsitId,
  channelOpentripsit1Id,
  channelOpentripsit2Id,
  channelClosedtripsitId,
  roleVipId,
  roleNeedshelpId,
  // roleHelperId,
  roleNewbie,
  roleMutedId,
  roleTempvoiceId,
  NODE_ENV,
  channelViploungeId,
} = require('../../../env');

const ignoredRoles = [
  roleNeedshelpId,
  roleNewbie,
  roleMutedId,
  roleTempvoiceId,
];

const tripsitterChannels = [
  CHANNEL_TRIPSIT,
  channelSanctuaryId,
  channelTripsittersId,
  channelHowToTripsitId,
  channelDrugQuestionsId,
  channelOpentripsitId,
  channelOpentripsit1Id,
  channelOpentripsit2Id,
  channelClosedtripsitId,
];

const tripsitterIrcChannels = [
  '#sanctuary',
  '#tripsitters',
  '#howtotripsit',
  '#drugquestions',
  '#opentripsit',
  '#tripsit',
  '#tripsit1',
  '#tripsit2',
  '#tripsit3',
];

// Define the time in between messages where exp will count
let bufferSeconds = 60;
if (NODE_ENV === 'development') {
  bufferSeconds = 1;
}

const botNicknames = [
  'TS',
  'tripbot',
  'TSDev',
  'TS1',
  'TSTelegram',
  'TSDiscord',
  'tripbot1',
  'TSDev1',
  'TS11',
  'TSTelegram1',
  'TSDiscord1',
  'Github',
];

module.exports = {
  async experience(message) {
    // if (message.guildId) {
    //   // If not in tripsit, ignore it
    //   if (message.guildId !== DISCORD_GUILD_ID) { return; }
    // }

    let actorDataUpdated = false;
    let actorPlatform = '';
    let actor = {};
    let messageChannelId = '';
    let expType = '';
    const discordClient = global.client;

    // logger.debug(`[${PREFIX}] message.member: ${JSON.stringify(message.member, null, 2)}`);

    // Determine the channel that was spoken in and type of experience to give
    if (message.member) {
      // Check if the user who sent this message is a guild user
      actorPlatform = 'discord';
      // Check if the user has an ignored role
      if (ignoredRoles.some(role => message.member.roles.cache.has(role))) {
        logger.debug(`[${PREFIX}] Message sent by a user with an ignored role`);
        return;
      }

      logger.debug(`[${PREFIX}] Message sent by ${message.author.username} in ${message.channel.name} on ${message.guild}`);
      actor = message.author;

      // Determine what kind of experience to give
      // Check if the message.channe.id is in the list of tripsitter channels
      if (tripsitterChannels.includes(message.channel.id)
        || tripsitterChannels.includes(message.channel.parentId)) {
        // logger.debug(`[${PREFIX}] Message sent in a tripsitter channel on discord`);
        expType = 'tripsitter';
      } else {
        // logger.debug(`[${PREFIX}] Message sent in a non-tripsitter channel`);
        expType = 'general';
      }
      messageChannelId = message.channel.id.toString().replace(/(\.|\$|#|\[|\]|\/)/g, '_');
    }

    if (!message.member) {
      // If the user is not a member of the guild, then this probably came from IRC
      actorPlatform = 'irc';
      // If the user isnt registered then don't give them experience
      // if (!message.host.startsWith('tripsit')) { return; }

      if (botNicknames.includes(message.nick)) {
        // logger.debug(`[${PREFIX}] ${message.nick} is a bot!`);
        return;
      }

      // const memberHost = message.host.split('/')[1];
      // logger.debug(`[${PREFIX}] ${message.nick}${memberHost
      // ? ` (${memberHost}) ` : ' '}said ${message.args[1]} in ${message.args[0]}`);
      actor = message;

      // Determine what kind of experience to give
      if (tripsitterIrcChannels.includes(message.args[0])) {
        logger.debug(`[${PREFIX}] Message sent in a tripsitter channel from IRC`);
        expType = 'tripsitter';
      } else {
        logger.debug(`[${PREFIX}] Message sent in a non-tripsitter channel from IRC`);
        expType = 'general';
      }
      messageChannelId = message.args[0].replace(/(\.|\$|#|\[|\]|\/)/g, '');
    }

    // logger.debug(`[${PREFIX}] expType: ${expType}`);
    // logger.debug(`[${PREFIX}] messageChannelId: ${messageChannelId}`);

    // Get random value between 15 and 25
    const expPoints = Math.floor(Math.random() * (25 - 15 + 1)) + 15;

    // Get user data
    const [actorData, actorFbid] = await getUserInfo(actor);

    let lastMessageDate = 0;
    try {
      lastMessageDate = new Date(actorData.experience[expType].lastMessageDate);
    } catch (e) {
      logger.debug(`[${PREFIX}] No lastMessageDate found for ${actor.username || actor.nick}`);
    }
    // logger.debug(`[${PREFIX}] lastMessageDate: ${lastMessageDate}`);

    const currMessageDate = message.createdTimestamp || Date.now();
    // logger.debug(`[${PREFIX}] currMessageDate: ${currMessageDate}`);

    const timeDiff = currMessageDate - lastMessageDate;
    // logger.debug(`[${PREFIX}] Time difference: ${timeDiff}`);

    const bufferTime = bufferSeconds * 1000;

    if ('experience' in actorData) {
      // If the user already has experience
      if (expType in actorData.experience) {
        // If the user already has this TYPE of experience
        if (timeDiff > bufferTime) {
          // If the time diff is over one bufferTime, increase the experience points
          const experienceData = actorData.experience[expType];

          let levelExpPoints = experienceData.levelExpPoints + expPoints;
          const totalExpPoints = experienceData.totalExpPoints + expPoints;

          let level = experienceData.level;
          const expToLevel = 5 * (level ** 2) + (50 * level) + 100;

          logger.debug(`[${PREFIX}] ${actor.username ? actor.username : actor.nick} (lv${level}) +${expPoints} ${expType} exp | TotalExp: ${totalExpPoints}, LevelExp: ${levelExpPoints}, ExpToLevel ${level + 1}: ${expToLevel}`);
          if (expToLevel < levelExpPoints) {
            logger.debug(`[${PREFIX}] ${actor.username ? actor.username : actor.nick} has leveled up to ${expType} level ${level + 1}!`);

            const embed = template.embedTemplate();
            embed.setDescription(`${actor.username ? actor.username : actor.nick} has leveled up to ${expType} level ${level + 1}!`);
            const channelTripbotlogs = discordClient.channels.cache.get(channelTripbotlogsId);
            channelTripbotlogs.send({ embeds: [embed], ephemeral: false });
            level += 1;
            levelExpPoints -= expToLevel;
          }
          actorData.experience[expType] = {
            level,
            levelExpPoints,
            totalExpPoints,
            lastMessageDate: currMessageDate,
            lastMessageChannel: messageChannelId,
          };
          actorDataUpdated = true;
          logger.debug(`[${PREFIX}] Exp update A (Increment)`);
        }
        if (actorData.experience.general) {
          // logger.debug(`[${PREFIX}] User has general experience`);
          if (actorData.experience.general.level >= 5) {
            // logger.debug(`[${PREFIX}] User is over level 5`);
            if (message.member) {
              // logger.debug(`[${PREFIX}] User is in the guild`);
              // Give the user the VIP role if they are level 5 or above
              const vipRole = message.guild.roles.cache.find(role => role.id === roleVipId);
              if (vipRole) {
                message.member.roles.add(vipRole);
                logger.debug(`[${PREFIX}] VIP role added`);
              }
              if (actorData.experience.introSent === 'impossible') {
                logger.debug(`[${PREFIX}] User has not been sent an intro yet`);

                const intro = stripIndents`
                  Hey there, thanks for chatting on the TripSit discord!

                  We reward people active on our discord with the "VIP" role 😎

                  This gives you some access to channels and features that are not open to everybody:
                  > If you're interested in voice chat you can open a new room by joining the 🔥│𝘾𝙖𝙢𝙥𝙛𝙞𝙧𝙚 𝙑𝘾!
                  > Want to help out in 🟢│tripsit? Read the ❗│how-to-tripsit room and become a Helper!
                  > We always welcome feedback on our development projects: review 🔋│dev-onboarding and become a Consultant!

                  Access to the notorious 🧐│gold-lounge can be yours by subscribing to our patreon! (https://www.patreon.com/tripsit)

                  Thanks again for being active, we couldn't exist without awesome members like you!
                `;
                message.member.send(intro);

                const channelViplounge = discordClient.channels.cache.get(channelViploungeId);
                channelViplounge.send(`Please welcome ${message.member.displayName} to the VIP lounge!`);
                actorData.experience.introSent = true;
                logger.debug(`[${PREFIX}] Intro sent`);
              }
            }
          }
        }
      } else {
        actorData.experience[expType] = {
          level: 0,
          levelExpPoints: expPoints,
          totalExpPoints: expPoints,
          lastMessageDate: currMessageDate,
          lastMessageChannel: messageChannelId,
        };
        actorDataUpdated = true;
        logger.debug(`[${PREFIX}] Exp update B (Update)`);
        logger.debug(`[${PREFIX}] ${expPoints} experience points added to ${expType}`);
      }
    } else {
      actorData.experience = {
        [expType]: {
          level: 0,
          levelExpPoints: expPoints,
          totalExpPoints: expPoints,
          lastMessageDate: currMessageDate,
          lastMessageChannel: messageChannelId,
        },
      };
      actorDataUpdated = true;
      logger.debug(`[${PREFIX}] Exp update C (Create)`);
    }

    if (actorPlatform === 'discord') {
      if ('discord' in actorData) {
        if ('messages' in actorData.discord) {
          if (timeDiff > bufferTime) {
            // Get channel info
            const channelInfo = actorData.discord.messages[messageChannelId];

            // Increment the message sent count and the last message date
            actorData.discord.messages[messageChannelId] = {
              count: (channelInfo ? channelInfo.count : 0) + 1,
              lastMessageDate: currMessageDate,
            };
            actorDataUpdated = true;
            logger.debug(`[${PREFIX}] Discord update A (Increment)`);
          }
        } else {
          actorData.discord.messages = {
            [messageChannelId]: {
              count: 1,
              lastMessage: currMessageDate,
            },
          };
          actorDataUpdated = true;
          logger.debug(`[${PREFIX}] Discord update B (Update)`);
        }
      } else {
        // logger.debug(`[${PREFIX}] Initializing discord data`);
        actorData.discord = {
          messages: {
            [messageChannelId]: {
              count: 1,
              lastMessage: currMessageDate,
            },
          },
        };
        actorDataUpdated = true;
        logger.debug(`[${PREFIX}] Discord update C (Create)`);
      }
    }

    if (actorPlatform === 'irc') {
      if ('irc' in actorData) {
        if ('messages' in actorData.irc) {
          if (timeDiff > bufferTime) {
            // Get channel info
            const channelInfo = actorData.irc.messages[messageChannelId];

            // Increment the message sent count and the last message date
            actorData.irc.messages[messageChannelId] = {
              count: (channelInfo ? channelInfo.count : 0) + 1,
              lastMessageDate: currMessageDate,
            };
            actorDataUpdated = true;
            logger.debug(`[${PREFIX}] IRC update A (Increment)`);
          }
        } else {
          // logger.debug(`[${PREFIX}] Initializing messages data`);
          actorData.irc.messages = {
            [messageChannelId]: {
              count: 1,
              lastMessage: currMessageDate,
            },
          };
          actorDataUpdated = true;
          logger.debug(`[${PREFIX}] IRC update B (Update)`);
        }
      } else {
        actorData.irc = {
          messages: {
            [messageChannelId]: {
              count: 1,
              lastMessage: currMessageDate,
            },
          },
        };
        actorDataUpdated = true;
        logger.debug(`[${PREFIX}] IRC update C (Create)`);
      }
    }

    // logger.debug(`[${PREFIX}] actorData: ${JSON.stringify(actorData, null, 2)}`);
    if (actorDataUpdated) {
      setUserInfo(actorFbid, actorData);
    }
  },
};
