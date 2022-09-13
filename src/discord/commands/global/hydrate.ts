import {
  Colors,
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../utils/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const discordTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('hydrate')
      .setDescription('Remember to hydrate!'),

  async execute(interaction) {
    const output = '💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊\n\n' +
        '⚠️ ＨＹＤＲＡＴＩＯＮ ＲＥＭＩＮＤＥＲ ⚠️\n\n' +
        '💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊';
    const embed = embedTemplate()
        .setColor(Colors.DarkBlue)
        .setDescription(output)
        .setAuthor(null)
        .setFooter(null);

    if (!interaction.replied) {
      interaction.reply({
        embeds: [embed],
        ephemeral: false,
      });
    } else {
      interaction.followUp({
        embeds: [embed],
        ephemeral: false,
      });
    }

    logger.debug(`[${PREFIX}] finished!`);
  },
};
