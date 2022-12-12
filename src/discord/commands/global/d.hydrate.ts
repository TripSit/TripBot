import { stripIndents } from 'common-tags';
import {
  Colors,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { startLog } from '../../utils/startLog';
// import log from '../../../global/utils/log';
const F = f(__filename);

export default dHydrate;

export const dHydrate: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('hydrate')
    .setDescription('Remember to hydrate!'),

  async execute(interaction) {
    startLog(F, interaction);
    const output = stripIndents`
    💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊
    ⚠️ ＨＹＤＲＡＴＩＯＮ ＲＥＭＩＮＤＥＲ ⚠️
    💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊`;
    const embed = embedTemplate()
      .setColor(Colors.DarkBlue)
      .setDescription(output)
      .setAuthor(null)
      .setFooter(null);

    interaction.reply({ embeds: [embed] });
    return true;
  },
};
