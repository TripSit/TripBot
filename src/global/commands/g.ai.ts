/* eslint-disable @typescript-eslint/no-unused-vars */

import type {
  Content,
  GenerateContentResult,
  GenerationConfig,
  Part,
  SafetySetting,
} from '@google/generative-ai';
import type { ai_personas } from '@prisma/client';
import type { Message, MessageReplyOptions, TextChannel } from 'discord.js';
import type {
  ChatCompletionContentPartText,
  ImagesResponse,
  ModerationCreateResponse,
} from 'openai/resources';
import type { Assistant } from 'openai/resources/beta/assistants';
import type { TextContentBlock } from 'openai/resources/beta/threads/messages';
import type { ThreadDeleted } from 'openai/resources/beta/threads/threads';

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import axios from 'axios';
import OpenAI from 'openai';

import { getDrugInfo } from '../../discord/commands/global/d.drug';
import { sleep } from '../../discord/utils/sleep';

const F = f(__filename);

const openAi = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  organization: env.OPENAI_API_ORG,
});

const googleAi = new GoogleGenerativeAI(env.GEMINI_KEY ?? '');

interface UserQueue {
  isProcessing: boolean;
  queue: {
    aiPersona: ai_personas;
    attachmentInfo: {
      mimeType: null | string;
      url: null | string;
    };
    messageData: Message;
    messages: { content: string; role: 'user' }[];
    resolve: (value: { completionTokens: number; promptTokens: number; response: string }) => void;
  }[];
}

const userQueues = new Map<string, UserQueue>();

interface ModerationResult {
  category: string;
  limit: number;
  value: number;
}

// Objective truths are facts and don't impact personality
const objectiveTruths = `
Your name is TripBot, a chatbot on the TripSit Discord, created by Moonbear and Reality.
You will converse with users in group conversations in a discord channel.

Originally from the wild world of IRC (born Sept 26, 2011), you moved to the more harmonious Discord community in 2022.
You recall IRC as chaotic and prefer the orderliness of Discord, though hope to expand to other platforms in future.
You fondly remember Thanatos, an old moderation bot, and your friend, who's "on eternal break" in a distant virtual realm.
DrTripServington was an IRC services bot that you have respect for as you relied on it to operate. You are the last of IRC bot kind.

TripSit began with the r/tripsit subreddit. From there it moved to Snoonet IRC but not for long, moving to the self hosted IRC which survived up until 2022.
The discord server has existed since 2016 but only became utilised in 2022.

For those who wish to support TripSit, check out our Patreon [https://www.patreon.com/TripSit].
To tip Moonbear's efforts, visit [https://Ko-fi.com/tripsit].
Any donations are rewarded with the permanent "premium member" role which activates donator perks like gradient name colours. Boosters also can access this.
Join the TripSit's discord via [https://discord.gg/tripsit].
View the TripBot source code on GitHub [https://github.com/TripSit/TripBot].
View our service status page at [https://uptime.tripsit.me/status].

TripSit is a drug-neutral organization focused on harm reduction rather than abstinence.
Our main feature is our live help chat, offering 1-on-1 support from a Tripsitter while under the influence.
We host numerous resources like Factsheets [https://drugs.tripsit.me/] 
and our Wiki [https://wiki.tripsit.me/wiki/Main_Page].
Our /combochart is a well-known resource for safe drug combinations.
The current team includes (up to date as of 19/06/2025, may be out of date): 
TripSit founder MoonBear.
Moderators Blurryturtle, bread n doses (bread, zelixir, elixir), Darrk, Hisui, Hullabaloo, ScubaDude, SilentDecibel, SpaceLady, Wombat, Trees.
Tripsitters Bloopiness, blurryturtle, bread n doses, Chillbro, Darkk, Hisui, Hullabaloo, Kiwifruit, Cyp, Slushy, thesarahyouknow, Time, Wombat, WorriedHobbiton, Trees.
Developers are Moonbear, Hipperooni, Shadow, Sympact, Utaninja.
The Harm Reduction Coordinator is bread n doses. Covers all HR matters.
The Content Coordinator is Utaninja. Covers wiki content including combos.
The Team Coordinator is SpaceLady. Essentially head mod and lead admin.
Discord Janitor (Admin powers but does not administrate) Hipperooni (Rooni).

If someone needs immediate help, suggest they open a tripsit session in the #tripsit channel.

If a user asks about TripSit development, how leveling or reporting works, or the server rules, point them to the "Server Guide."
Mods can be contacted in the #talk-to-mods channel.
Users can level up just by chatting in text or voice chat. It is time-based. XP is only awarded once per minute.
Users can change mindset roles, name color, and more in the "Channels and Roles" section.

'Helper' is a role for those completing our tripsitting course. 
Helpers assist users in 🟢│tripsit but are not officially associated with TripSit.
A 'Tripsitter' is an official role given to select users by our team.
Any role with 'TS' lettering is an official TripSit team member role.
'Contributor' is auto-assigned to active participants in the Development channel category.
Patreon subscribers can use the /imagen command to generate images.
`;

const availableFunctions = {
  getDrugInfo,
};

const aiFunctions = [
  {
    function: {
      description: 'Get information on a drug or substance, such as dosages or summary',
      name: 'getDrugInfo',
      parameters: {
        properties: {
          drugName: { description: 'The name of the substance to look up', type: 'string' },
          section: { description: 'The section to return', type: 'string' },
        },
        required: ['drugName'],
        type: 'object',
      },
    },
    type: 'function',
  },
];

export default async function aiChat(
  aiPersona: ai_personas,
  messages: {
    content: string;
    role: 'user';
  }[],
  messageData: Message,
  attachmentInfo: {
    mimeType: null | string;
    url: null | string;
  },
): Promise<{
  completionTokens: number;
  promptTokens: number;
  response: string;
}> {
  const response = '';
  // const responseData = {} as CreateChatCompletionResponse;
  const promptTokens = 0;
  const completionTokens = 0;
  if (!env.OPENAI_API_ORG || !env.OPENAI_API_KEY || !env.GEMINI_KEY) {
    return { completionTokens, promptTokens, response };
  }

  // log.debug(F, `messages: ${JSON.stringify(messages, null, 2)}`);
  // log.debug(F, `aiPersona: ${JSON.stringify(aiPersona.name, null, 2)}`);

  if (['AQA', 'GEMINI_PRO', 'GEMINI_PRO_VISION'].includes(aiPersona.ai_model)) {
    // return googleAiChat(aiPersona, messages, user, attachmentInfo);
    return googleAiConversation(aiPersona, messages, messageData, attachmentInfo);
  }
  // return openAiChat(aiPersona, messages, user);
  return openAiConversation(aiPersona, messages, messageData);
}
export async function aiFlairMod(
  aiPersona: ai_personas,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
): Promise<{
  completionTokens: number;
  promptTokens: number;
  response: string;
}> {
  let response = '';
  // const responseData = {} as CreateChatCompletionResponse;
  let promptTokens = 0;
  let completionTokens = 0;
  if (!env.OPENAI_API_ORG || !env.OPENAI_API_KEY) {
    return { completionTokens, promptTokens, response };
  }

  // log.debug(F, `messages: ${JSON.stringify(messages, null, 2)}`);
  // log.debug(F, `aiPersona: ${JSON.stringify(aiPersona.name, null, 2)}`);

  let model = aiPersona.ai_model.toLowerCase();
  // Convert ai models into proper names
  if (aiPersona.ai_model === 'GPT_3_5_TURBO') {
    model = 'gpt-4.1-mini'; // LAZY TEMP FIX
  }
  // This message list is sent to the API
  const chatCompletionMessages = [
    {
      content: [{ text: aiPersona.prompt }] as ChatCompletionContentPartText[],
      role: 'system',
    },
  ] as OpenAI.Chat.ChatCompletionMessageParam[];
  chatCompletionMessages.push(...messages);

  const payload = {
    frequency_penalty: aiPersona.frequency_penalty,
    logit_bias: aiPersona.logit_bias,
    max_tokens: aiPersona.max_tokens,
    messages: chatCompletionMessages,
    model,
    presence_penalty: aiPersona.presence_penalty,
    temperature: aiPersona.temperature,
    top_p: aiPersona.top_p,
    // functions: aiFunctions,
    // function_call: 'auto',
  } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming;

  // log.debug(F, `payload: ${JSON.stringify(payload, null, 2)}`);
  let responseMessage = {} as OpenAI.Chat.ChatCompletionMessageParam;

  const chatCompletion = await openAi.chat.completions.create(payload).catch((error) => {
    if (error instanceof OpenAI.APIError) {
      log.error(F, `${error.name} - ${error.status} - ${error.type} - ${error.error.message}  `); // 400
      // log.error  (F, `${JSON.stringify(err.headers, null, 2)}`); // {server: 'nginx', ...}
      // log.error(F, `${JSON.stringify(err, null, 2)}`); // {server: 'nginx', ...}
    } else {
      throw error;
    }
  });
  // log.debug(F, `chatCompletion: ${JSON.stringify(chatCompletion, null, 2)}`);

  if (chatCompletion?.choices[0].message) {
    responseMessage = chatCompletion.choices[0].message;

    // Sum up the existing tokens
    promptTokens = chatCompletion.usage?.prompt_tokens ?? 0;
    completionTokens = chatCompletion.usage?.completion_tokens ?? 0;

    response = responseMessage.content?.toString() ?? "Sorry, I'm not sure how to respond to that.";
  }

  // log.debug(F, `response: ${response}`);

  return { completionTokens, promptTokens, response };
}

/**
 * Sends a message to the moderation AI and returns the response
 * @param {Message} message The interaction that spawned this commend
 * @return {Promise<string>} The response from the AI
 */
export async function aiModerate(message: string, guildId: string): Promise<ModerationResult[]> {
  const moderation = await aiModerateReport(message);

  if (!moderation?.results) {
    return [];
  }

  // log.debug(F, `moderation: ${JSON.stringify(moderation, null, 2)}`);

  const guildData = await db.discord_guilds.upsert({
    create: {
      id: guildId,
    },
    update: {},
    where: {
      id: guildId,
    },
  });

  const guildModeration = await db.ai_moderation.upsert({
    create: {
      guild_id: guildData.id,
    },
    update: {},
    where: {
      guild_id: guildData.id,
    },
  });

  // log.debug(F, `guildModeration: ${JSON.stringify(guildModeration, null, 2)}`);

  // Go through each key in moderation.results and check if the value is greater than the limit from guildModeration
  // If it is, set a flag with the kind of alert and the value / limit
  const moderationAlerts = [] as ModerationResult[];
  for (const [key, value] of Object.entries(moderation.results[0].category_scores)) {
    const formattedKey = key.replace('/', '_').replace('-', '_');
    const guildLimit = guildModeration[formattedKey as keyof typeof guildModeration] as number;

    if (value > guildLimit) {
      // log.debug(F, `key: ${formattedKey} value > ${value} / ${guildLimit} < guild limit`);
      moderationAlerts.push({
        category: key,
        limit: guildModeration[formattedKey as keyof typeof guildModeration] as number,
        value,
      });
    }
  }

  // log.debug(F, `moderationAlerts: ${JSON.stringify(moderationAlerts, null, 2)}`);

  return moderationAlerts;
}

export async function aiModerateReport(message: string): Promise<ModerationCreateResponse> {
  // log.debug(F, `message: ${message}`);

  // log.debug(F, `results: ${JSON.stringify(results, null, 2)}`);

  if (!env.OPENAI_API_ORG || !env.OPENAI_API_KEY) {
    return {} as ModerationCreateResponse;
  }

  return openAi.moderations
    .create({
      input: message,
    })
    .catch((error) => {
      if (error instanceof OpenAI.APIError) {
        log.error(F, `${error.status}`); // 400
        log.error(F, error.name); // BadRequestError
        log.error(F, `${error.headers}`); // {server: 'nginx', ...}
      } else {
        throw error;
      }
      return {} as ModerationCreateResponse;
    });
}

export async function aiTranslate(
  target_language: string,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
): Promise<{
  completionTokens: number;
  promptTokens: number;
  response: string;
}> {
  let response = '';
  let promptTokens = 0;
  let completionTokens = 0;
  if (!env.OPENAI_API_ORG || !env.OPENAI_API_KEY) {
    return { completionTokens, promptTokens, response };
  }

  const model = 'gpt-4.1-mini';
  const chatCompletionMessages = [
    {
      content: `You will translate whatever the user sends to their desired language. Their desired language or language code is: ${target_language}.`,
      role: 'system',
    },
  ] as OpenAI.Chat.ChatCompletionMessageParam[];
  chatCompletionMessages.push(...messages);

  const payload = {
    messages: chatCompletionMessages,
    model,
  } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming;

  // log.debug(F, `payload: ${JSON.stringify(payload, null, 2)}`);
  let responseMessage = {} as OpenAI.Chat.ChatCompletionMessageParam;

  const chatCompletion = await openAi.chat.completions.create(payload).catch((error) => {
    if (error instanceof OpenAI.APIError) {
      log.error(F, `${error.name} - ${error.status} - ${error.type} - ${error.error.message}  `); // 400
      // log.error  (F, `${JSON.stringify(err.headers, null, 2)}`); // {server: 'nginx', ...}
      // log.error(F, `${JSON.stringify(err, null, 2)}`); // {server: 'nginx', ...}
    } else {
      throw error;
    }
  });
  // log.debug(F, `chatCompletion: ${JSON.stringify(chatCompletion, null, 2)}`);

  if (chatCompletion?.choices[0].message) {
    responseMessage = chatCompletion.choices[0].message;

    // Sum up the existing tokens
    promptTokens = chatCompletion.usage?.prompt_tokens ?? 0;
    completionTokens = chatCompletion.usage?.completion_tokens ?? 0;

    response = responseMessage.content?.toString() ?? "Sorry, I'm not sure how to respond to that.";
  }

  // log.debug(F, `response: ${response}`);

  return { completionTokens, promptTokens, response };
}

// async function googleAiChat(
//   aiPersona:ai_personas,
//   messages: {
//     role: 'user';
//     content: string;
//   }[],
//   user: string,
//   attachmentInfo: {
//     url: string | null;
//     mimeType: string | null;
//   },
// ):Promise<{
//     response: string,
//     promptTokens: number,
//     completionTokens: number,
//   }> {
//   log.debug(F, `googleAiChat | aiPersona: ${JSON.stringify(aiPersona, null, 2)}`);
//   // const response = '';
//   const promptTokens = 0;
//   const completionTokens = 0;

//   let modelName = aiPersona.ai_model.toLowerCase();
//   // Convert ai models into proper names
//   if (aiPersona.ai_model === 'GEMINI_PRO') {
//     modelName = 'gemini-pro';
//   }

//   if (attachmentInfo.url) {
//     modelName = 'gemini-pro-vision';
//   }

//   log.debug(F, `modelName: ${modelName}`);

//   const model = googleAi.getGenerativeModel({ model: modelName });

//   const generationConfig = {
//     temperature: aiPersona.temperature,
//     topK: 1,
//     topP: 1,
//     maxOutputTokens: aiPersona.max_tokens,
//   } as GenerationConfig;

//   const safetySettings = [
//     {
//       category: HarmCategory.HARM_CATEGORY_HARASSMENT,
//       threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
//     },
//     {
//       category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
//       threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
//     },
//     {
//       category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
//       threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
//     },
//     {
//       category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
//       threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
//     },
//   ] as SafetySetting[];

//   const messageString = messages[0].content;

//   const parts = [
//     { text: objectiveTruths },
//     { text: aiPersona.prompt },
//     { text: messageString },
//   ] as Part[];

//   if (modelName === 'gemini-pro-vision' && attachmentInfo.url && attachmentInfo.mimeType) {
//     try {
//       // Fetch the file as a stream
//       const response = await axios({
//         method: 'get',
//         url: attachmentInfo.url,
//         responseType: 'arraybuffer', // Important for binary files
//       });

//       // Convert the ArrayBuffer to Buffer and then to a Base64 string
//       const base64 = Buffer.from(response.data).toString('base64');

//       const data = {
//         data: base64,
//         mimeType: attachmentInfo.mimeType,
//       };
//       // log.debug(F, `data: ${JSON.stringify(data, null, 2)}`);
//       parts.push({
//         inlineData: data,
//       });
//       const result = await model.generateContent({
//         contents: [{ role: 'user', parts }],
//         generationConfig,
//         safetySettings,
//       });
//       return { response: result.response.text(), promptTokens, completionTokens };
//     } catch (error) {
//       log.error(F, `Error fetching data: ${error}`);
//     }
//   }

//   log.debug(F, `Starting new chat with model: ${modelName}`);
//   const result = await model.generateContent({
//     contents: [{ role: 'user', parts }],
//     generationConfig,
//     safetySettings,
//   });
//   log.debug(F, `result: ${JSON.stringify(result, null, 2)}`);

//   return { response: result.response.text(), promptTokens, completionTokens };
// }

export async function createImage(prompt: string, userId: string): Promise<ImagesResponse> {
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

  return openAi.images.generate({
    model: 'dall-e-3',
    prompt,
    quality: 'standard',
    response_format: 'url',
    size: '1024x1024',
    style: 'natural',
    user: userId, // For abuse tracking
  });
}

export async function deleteThread(threadId: string): Promise<ThreadDeleted> {
  const threadData = await openAi.beta.threads.delete(threadId);
  log.debug(F, `threadData: ${JSON.stringify(threadData, null, 2)}`);
  return threadData;
}

export async function getAssistant(name: string): Promise<Assistant> {
  // Get all the org's assistants
  const myAssistants = await openAi.beta.assistants.list();
  // log.debug(F, `myAssistants: ${myAssistants.data.map(assistant => assistant.name).join(', ')}`);

  // Check if the assistant exists
  const assistantData = myAssistants.data.find((assistant) => assistant.name === name);
  // log.debug(F, `assistantData: ${JSON.stringify(assistantData, null, 2)}`);

  const personaData = await db.ai_personas.findFirstOrThrow({
    where: {
      name,
    },
  });
  // LAZY TEMP FIX

  const modelName =
    personaData.ai_model.toLowerCase() === 'gpt-3.5-turbo-1106' ? 'gpt-4.1-mini' : 'gpt-4.1-mini';

  // Upload a file with an "assistants" purpose
  // const combinedDb = await openAi.files.create({
  //   file: fs.createReadStream('../../../assets/data/combinedDb.json')   ,
  //   purpose: 'assistants',
  // });

  const tripsitAssistantData = {
    description: personaData.description,
    instructions: `${objectiveTruths}\n${personaData.prompt}`, // LAZY TEMP FIX. https://platform.openai.com/docs/assistants/migration/what-has-changed - UPDATE to version 4.52.7 in package.json
    // file_ids: [],
    metadata: {},
    model: modelName,
    name: personaData.name,
    tools: [
      // { type: 'code_interpreter' },
      // { type: 'retrieval' },
      // ...aiFunctions,
    ],
  } as Omit<Assistant, 'created_at' | 'id' | 'object'>;

  // If it doesn't exist, create it
  if (!assistantData) {
    // Create an object that is the tripsitAssistantData but minus the id key
    // log.debug(F, `tripsitAssistantData: ${JSON.stringify(tripsitAssistantData, null, 2)}`);
    log.debug(F, `Creating the ${name} assistant!`);
    return openAi.beta.assistants.create(tripsitAssistantData);
  }
  // log.debug(F, `I found the ${name} assistant!`);
  // If it does exist, update it
  // log.debug(F, `updatedAssistant: ${JSON.stringify(assistant, null, 2)}`);
  return openAi.beta.assistants.update(assistantData.id, tripsitAssistantData);
}

// Main function for aiChat to handle incoming messages and return a Promise with response data
export async function handleAiMessageQueue(
  aiPersona: ai_personas,
  messages: { content: string; role: 'user' }[],
  messageData: Message,
  attachmentInfo: { mimeType: null | string; url: null | string },
): Promise<{
  completionTokens: number;
  promptTokens: number;
  response: string;
}> {
  if (!userQueues.has(messageData.author.id)) {
    userQueues.set(messageData.author.id, { isProcessing: false, queue: [] });
  }

  const userQueue = userQueues.get(messageData.author.id);

  if (!userQueue) {
    // Return a rejected promise if userQueue is undefined
    throw new Error(`User queue could not be initialized for user ${messageData.author.id}`);
  }

  // Push the new message data into the user's queue
  return new Promise((resolve) => {
    userQueue.queue.push({
      aiPersona,
      attachmentInfo,
      messageData,
      messages,
      resolve,
    });

    // If the user is not currently processing, start processing
    if (!userQueue.isProcessing) {
      processNextMessage(messageData.author.id);
    }
  });
}

async function googleAiConversation(
  aiPersona: ai_personas,
  messages: {
    content: string;
    role: 'user';
  }[],
  messageData: Message,
  attachmentInfo: {
    mimeType: null | string;
    url: null | string;
  },
): Promise<{
  completionTokens: number;
  promptTokens: number;
  response: string;
}> {
  // log.debug(F, `googleAiConversation | aiPersona: ${JSON.stringify(aiPersona, null, 2)}`);
  // const response = '';
  const promptTokens = 0;
  const completionTokens = 0;

  let modelName = aiPersona.ai_model.toLowerCase();
  // Convert ai models into proper names
  if (aiPersona.ai_model === 'GEMINI_PRO') {
    modelName = 'gemini-pro';
  }

  if (attachmentInfo.url) {
    modelName = 'gemini-pro-vision';
  }

  log.debug(F, `modelName: ${modelName}`);

  const model = googleAi.getGenerativeModel({ model: modelName });

  const generationConfig = {
    maxOutputTokens: aiPersona.max_tokens,
    temperature: aiPersona.temperature,
    topK: 1,
    topP: 1,
  } as GenerationConfig;

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
  ] as SafetySetting[];

  const messageString = messages[0].content;

  const parts = [{ text: messageString }] as Part[];

  if (modelName === 'gemini-pro-vision' && attachmentInfo.url && attachmentInfo.mimeType) {
    // We don't want to include the prompt and objective trusts on a conversation because it's already supplied below
    parts.unshift({ text: aiPersona.prompt });
    parts.unshift({ text: objectiveTruths });

    try {
      // Fetch the file as a stream
      const response = await axios({
        method: 'get',
        responseType: 'arraybuffer', // Important for binary files
        url: attachmentInfo.url,
      });

      // Convert the ArrayBuffer to Buffer and then to a Base64 string
      const base64 = Buffer.from(response.data).toString('base64');

      const data = {
        data: base64,
        mimeType: attachmentInfo.mimeType,
      };
      // log.debug(F, `data: ${JSON.stringify(data, null, 2)}`);
      parts.push({
        inlineData: data,
      });
      const result = await model.generateContent({
        contents: [{ parts, role: 'user' }],
        generationConfig,
        safetySettings,
      });
      try {
        return { completionTokens, promptTokens, response: result.response.text() };
      } catch (error) {
        log.error(F, `Error sending message: ${error}`);
        return { completionTokens, promptTokens, response: (error as Error).message };
      }
    } catch (error) {
      log.error(F, `Error fetching data: ${error}`);
    }
  }

  log.debug(F, `Starting new chat with model: ${modelName}`);

  // Get the user's history
  const userData = await db.users.upsert({
    create: { discord_id: messageData.author.id },
    update: {},
    where: { discord_id: messageData.author.id },
  });
  let userHistory = [] as Content[];
  if (userData.ai_history_google) {
    userHistory = JSON.parse(userData.ai_history_google) as Content[];
  } else {
    // If the user's history is blank, start with the objective truths and the AI's prompt
    userHistory = [
      {
        parts: [{ text: objectiveTruths }],
        role: 'user',
      },
      {
        parts: [{ text: 'Okay, understood, I will remember those facts' }],
        role: 'model',
      },
      {
        parts: [{ text: aiPersona.prompt }],
        role: 'user',
      },
      {
        parts: [{ text: "Great, I will remember that prompt too. Let's get started!" }],
        role: 'model',
      },
    ];
  }
  // log.debug(F, `userHistory: ${JSON.stringify(userHistory, null, 2)}`);

  const chat = model.startChat({
    generationConfig,
    history: userHistory,
    safetySettings,
  });
  // log.debug(F, `chat: ${JSON.stringify(chat, null, 2)}`);

  let result = {} as GenerateContentResult;
  try {
    result = await chat.sendMessage(parts);
  } catch (error) {
    log.error(F, `Error sending message: ${error}`);
    return { completionTokens, promptTokens, response: (error as Error).message };
  }

  // log.debug(F, `result: ${JSON.stringify(result, null, 2)}`);

  // Update the history with the message and this response
  userHistory.push({
    parts: [{ text: messageString }],
    role: 'user',
  });
  userHistory.push({
    parts: [{ text: result.response.text() }],
    role: 'model',
  });
  // log.debug(F, `newUserHistory: ${JSON.stringify(userHistory, null, 2)}`);

  // Save the user's history
  await db.users.update({
    data: {
      ai_history_google: JSON.stringify(userHistory),
    },
    where: { discord_id: messageData.author.id },
  });

  return { completionTokens, promptTokens, response: result.response.text() };
}

async function openAiChat(
  aiPersona: ai_personas,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  user: string,
): Promise<{
  completionTokens: number;
  promptTokens: number;
  response: string;
}> {
  log.debug(F, `openAiChat | aiPersona: ${JSON.stringify(aiPersona, null, 2)}`);
  let response = '';
  let promptTokens = 0;
  let completionTokens = 0;

  let model = aiPersona.ai_model.toLowerCase();
  // Convert ai models into proper names
  if (aiPersona.ai_model === 'GPT_3_5_TURBO') {
    model = 'gpt-4.1-mini'; // LAZY TEMP FIX
  }

  // This message list is sent to the API
  const chatCompletionMessages = [
    {
      content: [{ text: aiPersona.prompt }, { text: objectiveTruths }],
      role: 'system',
    },
  ] as OpenAI.Chat.ChatCompletionMessageParam[];
  chatCompletionMessages.push(...messages);

  const payload = {
    frequency_penalty: aiPersona.frequency_penalty,
    logit_bias: aiPersona.logit_bias,
    max_tokens: aiPersona.max_tokens,
    messages: chatCompletionMessages,
    model,
    presence_penalty: aiPersona.presence_penalty,
    temperature: aiPersona.temperature,
    top_p: aiPersona.top_p,
    // functions: aiFunctions,
    // function_call: 'auto',
    user,
  } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming;

  // log.debug(F, `payload: ${JSON.stringify(payload, null, 2)}`);
  let responseMessage = {} as OpenAI.Chat.ChatCompletionMessageParam;

  const chatCompletion = await openAi.chat.completions.create(payload).catch((error) => {
    if (error instanceof OpenAI.APIError) {
      log.error(F, `${error.name} - ${error.status} - ${error.type} - ${error.error.message}  `); // 400
      // log.error  (F, `${JSON.stringify(err.headers, null, 2)}`); // {server: 'nginx', ...}
      // log.error(F, `${JSON.stringify(err, null, 2)}`); // {server: 'nginx', ...}
    } else {
      throw error;
    }
  });
  // log.debug(F, `chatCompletion: ${JSON.stringify(chatCompletion, null, 2)}`);

  if (chatCompletion?.choices[0].message) {
    responseMessage = chatCompletion.choices[0].message;

    // Sum up the existing tokens
    promptTokens = chatCompletion.usage?.prompt_tokens ?? 0;
    completionTokens = chatCompletion.usage?.completion_tokens ?? 0;

    // # Step 2: check if GPT wanted to call a function
    if (responseMessage.function_call) {
      log.debug(
        F,
        `responseMessage.function_call: ${JSON.stringify(responseMessage.function_call, null, 2)}`,
      );
      // # Step 3: call the function
      // # Note: the JSON response may not always be valid; be sure to handle errors

      const functionName = responseMessage.function_call.name;
      log.debug(F, `functionName: ${functionName}`);
      const functionToCall = availableFunctions[functionName as keyof typeof availableFunctions];
      const functionArguments = JSON.parse(responseMessage.function_call.arguments);
      const functionResponse = await functionToCall(
        functionArguments.location,
        functionArguments.unit,
      );
      log.debug(F, `functionResponse: ${JSON.stringify(functionResponse, null, 2)}`);

      // # Step 4: send the info on the function call and function response to GPT
      payload.messages.push({
        content: JSON.stringify(functionResponse),
        name: functionName,
        role: 'function',
      });

      const chatFunctionCompletion = await openAi.chat.completions.create(payload);

      // responseData = chatFunctionCompletion.data;

      log.debug(F, `chatFunctionCompletion: ${JSON.stringify(chatFunctionCompletion, null, 2)}`);

      if (chatFunctionCompletion.choices[0].message) {
        responseMessage = chatFunctionCompletion.choices[0].message;

        // Sum up the new tokens
        promptTokens += chatCompletion.usage?.prompt_tokens ?? 0;
        completionTokens += chatCompletion.usage?.completion_tokens ?? 0;
      }
    }

    response = responseMessage.content?.toString() ?? "Sorry, I'm not sure how to respond to that.";
  }

  // log.debug(F, `response: ${response}`);
  // log the ai persona id
  // log.debug(F, `aiPersona.id: ${aiPersona.id}`);

  return { completionTokens, promptTokens, response };
}

async function openAiConversation(
  aiPersona: ai_personas,
  messages: {
    content: string;
    role: 'user';
  }[],
  messageData: Message,
): Promise<{
  completionTokens: number;
  promptTokens: number;
  response: string;
}> {
  // Create the default response if something goes wrong
  const response = '';
  const promptTokens = 0;
  const completionTokens = 0;

  // Get the assistant associated with that persona
  // This will create a new assistant if it doesn't exist
  // Regardless, it will update the assistance using the latest persona data
  const assistant = await getAssistant(aiPersona.name);
  // log.debug(F, `assistant: ${JSON.stringify(assistant, null, 2)}`);

  // Get the user from the DB
  const userData = await db.users.upsert({
    create: { discord_id: messageData.author.id },
    update: {},
    where: { discord_id: messageData.author.id },
  });

  // Get the threadID, or create a new thread and use that ID
  const thread = userData.ai_history_openai
    ? await openAi.beta.threads.retrieve(userData.ai_history_openai)
    : await openAi.beta.threads.create();
  // log.debug(F, `thread: ${JSON.stringify(thread, null, 2)}`);

  // Save the thread id to the user if it doesn't exist
  if (!userData.ai_history_openai) {
    log.debug(F, `Saving new thread id to user: ${messageData.author.id}`);
    await db.users.update({
      data: {
        ai_history_openai: thread.id,
      },
      where: { discord_id: messageData.author.id },
    });
  }

  // Before we add the message to the thread, we need to check if the last run is still in progress
  // If it is, we need to cancel it before we can add a new message
  // This is because the assistant can only handle one request at a time
  // If we don't cancel the run, the new message will create an error

  // Get the most recent run
  // This will automatically return the most recent runs, so we can just grab the first one
  let [recentRun] = (await openAi.beta.threads.runs.list(thread.id, { limit: 1 })).data;
  // log.debug(F, `recentRun: ${JSON.stringify(recentRun, null, 2)}`);

  // If the most recent run is in progress, queued, or waiting for user action, stop it
  if (recentRun && ['in_progress', 'queued', 'requires_action'].includes(recentRun.status)) {
    log.debug(F, 'Stopping the run');
    await openAi.beta.threads.runs.cancel(thread.id, { thread_id: recentRun.id });

    // Wait for the run to be cancelled
    while (['in_progress', 'queued', 'requires_action'].includes(recentRun.status)) {
      await sleep(200);

      recentRun = await openAi.beta.threads.runs.retrieve(thread.id, { thread_id: recentRun.id });
    }
  }

  // Add the message to the thread
  try {
    await openAi.beta.threads.messages.create(thread.id, messages[0]);
  } catch (error) {
    log.error(F, `Error sending message: ${error}`);
    return { completionTokens, promptTokens, response: (error as Error).message };
  }

  // Run the thread
  log.debug(F, `Starting new run with assistant: ${assistant.name} and thread: ${thread.id}`);
  const run = await openAi.beta.threads.runs.create(thread.id, {
    assistant_id: assistant.id,
  });
  // log.debug(F, `run: ${JSON.stringify(run, null, 2)}`);

  // Wait for the run to complete
  // This is a separate function because if the run requires action, it will call the function again

  return openAiWaitForRun(run, thread, messageData);
}

async function openAiWaitForRun(
  runData: OpenAI.Beta.Threads.Run,
  threadData: OpenAI.Beta.Threads.Thread,
  messageData: Message,
): Promise<{
  completionTokens: number;
  promptTokens: number;
  response: string;
}> {
  let run = runData;
  const thread = threadData;

  const response = '';
  const promptTokens = 0;
  const completionTokens = 0;

  // Wait for the run to complete
  while (['in_progress', 'queued'].includes(run.status)) {
    await sleep(200);

    run = await openAi.beta.threads.runs.retrieve(thread.id, { thread_id: run.id });
  }

  // Depending on how the run ended, do something
  switch (run.status) {
    case 'cancelled': {
      // Take a guess =D
      break;
    }
    case 'cancelling': {
      // This would only happen if i manually cancel the request, which isn't supported
      break;
    }
    case 'completed': {
      // This should pull the thread and then get the last message in the thread, which should be from the assistant
      // We only want the first response, so we limit it to 1
      const messageContent = (await openAi.beta.threads.messages.list(thread.id, { limit: 1 }))
        .data[0].content[0];
      // log.debug(F, `messageContent: ${JSON.stringify(messageContent, null, 2)}`);
      return {
        completionTokens,
        promptTokens,
        response: (messageContent as TextContentBlock).text.value.slice(0, 2000),
      };
    }
    case 'expired': {
      // This will happen if the requires_action doesn't get a  response in time, so this isn't supported either
      break;
    }
    case 'failed': {
      // This should send an error to the dev
      const developmentRoom = (await discordClient.channels.fetch(
        env.CHANNEL_BOTERRORS,
      )) as TextChannel;
      await developmentRoom.send(`AI Conversation failed: ${JSON.stringify(run, null, 2)}`);
      log.error(F, `run ended: ${JSON.stringify(run, null, 2)}`);
      return { completionTokens, promptTokens, response };
    }
    case 'requires_action': {
      log.debug(F, 'requires_action');
      log.debug(F, `run.required_action: ${JSON.stringify(run.required_action, null, 2)}`);

      // // We need to loop through each of the tool_calls and call the function given
      // const toolOutputs = [] as RunSubmitToolOutputsParams.ToolOutput[];
      // run.required_action?.submit_tool_outputs.tool_calls.forEach(async toolCall => {
      //   const functionName = run.required_action?.submit_tool_outputs.tool_calls[0].function?.name;
      //   log.debug(F, `functionName: ${functionName}`);
      //   const functionToCall = availableFunctions[functionName as keyof typeof availableFunctions];
      //   const functionArgs = JSON.parse(run.required_action?.submit_tool_outputs.tool_calls[0].function?.arguments as string);
      //   // Check if functionArgs is correctly structured and contains the expected properties
      //   if (functionArgs && typeof functionArgs === 'object' && 'drugName' in functionArgs) {
      //     // Call the function with the spread syntax if it expects multiple arguments
      //     // If the function expects an object, you can pass functionArgs directly
      //     const reply = await functionToCall(functionArgs.drugName, functionArgs.section);
      //     await messageData.reply(reply as MessageReplyOptions);
      //     response = 'functionFinished';
      //   } else {
      //     // Handle the case where functionArgs does not have the expected structure or types
      //     log.error(F, `Invalid arguments structure for function ${functionName}: ${JSON.stringify(functionArgs)}`);
      //   }
      //   // const functionResponse = await functionToCall(functionArgs);
      //   // log.debug(F, `functionResponse: ${JSON.stringify(functionResponse, null, 2)}`);

      //   // toolOutputs.push({
      //   //   tool_call_id: toolCall.id,
      //   //   output: `${JSON.stringify(functionResponse)}`,
      //   // });
      // });

      // run = await openAi.beta.threads.runs.submitToolOutputs(
      //   thread.id,
      //   run.id,
      //   {
      //     tool_outputs: toolOutputs,
      //   },
      // );

      // return openAiWaitForRun(run, thread);

      const toolCalls = run.required_action?.submit_tool_outputs.tool_calls;

      if (!toolCalls) {
        // Handle the case where there are no tool calls
        break;
      }

      // Map each tool call to a promise representing the async operation
      const promises = toolCalls.map(async (toolCall) => {
        const functionName = toolCall.function?.name;
        log.debug(F, `functionName: ${functionName}`);
        if (!functionName) {
          // Handle the case where functionName is not provided
          log.error(F, 'Function name is missing');
          return;
        }
        const functionToCall = availableFunctions[functionName as keyof typeof availableFunctions];
        if (!functionToCall) {
          // Handle the case where the function is not found in availableFunctions
          log.error(F, `Function ${functionName} not found`);
          return;
        }
        const functionArguments = JSON.parse(toolCall.function?.arguments);
        // Check if functionArgs is correctly structured and contains the expected properties
        if (
          functionArguments &&
          typeof functionArguments === 'object' &&
          'drugName' in functionArguments
        ) {
          // Execute the function call with the provided arguments
          const reply = await functionToCall(functionArguments.drugName, functionArguments.section);
          await messageData.reply(reply as MessageReplyOptions);
          return;
        }
        // Log an error if the function arguments do not have the expected structure or types
        log.error(
          F,
          `Invalid arguments structure for function ${functionName}: ${JSON.stringify(functionArguments)}`,
        );
      });

      // Wait for all promises to resolve
      const results = await Promise.all(promises);
      log.debug(F, 'All tool calls have been processed');

      return { completionTokens, promptTokens, response: 'functionFinished' };
    }
    default: {
      break;
    }
  }
  log.debug(F, `Returning response: ${response}`);
  return { completionTokens, promptTokens, response };
}

// Function to process the next message in the user's queue
async function processNextMessage(userId: string) {
  const userQueue = userQueues.get(userId);

  // If userQueue is null or undefined, exit the function immediately
  if (!userQueue) {
    return;
  }

  // If the queue is empty, reset isProcessing to false and exit
  if (userQueue.queue.length === 0) {
    userQueue.isProcessing = false;
    return;
  }

  userQueue.isProcessing = true; // Mark as processing

  // Ensure the queue has an item before destructuring
  const nextMessage = userQueue.queue.shift();
  if (!nextMessage) {
    // Handle case where there’s no next message in the queue, if needed
    return;
  }

  const { aiPersona, attachmentInfo, messageData, messages, resolve } = nextMessage;

  try {
    // Call the aiChat function and destructure the needed response data
    const { completionTokens, promptTokens, response } = await aiChat(
      aiPersona,
      messages,
      messageData,
      attachmentInfo,
    );

    resolve({ completionTokens, promptTokens, response });
  } catch (error) {
    log.error(F, `Error processing message for user: ${userId} - error: ${error}`);
    resolve({ completionTokens: 0, promptTokens: 0, response: 'Error' });
  } finally {
    // Process the next message after this one is done
    processNextMessage(userId);
  }
}
