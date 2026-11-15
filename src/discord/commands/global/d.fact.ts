import {
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { fact } from '../../../global/commands/g.fact';
import commandContext from '../../utils/context';

const F = f(__filename);

export const dFact: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('fact')
    .setDescription('Random fact')
    .setIntegrationTypes([0])
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')) as SlashCommandBuilder,

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const data = await fact();

    const embed = embedTemplate();
    embed.setTitle(data);

    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dFact;
