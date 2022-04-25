const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const logger = require('../utils/logger.js');

const PREFIX = require('path').parse(__filename).name;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hydrate')
        .setDescription('Remember to hydrate!'),
    async execute(interaction) {
        const output = '💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊\n\n' +
        '⚠️ ＨＹＤＲＡＴＩＯＮ ＲＥＭＩＮＤＥＲ ⚠️\n\n' +
        '💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊';
        const embed = new MessageEmbed()
            .setColor('DARK_BLUE')
            .setDescription(output);
        return interaction.reply({ embeds: [embed] });
    },
};
