/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  SlashCommandBuilder,
} from 'discord.js';

import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { wikipedia } from '../../../global/commands/g.wikipedia';
import { commandContext } from '../../utils/context';

const F = f(__filename);

export const dWikipedia: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('wikipedia')
    .setDescription('Define a word from wikipedia')
    .addStringOption(option => option
      .setName('query')
      .setDescription('Word to define')
      .setRequired(true))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });

    const query = (interaction.options.getString('query') as string);

    const wikiData = await wikipedia(query);
    const embed = embedTemplate()
      .setAuthor(null)
      .setTitle(wikiData.title)
      .setURL(wikiData.url)
      .setThumbnail(wikiData.thumbnail)
      .setDescription(wikiData.description);

    await interaction.editReply({ embeds: [embed] });

    return true;
  },
};

export default dWikipedia;
