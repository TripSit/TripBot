import {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  // TextChannel,
} from 'discord.js';
import {
  ButtonStyle,
} from 'discord-api-types/v10';
// import env from '../../../global/utils/env.config';
import {SlashCommand} from '../../@types/commandDef';
import logger from '../../../global/utils/logger';
import {paginationEmbed} from '../../utils/pagination';

import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const ping: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Health check'),
  async execute(interaction) {
    const role = interaction.guild!.roles.cache.find((r) => r.name === 'TripBot');

    const user = interaction.client.users.cache.get('332687787172167680');

    logger.debug(`[${PREFIX}] user: ${user}`);

    user!.send('Hello!');

    const embed1 = new EmbedBuilder()
      .setTitle('First Page')
      .setDescription(`
        role.icon: ${role?.icon}
        role.iconUrl: ${role?.iconURL()}
        role.unicodeEmoji: ${role?.unicodeEmoji}
        `);

    const embed2 = new EmbedBuilder()
      .setTitle('Second Page')
      .setDescription('This is the second page');

    const button1 = new ButtonBuilder()
      .setCustomId('previousbtn')
      .setLabel('Previous')
      .setStyle(ButtonStyle.Danger);


    const button2 = new ButtonBuilder()
      .setCustomId('nextbtn')
      .setLabel(`Next`)
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
