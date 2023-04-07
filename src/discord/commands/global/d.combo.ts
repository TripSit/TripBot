import {
  SlashCommandBuilder,
  Colors,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { combo } from '../../../global/commands/g.combo';
import { commandContext } from '../../utils/context';

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

    const embed = embedTemplate()
      .setTitle(results.title)
      .setDescription(results.description);
    if (results.thumbnail) embed.setThumbnail(results.thumbnail);
    if (results.color) embed.setColor(Colors[results.color as keyof typeof Colors]);
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dCombo;
