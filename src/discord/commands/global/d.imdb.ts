import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import { parse } from 'path';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { imdb } from '../../../global/commands/g.imdb';
import { startLog } from '../../utils/startLog';

const PREFIX = parse(__filename).name;

export default dImdb;

export const dImdb: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('imdb')
    .setDescription('Search imdb')
    .addStringOption(option => option
      .setName('title')
      .setDescription('Movie / Series title')
      .setRequired(true)),

  async execute(interaction:ChatInputCommandInteraction) {
    startLog(PREFIX, interaction);

    const title = interaction.options.getString('title', true);
    if (!title) {
      interaction.reply({ content: 'You must enter a title.', ephemeral: true });
      return false;
    }

    await interaction.deferReply({ ephemeral: false });

    const result = await imdb(title);

    if (!result.title) {
      interaction.reply({ content: `Could not find ${title}, make sure you're exact!`, ephemeral: true });
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

    // interaction.followUp({embeds: [embed]});
    await interaction.editReply({ embeds: [embed] });
    // interaction.reply({embeds: [embed]});
    return true;
  },
};
