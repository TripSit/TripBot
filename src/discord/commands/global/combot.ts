import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../utils/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import logger from '../../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

import drugDataAll from '../../../global/assets/data/drug_db_combined.json';
import comboDefs from '../../../global/assets/data/combo_definitions.json';

type drugData = {
  url: string,
  experiencesUrl: string,
  name: string,
  aliases: string[],
  asiasesStr: string,
  summary: string,
  reagents: string,
  classes: {
    [key: 'chemicial']: string[],
  },
  // toxicity: string[],
  // addictionPotential: string,
  // tolerance: {
  //   [key: 'full' | 'half' | 'zero']: string[],
  // }
  // crossTolerances: string[],
  // roas: {
  //   [key: 'name']: string,
  //   [key: 'dosage']: {
  //     [key: 'name' | 'value']: string,
  //   }[],
  //   [key: 'duration']: {
  //     [key: 'name' | 'value']: string,
  //   }[]},
  // }[],
};

export const discordTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('combo')
      .setDescription('Check combo information')
      .addStringOption((option) => option.setName('first_drug')
          .setDescription('Pick the first drug')
          .setRequired(true)
          .setAutocomplete(true))
      .addStringOption((option) => option.setName('second_drug')
          .setDescription('Pick the second drug')
          .setRequired(true)
          .setAutocomplete(true)),
  async execute(interaction) {
    const drugA = interaction.options.getString('first_drug');
    const drugB = interaction.options.getString('second_drug');
    logger.debug(`[${PREFIX}] drug_a: ${drugA} | drug_b: ${drugB}`);

    const drugData = drugDataAll.find((drug) => drug.name === drugA);
    if (!drugData) {
      return interaction.reply('Drug not found');
    }

    for (let i = 0; i < Object.keys(drugDataAll).length; i += 1) {
      if (drugDataAll[i]) {
        if (drugDataAll[i].name === drugA) {
          logger.debug(`[${PREFIX}] Found drug_a: ${drugA}`);
          const embed = embedTemplate()
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
                    const {definition} = comboDefs[k];
                    const {emoji} = comboDefs[k];
                    const {color} = comboDefs[k];
                    const {thumbnail} = comboDefs[k];
                    const output = `${emoji} ${result} ${emoji}`;
                    embed.addFields(
                        {name: 'Result', value: output},
                        {name: 'Definition', value: definition},
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
              embed.setDescription(
                  'This does not mean combining them is safe!\nThis means we don\'t have information on it!');
            }
          } else {
            embed.setTitle(`${drugA} and ${drugB} have no known interactions!`);
            embed.setDescription(
                'This does not mean combining them is safe!\nThis means we don\'t have information on it!');
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
