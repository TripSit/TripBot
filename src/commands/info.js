const fs = require('node:fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageButton } = require('discord.js');
const paginationEmbed = require('discordjs-button-pagination');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger.js');
const template = require('../utils/embed_template');

const raw_drug_data = fs.readFileSync('./src/assets/drug_db_combined.json');
const drug_data_all = JSON.parse(raw_drug_data);

const raw_combo_data = fs.readFileSync('./src/assets/combo_definitions.json');
const all_combo_data = JSON.parse(raw_combo_data);

const button1 = new MessageButton()
    .setCustomId('previousbtn')
    .setLabel('Previous')
    .setStyle('DANGER');

const button2 = new MessageButton()
    .setCustomId('nextbtn')
    .setLabel('Next')
    .setStyle('SUCCESS');
const buttonList = [
    button1,
    button2,
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Check substance information')
        .addStringOption(option =>
            option.setName('substance')
                .setDescription('Pick a substance!')
                .setRequired(true)
                .setAutocomplete(true),
        )
        .addStringOption(option =>
            option.setName('section')
                .setDescription('What section?')
                .setRequired(true)
                .addChoice('Summary', 'Summary')
                .addChoice('Dosage', 'Dosage')
                .addChoice('Combos', 'Combos'),
        ),
    async execute(interaction, parameters) {
        let substance = interaction.options.getString('substance');
        if (!substance) {
            substance = parameters[0];
        }
        let section = interaction.options.getString('section');
        if (!section) {
            section = parameters[1];
        }
        const wiki_url = `https://wiki.tripsit.me/wiki/${substance}`;

        logger.info(`[${PREFIX}] starting getDrugInfo with parameter: ${substance}`);
        // loop through drug_data_all to find the substance
        let drugData = {};
        logger.debug(`[${PREFIX}] All drug data length is: ${Object.keys(drug_data_all).length}`);
        for (let i = 0; i < Object.keys(drug_data_all).length; i++) {
            // logger.debug(`[${PREFIX}] drug_data_all[i]['name'] is: ${drug_data_all[i]['name']}`)
            if (drug_data_all[i]['name'] == substance) {
                logger.debug(`[${PREFIX}] found substance: ${substance}`);
                drugData = drug_data_all[i];
                break;
            }
        }

        // logger.debug(`[${PREFIX}] ${drugData}`)

        let summary = drugData['name'] + '\n\n';
        if (drugData['aliases']) {
            // turn aliases into a string with each alias on a new line
            let aliasString = '';
            for (let i = 0; i < drugData['aliases'].length; i++) {aliasString += drugData['aliases'][i] + '\n';}
            summary += 'Also known as: \n' + aliasString + '\n';
        }
        if (drugData['summary']) {summary += drugData['summary'] + '\n\n';}
        if (drugData['classes']) {
            if (drugData['classes']['chemical']) {summary += 'Chemical Class: \n' + drugData['classes']['chemical'] + '\n\n';}
            if (drugData['classes']['psychoactive']) {summary += 'Psychoactive Class: \n' + drugData['classes']['psychoactive'] + '\n\n';}
        }
        if (drugData['reagents']) {summary += 'Reagent test results: \n' + drugData['reagents'] + '\n\n';}
        if (drugData['toxicity']) {summary += 'Toxicity: \n' + drugData['toxicity'] + '\n\n';}
        if (drugData['addictionPotential']) {summary += 'Addiction Potential: \n' + drugData['addictionPotential'] + '\n\n';}

        let dosage = '';
        if (drugData['roas']) {
            for (let i = 0; i < drugData['roas'].length; i++) {
                dosage += drugData['roas'][i].name + ' Dosage\n';
                if (drugData['roas'][i].bioavailability) {dosage += 'Bioavailability: ' + drugData['roas'][i].bioavailability + '\n';}
                if (drugData['roas'][i].dosage) {
                    for (let j = 0; j < drugData['roas'][i].dosage.length; j++) {
                        if (j == 0) {
                            if (drugData['roas'][i].dosage[j].note) {dosage += 'Note: ' + drugData['roas'][i].dosage[j].note + '\n';}
                        }
                        dosage += drugData['roas'][i].dosage[j].name + ': ' + drugData['roas'][i].dosage[j].value + '\n';
                    }
                }
                if (drugData['roas'][i].duration) {
                    dosage += '\n' + drugData['roas'][i].name + ' Duration' + '\n';
                    for (let j = 0; j < drugData['roas'][i].duration.length; j++) {
                        if (j == 0) {
                            if (drugData['roas'][i].duration[j].note) {dosage += 'Note: ' + drugData['roas'][i].duration[j].note + '\n';}
                        }
                        // logger.debug(`[${PREFIX}] ${drugData["roas"][i].duration[j].name}: ${drugData["roas"][i].duration[j].value}`)
                        dosage += drugData['roas'][i].duration[j].name + ': ' + drugData['roas'][i].duration[j].value + '\n';
                    }
                    dosage += '\n';
                }
            }
        }
        logger.debug(`[${PREFIX}] dosage is: ${dosage.length}`);
        let tolerance = '';
        if (drugData['tolerance']) {
            tolerance += '\nTolerance' + '\n';
            if (drugData['tolerance'].full) {tolerance += 'Full: ' + drugData['tolerance'].full + '\n';}
            if (drugData['tolerance'].half) {tolerance += 'Half: ' + drugData['tolerance'].half + '\n';}
            if (drugData['tolerance'].zero) {tolerance += 'Zero: ' + drugData['tolerance'].zero + '\n';}
            if (drugData['crossTolerances']) {tolerance += 'Cross Tolerances:\n' + drugData['crossTolerances'] + '\n';}
        }

        dosage += tolerance;

        let danger_section = '';
        let unsafe_section = '';
        let caution_section = '';
        let decrease_section = '';
        let nosyn_section = '';
        let synergy_section = '';
        let unknown_section = '';
        if (drugData['interactions']) {
            // For each interaction status, make a list of those names
            const interactions = drugData['interactions'];
            for (let i = 0; i < interactions.length; i++) {
                if (interactions[i].status == 'Dangerous') {
                    danger_section += interactions[i].name + '\n';
                    if (interactions[i].note) {danger_section += 'Note: ' + interactions[i].note + '\n';}
                }
                else if (interactions[i].status == 'Unsafe') {
                    unsafe_section += interactions[i].name + '\n';
                    if (interactions[i].note) {unsafe_section += 'Note: ' + interactions[i].note + '\n';}
                }
                else if (interactions[i].status == 'Caution') {
                    caution_section += interactions[i].name + '\n';
                    if (interactions[i].note) {caution_section += 'Note: ' + interactions[i].note + '\n';}
                }
                else if (interactions[i].status == 'Low Risk & Decrease') {
                    decrease_section += interactions[i].name + '\n';
                    if (interactions[i].note) {decrease_section += 'Note: ' + interactions[i].note + '\n';}
                }
                else if (interactions[i].status == 'Low Risk & No Synergy') {
                    nosyn_section += interactions[i].name + '\n';
                    if (interactions[i].note) {nosyn_section += 'Note: ' + interactions[i].note + '\n';}
                }
                else if (interactions[i].status == 'Low Risk & Synergy') {
                    synergy_section += interactions[i].name + '\n';
                    if (interactions[i].note) {synergy_section += 'Note: ' + interactions[i].note + '\n';}
                }
                else if (interactions[i].status == 'Unknown') {
                    unknown_section += interactions[i].name + '\n';
                    if (interactions[i].note) {unknown_section += 'Note: ' + interactions[i].note + '\n';}
                }

            }

            if (danger_section != '') {logger.debug(`[${PREFIX}] danger_section is: ${danger_section.length}`);}
            if (unsafe_section != '') {logger.debug(`[${PREFIX}] unsafe_section is: ${unsafe_section.length}`);}
            if (caution_section != '') {logger.debug(`[${PREFIX}] caution_section is: ${caution_section.length}`);}
            if (decrease_section != '') {logger.debug(`[${PREFIX}] decrease_section is: ${decrease_section.length}`);}
            if (nosyn_section != '') {logger.debug(`[${PREFIX}] nosyn_section is: ${nosyn_section.length}`);}
            if (synergy_section != '') {logger.debug(`[${PREFIX}] synergy_section is: ${synergy_section.length}`);}
            if (unknown_section != '') {logger.debug(`[${PREFIX}] unknown_section is: ${unknown_section.length}`);}
        }

        if (section == 'Summary') {
            if (summary != '') {
                logger.debug(`[${PREFIX}] summary.length: ${summary.length}`);
                logger.debug(`[${PREFIX}] wiki_url: ${wiki_url}`);
                const embed = template.embed_template()
                    .setColor('DARK_BLUE')
                    .setTitle(`${substance} Summary`)
                    .setURL(`https://wiki.tripsit.me/wiki/${substance}`)
                    .setDescription(summary);
                if (!interaction.replied) { interaction.reply({ embeds: [embed], ephemeral: false });}
                else {interaction.followUp({ embeds: [embed], ephemeral: false });}
                logger.debug(`[${PREFIX}] finished!`);
                return;
            }
        }

        if (section == 'Dosage') {
            if (dosage != '') {
                const entire_message = dosage;
                const book = [];
                if (entire_message.length > 1024) {
                    // logger.debug(`[${PREFIX}] ${section} is too long at ${entire_message.length}`);
                    const message_length = Math.ceil(entire_message.length / 1000);
                    // logger.debug(`[${PREFIX}] I will make ${message_length} messages`)
                    let messages_built = 0;
                    let message_start = 0;
                    let message_end = 1000;
                    let message_part = '';
                    while (messages_built < message_length) {
                        // logger.debug(`[${PREFIX}] looking for last ) between ${message_start} and ${message_end}`)
                        message_end = entire_message.lastIndexOf('\n', message_end) + 1;
                        // logger.debug(`[${PREFIX}] Found the last newline at ${message_end}`)
                        message_part = entire_message.slice(message_start, message_end);
                        // logger.debug(`[${PREFIX}] message_part is ${message_part}`)
                        // logger.debug(`[${PREFIX}] setting new start to ${message_end}`)
                        message_start = message_end;
                        message_end += 1000;
                        messages_built += 1;
                        const embed = template.embed_template()
                            .setTitle(`${substance} Dosage`)
                            .setURL(`https://wiki.tripsit.me/wiki/${substance}`)
                            .setDescription(message_part);
                        book.push(embed);
                    }
                }
                if (entire_message.length > 0 && entire_message.length <= 1024) {
                    logger.debug(`[{PREFIX}] ${section} is not too long`);
                    const embed = template.embed_template()
                        .setTitle(`${substance} Dosage`)
                        .setURL(`https://wiki.tripsit.me/wiki/${substance}`)
                        .setDescription(entire_message);
                    return interaction.reply({ embeds: [embed] });
                }
                if (book.length > 0) {
                    paginationEmbed(interaction, book, buttonList);
                    logger.debug(`[${PREFIX}] finished!`);
                    return;
                }
                else {
                    // logger.debug(f"[{PREFIX}] No messages to send")
                    await interaction.reply(`No dosage information found for ${substance}`);
                    logger.debug(`[${PREFIX}] finished!`);
                    return;
                }
            }
        }
        if (section == 'Combos') {
            const combo_results = {
                'Dangerous': danger_section,
                'Unsafe': unsafe_section,
                'Caution': caution_section,
                'Low Risk & Decrease': decrease_section,
                'Low Risk & No Synergy': nosyn_section,
                'Low Risk & Synergy': synergy_section,
                'Unknown': unknown_section,
            };
            const book = [];
            // loop through each dictionary in all_combo_data
            // logger.debug(JSON.stringify(all_combo_data))
            for (let i = 0; i < all_combo_data.length; i++) {
                const combo_def = all_combo_data[i];
                // logger.debug(`[${PREFIX}] combo_def: ${JSON.stringify(combo_def)}`);
                const drug_status = combo_def['status'];
                logger.debug(`[${PREFIX}] drug_status is ${drug_status}`);
                const emoji = combo_def['emoji'];
                const color = combo_def['color'];
                const definition = combo_def['definition'];
                const thumbnail = combo_def['thumbnail'];
                const section_results = combo_results[drug_status];
                let entire_message = section_results;
                if (section_results != '') {
                    entire_message = definition + '\n\n' + section_results;
                }
                // logger.debug(`[${PREFIX}] entire_message is ${entire_message}`);
                const title = `${emoji} ${drug_status} ${emoji}`;

                if (entire_message.length > 1024) {
                    logger.debug(`[${PREFIX}] ${drug_status} is too long at ${entire_message.length}`);
                    const message_length = Math.ceil(entire_message.length / 1000);
                    // logger.debug(`[${PREFIX}] I will make ${message_length} messages`)
                    let messages_built = 0;
                    let message_start = 0;
                    let message_end = 1000;
                    let message_part = '';
                    while (messages_built < message_length) {
                        // logger.debug(`[${PREFIX}] looking for last ) between ${message_start} and ${message_end}`)
                        message_end = entire_message.lastIndexOf('\n', message_end) + 1;
                        // logger.debug(`[${PREFIX}] Found the last newline at ${message_end}`)
                        message_part = entire_message.slice(message_start, message_end);
                        // logger.debug(`[${PREFIX}] message_part is ${message_part}`)
                        // logger.debug(`[${PREFIX}] setting new start to ${message_end}`)
                        message_start = message_end;
                        message_end += 1000;
                        messages_built += 1;
                        const embed = template.embed_template()
                            .setTitle(`${title}`)
                            .setURL(`https://wiki.tripsit.me/wiki/${substance}`)
                            .setDescription(message_part)
                            .setColor(color)
                            .setThumbnail(thumbnail);
                        book.push(embed);
                    }
                }
                if (entire_message.length > 0 && entire_message.length <= 1024) {
                    logger.debug(`[{PREFIX}] ${drug_status} is not too long`);
                    const embed = template.embed_template()
                        .setTitle(`${title}`)
                        .setURL(`https://wiki.tripsit.me/wiki/${substance}`)
                        .setDescription(entire_message)
                        .setColor(color)
                        .setThumbnail(thumbnail);
                    book.push(embed);
                }
            }
            if (book.length > 0) {
                paginationEmbed(interaction, book, buttonList);
                logger.debug(`[${PREFIX}] finished!`);
                return;
            }
            else {
                // logger.debug(f"[{PREFIX}] No messages to send")
                await interaction.reply(`No combo information found for ${substance}`);
                logger.debug(`[${PREFIX}] finished!`);
                return;
            }
        }
    },
};
