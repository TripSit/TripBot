import {
  ActionRowBuilder, TextInputStyle, ModalBuilder, TextInputBuilder,
} from 'discord.js';

export default class AiModal {
  static readonly ID = {
    CONTEXT_SIZE: 'AI~contextSizeModal',
    RESPONSE_SIZE: 'AI~responseSizeModal',
  };

  static readonly responseSize = (responseSize: number) => new ModalBuilder()
    .setCustomId(AiModal.ID.RESPONSE_SIZE)
    .setTitle('Response Size')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId(AiModal.ID.RESPONSE_SIZE)
          .setLabel('Response Size - Number between 100 and 9999')
          .setStyle(TextInputStyle.Short)
          .setValue(responseSize.toString())
          .setRequired(true)
          .setMinLength(1)
          .setMaxLength(4),
      ),
    );

  static readonly contextSize = (contextSize: number) => new ModalBuilder()
    .setCustomId(AiModal.ID.CONTEXT_SIZE)
    .setTitle('Context Size')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId(AiModal.ID.CONTEXT_SIZE)
          .setLabel('Context Size - Number between 100 and 99999')
          .setStyle(TextInputStyle.Short)
          .setValue(contextSize.toString())
          .setRequired(true)
          .setMinLength(1)
          .setMaxLength(5),
      ),
    );
}
