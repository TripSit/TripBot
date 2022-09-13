import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const dkipp: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('kipp')
      .setDescription('Keep it positive please!'),

  async execute(interaction) {
    const happyEmojis = [
      '😀', '😃', '😄', '😊', '😁', '🥰', '😇', '😍', '😂', '🤣',
      '🙂', '😆', '😋', '😛', '🙃', '😜', '🤪', '😝', '🤗', '🤭',
      '😎', '😺', '😸', '😹', '😻', '👍', '✌'];

    // Get 10 random happy emojis from the list above
    const rowA = happyEmojis.sort(() => 0.5 - Math.random()).slice(0, 8);
    logger.debug(`[${PREFIX}] Row A: ${rowA}`);
    const rowB = '\n💜Keep It Positive Please!💜\n';
    logger.debug(`[${PREFIX}] Row B: ${rowB}`);
    const rowC = happyEmojis.sort(() => 0.5 - Math.random()).slice(0, 8);
    logger.debug(`[${PREFIX}] Row C: ${rowC}`);
    const output = rowA.join(' ') + rowB + rowC.join(' ');
    logger.debug(`[${PREFIX}] Output: ${output}`);

    const embed = embedTemplate()
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
