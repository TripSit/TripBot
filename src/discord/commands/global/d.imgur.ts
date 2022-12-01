import {
  SlashCommandBuilder,
} from 'discord.js';
import { parse } from 'path';
import { SlashCommand } from '../../@types/commandDef';
import { imgurSearch } from '../../../global/commands/g.imgur';
import { startLog } from '../../utils/startLog';
// import log from '../../../global/utils/log';
const PREFIX = parse(__filename).name;

export default dImgur;

export const dImgur: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('imgur')
    .setDescription('Search Imgur')
    .addStringOption(option => option
      .setName('search')
      .setDescription('What are you looking for?')
      .setRequired(true))
    .addStringOption(option => option
      .setName('sort')
      .setDescription('How should the results be sorted?')
      .addChoices(
        { name: 'Default: Top', value: 'top' },
        { name: 'Viral', value: 'viral' },
        { name: 'Time', value: 'time' },
      ))
    .addStringOption(option => option
      .setName('window')
      .setDescription('How far back should we look?')
      .addChoices(
        { name: 'Default: All', value: 'all' },
        { name: 'Day', value: 'day' },
        { name: 'Week', value: 'week' },
        { name: 'Month', value: 'month' },
        { name: 'Year', value: 'year' },
      )),
  async execute(interaction) {
    startLog(PREFIX, interaction);
    // Sometimes the API takes a few seconds to respond.
    const search = interaction.options.getString('search');
    const sort = interaction.options.getString('sort') || 'top';
    const window = interaction.options.getString('window') || 'all';
    // log.debug(`[${PREFIX}] query: ${search}`);
    // log.debug(`[${PREFIX}] sort: ${sort}`);
    // log.debug(`[${PREFIX}] window: ${window}`);

    await interaction.deferReply();

    const sortStr = `${sort}/`;
    const windowStr = `${window}/`;

    // eslint-disable-next-line max-len
    const query = `https://api.imgur.com/3/gallery/search/${sort !== null ? sortStr : ''}${window !== null ? windowStr : ''}?q=${search}`;
    // log.debug(`[${PREFIX}] query: ${query}`);

    const url = await imgurSearch(query);

    // log.debug(`[${PREFIX}] url: ${url}`);

    await interaction.editReply(url);
    return true;
  },
};
