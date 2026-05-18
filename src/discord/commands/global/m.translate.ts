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
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const mTranslate: MessageCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Translate')
    .setNameLocalizations(getCommandLocalizations('translate', 'commandName'))
    .setType(ApplicationCommandType.Message)
    .setIntegrationTypes([0]),
  async execute(interaction) {
    if (!interaction.guild) return false;
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const locale = await getLocale(interaction);
    const targetMessage = interaction.targetMessage.content;

    const messageList = [{
      role: 'user',
      content: targetMessage,
    }] as OpenAI.Chat.ChatCompletionMessageParam[];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { response, promptTokens, completionTokens } = await aiTranslate('English', messageList);
    await interaction.editReply({
      embeds: [embedTemplate()
        .setTitle(t(locale, 'translate', 'translationTitle'))
        .setDescription(response)
        .setColor(Colors.Blurple)],
    });
    return true;
  },
};

export default mTranslate;
