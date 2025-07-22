import type { ChatInputCommandInteraction } from 'discord.js';

import { Colors, MessageFlags, SlashCommandBuilder } from 'discord.js';

import type { SlashCommand } from '../../@types/commandDef';

import { imdb } from '../../../global/commands/g.imdb';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

export const dImdb: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('imdb')
    .setDescription('Search imdb')
    .setIntegrationTypes([0])
    .addStringOption((option) =>
      option.setName('title').setDescription('Movie / Series title').setRequired(true),
    )
    .addBooleanOption((option) =>
      option.setName('ephemeral').setDescription('Set to "True" to show the response only to you'),
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral')
      ? MessageFlags.Ephemeral
      : undefined;
    await interaction.deferReply({ flags: ephemeral });

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
            .setDescription(
              `Could not find **${title}**!
            This API is kind of dumb, you need to be *exact*!`,
            )
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
        { inline: true, name: 'Director(s)', value: result.director },
        { inline: true, name: 'Actor(s)', value: result.actors },
        { inline: true, name: 'Writer(s)', value: result.writer },
      );
    if (result.poster !== 'N/A') {
      embed.setThumbnail(result.poster);
    }

    for (const rating of result.ratings) {
      embed.addFields({ inline: true, name: rating.source, value: rating.value });
    }

    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dImdb;
