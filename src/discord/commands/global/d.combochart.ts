import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {combochart} from '../../../global/commands/g.combochart';
import {startLog} from '../../utils/startLog';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

export const dcombochart: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('combochart')
    .setDescription('Display TripSit\'s Combo Chart'),
  async execute(interaction) {
    startLog(PREFIX, interaction);
    interaction.reply(await combochart());
    return true;
  },
};
