import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../utils/commandDef';
import {recovery} from '../../../global/commands/g.recovery';

export const discordTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('recovery')
      .setDescription('Information that may be helpful in a serious situation.'),
  async execute(interaction) {
    interaction.reply(await recovery());
  },
};
