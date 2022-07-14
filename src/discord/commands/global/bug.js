'use strict';

const path = require('path');
const { MessageActionRow, Modal, TextInputComponent } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');

const {
  discordOwnerId,
  roleDeveloperId,
  channelTripbotId,
} = require('../../../../env');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bug')
    .setDescription('Report a bug or other feedback to the bot dev team!'),
  async execute(interaction) {
    // Create the modal
    const modal = new Modal()
      .setCustomId('bugReportModal')
      .setTitle('Tripbot Bug Report');
    const bugReport = new TextInputComponent()
      .setCustomId('bugReport')
      .setLabel('What would you like to tell the bot dev team?')
      .setStyle('PARAGRAPH');
    // An action row only holds one text input, so you need one action row per text input.
    const firstActionRow = new MessageActionRow().addComponents(bugReport);
    // Add inputs to the modal
    modal.addComponents(firstActionRow);
    // Show the modal to the user
    await interaction.showModal(modal);
    logger.debug(`[${PREFIX}] finished!`);
  },
  async submit(interaction) {
    const username = `${interaction.user.username}#${interaction.user.discriminator}`;
    const guildMessage = `${interaction.guild.name ? ` in ${interaction.guild.name}` : 'DM'}`;

    const bugReport = interaction.fields.getTextInputValue('bugReport');
    logger.debug(`[${PREFIX}] bugReport:`, bugReport);

    const botOwner = interaction.client.users.cache.get(discordOwnerId);
    const botOwnerEmbed = template.embedTemplate()
      .setColor('RANDOM')
      .setDescription(`Hey ${botOwner.toString()},\n${username}${guildMessage} reports:\n${bugReport}`);
    botOwner.send({ embeds: [botOwnerEmbed] });

    const developerRole = interaction.guild.roles.cache.find(role => role.id === roleDeveloperId);
    const devChan = interaction.client.channels.cache.get(channelTripbotId);
    const devEmbed = template.embedTemplate()
      .setColor('RANDOM')
      .setDescription(`Hey ${developerRole.toString()}s, a user submitted a bug report:\n${bugReport}`);
    devChan.send({ embeds: [devEmbed] });

    const embed = template.embedTemplate()
      .setColor('RANDOM')
      .setTitle('Thank you!')
      .setDescription('I\'ve submitted this feedback to the bot owner. \n\nYou\'re more than welcome to join the TripSit server and speak to Moonbear directly if you want! Check the /contact command for more info.');
    if (!interaction.replied) {
      interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    } else {
      interaction.followUp({
        embeds: [embed],
        ephemeral: false,
      });
    }
  },
};
