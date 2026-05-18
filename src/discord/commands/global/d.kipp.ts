import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
// import log from '../../../global/utils/log';
import commandContext from '../../utils/context';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const dKipp: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('kipp')
    .setNameLocalizations(getCommandLocalizations('kipp', 'commandName'))
    .setDescription('Keep it positive please!')
    .setDescriptionLocalizations(getCommandLocalizations('kipp', 'commandDescription'))
    .setIntegrationTypes([0]),

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'kipp');
    await interaction.deferReply({});
    const happyEmojis = [
      '😀', '😃', '😄', '😊', '😁', '🥰', '😇', '😍', '😂', '🤣',
      '🙂', '😆', '😋', '😛', '🙃', '😜', '🤪', '😝', '🤗', '🤭',
      '😎', '😺', '😸', '😹', '😻', '👍', '✌'];

    // Get 10 random happy emojis from the list above
    const rowA = [...happyEmojis].sort(() => 0.5 - Math.random()).slice(0, 8); // Sort the array

    // log.debug(F, `Row A: ${rowA}`);
    const rowB = `\n${t(locale, 'kipp', 'message')}\n`;
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
