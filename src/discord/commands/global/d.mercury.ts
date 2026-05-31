import {
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { mercury } from '../../../global/commands/g.mercury';
import commandContext from '../../utils/context';

const F = f(__filename);

export const dMercury: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('mercury')
    .setDescription('Is Mercury in retrograde right now?')
    .setIntegrationTypes([0])
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    await interaction.editReply({ content: await mercury() });
    return true;
  },
};

export default dMercury;
