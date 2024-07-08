import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Colors,
} from 'discord.js';
import OpenAI from 'openai';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';
import { aiTranslate } from '../../../global/commands/g.ai';

const F = f(__filename);

export const dTranslate: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('translate')
    .setDescription('Translate a message to English')
    .addStringOption(option => option
      .setDescription('Language to translate to')
      .setRequired(true)
      .setName('target_language'))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you'))
    .addStringOption(option => option.setName('message')
      .setDescription('The message to translate')
      .setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return false;
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral') ?? true;
    await interaction.deferReply({ ephemeral });
    const targetLanguage = interaction.options.getString('target_language');
    const message = interaction.options.getString('message');

    if (!targetLanguage || !message) {
      await interaction.editReply({
        embeds: [embedTemplate()
          .setTitle('Error!')
          .setDescription('You must include target_language and message!')
          .setColor(Colors.Red)
          .setFooter(null)],
      });
      return false;
    }

    const messageList = [{
      role: 'user',
      content: message,
    }] as OpenAI.Chat.ChatCompletionMessageParam[];
    // There may be the potential for the user to use this to make TripBot say bad things. 
    // Do we need some kind of filter?
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { response, promptTokens, completionTokens } = await aiTranslate(targetLanguage, messageList);
    await interaction.editReply({
      embeds: [embedTemplate()
        .setTitle('Here\'s your translation!')
        .setDescription(response)
        .setColor(Colors.Blurple)],
    });
    return true;
  },
};

export default dTranslate;
