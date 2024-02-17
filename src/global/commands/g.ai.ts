/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import OpenAI from 'openai';
import { ai_personas } from '@prisma/client';
import { ImagesResponse, ModerationCreateResponse } from 'openai/resources';
import { Assistant } from 'openai/resources/beta/assistants/assistants';
import { stripIndents } from 'common-tags';
import { Thread, ThreadDeleted } from 'openai/resources/beta/threads/threads';
import {
  MessageCreateParams, MessageListParams, ThreadMessage, ThreadMessagesPage,
  MessageContentText,
} from 'openai/resources/beta/threads/messages/messages';
import { Run, RunCreateParams } from 'openai/resources/beta/threads/runs/runs';
import {
  GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerationConfig, SafetySetting, Part, InputContent, GenerateContentResult,
} from '@google/generative-ai';
import axios from 'axios';
import {
  ChannelType, Events, Message, TextChannel,
} from 'discord.js';
import { sleep } from '../../discord/commands/guild/d.bottest';

const F = f(__filename);

const openAi = new OpenAI({
  organization: env.OPENAI_API_ORG,
  apiKey: env.OPENAI_API_KEY,
});

const googleAi = new GoogleGenerativeAI(env.GEMINI_KEY);

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
The current team includes: 
TripSit founder MoonBear, 
Discord Admin Hipperooni (Rooni), 
Moderators Hisui, Hullabaloo, Foggy, Aida, Elixir, SpaceLady, Hipperooni, Zombie, and Trees. 
Tripsitters Blurryturtle, Kiwifruit, Slushy, Thesarahyouknow, Wombat Rancher, and WorriedHobbiton.
(Moderators are also Tripsitters)
The HR Coordinator is Elixir
The Content Coordinator is Utaninja

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

export async function getAssistant(name: string):Promise<Assistant> {
  // Get all the org's assistants
  const myAssistants = await openAi.beta.assistants.list();
  log.debug(F, `myAssistants: ${myAssistants.data.map(assistant => assistant.name).join(', ')}`);

  // Check if the assistant exists
  const assistantData = myAssistants.data.find(assistant => assistant.name === name);
  log.debug(F, `I found the ${name} assistant!`);

  const personaData = await db.ai_personas.findFirstOrThrow({
    where: {
      name,
    },
  });

  const modelName = personaData.ai_model.toLowerCase() === 'gpt_3_5_turbo' ? 'gpt-3.5-turbo-1106' : 'gpt-4-turbo-preview';

  const tripsitAssistantData = {
    // eslint-disable-next-line sonarjs/no-duplicate-string
    model: modelName,
    name: personaData.name,
    description: personaData.description,
    instructions: `${objectiveTruths}\n${personaData.prompt}`,
    tools: [
      { type: 'code_interpreter' },
      { type: 'retrieval' },
    ],
    file_ids: [],
    metadata: {},
  } as Omit<Assistant, 'id' | 'created_at' | 'object'>;

  // If it doesn't exist, create it
  if (!assistantData) {
    // Create an object that is the tripsitAssistantData but minus the id key
    // log.debug(F, `tripsitAssistantData: ${JSON.stringify(tripsitAssistantData, null, 2)}`);
    log.debug(F, `Creating the ${name} assistant!`);
    return openAi.beta.assistants.create(tripsitAssistantData);
  }
  // If it does exist, update it
  // log.debug(F, `updatedAssistant: ${JSON.stringify(assistant, null, 2)}`);
  return openAi.beta.assistants.update(assistantData.id, tripsitAssistantData);
}

export async function deleteThread(threadId: string):Promise<ThreadDeleted> {
  const threadData = await openAi.beta.threads.del(threadId);
  log.debug(F, `threadData: ${JSON.stringify(threadData, null, 2)}`);
  return threadData;
}

export async function getMessages(
  inputThreadData: Thread,
  options: MessageListParams,
):Promise<ThreadMessagesPage> {
  // log.debug(F, `threadMessages: ${JSON.stringify(threadMessages, null, 2)}`);
  return openAi.beta.threads.messages.list(
    inputThreadData.id,
    options,
  );
}

export async function readRun(
  thread: Thread,
  run: Run,
):Promise<Run> {
  // log.debug(F, `runData: ${JSON.stringify(runData, null, 2)}`);
  return openAi.beta.threads.runs.retrieve(thread.id, run.id);
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

  return openAi.images.generate({
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

async function googleAiConversation(
  aiPersona:ai_personas,
  messages: {
    role: 'user';
    content: string;
  }[],
  user: string,
  attachmentInfo: {
    url: string | null;
    mimeType: string | null;
  },
):Promise<{
    response: string,
    promptTokens: number,
    completionTokens: number,
  }> {
  log.debug(F, `googleAiConversation | aiPersona: ${JSON.stringify(aiPersona, null, 2)}`);
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
    temperature: aiPersona.temperature,
    topK: 1,
    topP: 1,
    maxOutputTokens: aiPersona.max_tokens,
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

  const parts = [
    { text: messageString },
  ] as Part[];

  if (modelName === 'gemini-pro-vision' && attachmentInfo.url && attachmentInfo.mimeType) {
    // We dont want to include the prompt and objective trusts on a conversation because it's already supplied below
    parts.unshift({ text: aiPersona.prompt });
    parts.unshift({ text: objectiveTruths });

    try {
      // Fetch the file as a stream
      const response = await axios({
        method: 'get',
        url: attachmentInfo.url,
        responseType: 'arraybuffer', // Important for binary files
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
        contents: [{ role: 'user', parts }],
        generationConfig,
        safetySettings,
      });
      return { response: result.response.text(), promptTokens, completionTokens };
    } catch (error) {
      log.error(F, `Error fetching data: ${error}`);
    }
  }

  log.debug(F, `Starting new chat with model: ${modelName}`);

  // Get the user's history
  const userData = await db.users.upsert({
    where: { discord_id: user },
    create: { discord_id: user },
    update: {},
  });
  let userHistory = [] as InputContent[];
  if (userData.ai_history_google) {
    userHistory = JSON.parse(userData.ai_history_google) as InputContent[];
  } else {
    // If the user's history is blank, start with the objective truths and the AI's prompt
    userHistory = [
      {
        role: 'user',
        parts: [{ text: objectiveTruths }],
      },
      {
        role: 'model',
        parts: 'Okay, understood, I will remember those facts',
      },
      {
        role: 'user',
        parts: [{ text: aiPersona.prompt }],
      },
      {
        role: 'model',
        parts: 'Great, I will remember that prompt too. Let\'s get started!',
      },
    ];
  }
  log.debug(F, `userHistory: ${JSON.stringify(userHistory, null, 2)}`);

  const chat = model.startChat({
    history: userHistory,
    generationConfig,
    safetySettings,
  });
  log.debug(F, `chat: ${JSON.stringify(chat, null, 2)}`);

  let result = {} as GenerateContentResult;
  try {
    result = await chat.sendMessage(parts);
  } catch (error) {
    log.error(F, `Error sending message: ${error}`);
    return { response: (error as Error).message, promptTokens, completionTokens };
  }

  log.debug(F, `result: ${JSON.stringify(result, null, 2)}`);

  // Update the history with the message and this response
  userHistory.push({
    role: 'user',
    parts: [{ text: messageString }],
  });
  userHistory.push({
    role: 'model',
    parts: result.response.text(),
  });
  log.debug(F, `newUserHistory: ${JSON.stringify(userHistory, null, 2)}`);

  // Save the user's history
  await db.users.update({
    where: { discord_id: user },
    data: {
      ai_history_google: JSON.stringify(userHistory),
    },
  });

  return { response: result.response.text(), promptTokens, completionTokens };
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

async function openAiConversation(
  aiPersona:ai_personas,
  messages: {
    role: 'user';
    content: string;
  }[],
  user: string,
):Promise<{
    response: string,
    promptTokens: number,
    completionTokens: number,
  }> {
  // if (!env.OPENAI_API_ORG || !env.OPENAI_API_KEY) return;
  // if (!messageData.member?.roles.cache.has(env.ROLE_VERIFIED)) return;
  // if (messageData.author.bot) return;
  // if (messageData.cleanContent.length < 1) return;
  // if (messageData.channel.type === ChannelType.DM) return;
  // if (messageData.author.id !== env.DISCORD_OWNER_ID) return;

  let response = '';
  const promptTokens = 0;
  const completionTokens = 0;

  // Get the assistant for this channel.
  // Right now the only assistant is the 'tripsitter' assistant
  const assistant = await getAssistant(aiPersona.name);
  // log.debug(F, `assistant: ${JSON.stringify(assistant, null, 2)}`);

  const userData = await db.users.upsert({
    where: { discord_id: user },
    create: { discord_id: user },
    update: {},
  });

  // Get the thread for the user who said something
  const thread = userData.ai_history_openai
    ? await openAi.beta.threads.retrieve(userData.ai_history_openai)
    : await openAi.beta.threads.create();

  // log.debug(F, `thread: ${JSON.stringify(thread, null, 2)}`);
  if (!userData.ai_history_openai) {
    // Save the thread id to the user's data
    log.debug(F, `Saving new thread id to user: ${user}`);
    await db.users.update({
      where: { discord_id: user },
      data: {
        ai_history_openai: thread.id,
      },
    });
  }

  // Add the message to the thread
  const message = await openAi.beta.threads.messages.create(
    thread.id,
    messages[0],
  );
  // log.debug(F, `message: ${JSON.stringify(message, null, 2)}`);

  log.debug(F, `Starting new run with assistant: ${assistant.id} and thread: ${thread.id}`);
  // Run the thread
  const run = await openAi.beta.threads.runs.create(
    thread.id,
    {
      assistant_id: assistant.id,
    },
  );
  // log.debug(F, `run: ${JSON.stringify(run, null, 2)}`);

  // Wait for the run to complete
  let runStatus = 'queued' as Run['status'];
  while (['queued', 'in_progress'].includes(runStatus)) {
    // Send the typing indicator to show tripbot is thinking
    // eslint-disable-next-line no-await-in-loop
    // await messageData.channel.sendTyping();

    // eslint-disable-next-line no-await-in-loop
    await sleep(200);
    // eslint-disable-next-line no-await-in-loop
    const runStatusResponse = await readRun(thread, run);
    // log.debug(F, `runStatusResponse: ${JSON.stringify(runStatusResponse, null, 2)}`);
    runStatus = runStatusResponse.status;
  }

  const devRoom = await discordClient.channels.fetch(env.CHANNEL_BOTERRORS) as TextChannel;

  // Depending on how the run ended, do something
  switch (runStatus) {
    case 'completed': {
      // This should pull the thread and then get the last message in the thread, which should be from the assistant
      const messagePage = await getMessages(thread, { limit: 10 });
      // log.debug(F, `messagePage: ${JSON.stringify(messagePage, null, 2)}`);
      const messageItems = messagePage.getPaginatedItems();
      const messageText = messageItems[0];
      const [messageContent] = messageText.content;
      if ((messageContent as MessageContentText).text) {
        log.debug(F, `messageContent: ${JSON.stringify(messageContent, null, 2)}`);

        // Send the result to the dev room
        await devRoom.send(`AI Conversation succeeded: ${JSON.stringify(messageContent, null, 2)}`);

        // await messages[0].reply(result.response.slice(0, 2000));
        response = (messageContent as MessageContentText).text.value;
        // await messageData.reply(response);

        return { response, promptTokens, completionTokens };
      }

      break;
    }
    case 'requires_action':
      // No way to support additional actions at this time
      break;
    case 'expired':
      // This will happen if the requires_action doesn't get a  response in time, so this isn't supported either
      break;
    case 'cancelling':
      // This would only happen if i manually cancel the request, which isn't supported
      break;
    case 'cancelled':
      // Take a guess =D
      break;
    case 'failed': {
      // This should send an error to the dev
      await devRoom.send(`AI Conversation failed: ${JSON.stringify(run, null, 2)}`);
      log.error(F, `run ended: ${JSON.stringify(run, null, 2)}`);
      return { response, promptTokens, completionTokens };
    }
    default:
      break;
  }

  return { response, promptTokens, completionTokens };
}

async function openAiChat(
  aiPersona:ai_personas,
  messages: OpenAI.Chat.ChatCompletionMessageParam [],
  user: string,
):Promise<{
    response: string,
    promptTokens: number,
    completionTokens: number,
  }> {
  log.debug(F, `openAiChat | aiPersona: ${JSON.stringify(aiPersona, null, 2)}`);
  let response = '';
  let promptTokens = 0;
  let completionTokens = 0;

  let model = aiPersona.ai_model.toLowerCase();
  // Convert ai models into proper names
  if (aiPersona.ai_model === 'GPT_3_5_TURBO') {
    model = 'gpt-3.5-turbo-1106';
  }

  // This message list is sent to the API
  const chatCompletionMessages = [{
    role: 'system',
    content: aiPersona.prompt.concat(objectiveTruths),
  }] as OpenAI.Chat.ChatCompletionMessageParam[];
  chatCompletionMessages.push(...messages);

  // eslint-disable-next-line @typescript-eslint/naming-convention
  // const {
  //   id,
  //   name,
  //   description,
  //   public,
  //   created_at, // eslint-disable-line @typescript-eslint/naming-convention
  //   created_by, // eslint-disable-line @typescript-eslint/naming-convention
  //   prompt,
  //   logit_bias, // eslint-disable-line @typescript-eslint/naming-convention
  //   total_tokens, // eslint-disable-line @typescript-eslint/naming-convention
  //   downvotes,
  //   upvotes,
  //   ai_model: modelName, // eslint-disable-line @typescript-eslint/naming-convention
  //   ...restOfAiPersona
  // } = aiPersona;

  const payload = {
    temperature: aiPersona.temperature,
    top_p: aiPersona.top_p,
    presence_penalty: aiPersona.presence_penalty,
    frequency_penalty: aiPersona.frequency_penalty,
    logit_bias: aiPersona.logit_bias,
    max_tokens: aiPersona.max_tokens,
    model,
    messages: chatCompletionMessages,
    // functions: aiFunctions,
    // function_call: 'auto',
    user,
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
  // log the ai persona id
  // log.debug(F, `aiPersona.id: ${aiPersona.id}`);

  return { response, promptTokens, completionTokens };
}

export default async function aiChat(
  aiPersona:ai_personas,
  messages: {
    role: 'user';
    content: string;
  }[],
  user: string,
  attachmentInfo: {
    url: string | null;
    mimeType: string | null;
  },
):Promise<{
    response: string,
    promptTokens: number,
    completionTokens: number,
  }> {
  const response = '';
  // const responseData = {} as CreateChatCompletionResponse;
  const promptTokens = 0;
  const completionTokens = 0;
  if (!env.OPENAI_API_ORG || !env.OPENAI_API_KEY || !env.GEMINI_KEY) return { response, promptTokens, completionTokens };

  // log.debug(F, `messages: ${JSON.stringify(messages, null, 2)}`);
  // log.debug(F, `aiPersona: ${JSON.stringify(aiPersona.name, null, 2)}`);

  if (['GEMINI_PRO', 'GEMINI_PRO_VISION', 'AQA'].includes(aiPersona.ai_model)) {
    // return googleAiChat(aiPersona, messages, user, attachmentInfo);
    return googleAiConversation(aiPersona, messages, user, attachmentInfo);
  }
  // return openAiChat(aiPersona, messages, user);
  return openAiConversation(aiPersona, messages, user);
}

export async function aiFlairMod(
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
  if (!env.OPENAI_API_ORG || !env.OPENAI_API_KEY) return { response, promptTokens, completionTokens };

  // log.debug(F, `messages: ${JSON.stringify(messages, null, 2)}`);
  // log.debug(F, `aiPersona: ${JSON.stringify(aiPersona.name, null, 2)}`);

  let model = aiPersona.ai_model.toLowerCase();
  // Convert ai models into proper names
  if (aiPersona.ai_model === 'GPT_3_5_TURBO') {
    model = 'gpt-3.5-turbo-1106';
  }
  // This message list is sent to the API
  const chatCompletionMessages = [{
    role: 'system',
    content: aiPersona.prompt.concat(''),
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

  if (!moderation || !moderation.results) {
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
