import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { grounding } from '../../../global/commands/g.grounding';
import { startLog } from '../../utils/startLog';
// import log from '../../../global/utils/log';
const F = f(__filename);

export const dGrounding: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('grounding')
    .setDescription('Send an image with the 5-senses grounding exercise')
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(interaction:ChatInputCommandInteraction) {
    startLog(F, interaction);
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    await interaction.editReply({ content: await grounding() });
    return true;
  },
};

export default dGrounding;
