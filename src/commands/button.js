const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageButton, MessageActionRow } = require('discord.js');
const logger = require('../utils/logger.js');

const PREFIX = require('path').parse(__filename).name;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('button')
        .setDescription('Creates a TripSitMe button!'),
    async execute(interaction) {
        const username = `${interaction.member.user.username}#${interaction.member.user.discriminator}`;
        const channel = interaction.channel.name;
        const guild = interaction.guild.name;
        logger.info(`[${PREFIX}] Initialized by ${username} in ${channel} on ${guild}!`);

        const buttonText = 'Welcome to the TripSit room!\n\n\
        **Right now this room is not actively monitored by TripSit staff.**\n\n\
        **If you need assistance please go to  https://chat.tripsit.me to find our IRC channels!**\n\n\
        If you\'re okay with things being slower you can click the button below:\n\n\
        This will create a new thread and alert our team that you need assistance, and the community may come to help!\n\n\
        For general questions/advice try the #drug-questions room!';

        // Create a new button embed
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('tripsitme')
                    .setLabel('I need assistance!')
                    .setStyle('DANGER'),
                new MessageButton()
                    .setCustomId('imgood')
                    .setLabel('I no longer need assistance!')
                    .setStyle('PRIMARY'),
            );

        // Create a new button
        await interaction.reply({ content: buttonText, components: [row] });
    },
};
