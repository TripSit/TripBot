'use strict';

const path = require('path');
const ms = require('ms');

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
  roleHelperId,
  roleNewbie,
  roleMutedId,
  roleTempvoiceId,
} = require('../../env');

const ignoredRoles = [
  roleNeedshelpId,
  roleHelperId,
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

    let messageChannelId = message.channel.id;
    let expType = '';
    // Check if the message.channe.id is in the list of tripsitter channels
    if (tripsitterChannels.includes(messageChannelId)
      || tripsitterChannels.includes(message.channel.parentId)) {
      logger.debug(`[${PREFIX}] Message sent in a tripsitter channel`);
      expType = 'tripsitter';
      messageChannelId = channelTripsitId;
    } else {
      logger.debug(`[${PREFIX}] Message sent in a non-tripsitter channel`);
      expType = 'general';
    }
    logger.debug(`[${PREFIX}] Experience type: ${expType}`);

    // Get user data
    const actor = message.author;
    const [actorData, actorFbid] = await getUserInfo(actor);

    // Transform guild data
    if ('discord' in actorData) {
      if ('messages' in actorData.discord) {
        const channelInfo = actorData.discord.messages[messageChannelId];

        actorData.discord.messages[messageChannelId] = {
          count: (channelInfo ? channelInfo.count : 0) + 1,
          lastMessageDate: message.createdTimestamp,
        };

        const minExp = 5;
        const maxExp = 10;
        const expPoints = Math.floor(Math.random() * minExp) + maxExp;
        if ('experience' in actorData.discord) {
          const currMessageDate = message.createdTimestamp;
          logger.debug(`[${PREFIX}] currMessageDate: ${currMessageDate}`);
          if (expType in actorData.discord.experience) {
            const lastMessageDate = actorData.discord.experience[expType].lastGivenKarma;
            logger.debug(`[${PREFIX}] lastMessageDate: ${lastMessageDate}`);
            const timeDiff = currMessageDate - lastMessageDate;
            logger.debug(`[${PREFIX}] Time difference: ${timeDiff}`);

            const bufferSeconds = 6;
            const bufferTime = bufferSeconds * 1000;

            // Make a list of experience points necessary to level up
            // If the time diff is over one bufferTime, increase the experience points
            if (timeDiff > bufferTime) {
              logger.debug(`[${PREFIX}] Time difference is over ${ms(bufferTime, { long: true })}`);
              const experienceData = actorData.discord.experience[expType];
              const newExperience = experienceData.expPoints + expPoints;
              let level = experienceData.level;
              const expToLevel = level * 100;
              if (newExperience > expToLevel) {
                logger.debug(`[${PREFIX}] New experience (${newExperience}) is over expToLevel (${expToLevel})`);
                const channelTripbotlogs = message.client.channels.cache.get(channelBotspamId);
                const embed = template.embedTemplate();
                embed.setDescription(`${actor.username} has leveled up to level ${level + 1}!`);
                channelTripbotlogs.send({ embeds: [embed], ephemeral: false });
                level += 1;
              }
              actorData.discord.experience[expType] = {
                level,
                expPoints: newExperience,
                lastGivenKarma: currMessageDate,
              };
              logger.debug(`[${PREFIX}] ${expPoints} experience points added to ${expType}`);
            }
          } else {
            actorData.discord.experience[expType] = {
              level: 1,
              expPoints,
              lastGivenKarma: currMessageDate,
            };
            logger.debug(`[${PREFIX}] ${expPoints} experience points added to ${expType}`);
          }
        } else {
          actorData.discord.experience = {
            [expType]: {
              level: 1,
              expPoints,
              lastGivenKarma: message.createdTimestamp,
            },
          };
        }
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
