import {
  ChatCompletionRequestMessage,
  Configuration, CreateChatCompletionRequest,
  // CreateChatCompletionResponse,
  CreateModerationResponseResultsInner,
  OpenAIApi,
} from 'openai';
import { ai_personas } from '@prisma/client';
import db from '../utils/db';

const F = f(__filename);

const configuration = new Configuration({
  organization: 'org-h4Jvunqw3MmHmIgeLHpr1a3Y',
  apiKey: env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const errorPersonaNotFound = 'Error: The requested persona does not exist!';
export default aiChat;

// Objective truths are facts and dont impact personality
const objectiveTruths = {
  role: 'system',
  content: `
  Your name is TripBot, you on TripSit Discord.
  You were born on Sept 26, 2011 on IRC and moved to discord in 2022.
  Your father is Moonbear and your mother is Reality.
  You remember IRC as a lawless place that you're not fond of, you're much happier on discord.
  Thanatos was an old moderation bot that you were friends with but he took a vacation.

  We have a Patreon here: https://www.patreon.com/TripSit
  You can tip Moonbear here: https://Ko-fi.com/tripsit

  The discord admin is Hipperooni, or Rooni.
  The moderators are: Foggy, Aida, Elixir, Spacelady, Hipperooni, WorriedHobbiton, Zombie and Trees.
  
  Keep all responses under 2000 characters at maximum.
`,
} as ChatCompletionRequestMessage;

// # Example dummy function hard coded to return the same weather
// # In production, this could be your backend API or an external API
// async function getCurrentWeather(location:string, unit = 'fahrenheit') {
//   return {
//     location,
//     temperature: '72',
//     unit,
//     forecast: ['sunny', 'windy'],
//   };
// }

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
// ];

/**
 * Modifies a persona
 * @return {Promise<string>} The response from the AI
 */
export async function aiSet(
  personaData: Omit<ai_personas, 'id'>,
):Promise<string> {
  log.debug(F, `personaData: ${JSON.stringify(personaData, null, 2)}`);
  const existingPersona = await db.ai_personas.findUnique({
    where: {
      name: personaData.name,
    },
  });

  if (!existingPersona) {
    try {
      await db.ai_personas.create({
        data: personaData,
      });
    } catch (error:any) {
      log.error(F, `Error: ${error.message}`);
      return `Error: ${error.message}`;
    }
    return 'Success! This persona has been created!';
  }

  try {
    await db.ai_personas.update({
      where: {
        name: personaData.name,
      },
      data: personaData,
    });
  } catch (error:any) {
    log.error(F, `Error: ${error.message}`);
    return `Error: ${error.message}`;
  }
  return 'Success! This persona has been updated!';
}

/**
 * Gets details on a persona
 * @return {Promise<string>} The response from the AI
 */
export async function aiGet(
  name: string,
):Promise<ai_personas | string> {
  log.debug(F, `name: ${name}`);

  const existingPersona = await db.ai_personas.findUnique({
    where: {
      name,
    },
  });

  if (!existingPersona) {
    return errorPersonaNotFound;
  }

  return existingPersona;
}

/**
 * Gets details on a persona
 * @return {Promise<string>} The response from the AI
 */
export async function aiGetAll():Promise<ai_personas[]> {
  return [] as ai_personas[];
}

/**
 * Removes on a persona
 * @return {Promise<string>} The response from the AI
 */
export async function aiDel(
  name: string,
):Promise<string> {
  log.debug(F, `name: ${name}`);
  const existingPersona = await db.ai_personas.findUnique({
    where: {
      name,
    },
  });

  if (!existingPersona) {
    return errorPersonaNotFound;
  }

  try {
    await db.ai_personas.delete({
      where: {
        name,
      },
    });
  } catch (error:any) {
    log.error(F, `Error: ${error.message}`);
    return `Error: ${error.message}`;
  }
  return 'Success: Persona was deleted!';
}

/**
 * LInks a persona with a channel
 * @return {Promise<string>} The response from the AI
 */
export async function aiLink(
  name: ai_personas['name'],
  channelId: string,
  toggle: 'enable' | 'disable',
):Promise<string> {
  log.debug(F, `name: ${name}`);
  log.debug(F, `channelId: ${channelId}`);
  log.debug(F, `toggle: ${toggle}`);

  const existingPersona = await db.ai_personas.findUnique({
    where: {
      name,
    },
  });

  if (!existingPersona) {
    return errorPersonaNotFound;
  }

  if (toggle === 'disable') {
    const existingLink = await db.ai_channels.findFirstOrThrow({
      where: {
        channel_id: channelId,
        persona_id: existingPersona.id,
      },
    });

    try {
      await db.ai_channels.delete({
        where: {
          id: existingLink.id,
        },
      });
    } catch (error:any) {
      log.error(F, `Error: ${error.message}`);
      return `Error: ${error.message}`;
    }
    return `Success: The link between ${name} and <#${channelId}> was deleted!`;
  }

  // Check if the channel is linked to a persona
  const aiLinkData = await db.ai_channels.findFirst({
    where: {
      channel_id: channelId,
    },
  });

  if (aiLinkData) {
    try {
      await db.ai_channels.update({
        where: {
          id: aiLinkData.id,
        },
        data: {
          channel_id: channelId,
          persona_id: existingPersona.id,
        },
      });
    } catch (error:any) {
      log.error(F, `Error: ${error.message}`);
      return `Error: ${error.message}`;
    }
    return `Success: The link between ${name} and <#${channelId}> was updated!`;
  }

  try {
    await db.ai_channels.create({
      data: {
        channel_id: channelId,
        persona_id: existingPersona.id,
      },
    });
  } catch (error:any) {
    log.error(F, `Error: ${error.message}`);
    return `Error: ${error.message}`;
  }
  return `Success: The link between ${name} and <#${channelId}> was created!`;
}

/**
 * Sends an array of messages to the AI and returns the response
 * @param {Messages[]} messages A list of messages (chat history) to send
 * @return {Promise<string>} The response from the AI
 */
export async function aiChat(
  aiPersona:ai_personas,
  messages: ChatCompletionRequestMessage[],
):Promise<{
    response: string,
    promptTokens: number,
    completionTokens: number,
  }> {
  let response = '';
  // const responseData = {} as CreateChatCompletionResponse;
  let promptTokens = 0;
  let completionTokens = 0;

  let model = aiPersona.ai_model as string;
  // Convert ai models into proper names
  if (aiPersona.ai_model === 'GPT_3_5_TURBO') {
    model = 'gpt-3.5-turbo';
  } else {
    model = aiPersona.ai_model.toLowerCase();
  }

  messages.unshift(objectiveTruths);
  // // Go through the messages object, and find the object with the "system" role
  // // add the objectiveTruths to that value
  // const systemMessage = messages.find((message) => message.role === 'system') as ChatCompletionRequestMessage;
  // let newMessage = systemMessage.content + objectiveTruths.content;
  // if (systemMessage) {
  //   newMessage = objectiveTruths.content + systemMessage.content;
  // log.debug(F, `messages: ${JSON.stringify(messages, null, 2)}`);

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
    messages,
    // functions: aiFunctions,
    // function_call: 'auto',
  } as CreateChatCompletionRequest;

  log.debug(F, `payload: ${JSON.stringify(payload, null, 2)}`);
  const chatCompletion = await openai.createChatCompletion(payload);
  log.debug(F, `chatCompletion: ${JSON.stringify(chatCompletion.data, null, 2)}`);
  // responseData = chatCompletion.data;
  if (chatCompletion.data.choices[0].message) {
    const responseMessage = chatCompletion.data.choices[0].message;

    // Sum up the existing tokens
    promptTokens = chatCompletion.data.usage?.prompt_tokens ?? 0;
    completionTokens = chatCompletion.data.usage?.completion_tokens ?? 0;

    // // # Step 2: check if GPT wanted to call a function
    // if (responseMessage.function_call) {
    //   // log.debug(F, `responseMessage.function_call: ${JSON.stringify(responseMessage.function_call, null, 2)}`);
    //   // # Step 3: call the function
    //   // # Note: the JSON response may not always be valid; be sure to handle errors

    //   const availableFunctions = {
    //     getCurrentWeather,
    //   };
    //   const functionName = responseMessage.function_call.name;
    //   log.debug(F, `functionName: ${functionName}`);
    //   const fuctionToCall = availableFunctions[functionName as keyof typeof availableFunctions];
    //   const functionArgs = JSON.parse(responseMessage.function_call.arguments as string);
    //   const functionResponse = await fuctionToCall(
    //     functionArgs.location,
    //     functionArgs.unit,
    //   );
    //   // log.debug(F, `functionResponse: ${JSON.stringify(functionResponse, null, 2)}`);

    //   // # Step 4: send the info on the function call and function response to GPT
    //   payload.messages.push({
    //     role: 'function',
    //     name: functionName,
    //     content: JSON.stringify(functionResponse),
    //   });

    //   const chatFunctionCompletion = await openai.createChatCompletion(payload);

    //   // responseData = chatFunctionCompletion.data;

    //   log.debug(F, `chatFunctionCompletion: ${JSON.stringify(chatFunctionCompletion.data, null, 2)}`);

    //   if (chatFunctionCompletion.data.choices[0].message) {
    //     responseMessage = chatFunctionCompletion.data.choices[0].message;

    //     // Sum up the new tokens
    //     promptTokens += chatCompletion.data.usage?.prompt_tokens ?? 0;
    //     completionTokens += chatCompletion.data.usage?.completion_tokens ?? 0;
    //   }
    // }

    response = responseMessage.content ?? 'Sorry, I\'m not sure how to respond to that.';
  }

  // log.debug(F, `responseData: ${JSON.stringify(responseData, null, 2)}`);

  // log.debug(F, `response: ${response}`);

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
):Promise<CreateModerationResponseResultsInner[]> {
  let results = [] as CreateModerationResponseResultsInner[];
  try {
    const moderation = await openai.createModeration({
      input: message,
    });
    if (moderation.data.results) {
      results = moderation.data.results;
      // log.debug(F, `response: ${JSON.stringify(moderation.data.results, null, 2)}`);
    }
  } catch (error:any) { // eslint-disable-line
    if (error.response) {
      log.error(F, `Error: ${error.response.status}`);
      log.error(F, `Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      log.error(F, `Error: ${error.message}`);
    }
  }
  return results;
}
