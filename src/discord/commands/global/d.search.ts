/* eslint-disable sonarjs/no-duplicate-string */
import {
  SlashCommandBuilder,
  MessageFlags,
  ChatInputCommandInteraction,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
// import commandContext from '../../utils/context';
// import log from '../../../global/utils/log';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

async function steam(query: string): Promise<{
  title: string,
  url: string,
  description: string,
  thumb: string,
  header?: string,
  fields: { name: string, value: string, inline?: boolean }[]
}> {
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

  // Only fetch USD, EUR, GBP
  const currencies = [
    { cc: 'us', symbol: '$' },
    { cc: 'de', symbol: '€' },
    { cc: 'gb', symbol: '£' },
  ];
  const details: Record<string, any> = {};
  const detailsResults = await Promise.all(
    currencies.map(cur => fetch(`https://store.steampowered.com/api/appdetails?appids=${item.id}&cc=${cur.cc}`)
      .then(res => res.json())
      .then(json => ({ symbol: cur.symbol, data: json[item.id]?.data }))
      .catch(() => ({ symbol: cur.symbol, data: undefined }))),
  );
  detailsResults.forEach(({ symbol, data: currencyData }) => {
    details[symbol] = currencyData;
  });

  // Use USD details for general info
  const usDetails = details.$ || {};
  type Genre = { id: number; description: string };
  let tags: string;
  if (usDetails.genres && Array.isArray(usDetails.genres)) {
    tags = (usDetails.genres as Genre[]).map(g => g.description).join(', ');
  } else if (item.tags && Array.isArray(item.tags)) {
    tags = item.tags.join(', ');
  } else {
    tags = 'N/A';
  }
  const header = usDetails.header_image || item.header_image || null;

  // Use Steam's Unix timestamp for release date if available
  let releaseDate = 'Unknown';
  if (usDetails.release_date?.date) {
    if (usDetails.release_date?.coming_soon === false && usDetails.release_date?.steam_release_date) {
      // Use Discord timestamp formatting for release date
      releaseDate = `<t:${usDetails.release_date.steam_release_date}:D>`;
    } else {
      releaseDate = usDetails.release_date.date;
    }
  } else if (item.release_date) {
    releaseDate = item.release_date;
  }

  const description = usDetails.short_description || item.name;
  const developer = usDetails.developers ? usDetails.developers.join(', ') : 'Unknown';
  const publisher = usDetails.publishers ? usDetails.publishers.join(', ') : 'Unknown';

  // Build a single-line price field and set sale percent in field name if on sale (USD region)
  let priceFieldName = 'Price';
  let salePercent = 0;
  const usdPriceObj = details.$?.price_overview;
  if (usdPriceObj && usdPriceObj.discount_percent && usdPriceObj.discount_percent > 0) {
    salePercent = usdPriceObj.discount_percent;
    priceFieldName = `Price (${salePercent}% off)`;
  }
  const prices = currencies.map(cur => {
    const priceObj = details[cur.symbol]?.price_overview;
    return priceObj ? `${cur.symbol}${priceObj.final_formatted.replace(/[^0-9.,]/g, '')}` : `${cur.symbol}N/A`;
  }).join(', ');

  return {
    title: `Steam: ${item.name}`,
    url: `https://store.steampowered.com/app/${item.id}`,
    description,
    thumb: item.tiny_image,
    header,
    fields: [
      { name: 'Tags', value: tags, inline: true },
      { name: 'Release', value: releaseDate, inline: true },
      { name: '\u200B', value: '\u200B', inline: true },
      { name: 'Developer', value: developer, inline: true },
      { name: 'Publisher', value: publisher, inline: true },
      { name: '\u200B', value: '\u200B', inline: true },
      { name: priceFieldName, value: prices, inline: false },
    ],
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

async function weather(city: string): Promise<{
  title: string,
  url: string,
  description: string,
  fields: { name: string, value: string, inline?: boolean }[]
}> {
  try {
    // 1. Get coordinates from Nominatim
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`);
    const geoData = await geoRes.json();
    if (!geoData[0]) {
      return {
        title: `Weather: ${city}`,
        url: `https://wttr.in/${encodeURIComponent(city)}`,
        description: 'Could not find this location.',
        fields: [],
      };
    }
    const { lat, lon, display_name } = geoData[0];

    // 2. Get local time from worldtimeapi.org (optional)
    let localTime = '';
    try {
      const tzRes = await fetch(`https://api.timezonedb.com/v2.1/get-time-zone?key=YOUR_FREE_KEY&format=json&by=position&lat=${lat}&lng=${lon}`);
      const tzData = await tzRes.json();
      if (tzData.formatted) localTime = tzData.formatted;
    } catch {
      // fallback: skip local time
    }

    // 3. Get weather JSON from wttr.in
    const wttrUrl = `https://wttr.in/${lat},${lon}?format=j1`;
    const weatherRes = await fetch(wttrUrl);
    const weatherData = await weatherRes.json();

    // 4. Extract current conditions
    const current = weatherData.current_condition?.[0];
    const weatherDesc = current?.weatherDesc?.[0]?.value || 'N/A';
    const tempC = current?.temp_C ?? 'N/A';
    const tempF = current?.temp_F ?? 'N/A';
    const feelsLikeC = current?.FeelsLikeC ?? 'N/A';
    const feelsLikeF = current?.FeelsLikeF ?? 'N/A';
    const windKph = current?.windspeedKmph ?? 'N/A';
    const windDir = current?.winddir16Point ?? '';
    const humidity = current?.humidity ?? 'N/A';
    const precipMM = current?.precipMM ?? 'N/A';

    // 5. Google Maps link
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

    // 6. Build description and fields
    let description = `[View on Google Maps](${mapsUrl})`;
    if (localTime) description = `Local time: ${localTime}\n${description}`;

    const fields = [
      { name: 'Condition', value: weatherDesc, inline: true },
      { name: 'Temperature', value: `${tempC}°C / ${tempF}°F`, inline: true },
      { name: 'Feels Like', value: `${feelsLikeC}°C / ${feelsLikeF}°F`, inline: true },
      { name: 'Wind', value: `${windKph} km/h ${windDir}`, inline: true },
      { name: 'Humidity', value: `${humidity}%`, inline: true },
      { name: 'Precipitation', value: `${precipMM} mm`, inline: true },
    ];

    return {
      title: `Weather: ${display_name}`,
      url: wttrUrl,
      description,
      fields,
    };
  } catch (err) {
    return {
      title: `Weather: ${city}`,
      url: `https://wttr.in/${encodeURIComponent(city)}`,
      description: 'Weather service is currently unavailable. Please try again later.',
      fields: [],
    };
  }
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
      .setName('wikipedia')
      .setDescription('Query Wikipedia')
      .addStringOption(option => option
        .setName('query')
        .setDescription('Word to query')
        .setRequired(true))
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')))
    .addSubcommand(sub => sub
      .setName('weather')
      .setDescription('Get weather for a city')
      .addStringOption(option => option
        .setName('city')
        .setDescription('City and region to get weather for (eg. Sydney, NSW)')
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
      let result = await normalDefine(word);

      // If no dictionary definition, fallback to Urban Dictionary
      if (result.description.startsWith('No dictionary definition found')) {
        const urbanResult = await urbanDefine(word);
        result = {
          ...urbanResult,
          description: `No standard dictionary definition found for "${word}".\n Showing Urban Dictionary result instead:\n\n${urbanResult.description}`,
        };
      }

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
      const word = interaction.options.getString('define');
      if (!word) {
        await interaction.editReply({ content: 'You must enter a search query.' });
        return false;
      }
      let result = await urbanDefine(word);

      // If no Urban Dictionary result, fallback to normal dictionary
      if (result.description.startsWith('No results found')) {
        const dictResult = await normalDefine(word);
        result = {
          ...dictResult,
          description: `No Urban Dictionary result found for "${word}".\n Showing standard dictionary result instead:\n\n${dictResult.description}`,
        };
      }

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
      if (result.header) embed.setImage(result.header);
      if (result.fields) result.fields.forEach(field => embed.addFields(field));
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

    // In your weather subcommand handler, update to use fields:
    if (subcommand === 'weather') {
      const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
      await interaction.deferReply({ flags: ephemeral });
      const city = interaction.options.getString('city', true);
      const result = await weather(city);
      const embed = embedTemplate()
        .setTitle(result.title)
        .setURL(result.url)
        .setDescription(result.description);
      if (result.fields) result.fields.forEach(field => embed.addFields(field));
      await interaction.editReply({ embeds: [embed] });
      return true;
    }

    await interaction.reply('Unknown subcommand.');
    return false;
  },
};

export default dSearch;
