const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const ts_icon_url = process.env.ts_icon_url;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Health check'),
    async execute(interaction) {
        const embed = new MessageEmbed()
            .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
            .setColor('RANDOM')
            .setTitle('PONG');
        logger.debug(`${PREFIX} finished!`);
        interaction.reply({ embeds: [embed], ephemeral: false });
        return;
    },
};
