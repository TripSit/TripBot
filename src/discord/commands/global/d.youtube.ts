import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import {SlashCommand1} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {youtube} from '../../../global/commands/g.youtube';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const dYoutube: SlashCommand1 = {
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

    const result = await youtube(query);

    if (!result) {
      interaction.reply({content: `No results for ${query}, make sure you're exact!`, ephemeral: true});
      return true;
    }

    logger.debug(`[${PREFIX}] - result: ${JSON.stringify(result, null, 2)}`);

    const embed = embedTemplate()
      .setColor(0xFF0000)
      .setTitle(`${result.title}`)
      .setAuthor({
        name: result.channelTitle,
        url: result.link,
      })
      .setThumbnail(result.thumbnails.default?.url)
      .setURL(result.link)
      .setDescription(result.description.substring(0, 200));
    interaction.reply({embeds: [embed], ephemeral: false});
    return true;
  },
};
