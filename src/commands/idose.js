const { SlashCommandBuilder, time } = require('@discordjs/builders');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const template = require('../utils/embed_template');

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
    async execute(interaction, parameters) {
        let substance = interaction.options.getString('substance');
        if (!substance) {
            substance = parameters[0];
        }
        let volume = interaction.options.getInteger('volume');
        if (!volume) {
            volume = parameters[1];
        }
        let units = interaction.options.getString('units');
        if (!units) {
            units = parameters[2];
        }

        const date = new Date();

        const timeString = time(date);
        const relative = time(date, 'R');

        const embed = template.embed_template()
            .setColor('DARK_BLUE')
            .addFields(
                {
                    name: `You dosed ${volume} ${units} of ${substance}`,
                    value: `${relative} at ${timeString}`,
                },
            );
        if (!interaction.replied) { interaction.reply({ embeds: [embed], ephemeral: true });}
        else {interaction.followUp({ embeds: [embed], ephemeral: false });}
        logger.debug(`[${PREFIX}] Finsihed!`);
        return;
    },
};
