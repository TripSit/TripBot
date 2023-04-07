import { stripIndents } from 'common-tags';
import {
  Colors,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { commandContext } from '../../utils/context';
// import log from '../../../global/utils/log';
const F = f(__filename);

export const dHydrate: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('hydrate')
    .setDescription('Remember to hydrate!'),

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: false });
    const output = stripIndents`
    💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊
    ⚠️ ＨＹＤＲＡＴＩＯＮ ＲＥＭＩＮＤＥＲ ⚠️
    💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊`;
    const embed = embedTemplate()
      .setColor(Colors.DarkBlue)
      .setDescription(output)
      .setAuthor(null)
      .setFooter(null);

    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dHydrate;
