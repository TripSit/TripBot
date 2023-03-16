import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { fact } from '../../../global/commands/g.fact';
import { startLog } from '../../utils/startLog';
// import log from '../../../global/utils/log';
const F = f(__filename);

export default dFact;

export const dFact: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('fact')
    .setDescription('Random fact')
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),

  async execute(interaction) {
    startLog(F, interaction);
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    const data = await fact();

    // log.debug(F, `data: ${JSON.stringify(data, null, 2)}`);

    const embed = embedTemplate();
    embed.setTitle(data);

    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};
