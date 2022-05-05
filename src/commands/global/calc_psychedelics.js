const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const template = require('../../utils/embed_template');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calc_psychedelics')
        .setDescription('Check psychedelic tolerance information')
        .addSubcommand(subcommand =>
            subcommand
                .setName('lsd')
                .setDescription('Check LSD tolerance information')
                .addIntegerOption(option =>
                    option.setName('last_dose')
                        .setDescription('ug of LSD')
                        .setRequired(true),
                )
                .addIntegerOption(option =>
                    option.setName('days')
                        .setDescription('Number of days since last dose?')
                        .setRequired(true),
                )
                .addIntegerOption(option =>
                    option.setName('desired_dose')
                        .setDescription('ug of LSD'),
                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('mushrooms')
                .setDescription('Check mushroom tolerance information')
                .addIntegerOption(option =>
                    option.setName('last_dose')
                        .setDescription('g of mushrooms')
                        .setRequired(true),
                )
                .addIntegerOption(option =>
                    option.setName('days')
                        .setDescription('Number of days since last dose?')
                        .setRequired(true),
                )
                .addIntegerOption(option =>
                    option.setName('desired_dose')
                        .setDescription('g of mushrooms'),
                ),
        ),

    async execute(interaction, parameters) {
        let last_dose = interaction.options.getInteger('last_dose');
        if (!last_dose) {
            last_dose = parameters[0];
        }
        let desired_dose = interaction.options.getInteger('desired_dose');
        // if (!desired_dose) {
        //     desired_dose = parameters[1];
        // }
        let days = interaction.options.getInteger('days');
        if (!days) {
            days = parameters[2];
        }
        let command = '';
        try {
            command = interaction.options.getSubcommand();
        }
        catch (err) {
            command = parameters[3];
        }
        logger.debug(`[${PREFIX}] last_dose: ${last_dose} | desired_dose: ${desired_dose} | days: ${days}`);

        // Code here inspired by https://codepen.io/cyberoxide/pen/BaNarGd
        // Seems like the original source is offline (https://psychedeliccalc.herokuapp.com)
        let estimated_dosage = (last_dose / 100) * 280.059565 * (Math.pow(days, -0.412565956));
        let new_amount = 0;
        if (desired_dose) {
            estimated_dosage = estimated_dosage + (desired_dose - last_dose);
            new_amount = ((estimated_dosage < desired_dose) ? desired_dose : estimated_dosage);
        }
        else {
            new_amount = ((estimated_dosage < last_dose) ? last_dose : estimated_dosage);
        }
        const result = Math.round(new_amount * 10) / 10;

        const drug = (command === 'lsd') ? 'LSD' : 'Mushrooms';
        const units = (command === 'lsd') ? 'ug' : 'g';
        let title = `${result} ${units} of ${drug} is needed to feel the same effects as`;
        if (desired_dose) {
            title = `${title} ${desired_dose} ${units} of ${drug}.`;
        }
        else {
            title = `${title} your last dose.`;
        }
        const embed = template.embed_template()
            .setTitle(title)
            .setDescription('\
            Please note that this calculator only works for tryptamines like LSD and Magic Mushrooms, do not use this calculator for a chemcial that isn\'t a tryptamine.\n\n\
            This calculator is only able to provide an estimate. Please do not be deceived by the apparent precision of the numbers.\n\n\
            Further, this calculator also assumes that you know exactly how much LSD and Shrooms you have consumed, due to the variable nature of street LSD and Shrooms, \
            this calculator is likely to be less successful when measuring tolerance between doses from different batches/chemists and harvests.\n\n\
            As all bodies and brains are different, results may vary.');

        if (!interaction.replied) {
            interaction.reply({ embeds: [embed], ephemeral: false });
        }
        else {
            interaction.followUp({ embeds: [embed], ephemeral: false });
        }
        logger.debug(`[${PREFIX}] finished!`);
        return;
    },
};
