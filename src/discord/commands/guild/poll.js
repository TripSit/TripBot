'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { stripIndents } = require('common-tags');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Creates a poll!')
    .addStringOption(option => option
      .setName('question')
      .setDescription('What do you want to ask?')
      .setRequired(true))
    .addStringOption(option => option
      .setName('options')
      .setDescription('CSV of options, EG: "Red, Blue, Green"')
      .setRequired(true)),
  async execute(interaction) {
    logger.debug(`[${PREFIX}] Starting!`);
    const question = interaction.options.getString('question');
    const optionsArray = interaction.options.getString('options').split(',');

    let body = stripIndents`
    > **${question}**`;
    // For each option in optionsArray, append to the body
    for (let i = 0; i < optionsArray.length; i += 1) {
      body += `\n${i + 1}. ${optionsArray[i].trim()}`;
    }

    await interaction.channel.send(body)
      .then(async msg => {
        // For each option in optionsArray, add a reaction
        for (let i = 0; i < optionsArray.length; i += 1) {
          /* eslint-disable no-await-in-loop */
          // This is fine cuz we're reacting in-order
          await msg.react(`${i + 1}`);
        }

        // for (let i = 0; i < optionsArray.length; i += 1) {
        //   await msg.react('1️⃣');
        // }
      });
    const embed = template.embedTemplate().setDescription('Poll created!');
    interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
    logger.debug(`[${PREFIX}] finished!`);
  },
};
