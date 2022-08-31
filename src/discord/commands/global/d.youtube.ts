import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import {SlashCommand} from '../../utils/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {youtubeSearch} from '../../../global/commands/g.youtube';
import logger from '../../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

export const discordTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('youtube')
      .setDescription('Search YouTube')
      .addStringOption((option) => option
          .setDescription('What video do you want?')
          .setRequired(true)
          .setName('search')),

  async execute(interaction:ChatInputCommandInteraction) {
    const query = interaction.options.getString('query');

    youtubeSearch(query!)
        .then((result) => {
          const embed = embedTemplate()
              .setTitle(`YouTube: ${result[0].title}`)
              .setURL(result[0].link)
              .setThumbnail(result[0].thumbnails.high.url)
              .setDescription(result[0].description)
              .addFields([
                {name: 'Channel', value: result[0].channelTitle},
              ])
              .setColor(0xFF0000);
          interaction.reply({embeds: [embed], ephemeral: false});
        })

        .catch((err) => {
          interaction.reply(
              `Sorry, there was an ${err}`,
          );
          logger.debug(`[${PREFIX}] failed! ${err} `);
        });
  },
};
