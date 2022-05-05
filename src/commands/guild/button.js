const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageButton, MessageActionRow } = require('discord.js');
const { stripIndents } = require('common-tags');
const logger = require('../../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const channel_drugquestions_id = process.env.channel_drugquestions;
const channel_sanctuary_id = process.env.channel_sanctuary;
const channel_general_id = process.env.channel_general;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('button')
        .setDescription('Creates a TripSitMe button!'),
    async execute(interaction) {
        const channel_questions = interaction.client.channels.cache.get(channel_drugquestions_id);
        const channel_sanctuary = interaction.client.channels.cache.get(channel_sanctuary_id);
        const channel_general = interaction.client.channels.cache.get(channel_general_id);

        const buttonText = stripIndents`Welcome to the TripSit room!\n
        Questions on drugs? Make a thread in ${channel_questions}!\n
        Don't need immediate help but want a peaceful chat? Come to ${channel_sanctuary}!\n
        **Under the influence of something and need help? Click the buttom below!**
        This will create a new thread and alert the community that you need assistance!
        🛑 Please do not message helpers or tripsitters directly! 🛑\n
        All other topics of conversation are welcome in ${channel_general}!\n
        Stay safe!`;

        // Create a new button embed
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('tripsitme')
                    .setLabel('I need assistance!')
                    .setStyle('PRIMARY'),
                // new MessageButton()
                //     .setCustomId('imgood')
                //     .setLabel('I no longer need assistance!')
                //     .setStyle('PRIMARY'),
            );

        // Create a new button
        await interaction.reply({ content: buttonText, components: [row] });
        logger.debug(`[${PREFIX}] finished!`);
        return;
    },
};
