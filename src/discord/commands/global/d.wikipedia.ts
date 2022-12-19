/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Colors,
  SlashCommandBuilder,
  TextChannel,
  ModalSubmitInteraction,
} from 'discord.js';

import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { wikipedia } from '../../../global/commands/g.wikipedia';
import { startLog } from '../../utils/startLog';

const F = f(__filename);

export default dWikipedia;

export const dWikipedia: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('wikipedia')
    .setDescription('Define a word from wikipedia')
    .addStringOption(option => option
      .setName('query')
      .setDescription('Word to define')
      .setRequired(true)),

  async execute(interaction) {
    startLog(F, interaction);

    const query = (interaction.options.getString('query') as string);

    const embed = embedTemplate()
      .setTitle(`Definition for ${query}`)
      .setDescription(await wikipedia(query));

    interaction.reply({ embeds: [embed] });

    return true;
  },
};
