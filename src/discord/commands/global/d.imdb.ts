import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Colors,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { imdb } from '../../../global/commands/g.imdb';
import commandContext from '../../utils/context';

const F = f(__filename);

export const dImdb: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('imdb')
    .setDescription('Search imdb')
    .addStringOption(option => option
      .setName('title')
      .setDescription('Movie / Series title')
      .setRequired(true))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),

  async execute(interaction:ChatInputCommandInteraction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });

    const title = interaction.options.getString('title', true);
    if (!title) {
      await interaction.editReply({
        embeds: [
          embedTemplate()
            .setTitle('Error')
            .setDescription('Please provide a title to search for')
            .setColor(Colors.Red),
        ],
      });
      return false;
    }
    const result = await imdb(title);

    if (!result.title) {
      await interaction.editReply({
        embeds: [
          embedTemplate()
            .setTitle('Error')
            .setDescription(`Could not find **${title}**!
            This API is kind of dumb, you need to be *exact*!`)
            .setColor(Colors.Red),
        ],
      });
      return true;
    }

    const embed = embedTemplate()
      .setTitle(`${result.title} (${result.year}) [${result.rated}]`)
      .setDescription(`||${result.plot}||`)
      .setURL(result.imdburl)
      .addFields(
        { name: 'Director(s)', value: `${result.director}`, inline: true },
        { name: 'Actor(s)', value: `${result.actors}`, inline: true },
        { name: 'Writer(s)', value: `${result.writer}`, inline: true },
      );
    if (result.poster !== 'N/A') {
      embed.setThumbnail(result.poster);
    }

    result.ratings.forEach(rating => {
      embed.addFields({ name: rating.source, value: rating.value, inline: true });
    });

    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dImdb;
