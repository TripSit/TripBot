import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { recovery } from '../../../global/commands/g.recovery';
import { startLog } from '../../utils/startLog';

const F = f(__filename);

export default dRecovery;

export const dRecovery: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('recovery')
    .setDescription('Information that may be helpful in a serious situation.'),
  async execute(interaction) {
    startLog(F, interaction);
    interaction.reply(await recovery());
    return true;
  },
};
