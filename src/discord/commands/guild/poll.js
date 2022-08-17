'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { stripIndents } = require('common-tags');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');

const PREFIX = path.parse(__filename).name;

const emojiDict = {
  1: '1️⃣',
  2: '2️⃣',
  3: '3️⃣',
  4: '4️⃣',
  5: '5️⃣',
  6: '6️⃣',
  7: '7️⃣',
  8: '8️⃣',
  9: '9️⃣',
};

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
    await interaction.deferReply({ ephemeral: true });
    const question = interaction.options.getString('question');
    const optionsArray = interaction.options.getString('options').split(',');

    if (optionsArray.length > 9) {
      await interaction.editReply('You can only have 9 options max!');
      return;
    }

    let body = '';
    for (let i = 0; i < optionsArray.length; i += 1) {
      body += `\n${i + 1}. ${optionsArray[i].trim()}`;
    }

    const pollEmbed = template.embedTemplate()
      .setAuthor(null)
      .setTitle(`**${question}**`)
      .setDescription(stripIndents`${body}`)
      .setFooter({ text: `*A poll by ${interaction.member.nickname}*` });

    await interaction.channel.send({ embeds: [pollEmbed], ephemeral: false })
      .then(async msg => {
        for (let i = 0; i < optionsArray.length; i += 1) {
          /* eslint-disable no-await-in-loop */
          await msg.react(emojiDict[i + 1]);
        }
      });

    await interaction.editReply('Done!');
    logger.debug(`[${PREFIX}] finished!`);
  },
};
