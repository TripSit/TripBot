const fs = require('node:fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const template = require('../utils/embed_template');

const raw_drug_data = fs.readFileSync('./src/assets/drug_db_combined.json');
const drug_data_all = JSON.parse(raw_drug_data);

const raw_combo_data = fs.readFileSync('./src/assets/combo_definitions.json');
const combo_defs = JSON.parse(raw_combo_data);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('combo')
        .setDescription('Check combo information')
        .addStringOption(option =>
            option.setName('first_drug')
                .setDescription('Pick the first drug')
                .setRequired(true)
                .setAutocomplete(true),
        )
        .addStringOption(option =>
            option.setName('second_drug')
                .setDescription('Pick the second drug')
                .setRequired(true)
                .setAutocomplete(true),
        ),
    async execute(interaction, parameters) {
        let drug_a = interaction.options.getString('first_drug');
        if (!drug_a) {
            drug_a = parameters[0];
        }
        let drug_b = interaction.options.getString('second_drug');
        if (!drug_b) {
            drug_b = parameters[1];
        }
        logger.debug(`[${PREFIX}] drug_a: ${drug_a} | drug_b: ${drug_b}`);

        for (let i = 0; i < Object.keys(drug_data_all).length; i++) {
            if (drug_data_all[i]) {
                if (drug_data_all[i]['name'] == drug_a) {
                    logger.debug(`[${PREFIX}] Found drug_a: ${drug_a}`);
                    const embed = template.embed_template()
                        .setTitle(`${drug_a} and ${drug_b} combined:`);
                    if (drug_data_all[i]['interactions']) {
                        logger.debug(`[${PREFIX}] drug_a has interactions`);
                        let result = '';
                        for (let j = 0; j < drug_data_all[i]['interactions'].length; j++) {
                            if (drug_data_all[i]['interactions'][j]['name'] == drug_b) {
                                logger.debug(`[${PREFIX}] Found drug_b: ${drug_b}`);
                                result = drug_data_all[i]['interactions'][j]['status'];
                                // Loop through combo_defs and find the object where "status" is equal to result
                                for (let k = 0; k < combo_defs.length; k++) {
                                    if (combo_defs[k]['status'] == result) {
                                        logger.debug(`[${PREFIX}] Found combo_defs: ${combo_defs[k]['status']}`);
                                        const definition = combo_defs[k]['definition'];
                                        const emoji = combo_defs[k]['emoji'];
                                        const color = combo_defs[k]['color'];
                                        const thumbnail = combo_defs[k]['thumbnail'];
                                        const output = `${emoji} ${result} ${emoji}`;
                                        embed.addFields(
                                            { name: 'Result', value: output },
                                            { name: 'Definition', value: definition },
                                        );
                                        embed.setThumbnail(thumbnail);
                                        embed.setColor(color);
                                        break;
                                    }
                                }
                            }
                        }
                        if (result == '') {
                            embed.setTitle(`${drug_a} and ${drug_b} have no known interactions!`);
                            embed.setDescription('This does not mean combining them is safe!\nThis means we don\'t have information on it!');
                        }
                    }
                    else {
                        embed.setTitle(`${drug_a} and ${drug_b} have no known interactions!`);
                        embed.setDescription('This does not mean combining them is safe!\nThis means we don\'t have information on it!');
                    }
                    if (!interaction.replied) { interaction.reply({ embeds: [embed], ephemeral: false });}
                    else {interaction.followUp({ embeds: [embed], ephemeral: false });}
                    logger.debug(`[${PREFIX}] finished!`);
                    return;
                }
            }
        }
    },
};
