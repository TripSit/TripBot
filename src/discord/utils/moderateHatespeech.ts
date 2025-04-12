import axios from 'axios';

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
  const apiKey = env.MODERATE_HATESPEECH_API_KEY;
  const minConfidence = env.MODERATE_HATESPEECH_NORMAL_CONFIDENCE;

  if (!apiKey || !minConfidence) {
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

    const isNormalWithLowConfidence = data.class === 'normal' && data.confidence < minConfidence;
    const isFlagged = data.class === 'flag';

    return isNormalWithLowConfidence || isFlagged;
  } catch (error) {
    log.error(F, `Moderation API error: ${error}`);
    return false;
  }
}

export default isToxic;
