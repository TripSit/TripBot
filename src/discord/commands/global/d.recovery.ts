import {
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { recovery } from '../../../global/commands/g.recovery';
import commandContext from '../../utils/context';

const F = f(__filename);

export const dRecovery: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('recovery')
    .setDescription('Information that may be helpful in a serious situation.')
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    await interaction.editReply({ content: await recovery() });
    return true;
  },
};

export default dRecovery;
