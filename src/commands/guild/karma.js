const fs = require('node:fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageButton } = require('discord.js');
const paginationEmbed = require('discordjs-button-pagination');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');
const { get_user_info } = require('../../utils/get-user-info');

const raw_topics = fs.readFileSync('./src/assets/karma_quotes.json');
const karma_quotes = JSON.parse(raw_topics);

const backButton = new MessageButton()
  .setCustomId('previousbtn')
  .setLabel('Previous')
  .setStyle('DANGER');

const forwardButton = new MessageButton()
  .setCustomId('nextbtn')
  .setLabel('Next')
  .setStyle('SUCCESS');

const buttonList = [
  backButton,
  forwardButton,
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('karma')
    .setDescription('Keep it positive please!')
    .addUserOption(option => option
      .setName('user')
      .setDescription('User to lookup!')),

  async execute(interaction) {
    let patient = interaction.options.getMember('user');
    if (!patient) { patient = interaction.member; }
    const patientData = get_user_info(patient)[0];

    const karma_received = patientData.karma_recieved;
    let karma_received_string = '';
    if (karma_received) {
      karma_received_string = Object.entries(karma_received).map(([key, value]) => `${value}: ${key}`).join('\n');
    } else {
      karma_received_string = 'Nothing, they are a blank canvas to be discovered!';
    }

    const { karma_given } = patientData;
    let karma_given_string = '';
    if (karma_given) {
      karma_given_string = Object.entries(karma_given).map(([key, value]) => `${value}: ${key}`).join('\n');
    } else {
      karma_given_string = 'Nothing, they are a wet paintbrush ready to make their mark!';
    }

    const book = [];
    const random_quoteA = karma_quotes[Math.floor(Math.random() * Object.keys(karma_quotes).length).toString()];
    const karma_received_embed = template.embedTemplate()
      .setTitle(`${patient.user.username}'s Karma Received`)
      .setDescription(`${karma_received_string}\n\n${random_quoteA}`);
    book.push(karma_received_embed);

    const random_quoteB = karma_quotes[Math.floor(Math.random() * Object.keys(karma_quotes).length).toString()];
    const karma_given_embed = template.embedTemplate()
      .setTitle(`${patient.user.username}'s Karma Given`)
      .setDescription(`${karma_given_string}\n\n${random_quoteB}`);
    book.push(karma_given_embed);

    paginationEmbed(interaction, book, buttonList);
    logger.debug(`[${PREFIX}] finished!`);
  },
};
