import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {recovery} from '../../../global/commands/g.recovery';
import {startLog} from '../../utils/startLog';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

export const drecovery: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('recovery')
    .setDescription('Information that may be helpful in a serious situation.'),
  async execute(interaction) {
    startLog(PREFIX, interaction);
    interaction.reply(await recovery());
    return true;
  },
};
