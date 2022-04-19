const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Health check'),
    async execute(interaction) {
        const username = `${interaction.member.user.username}#${interaction.member.user.discriminator}`;
        const channel = interaction.channel.name;
        const guild = interaction.guild.name;
        logger.info(`[${PREFIX}] Initialized by ${username} in ${channel} on ${guild}!`);
        return interaction.reply('pong!');
    },
};
