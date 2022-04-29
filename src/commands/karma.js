const fs = require('node:fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageButton } = require('discord.js');
const paginationEmbed = require('discordjs-button-pagination');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger.js');
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const ts_icon_url = process.env.ts_icon_url;
const ts_flame_url = process.env.ts_flame_url;

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
        .addUserOption(option => option.setName('user').setDescription('User to lookup!'),
        ),
    async execute(interaction) {
        let patient = interaction.options.getMember('user');
        // let user_provided = true;
        // Default to the user who invoked the command if no user is provided
        if (!patient) {
            logger.debug(`[${PREFIX}] No user provided, defaulting to ${interaction.member}`);
            patient = interaction.member;
            // user_provided = false;
        }

        const patientid = patient.id.toString();
        // logger.debug(`[${PREFIX}] patientid: ${patientid}`);

        const snapshot = global.user_db;

        let patientData = null;
        snapshot.forEach((doc) => {
            // logger.debug(`[${PREFIX}] doc.value: ${JSON.stringify(doc.value, null, 2)}`);
            // logger.debug(`[${PREFIX}] doc.value.discord_id: ${doc.value.discord_id}`);
            if (doc.value.discord_id === patientid) {
                patientData = doc.value;
                // logger.debug(`[${PREFIX}] patientData: ${JSON.stringify(patientData, null, 4)}`);
            }
        });

        // Check if the patient data exists, if not create a blank one
        if (!patientData) {
            logger.debug(`[${PREFIX}] No target data found, creating a blank one`);
            patientData = {
                'name': patient.user.username,
                'discriminator': patient.user.discriminator,
                'karma_given': {},
                'karma_received': {},
            };
        }

        const karma_received = patientData['karma_recieved'];
        let karma_received_string = '';
        if (karma_received) {
            karma_received_string = Object.entries(karma_received).map(([key, value]) => `${value}: ${key}`).join('\n');
        }
        else {
            karma_received_string = 'Nothing, they are a blank canvas to be discovered!';
        }

        const karma_given = patientData['karma_given'];
        let karma_given_string = '';
        if (karma_given) {
            karma_given_string = Object.entries(karma_given).map(([key, value]) => `${value}: ${key}`).join('\n');
        }
        else {
            karma_given_string = 'Nothing, they are a wet paintbrush ready to make their mark!';
        }

        const book = [];
        const random_quoteA = karma_quotes[Math.floor(Math.random() * Object.keys(karma_quotes).length).toString()];
        const karma_received_embed = new MessageEmbed()
            .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
            .setColor('RANDOM')
            .setTitle(`${patient.user.username}'s Karma Received`)
            .setDescription(`${karma_received_string}\n\n${random_quoteA}`)
            .setFooter({ text: 'Dose responsibly!', iconURL: ts_flame_url });
        book.push(karma_received_embed);

        const random_quoteB = karma_quotes[Math.floor(Math.random() * Object.keys(karma_quotes).length).toString()];
        const karma_given_embed = new MessageEmbed()
            .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
            .setColor('RANDOM')
            .setTitle(`${patient.user.username}'s Karma Given`)
            .setDescription(`${karma_given_string}\n\n${random_quoteB}`)
            .setFooter({ text: 'Dose responsibly!', iconURL: ts_flame_url });
        book.push(karma_given_embed);

        if (book.length > 0) {
            paginationEmbed(interaction, book, buttonList);
            logger.debug(`[${PREFIX}] finished!`);
            return;
        }
        else {
            const embed = new MessageEmbed()
                .setAuthor({ name: 'TripSit.Me', iconURL: ts_icon_url, url: 'http://www.tripsit.me' })
                .setColor('RANDOM')
                .setDescription('Done!')
                .setFooter({ text: 'Dose responsibly!', iconURL: ts_flame_url });
            interaction.reply({ embeds: [embed], ephemeral: false });
            logger.debug(`[${PREFIX}] finished!`);
            return;
        }
    },
};
