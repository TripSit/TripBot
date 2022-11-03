import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand1} from '../../@types/commandDef';
import {recovery} from '../../../global/commands/g.recovery';

export const drecovery: SlashCommand1 = {
  data: new SlashCommandBuilder()
    .setName('recovery')
    .setDescription('Information that may be helpful in a serious situation.'),
  async execute(interaction) {
    interaction.reply(await recovery());
    return true;
  },
};
