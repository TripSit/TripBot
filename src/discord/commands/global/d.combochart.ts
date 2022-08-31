import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../utils/commandDef';
import {combochart} from '../../../global/commands/g.combochart';

export const discordTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('combochart')
      .setDescription('Display TripSit\'s Combo Chart'),
  async execute(interaction) {
    interaction.reply(await combochart());
  },
};
