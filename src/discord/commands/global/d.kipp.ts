import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';

const F = f(__filename);

export const dKipp: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('kipp')
    .setDescription('Keep it positive please!')
    .setIntegrationTypes([0]),

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({});
    const happyEmojis = [
      '😀', '😃', '😄', '😊', '😁', '🥰', '😇', '😍', '😂', '🤣',
      '🙂', '😆', '😋', '😛', '🙃', '😜', '🤪', '😝', '🤗', '🤭',
      '😎', '😺', '😸', '😹', '😻', '👍', '✌'];

    // Get 10 random happy emojis from the list above
    const rowA = [...happyEmojis].sort(() => 0.5 - Math.random()).slice(0, 8); // Sort the array

    const rowB = '\n💜Keep It Positive Please!💜\n';
    const rowC = [...happyEmojis].sort(() => 0.5 - Math.random()).slice(0, 8); // Sort the array
    // log.debug(F, `Row C: ${rowC}`);
    const output = rowA.join(' ') + rowB + rowC.join(' ');

    const embed = embedTemplate()
      .setDescription(output)
      .setAuthor(null)
      .setFooter(null);
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dKipp;
