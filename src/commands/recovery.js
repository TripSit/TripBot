const { SlashCommandBuilder } = require('@discordjs/builders');
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

module.exports = {
    data: new SlashCommandBuilder().setName('recovery').setDescription('Information that may be helpful in a serious situation.'),
    async execute(interaction) {return interaction.reply('https://i.imgur.com/nTEm0QE.png');},
};
