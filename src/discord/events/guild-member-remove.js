'use strict';

const {
  Colors,
} = require('discord.js');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');
const template = require('../utils/embed-template');
const { getUserInfo } = require('../../global/services/firebaseAPI');

const {
  DISCORD_GUILD_ID,
  CHANNEL_MODLOG,
} = require('../../../env');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    // Only run on Tripsit
    logger.debug(`[${PREFIX}] guild: ${member.guild.id}`);
    if (member.guild.id === DISCORD_GUILD_ID) {
      logger.debug(`[${PREFIX}] guildMemberRemove`);
      logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}`);

      // Extract member data
      const [actorData] = await getUserInfo(member);

      // Transform member data
      const joinedTimestamp = member.joinedTimestamp
        ? member.joinedTimestamp
        : actorData.joinedTimestamp;

      logger.debug(`[${PREFIX}] joinedTimestamp: ${joinedTimestamp}`);
      logger.debug(`[${PREFIX}] Date.now(): ${Date.now()}`);
      // display the difference between the two dates
      // NOTE: Can simplify with luxon
      const diff = Math.abs(Date.now() - member.joinedTimestamp);
      const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
      const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
      const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const embed = template.embedTemplate()
        .setColor(Colors.Blue)
        .setDescription(`${member} has left the guild after\
                ${years > 0 ? `${years} years` : ''}\
                ${years === 0 && months > 0 ? `${months} months` : ''}\
                ${months === 0 && weeks > 0 ? `${weeks} weeks` : ''}\
                ${weeks === 0 && days > 0 ? `${days} days` : ''}\
                ${days === 0 && hours > 0 ? `${hours} hours` : ''}\
                ${hours === 0 && minutes > 0 ? `${minutes} minutes` : ''}\
                ${minutes === 0 && seconds > 0 ? `${seconds} seconds` : ''}`);
      try {
        const channelModlog = await member.client.channels.cache.get(CHANNEL_MODLOG);
        if (channelModlog) {
          channelModlog.send({ embeds: [embed] });
        }
      } catch (err) {
        logger.debug(`[${PREFIX}] Failed to send message, am i still in the tripsit guild?`);
      }
    }
  },
};
