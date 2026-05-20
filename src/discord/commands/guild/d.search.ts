/* eslint-disable sonarjs/no-duplicate-string */
import {
  SlashCommandBuilder,
  MessageFlags,
  ChatInputCommandInteraction,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

async function dDefine(interaction: ChatInputCommandInteraction, locale: string): Promise<boolean> {
  const word = interaction.options.getString('word', true);
  let result;
  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    const response = await fetch(url);
    if (!response.ok) {
      result = {
        title: t(locale, 'search', 'dictTitle', { word }),
        url: `https://www.google.com/search?q=define+${encodeURIComponent(word)}`,
        description: t(locale, 'search', 'dictNotFound', { word }),
      };
    } else {
      const data = await response.json();
      if (!Array.isArray(data) || !data[0]?.meanings?.length) {
        result = {
          title: t(locale, 'search', 'dictTitle', { word }),
          url: `https://www.google.com/search?q=define+${encodeURIComponent(word)}`,
          description: t(locale, 'search', 'dictNotFound', { word }),
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
          title: t(locale, 'search', 'dictTitle', { word }),
          url: `https://www.google.com/search?q=define+${encodeURIComponent(word)}`,
          description: stripIndents`
            ${partOfSpeech}${definition}${example}
          `,
        };
      }
    }
  } catch (err) {
    result = {
      title: t(locale, 'search', 'dictTitle', { word }),
      url: `https://www.google.com/search?q=define+${encodeURIComponent(word)}`,
      description: t(locale, 'search', 'dictUnavailable'),
    };
  }

  if (result.description.startsWith(t(locale, 'search', 'dictNotFound', { word }))) {
    try {
      const url = `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(word)}`;
      const response = await fetch(url);
      if (!response.ok) {
        result = {
          title: t(locale, 'search', 'urbanTitle', { word }),
          url: `https://www.urbandictionary.com/define.php?term=${encodeURIComponent(word)}`,
          description: t(locale, 'search', 'urbanUnavailable'),
        };
      } else {
        const data = await response.json();
        if (!data.list || data.list.length === 0) {
          result = {
            title: t(locale, 'search', 'urbanTitle', { word }),
            url: `https://www.urbandictionary.com/define.php?term=${encodeURIComponent(word)}`,
            description: t(locale, 'search', 'urbanNotFound', { word }),
          };
        } else {
          const entry = data.list[0];
          result = {
            title: t(locale, 'search', 'urbanTitle', { word: entry.word }),
            url: entry.permalink,
            description: stripIndents`
              ${t(locale, 'search', 'dictFallback', { word })}

              ${entry.definition.replace(/\[([^\]]+)\]/g, '$1')}

              *Example:* ${entry.example.replace(/\[([^\]]+)\]/g, '$1')}
              👍 ${entry.thumbs_up} | 👎 ${entry.thumbs_down}
            `,
          };
        }
      }
    } catch (err) {
      result = {
        title: t(locale, 'search', 'urbanTitle', { word }),
        url: `https://www.urbandictionary.com/define.php?term=${encodeURIComponent(word)}`,
        description: t(locale, 'search', 'urbanError'),
      };
    }
  }

  const embed = embedTemplate()
    .setTitle(result.title)
    .setURL(result.url)
    .setDescription(result.description);
  await interaction.editReply({ embeds: [embed] });
  return true;
}

async function dUrbanDefine(interaction: ChatInputCommandInteraction, locale: string): Promise<boolean> {
  const word = interaction.options.getString('define');
  let result;
  try {
    const url = `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(word ?? '')}`;
    const response = await fetch(url);
    if (!response.ok) {
      result = {
        title: t(locale, 'search', 'urbanTitle', { word: word ?? '' }),
        url: `https://www.urbandictionary.com/define.php?term=${encodeURIComponent(word ?? '')}`,
        description: t(locale, 'search', 'urbanUnavailable'),
      };
    } else {
      const data = await response.json();
      if (!data.list || data.list.length === 0) {
        result = {
          title: t(locale, 'search', 'urbanTitle', { word: word ?? '' }),
          url: `https://www.urbandictionary.com/define.php?term=${encodeURIComponent(word ?? '')}`,
          description: t(locale, 'search', 'urbanNotFound', { word: word ?? '' }),
        };
      } else {
        const entry = data.list[0];
        result = {
          title: t(locale, 'search', 'urbanTitle', { word: entry.word }),
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
      title: t(locale, 'search', 'urbanTitle', { word: word ?? '' }),
      url: `https://www.urbandictionary.com/define.php?term=${encodeURIComponent(word ?? '')}`,
      description: t(locale, 'search', 'urbanError'),
    };
  }

  if (result.description.startsWith(t(locale, 'search', 'urbanNotFound', { word: word ?? '' }))) {
    try {
      const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word ?? '')}`;
      const response = await fetch(url);
      if (!response.ok) {
        result = {
          title: t(locale, 'search', 'dictTitle', { word: word ?? '' }),
          url: `https://www.google.com/search?q=define+${encodeURIComponent(word ?? '')}`,
          description: t(locale, 'search', 'dictNotFound', { word: word ?? '' }),
        };
      } else {
        const data = await response.json();
        if (!Array.isArray(data) || !data[0]?.meanings?.length) {
          result = {
            title: t(locale, 'search', 'dictTitle', { word: word ?? '' }),
            url: `https://www.google.com/search?q=define+${encodeURIComponent(word ?? '')}`,
            description: t(locale, 'search', 'dictNotFound', { word: word ?? '' }),
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
            title: t(locale, 'search', 'dictTitle', { word: word ?? '' }),
            url: `https://www.google.com/search?q=define+${encodeURIComponent(word ?? '')}`,
            description: stripIndents`
              ${t(locale, 'search', 'urbanFallback', { word: word ?? '' })}

              ${partOfSpeech}${definition}${example}
            `,
          };
        }
      }
    } catch (err) {
      result = {
        title: t(locale, 'search', 'dictTitle', { word: word ?? '' }),
        url: `https://www.google.com/search?q=define+${encodeURIComponent(word ?? '')}`,
        description: t(locale, 'search', 'dictUnavailable'),
      };
    }
  }

  const embed = embedTemplate()
    .setTitle(result.title)
    .setURL(result.url)
    .setDescription(result.description);
  await interaction.editReply({ embeds: [embed] });
  return true;
}

async function dGame(interaction: ChatInputCommandInteraction, locale: string): Promise<boolean> {
  const query = interaction.options.getString('game', true);
  let result;
  const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&cc=us`;
  const response = await fetch(url);
  if (!response.ok) {
    result = {
      title: t(locale, 'search', 'steamTitle', { query }),
      url: `https://store.steampowered.com/search/?term=${encodeURIComponent(query)}`,
      description: t(locale, 'search', 'steamNotFound', { query }),
      thumb: '',
      fields: [],
    };
  } else {
    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      result = {
        title: t(locale, 'search', 'steamTitle', { query }),
        url: `https://store.steampowered.com/search/?term=${encodeURIComponent(query)}`,
        description: t(locale, 'search', 'steamNotFound', { query }),
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

      let priceFieldName = t(locale, 'search', 'priceField');
      let salePercent = 0;
      const usdPriceObj = details.$?.price_overview;
      if (usdPriceObj && usdPriceObj.discount_percent && usdPriceObj.discount_percent > 0) {
        salePercent = usdPriceObj.discount_percent;
        priceFieldName = t(locale, 'search', 'priceDiscountField', { percent: String(salePercent) });
      }
      const prices = currencies.map(cur => {
        const priceObj = details[cur.symbol]?.price_overview;
        return priceObj ? `${cur.symbol}${priceObj.final_formatted.replace(/[^0-9.,]/g, '')}` : `${cur.symbol}N/A`;
      }).join(', ');

      const platforms = (usDetails.platforms && typeof usDetails.platforms === 'object')
        ? Object.entries(usDetails.platforms)
          .filter(([supported]) => supported)
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
          { name: t(locale, 'search', 'tagsField'), value: tags, inline: true },
          { name: t(locale, 'search', 'releaseField'), value: releaseDate, inline: true },
          { name: t(locale, 'search', 'platformsField'), value: platforms, inline: true },
          { name: t(locale, 'search', 'developerField'), value: developer, inline: true },
          { name: t(locale, 'search', 'publisherField'), value: publisher, inline: true },
        ],
      };
    }
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

async function dBook(interaction: ChatInputCommandInteraction, locale: string): Promise<boolean> {
  const query = interaction.options.getString('book', true);
  let result;
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`;
    const response = await fetch(url);
    if (!response.ok) {
      result = {
        title: t(locale, 'search', 'bookTitle', { query }),
        url: `https://books.google.com/books?vid=ISBN${encodeURIComponent(query)}`,
        description: t(locale, 'search', 'bookUnavailable'),
        fields: [],
      };
    } else {
      const data = await response.json();
      if (!data.items || data.items.length === 0) {
        result = {
          title: t(locale, 'search', 'bookTitle', { query }),
          url: `https://books.google.com/books?vid=ISBN${encodeURIComponent(query)}`,
          description: t(locale, 'search', 'bookNotFound', { query }),
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

        const searchTerm = encodeURIComponent(`${book.title} ${authors !== 'Unknown' ? authors : ''}`.trim());
        const platformsList = [
          { name: 'Kobo', url: `https://www.kobo.com/search?query=${searchTerm}` },
          { name: 'Amazon', url: `https://www.amazon.com/s?k=${searchTerm}` },
          { name: 'Google Books', url: infoLink },
          { name: 'Apple Books', url: `https://books.apple.com/us/search?term=${searchTerm}` },
        ];

        result = {
          title: t(locale, 'search', 'bookTitle', { query: book.title || query }),
          url: infoLink,
          description,
          thumb: thumbnail,
          fields: [
            { name: t(locale, 'search', 'authorField'), value: authors, inline: true },
            { name: t(locale, 'search', 'publisherField'), value: publisher, inline: true },
            { name: t(locale, 'search', 'publishedDateField'), value: publishedDate, inline: true },
            {
              name: t(locale, 'search', 'platformsField'),
              value: platformsList.map(p => `[${p.name}](${p.url})`).join(' | '),
              inline: false,
            },
          ],
        };
      }
    }
  } catch (err) {
    result = {
      title: t(locale, 'search', 'bookTitle', { query }),
      url: `https://books.google.com/books?vid=ISBN${encodeURIComponent(query)}`,
      description: t(locale, 'search', 'bookError'),
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

async function dSong(interaction: ChatInputCommandInteraction, locale: string): Promise<boolean> {
  const query = interaction.options.getString('song', true);
  let result;
  let odesliInputUrl = '';
  let odesliUrl = `https://odesli.co/search/${encodeURIComponent(query)}`;
  let platformsField = '';
  let title = query;
  let artist = 'Unknown';
  let artwork = '';

  const isUrl = /^https?:\/\/\S+$/.test(query);

  try {
    if (isUrl) {
      odesliInputUrl = query;
    } else {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('iTunes API unavailable');
      const data = await response.json();
      if (!data.results || data.results.length === 0) throw new Error('No song found');
      const song = data.results[0];
      odesliInputUrl = song.trackViewUrl || `https://music.apple.com/us/search?term=${encodeURIComponent(song.trackName || query)}`;
    }

    try {
      const odesliRes = await fetch(`https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(odesliInputUrl)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const odesliData = await odesliRes.json();
      if (odesliData.entitiesByUniqueId && odesliData.linksByPlatform) {
        odesliUrl = odesliData.pageUrl || odesliUrl;
        const entityKey = Object.keys(odesliData.entitiesByUniqueId)[0];
        const entity = odesliData.entitiesByUniqueId[entityKey];
        title = entity.title || title;
        artist = entity.artistName || artist;
        artwork = entity.thumbnailUrl || artwork;

        const platformsToShow = [
          'spotify',
          'soundcloud',
          'youtubeMusic',
          'appleMusic',
          'amazonMusic',
        ];
        platformsField = platformsToShow
          .filter(platform => odesliData.linksByPlatform[platform])
          .map(platform => {
            const platformName = {
              spotify: 'Spotify',
              appleMusic: 'Apple',
              youtubeMusic: 'YouTube',
              soundcloud: 'SoundCloud',
              amazonMusic: 'Amazon',
            }[platform] || platform;
            const { url } = odesliData.linksByPlatform[platform];
            return `[${platformName}](${url})`;
          })
          .join(' | ');
      } else {
        platformsField = `[Apple Music](${odesliInputUrl})`;
      }
    } catch {
      platformsField = `[Apple Music](${odesliInputUrl})`;
    }

    result = {
      title: t(locale, 'search', 'songTitle', { query: title }),
      url: odesliUrl,
      description: ' ',
      thumb: artwork,
      fields: [
        { name: t(locale, 'search', 'artistField'), value: artist, inline: true },
        {
          name: t(locale, 'search', 'platformsField'),
          value: platformsField,
          inline: false,
        },
      ],
    };
  } catch (err) {
    result = {
      title: t(locale, 'search', 'songTitle', { query }),
      url: odesliUrl,
      description: t(locale, 'search', 'songUnavailable'),
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

async function dWikipedia(interaction: ChatInputCommandInteraction, locale: string): Promise<boolean> {
  const query = interaction.options.getString('query', true);
  let result;
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
  const response = await fetch(url);
  if (!response.ok) {
    result = {
      title: t(locale, 'search', 'wikiTitle', { query }),
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
      description: t(locale, 'search', 'wikiNotFound'),
      thumb: '',
    };
  } else {
    const data = await response.json();
    result = {
      title: t(locale, 'search', 'wikiTitle', { query: data.title || query }),
      url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
      description: data.extract || '',
      thumb: data.thumbnail?.source || '',
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

async function dWeather(interaction: ChatInputCommandInteraction, locale: string): Promise<boolean> {
  const city = interaction.options.getString('city', true);
  let result;
  try {
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`);
    const geoData = await geoRes.json();
    if (!geoData[0]) {
      result = {
        title: t(locale, 'search', 'weatherTitle', { location: city }),
        url: `https://wttr.in/${encodeURIComponent(city)}`,
        description: t(locale, 'search', 'weatherNotFound'),
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
      const description = `[${t(locale, 'search', 'viewOnMaps')}](${mapsUrl})`;

      const fields = [
        { name: t(locale, 'search', 'conditionField'), value: weatherDesc, inline: true },
        { name: t(locale, 'search', 'temperatureField'), value: `${tempC}°C / ${tempF}°F`, inline: true },
        { name: t(locale, 'search', 'feelsLikeField'), value: `${feelsLikeC}°C / ${feelsLikeF}°F`, inline: true },
        { name: t(locale, 'search', 'windField'), value: `${windKph} km/h ${windDir}`, inline: true },
        { name: t(locale, 'search', 'humidityField'), value: `${humidity}%`, inline: true },
        { name: t(locale, 'search', 'precipitationField'), value: `${precipMM} mm`, inline: true },
      ];

      result = {
        title: t(locale, 'search', 'weatherTitle', { location: displayName }),
        url: wttrUrl,
        description,
        fields,
      };
    }
  } catch (err) {
    result = {
      title: t(locale, 'search', 'weatherTitle', { location: city }),
      url: `https://wttr.in/${encodeURIComponent(city)}`,
      description: t(locale, 'search', 'weatherUnavailable'),
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
    .setNameLocalizations(getCommandLocalizations('search', 'commandName'))
    .setDescription(t('en-US', 'search', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('search', 'commandDescription'))
    .addSubcommand(sub => sub
      .setName('define')
      .setDescription(t('en-US', 'search', 'defineSubcommand'))
      .addStringOption(option => option
        .setName('word')
        .setDescription(t('en-US', 'search', 'wordOption'))
        .setDescriptionLocalizations(getCommandLocalizations('search', 'wordOption'))
        .setRequired(true))
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription(t('en-US', 'search', 'ephemeralOption'))
        .setDescriptionLocalizations(getCommandLocalizations('search', 'ephemeralOption'))))
    .addSubcommand(sub => sub
      .setName('urbandefine')
      .setDescription(t('en-US', 'search', 'urbandefineSubcommand'))
      .addStringOption(option => option
        .setName('define')
        .setDescription(t('en-US', 'search', 'defineOption'))
        .setDescriptionLocalizations(getCommandLocalizations('search', 'defineOption'))
        .setRequired(true))
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription(t('en-US', 'search', 'ephemeralOption'))
        .setDescriptionLocalizations(getCommandLocalizations('search', 'ephemeralOption'))))
    .addSubcommand(sub => sub
      .setName('game')
      .setDescription(t('en-US', 'search', 'gameSubcommand'))
      .addStringOption(option => option
        .setName('game')
        .setDescription(t('en-US', 'search', 'gameOption'))
        .setDescriptionLocalizations(getCommandLocalizations('search', 'gameOption'))
        .setRequired(true))
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription(t('en-US', 'search', 'ephemeralOption'))
        .setDescriptionLocalizations(getCommandLocalizations('search', 'ephemeralOption'))))
    .addSubcommand(sub => sub
      .setName('book')
      .setDescription(t('en-US', 'search', 'bookSubcommand'))
      .addStringOption(option => option
        .setName('book')
        .setDescription(t('en-US', 'search', 'bookOption'))
        .setDescriptionLocalizations(getCommandLocalizations('search', 'bookOption'))
        .setRequired(true))
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription(t('en-US', 'search', 'ephemeralOption'))
        .setDescriptionLocalizations(getCommandLocalizations('search', 'ephemeralOption'))))
    .addSubcommand(sub => sub
      .setName('song')
      .setDescription(t('en-US', 'search', 'songSubcommand'))
      .addStringOption(option => option
        .setName('song')
        .setDescription(t('en-US', 'search', 'songOption'))
        .setDescriptionLocalizations(getCommandLocalizations('search', 'songOption'))
        .setRequired(true))
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription(t('en-US', 'search', 'ephemeralOption'))
        .setDescriptionLocalizations(getCommandLocalizations('search', 'ephemeralOption'))))
    .addSubcommand(sub => sub
      .setName('wikipedia')
      .setDescription(t('en-US', 'search', 'wikipediaSubcommand'))
      .addStringOption(option => option
        .setName('query')
        .setDescription(t('en-US', 'search', 'queryOption'))
        .setDescriptionLocalizations(getCommandLocalizations('search', 'queryOption'))
        .setRequired(true))
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription(t('en-US', 'search', 'ephemeralOption'))
        .setDescriptionLocalizations(getCommandLocalizations('search', 'ephemeralOption')))) as SlashCommandBuilder,
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
    const locale = await getLocale(interaction, 'search');
    const subcommand = interaction.options.getSubcommand();
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });

    switch (subcommand) {
      case 'define':
        return dDefine(interaction, locale);
      case 'urbandefine':
        return dUrbanDefine(interaction, locale);
      case 'game':
        return dGame(interaction, locale);
      case 'book':
        return dBook(interaction, locale);
      case 'song':
        return dSong(interaction, locale);
      case 'wikipedia':
        return dWikipedia(interaction, locale);
      case 'weather':
        return dWeather(interaction, locale);
      default:
        await interaction.reply(t(locale, 'search', 'unknownSubcommand'));
        return false;
    }
  },
};

export default dSearch;
