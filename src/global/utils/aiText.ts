/* eslint-disable max-len */
export class AiText {
  static readonly highEfficiencyModel = 'gpt-4o-mini';

  static readonly modPrompt = `You are acting as a moderation API. You will receive an input that a user wants to set as their user flair text.

      Drug references and jokes and adult humour are allowed as long as they are not extremely vulgur or offensive. You can swap any very rude words with more PG rated family friendly ones. If there are no alternative words, reject the flair.

      After that, adjust it to correct spelling, grammar and such. Made up words are allowed unless they are obvious misspellings, but no random keyboard gibberish (EG. ALRJRBSIEIR)

      IMPORTANT! You must correct capitalisation so that the flair fits headline capitalisation rules (every word should be capitalised except short words like "i love going to the supermarket" becomes "I Love Going to the Supermarket")

      You must reply with this strict format:
      Status: Approved, Adjusted, Rejected
      Reason: Spelling, grammar, etc
      Adjusted: The new edited flair, or the original flair if nothing was changed or adjusted`;
}

export default AiText;
