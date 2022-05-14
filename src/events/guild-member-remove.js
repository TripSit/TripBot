'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger');
const template = require('../utils/embed-template');

const { guildId, channel_modlog: channelModlog } = process.env;

module.exports = {
  name: 'guildMemberRemove',

  async execute(member) {
    logger.debug(`[${PREFIX}] guildMemberRemove`);
    // logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}`);
    if (member.guild.id === guildId) {
      // console.log(member.joinedTimestamp);
      // console.log(Date.now());
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
      // logger.debug(`[${PREFIX}] diff: ${diff}`);
      // logger.debug(`[${PREFIX}] years: ${years}`);
      // logger.debug(`[${PREFIX}] months: ${months}`);
      // logger.debug(`[${PREFIX}] weeks: ${weeks}`);
      // logger.debug(`[${PREFIX}] days: ${days}`);
      // logger.debug(`[${PREFIX}] hours: ${hours}`);
      // logger.debug(`[${PREFIX}] minutes: ${minutes}`);
      // logger.debug(`[${PREFIX}] seconds: ${seconds}`);
      const embed = template.embedTemplate()
        .setColor('BLUE')
        .setDescription(`${member} has left the guild after\
                ${years > 0 ? `${years} years` : ''}\
                ${years === 0 && months > 0 ? `${months} months` : ''}\
                ${months === 0 && weeks > 0 ? `${weeks} weeks` : ''}\
                ${weeks === 0 && days > 0 ? `${days} days` : ''}\
                ${days === 0 && hours > 0 ? `${hours} hours` : ''}\
                ${hours === 0 && minutes > 0 ? `${minutes} minutes` : ''}\
                ${minutes === 0 && seconds > 0 ? `${seconds} seconds` : ''}`);
      try {
        const modlogChannel = await member.client.channels.cache.get(channelModlog);
        // logger.debug(`[${PREFIX}] channel_modlog_id: ${channel_modlog}`);
        // logger.debug(`[${PREFIX}] modlog_channel: ${modlog_channel}`);
        if (modlogChannel) {
          modlogChannel.send({ embeds: [embed] });
        }
      } catch (err) {
        logger.debug(`[${PREFIX}] Failed to send message, am i still in the tripsit guild?`);
      }
    }
  },
};
