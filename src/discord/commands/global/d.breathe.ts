import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { breathe } from '../../../global/commands/g.breathe';
import { startLog } from '../../utils/startLog';
// import log from '../../../global/utils/log';
const F = f(__filename);

export default dBreathe;

export const dBreathe: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('breathe')
    .setDescription('Remember to breathe')
    .addStringOption(option => option.setName('exercise')
      .setDescription('Which exercise?')
      .addChoices(
        { name: '1', value: '1' },
        { name: '2', value: '2' },
        { name: '3', value: '3' },
        { name: '4', value: '4' },
      )),
  async execute(interaction) {
    startLog(F, interaction);
    const choice = interaction.options.getString('exercise');
    const data = await breathe(choice);
    interaction.reply(data);
    return true;
  },
};
