import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {youtube} from '../../../global/commands/g.youtube';
import {startLog} from '../../utils/startLog';
import log from '../../../global/utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

export const dYoutube: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('youtube')
    .setDescription('Search YouTube')
    .addStringOption((option) => option
      .setDescription('What video do you want?')
      .setRequired(true)
      .setName('search')),

  async execute(interaction:ChatInputCommandInteraction) {
    startLog(PREFIX, interaction);
    const query = interaction.options.getString('search');
    log.debug(`[${PREFIX}] - query: ${query}`);
    if (!query) {
      interaction.reply({content: 'You must enter a search query.', ephemeral: true});
      return false;
    }

    const result = await youtube(query);

    if (!result) {
      interaction.reply({content: `No results for ${query}, make sure you're exact!`, ephemeral: true});
      return true;
    }

    log.debug(`[${PREFIX}] - result: ${JSON.stringify(result, null, 2)}`);

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
