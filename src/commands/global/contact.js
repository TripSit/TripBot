'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('contact')
    .setDescription('How to contact TripSit!'),

  async execute(interaction) {
    const embed = template.embedTemplate()
      .setColor('DARK_BLUE')
      .setTitle('Contact TripSit')
      .setURL('https://tripsit.me/contact-us/')
      .setDescription(`
        This app is created by TripSit, an organisation which helps to provide factual information about
        drugs and how to reduce the harms involved in using them.
      `)
      .addFields(
        {
          name: 'Discord',
          value: '[Join our discord](http://discord.gg/TripSit)\nTalk to one of the admins.\nThis is the quickest/easiest way to get in contact with Moonbear (bot owner)',
        },
        { name: 'IRC', value: '[Webchat](http://chat.tripsit.me)' },
        { name: 'Bot Issues Email', value: 'discord_bot @ tripsit (dot) me' },
        { name: 'Drug Information Issues Email', value: 'content @ tripsit (dot) me' },
      )
      .setFooter({ text: 'Thanks for asking!' });
    if (!interaction.replied) {
      interaction.reply({
        embeds: [embed],
        ephemeral: false,
      });
    } else {
      interaction.followUp({
        embeds: [embed],
        ephemeral: false,
      });
    }

    logger.debug(`[${PREFIX}] finished!`);
  },
};
