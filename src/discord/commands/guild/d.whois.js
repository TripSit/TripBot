'use strict';
const whois = require('../../../global/utils/whois');
const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');


const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whois')
    .setDescription('IRC whois')
    .addStringOption(option => option
      .setDescription('User to whois!')
      .setRequired(true)
      .setName('target')),

  async execute(interaction) {
    logger.debug(`[${PREFIX}] started!`);
    const target = interaction.options.getString('target');


    let body;

    try {
      body = await whois.whois(target);
    } catch (err) {
      const embed = template.embedTemplate()
        .setDescription(err.message)
        .setTitle(`Whois for ${target}`)
        .setColor(0x00FF00);
      interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
      return;
    }


    const embed = template.embedTemplate()
      .setDescription(body)
      .setTitle(`Whois for ${target}`)
      .setColor(0x00FF00);
    interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });

    logger.debug(`[${PREFIX}] finished!`);
  },
};
