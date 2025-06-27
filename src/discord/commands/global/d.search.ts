/* eslint-disable sonarjs/no-duplicate-string */
import {
  SlashCommandBuilder,
  MessageFlags,
  ChatInputCommandInteraction,
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
// import commandContext from '../../utils/context';
// import log from '../../../global/utils/log';
const F = f(__filename);

async function normalDefine(term: string): Promise<{ title: string, url: string, description: string }> {
  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(term)}`;
    const response = await fetch(url);
    if (!response.ok) {
      return {
        title: `Dictionary: ${term}`,
        url: `https://www.google.com/search?q=define+${encodeURIComponent(term)}`,
        description: `No dictionary definition found for "${term}".`,
      };
    }
    const data = await response.json();
    if (!Array.isArray(data) || !data[0]?.meanings?.length) {
      return {
        title: `Dictionary: ${term}`,
        url: `https://www.google.com/search?q=define+${encodeURIComponent(term)}`,
        description: `No dictionary definition found for "${term}".`,
      };
    }
    const meaning = data[0].meanings[0];
    const { definition } = meaning.definitions[0];
    const example = meaning.definitions[0].example
      ? `\nExample: ${meaning.definitions[0].example}`
      : '';
    const partOfSpeech = meaning.partOfSpeech
      ? `*(${meaning.partOfSpeech})* `
      : '';
    return {
      title: `Dictionary: ${term}`,
      url: `https://www.google.com/search?q=define+${encodeURIComponent(term)}`,
      description: stripIndents`
        ${partOfSpeech}${definition}${example}
      `,
    };
  } catch (err) {
    return {
      title: `Dictionary: ${term}`,
      url: `https://www.google.com/search?q=define+${encodeURIComponent(term)}`,
      description: 'Dictionary API is currently unavailable. Please try again later.',
    };
  }
}

async function urbanDefine(term: string): Promise<{ title: string, url: string, description: string }> {
  try {
    const url = `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`;
    const response = await fetch(url);
    if (!response.ok) {
      return {
        title: `Urban Dictionary: ${term}`,
        url: `https://www.urbandictionary.com/define.php?term=${encodeURIComponent(term)}`,
        description: 'Urban Dictionary is currently unavailable. Please try again later.',
      };
    }
    const data = await response.json();
    if (!data.list || data.list.length === 0) {
      return {
        title: `Urban Dictionary: ${term}`,
        url: `https://www.urbandictionary.com/define.php?term=${encodeURIComponent(term)}`,
        description: `No results found for **${term}**.`,
      };
    }
    const entry = data.list[0];
    return {
      title: `Urban Dictionary: ${entry.word}`,
      url: entry.permalink,
      description: stripIndents`
        ${entry.definition.replace(/\[([^\]]+)\]/g, '$1')}

        *Example:* ${entry.example.replace(/\[([^\]]+)\]/g, '$1')}
        👍 ${entry.thumbs_up} | 👎 ${entry.thumbs_down}
      `,
    };
  } catch (err) {
    return {
      title: `Urban Dictionary: ${term}`,
      url: `https://www.urbandictionary.com/define.php?term=${encodeURIComponent(term)}`,
      description: 'An error occurred while searching Urban Dictionary.',
    };
  }
}

async function steam(query: string): Promise<{ title: string, url: string, description: string, thumb: string, fields: { name: string, value: string, inline?: boolean }[] }> {
  const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&cc=us`;
  const response = await fetch(url);
  if (!response.ok) {
    return {
      title: `Steam: ${query}`,
      url: `https://store.steampowered.com/search/?term=${encodeURIComponent(query)}`,
      description: `No Steam results found for "${query}".`,
      thumb: '',
      fields: [],
    };
  }
  const data = await response.json();
  if (!data.items || data.items.length === 0) {
    return {
      title: `Steam: ${query}`,
      url: `https://store.steampowered.com/search/?term=${encodeURIComponent(query)}`,
      description: `No Steam results found for "${query}".`,
      thumb: '',
      fields: [],
    };
  }
  const item = data.items[0];

  let details: any = {};
  try {
    const detailsRes = await fetch(`https://store.steampowered.com/api/appdetails?appids=${item.id}&cc=us`);
    const detailsData = await detailsRes.json();
    details = detailsData[item.id]?.data || {};
  } catch {
    details = {};
  }

  const tags = details.genres ? details.genres.map((g: any) => g.description).join(', ') : (item.tags ? item.tags.join(', ') : 'N/A');
  const releaseDate = details.release_date?.date || item.release_date || 'Unknown';
  const price = details.price_overview?.final_formatted || (item.price ? item.price.final : 'Unknown');
  const description = details.short_description || item.name;
  const developer = details.developers ? details.developers.join(', ') : 'Unknown';
  const publisher = details.publishers ? details.publishers.join(', ') : 'Unknown';

  return {
    title: `Steam: ${item.name}`,
    url: `https://store.steampowered.com/app/${item.id}`,
    description,
    thumb: item.tiny_image,
    fields: [
      { name: 'Price', value: price, inline: true },
      { name: 'Release Date', value: releaseDate, inline: true },
      { name: 'Tags', value: tags, inline: false },
      { name: 'Developer', value: developer, inline: true },
      { name: 'Publisher', value: publisher, inline: true },
    ],
  };
}

async function imdb(title: string): Promise<{ title: string, url: string, description: string, thumb: string, fields: { name: string, value: string, inline: boolean }[], ratings: { source: string, value: string }[] }> {
  const url = `https://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&t=${encodeURIComponent(title)}`;
  const response = await fetch(url);
  if (!response.ok) {
    return {
      title: `IMDb: ${title}`,
      url: `https://www.imdb.com/find?q=${encodeURIComponent(title)}`,
      description: 'IMDb is currently unavailable.',
      thumb: '',
      fields: [],
      ratings: [],
    };
  }
  const data = await response.json();
  if (data.Response === 'False') {
    return {
      title: `IMDb: ${title}`,
      url: `https://www.imdb.com/find?q=${encodeURIComponent(title)}`,
      description: `Could not find **${title}**!\nThis API is kind of dumb, you need to be *exact*!`,
      thumb: '',
      fields: [],
      ratings: [],
    };
  }
  return {
    title: `IMDb: ${data.Title} (${data.Year}) [${data.Rated}]`,
    url: `https://www.imdb.com/title/${data.imdbID}`,
    description: `||${data.Plot}||`,
    thumb: data.Poster !== 'N/A' ? data.Poster : '',
    fields: [
      { name: 'Director(s)', value: `${data.Director}`, inline: true },
      { name: 'Actor(s)', value: `${data.Actors}`, inline: true },
      { name: 'Writer(s)', value: `${data.Writer}`, inline: true },
    ],
    ratings: (data.Ratings || []).map((r: any) => ({
      source: r.Source,
      value: r.Value,
    })),
  };
}

async function wikipedia(query: string): Promise<{ title: string, url: string, description: string, thumb: string }> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
  const response = await fetch(url);
  if (!response.ok) {
    return {
      title: `Wikipedia: ${query}`,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
      description: 'Wikipedia is currently unavailable. Please try again later.',
      thumb: '',
    };
  }
  const data = await response.json();
  return {
    title: `Wikipedia: ${data.title || query}`,
    url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
    description: data.extract || '',
    thumb: data.thumbnail?.source || '',
  };
}

export const dSearch: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search various sources')
    .addSubcommand(sub => sub
      .setName('define')
      .setDescription('Define from a dictionary')
      .addStringOption(option => option
        .setName('word')
        .setDescription('Word to define')
        .setRequired(true))
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')))
    .addSubcommand(sub => sub
      .setName('urbandefine')
      .setDescription('Define on Urban Dictionary')
      .addStringOption(option => option
        .setName('define')
        .setDescription('Word to define')
        .setRequired(true))
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')))
    .addSubcommand(sub => sub
      .setName('steam')
      .setDescription('Search a game on Steam')
      .addStringOption(option => option
        .setName('game')
        .setDescription('Game to search for')
        .setRequired(true))
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')))
    .addSubcommand(sub => sub
      .setName('imdb')
      .setDescription('Search IMDb')
      .addStringOption(option => option
        .setName('title')
        .setDescription('Movie / Series to search')
        .setRequired(true))
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')))
    .addSubcommand(sub => sub
      .setName('wikipedia')
      .setDescription('Query Wikipedia')
      .addStringOption(option => option
        .setName('query')
        .setDescription('Word to query')
        .setRequired(true))
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you'))) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'define') {
      const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
      await interaction.deferReply({ flags: ephemeral });
      const word = interaction.options.getString('word', true);
      const result = await normalDefine(word);
      const embed = embedTemplate()
        .setTitle(result.title)
        .setURL(result.url)
        .setDescription(result.description);
      await interaction.editReply({ embeds: [embed] });
      return true;
    }

    if (subcommand === 'urbandefine') {
      const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
      await interaction.deferReply({ flags: ephemeral });
      const term = interaction.options.getString('define');
      if (!term) {
        await interaction.editReply({ content: 'You must enter a search query.' });
        return false;
      }
      const result = await urbanDefine(term);
      const embed = embedTemplate()
        .setTitle(result.title)
        .setURL(result.url)
        .setDescription(result.description);
      await interaction.editReply({ embeds: [embed] });
      return true;
    }

    if (subcommand === 'steam') {
      const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
      await interaction.deferReply({ flags: ephemeral });
      const game = interaction.options.getString('game', true);
      const result = await steam(game);
      const embed = embedTemplate()
        .setTitle(result.title)
        .setURL(result.url)
        .setDescription(result.description);
      if (result.thumb) embed.setThumbnail(result.thumb);
      if (result.fields) result.fields.forEach(field => embed.addFields(field));
      await interaction.editReply({ embeds: [embed] });
      return true;
    }

    if (subcommand === 'imdb') {
      const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
      await interaction.deferReply({ flags: ephemeral });
      const title = interaction.options.getString('title', true);
      const result = await imdb(title);

      const embed = embedTemplate()
        .setTitle(result.title)
        .setURL(result.url)
        .setDescription(result.description);
      if (result.thumb) embed.setThumbnail(result.thumb);
      result.fields.forEach(field => embed.addFields(field));
      result.ratings.forEach((rating: { source: string; value: string }) => {
        embed.addFields({ name: rating.source, value: rating.value, inline: true });
      });

      await interaction.editReply({ embeds: [embed] });
      return true;
    }

    if (subcommand === 'wikipedia') {
      const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
      await interaction.deferReply({ flags: ephemeral });

      const query = interaction.options.getString('query', true);

      const result = await wikipedia(query);
      const embed = embedTemplate()
        .setTitle(result.title)
        .setURL(result.url)
        .setDescription(result.description);
      if (result.thumb) embed.setThumbnail(result.thumb);

      await interaction.editReply({ embeds: [embed] });

      return true;
    }

    await interaction.reply('Unknown subcommand.');
    return false;
  },
};

export default dSearch;
