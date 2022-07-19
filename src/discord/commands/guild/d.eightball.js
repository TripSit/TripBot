'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const eightball = require('../../../global/utils/eightball');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('magickball')
    .setDescription('Ask the magick 8-ball a question!')
    .addStringOption(option => option.setName('question')
      .setDescription('What is your question?')),
  async execute(interaction) {
    const question = interaction.options.getString('question');
    // Get a random answer from the list
    let response = await eightball.eightball();
    if (question) {
      response = `${interaction.member} asks: ${question} \n\n ${response}`;
    }
    if (interaction.replied) interaction.followUp(response);
    else interaction.reply(response);
  },
};
