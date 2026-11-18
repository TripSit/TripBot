import {
  ContextMenuCommandBuilder,
  Colors,
} from 'discord.js';
import {
  ApplicationCommandType,
  MessageFlags,
} from 'discord-api-types/v10';
import OpenAI from 'openai';
import { MessageCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { aiTranslate } from '../../../global/commands/g.ai';
import { hasAiConsent } from '../../../global/utils/aiConsent';

const F = f(__filename);

export const mTranslate: MessageCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Translate')
    .setType(ApplicationCommandType.Message)
    .setIntegrationTypes([0]),
  async execute(interaction) {
    if (!interaction.guild) return false;
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // The text is sent to an AI provider, so its author must have agreed to the AI terms and privacy policy.
    if (!await hasAiConsent(interaction.targetMessage.author.id)) {
      await interaction.editReply({
        content: 'I can only translate messages from people who agreed to the AI terms (`/ai tos`, `/ai privacy`).',
      });
      return true;
    }

    const targetMessage = interaction.targetMessage.content;

    const messageList = [{
      role: 'user',
      content: targetMessage,
    }] as OpenAI.Chat.ChatCompletionMessageParam[];

    const { response } = await aiTranslate('English', messageList);
    await interaction.editReply({
      embeds: [embedTemplate()
        .setTitle('Here\'s your translation!')
        .setDescription(response)
        .setColor(Colors.Blurple)],
    });
    return true;
  },
};

export default mTranslate;
