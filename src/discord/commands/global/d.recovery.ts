import {
  SlashCommandBuilder,
} from 'discord.js';
import { parse } from 'path';
import { SlashCommand } from '../../@types/commandDef';
import { recovery } from '../../../global/commands/g.recovery';
import { startLog } from '../../utils/startLog';

const PREFIX = parse(__filename).name;

export default dRecovery;

export const dRecovery: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('recovery')
    .setDescription('Information that may be helpful in a serious situation.'),
  async execute(interaction) {
    startLog(PREFIX, interaction);
    interaction.reply(await recovery());
    return true;
  },
};
