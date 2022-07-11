'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');

const PREFIX = path.parse(__filename).name;

module.exports = {
    data: new SlashCommandBuilder()
        .setname('lovebomb')
        .setDescription('Spread some love'),

    async execute(interaction) {
        message = "lovebomb: <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3"
        if(interaction.replied) interaction.followUp(message);
        else interaction.reply(message);

        logger.debug(`[${PREFIX}] finished!`);
    }
}