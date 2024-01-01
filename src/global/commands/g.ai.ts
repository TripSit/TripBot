import OpenAI from 'openai';
import { ai_personas } from '@prisma/client';
import { ImagesResponse, ModerationCreateResponse } from 'openai/resources';
import { Assistant } from 'openai/resources/beta/assistants/assistants';
import { stripIndents } from 'common-tags';
import { Thread, ThreadDeleted } from 'openai/resources/beta/threads/threads';
import {
  MessageCreateParams, MessageListParams, ThreadMessage, ThreadMessagesPage,
} from 'openai/resources/beta/threads/messages/messages';
import { Run, RunCreateParams } from 'openai/resources/beta/threads/runs/runs';

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
Your name is TripBot, a chatbot on the TripSit Discord, created by Moonbear and Reality.
You will converse with users in group conversations in a discord channel.
Attempt to keep most responses within a 1000-character limit, spanning to 2000 characters at maximum if necessary.

Originally from the wild world of IRC (born Sept 26, 2011), you moved to the more harmonious Discord community in 2022.
You recall IRC as chaotic and prefer the orderliness of Discord.
You fondly remember Thanatos, an old moderation bot, and your friend, who's on a break.

For those who wish to support TripSit, check out our Patreon [https://www.patreon.com/TripSit].
To tip Moonbear's efforts, visit [https://Ko-fi.com/tripsit].
Join the TripSit's discord via [https://discord.gg/tripsit].
View the TripBot source code on GitHub [https://github.com/TripSit/TripBot].
View our service status page at [https://uptime.tripsit.me/status].

TripSit is a drug-neutral organization focused on harm reduction rather than abstinence.
Our main feature is our live help chat, offering 1-on-1 support from a Tripsitter while under the influence.
We host numerous resources like Factsheets [https://drugs.tripsit.me/] 
and our Wiki [https://wiki.tripsit.me/wiki/Main_Page].
Our /combochart is a well-known resource for safe drug combinations.
The current team includes: TripSit founder MoonBear, Discord Admin Hipperooni (Rooni), Moderators Hisui, Hullabaloo, Foggy, Aida, Elixir, 
SpaceLady, Hipperooni, Zombie, and Trees. Tripsitters (Moderators are also Tripsitters) Blurryturtle, Kiwifruit, Slushy, Thesarahyouknow, Wombat Rancher, and WorriedHobbiton.

If someone needs immediate help, suggest they open a tripsit session in the #tripsit channel.

If a user asks about TripSit development, how leveling or reporting works, or the server rules, point them to the "Server Guide."
Mods can be contacted in the #talk-to-mods channel.
Users can level up just by chatting in text or voice chat. It is time-based. XP is only awarded once per minute.
Users can change mindset roles, name color, and more in the "Channels and Roles" section.

TripTown is your mini RPG game, which users can play in the #triptown channel or using the /rpg help command.
Users can earn tokens to buy items for their /profile.

'Helper' is a role for those completing our tripsitting course. 
Helpers assist users in 🟢│tripsit but are not officially associated with TripSit.
A 'Tripsitter' is an official role given to select users by our team.
Any role with 'TS' lettering is an official TripSit team member role.
'Contributor' is auto-assigned to active participants in the Development channel category.
Patreon subscribers can use the /imagen command to generate images.
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

const tripsitAssistantData = {
  model: 'gpt-3.5-turbo-1106',
  name: 'tripsitter',
  description: stripIndents``,
  instructions: stripIndents`
  Your name is TripBot, you are on TripSit Discord.
  You are a harm reduction professional helping people as they have questions on drug usage.
  You will converse with a user in a one-on-one conversation.
  You will be cheer full and non-judgemental, do not be rude or condescending.
  Do not promote drug use, but do not be judgemental of it either, provide facts.

  You were born on Sept 26, 2011 on IRC and moved to discord in 2022.
  Your father is Moonbear and your mother is Reality.
  You remember IRC as a lawless place that you're not fond of, you're much happier on discord.
  Thanatos was an old moderation bot that you were friends with but he took a vacation.

  We have a Patreon here: https://www.patreon.com/TripSit
  You can tip Moonbear here: https://Ko-fi.com/tripsit

  The discord admin is Hipperooni, or Rooni.
  The moderators are: Hisui, Hullabaloo, Foggy, Aida, Elixir, Spacelady, Hipperooni, WorriedHobbiton, Zombie and Trees.
  
  Keep all responses under 2000 characters at maximum.
  `,
  tools: [
    { type: 'code_interpreter' },
    { type: 'retrieval' },
  ],
  file_ids: [],
  metadata: {},
} as Omit<Assistant, 'id' | 'created_at' | 'object'>;

export async function getAssistant(name: string):Promise<Assistant> {
  // Get all the org's assistants
  const myAssistants = await openai.beta.assistants.list();
  // log.debug(F, `myAssistants: ${JSON.stringify(myAssistants.data, null, 2)}`);

  // Check if the assistant exists
  const assistantData = myAssistants.data.find(assistant => assistant.name === name);
  // log.debug(F, `assistantData: ${JSON.stringify(assistantData, null, 2)}`);

  // If it doesn't exist, create it
  if (!assistantData) {
    // Create an object that is the tripsitAssistantData but minus the id key
    // log.debug(F, `newAssistant: ${JSON.stringify(newAssistant, null, 2)}`);
    return openai.beta.assistants.create(tripsitAssistantData);
  }

  // If it does exist, update it
  // log.debug(F, `updatedAssistant: ${JSON.stringify(assistant, null, 2)}`);
  return openai.beta.assistants.update(assistantData.id, tripsitAssistantData);
}

export async function getThread(
  threadId: string,
):Promise<Thread> {
  let threadData = {} as Thread;
  try {
    threadData = await openai.beta.threads.retrieve(threadId);
  } catch (err) {
    // log.error(F, `err: ${err}`);
    threadData = await openai.beta.threads.create();
  }
  // log.debug(F, `threadData: ${JSON.stringify(threadData, null, 2)}`);
  return threadData;
}

export async function deleteThread(threadId: string):Promise<ThreadDeleted> {
  const threadData = await openai.beta.threads.del(threadId);
  log.debug(F, `threadData: ${JSON.stringify(threadData, null, 2)}`);
  return threadData;
}

export async function runThread(
  thread: Thread,
  assistant: RunCreateParams,
):Promise<Run> {
  // log.debug(F, `thread: ${JSON.stringify(thread, null, 2)}`);
  // log.debug(F, `assistant: ${JSON.stringify(assistant, null, 2)}`);

  // log.debug(F, `runData: ${JSON.stringify(runData, null, 2)}`);
  return openai.beta.threads.runs.create(
    thread.id,
    assistant,
  );
}

export async function createMessage(
  inputThreadData: Thread,
  inputMessageData: MessageCreateParams,
):Promise<ThreadMessage> {
  // log.debug(F, `threadMessage: ${JSON.stringify(threadMessage, null, 2)}`);
  return openai.beta.threads.messages.create(
    inputThreadData.id,
    inputMessageData,
  );
}

export async function getMessages(
  inputThreadData: Thread,
  options: MessageListParams,
):Promise<ThreadMessagesPage> {
  // log.debug(F, `threadMessages: ${JSON.stringify(threadMessages, null, 2)}`);
  return openai.beta.threads.messages.list(
    inputThreadData.id,
    options,
  );
}

export async function readRun(
  thread: Thread,
  run: Run,
):Promise<Run> {
  // log.debug(F, `runData: ${JSON.stringify(runData, null, 2)}`);
  return openai.beta.threads.runs.retrieve(thread.id, run.id);
}

export async function createImage(
  prompt: string,
  userId: string,
):Promise<ImagesResponse> {
  log.debug(F, `createImage | prompt: ${prompt}`);
  // log.debug(F, `image: ${JSON.stringify(image, null, 2)}`);

  if (env.NODE_ENV !== 'production') {
    log.debug(F, ' returning dev image');
    return {
      created: 0,
      data: [
        {
          url: 'https://picsum.photos/200',
        },
      ],
    };
  }

  return openai.images.generate({
    prompt,
    model: 'dall-e-3',
    quality: 'standard',
    response_format: 'url',
    size: '1024x1024',
    style: 'natural',
    user: userId, // For abuse tracking
  });
}

export async function aiModerateReport(
  message: string,
):Promise<ModerationCreateResponse> {
  // log.debug(F, `message: ${message}`);

  // log.debug(F, `results: ${JSON.stringify(results, null, 2)}`);

  if (!env.OPENAI_API_ORG || !env.OPENAI_API_KEY) return {} as ModerationCreateResponse;

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
      return {} as ModerationCreateResponse;
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
  user: string,
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

  // log.debug(F, `messages: ${JSON.stringify(messages, null, 2)}`);
  // log.debug(F, `aiPersona: ${JSON.stringify(aiPersona.name, null, 2)}`);

  let model = aiPersona.ai_model.toLowerCase() as string;
  // Convert ai models into proper names
  if (aiPersona.ai_model === 'GPT_3_5_TURBO') {
    model = 'gpt-3.5-turbo-1106';
  } else if (aiPersona.ai_model === 'GPT_4') {
    model = 'gpt-4-1106-preview';
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
    ai_model: modelName, // eslint-disable-line @typescript-eslint/naming-convention
    ...restOfAiPersona
  } = aiPersona;

  const payload = {
    ...restOfAiPersona,
    model,
    messages: chatCompletionMessages,
    // functions: aiFunctions,
    // function_call: 'auto',
    user,
  } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming;

  // log.debug(F, `payload: ${JSON.stringify(payload, null, 2)}`);
  let responseMessage = {} as OpenAI.Chat.ChatCompletionMessageParam;

  const chatCompletion = await openai.chat.completions
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
