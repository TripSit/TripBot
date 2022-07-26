'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../../global/utils/logger');
// eslint-disable-next-line import/order
const PREFIX = require('path').parse(__filename).name;
const { MessageButton } = require('discord.js');
const paginationEmbed = require('discordjs-button-pagination');
const template = require('../../utils/embed-template');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get a list of available commands'),

  async execute(interaction) {
    const globalCommands = new Map();
    const guildCommands = new Map();

    const buttonList = [
      new MessageButton().setCustomId('previousbtn').setLabel('Previous').setStyle('DANGER'),
      new MessageButton().setCustomId('nextbtn').setLabel('Next').setStyle('SUCCESS'),
    ];

    interaction.client.commands.forEach(i => {
      if (interaction.client.commandScopes.get(i.data.name) === 'global') {
        if (typeof i.data.description === 'undefined') {
          globalCommands.set(i.data.name, 'No description available');
        } else {
          globalCommands.set(i.data.name, i.data.description);
        }
      } else if (typeof i.data.description === 'undefined') {
        guildCommands.set(i.data.name, 'No description available');
      } else {
        guildCommands.set(i.data.name, i.data.description);
      }
    });
  },
};
