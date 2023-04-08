import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
// import log from '../../../global/utils/log';
import { commandContext } from '../../utils/context';

const F = f(__filename);

export const dKipp: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('kipp')
    .setDescription('Keep it positive please!'),

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: false });
    const happyEmojis = [
      '😀', '😃', '😄', '😊', '😁', '🥰', '😇', '😍', '😂', '🤣',
      '🙂', '😆', '😋', '😛', '🙃', '😜', '🤪', '😝', '🤗', '🤭',
      '😎', '😺', '😸', '😹', '😻', '👍', '✌'];

    // Get 10 random happy emojis from the list above
    const rowA = [...happyEmojis].sort(() => 0.5 - Math.random()).slice(0, 8); // Sort the array

    // log.debug(F, `Row A: ${rowA}`);
    const rowB = '\n💜Keep It Positive Please!💜\n';
    // log.debug(F, `Row B: ${rowB}`);
    const rowC = [...happyEmojis].sort(() => 0.5 - Math.random()).slice(0, 8); // Sort the array
    // log.debug(F, `Row C: ${rowC}`);
    const output = rowA.join(' ') + rowB + rowC.join(' ');
    // log.debug(F, `Output: ${output}`);

    const embed = embedTemplate()
      .setDescription(output)
      .setAuthor(null)
      .setFooter(null);
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dKipp;
