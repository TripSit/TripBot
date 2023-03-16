import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { coinflip } from '../../../global/commands/g.coinflip';
import { startLog } from '../../utils/startLog';
// import log from '../../../global/utils/log';
const F = f(__filename);

export default dCoinflip;

export const dCoinflip: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin')
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(interaction) {
    startLog(F, interaction);
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    await interaction.editReply({ content: await coinflip() });
    return true;
  },

};
