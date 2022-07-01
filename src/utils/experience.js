'use strict';

const path = require('path');

const template = require('./embed-template');
const logger = require('./logger');
const { getUserInfo, setUserInfo } = require('./firebase');

const PREFIX = path.parse(__filename).name;

const {
  discordGuildId,
  channelTripbotlogsId,
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
    // If not in tripsit, ignore it
    if (message.guildId !== discordGuildId) { return; }

    // Check if the user who sent this message is a guild user
    if (message.member) {
      if (ignoredRoles.some(role => message.member.roles.cache.has(role))) {
        logger.debug(`[${PREFIX}] Message sent by a user with an ignored role`);
        return;
      }
    }

    logger.debug(`[${PREFIX}] Message sent by ${message.author.username} in ${message.channel.name} on ${message.guild}`);

    let actor = message.author;

    // let targetFromIrc = null;
    // let targetFromDiscord = null;
    // let targetIsMember = null;

    // logger.debug(`[${PREFIX}] message.member: ${JSON.stringify(message.member, null, 2)}`);
    // If the user is not a member of the guild, then this probably came from IRC
    if (!message.member) {
      // Check if this message came from a tripsitting channel
      // If so, ignore it, cuz they're likely asking for help
      if (tripsitterChannels.includes(message.channel.id)
      || tripsitterChannels.includes(message.channel.parentId)) {
        logger.debug(`[${PREFIX}] Message sent in a tripsitter channel from IRC`);
        return;
      }

      // Do a whois on the user to get their account name
      let data = null;
      await global.ircClient.whois(message.author.username, async resp => {
        data = resp;
      });

      // This is a hack substanc3 helped create to get around the fact that the whois command
      // is asyncronous by default, so we need to make this syncronous
      while (data === null) {
          await new Promise(resolve => setTimeout(resolve, 100)); // eslint-disable-line
      }

      // logger.debug(`[${PREFIX}] data ${JSON.stringify(data, null, 2)}`);
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

      // Check if the user is FOUND on IRC, if not, ignore it
      if (!data.host) {
        logger.debug(`[${PREFIX}] ${message.author.username} not found on IRC, ignoring!`);
        return;
      }

      // Check if the user is REGISTERED on IRC, if not, ignore it
      // Disabling this because we need to know when the people last asking for help last talked
      // if (!data.account) {
      //   logger.debug(`[${PREFIX}] ${message.author.username} is not registered on IRC!`);
      //   return;
      // }

      // targetFromIrc = true;
      // targetFromDiscord = false;
      // targetIsMember = false;
      actor = data;
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
    logger.debug(`[${PREFIX}] Experience type: ${expType}`);

    // Get random value between 15 and 25
    const expPoints = Math.floor(Math.random() * (25 - 15 + 1)) + 15;
    const currMessageDate = message.createdTimestamp;
    logger.debug(`[${PREFIX}] currMessageDate: ${currMessageDate}`);

    // Get user data
    const [actorData, actorFbid] = await getUserInfo(actor);
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

          logger.debug(`[${PREFIX}] ${actor.username ? actor.username : actor.nick} (lv${level}) +${expPoints} ${expType} exp | TotalExp: ${totalExpPoints}, LevelExp: ${levelExpPoints}, ExpToLevel ${level + 1}: ${expToLevel}`);
          if (expToLevel < levelExpPoints) {
            logger.debug(`[${PREFIX}] ${actor.username} has leveled up to ${expType} level ${level + 1}!`);

            const embed = template.embedTemplate();
            embed.setDescription(`${actor.username} has leveled up to ${expType} level ${level + 1}!`);
            const channelTripbotlogs = message.client.channels.cache.get(channelTripbotlogsId);
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
        }
      } else {
        actorData.experience[expType] = {
          level: 0,
          levelExpPoints: expPoints,
          totalExpPoints: expPoints,
          lastMessageDate: currMessageDate,
          lastMessageChannel: messageChannelId,
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
          lastMessageChannel: messageChannelId,
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
