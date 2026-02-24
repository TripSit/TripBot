/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import OpenAI from 'openai';
import { ModerationCreateResponse } from 'openai/resources';

const F = f(__filename);

const openAi = new OpenAI({
  organization: env.OPENAI_API_ORG,
  apiKey: env.OPENAI_API_KEY,
});

type ModerationResult = {
  category: string,
  value: number,
  limit: number,
};
export async function aiModerateReport(
  message: string,
):Promise<ModerationCreateResponse> {
  // log.debug(F, `message: ${message}`);

  // log.debug(F, `results: ${JSON.stringify(results, null, 2)}`);

  if (!env.OPENAI_API_ORG || !env.OPENAI_API_KEY) return {} as ModerationCreateResponse;

  return openAi.moderations
    .create({
      input: message,
    })
    .catch(err => {
      if (err instanceof OpenAI.APIError) {
        log.error(F, `${err.status}`); // 400
        log.error(F, `${err.name}`); // BadRequestError
        log.error(F, `${err.headers}`); // {server: 'nginx', ...}
      } else {
        throw err;
      }
      return {} as ModerationCreateResponse;
    });
}

export async function aiFlairMod(
  messages: OpenAI.Chat.ChatCompletionMessageParam [],
):Promise<{
    response: string,
    promptTokens: number,
    completionTokens: number,
  }> {
  let response = '';
  // const responseData = {} as CreateChatCompletionResponse;
  let promptTokens = 0;
  let completionTokens = 0;
  if (!env.OPENAI_API_ORG || !env.OPENAI_API_KEY) return { response, promptTokens, completionTokens };

  const model = 'gpt-4.1-mini'.toLowerCase();

  // This message list is sent to the API
  const chatCompletionMessages = [{
    role: 'system',
    content: `You are acting as a moderation API. You will receive an input that a user wants to set as their user flair text.

    Drug references and jokes and adult humour are allowed as long as they are not extremely vulgur or offensive. You can swap any very rude words with more PG rated family friendly ones. If there are no alternative words, reject the flair.
    
    After that, adjust it to correct spelling, grammar and such. Made up words are allowed unless they are obvious misspellings, but no random keyboard gibberish (EG. ALRJRBSIEIR)
    
    IMPORTANT! You must correct capitalisation so that the flair fits headline capitalisation rules (every word should be capitalised except short words like "i love going to the supermarket" becomes "I Love Going to the Supermarket")
    
    You must reply with this strict format:
    Status: Approved, Adjusted, Rejected
    Reason: Spelling, grammar, etc
    Adjusted: The new edited flair, or the original flair if nothing was changed or adjusted`.concat(''),
  }] as OpenAI.Chat.ChatCompletionMessageParam[];
  chatCompletionMessages.push(...messages);

  const payload = {
    temperature: 0.7,
    top_p: 1,
    presence_penalty: 0,
    frequency_penalty: 0,
    logit_bias: {},
    max_tokens: 500,
    model,
    messages: chatCompletionMessages,
    // functions: aiFunctions,
    // function_call: 'auto',
  } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming;

  // log.debug(F, `payload: ${JSON.stringify(payload, null, 2)}`);
  let responseMessage = {} as OpenAI.Chat.ChatCompletionMessageParam;

  const chatCompletion = await openAi.chat.completions
    .create(payload)
    .catch(err => {
      if (err instanceof OpenAI.APIError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        log.error(F, `${err.name} - ${err.status} - ${err.type} - ${(err.error as any).message}  `); // 400
        // log.error  (F, `${JSON.stringify(err.headers, null, 2)}`); // {server: 'nginx', ...}
        // log.error(F, `${JSON.stringify(err, null, 2)}`); // {server: 'nginx', ...}
      } else {
        throw err;
      }
    });
  // log.debug(F, `chatCompletion: ${JSON.stringify(chatCompletion, null, 2)}`);

  if (chatCompletion?.choices[0].message) {
    responseMessage = chatCompletion.choices[0].message;

    // Sum up the existing tokens
    promptTokens = chatCompletion.usage?.prompt_tokens ?? 0;
    completionTokens = chatCompletion.usage?.completion_tokens ?? 0;

    response = responseMessage.content?.toString() ?? 'Sorry, I\'m not sure how to respond to that.';
  }

  // log.debug(F, `response: ${response}`);

  return { response, promptTokens, completionTokens };
}

/**
 * Sends a message to the moderation AI and returns the response
 * @param {Message} message The interaction that spawned this commend
 * @return {Promise<string>} The response from the AI
 */
export async function aiModerate(
  message: string,
  guildId: string,
):Promise<ModerationResult[]> {
  const moderation = await aiModerateReport(message);

  if (!moderation?.results) {
    return [];
  }

  // log.debug(F, `moderation: ${JSON.stringify(moderation, null, 2)}`);

  const guildData = await db.discord_guilds.upsert({
    where: {
      id: guildId,
    },
    create: {
      id: guildId,
    },
    update: {},
  });

  const guildModeration = await db.ai_moderation.upsert({
    where: {
      guild_id: guildData.id,
    },
    create: {
      guild_id: guildData.id,
    },
    update: {},
  });

  // log.debug(F, `guildModeration: ${JSON.stringify(guildModeration, null, 2)}`);

  // Go through each key in moderation.results and check if the value is greater than the limit from guildModeration
  // If it is, set a flag with the kind of alert and the value / limit
  const moderationAlerts = [] as ModerationResult[];
  Object.entries(moderation.results[0].category_scores).forEach(([key, value]) => {
    const formattedKey = key
      .replace('/', '_')
      .replace('-', '_');
    const guildLimit = guildModeration[formattedKey as keyof typeof guildModeration] as number;

    if (value > guildLimit) {
      // log.debug(F, `key: ${formattedKey} value > ${value} / ${guildLimit} < guild limit`);
      moderationAlerts.push({
        category: key,
        value,
        limit: (guildModeration[formattedKey as keyof typeof guildModeration] as number),
      });
    }
  });

  // log.debug(F, `moderationAlerts: ${JSON.stringify(moderationAlerts, null, 2)}`);

  return moderationAlerts;
}

export async function aiTranslate(
  target_language: string,
  messages: OpenAI.Chat.ChatCompletionMessageParam [],
):Promise<{
    response: string,
    promptTokens: number,
    completionTokens: number,
  }> {
  let response = '';
  let promptTokens = 0;
  let completionTokens = 0;
  if (!env.OPENAI_API_ORG || !env.OPENAI_API_KEY) return { response, promptTokens, completionTokens };

  const model = 'gpt-4.1-mini';
  const chatCompletionMessages = [{
    role: 'system',
    content: `You will translate whatever the user sends to their desired language. Their desired language or language code is: ${target_language}.`,
  }] as OpenAI.Chat.ChatCompletionMessageParam[];
  chatCompletionMessages.push(...messages);

  const payload = {
    model,
    messages: chatCompletionMessages,
  } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming;

  // log.debug(F, `payload: ${JSON.stringify(payload, null, 2)}`);
  let responseMessage = {} as OpenAI.Chat.ChatCompletionMessageParam;

  const chatCompletion = await openAi.chat.completions
    .create(payload)
    .catch(err => {
      if (err instanceof OpenAI.APIError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        log.error(F, `${err.name} - ${err.status} - ${err.type} - ${(err.error as any).message}  `); // 400
        // log.error  (F, `${JSON.stringify(err.headers, null, 2)}`); // {server: 'nginx', ...}
        // log.error(F, `${JSON.stringify(err, null, 2)}`); // {server: 'nginx', ...}
      } else {
        throw err;
      }
    });
  // log.debug(F, `chatCompletion: ${JSON.stringify(chatCompletion, null, 2)}`);

  if (chatCompletion?.choices[0].message) {
    responseMessage = chatCompletion.choices[0].message;

    // Sum up the existing tokens
    promptTokens = chatCompletion.usage?.prompt_tokens ?? 0;
    completionTokens = chatCompletion.usage?.completion_tokens ?? 0;

    response = responseMessage.content?.toString() ?? 'Sorry, I\'m not sure how to respond to that.';
  }

  // log.debug(F, `response: ${response}`);

  return { response, promptTokens, completionTokens };
}
