import {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
} from 'discord.js';
import {
  ButtonStyle,
} from 'discord-api-types/v10';
import {SlashCommand} from '../../utils/commandDef';
import logger from '../../../global/utils/logger';
import {paginationEmbed} from '../../utils/pagination';

import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const ping: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Health check'),
  async execute(interaction) {
    const embed1 = new EmbedBuilder()
        .setTitle('First Page')
        .setDescription('This is the first page');

    const embed2 = new EmbedBuilder()
        .setTitle('Second Page')
        .setDescription('This is the second page');

    const button1 = new ButtonBuilder()
        .setCustomId('previousbtn')
        .setLabel('Previous')
        .setStyle(ButtonStyle.Danger);

    const button2 = new ButtonBuilder()
        .setCustomId('nextbtn')
        .setLabel('Next')
        .setStyle(ButtonStyle.Success);

    // Create an array of embeds
    const pages = [
      embed1,
      embed2,
      // ....
      // embedN
    ];

    // create an array of buttons

    const buttonList = [
      button1,
      button2,
    ];
    // Call the paginationEmbed method, first three arguments are required
    // timeout is the time till the reaction collectors are active,
    // after this you can't change pages (in ms), defaults to 120000
    paginationEmbed(interaction, pages, buttonList, 120000);
    // There you go, now you have paged embeds
    logger.debug(`[${PREFIX}] finished!`);
  },
};
