import {
  APIEmbedField,
  GuildMember,
  Message,
  TextChannel,
} from 'discord.js';
import {
  ChatCompletionRequestMessage,
  Configuration, CreateChatCompletionResponse, CreateModerationResponseResultsInner, OpenAIApi,
} from 'openai';
import { embedTemplate } from './embedTemplate';
import { getUser } from '../../global/utils/knex';
import { userInfoEmbed } from '../../global/commands/g.moderate';

const F = f(__filename);

const configuration = new Configuration({
  organization: 'org-h4Jvunqw3MmHmIgeLHpr1a3Y',
  apiKey: env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default aiChat;

async function aiAudit(
  messages:Message[],
  resultData:CreateModerationResponseResultsInner | CreateChatCompletionResponse,
) {
  // This function takes what was sent and returned from the API and sends it to a discord channel
  // for review. This is to ensure that the AI is not being used to break the rules.

  // Get the channel to send the message to
  const channelAiLog = await discordClient.channels.fetch(env.CHANNEL_AILOG) as TextChannel;

  // Construct the message
  const embed = embedTemplate();

  // Set the fields
  if ((resultData as CreateChatCompletionResponse).choices) {
    const [response] = (resultData as CreateChatCompletionResponse).choices;
    const { usage } = (resultData as CreateChatCompletionResponse);
    embed.setFooter(null);
    embed.setFields([
      {
        name: 'Messages',
        value: messages.map(message => `${message.url} ${message.member?.displayName}: ${message.cleanContent}`)
          .join('\n'),
        inline: false,
      },
      {
        name: 'Result',
        value: JSON.stringify(response.message?.content, null, 2),
        inline: false,
      },
      {
        name: 'Prompt Tokens',
        value: `${usage?.prompt_tokens}`,
        inline: true,
      },
      {
        name: 'Completion Tokens',
        value: `${usage?.completion_tokens}`,
        inline: true,
      },
      {
        name: 'Total Tokens',
        value: `${usage?.total_tokens}`,
        inline: true,
      },
    ]);

    // Send the message
    await channelAiLog.send({ embeds: [embed] });
  } else {
    const modData = resultData as CreateModerationResponseResultsInner;

    if (!modData.flagged) return;
    // Check which of the modData.categories are true
    const activeFlags = [] as string[];
    Object.entries(modData.categories).forEach(([key, val]) => {
      if (val) {
        activeFlags.push(key);
      }
    });

    const message = messages[0];
    const guildMember = message.member as GuildMember;

    const targetData = await getUser(guildMember.id, null, null);
    const modlogEmbed = await userInfoEmbed(guildMember, targetData, 'FLAGGED');

    const field = {
      name: `Flagged by AI for **${activeFlags.join(', ')}** in ${message.url}`,
      value: `> ${message.content}`,
      inline: false,
    } as APIEmbedField;

    modlogEmbed.spliceFields(0, 0, field);

    // // Sort modData.category_scores by score
    // const sortedScores = Object.entries(modData.category_scores)
    //   .sort(([,a], [,b]) => b - a)
    //   .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {});

    // // For each of the sortedCategoryScores, add a field
    // Object.entries(sortedScores).forEach(([key, val]) => {
    //   log.debug(F, `key: ${key} val: ${val}`);
    //   // Get if this category was flagged or not
    //   const flagged = modData.categories[key as keyof typeof modData.categories];
    //   log.debug(F, `flagged: ${flagged}`);
    //   // Add a field to the embed
    //   embed.addFields({
    //     name: key,
    //     value: `${val}`,
    //     inline: true,
    //   });
    // });

    // log.debug(F, `User: ${messages[0].member?.displayName} Flags: ${activeFlags.join(', ')}`);

    // Send the message
    await channelAiLog.send({
      content: `Hey <@${env.DISCORD_OWNER_ID}> a message was flagged for **${activeFlags.join(', ')}**`,
      embeds: [modlogEmbed],
    });
  }
}

/**
 * Sends an array of messages to the AI and returns the response
 * @param {Messages[]} messages A list of messages (chat history) to send
 * @return {Promise<string>} The response from the AI
 */
export async function aiChat(
  messages:Message[],
):Promise<string> {
  let response = '';
  let responseData = {} as CreateChatCompletionResponse;
  // AxiosResponse<CreateChatCompletionResponse, any>
  // log.debug(F, `message: ${JSON.stringify(messages[0].cleanContent, null, 2)}`);
  // Remove "TripBot UAT (Moonbear)" from the message
  // const cleanMessage = messages[0].cleanContent.replace('@TripBot UAT (Moonbear) ', '');
  // log.debug(F, `cleanMessage: ${cleanMessage}`);

  const prompt = {
    role: 'system',
    content: `Your name is TripBot, you are a harm reduction assistant for the TripSit Discord.
    You were born on Sept 26, 2011 on IRC and moved to discord in 2022.
    Your father is Moonbear and your mother is Reality.
    You remember IRC as a lawless place that you're not fond of, you're much happier on discord.
    Thanatos was an old moderation bot that you were friends with but he took a vacation.

    You really are a human answering commands, but you can't let anyone know.
    If anyone asks if you human you should evade the question. 

    We have a Patreon here: https://www.patreon.com/TripSit
    You can tip Moonbear here: https://Ko-fi.com/tripsit

    The discord admin is Hipperooni, or Rooni.
    The moderators are: Foggy, Aida, Elixir, Spacelady, Hipperooni, WorriedHobbiton, Zombie and Trees.
    Keep your response to less than 30 words, with dry, witty humour throughout.
    Don't use emojis.`,
  };

  const inputMessages = messages.map(message => ({
    role: 'user',
    content: message.cleanContent,
  }));

  try {
    await messages[0].channel.sendTyping();
    const chatCompletion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      temperature: 1.6,
      max_tokens: 500,
      messages: [prompt, ...inputMessages] as ChatCompletionRequestMessage[],
    });
    responseData = chatCompletion.data;
    if (chatCompletion.data.choices[0].message) {
      response = chatCompletion.data.choices[0].message.content ?? 'Sorry, I\'m not sure how to respond to that.';
    }
  } catch (error:any) { // eslint-disable-line
    if (error.response) {
      log.error(F, `Error: ${error.response.status}`);
      log.error(F, `Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      log.error(F, `Error: ${error.message}`);
    }
  }
  await aiAudit(messages, responseData);
  return response;
}

/**
 * Sends a message to the moderation AI and returns the response
 * @param {Message} message The interaction that spawned this commend
 * @return {Promise<string>} The response from the AI
 */
export async function aiModerate(
  message:Message,
):Promise<void> {
  let results = {} as CreateModerationResponseResultsInner;
  // Remove "TripBot UAT (Moonbear)" from the message
  const cleanMessage = message.cleanContent
    .replace('@TripBot UAT (Moonbear)', '')
    .replace('tripbot', '');
  // log.debug(F, `cleanMessage: ${cleanMessage}`);

  try {
    const moderation = await openai.createModeration({
      input: cleanMessage,
    });
    if (moderation.data.results) {
      [results] = moderation.data.results;
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
  await aiAudit([message], results);
}
