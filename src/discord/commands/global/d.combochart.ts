import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { combochart } from '../../../global/commands/g.combochart';
import { startLog } from '../../utils/startLog';

const F = f(__filename);

export default dCombochart;

export const dCombochart: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('combochart')
    .setDescription('Display TripSit\'s Combo Chart')
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(interaction) {
    startLog(F, interaction);
    const ephemeral:boolean = (interaction.options.getBoolean('ephemeral') === true);
    interaction.reply({ content: await combochart(), ephemeral });
    return true;
  },
};
