import { ButtonBuilder, ButtonStyle } from 'discord.js';
import AiText from './aiTexts';

export default class AiButton {
  static readonly agreePrivacy = new ButtonBuilder()
    .setCustomId(AiText.ButtonId.AGREE_PRIVACY)
    .setLabel('I agree to the privacy policy')
    .setStyle(ButtonStyle.Success);

  static readonly agreeTos = new ButtonBuilder()
    .setCustomId(AiText.ButtonId.AGREE_TOS)
    .setLabel('I agree to the terms of service')
    .setStyle(ButtonStyle.Success);

  static readonly contextSize = new ButtonBuilder()
    .setCustomId(AiText.ButtonId.CONTEXT_SIZE)
    .setLabel('XX tokens')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('🧠');

  static readonly responseSize = new ButtonBuilder()
    .setCustomId(AiText.ButtonId.RESPONSE_SIZE)
    .setLabel('XX tokens')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('📦');
}
