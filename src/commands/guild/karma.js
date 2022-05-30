'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageButton } = require('discord.js');
const paginationEmbed = require('discordjs-button-pagination');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');
const { getUserInfo } = require('../../utils/firebase');
const karmaQuotes = require('../../assets/karma_quotes.json');

const PREFIX = path.parse(__filename).name;

const buttonList = [
  new MessageButton().setCustomId('previousbtn').setLabel('Previous').setStyle('DANGER'),
  new MessageButton().setCustomId('nextbtn').setLabel('Next').setStyle('SUCCESS'),
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('karma')
    .setDescription('Keep it positive please!')
    .addUserOption(option => option.setName('user').setDescription('User to lookup!'))
    .addBooleanOption(option => option.setName('all').setDescription('Return all karma?')),
  async execute(interaction) {
    let actor = interaction.options.getMember('user');
    if (!actor) actor = interaction.member;
    let all = interaction.options.getBoolean('all');
    if (!all) all = false;

    // Extract actor data
    const [actorData] = await getUserInfo(actor);

    // Transform actor data
    let karmaReceivedString = '';
    const karmaReceived = actorData.discord.karma_received;
    if (karmaReceived) {
      logger.debug(`[${PREFIX}] karma_received: ${JSON.stringify(karmaReceived, null, 2)}`);
      if (all) {
        // sort karma_received by value and then turn it into a string
        const karmaReceivedSorted = Object.entries(karmaReceived).sort((a, b) => b[1] - a[1]);
        karmaReceivedString = karmaReceivedSorted.map(([key, value]) => `${key} — ${value}`).join('\n');
      } else {
        // Find 'ts_upvote' and 'ts_downvote' in the keys and then turn it into a string
        const karmaReceivedSorted = Object.entries(karmaReceived).sort((a, b) => b[1] - a[1]);
        const karmaReceivedFiltered = karmaReceivedSorted.filter(([key]) => key === '<:ts_voteup:958721361587630210>' || key === '<:ts_votedown:960161563849932892>');
        karmaReceivedString = karmaReceivedFiltered.map(([key, value]) => `${key} — ${value}`).join('\n');
      }
    } else {
      karmaReceivedString = 'Nothing, they are a blank canvas to be discovered!';
    }

    let karmaGivenString = '';
    const karmaGiven = actorData.discord.karma_given;
    if (karmaGiven) {
      logger.debug(`[${PREFIX}] karmaGiven: ${JSON.stringify(karmaGiven, null, 2)}`);
      if (all) {
        // sort karmaGiven by value and then turn it into a string
        const karmaGivenSorted = Object.entries(karmaGiven).sort((a, b) => b[1] - a[1]);
        karmaGivenString = karmaGivenSorted.map(([key, value]) => `${key} — ${value}`).join('\n');
      } else {
        // Find 'ts_voteup' and 'ts_votedown' in the keys and then turn it into a string
        const karmaGivenSorted = Object.entries(karmaGiven).sort((a, b) => b[1] - a[1]);
        const karmaGivenFiltered = karmaGivenSorted.filter(([key]) => key === '<:ts_voteup:958721361587630210>' || key === '<:ts_votedown:960161563849932892>');
        karmaGivenString = karmaGivenFiltered.map(([key, value]) => `${key} — ${value}`).join('\n');
      }
    } else {
      karmaGivenString = 'Nothing, they are a blank canvas to be discovered!';
    }

    const book = [];
    const randomQuoteA = karmaQuotes[Math.floor(
      Math.random() * Object.keys(karmaQuotes).length,
    ).toString()];
    const karmaReceivedEmbed = template.embedTemplate()
      .setTitle(`${actor.user.username}'s Karma Received`)
      .setDescription(`${karmaReceivedString}\n\n${randomQuoteA}`);
    book.push(karmaReceivedEmbed);

    const randomQuoteB = karmaQuotes[Math.floor(
      Math.random() * Object.keys(karmaQuotes).length,
    ).toString()];
    const karmaGivenEmbed = template.embedTemplate()
      .setTitle(`${actor.user.username}'s Karma Given`)
      .setDescription(`${karmaGivenString}\n\n${randomQuoteB}`);
    book.push(karmaGivenEmbed);

    paginationEmbed(interaction, book, buttonList);
    logger.debug(`[${PREFIX}] finished!`);
  },
};
