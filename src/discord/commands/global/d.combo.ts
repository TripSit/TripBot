import {
  SlashCommandBuilder,
  Colors,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {combo} from '../../../global/commands/g.combo';
import log from '../../../global/utils/log';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const dCombo: SlashCommand = {
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
    const drugA = interaction.options.getString('first_drug', true);
    const drugB = interaction.options.getString('second_drug', true);
    log.debug(`[${PREFIX}] drug_a: ${drugA} | drug_b: ${drugB}`);

    const results = await combo(drugA, drugB);

    const embed = embedTemplate()
      .setTitle(results.title)
      .setDescription(results.description);
    if (results.thumbnail) embed.setThumbnail(results.thumbnail);
    if (results.color) embed.setColor(Colors[results.color as keyof typeof Colors]);
    interaction.reply({embeds: [embed]});
    return true;
  },
};
