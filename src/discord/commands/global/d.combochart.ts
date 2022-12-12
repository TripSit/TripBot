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
    .setDescription('Display TripSit\'s Combo Chart'),
  async execute(interaction) {
    startLog(F, interaction);
    interaction.reply(await combochart());
    return true;
  },
};
