const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Health check'),
    async execute(interaction) {
        return interaction.reply('pong!');
    },
};
