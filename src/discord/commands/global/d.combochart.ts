import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { combochart } from '../../../global/commands/g.combochart';
import { commandContext } from '../../utils/context';

const F = f(__filename);

export const dCombochart: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('combochart')
    .setDescription('Display TripSit\'s Combo Chart')
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    await interaction.editReply({ content: await combochart() });
    return true;
  },
};

export default dCombochart;
