'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageButton } = require('discord.js');
const paginationEmbed = require('discordjs-button-pagination');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');
const { getUserInfo } = require('../../utils/get-user-info');
const karmaQuotes = require('../../assets/karma_quotes.json');

const PREFIX = path.parse(__filename).name;

const buttonList = [
  new MessageButton().setCustomId('previousbtn').setLabel('Previous').setStyle('DANGER'),
  new MessageButton().setCustomId('nextbtn').setLabel('Next').setStyle('SUCCESS'),
];

function getRandomQuoteIndex() {
  return (Math.random() * Object.keys(karmaQuotes).length).toString();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('karma')
    .setDescription('Keep it positive please!')
    .addUserOption(option => option
      .setName('user')
      .setDescription('User to lookup!')),

  async execute(interaction) {
    const patient = interaction.options.getMember('user') || interaction.member;
    const patientData = getUserInfo(patient).at(0);

    let karmaReceivedString = '';
    if (patientData.karma_received) {
      karmaReceivedString = Object.entries(patientData.karma_received)
        .map(([key, value]) => `${value}: ${key}`).join('\n');
    } else karmaReceivedString = 'Nothing, they are a blank canvas to be discovered!';

    let karmaGivenString = '';
    if (patientData.karma_given) {
      karmaGivenString = Object.entries(patientData.karma_given)
        .map(([key, value]) => `${value}: ${key}`).join('\n');
    } else karmaGivenString = 'Nothing, they are a wet paintbrush ready to make their mark!';

    const book = [];
    const randomQuoteA = karmaQuotes[getRandomQuoteIndex()];
    const karmaReceivedEmbed = template.embedTemplate()
      .setTitle(`${patient.user.username}'s Karma Received`)
      .setDescription(`${karmaReceivedString}\n\n${randomQuoteA}`);
    book.push(karmaReceivedEmbed);

    const randomQuoteB = karmaQuotes[getRandomQuoteIndex()];
    const karmaGivenEmbed = template.embedTemplate()
      .setTitle(`${patient.user.username}'s Karma Given`)
      .setDescription(`${karmaGivenString}\n\n${randomQuoteB}`);
    book.push(karmaGivenEmbed);

    paginationEmbed(interaction, book, buttonList);
    logger.debug(`[${PREFIX}] finished!`);
  },
};
