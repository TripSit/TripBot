import {
  SlashCommandBuilder,
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { combo } from '../../../global/commands/g.combo';
import commandContext from '../../utils/context';

const F = f(__filename);

export const dCombo: SlashCommand = {
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
      .setAutocomplete(true))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral:boolean = (interaction.options.getBoolean('ephemeral') === true);
    await interaction.deferReply({ ephemeral });
    const drugA = interaction.options.getString('first_drug', true);
    const drugB = interaction.options.getString('second_drug', true);

    const results = await combo(drugA, drugB);

    if ((results as {
      err: boolean;
      msg: string;
      options?: string[];
    }).err) {
      const errorResults = results as {
        err: boolean;
        msg: string;
        options?: string[];
      };
      if (errorResults.msg.includes('not found')) {
        await interaction.editReply(stripIndents`${drugA} and ${drugB} have no known interactions!

        This does not mean combining them is safe: this means we don't have information on it!`);
        return false;
      }

      await interaction.editReply(errorResults.msg);
      return false;
    }

    const resultsData = results as {
      result: string;
      definition: string;
      thumbnail: string;
      color: string;
      emoji: string;
      interactionCategoryA: string;
      interactionCategoryB: string;
      note?: string;
      source?: string;
    };

    const embed = embedTemplate()
      .setTitle(`Mixing ${drugA} and ${drugB}: ${resultsData.emoji} ${resultsData.result} ${resultsData.emoji}`)
      .setDescription(resultsData.definition);
    if (resultsData.thumbnail) embed.setThumbnail(resultsData.thumbnail);
    if (resultsData.color) embed.setColor(Colors[resultsData.color as keyof typeof Colors]);
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dCombo;
