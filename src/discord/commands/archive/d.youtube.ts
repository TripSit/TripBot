import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { youtube } from '../../../global/commands/g.youtube';
import { commandContext } from '../../utils/context';
// import log from '../../../global/utils/log';
const F = f(__filename);

export const dYoutube: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('youtube')
    .setDescription('Search YouTube')
    .addStringOption(option => option
      .setDescription('What video do you want?')
      .setRequired(true)
      .setName('search')),

  async execute(interaction:ChatInputCommandInteraction) {
    log.info(F, await commandContext(interaction));
    const query = interaction.options.getString('search');
    // log.debug(F, `- query: ${query}`);
    if (!query) {
      await interaction.reply({ content: 'You must enter a search query.', ephemeral: true });
      return false;
    }

    const result = await youtube(query);

    if (!result) {
      await interaction.reply({ content: `No results for ${query}, make sure you're exact!`, ephemeral: true });
      return true;
    }

    // log.debug(F, `- result: ${JSON.stringify(result, null, 2)}`);
    // log.debug(F, `- result: ${result.title} (${result.channelTitle}) (${result.link})`);

    const embed = embedTemplate()
      .setColor(0xFF0000)
      .setTitle(`${result.title}`)

      .setURL(result.link);
      // .setDescription(result.description);

    if (result.channelTitle) {
      if (result.link) {
        embed.setAuthor({
          name: result.channelTitle,
          url: result.link,
        });
      } else {
        embed.setAuthor({
          name: result.channelTitle,
        });
      }
    }

    if (result.thumbnails) {
      if (result.thumbnails.high) embed.setThumbnail(result.thumbnails.high.url);
      else if (result.thumbnails.medium) embed.setThumbnail(result.thumbnails.medium.url);
      else if (result.thumbnails.default) embed.setThumbnail(result.thumbnails.default.url);
    }

    await interaction.reply({ embeds: [embed] });
    return true;
  },
};
