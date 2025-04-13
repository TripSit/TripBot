import axios from 'axios';
import { Colors, Message, TextChannel } from 'discord.js';

const F = f(__filename);
const MODERATION_API_URL = 'https://api.moderatehatespeech.com/api/v1/moderate/';

interface ModerateHatespeechResponse {
  class: 'normal' | 'flag' | null;
  confidence: number;
  isFlaggedOrLowConfidence: boolean;
}

/**
 * Checks if the given text should be flagged as toxic using the ModerateHatespeech API.
 * Returns true if the content is classified as harmful ("flag") or if the confidence
 * in a "normal" classification is below the acceptable threshold.
 *
 * @param text - The text to evaluate for toxicity.
 * @returns boolean - True if the text is considered toxic or uncertain; false otherwise.
 */
export async function isToxic(text: string): Promise<ModerateHatespeechResponse> {
  const apiKey = env.MODERATE_HATESPEECH_TOKEN;
  const minNormalConfidence = env.MODERATE_HATESPEECH_NORMAL_CONFIDENCE;
  const minFlagConfidence = env.MODERATE_HATESPEECH_FLAG_CONFIDENCE;

  if (!apiKey || !minNormalConfidence) {
    log.error(F, 'ModerateHatespeech API key or confidence level not set');
    return { class: null, confidence: 0, isFlaggedOrLowConfidence: false };
  }

  try {
    const { data } = await axios.post(
      MODERATION_API_URL,
      { token: apiKey, text },
      { headers: { 'Content-Type': 'application/json' } },
    );

    // log.info(F, `ModerateHatespeech API response: ${JSON.stringify(data)}`);

    const isNormalWithLowConfidence = data.class === 'normal' && data.confidence < minNormalConfidence;
    const isFlagged = data.class === 'flag' && data.confidence >= minFlagConfidence;

    return {
      class: data.class,
      confidence: data.confidence,
      isFlaggedOrLowConfidence: isNormalWithLowConfidence || isFlagged,
    };
  } catch (error) {
    log.error(F, `Moderation API error: ${error}`);
    return { class: null, confidence: 0, isFlaggedOrLowConfidence: false };
  }
}

export async function monitorToxicity(message: Message): Promise<void> {
  // Get reference message if this is a reply
  let repliedMessage = null;
  if (message.reference && message.reference.messageId) {
    try {
      repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
    } catch (error) {
      log.error(F, `Failed to fetch replied message: ${error}`);
    }
  }

  const result = await isToxic(message.content);

  if (result.isFlaggedOrLowConfidence) {
    log.info(F, `Message flagged by ModerateHatespeech: "${message.content}"`);
    const logChannelId = env.NODE_ENV === 'production' ? env.CHANNEL_AIMOD_LOG : env.CHANNEL_BOTSPAM;
    const aiModLogChannel = await discordClient.channels.fetch(logChannelId) as TextChannel;

    await aiModLogChannel.send({
      embeds: [{
        title: 'Flagged by ModerateHatespeech',
        description: [
          `**Author:** ${message.author}`,
          `**Message:** ${message.content}`,
          `**Link:** ${message.url}`,
          `**Class:** ${result.class}`,
          `**Confidence:** ${result.confidence}`,
          repliedMessage ? `\n**Replying to**: ${repliedMessage.content}` : '',
          repliedMessage ? `**Referenced User**: ${repliedMessage.author}` : '',
          repliedMessage ? `**Referenced Message**: ${repliedMessage.url}` : '',
        ].filter(Boolean).join('\n'),
        color: Colors.Yellow,
      }],
    });
  }
}

export default isToxic;
