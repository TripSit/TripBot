const { SlashCommandBuilder, time } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const logger = require('../utils/logger.js');
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const ts_icon_url = process.env.ts_icon_url;
const disclaimer = process.env.disclaimer;

const PREFIX = require('path').parse(__filename).name;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('idose')
        .setDescription('Log your dosages!')
        .addStringOption(option =>
            option.setName('substance')
                .setDescription('What Substance?')
                .setRequired(true)
                .setAutocomplete(true),
        )
        .addIntegerOption(option =>
            option.setName('volume')
                .setDescription('How much?')
                .setRequired(true),
        )
        .addStringOption(option =>
            option.setName('units')
                .setDescription('What units?')
                .setRequired(true)
                .addChoice('g (grams)', 'g (grams)')
                .addChoice('mg (milligrams)', 'mg (milligrams)')
                .addChoice('ml (milliliters)', 'ml (milliliters)')
                .addChoice('µg (micrograms)', 'µg (micrograms)')
                .addChoice('oz (ounces)', 'oz (ounces)')
                .addChoice('fl oz (fluid ounces)', 'fl oz (fluid ounces)')
                .addChoice('tabs', 'tabs')
                .addChoice('caps', 'caps')
                .addChoice('pills', 'pills')
                .addChoice('drops', 'drops')
                .addChoice('sprays', 'sprays')
                .addChoice('inhales', 'inhales'),
        ),
    async execute(interaction) {
        const substance = interaction.options.getString('substance');
        const volume = interaction.options.getInteger('volume');
        const units = interaction.options.getString('units');

        const date = new Date();

        const timeString = time(date);
        const relative = time(date, 'R');

        const embed = new MessageEmbed()
            .setAuthor({ name: 'TripSit.Me', iconURL: ts_icon_url, url: 'http://www.tripsit.me' })
            .setColor('DARK_BLUE')
            .addFields(
                {
                    name: `You dosed ${volume} ${units} of ${substance}`,
                    value: `${relative} at ${timeString}`,
                },
            )
            .setFooter({ text: disclaimer, iconURL: ts_icon_url });
        return interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
