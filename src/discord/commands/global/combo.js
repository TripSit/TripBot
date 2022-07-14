'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');
const drugDataAll = require('../../../global/assets/data/drug_db_combined.json');
const comboDefs = require('../../../global/assets/data/combo_definitions.json');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('combo')
    .setDescription('Check combo information')
    .addStringOption(option => option.setName('first_drug')
      .setDescription('Pick the first drug')
      .setRequired(true)
      .setAutocomplete(true))
    .addStringOption(option => option.setName('second_drug')
      .setDescription('Pick the second drug')
      .setRequired(true)
      .setAutocomplete(true)),

  async execute(interaction, parameters) {
    const drugA = interaction.options.getString('first_drug') || parameters.at(0);
    const drugB = interaction.options.getString('second_drug') || parameters.at(1);
    logger.debug(`[${PREFIX}] drug_a: ${drugA} | drug_b: ${drugB}`);

    for (let i = 0; i < Object.keys(drugDataAll).length; i += 1) {
      if (drugDataAll[i]) {
        if (drugDataAll[i].name === drugA) {
          logger.debug(`[${PREFIX}] Found drug_a: ${drugA}`);
          const embed = template.embedTemplate()
            .setTitle(`${drugA} and ${drugB} combined:`);
          if (drugDataAll[i].interactions) {
            logger.debug(`[${PREFIX}] drug_a has interactions`);
            let result = '';
            for (let j = 0; j < drugDataAll[i].interactions.length; j += 1) {
              if (drugDataAll[i].interactions[j].name === drugB) {
                logger.debug(`[${PREFIX}] Found drug_b: ${drugB}`);
                result = drugDataAll[i].interactions[j].status;
                // Loop through combo_defs and find the object where "status" is equal to result
                for (let k = 0; k < comboDefs.length; k += 1) {
                  if (comboDefs[k].status === result) {
                    logger.debug(`[${PREFIX}] Found combo_defs: ${comboDefs[k].status}`);
                    const { definition } = comboDefs[k];
                    const { emoji } = comboDefs[k];
                    const { color } = comboDefs[k];
                    const { thumbnail } = comboDefs[k];
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
            if (result === '') {
              embed.setTitle(`${drugA} and ${drugB} have no known interactions!`);
              embed.setDescription('This does not mean combining them is safe!\nThis means we don\'t have information on it!');
            }
          } else {
            embed.setTitle(`${drugA} and ${drugB} have no known interactions!`);
            embed.setDescription('This does not mean combining them is safe!\nThis means we don\'t have information on it!');
          }
          if (!interaction.replied) {
            interaction.reply({
              embeds: [embed],
              ephemeral: false,
            });
          } else {
            interaction.followUp({
              embeds: [embed],
              ephemeral: false,
            });
          }
          logger.debug(`[${PREFIX}] finished!`);
          return;
        }
      }
    }
  },
};
