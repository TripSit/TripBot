import {
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { coinflip } from '../../../global/commands/g.coinflip';
import commandContext from '../../utils/context';
// import log from '../../../global/utils/log';
const F = f(__filename);

export const dCoinflip: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin')
    .setIntegrationTypes([0])
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    await interaction.editReply({ content: await coinflip() });
    return true;
  },

};

export default dCoinflip;
