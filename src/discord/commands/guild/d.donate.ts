import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { donatePage } from '../global/d.help';

const F = f(__filename);

export const dDonate: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('donate')
    .setDescription('Get information on supporting TripSit')
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    await interaction.editReply(await donatePage());
    return true;
  },
};

export default dDonate;
