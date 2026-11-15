import {
  ModalBuilder, TextInputBuilder,
  TextInputStyle,
  LabelBuilder,
} from 'discord.js';

export class AiModal {
  static readonly ID = {
    CONTEXT_SIZE: 'AI~contextSizeModal',
    RESPONSE_SIZE: 'AI~responseSizeModal',
  };

  static readonly responseSize = (responseSize: number) => new ModalBuilder()
    .setCustomId(AiModal.ID.RESPONSE_SIZE)
    .setTitle('Response Size')
    .addLabelComponents(
      new LabelBuilder().setLabel('Response Size - Number between 100 and 9999').setTextInputComponent(new TextInputBuilder()
        .setCustomId(AiModal.ID.RESPONSE_SIZE)

        .setStyle(TextInputStyle.Short)
        .setValue(responseSize.toString())
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(4)),
    );

  static readonly contextSize = (contextSize: number) => new ModalBuilder()
    .setCustomId(AiModal.ID.CONTEXT_SIZE)
    .setTitle('Context Size')
    .addLabelComponents(
      new LabelBuilder().setLabel('Context Size - Number between 100 and 99999').setTextInputComponent(new TextInputBuilder()
        .setCustomId(AiModal.ID.CONTEXT_SIZE)

        .setStyle(TextInputStyle.Short)
        .setValue(contextSize.toString())
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(5)),
    );
}

export default AiModal;
