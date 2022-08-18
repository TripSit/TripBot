'use strict';

const {
  Colors,
} = require('discord.js');
const PREFIX = require('path').parse(__filename).name;
const { stripIndents } = require('common-tags');
const logger = require('../../global/utils/logger');
const tripsitme = require('./tripsitme');
const tripsat = require('./tripsat');
const template = require('./embed-template');
const modmail = require('../commands/guild/modmail');
const ircButton = require('../commands/guild/prompt');
const { getUserInfo } = require('../../global/services/firebaseAPI');

const {
  discordGuildId,
  channelModeratorsId,
  roleMemberId,
  roleUnderbanId,
  channelGeneralId,
  channelStartId,
  channelIrcId,
  channelBotspamId,
  // channelTripsitId,
} = require('../../../env');

module.exports = {
  async execute(interaction, client) {
    const buttonID = interaction.customId;
    logger.debug(`[${PREFIX}] buttonID: ${buttonID}`);
    const command = client.commands.get(interaction.customId);
    if (command) {
      logger.debug(`[${PREFIX}] command: ${command}`);
    }
    const modChan = interaction.client.channels.cache.get(channelModeratorsId);

    if (buttonID === 'memberbutton') {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const memberRole = interaction.guild.roles.cache.find(role => role.id === roleMemberId);
      member.roles.add(memberRole);

      // Extract member data
      const [actorData] = await getUserInfo(member);

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
      let colorValue = Colors.Red;
      if (years > 0) {
        colorValue = Colors.White;
      } else if (years === 0 && months > 0) {
        colorValue = Colors.Purple;
      } else if (months === 0 && weeks > 0) {
        colorValue = Colors.Blue;
      } else if (weeks === 0 && days > 0) {
        colorValue = Colors.Green;
      } else if (days === 0 && hours > 0) {
        colorValue = Colors.Yellow;
      } else if (hours === 0 && minutes > 0) {
        colorValue = Colors.Orange;
      } else if (minutes === 0 && seconds > 0) { colorValue = Colors.Red; }
      // logger.debug(`[${PREFIX}] coloValue: ${colorValue}`);
      const channelGeneral = member.client.channels.cache.get(channelGeneralId);
      const channelStart = member.client.channels.cache.get(channelStartId);
      const channelTechhelp = member.client.channels.cache.get(channelIrcId);
      const channelBotspam = interaction.client.channels.cache.get(channelBotspamId);
      // const channelTripsit = member.client.channels.cache.get(channelTripsitId);
      const embed = template.embedTemplate()
        .setAuthor(null)
        .setColor(colorValue)
        .setThumbnail(member.user.displayAvatarURL())
        .setFooter(null)
      // .setTitle(`Welcome to TripSit ${member.user.username}!`)
      // .setTitle(`Welcome ${member.toString()} to TripSit ${member}!`)
        .setDescription(stripIndents`
                      **Please welcome ${member} to the guild!**
                      We're glad you're here and hope you enjoy your stay!
                      Check out ${channelStart} set your color and icon
                      Stay safe, be chill, have fun!`);
      if (actorData.inviteInfo) {
        embed.setFooter({ text: actorData.inviteInfo });
      }
      channelGeneral.send({ embeds: [embed] });
      interaction.reply({
        content: stripIndents`
      Awesome! This channel will disappear when you click away, before you go:
      If you want to talk to the team about /anything/ you can start a new thread in ${channelTechhelp}
      Go ahead and test out the bot in the ${channelBotspam} channel!
      Check out ${channelStart} set your color and icon!
      Or go say hi in ${channelGeneral}!
      That's all, have fun!
      `,
        ephemeral: true,
      });
    }

    if (buttonID === 'underban') {
      interaction.member.roles.add(
        interaction.guild.roles.cache.find(role => role.id === roleUnderbanId),
      );
    }

    if (buttonID === 'acknowledgebtn') {
      const embed = template.embedTemplate()
        .setColor(Colors.Green)
        .setDescription(`${interaction.user.username} has acknowledged their warning.`);
      modChan.send({ embeds: [embed] });
      interaction.reply('Thanks for understanding!');
      return;
    }

    if (buttonID === 'refusalbtn') {
      const guild = interaction.client.guilds.resolve(discordGuildId);
      logger.debug(guild);
      guild.members.ban(interaction.user, { days: 7, reason: 'Refused warning' });
      const embed = template.embedTemplate()
        .setColor(Colors.Red)
        .setDescription(`${interaction.user.username} has refused their warning and was banned.`);
      modChan.send({ embeds: [embed] });
      interaction.reply('Thanks for making this easy!');
      return;
    }

    if (buttonID === 'guildacknowledgebtn') {
      // Get the owner of the client
      await interaction.client.application.fetch();
      const botOwner = interaction.client.application.owner;
      logger.debug(`[${PREFIX}] bot_owner: ${botOwner}`);
      const embed = template.embedTemplate()
        .setColor(Colors.Green)
        .setDescription(`${interaction.user.username} has acknowledged their warning.`);
      botOwner.send({ embeds: [embed] });
      interaction.reply('Thanks for understanding!');
      return;
    }

    if (buttonID === 'warnbtn') {
      const embed = template.embedTemplate()
        .setColor(Colors.Red)
        .setDescription(`${interaction.user.username} has refused their warning and was banned.`);
      modChan.send({ embeds: [embed] });
      interaction.reply('Thanks for making this easy!');
      return;
    }

    if (buttonID === 'tripsitme') { return tripsitme.execute(interaction); }
    if (buttonID === 'tripsat') { return tripsat.execute(interaction); }
    if (buttonID === 'modmailTripsitter') { return modmail.modmailTripsitter(interaction); }
    // if (buttonID === 'modmailCommands') { return modmail.modmailCommands(interaction); }
    if (buttonID === 'modmailFeedback') { return modmail.modmailFeedback(interaction); }
    if (buttonID === 'modmailIrcissue') { return modmail.modmailIssue(interaction, 'irc'); }
    if (buttonID === 'modmailDiscordissue') { return modmail.modmailIssue(interaction, 'discord'); }
    if (buttonID === 'ircAppeal') { return ircButton.ircClick(interaction, 'ircAppeal'); }
    if (buttonID === 'ircConnect') { return ircButton.ircClick(interaction, 'ircConnect'); }
    if (buttonID === 'ircOther') { return ircButton.ircClick(interaction, 'ircOther'); }
    if (buttonID === 'discordIssue') { return ircButton.ircClick(interaction, 'discordIssue'); }

    if (!command) return;

    try {
      logger.debug(`[${PREFIX}] Executing command: ${command.name}`);
      command.execute(interaction);
    } catch (error) {
      logger.error(error);
      interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
