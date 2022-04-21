const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recovery')
        .setDescription('Information that may be helpful in a serious situation.'),
    async execute(interaction) {
        const username = `${interaction.member.user.username}#${interaction.member.user.discriminator}`;
        const channel = interaction.channel.name;
        const guild = interaction.guild.name;
        logger.info(`[${PREFIX}] Initialized by ${username} in ${channel} on ${guild}!`);

        return interaction.reply('https://i.imgur.com/nTEm0QE.png');
    },
};
