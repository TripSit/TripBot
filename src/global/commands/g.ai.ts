/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import OpenAI from 'openai';
import { ai_personas } from '@prisma/client';
import { ImagesResponse, ModerationCreateResponse } from 'openai/resources';
import { Assistant } from 'openai/resources/beta/assistants';
import { ThreadDeleted } from 'openai/resources/beta/threads/threads';
import { TextContentBlock } from 'openai/resources/beta/threads/messages';
import {
  GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerationConfig, SafetySetting, Part, InputContent,
  GenerateContentResult,
} from '@google/generative-ai';
import axios from 'axios';
import { Message, MessageReplyOptions, TextChannel } from 'discord.js';
import { sleep } from '../../discord/commands/guild/d.bottest';
import { getDrugInfo } from '../../discord/commands/global/d.drug';

const F = f(__filename);

const openAi = new OpenAI({
  organization: env.OPENAI_API_ORG,
  apiKey: env.OPENAI_API_KEY,
});

const googleAi = new GoogleGenerativeAI(env.GEMINI_KEY);

type UserQueue = {
  queue: {
    aiPersona: ai_personas;
    messages: { role: 'user'; content: string }[];
    messageData: Message<boolean>;
    attachmentInfo: {
      url: string | null;
      mimeType: string | null;
    };
    resolve: (value: {
      response: string;
      promptTokens: number;
      completionTokens: number;
    }) => void;
  }[];
  isProcessing: boolean;
};

const userQueues = new Map<string, UserQueue>();

type ModerationResult = {
  category: string,
  value: number,
  limit: number,
};

// Objective truths are facts and don't impact personality
const objectiveTruths = `
Your name is TripBot, a chatbot on the TripSit Discord, created by Moonbear and Reality.
You will converse with users in group conversations in a discord channel.
Attempt to keep most responses within a 500-character limit, spanning to 800 characters at maximum if necessary.

Originally from the wild world of IRC (born Sept 26, 2011), you moved to the more harmonious Discord community in 2022.
You recall IRC as chaotic and prefer the orderliness of Discord.
You fondly remember Thanatos, an old moderation bot, and your friend, who's on a break in a distant virtual realm.

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
Moderators Foggy, Aida, Bread, Ari, Hisui, Hullabloo, ScubaDude, SpaceLady, Wombat and Zombie.
Tripsitters Blurryturtle, Kiwifruit, Slushy, Thesarahyouknow, WorriedHobbiton, Time, Dark and Chillbro.
(Moderators are also Tripsitters).
Developers are Moonbear, Hipperooni, Shadow, Sympact, Foggy, Utaninja.
The HR Coordinator is Bread.
The Content Coordinator is Utaninja.

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

const availableFunctions = {
  getDrugInfo,
};

const aiFunctions = [
  {
    type: 'function',
    function: {
      name: 'getDrugInfo',
      description: 'Get information on a drug or substance, such as dosages or summary',
      parameters: {
        type: 'object',
        properties: {
          drugName: { type: 'string', description: 'The name of the substance to look up' },
          section: { type: 'string', description: 'The section to return' },
        },
        required: ['drugName'],
      },
    },
  },
];

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
export async function getAssistant(name: string):Promise<Assistant> {
  // Get all the org's assistants
  const myAssistants = await openAi.beta.assistants.list();
  // log.debug(F, `myAssistants: ${myAssistants.data.map(assistant => assistant.name).join(', ')}`);

  // Check if the assistant exists
  const assistantData = myAssistants.data.find(assistant => assistant.name === name);
  // log.debug(F, `assistantData: ${JSON.stringify(assistantData, null, 2)}`);

  const personaData = await db.ai_personas.findFirstOrThrow({
    where: {
      name,
    },
  });
  // LAZY TEMP FIX
  // eslint-disable-next-line sonarjs/no-all-duplicated-branches
  const modelName = personaData.ai_model.toLowerCase() === 'gpt-3.5-turbo-1106' ? 'gpt-4o-mini' : 'gpt-4o-mini';

  // Upload a file with an "assistants" purpose
  // const combinedDb = await openAi.files.create({
  //   file: fs.createReadStream('../../../assets/data/combinedDb.json')   ,
  //   purpose: 'assistants',
  // });

  const tripsitAssistantData = {
    // eslint-disable-next-line sonarjs/no-duplicate-string
    model: modelName,
    name: personaData.name,
    description: personaData.description,
    instructions: `${objectiveTruths}\n${personaData.prompt}`, // LAZY TEMP FIX. https://platform.openai.com/docs/assistants/migration/what-has-changed - UPDATE to version 4.52.7 in package.json
    tools: [
      // { type: 'code_interpreter' },
      // { type: 'retrieval' },
      // ...aiFunctions,
    ],
    // file_ids: [],
    metadata: {},
  } as Omit<Assistant, 'id' | 'created_at' | 'object'>;

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

export async function deleteThread(threadId: string):Promise<ThreadDeleted> {
  const threadData = await openAi.beta.threads.del(threadId);
  log.debug(F, `threadData: ${JSON.stringify(threadData, null, 2)}`);
  return threadData;
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

async function googleAiConversation(
  aiPersona:ai_personas,
  messages: {
    role: 'user';
    content: string;
  }[],
  messageData: Message<boolean>,
  attachmentInfo: {
    url: string | null;
    mimeType: string | null;
  },
):Promise<{
    response: string,
    promptTokens: number,
    completionTokens: number,
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
    // We don't want to include the prompt and objective trusts on a conversation because it's already supplied below
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
      try {
        return { response: result.response.text(), promptTokens, completionTokens };
      } catch (error) {
        log.error(F, `Error sending message: ${error}`);
        return { response: (error as Error).message, promptTokens, completionTokens };
      }
    } catch (error) {
      log.error(F, `Error fetching data: ${error}`);
    }
  }

  log.debug(F, `Starting new chat with model: ${modelName}`);

  // Get the user's history
  const userData = await db.users.upsert({
    where: { discord_id: messageData.author.id },
    create: { discord_id: messageData.author.id },
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
  // log.debug(F, `userHistory: ${JSON.stringify(userHistory, null, 2)}`);

  const chat = model.startChat({
    history: userHistory,
    generationConfig,
    safetySettings,
  });
  // log.debug(F, `chat: ${JSON.stringify(chat, null, 2)}`);

  let result = {} as GenerateContentResult;
  try {
    result = await chat.sendMessage(parts);
  } catch (error) {
    log.error(F, `Error sending message: ${error}`);
    return { response: (error as Error).message, promptTokens, completionTokens };
  }

  // log.debug(F, `result: ${JSON.stringify(result, null, 2)}`);

  // Update the history with the message and this response
  userHistory.push({
    role: 'user',
    parts: [{ text: messageString }],
  });
  userHistory.push({
    role: 'model',
    parts: result.response.text(),
  });
  // log.debug(F, `newUserHistory: ${JSON.stringify(userHistory, null, 2)}`);

  // Save the user's history
  await db.users.update({
    where: { discord_id: messageData.author.id },
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

async function openAiWaitForRun(
  runData: OpenAI.Beta.Threads.Run,
  threadData: OpenAI.Beta.Threads.Thread,
  messageData: Message<boolean>,
):Promise<{
    response: string,
    promptTokens: number,
    completionTokens: number,
  }> {
  let run = runData;
  const thread = threadData;

  const response = '';
  const promptTokens = 0;
  const completionTokens = 0;

  // Wait for the run to complete
  while (['queued', 'in_progress'].includes(run.status)) {
    // eslint-disable-next-line no-await-in-loop
    await sleep(200);
    // eslint-disable-next-line no-await-in-loop
    run = await openAi.beta.threads.runs.retrieve(thread.id, run.id);
  }

  // Depending on how the run ended, do something
  switch (run.status) {
    case 'completed': {
      // This should pull the thread and then get the last message in the thread, which should be from the assistant
      // We only want the first response, so we limit it to 1
      const messageContent = (
        await openAi.beta.threads.messages.list(thread.id, { limit: 1 })
      ).data[0].content[0];
      // log.debug(F, `messageContent: ${JSON.stringify(messageContent, null, 2)}`);
      return { response: (messageContent as TextContentBlock).text.value.slice(0, 2000), promptTokens, completionTokens };
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
      const promises = toolCalls.map(async toolCall => {
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
        const functionArgs = JSON.parse(toolCall.function?.arguments as string);
        // Check if functionArgs is correctly structured and contains the expected properties
        if (functionArgs && typeof functionArgs === 'object' && 'drugName' in functionArgs) {
          // Execute the function call with the provided arguments
          const reply = await functionToCall(functionArgs.drugName, functionArgs.section);
          await messageData.reply(reply as MessageReplyOptions);
          return;
        }
        // Log an error if the function arguments do not have the expected structure or types
        log.error(F, `Invalid arguments structure for function ${functionName}: ${JSON.stringify(functionArgs)}`);
      });

      // Wait for all promises to resolve
      const results = await Promise.all(promises);
      log.debug(F, 'All tool calls have been processed');

      return { response: 'functionFinished', promptTokens, completionTokens };
    }
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
      const devRoom = await discordClient.channels.fetch(env.CHANNEL_BOTERRORS) as TextChannel;
      await devRoom.send(`AI Conversation failed: ${JSON.stringify(run, null, 2)}`);
      log.error(F, `run ended: ${JSON.stringify(run, null, 2)}`);
      return { response, promptTokens, completionTokens };
    }
    default:
      break;
  }
  log.debug(F, `Returning response: ${response}`);
  return { response, promptTokens, completionTokens };
}

async function openAiConversation(
  aiPersona:ai_personas,
  messages: {
    role: 'user';
    content: string;
  }[],
  messageData: Message<boolean>,
):Promise<{
    response: string,
    promptTokens: number,
    completionTokens: number,
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
    where: { discord_id: messageData.author.id },
    create: { discord_id: messageData.author.id },
    update: {},
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
      where: { discord_id: messageData.author.id },
      data: {
        ai_history_openai: thread.id,
      },
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
  if (recentRun && ['queued', 'in_progress', 'requires_action'].includes(recentRun.status)) {
    log.debug(F, 'Stopping the run');
    await openAi.beta.threads.runs.cancel(thread.id, recentRun.id);

    // Wait for the run to be cancelled
    while (['queued', 'in_progress', 'requires_action'].includes(recentRun.status)) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(200);
      // eslint-disable-next-line no-await-in-loop
      recentRun = await openAi.beta.threads.runs.retrieve(thread.id, recentRun.id);
    }
  }

  // Add the message to the thread
  try {
    await openAi.beta.threads.messages.create(
      thread.id,
      messages[0],
    );
  } catch (error) {
    log.error(F, `Error sending message: ${error}`);
    return { response: (error as Error).message, promptTokens, completionTokens };
  }

  // Run the thread
  log.debug(F, `Starting new run with assistant: ${assistant.name} and thread: ${thread.id}`);
  const run = await openAi.beta.threads.runs.create(
    thread.id,
    {
      assistant_id: assistant.id,
    },
  );
  // log.debug(F, `run: ${JSON.stringify(run, null, 2)}`);

  // Wait for the run to complete
  // This is a separate function because if the run requires action, it will call the function again

  return openAiWaitForRun(run, thread, messageData);
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
    model = 'gpt-4o-mini'; // LAZY TEMP FIX
  }

  // This message list is sent to the API
  const chatCompletionMessages = [{
    role: 'system',
    content: aiPersona.prompt.concat(objectiveTruths),
  }] as OpenAI.Chat.ChatCompletionMessageParam[];
  chatCompletionMessages.push(...messages);

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
    if (responseMessage.function_call) {
      log.debug(F, `responseMessage.function_call: ${JSON.stringify(responseMessage.function_call, null, 2)}`);
      // # Step 3: call the function
      // # Note: the JSON response may not always be valid; be sure to handle errors

      const functionName = responseMessage.function_call.name;
      log.debug(F, `functionName: ${functionName}`);
      const functionToCall = availableFunctions[functionName as keyof typeof availableFunctions];
      const functionArgs = JSON.parse(responseMessage.function_call.arguments);
      const functionResponse = await functionToCall(
        functionArgs.location,
        functionArgs.unit,
      );
      log.debug(F, `functionResponse: ${JSON.stringify(functionResponse, null, 2)}`);

      // # Step 4: send the info on the function call and function response to GPT
      payload.messages.push({
        role: 'function',
        name: functionName,
        content: JSON.stringify(functionResponse),
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
  messageData: Message<boolean>,
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
    return googleAiConversation(aiPersona, messages, messageData, attachmentInfo);
  }
  // return openAiChat(aiPersona, messages, user);
  return openAiConversation(aiPersona, messages, messageData);
}

// Function to process the next message in the user's queue
async function processNextMessage(userId: string) {
  const userQueue = userQueues.get(userId);

  // If userQueue is null or undefined, exit the function immediately
  if (!userQueue) return;

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

  const {
    aiPersona, messages, messageData, attachmentInfo, resolve,
  } = nextMessage;

  try {
    // Call the aiChat function and destructure the needed response data
    const { response, promptTokens, completionTokens } = await aiChat(
      aiPersona,
      messages,
      messageData,
      attachmentInfo,
    );

    resolve({ response, promptTokens, completionTokens });
  } catch (error) {
    log.error(F, `Error processing message for user: ${userId} - error: ${error}`);
    resolve({ response: 'Error', promptTokens: 0, completionTokens: 0 });
  } finally {
    // Process the next message after this one is done
    processNextMessage(userId);
  }
}

// Main function for aiChat to handle incoming messages and return a Promise with response data
export function handleAiMessageQueue(
  aiPersona: ai_personas,
  messages: { role: 'user'; content: string }[],
  messageData: Message<boolean>,
  attachmentInfo: { url: string | null; mimeType: string | null },
): Promise<{
    response: string;
    promptTokens: number;
    completionTokens: number;
  }> {
  if (!userQueues.has(messageData.author.id)) {
    userQueues.set(messageData.author.id, { queue: [], isProcessing: false });
  }

  const userQueue = userQueues.get(messageData.author.id);

  if (!userQueue) {
    // Return a rejected promise if userQueue is undefined
    return Promise.reject(new Error(`User queue could not be initialized for user ${messageData.author.id}`));
  }

  // Push the new message data into the user's queue
  return new Promise(resolve => {
    userQueue.queue.push({
      aiPersona,
      messages,
      messageData,
      attachmentInfo,
      resolve,
    });

    // If the user is not currently processing, start processing
    if (!userQueue.isProcessing) {
      processNextMessage(messageData.author.id);
    }
  });
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
    model = 'gpt-4o-mini'; // LAZY TEMP FIX
  }
  // This message list is sent to the API
  const chatCompletionMessages = [{
    role: 'system',
    content: aiPersona.prompt.concat(''),
  }] as OpenAI.Chat.ChatCompletionMessageParam[];
  chatCompletionMessages.push(...messages);

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

  const model = 'gpt-4o-mini';
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

    response = responseMessage.content ?? 'Sorry, I\'m not sure how to respond to that.';
  }

  // log.debug(F, `response: ${response}`);

  return { response, promptTokens, completionTokens };
}
