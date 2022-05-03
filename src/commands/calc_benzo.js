const fs = require('node:fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const _ = require('underscore');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const template = require('../utils/embed_template');

module.exports = {
    data: new SlashCommandBuilder()

        .setName('calc_benzo')
        .setDescription('Check combo information')
        .addIntegerOption(option =>
            option.setName('i_have')
                .setDescription('mg')
                .setRequired(true),
        )
        .addStringOption(option =>
            option.setName('mg_of')
                .setDescription('Pick the first benzo')
                .setRequired(true)
                .setAutocomplete(true),
        )
        .addStringOption(option =>
            option.setName('and_i_want_the_dose_of')
                .setDescription('Pick the second drug')
                .setRequired(true)
                .setAutocomplete(true),
        ),
    async execute(interaction, parameters) {
        let dosage = interaction.options.getInteger('i_have');
        if (!dosage) {
            dosage = parameters[0];
        }
        let drug_a = interaction.options.getString('mg_of');
        if (!drug_a) {
            drug_a = parameters[1];
        }
        let drug_b = interaction.options.getString('and_i_want_the_dose_of');
        if (!drug_b) {
            drug_b = parameters[2];
        }
        logger.debug(`[${PREFIX}] dosage: ${dosage} | drug_a: ${drug_a} | drug_b: ${drug_b}`);

        const drugCache = JSON.parse(fs.readFileSync('./src/assets/drug_db_tripsit.json'));
        logger.debug(`[${PREFIX}] drugCache: ${drugCache.length}`);

        // Filter any drug not containing the dose_to_diazepam property
        let benzoCache = {};
        benzoCache = _.filter((drugCache), function(bCache) {
            return _.has(bCache.properties, 'dose_to_diazepam');
        });

        _.each(benzoCache, function(benzo) {
            _.each(benzo.aliases, function(alias) {
                benzoCache.push({
                    name: alias,
                    pretty_name: alias.charAt(0).toUpperCase() + alias.slice(1),
                    properties: benzo.properties,
                    formatted_dose: benzo.formatted_dose,
                });
            });
        });

        benzoCache = _.sortBy(benzoCache, 'name');
        const regex = /[0-9]+\.?[0-9]?/;
        benzoCache = _.each(benzoCache, function(bCache) {
            const converted = regex.exec(bCache.properties.dose_to_diazepam);
            // logger.debug(`[${PREFIX}] converted: ${converted}`);
            bCache.diazvalue = converted;
        });

        const drugNames = [];
        for (const each_drug in benzoCache) {
            drugNames.push({
                label: benzoCache[each_drug].name,
                value: benzoCache[each_drug].name,
            });
        }

        // const final_list = drugNames.slice(0, 25);

        let dose_a = 0;
        let dose_b = 0;
        let drug_a_result = {};
        let drug_b_result = {};
        for (const each_benzo of benzoCache) {
            if (each_benzo.name === drug_a) {
                drug_a_result = each_benzo;
                dose_a = each_benzo.diazvalue;
                logger.debug(`[${PREFIX}] ${drug_a} dose_a: ${dose_a}`);
            }
            if (each_benzo.name === drug_b) {
                drug_b_result = each_benzo;
                dose_b = each_benzo.diazvalue;
                logger.debug(`[${PREFIX}] ${drug_b} dose_b: ${dose_b}`);
            }
        }

        const result = (dosage / dose_a) * dose_b;
        let drug_a_dosage_text = '';
        if (drug_a_result.formatted_dose.Oral) {
            console.log(`[${PREFIX}] ${drug_a} is Oral`);
            drug_a_dosage_text = `\
            ${drug_a_result.formatted_dose.Oral.Light ? `Light: ${drug_a_result.formatted_dose.Oral.Light}\n` : ''}\
            ${drug_a_result.formatted_dose.Oral.Low ? `Low: ${drug_a_result.formatted_dose.Oral.Low}\n` : ''}\
            ${drug_a_result.formatted_dose.Oral.Common ? `Common: ${drug_a_result.formatted_dose.Oral.Common}\n` : ''}\
            ${drug_a_result.formatted_dose.Oral.Heavy ? `Heavy: ${drug_a_result.formatted_dose.Oral.Heavy}\n` : ''}\
            ${drug_a_result.formatted_dose.Oral.Strong ? `Strong: ${drug_a_result.formatted_dose.Oral.Strong}\n` : ''}`;
        }
        else if (drug_a_result.formatted_dose.Light) {
            console.log(`[${PREFIX}] ${drug_a} is Light`);
            drug_a_dosage_text = `\
            ${drug_a_result.formatted_dose.Light.Light ? `Light: ${drug_a_result.formatted_dose.Light.Light}\n` : ''}\
            ${drug_a_result.formatted_dose.Light.Low ? `Low: ${drug_a_result.formatted_dose.Light.Low}\n` : ''}\
            ${drug_a_result.formatted_dose.Light.Common ? `Common: ${drug_a_result.formatted_dose.Light.Common}\n` : ''}\
            ${drug_a_result.formatted_dose.Light.Heavy ? `Heavy: ${drug_a_result.formatted_dose.Light.Heavy}\n` : ''}\
            ${drug_a_result.formatted_dose.Light.Strong ? `Strong: ${drug_a_result.formatted_dose.Light.Strong}\n` : ''}`;
        }

        let drug_b_dosage_text = '';
        if (drug_b_result.formatted_dose.Oral) {
            console.log(`[${PREFIX}] ${drug_a} is Oral`);
            drug_b_dosage_text = `\
            ${drug_b_result.formatted_dose.Oral.Light ? `Light: ${drug_b_result.formatted_dose.Oral.Light}\n` : ''}\
            ${drug_b_result.formatted_dose.Oral.Low ? `Low: ${drug_b_result.formatted_dose.Oral.Low}\n` : ''}\
            ${drug_b_result.formatted_dose.Oral.Common ? `Common: ${drug_b_result.formatted_dose.Oral.Common}\n` : ''}\
            ${drug_b_result.formatted_dose.Oral.Heavy ? `Heavy: ${drug_b_result.formatted_dose.Oral.Heavy}\n` : ''}\
            ${drug_b_result.formatted_dose.Oral.Strong ? `Strong: ${drug_b_result.formatted_dose.Oral.Strong}\n` : ''}`;
        }
        else if (drug_b_result.formatted_dose.Light) {
            console.log(`[${PREFIX}] ${drug_a} is Light`);
            drug_b_dosage_text = `\
            ${drug_b_result.formatted_dose.Light.Light ? `Light: ${drug_b_result.formatted_dose.Light.Light}\n` : ''}\
            ${drug_b_result.formatted_dose.Light.Low ? `Low: ${drug_b_result.formatted_dose.Light.Low}\n` : ''}\
            ${drug_b_result.formatted_dose.Light.Common ? `Common: ${drug_b_result.formatted_dose.Light.Common}\n` : ''}\
            ${drug_b_result.formatted_dose.Light.Heavy ? `Heavy: ${drug_b_result.formatted_dose.Light.Heavy}\n` : ''}\
            ${drug_b_result.formatted_dose.Light.Strong ? `Strong: ${drug_b_result.formatted_dose.Light.Strong}\n` : ''}`;
        }

        // const row = new MessageActionRow()
        //     .addComponents(
        //         new MessageSelectMenu()
        //             .setCustomId('select')
        //             .setPlaceholder('Nothing selected')
        //             .addOptions(final_list),
        //     );

        const embed = template.embed_template()
            .setColor('RANDOM')
            .setTitle(`${dosage} mg of ${drug_a} is ${result} mg of ${drug_b}`)
            .setDescription('This is a simple tool made to help you figure out how much of a given benzodiazepine dose converts into another benzodiazepine dose.\n\n\
**Please make sure to research the substances thoroughly before using them.**\n\n\
A good idea is to compare the effects of the two different benzodiazepines, as even though the dose is \'similiar\' you might not get the effects you\'re used to.\n\n\
Important: Equivalent doses may be inaccurate for larger quantities of benzos with different effect profiles. Please compare the dosages below to see weighted dosage ranges.\n\n\
Note: It\'s a good idea to start with a lower dose than the calculator shows, since everybody can react differently to different substances.\n')
            .addFields(
                { name: `${drug_a} Summary`, value: `${drug_a_result.properties.summary}`, inline: true },
                { name: `${drug_b} Summary`, value: `${drug_b_result.properties.summary}`, inline: true },
                { name: '\u200b', value: '\u200b', inline: true },
                { name: 'Effects', value: `${drug_a_result.properties.effects}`, inline: true },
                { name: 'Effects', value: `${drug_b_result.properties.effects}`, inline: true },
                { name: '\u200b', value: '\u200b', inline: true },
                { name: 'Dose', value: `${drug_a_dosage_text}`, inline: true },
                { name: 'Dose', value: `${drug_b_dosage_text}`, inline: true },
                { name: '\u200b', value: '\u200b', inline: true },
                { name: 'Duration', value: `${drug_a_result.properties.duration}`, inline: true },
                { name: 'Duration', value: `${drug_b_result.properties.duration}`, inline: true },
                { name: '\u200b', value: '\u200b', inline: true },
                { name: 'After Effects', value: `${drug_a_result.properties['after-effects']}`, inline: true },
                { name: 'After Effects', value: `${drug_b_result.properties['after-effects']}`, inline: true },
                { name: '\u200b', value: '\u200b', inline: true },
            );
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
