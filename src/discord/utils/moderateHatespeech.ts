import axios from 'axios';
import { Colors, Message, TextChannel } from 'discord.js';

const F = f(__filename);
const MODERATION_API_URL = 'https://api.moderatehatespeech.com/api/v1/moderate/';

/**
 * Checks if the given text should be flagged as toxic using the ModerateHatespeech API.
 * Returns true if the content is classified as harmful ("flag") or if the confidence
 * in a "normal" classification is below the acceptable threshold.
 *
 * @param text - The text to evaluate for toxicity.
 * @returns boolean - True if the text is considered toxic or uncertain; false otherwise.
 */
export async function isToxic(text: string): Promise<boolean> {
  const apiKey = process.env.MODERATE_HATESPEECH_TOKEN;
  const minNormalConfidence = env.MODERATE_HATESPEECH_NORMAL_CONFIDENCE;

  if (!apiKey || !minNormalConfidence) {
    log.error(F, 'ModerationHatespeech API key or confidence level not set');
    return false;
  }

  try {
    const { data } = await axios.post(
      MODERATION_API_URL,
      { token: apiKey, text },
      { headers: { 'Content-Type': 'application/json' } },
    );

    log.info(F, `ModerateHatespeech API response: ${JSON.stringify(data)}`);

    const isNormalWithLowConfidence = data.class === 'normal' && data.confidence < minNormalConfidence;
    const isFlagged = data.class === 'flag';

    return isNormalWithLowConfidence || isFlagged;
  } catch (error) {
    log.error(F, `Moderation API error: ${error}`);
    return false;
  }
}

export async function monitorToxicity(message: Message): Promise<void> {
  if (await isToxic(message.content)) {
    log.info(F, `Message flagged by ModerateHatespeech: "${message.content}"`);
    const logChannelId = env.NODE_ENV === 'production' ? env.CHANNEL_AIMOD_LOG : env.CHANNEL_BOTSPAM;
    const aiModLogChannel = await discordClient.channels.fetch(logChannelId) as TextChannel;
    await aiModLogChannel.send({
      embeds: [{
        title: 'Flagged by ModerateHatespeech',
        description: `**Author:** ${message.author.displayName}\n**Message:** ${message.content}\n**Link:** ${message.url}`,
        color: Colors.Yellow,
      }],
    });
  }
}

export default isToxic;
