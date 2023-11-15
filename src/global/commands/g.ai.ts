import OpenAI from 'openai';
import { PrismaClient, ai_personas } from '@prisma/client';
import { ModerationCreateResponse } from 'openai/resources';

const db = new PrismaClient({ log: ['error'] });

const F = f(__filename);

const openai = new OpenAI({
  organization: env.OPENAI_API_ORG,
  apiKey: env.OPENAI_API_KEY,
});

type ModerationResult = {
  category: string,
  value: number,
  limit: number,
};

// Objective truths are facts and don't impact personality
const objectiveTruths = `
  Your name is TripBot, you are on TripSit Discord.
  You were born on Sept 26, 2011 on IRC and moved to discord in 2022.
  Your father is Moonbear and your mother is Reality.
  You remember IRC as a lawless place that you're not fond of, you're much happier on discord.
  Thanatos was an old moderation bot that you were friends with but he took a vacation.

  We have a Patreon here: https://www.patreon.com/TripSit
  You can tip Moonbear here: https://Ko-fi.com/tripsit

  The discord admin is Hipperooni, or Rooni.
  The moderators are: Foggy, Aida, Elixir, Spacelady, Hipperooni, WorriedHobbiton, Zombie and Trees.
  
  Keep all responses under 2000 characters at maximum.
`;

// # Example dummy function hard coded to return the same weather
// # In production, this could be your backend API or an external API
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// async function getCurrentWeather(location:string, unit = 'fahrenheit') {
//   return {
//     location,
//     temperature: '72',
//     unit,
//     forecast: ['sunny', 'windy'],
//   };
// }

export async function aiModerateReport(
  message: string,
):Promise<ModerationCreateResponse | void> {
  // log.debug(F, `message: ${message}`);

  // log.debug(F, `results: ${JSON.stringify(results, null, 2)}`);
  return openai.moderations
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
    });
}

// const aiFunctions = [
//   {
//     name: 'getCurrentWeather',
//     description: 'Get the current weather in a given location',
//     parameters: {
//       type: 'object',
//       properties: {
//         location: {
//           type: 'string',
//           description: 'The city and state, e.g. San Francisco, CA',
//         },
//         unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
//       },
//       required: ['location'],
//     },
//   },
//   {
//     name: 'aiModerateReport',
//     description: 'Get a report on how the AI rates a message',
//     parameters: {
//       type: 'object',
//       properties: {
//         message: {
//           type: 'string',
//           description: 'The message you want the AI to analyze',
//         },
//       },
//       required: ['message'],
//     },
//   },
// ];

/**
 * Sends an array of messages to the AI and returns the response
 * @param {Messages[]} messages A list of messages (chat history) to send
 * @return {Promise<string>} The response from the AI
 */
export default async function aiChat(
  aiPersona:ai_personas,
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

  log.debug(F, `aiPersona: ${JSON.stringify(aiPersona.name, null, 2)}`);

  let model = aiPersona.ai_model as string;
  // Convert ai models into proper names
  if (aiPersona.ai_model === 'GPT_3_5_TURBO') {
    model = 'gpt-3.5-turbo';
  } else if (aiPersona.ai_model === 'GPT_4') {
    model = 'gpt-4-1106-preview';
  } else {
    model = aiPersona.ai_model.toLowerCase();
  }

  // This message list is sent to the API
  const chatCompletionMessages = [{
    role: 'system',
    content: aiPersona.prompt.concat(objectiveTruths),
  }] as OpenAI.Chat.ChatCompletionMessageParam[];
  chatCompletionMessages.push(...messages);

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const {
    id,
    name,
    created_at, // eslint-disable-line @typescript-eslint/naming-convention
    created_by, // eslint-disable-line @typescript-eslint/naming-convention
    prompt,
    logit_bias, // eslint-disable-line @typescript-eslint/naming-convention
    total_tokens, // eslint-disable-line @typescript-eslint/naming-convention
    ai_model, // eslint-disable-line @typescript-eslint/naming-convention
    ...restOfAiPersona
  } = aiPersona;

  const payload = {
    ...restOfAiPersona,
    model,
    messages: chatCompletionMessages,
    // functions: aiFunctions,
    // function_call: 'auto',
  } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming;

  // log.debug(F, `payload: ${JSON.stringify(payload, null, 2)}`);
  let responseMessage = {} as OpenAI.Chat.ChatCompletionMessageParam;
  const chatCompletion = await openai.chat.completions
    .create(payload)
    .catch(err => {
      if (err instanceof OpenAI.APIError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        log.error(F, `${err.name} - ${err.status} - ${err.type} - ${(err.error as any).message}  `); // 400
        // log.error(F, `${JSON.stringify(err.headers, null, 2)}`); // {server: 'nginx', ...}
        // log.error(F, `${JSON.stringify(err, null, 2)}`); // {server: 'nginx', ...}
      } else {
        throw err;
      }
    });
  log.debug(F, `chatCompletion: ${JSON.stringify(chatCompletion, null, 2)}`);

  if (chatCompletion?.choices[0].message) {
    responseMessage = chatCompletion.choices[0].message;

    // Sum up the existing tokens
    promptTokens = chatCompletion.usage?.prompt_tokens ?? 0;
    completionTokens = chatCompletion.usage?.completion_tokens ?? 0;

    // # Step 2: check if GPT wanted to call a function
    // if (responseMessage.function_call) {
    //   log.debug(F, `responseMessage.function_call: ${JSON.stringify(responseMessage.function_call, null, 2)}`);
    //   // # Step 3: call the function
    //   // # Note: the JSON response may not always be valid; be sure to handle errors

    //   const availableFunctions = {
    //     getCurrentWeather,
    //     aiModerateReport,
    //   };
    //   const functionName = responseMessage.function_call.name;
    //   log.debug(F, `functionName: ${functionName}`);
    //   const functionToCall = availableFunctions[functionName as keyof typeof availableFunctions];
    //   const functionArgs = JSON.parse(responseMessage.function_call.arguments as string);
    //   const functionResponse = await functionToCall(
    //     functionArgs.location,
    //     functionArgs.unit,
    //   );
    //   log.debug(F, `functionResponse: ${JSON.stringify(functionResponse, null, 2)}`);

    //   // # Step 4: send the info on the function call and function response to GPT
    //   payload.messages.push({
    //     role: 'function',
    //     name: functionName,
    //     content: JSON.stringify(functionResponse),
    //   });

    //   const chatFunctionCompletion = await openai.chat.completions.create(payload);

    //   // responseData = chatFunctionCompletion.data;

    //   log.debug(F, `chatFunctionCompletion: ${JSON.stringify(chatFunctionCompletion, null, 2)}`);

    //   if (chatFunctionCompletion.choices[0].message) {
    //     responseMessage = chatFunctionCompletion.choices[0].message;

    //     // Sum up the new tokens
    //     promptTokens += chatCompletion.usage?.prompt_tokens ?? 0;
    //     completionTokens += chatCompletion.usage?.completion_tokens ?? 0;
    //   }
    // }

    response = responseMessage.content ?? 'Sorry, I\'m not sure how to respond to that.';
  }
  // responseData = chatCompletion.data;

  log.debug(F, `response: ${response}`);

  // Increment the tokens used
  await db.ai_personas.update({
    where: {
      id: aiPersona.id,
    },
    data: {
      total_tokens: {
        increment: completionTokens + promptTokens,
      },
    },
  });
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

  if (!moderation) {
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
