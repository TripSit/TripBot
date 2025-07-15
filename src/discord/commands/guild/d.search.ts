/* eslint-disable sonarjs/no-duplicate-string */
import {
  SlashCommandBuilder,
  MessageFlags,
  ChatInputCommandInteraction,
  EmbedField,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';

async function dDefine(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const word = interaction.options.getString('word', true);
  let result;
  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    const response = await fetch(url);
    if (!response.ok) {
      result = {
        title: `Dictionary: ${word}`,
        url: `https://www.google.com/search?q=define+${encodeURIComponent(word)}`,
        description: `No dictionary definition found for "${word}".`,
      };
    } else {
      const data = await response.json();
      if (!Array.isArray(data) || !data[0]?.meanings?.length) {
        result = {
          title: `Dictionary: ${word}`,
          url: `https://www.google.com/search?q=define+${encodeURIComponent(word)}`,
          description: `No dictionary definition found for "${word}".`,
        };
      } else {
        const meaning = data[0].meanings[0];
        const { definition } = meaning.definitions[0];
        const example = meaning.definitions[0].example
          ? `\nExample: ${meaning.definitions[0].example}`
          : '';
        const partOfSpeech = meaning.partOfSpeech
          ? `*(${meaning.partOfSpeech})* `
          : '';
        result = {
          title: `Dictionary: ${word}`,
          url: `https://www.google.com/search?q=define+${encodeURIComponent(word)}`,
          description: stripIndents`
            ${partOfSpeech}${definition}${example}
          `,
        };
      }
    }
  } catch (err) {
    result = {
      title: `Dictionary: ${word}`,
      url: `https://www.google.com/search?q=define+${encodeURIComponent(word)}`,
      description: 'Dictionary API is currently unavailable. Please try again later.',
    };
  }

  if (result.description.startsWith('No dictionary definition found')) {
    try {
      const url = `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(word)}`;
      const response = await fetch(url);
      if (!response.ok) {
        result = {
          title: `Urban Dictionary: ${word}`,
          url: `https://www.urbandictionary.com/define.php?term=${encodeURIComponent(word)}`,
          description: 'Urban Dictionary is currently unavailable. Please try again later.',
        };
      } else {
        const data = await response.json();
        if (!data.list || data.list.length === 0) {
          result = {
            title: `Urban Dictionary: ${word}`,
            url: `https://www.urbandictionary.com/define.php?term=${encodeURIComponent(word)}`,
            description: `No results found for **${word}**.`,
          };
        } else {
          const entry = data.list[0];
          result = {
            title: `Urban Dictionary: ${entry.word}`,
            url: entry.permalink,
            description: stripIndents`
              No standard dictionary definition found for "${word}". Showing Urban Dictionary result instead:

              ${entry.definition.replace(/\[([^\]]+)\]/g, '$1')}

              *Example:* ${entry.example.replace(/\[([^\]]+)\]/g, '$1')}
              👍 ${entry.thumbs_up} | 👎 ${entry.thumbs_down}
            `,
          };
        }
      }
    } catch (err) {
      result = {
        title: `Urban Dictionary: ${word}`,
        url: `https://www.urbandictionary.com/define.php?term=${encodeURIComponent(word)}`,
        description: 'An error occurred while searching Urban Dictionary.',
      };
    }
  }

  const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
  await interaction.deferReply({ flags: ephemeral });
  const embed = embedTemplate()
    .setTitle(result.title)
    .setURL(result.url)
    .setDescription(result.description);
  await interaction.editReply({ embeds: [embed] });
  return true;
}

async function dUrbanDefine(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const word = interaction.options.getString('define');
  let result;
  try {
    const url = `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(word ?? '')}`;
    const response = await fetch(url);
    if (!response.ok) {
      result = {
        title: `Urban Dictionary: ${word}`,
        url: `https://www.urbandictionary.com/define.php?term=${encodeURIComponent(word ?? '')}`,
        description: 'Urban Dictionary is currently unavailable. Please try again later.',
      };
    } else {
      const data = await response.json();
      if (!data.list || data.list.length === 0) {
        result = {
          title: `Urban Dictionary: ${word}`,
          url: `https://www.urbandictionary.com/define.php?term=${encodeURIComponent(word ?? '')}`,
          description: `No results found for **${word}**.`,
        };
      } else {
        const entry = data.list[0];
        result = {
          title: `Urban Dictionary: ${entry.word}`,
          url: entry.permalink,
          description: stripIndents`
            ${entry.definition.replace(/\[([^\]]+)\]/g, '$1')}

            *Example:* ${entry.example.replace(/\[([^\]]+)\]/g, '$1')}
            👍 ${entry.thumbs_up} | 👎 ${entry.thumbs_down}
          `,
        };
      }
    }
  } catch (err) {
    result = {
      title: `Urban Dictionary: ${word}`,
      url: `https://www.urbandictionary.com/define.php?term=${encodeURIComponent(word ?? '')}`,
      description: 'An error occurred while searching Urban Dictionary.',
    };
  }

  if (result.description.startsWith('No results found')) {
    try {
      const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word ?? '')}`;
      const response = await fetch(url);
      if (!response.ok) {
        result = {
          title: `Dictionary: ${word}`,
          url: `https://www.google.com/search?q=define+${encodeURIComponent(word ?? '')}`,
          description: `No dictionary definition found for "${word}".`,
        };
      } else {
        const data = await response.json();
        if (!Array.isArray(data) || !data[0]?.meanings?.length) {
          result = {
            title: `Dictionary: ${word}`,
            url: `https://www.google.com/search?q=define+${encodeURIComponent(word ?? '')}`,
            description: `No dictionary definition found for "${word}".`,
          };
        } else {
          const meaning = data[0].meanings[0];
          const { definition } = meaning.definitions[0];
          const example = meaning.definitions[0].example
            ? `\nExample: ${meaning.definitions[0].example}`
            : '';
          const partOfSpeech = meaning.partOfSpeech
            ? `*(${meaning.partOfSpeech})* `
            : '';
          result = {
            title: `Dictionary: ${word}`,
            url: `https://www.google.com/search?q=define+${encodeURIComponent(word ?? '')}`,
            description: stripIndents`
              No Urban Dictionary result found for "${word}". Showing standard dictionary result instead:

              ${partOfSpeech}${definition}${example}
            `,
          };
        }
      }
    } catch (err) {
      result = {
        title: `Dictionary: ${word}`,
        url: `https://www.google.com/search?q=define+${encodeURIComponent(word ?? '')}`,
        description: 'Dictionary API is currently unavailable. Please try again later.',
      };
    }
  }

  const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
  await interaction.deferReply({ flags: ephemeral });
  const embed = embedTemplate()
    .setTitle(result.title)
    .setURL(result.url)
    .setDescription(result.description);
  await interaction.editReply({ embeds: [embed] });
  return true;
}

async function dGame(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const query = interaction.options.getString('game', true);
  let result;
  const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&cc=us`;
  const response = await fetch(url);
  if (!response.ok) {
    result = {
      title: `Steam: ${query}`,
      url: `https://store.steampowered.com/search/?term=${encodeURIComponent(query)}`,
      description: `No Steam results found for "${query}".`,
      thumb: '',
      fields: [],
    };
  } else {
    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      result = {
        title: `Steam: ${query}`,
        url: `https://store.steampowered.com/search/?term=${encodeURIComponent(query)}`,
        description: `No Steam results found for "${query}".`,
        thumb: '',
        fields: [],
      };
    } else {
      const item = data.items[0];
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

      let releaseDate = 'Unknown';
      if (usDetails.release_date?.date) {
        if (usDetails.release_date?.coming_soon === false && usDetails.release_date?.steam_release_date) {
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

      const platforms = (usDetails.platforms && typeof usDetails.platforms === 'object')
        ? Object.entries(usDetails.platforms)
          .filter(([_, supported]) => supported)
          .map(([platform]) => platform.charAt(0).toUpperCase() + platform.slice(1))
          .join(', ')
        : 'Unknown';

      result = {
        title: `Steam: ${item.name}`,
        url: `https://store.steampowered.com/app/${item.id}`,
        description,
        thumb: item.tiny_image,
        header,
        fields: [
          { name: priceFieldName, value: prices, inline: true },
          { name: 'Tags', value: tags, inline: true },
          { name: 'Release', value: releaseDate, inline: true },
          { name: 'Platforms', value: platforms, inline: true },
          { name: 'Developer', value: developer, inline: true },
          { name: 'Publisher', value: publisher, inline: true },
        ],
      };
    }
  }

  const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
  await interaction.deferReply({ flags: ephemeral });

  const embed = embedTemplate()
    .setTitle(result.title)
    .setURL(result.url)
    .setDescription(result.description);

  // if (result.header) embed.setImage(result.header);
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
        const infoLink = book.infoLink || `https://books.google.com/books?vid=ISBN${encodeURIComponent(query)}`;
        const thumbnail = book.imageLinks?.thumbnail || '';
        const authors = book.authors ? book.authors.join(', ') : 'Unknown';
        const description = book.description ? book.description : 'No description available.';
        const publisher = book.publisher || 'Unknown';
        const publishedDate = book.publishedDate || 'Unknown';

        // Use title and author for platform search URLs
        const searchTerm = encodeURIComponent(`${book.title} ${authors !== 'Unknown' ? authors : ''}`.trim());
        const platforms = [
          { name: 'Kobo', url: `https://www.kobo.com/search?query=${searchTerm}` },
          { name: 'Amazon', url: `https://www.amazon.com/s?k=${searchTerm}` },
          { name: 'Google Books', url: infoLink },
          { name: 'Apple Books', url: `https://books.apple.com/us/search?term=${searchTerm}` },
        ];

        result = {
          title: `Book: ${book.title || query}`,
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
  } catch (err) {
    result = {
      title: `Book: ${query}`,
      url: `https://books.google.com/books?vid=ISBN${encodeURIComponent(query)}`,
      description: 'Book search is currently unavailable. Please try again later.',
      fields: [],
    };
  }

  const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
  await interaction.deferReply({ flags: ephemeral });

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
      description: 'Wikipedia is currently unavailable. Please try again later.',
      thumb: '',
    };
  } else {
    const data = await response.json();
    result = {
      title: `Wikipedia: ${data.title || query}`,
      url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
      description: data.extract || '',
      thumb: data.thumbnail?.source || '',
    };
  }

  const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
  await interaction.deferReply({ flags: ephemeral });

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
        description: 'Could not find this location. Try being more specific',
        fields: [],
      };
    } else {
      const { lat, lon, display_name: displayName } = geoData[0];

      const wttrUrl = `https://wttr.in/${lat},${lon}?format=j1`;
      const weatherRes = await fetch(wttrUrl);
      const weatherData = await weatherRes.json();

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
  } catch (err) {
    result = {
      title: `Weather: ${city}`,
      url: `https://wttr.in/${encodeURIComponent(city)}`,
      description: 'Weather is currently unavailable. Please try again later.',
      fields: [],
    };
  }

  const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
  await interaction.deferReply({ flags: ephemeral });

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
