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

async function fetchRepliedMessage(message: Message): Promise<Message | null> {
  if (!message.reference?.messageId) return null;
  try {
    return await message.channel.messages.fetch(message.reference.messageId);
  } catch (error) {
    log.error(F, `Failed to fetch replied message: ${error}`);
    return null;
  }
}

// Choose the appropriate log channel based on the class
function logChannelFor(toxicityClass: string | null): string {
  if (toxicityClass === 'flag') {
    return env.NODE_ENV === 'production' ? env.CHANNEL_AIMOD_LOG : env.CHANNEL_BOTSPAM;
  }
  return env.CHANNEL_BOTERRORS;
}

function describeReply(repliedMessage: Message | null): string[] {
  if (!repliedMessage) return [];
  return [
    `\n**Replying to**: ${repliedMessage.content}`,
    `**Referenced User**: ${repliedMessage.author}`,
    `**Referenced Message**: ${repliedMessage.url}`,
  ];
}

export async function monitorToxicity(message: Message): Promise<void> {
  // Get reference message if this is a reply
  const repliedMessage = await fetchRepliedMessage(message);

  const result = await isToxic(message.content);

  if (result.isFlaggedOrLowConfidence) {
    log.info(F, `Message ${message.id} flagged by ModerateHatespeech`);

    const aiModLogChannel = await discordClient.channels.fetch(logChannelFor(result.class)) as TextChannel;
    await aiModLogChannel.send({
      embeds: [{
        title: 'Flagged by ModerateHatespeech',
        description: [
          `**Author:** ${message.author}`,
          `**Message:** ${message.content}`,
          `**Link:** ${message.url}`,
          `**Class:** ${result.class}`,
          `**Confidence:** ${result.confidence}`,
          ...describeReply(repliedMessage),
        ].filter(Boolean).join('\n'),
        color: Colors.Yellow,
      }],
      allowedMentions: { parse: [] },
    });
  }
}

export default isToxic;
