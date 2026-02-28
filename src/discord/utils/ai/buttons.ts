import { ButtonBuilder, ButtonStyle } from 'discord.js';
import { AiText } from './texts';

export class AiButton {
  static get agreePrivacy() {
    return new ButtonBuilder()
      .setCustomId(AiText.ButtonId.AGREE_PRIVACY)
      .setLabel('I agree to the privacy policy')
      .setStyle(ButtonStyle.Success);
  }

  static get agreeTos() {
    return new ButtonBuilder()
      .setCustomId(AiText.ButtonId.AGREE_TOS)
      .setLabel('I agree to the terms of service')
      .setStyle(ButtonStyle.Success);
  }

  static contextSize(tokens: number | string) {
    return new ButtonBuilder()
      .setCustomId(AiText.ButtonId.CONTEXT_SIZE)
      .setLabel(`💭 Context: ${tokens.toLocaleString()} tokens`)
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🧠');
  }

  static responseSize(tokens: number | string) {
    return new ButtonBuilder()
      .setCustomId(AiText.ButtonId.RESPONSE_SIZE)
      .setLabel(`📝 Response: ${tokens} tokens`)
      .setStyle(ButtonStyle.Primary)
      .setEmoji('📦');
  }
}

export default AiButton;
