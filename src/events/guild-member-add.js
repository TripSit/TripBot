'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger');
const template = require('../utils/embed-template');
const { TS_FLAME_URL } = require('../../env');

const { guildId } = process.env;
const welcomeChannelId = process.env.channel_welcome;
const channelStartId = process.env.channel_start;
const channelBotspamId = process.env.channel_botspam;
const channelTripsitId = process.env.channel_tripsit;
const channelIrcId = process.env.channel_irc;

module.exports = {
  name: 'guildMemberAdd',

  async execute(member, client) {
    // console.log('guildMemberAdd');
    // console.log(member);
    if (member.guild.id === guildId) {
      logger.info(`[${PREFIX}] ${member} joined guild: ${member.guild.name} (id: ${member.guild.id})`);

      // (*INVITE*) https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/tracking-used-invites.md
      /* Start *INVITE* code */
      // To compare, we need to load the current invite list.
      const newInvites = await member.guild.invites.fetch();
      // const mappedArray = newInvites.map((invite) => [invite.code, invite.uses]);
      // const newInvitesString = newInvites.map((value, key) => `${key} => ${value}`);
      // logger.debug(`[${PREFIX}] newInvites: ${newInvitesString}`);
      // This is the *existing* invites for the guild.
      const oldInvites = client.invites.get(member.guild.id);
      // const oldInvitesString = oldInvites.map((value, key) => `${key} => ${value}`);
      // logger.debug(`[${PREFIX}] oldInvites: ${oldInvitesString}`);
      // Look through the invites, find the one for which the uses went up.
      const invite = newInvites.find(i => i.uses > oldInvites.get(i.code));
      // logger.debug(`[${PREFIX}] invite: ${invite}`);
      // This is just to simplify the message being sent below (inviter doesn't have a tag property)
      let footerText = '';
      if (invite?.inviter) {
        const inviter = await client.users.fetch(invite.inviter.id);
        if (inviter) {
          footerText = `Joined via the link in ${invite.channel.name} (${invite.code}-${invite.uses}).`;
        }
      }

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
      // eslint-disable-next-line
      // const random_topic = topicsr[Math.floor(Math.random() * Object.keys(topics).length).toString()];
      const welcomeChannel = member.client.channels.cache.get(welcomeChannelId);
      const channelStart = member.client.channels.cache.get(channelStartId);
      const channelBotspam = member.client.channels.cache.get(channelBotspamId);
      const channelTripsit = member.client.channels.cache.get(channelTripsitId);
      const channelIrc = member.client.channels.cache.get(channelIrcId);
      logger.debug(`[${PREFIX}] channelBotspam:`, channelBotspam);
      const embed = template.embedTemplate()
        .setColor(colorValue)
        .setDescription(`Welcome to the TripSit Network ${member}!\n\n\
                We're a positive-enforced, harm-reduction space.\n\
                **If you need substance help, go to the ${channelTripsit} room and click the big red button!**\n\
                Try checking out ${channelStart} to set your interests and color!\n\
                Please use ${channelBotspam} to access the bot's commands!\n\
                If you have an IRC issue please make a new thread in ${channelIrc}!\n\
                Stay safe!\n`);
      if (footerText !== '') {
        embed.setFooter({
          text: footerText,
          iconURL: TS_FLAME_URL,
        });
      }
      welcomeChannel.send({ embeds: [embed] });
    }
  },
};
