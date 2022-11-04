import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import log from '../../../global/utils/log';
import {startLog} from '../../utils/startLog';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

export const dkipp: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('kipp')
    .setDescription('Keep it positive please!'),

  async execute(interaction) {
    startLog(PREFIX, interaction);
    const happyEmojis = [
      '😀', '😃', '😄', '😊', '😁', '🥰', '😇', '😍', '😂', '🤣',
      '🙂', '😆', '😋', '😛', '🙃', '😜', '🤪', '😝', '🤗', '🤭',
      '😎', '😺', '😸', '😹', '😻', '👍', '✌'];

    // Get 10 random happy emojis from the list above
    const rowA = happyEmojis.sort(() => 0.5 - Math.random()).slice(0, 8);
    log.debug(`[${PREFIX}] Row A: ${rowA}`);
    const rowB = '\n💜Keep It Positive Please!💜\n';
    log.debug(`[${PREFIX}] Row B: ${rowB}`);
    const rowC = happyEmojis.sort(() => 0.5 - Math.random()).slice(0, 8);
    log.debug(`[${PREFIX}] Row C: ${rowC}`);
    const output = rowA.join(' ') + rowB + rowC.join(' ');
    log.debug(`[${PREFIX}] Output: ${output}`);

    const embed = embedTemplate()
      .setDescription(output)
      .setAuthor(null)
      .setFooter(null);
    interaction.reply({embeds: [embed], ephemeral: false});
    return true;
  },
};
