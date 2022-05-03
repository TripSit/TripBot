const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;

module.exports = {
    data: new SlashCommandBuilder().setName('reagents').setDescription('Display reagent color chart!'),
    async execute(interaction) {
        const url = 'https://i.imgur.com/wETJsZr.png';
        if (!interaction.replied) { interaction.reply(url);}
        else {interaction.followUp(url);}
        logger.debug(`[${PREFIX}] finished!`);
        return;
    },
};
