import {
  SlashCommandBuilder,
} from 'discord.js';
import { parse } from 'path';
import { SlashCommand } from '../../@types/commandDef';
import { combochart } from '../../../global/commands/g.combochart';
import { startLog } from '../../utils/startLog';

const PREFIX = parse(__filename).name;

export default dCombochart;

export const dCombochart: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('combochart')
    .setDescription('Display TripSit\'s Combo Chart'),
  async execute(interaction) {
    startLog(PREFIX, interaction);
    interaction.reply(await combochart());
    return true;
  },
};
