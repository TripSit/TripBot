const fs = require('node:fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageButton } = require('discord.js');
const paginationEmbed = require('discordjs-button-pagination');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger.js');
const template = require('../utils/embed_template');
const { get_user_info } = require('../utils/get_user_info');

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
        .addUserOption(option => option.setName('user').setDescription('User to lookup!'))
        .addBooleanOption(option => option.setName('all').setDescription('Return all karma?')),
    async execute(interaction) {
        let actor = interaction.options.getMember('user');
        if (!actor) {actor = interaction.member;}
        let all = interaction.options.getBoolean('all');
        if (!all) {all = false;}

        // Extract actor data
        const actor_results = await get_user_info(actor);
        const actor_data = actor_results[0];

        // Transform actor data
        const karma_received = actor_data['karma_recieved'];
        let karma_received_string = '';
        if (karma_received) {
            if (all) {
                // sort karma_received by value and then turn it into a string
                const karma_received_sorted = Object.entries(karma_received).sort((a, b) => b[1] - a[1]);
                karma_received_string = karma_received_sorted.map(([key, value]) => `${value}: ${key}`).join('\n');
            }
            else {
                // Find 'ts_upvote' and 'ts_downvote' in the keys and then turn it into a string
                const karma_received_sorted = Object.entries(karma_received).sort((a, b) => b[1] - a[1]);
                const karma_received_filtered = karma_received_sorted.filter(([key, value]) => key === '<:ts_up:958721361587630210>' || key === '<:ts_down:960161563849932892>');
                karma_received_string = karma_received_filtered.map(([key, value]) => `${value}: ${key}`).join('\n');
            }
        }
        else {
            karma_received_string = 'Nothing, they are a blank canvas to be discovered!';
        }
        const karma_given = actor_data['karma_given'];
        let karma_given_string = '';
        if (karma_given) {
            if (all) {
                // sort karma_given by value and then turn it into a string
                const karma_given_sorted = Object.entries(karma_given).sort((a, b) => b[1] - a[1]);
                karma_given_string = karma_given_sorted.map(([key, value]) => `${value}: ${key}`).join('\n');
            }
            else {
                // Find 'ts_upvote' and 'ts_downvote' in the keys and then turn it into a string
                const karma_given_sorted = Object.entries(karma_given).sort((a, b) => b[1] - a[1]);
                const karma_given_filtered = karma_given_sorted.filter(([key, value]) => key === '<:ts_up:958721361587630210>' || key === '<:ts_down:960161563849932892>');
                karma_given_string = karma_given_filtered.map(([key, value]) => `${value}: ${key}`).join('\n');
            }
        }
        else {
            karma_given_string = 'Nothing, they are a wet paintbrush ready to make their mark!';
        }

        const book = [];
        const random_quoteA = karma_quotes[Math.floor(Math.random() * Object.keys(karma_quotes).length).toString()];
        const karma_received_embed = template.embed_template()
            .setTitle(`${actor.user.username}'s Karma Received`)
            .setDescription(`${karma_received_string}\n\n${random_quoteA}`);
        book.push(karma_received_embed);

        const random_quoteB = karma_quotes[Math.floor(Math.random() * Object.keys(karma_quotes).length).toString()];
        const karma_given_embed = template.embed_template()
            .setTitle(`${actor.user.username}'s Karma Given`)
            .setDescription(`${karma_given_string}\n\n${random_quoteB}`);
        book.push(karma_given_embed);

        paginationEmbed(interaction, book, buttonList);
        logger.debug(`[${PREFIX}] finished!`);
        return;
    },
};
