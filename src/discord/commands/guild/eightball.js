'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');

const answers = [
  'It is certain',
  'It is decidedly so',
  'Without a doubt',
  'Yes definitely',
  'You may rely on it',
  'As I see it, yes',
  'Most likely',
  'Outlook good',
  'Yes',
  'Signs point to yes',
  'Reply hazy, try again',
  'Ask again later',
  'Better not tell you now',
  'Cannot predict now',
  'Concentrate and ask again',
  'Don\'t count on it',
  'My reply is no',
  'My sources say no',
  'Outlook not so good',
  'Very doubtfull',
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('magickball')
    .setDescription('Ask the magick 8-ball a question!')
    .addStringOption(option => option.setName('question')
      .setDescription('What is your question?')),
  async execute(interaction) {
    const question = interaction.options.getString('question');
    // Get a random answer from the list
    let response = `Magick 8-Ball Says: ${answers[Math.floor(Math.random() * answers.length)]}!`;

    if (question) {
      response = `${interaction.member} asks: ${question} \n\n ${response}`;
    }
    if (interaction.replied) interaction.followUp(response);
    else interaction.reply(response);
  },
};
