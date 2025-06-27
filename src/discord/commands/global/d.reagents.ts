import {
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { reagents } from '../../../global/commands/g.reagents';
// import log from '../../../global/utils/log';
const F = f(__filename);

export const dReagents: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('reagents')
    .setDescription('Display reagent color chart!')
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    await interaction.editReply({ content: await reagents() });
    try {
      await interaction.editReply({ content: await reagents() });
    } catch (error) {
      log.error(F, `${error}`);
      await interaction.deleteReply();
      await interaction.followUp({ content: await reagents(), flags: MessageFlags.Ephemeral });
    }
    return true;
  },
};

export default dReagents;
