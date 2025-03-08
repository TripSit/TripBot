/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';

import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { wikipedia } from '../../../global/commands/g.wikipedia';
import commandContext from '../../utils/context';

const F = f(__filename);

export const dWikipedia: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('wikipedia')
    .setDescription('Define a word from wikipedia')
    .setIntegrationTypes([0])
    .addStringOption(option => option
      .setName('query')
      .setDescription('Word to define')
      .setRequired(true))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')) as SlashCommandBuilder,

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });

    const query = (interaction.options.getString('query') as string);

    const wikiData = await wikipedia(query);
    const embed = embedTemplate()
      .setAuthor(null)
      .setTitle(wikiData.title !== '' ? wikiData.title : null)
      .setURL(wikiData.url !== '' ? wikiData.url : null)
      .setThumbnail(wikiData.thumbnail !== '' ? wikiData.thumbnail : null)
      .setDescription(wikiData.description !== '' ? wikiData.description : null)
      .setFooter(null);

    await interaction.editReply({ embeds: [embed] });

    return true;
  },
};

export default dWikipedia;
