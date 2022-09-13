import {
  SlashCommandBuilder,
  Colors,
} from 'discord.js';
import {SlashCommand} from '../../utils/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

import drugDataAll from '../../../global/assets/data/drug_db_combined.json';
import comboDefs from '../../../global/assets/data/combo_definitions.json';

// type drugRoas = {
//   name: string,
//   dosage: {
//     name: string,
//     value: string,
//   }[],
//   duration: {
//     name: string,
//     value: string,
//   }[],
// }

// type drugDataType = {
//   url: string,
//   experiencesUrl: string,
//   name: string,
//   aliases: string[],
//   asiasesStr: string,
//   summary: string,
//   reagents: string,
//   classes: {
//     chemical: string[]
//     psychoactive: string[]
//   },
//   toxicity: string[],
//   addictionPotential: string,
//   tolerance: {
//     full: string,
//     half: string,
//     zero: string,
//   }
//   crossTolerances: string[],
//   roas: drugRoas[],
//   interactions: {
//     status: string,
//     note?: string,
//     name: string,
//   },
// }[];

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

    const embed = embedTemplate();

    if (drugDataAll === null || drugDataAll === undefined) {
      logger.error(`[${PREFIX}] drugDataAll is null or undefined`);
      embed.setTitle(`Drug data was not found`);
      embed.setDescription(
          '...this shouldn\'t have happened, please tell the developer!');
      // If this happens then something happened to the data files
      interaction.reply({embeds: [embed]});
      return;
    }

    const drugData = drugDataAll.find((drug) => drug.name === drugA);

    // logger.debug(`[${PREFIX}] drugData: ${JSON.stringify(drugData, null, 2)}`);

    if (!drugData) {
      embed.setTitle(`${drugA} was not found`);
      embed.setDescription(
          '...this shouldn\'t have happened, please tell the developer!');
      // If this happens then something went wrong with the auto-complete
      interaction.reply({embeds: [embed]});
      return;
    }

    if (!drugData.interactions) {
      embed.setTitle(`${drugA} has no known interactions!`);
      embed.setDescription(
          'This does not mean combining this with anything is safe!\nThis means we don\'t have information on it!');
      interaction.reply({embeds: [embed]});
      return;
    }

    // logger.debug(`[${PREFIX}] interactions: ${drugData.interactions.length}`);

    const drugInteraction = drugData.interactions.find((interaction) => interaction.name === drugB);

    if (!drugInteraction) {
      embed.setTitle(`${drugA} and ${drugB} have no known interactions!`);
      embed.setDescription(
          'This does not mean combining them is safe!\nThis means we don\'t have information on it!');
      interaction.reply({embeds: [embed]});
      return;
    }

    // logger.debug(`[${PREFIX}] drugInteraction: ${drugInteraction}`);

    const intDef = comboDefs.find((def) => def.status === drugInteraction.status)!;

    // logger.debug(`[${PREFIX}] intDef: ${JSON.stringify(intDef)}`);

    const {
      status,
      emoji,
      definition,
      thumbnail,
    } = intDef;
    const {color} = intDef;
    const output = `${emoji} ${status} ${emoji}`;
    embed.addFields(
        {name: 'Result', value: output},
        {name: 'Definition', value: definition},
    );
    embed.setThumbnail(thumbnail);

    // logger.debug(`[${PREFIX}] color: ${color}`);
    embed.setColor(Colors[color as keyof typeof Colors]);

    interaction.reply({embeds: [embed]});

    logger.debug(`[${PREFIX}] finished!`);
  },
};
