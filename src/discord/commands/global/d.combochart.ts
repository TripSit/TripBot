import {
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { combochart } from '../../../global/commands/g.combochart';
import commandContext from '../../utils/context';

const F = f(__filename);

export const dCombochart: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('combochart')
    .setDescription('Display TripSit\'s Combo Chart')
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    await interaction.editReply({ content: await combochart() });
    try {
      await interaction.editReply({ content: await combochart() });
    } catch (error) {
      log.error(F, `${error}`);
      await interaction.deleteReply();
      await interaction.followUp({
        content: await combochart(),
        flags: MessageFlags.Ephemeral,
      });
    }
    return true;
  },
};

export default dCombochart;
