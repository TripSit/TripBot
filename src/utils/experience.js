'use strict';

const path = require('path');

const template = require('./embed-template');
const logger = require('./logger');
const { getUserInfo, setUserInfo } = require('./firebase');

const PREFIX = path.parse(__filename).name;

const {
  channelBotspamId,
  channelTripsitId,
  channelSanctuaryId,
  channelTripsittersId,
  channelHowToTripsitId,
  channelDrugQuestionsId,
  channelOpentripsitId,
  roleNeedshelpId,
  // roleHelperId,
  roleNewbie,
  roleMutedId,
  roleTempvoiceId,
  NODE_ENV,
} = require('../../env');

const ignoredRoles = [
  roleNeedshelpId,
  roleNewbie,
  roleMutedId,
  roleTempvoiceId,
];

const tripsitterChannels = [
  channelTripsitId,
  channelSanctuaryId,
  channelTripsittersId,
  channelHowToTripsitId,
  channelDrugQuestionsId,
  channelOpentripsitId,
];

module.exports = {
  async experience(message) {
    logger.debug(`[${PREFIX}] Message sent by ${message.author.username} in ${message.channel.name} on ${message.guild}`);

    if (ignoredRoles.some(role => message.member.roles.cache.has(role))) {
      logger.debug(`[${PREFIX}] Message sent by a user with an ignored role`);
      return;
    }

    if (ignoredRoles.some(role => message.member.roles.cache.has(role))) {
      logger.debug(`[${PREFIX}] Message sent by a user with an ignored role`);
      return;
    }

    let messageChannelId = message.channel.id;
    let expType = '';
    // Check if the message.channe.id is in the list of tripsitter channels
    if (tripsitterChannels.includes(messageChannelId)
      || tripsitterChannels.includes(message.channel.parentId)) {
      // logger.debug(`[${PREFIX}] Message sent in a tripsitter channel`);
      expType = 'tripsitter';
      messageChannelId = channelTripsitId;
    } else {
      // logger.debug(`[${PREFIX}] Message sent in a non-tripsitter channel`);
      expType = 'general';
    }
    // logger.debug(`[${PREFIX}] Experience type: ${expType}`);

    // Get user data
    const actor = message.author;
    const [actorData, actorFbid] = await getUserInfo(actor);

    // Get random value between 15 and 25
    const expPoints = Math.floor(Math.random() * (25 - 15 + 1)) + 15;
    const currMessageDate = message.createdTimestamp;
    logger.debug(`[${PREFIX}] currMessageDate: ${currMessageDate}`);

    if ('experience' in actorData) {
      if (expType in actorData.experience) {
        const lastMessageDate = actorData.experience[expType].lastMessageDate;
        // logger.debug(`[${PREFIX}] lastMessageDate: ${lastMessageDate}`);
        const timeDiff = currMessageDate - lastMessageDate;
        // logger.debug(`[${PREFIX}] Time difference: ${timeDiff}`);

        // Define the time in between messages where exp will count
        let bufferSeconds = 60;
        if (NODE_ENV === 'development') {
          bufferSeconds = 1;
        }
        const bufferTime = bufferSeconds * 1000;

        // If the time diff is over one bufferTime, increase the experience points
        if (timeDiff > bufferTime) {
          const experienceData = actorData.experience[expType];
          let levelExpPoints = experienceData.levelExpPoints + expPoints;
          const totalExpPoints = experienceData.totalExpPoints + expPoints;

          let level = experienceData.level;
          const expToLevel = 5 * (level ** 2) + (50 * level) + 100;

          logger.debug(`[${PREFIX}] ${actor.username} (lv${level}) +${expPoints} ${expType} exp | TotalExp: ${totalExpPoints}, LevelExp: ${levelExpPoints}, ExpToLevel ${level + 1}: ${expToLevel}`);
          if (expToLevel < levelExpPoints) {
            logger.debug(`[${PREFIX}] ${actor.username} has leveled up to ${expType} level ${level + 1}!`);

            const embed = template.embedTemplate();
            embed.setDescription(`${actor.username} has leveled up to ${expType} level ${level + 1}!`);
            const channelTripbotlogs = message.client.channels.cache.get(channelBotspamId);
            channelTripbotlogs.send({ embeds: [embed], ephemeral: false });
            level += 1;
            levelExpPoints -= expToLevel;
          }
          actorData.experience[expType] = {
            level,
            levelExpPoints,
            totalExpPoints,
            lastMessageDate: currMessageDate,
          };
        }
      } else {
        actorData.experience[expType] = {
          level: 0,
          levelExpPoints: expPoints,
          totalExpPoints: expPoints,
          lastMessageDate: currMessageDate,
        };
        logger.debug(`[${PREFIX}] ${expPoints} experience points added to ${expType}`);
      }
    } else {
      actorData.experience = {
        [expType]: {
          level: 0,
          levelExpPoints: expPoints,
          totalExpPoints: expPoints,
          lastMessageDate: currMessageDate,
        },
      };
    }

    if ('discord' in actorData) {
      if ('messages' in actorData.discord) {
        // Get channel info
        const channelInfo = actorData.discord.messages[messageChannelId];

        // Increment the message sent count and the last message date
        actorData.discord.messages[messageChannelId] = {
          count: (channelInfo ? channelInfo.count : 0) + 1,
          lastMessageDate: message.createdTimestamp,
        };
      } else {
        logger.debug(`[${PREFIX}] Initializing messages data`);
        actorData.discord.messages = {
          [messageChannelId]: {
            count: 1,
            lastMessage: message.createdTimestamp,
          },
        };
      }
    } else {
      logger.debug(`[${PREFIX}] Initializing discord data`);
      actorData.discord = {
        messages: {
          [messageChannelId]: {
            count: 1,
            lastMessage: message.createdTimestamp,
          },
        },
      };
    }

    setUserInfo(actorFbid, actorData);
  },
};
