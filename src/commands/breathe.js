const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('breathe')
        .setDescription('Remember to breathe')
        .addStringOption(option =>
            option.setName('exercise')
                .setDescription('Which exercise?')
                .addChoice('1', '1')
                .addChoice('2', '2')
                .addChoice('3', '3')
                .addChoice('4', '4'),
        ),
    async execute(interaction) {
        const choice = interaction.options.getString('exercise');

        if (choice == '1' || !choice) {
            interaction.reply('https://i.imgur.com/n5jBp45.gif');
        }
        if (choice == '2') {
            interaction.reply('https://i.imgur.com/XbH6gP4.gif');
        }
        if (choice == '3') {
            interaction.reply('https://i.imgur.com/g57i96f.gif');
        }
        if (choice == '4') {
            interaction.reply('https://i.imgur.com/MkUcTPl.gif');
        }
        logger.debug(`[${PREFIX}] finished!`);
        return;
    },
};
