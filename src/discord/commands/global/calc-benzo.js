'use strict';

const path = require('path');
const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const _ = require('underscore');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('calc-benzo')
    .setDescription('Check combo information')
    .addIntegerOption(option => option.setName('i_have')
      .setDescription('mg')
      .setRequired(true))
    .addStringOption(option => option.setName('mg_of')
      .setDescription('Pick the first benzo')
      .setRequired(true)
      .setAutocomplete(true))
    .addStringOption(option => option.setName('and_i_want_the_dose_of')
      .setDescription('Pick the second drug')
      .setRequired(true)
      .setAutocomplete(true)),

  async execute(interaction, parameters) {
    const dosage = interaction.options.getInteger('i_have') || parameters.at(0);
    const drugA = interaction.options.getString('mg_of') || parameters.at(1);
    const drugB = interaction.options.getString('and_i_want_the_dose_of') || parameters.at(2);
    logger.debug(`[${PREFIX}] dosage: ${dosage} | drug_a: ${drugA} | drug_b: ${drugB}`);

    const drugCache = JSON.parse(fs.readFileSync('./src/global/assets/data/drug_db_tripsit.json'));
    logger.debug(`[${PREFIX}] drugCache: ${drugCache.length}`);

    // Filter any drug not containing the dose_to_diazepam property
    let benzoCache = {};
    benzoCache = _.filter((drugCache), bCache => _.has(bCache.properties, 'dose_to_diazepam'));

    _.each(benzoCache, benzo => {
      _.each(benzo.aliases, alias => {
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
    benzoCache = _.each(benzoCache, bCache => {
      const converted = regex.exec(bCache.properties.dose_to_diazepam);
      // logger.debug(`[${PREFIX}] converted: ${converted}`);
      bCache.diazvalue = converted; // eslint-disable-line
    });

    const drugNames = [];
    for (const eachDrug in benzoCache) { // eslint-disable-line
      drugNames.push({
        label: benzoCache[eachDrug].name,
        value: benzoCache[eachDrug].name,
      });
    }

    // const final_list = drugNames.slice(0, 25);

    let doseA = 0;
    let doseB = 0;
    let drugAResult = {};
    let drugBResult = {};
    for (const eachBenzo of benzoCache) { // eslint-disable-line
      if (eachBenzo.name === drugA) {
        drugAResult = eachBenzo;
        doseA = eachBenzo.diazvalue;
        logger.debug(`[${PREFIX}] ${drugA} dose_a: ${doseA}`);
      }
      if (eachBenzo.name === drugB) {
        drugBResult = eachBenzo;
        doseB = eachBenzo.diazvalue;
        logger.debug(`[${PREFIX}] ${drugB} dose_b: ${doseB}`);
      }
    }

    const result = (dosage / doseA) * doseB;
    let drugADosageText = '';
    if (drugAResult.formatted_dose.Oral) {
      console.log(`[${PREFIX}] ${drugA} is Oral`); // eslint-disable-line
      drugADosageText = `\
            ${drugAResult.formatted_dose.Oral.Light ? `Light: ${drugAResult.formatted_dose.Oral.Light}\n` : ''}\
            ${drugAResult.formatted_dose.Oral.Low ? `Low: ${drugAResult.formatted_dose.Oral.Low}\n` : ''}\
            ${drugAResult.formatted_dose.Oral.Common ? `Common: ${drugAResult.formatted_dose.Oral.Common}\n` : ''}\
            ${drugAResult.formatted_dose.Oral.Heavy ? `Heavy: ${drugAResult.formatted_dose.Oral.Heavy}\n` : ''}\
            ${drugAResult.formatted_dose.Oral.Strong ? `Strong: ${drugAResult.formatted_dose.Oral.Strong}\n` : ''}`;
    } else if (drugAResult.formatted_dose.Light) {
      console.log(`[${PREFIX}] ${drugA} is Light`); // eslint-disable-line
      drugADosageText = `\
            ${drugAResult.formatted_dose.Light.Light ? `Light: ${drugAResult.formatted_dose.Light.Light}\n` : ''}\
            ${drugAResult.formatted_dose.Light.Low ? `Low: ${drugAResult.formatted_dose.Light.Low}\n` : ''}\
            ${drugAResult.formatted_dose.Light.Common ? `Common: ${drugAResult.formatted_dose.Light.Common}\n` : ''}\
            ${drugAResult.formatted_dose.Light.Heavy ? `Heavy: ${drugAResult.formatted_dose.Light.Heavy}\n` : ''}\
            ${drugAResult.formatted_dose.Light.Strong ? `Strong: ${drugAResult.formatted_dose.Light.Strong}\n` : ''}`;
    }

    let drugBDosageText = '';
    if (drugBResult.formatted_dose.Oral) {
      console.log(`[${PREFIX}] ${drugA} is Oral`); // eslint-disable-line
      drugBDosageText = `\
            ${drugBResult.formatted_dose.Oral.Light ? `Light: ${drugBResult.formatted_dose.Oral.Light}\n` : ''}\
            ${drugBResult.formatted_dose.Oral.Low ? `Low: ${drugBResult.formatted_dose.Oral.Low}\n` : ''}\
            ${drugBResult.formatted_dose.Oral.Common ? `Common: ${drugBResult.formatted_dose.Oral.Common}\n` : ''}\
            ${drugBResult.formatted_dose.Oral.Heavy ? `Heavy: ${drugBResult.formatted_dose.Oral.Heavy}\n` : ''}\
            ${drugBResult.formatted_dose.Oral.Strong ? `Strong: ${drugBResult.formatted_dose.Oral.Strong}\n` : ''}`;
    } else if (drugBResult.formatted_dose.Light) {
      console.log(`[${PREFIX}] ${drugA} is Light`); // eslint-disable-line
      drugBDosageText = `\
            ${drugBResult.formatted_dose.Light.Light ? `Light: ${drugBResult.formatted_dose.Light.Light}\n` : ''}\
            ${drugBResult.formatted_dose.Light.Low ? `Low: ${drugBResult.formatted_dose.Light.Low}\n` : ''}\
            ${drugBResult.formatted_dose.Light.Common ? `Common: ${drugBResult.formatted_dose.Light.Common}\n` : ''}\
            ${drugBResult.formatted_dose.Light.Heavy ? `Heavy: ${drugBResult.formatted_dose.Light.Heavy}\n` : ''}\
            ${drugBResult.formatted_dose.Light.Strong ? `Strong: ${drugBResult.formatted_dose.Light.Strong}\n` : ''}`;
    }

    // const row = new MessageActionRow()
    //     .addComponents(
    //         new MessageSelectMenu()
    //             .setCustomId('select')
    //             .setPlaceholder('Nothing selected')
    //             .addOptions(final_list),
    //     );

    const embed = template.embedTemplate()
      .setColor('RANDOM')
      .setTitle(`${dosage} mg of ${drugA} is ${result} mg of ${drugB}`)
      .setDescription(`
        This is a simple tool made to help you figure out how much of a given benzodiazepine dose converts into another benzodiazepine dose.\n\n\
        **Please make sure to research the substances thoroughly before using them.**\n\n\
        A good idea is to compare the effects of the two different benzodiazepines, as even though the dose is 'similiar' you might not get the effects you're used to.\n\n\
        Important: Equivalent doses may be inaccurate for larger quantities of benzos with different effect profiles. Please compare the dosages below to see weighted dosage ranges.\n\n\
        Note: It's a good idea to start with a lower dose than the calculator shows, since everybody can react differently to different substances.\n
      `)
      .addFields(
        { name: `${drugA} Summary`, value: `${drugAResult.properties.summary}`, inline: true },
        { name: `${drugB} Summary`, value: `${drugBResult.properties.summary}`, inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: 'Effects', value: `${drugAResult.properties.effects}`, inline: true },
        { name: 'Effects', value: `${drugBResult.properties.effects}`, inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: 'Dose', value: `${drugADosageText}`, inline: true },
        { name: 'Dose', value: `${drugBDosageText}`, inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: 'Duration', value: `${drugAResult.properties.duration}`, inline: true },
        { name: 'Duration', value: `${drugBResult.properties.duration}`, inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: 'After Effects', value: `${drugAResult.properties['after-effects']}`, inline: true },
        { name: 'After Effects', value: `${drugBResult.properties['after-effects']}`, inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
      );
    if (!interaction.replied) {
      interaction.reply({ embeds: [embed], ephemeral: false });
    } else {
      interaction.followUp({ embeds: [embed], ephemeral: false });
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
