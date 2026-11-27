/* eslint-disable sonarjs/no-duplicate-string */
import {
  SlashCommandBuilder,
  MessageFlags,
  ChatInputCommandInteraction,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';

type DefineResult = { title: string; url: string; description: string };

const encodedWord = (word: string | null): string => encodeURIComponent(word ?? '');

const stripBrackets = (text: string): string => text.replace(/\[([^\]]+)\]/g, '$1');

/** Looks a word up in the standard dictionary. `intro` is a line shown above a definition that was found. */
async function lookupDictionary(word: string | null, intro = ''): Promise<DefineResult> {
  const base = {
    title: `Dictionary: ${word}`,
    url: `https://www.google.com/search?q=define+${encodedWord(word)}`,
  };
  const notFound = { ...base, description: `No dictionary definition found for "${word}".` };
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodedWord(word)}`);
    if (!response.ok) return notFound;
    const data = await response.json();
    if (!Array.isArray(data) || !data[0]?.meanings?.length) return notFound;

    const meaning = data[0].meanings[0];
    const { definition } = meaning.definitions[0];
    const example = meaning.definitions[0].example
      ? `\nExample: ${meaning.definitions[0].example}`
      : '';
    const partOfSpeech = meaning.partOfSpeech
      ? `*(${meaning.partOfSpeech})* `
      : '';
    const introBlock = intro ? `${intro}\n\n` : '';
    return {
      ...base,
      description: stripIndents`
        ${introBlock}${partOfSpeech}${definition}${example}
      `,
    };
  } catch {
    return { ...base, description: 'Dictionary API is currently unavailable. Please try again later.' };
  }
}

/** Looks a word up on Urban Dictionary. `intro` is a line shown above a definition that was found. */
async function lookupUrbanDictionary(word: string | null, intro = ''): Promise<DefineResult> {
  const base = {
    title: `Urban Dictionary: ${word}`,
    url: `https://www.urbandictionary.com/define.php?term=${encodedWord(word)}`,
  };
  try {
    const response = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodedWord(word)}`);
    if (!response.ok) {
      return { ...base, description: 'Urban Dictionary is currently unavailable. Please try again later.' };
    }
    const data = await response.json();
    if (!data.list || data.list.length === 0) {
      return { ...base, description: `No results found for **${word}**.` };
    }
    const entry = data.list[0];
    const introBlock = intro ? `${intro}\n\n` : '';
    return {
      title: `Urban Dictionary: ${entry.word}`,
      url: entry.permalink,
      description: stripIndents`
        ${introBlock}${stripBrackets(entry.definition)}

        *Example:* ${stripBrackets(entry.example)}
        👍 ${entry.thumbs_up} | 👎 ${entry.thumbs_down}
      `,
    };
  } catch {
    return { ...base, description: 'An error occurred while searching Urban Dictionary.' };
  }
}

async function replyWithDefinition(interaction: ChatInputCommandInteraction, result: DefineResult): Promise<boolean> {
  const embed = embedTemplate()
    .setTitle(result.title)
    .setURL(result.url)
    .setDescription(result.description);
  await interaction.editReply({ embeds: [embed] });
  return true;
}

async function dDefine(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const word = interaction.options.getString('word', true);
  let result = await lookupDictionary(word);

  if (result.description.startsWith('No dictionary definition found')) {
    result = await lookupUrbanDictionary(
      word,
      `No standard dictionary definition found for "${word}". Showing Urban Dictionary result instead:`,
    );
  }

  return replyWithDefinition(interaction, result);
}

async function dUrbanDefine(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const word = interaction.options.getString('define');
  let result = await lookupUrbanDictionary(word);

  if (result.description.startsWith('No results found')) {
    result = await lookupDictionary(
      word,
      `No Urban Dictionary result found for "${word}". Showing standard dictionary result instead:`,
    );
  }

  return replyWithDefinition(interaction, result);
}

const STEAM_CURRENCIES = [
  { cc: 'us', symbol: '$' },
  { cc: 'de', symbol: '€' },
  { cc: 'gb', symbol: '£' },
];

type SteamField = { name: string; value: string; inline?: boolean };
type SteamResult = {
  title: string;
  url: string;
  description: string;
  thumb: string;
  header?: string | null;
  fields: SteamField[];
};

const steamNotFound = (query: string): SteamResult => ({
  title: `Steam: ${query}`,
  url: `https://store.steampowered.com/search/?term=${encodeURIComponent(query)}`,
  description: `No Steam results found for "${query}".`,
  thumb: '',
  fields: [],
});

// The store details of a game, keyed by the currency symbol
async function fetchSteamDetails(itemId: string): Promise<Record<string, any>> {
  const details: Record<string, any> = {};
  const detailsResults = await Promise.all(
    STEAM_CURRENCIES.map(cur => fetch(`https://store.steampowered.com/api/appdetails?appids=${itemId}&cc=${cur.cc}`)
      .then(res => res.json())
      .then(json => ({ symbol: cur.symbol, data: json[itemId]?.data }))
      .catch(() => ({ symbol: cur.symbol, data: undefined }))),
  );
  detailsResults.forEach(({ symbol, data: currencyData }) => {
    details[symbol] = currencyData;
  });
  return details;
}

function steamTags(usDetails: any, item: any): string {
  type Genre = { id: number; description: string };
  if (usDetails.genres && Array.isArray(usDetails.genres)) {
    return (usDetails.genres as Genre[]).map(g => g.description).join(', ');
  }
  if (item.tags && Array.isArray(item.tags)) {
    return item.tags.join(', ');
  }
  return 'N/A';
}

function steamReleaseDate(usDetails: any, item: any): string {
  if (usDetails.release_date?.date) {
    if (usDetails.release_date?.coming_soon === false && usDetails.release_date?.steam_release_date) {
      return `<t:${usDetails.release_date.steam_release_date}:D>`;
    }
    return usDetails.release_date.date;
  }
  return item.release_date ?? 'Unknown';
}

function steamPrices(details: Record<string, any>): string {
  return STEAM_CURRENCIES.map(cur => {
    const priceObj = details[cur.symbol]?.price_overview;
    return priceObj ? `${cur.symbol}${priceObj.final_formatted.replace(/[^0-9.,]/g, '')}` : `${cur.symbol}N/A`;
  }).join(', ');
}

function steamPlatforms(usDetails: any): string {
  if (!usDetails.platforms || typeof usDetails.platforms !== 'object') return 'Unknown';
  return Object.entries(usDetails.platforms)
    .filter(([supported]) => supported)
    .map(([platform]) => platform.charAt(0).toUpperCase() + platform.slice(1))
    .join(', ');
}

async function lookupSteamGame(query: string): Promise<SteamResult> {
  const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&cc=us`;
  const response = await fetch(url);
  if (!response.ok) return steamNotFound(query);

  const data = await response.json();
  if (!data.items || data.items.length === 0) return steamNotFound(query);

  const item = data.items[0];
  const details = await fetchSteamDetails(item.id);
  const usDetails = details.$ ?? {};

  let priceFieldName = 'Price';
  const usdPriceObj = details.$?.price_overview;
  if (usdPriceObj?.discount_percent && usdPriceObj.discount_percent > 0) {
    priceFieldName = `Price (${usdPriceObj.discount_percent}% off)`;
  }

  return {
    title: `Steam: ${item.name}`,
    url: `https://store.steampowered.com/app/${item.id}`,
    description: usDetails.short_description ?? item.name,
    thumb: item.tiny_image,
    header: usDetails.header_image ?? item.header_image ?? null,
    fields: [
      { name: priceFieldName, value: steamPrices(details), inline: true },
      { name: 'Tags', value: steamTags(usDetails, item), inline: true },
      { name: 'Release', value: steamReleaseDate(usDetails, item), inline: true },
      { name: 'Platforms', value: steamPlatforms(usDetails), inline: true },
      { name: 'Developer', value: usDetails.developers ? usDetails.developers.join(', ') : 'Unknown', inline: true },
      { name: 'Publisher', value: usDetails.publishers ? usDetails.publishers.join(', ') : 'Unknown', inline: true },
    ],
  };
}

async function dGame(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const query = interaction.options.getString('game', true);
  const result = await lookupSteamGame(query);

  const embed = embedTemplate()
    .setTitle(result.title)
    .setURL(result.url)
    .setDescription(result.description);

  if (result.thumb) embed.setThumbnail(result.thumb);
  if (result.fields) {
    result.fields.forEach(field => {
      embed.addFields({
        name: field.name,
        value: field.value,
        inline: field.inline ?? false,
      });
    });
  }

  await interaction.editReply({ embeds: [embed] });
  return true;
}

async function dBook(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const query = interaction.options.getString('book', true);
  let result;
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`;
    const response = await fetch(url);
    if (!response.ok) {
      result = {
        title: `Book: ${query}`,
        url: `https://books.google.com/books?vid=ISBN${encodeURIComponent(query)}`,
        description: 'Google Books API is currently unavailable. Please try again later.',
        fields: [],
      };
    } else {
      const data = await response.json();
      if (!data.items || data.items.length === 0) {
        result = {
          title: `Book: ${query}`,
          url: `https://books.google.com/books?vid=ISBN${encodeURIComponent(query)}`,
          description: `No results found for "${query}".`,
          fields: [],
        };
      } else {
        const book = data.items[0].volumeInfo;
        const infoLink = book.infoLink ?? `https://books.google.com/books?vid=ISBN${encodeURIComponent(query)}`;
        const thumbnail = book.imageLinks?.thumbnail ?? '';
        const authors = book.authors ? book.authors.join(', ') : 'Unknown';
        const description = book.description ?? 'No description available.';
        const publisher = book.publisher ?? 'Unknown';
        const publishedDate = book.publishedDate ?? 'Unknown';

        // Use title and author for platform search URLs
        const searchTerm = encodeURIComponent(`${book.title} ${authors !== 'Unknown' ? authors : ''}`.trim());
        const platforms = [
          { name: 'Kobo', url: `https://www.kobo.com/search?query=${searchTerm}` },
          { name: 'Amazon', url: `https://www.amazon.com/s?k=${searchTerm}` },
          { name: 'Google Books', url: infoLink },
          { name: 'Apple Books', url: `https://books.apple.com/us/search?term=${searchTerm}` },
        ];

        result = {
          title: `Book: ${book.title ?? query}`,
          url: infoLink,
          description,
          thumb: thumbnail,
          fields: [
            { name: 'Author', value: authors, inline: true },
            { name: 'Publisher', value: publisher, inline: true },
            { name: 'Published Date', value: publishedDate, inline: true },
            {
              name: 'Platforms',
              value: platforms.map(p => `[${p.name}](${p.url})`).join(' | '),
              inline: false,
            },
          ],
        };
      }
    }
  } catch {
    result = {
      title: `Book: ${query}`,
      url: `https://books.google.com/books?vid=ISBN${encodeURIComponent(query)}`,
      description: 'Book search is currently unavailable. Please try again later.',
      fields: [],
    };
  }

  const embed = embedTemplate()
    .setTitle(result.title)
    .setURL(result.url)
    .setDescription(result.description);

  if (result.thumb) embed.setThumbnail(result.thumb);
  if (result.fields) {
    result.fields.forEach(field => {
      embed.addFields({
        name: field.name,
        value: field.value,
        inline: field.inline ?? false,
      });
    });
  }

  await interaction.editReply({ embeds: [embed] });
  return true;
}

async function dWikipedia(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const query = interaction.options.getString('query', true);
  let result;
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
  const response = await fetch(url);
  if (!response.ok) {
    result = {
      title: `Wikipedia: ${query}`,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
      description: 'No wikipedia results found or your query was too vague, try being more specific.',
      thumb: '',
    };
  } else {
    const data = await response.json();
    result = {
      title: `Wikipedia: ${data.title ?? query}`,
      url: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
      description: data.extract ?? '',
      thumb: data.thumbnail?.source ?? '',
    };
  }

  const embed = embedTemplate()
    .setTitle(result.title)
    .setURL(result.url)
    .setDescription(result.description);

  if (result.thumb) embed.setThumbnail(result.thumb);

  await interaction.editReply({ embeds: [embed] });
  return true;
}

async function dWeather(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const city = interaction.options.getString('city', true);
  let result;
  try {
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`);
    const geoData = await geoRes.json();
    if (!geoData[0]) {
      result = {
        title: `Weather: ${city}`,
        url: `https://wttr.in/${encodeURIComponent(city)}`,
        description: 'Could not find this location. Try being more specific or try a close major city.',
        fields: [],
      };
    } else {
      const { lat, lon, display_name: displayName } = geoData[0];

      const wttrUrl = `https://wttr.in/${lat},${lon}?format=j1`;
      const weatherRes = await fetch(wttrUrl);
      const weatherData = await weatherRes.json();

      const current = weatherData.current_condition?.[0];
      const weatherDesc = current?.weatherDesc?.[0]?.value ?? 'N/A';
      const tempC = current?.temp_C ?? 'N/A';
      const tempF = current?.temp_F ?? 'N/A';
      const feelsLikeC = current?.FeelsLikeC ?? 'N/A';
      const feelsLikeF = current?.FeelsLikeF ?? 'N/A';
      const windKph = current?.windspeedKmph ?? 'N/A';
      const windDir = current?.winddir16Point ?? '';
      const humidity = current?.humidity ?? 'N/A';
      const precipMM = current?.precipMM ?? 'N/A';

      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
      const description = `[View on Google Maps](${mapsUrl})`;

      const fields = [
        { name: 'Condition', value: weatherDesc, inline: true },
        { name: 'Temperature', value: `${tempC}°C / ${tempF}°F`, inline: true },
        { name: 'Feels Like', value: `${feelsLikeC}°C / ${feelsLikeF}°F`, inline: true },
        { name: 'Wind', value: `${windKph} km/h ${windDir}`, inline: true },
        { name: 'Humidity', value: `${humidity}%`, inline: true },
        { name: 'Precipitation', value: `${precipMM} mm`, inline: true },
      ];

      result = {
        title: `Weather: ${displayName}`,
        url: wttrUrl,
        description,
        fields,
      };
    }
  } catch {
    result = {
      title: `Weather: ${city}`,
      url: `https://wttr.in/${encodeURIComponent(city)}`,
      description: 'Weather is currently unavailable. Please try again later.',
      fields: [],
    };
  }

  const embed = embedTemplate()
    .setTitle(result.title)
    .setURL(result.url)
    .setDescription(result.description);

  if (result.fields) {
    result.fields.forEach(field => {
      embed.addFields({
        name: field.name,
        value: field.value,
        inline: field.inline ?? false,
      });
    });
  }

  await interaction.editReply({ embeds: [embed] });
  return true;
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
      .setName('game')
      .setDescription('Find a game on Steam')
      .addStringOption(option => option
        .setName('game')
        .setDescription('Game to search for')
        .setRequired(true))
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')))
    .addSubcommand(sub => sub
      .setName('book')
      .setDescription('Search for a book and where to buy it')
      .addStringOption(option => option
        .setName('book')
        .setDescription('Book title or author')
        .setRequired(true))
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')))
    .addSubcommand(sub => sub
      .setName('wikipedia')
      .setDescription('Query a topic on Wikipedia')
      .addStringOption(option => option
        .setName('query')
        .setDescription('Word to query')
        .setRequired(true))
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you'))) as SlashCommandBuilder,
  /* .addSubcommand(sub => sub
      .setName('weather')
      .setDescription('Get weather for a city')
      .addStringOption(option => option
        .setName('city')
        .setDescription('City and region to get weather for (eg. Sydney, NSW)')
        .setRequired(true))
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you'))) as SlashCommandBuilder, */

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });

    switch (subcommand) {
      case 'define':
        return dDefine(interaction);
      case 'urbandefine':
        return dUrbanDefine(interaction);
      case 'game':
        return dGame(interaction);
      case 'book':
        return dBook(interaction);
      case 'wikipedia':
        return dWikipedia(interaction);
      case 'weather':
        return dWeather(interaction);
      default:
        await interaction.reply('Unknown subcommand.');
        return false;
    }
  },
};

export default dSearch;
