const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Health check'),
    async execute(interaction) {
        return interaction.reply('pong!');
    },
};
