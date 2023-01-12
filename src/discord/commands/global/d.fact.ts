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
    .setDescription('Random fact'),

  async execute(interaction) {
    startLog(F, interaction);
    const data = await fact();

    log.debug(F, `data: ${JSON.stringify(data, null, 2)}`);

    const embed = embedTemplate();
    embed.setTitle(data);

    interaction.reply({ embeds: [embed] });
    return true;
  },
};
