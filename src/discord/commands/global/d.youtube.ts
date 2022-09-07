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
    const query = interaction.options.getString('search')!;
    logger.debug(`[${PREFIX}] - query: ${query}`);

    youtubeSearch(query)
        .then((result) => {
          logger.debug(`${PREFIX} result: ${JSON.stringify(result.length, null, 2)}`);
          let topIndex = 0;
          let topViews = 0;
          result.forEach((item, index) => {
            // logger.debug(`${PREFIX} item: ${JSON.stringify(item, null, 2)}`);
            logger.debug(`${PREFIX} index: ${index}`);
            logger.debug(`${PREFIX} item.title: ${item.title}`);
            logger.debug(`${PREFIX} item.views: ${item.views}`);
            if (item.views > topViews) {
              topViews = item.views;
              topIndex = index;
            }
          });

          logger.debug(`${PREFIX} ${result[topIndex].title} has the most views (${result[topIndex].views})`);

          const embed = embedTemplate()
              .setTitle(`${result[topIndex].title}`)
              .setURL(result[topIndex].url)
              .setThumbnail(result[topIndex].snippet.thumbnails.high.url)
              // .setDescription(result[topIndex].description)
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
