const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const template = require('../../utils/embed_template');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Health check'),
    async execute(interaction) {
        const embed = template.embed_template()
            .setTitle('PONG');
        logger.debug(`[${PREFIX}] finished!`);
        interaction.followup({ embeds: [embed], ephemeral: false });
        return;
    },
};
