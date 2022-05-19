'use strict';

const path = require('path');
const logger = require('./logger');
const tripsitme = require('./tripsitme');
const template = require('./embed-template');

const PREFIX = path.parse(__filename).name;

const {
  guildId,
  channel_moderators: channelModeratorsId,
} = process.env;

module.exports = {
  async execute(interaction, client) {
    const buttonID = interaction.customId;
    logger.debug(`[${PREFIX}] buttonID: ${buttonID}`);
    const command = client.commands.get(interaction.customId);
    logger.debug(`[${PREFIX}] command: ${command}`);
    const modChan = interaction.client.channels.cache.get(channelModeratorsId);

    if (buttonID === 'acknowledgebtn') {
      const embed = template.embedTemplate()
        .setColor('GREEN')
        .setDescription(`${interaction.user.username} has acknowledged their warning.`);
      modChan.send({ embeds: [embed] });
      interaction.reply('Thanks for understanding!');
      return;
    }

    if (buttonID === 'refusalbtn') {
      const guild = interaction.client.guilds.resolve(guildId);
      logger.debug(guild);
      guild.members.ban(interaction.user, { days: 7, reason: 'Refused warning' });
      const embed = template.embedTemplate()
        .setColor('RED')
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
        .setColor('GREEN')
        .setDescription(`${interaction.user.username} has acknowledged their warning.`);
      botOwner.send({ embeds: [embed] });
      interaction.reply('Thanks for understanding!');
      return;
    }

    if (buttonID === 'warnbtn') {
      const embed = template.embedTemplate()
        .setColor('RED')
        .setDescription(`${interaction.user.username} has refused their warning and was banned.`);
      modChan.send({ embeds: [embed] });
      interaction.reply('Thanks for making this easy!');
      return;
    }

    if (buttonID === 'tripsitme') {
      tripsitme.execute(interaction);
      return;
    }

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
