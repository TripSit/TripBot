'use strict';

const PREFIX = require('path').parse(__filename).name;
const { stripIndents } = require('common-tags');
const logger = require('../utils/logger');
const template = require('../utils/embed-template');

const { guildId } = process.env;
const welcomeChannelId = process.env.channel_general;
const channelStartId = process.env.channel_start;
const channelTripsitId = process.env.channel_tripsit;

module.exports = {
  name: 'guildMemberAdd',

  async execute(member, client) {
    // logger.debug('guildMemberAdd');
    // logger.debug(member);
    if (member.guild.id === guildId) {
      logger.info(`[${PREFIX}] ${member} joined guild: ${member.guild.name} (id: ${member.guild.id})`);

      // (*INVITE*) https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/tracking-used-invites.md
      /* Start *INVITE* code */
      const cachedInvites = global.guildInvites.get(member.guild.id);
      const newInvites = await member.guild.invites.fetch();
      let footerText = '';
      try {
        const usedInvite = newInvites.find(inv => cachedInvites.get(inv.code) < inv.uses);
        logger.debug(`Cached ${[...cachedInvites.keys()]}`);
        logger.debug(`New ${[...newInvites.values()].map(inv => inv.code)}`);
        logger.debug(`Used ${usedInvite}`);
        logger.debug(`The code ${usedInvite.code} was just used by ${member.user.username}.`);
        if (usedInvite?.inviter) {
          const inviter = await client.users.fetch(usedInvite.inviter.id);
          if (inviter) {
            footerText = `Joined via the link in ${usedInvite.channel.name} (${usedInvite.code}-${usedInvite.uses}).`;
          }
        }
      } catch (err) {
        logger.debug(`OnGuildMemberAdd Error: ${err}`);
      }

      newInvites.each(inv => cachedInvites.set(inv.code, inv.uses));
      global.guildInvites.set(member.guild.id, cachedInvites);
      /* Start *INVITE* code */

      // NOTE: Can be simplified with luxon
      const diff = Math.abs(Date.now() - member.user.createdAt);
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
      let colorValue = 'RED';
      if (years > 0) {
        colorValue = 'WHITE';
      } else if (years === 0 && months > 0) {
        colorValue = 'PURPLE';
      } else if (months === 0 && weeks > 0) {
        colorValue = 'BLUE';
      } else if (weeks === 0 && days > 0) {
        colorValue = 'GREEN';
      } else if (days === 0 && hours > 0) {
        colorValue = 'YELLOW';
      } else if (hours === 0 && minutes > 0) {
        colorValue = 'ORANGE';
      } else if (minutes === 0 && seconds > 0) {
        colorValue = 'RED';
      }
      logger.debug(`[${PREFIX}] coloValue:`, colorValue);
      const welcomeChannel = member.client.channels.cache.get(welcomeChannelId);
      const channelStart = member.client.channels.cache.get(channelStartId);
      const channelTripsit = member.client.channels.cache.get(channelTripsitId);
      const embed = template.embedTemplate()
        .setAuthor({ name: '', iconURL: '', url: '' })
        .setColor(colorValue)
        .setThumbnail(member.user.displayAvatarURL())
        // .setTitle(`Welcome to TripSit ${member.user.username}!`)
        // .setTitle(`Welcome ${member.toString()} to TripSit ${member}!`)
        .setDescription(stripIndents`
                **Welcome to TripSit ${member}!**
                This is a positivity-enforced, drug-neutral, harm-reduction space.
                **If you need a tripsitter, click the button in ${channelTripsit}!**
                Check out ${channelStart} for more information, stay safe!`);

      if (footerText !== '') {
        embed.setFooter({
          text: footerText,
        });
      }
      welcomeChannel.send({ embeds: [embed] });
    }
  },
};
