/* eslint-disable sonarjs/no-duplicate-string */
import {
  SlashCommandBuilder,
  MessageFlags,
  ChatInputCommandInteraction,
  EmbedField,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import {
  normalDefine, steam, urbanDefine, weather, wikipedia,
} from '../../../global/commands/g.search';

// const F = f(__filename);

// Helper function to handle ephemeral flag and defer reply
async function handleEphemeralDefer(interaction: ChatInputCommandInteraction): Promise<void> {
  const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
  await interaction.deferReply({ flags: ephemeral });
}

// Generic handler for simple embed responses
async function handleEmbedResponse(
  interaction: ChatInputCommandInteraction,
  searchFn: (query: string) => Promise<any>,
  queryParam: string,
): Promise<boolean> {
  try {
    await handleEphemeralDefer(interaction);

    const query = interaction.options.getString(queryParam, true);
    const result = await searchFn(query);

    const embed = embedTemplate()
      .setTitle(result.title)
      .setURL(result.url)
      .setDescription(result.description);

    // Handle optional properties
    if (result.header) embed.setImage(result.header);
    if (result.thumb) embed.setThumbnail(result.thumb);
    if (result.fields) result.fields.forEach((field: EmbedField) => embed.addFields(field));

    await interaction.editReply({ embeds: [embed] });
    return true;
  } catch (error) {
    return false;
  }
}

async function dDefine(interaction: ChatInputCommandInteraction): Promise<boolean> {
  try {
    await handleEphemeralDefer(interaction);

    const word = interaction.options.getString('word', true);
    let result = await normalDefine(word);

    // If no dictionary definition, fallback to Urban Dictionary
    if (result.description.startsWith('No dictionary definition found')) {
      const urbanResult = await urbanDefine(word);
      result = {
        ...urbanResult,
        description: `No standard dictionary definition found for "${word}".
              Showing Urban Dictionary result instead:

              ${urbanResult.description}`,
      };
    }

    const embed = embedTemplate()
      .setTitle(result.title)
      .setURL(result.url)
      .setDescription(result.description);
    await interaction.editReply({ embeds: [embed] });
    return true;
  } catch (error) {
    return false;
  }
}

async function dUrbanDefine(interaction: ChatInputCommandInteraction): Promise<boolean> {
  try {
    await handleEphemeralDefer(interaction);

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
        description: `No Urban Dictionary result found for "${word}".
            Showing standard dictionary result instead:

            ${dictResult.description}`,
      };
    }

    const embed = embedTemplate()
      .setTitle(result.title)
      .setURL(result.url)
      .setDescription(result.description);
    await interaction.editReply({ embeds: [embed] });
    return true;
  } catch (error) {
    return false;
  }
}

async function dSteam(interaction: ChatInputCommandInteraction): Promise<boolean> {
  return handleEmbedResponse(interaction, steam, 'game');
}

async function dWikipedia(interaction: ChatInputCommandInteraction): Promise<boolean> {
  return handleEmbedResponse(interaction, wikipedia, 'query');
}

async function dWeather(interaction: ChatInputCommandInteraction): Promise<boolean> {
  return handleEmbedResponse(interaction, weather, 'city');
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
      .setDescription('Find a game on Steam')
      .addStringOption(option => option
        .setName('game')
        .setDescription('Game to search for')
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
      case 'steam':
        return dSteam(interaction);
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
