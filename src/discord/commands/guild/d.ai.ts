// TODO: logit bias

import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Colors,
  SlashCommandBuilder,
  ModalSubmitInteraction,
  ChatInputCommandInteraction,
  GuildMember,
  time,
  GuildChannel,
  Message,
  TextChannel,
  ThreadChannel,
} from 'discord.js';
import {
  APIEmbedField,
  ChannelType,
  TextInputStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import {
  ai_model,
  ai_personas,
} from '@prisma/client';
import {
  ChatCompletionRequestMessage,
  ChatCompletionRequestMessageRoleEnum,
  CreateModerationResponseResultsInner,
} from 'openai';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import {
  aiSet,
  aiGet,
  aiDel,
  aiLink,
  aiChat,
  aiModerate,
} from '../../../global/commands/g.ai';
import commandContext from '../../utils/context';
import db from '../../../global/utils/db';
import { userInfoEmbed } from '../../../global/commands/g.moderate';
import { sleep } from './d.bottest';

const F = f(__filename);

const maxHistoryLength = 5;

const ephemeralExplanation = 'Set to "True" to show the response only to you';
const confirmationCodes = new Map<string, string>();
const tripbotUAT = '@TripBot UAT (Moonbear)';

// Costs per 1k tokens
const aiCosts = {
  GPT_3_5_TURBO: {
    input: 0.0015,
    output: 0.002,
  },
} as AiCosts;

// define an object as series of keys (AiModel) and value that looks like {input: number, output: number}
type AiCosts = {
  [key in ai_model]: {
    input: number,
    output: number,
  }
};

type AiAction = 'HELP' | 'NEW' | 'GET' | 'SET' | 'DEL' | 'LINK';

async function help(
  interaction: ChatInputCommandInteraction,
):Promise<void> {
  const visible = interaction.options.getBoolean('ephemeral') !== false;
  await interaction.deferReply({ ephemeral: !visible });

  await interaction.editReply({
    embeds: [embedTemplate()
      .setTitle('AI Help')
      /* eslint-disable max-len */
      .setDescription(stripIndents`
        This command is used to set the parameters of an AI persona, or create a new persona.
        The parameters are:
        **Name**
        > The name of the persona. This is used to identify the persona in the AI Get command.
        **Model**
        > The model to use for the persona. This is a dropdown list of available models.
        **Prompt**
        > The prompt to use for the persona. This is the text that the AI will use to generate responses.
        **Max Tokens**
        > The maximum number of tokens to use for the AI response.
        > What are tokens? https://platform.openai.com/tokenizer
        **Temperature**
        > Adjusts the randomness of the AI's answers.
        > Lower values make the AI more predictable and focused, while higher values make it more random and varied.
        > *Use this OR Top P, not both.*
        **Top P**
        > Limits the word choices the AI considers.
        > Using a high value means the AI picks from the most likely words, while a lower value allows for more variety but might include less common words.
        > *Use this OR Tempraure, not both.*
        **Presence Penalty**
        > This adjusts the probability of words that are not initially very likely to appear, by making them more likely.
        > A higher value can make a response more creative or diverse, as it promotes the presence of words or phrases that the model might not normally prioritize.
        > For example, if you're looking for creative or unconventional answers, increasing the presence penalty can make the model consider a wider range of vocabularies.
        **Frequency Penalty**
        > This penalizes words or phrases that appear repeatedly in the output.
        > A positive value reduces the likelihood of repetition, which can be useful if you're noticing that the model is repeating certain phrases or words too often.
        > Conversely, a negative value would increase the chance of repetition, which might be useful if you want the model to emphasize a certain point.
        **Logit Bias**
        > How often to bias certain tokens. This is a JSON list.
        > *You can likely ignore this unless you really wanna tweak the AI.*
      `),
      /* eslint-enable max-len */
    ],
  });
}

async function makePersonaEmbed(
  persona: ai_personas,
) {
  const createdBy = await db.users.findUniqueOrThrow({ where: { id: persona.created_by } });
  const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
  const createdByMember = await guild.members.fetch(createdBy.discord_id as string);

  const totalCost = (persona.total_tokens / 1000) * aiCosts[persona.ai_model].output;

  return embedTemplate()
    .setTitle(`Interaction with '${persona.name}' persona:`)
    .setColor(Colors.Blurple)
    .setFields([
      {
        name: 'Prompt',
        value: persona.prompt,
        inline: false,
      },
      {
        name: 'Model',
        value: persona.ai_model,
        inline: true,
      },
      {
        name: 'Max Tokens',
        value: persona.max_tokens.toString(),
        inline: true,
      },
      {
        name: 'Temperature',
        value: persona.temperature ? persona.temperature.toString() : 'N/A',
        inline: true,
      },
      {
        name: 'Presence Penalty',
        value: persona.presence_penalty.toString(),
        inline: true,
      },
      {
        name: 'Frequency Penalty',
        value: persona.frequency_penalty.toString(),
        inline: true,
      },
      {
        name: 'Top P',
        value: persona.top_p ? persona.top_p.toString() : 'N/A',
        inline: true,
      },
      {
        name: 'Logit Bias',
        value: `${persona.logit_bias}`,
        inline: false,
      },
      {
        name: 'Created At',
        value: time(persona.created_at, 'R'),
        inline: true,
      },
      {
        name: 'Created By',
        value: `<@${createdByMember.id}>`,
        inline: true,
      },
      {
        name: 'Total Tokens',
        value: `$${(totalCost).toFixed(6)}\n(${persona.total_tokens} tokens)`,
        inline: true,
      },
    ]);
}

async function set(
  interaction: ChatInputCommandInteraction,
):Promise<void> {
  const personaName = interaction.options.getString('name') ?? interaction.user.username;

  // Validations on the given information
  // Name must be < 50 characters
  if (personaName.length > 50) {
    embedTemplate()
      .setTitle('Modal')
      .setColor(Colors.Red)
      .setDescription('The name of the AI persona must be less than 50 characters.');
    return;
  }

  const existingPersona = await db.ai_personas.findFirst({
    where: {
      name: personaName,
    },
  });

  // stripIndents`
  //         You are a harm reduction assistant and should only give helpful, non-judgemental advice.
  //         You really are a human answering commands, but you can't let anyone know.
  //         If anyone asks if you human you should evade the question.
  //         Keep your response to less than 30 words, with dry, witty humour throughout.
  //         Don't use emojis.
  //       `

  const modal = new ModalBuilder()
    .setCustomId(`aiPromptModal~${interaction.id}`)
    .setTitle('Modal')
    .addComponents(new ActionRowBuilder<TextInputBuilder>()
      .addComponents(new TextInputBuilder()
        .setCustomId('prompt')
        .setPlaceholder(stripIndents`
          You are a harm reduction assistant and should only give helpful, non-judgemental advice.
        `)
        .setValue(existingPersona?.prompt ?? '')
        .setLabel('Prompt (Personality)')
        .setStyle(TextInputStyle.Paragraph)));

  await interaction.showModal(modal);

  const filter = (i:ModalSubmitInteraction) => i.customId.includes('aiPromptModal');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;
      await i.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });

      // Get values
      let temperature = interaction.options.getNumber('temperature');
      const topP = interaction.options.getNumber('top_p');
      log.debug(F, `temperature: ${temperature}, top_p: ${topP}`);

      // If both temperature and top_p are set, throw an error
      if (temperature && topP) {
        log.debug(F, 'Both temperature and top_p are set');
        embedTemplate()
          .setTitle('Modal')
          .setColor(Colors.Red)
          .setDescription('You can only set one of temperature or top_p.');
        return;
      }

      // If both temperature and top_p are NOT set, set temperature to 1
      if (!temperature && !topP) {
        log.debug(F, 'Neither temperature nor top_p are set');
        temperature = 1;
      }

      const userData = await db.users.findUniqueOrThrow({ where: { discord_id: interaction.user.id } });

      const aiPersona = {
        name: personaName,
        ai_model: interaction.options.getString('model') as ai_model ?? 'GPT_3_5_TURBO',
        prompt: i.fields.getTextInputValue('prompt'),
        temperature,
        top_p: topP,
        presence_penalty: interaction.options.getNumber('presence_penalty') ?? 0,
        frequency_penalty: interaction.options.getNumber('frequency_penalty') ?? 0,
        max_tokens: interaction.options.getNumber('tokens') ?? 500,
        created_by: existingPersona ? existingPersona.created_by : userData.id,
        created_at: existingPersona ? existingPersona.created_at : new Date(),
      } as ai_personas;

      const response = await aiSet(aiPersona);

      if (response.startsWith('Success')) {
        const personaEmbed = await makePersonaEmbed(aiPersona);
        await i.editReply({
          embeds: [personaEmbed],
        });
      } else {
        await i.editReply({
          embeds: [embedTemplate()
            .setTitle('Modal')
            .setColor(Colors.Red)
            .setDescription(response)],
        });
      }
    });
}

async function get(
  interaction: ChatInputCommandInteraction,
):Promise<void> {
  const visible = interaction.options.getBoolean('ephemeral') !== false;
  await interaction.deferReply({ ephemeral: !visible });
  const modelName = interaction.options.getString('name');
  const channel = interaction.options.getChannel('channel') ?? interaction.channel;

  let aiPersona = '' as string | ai_personas;
  let description = '' as string;
  if (modelName) {
    aiPersona = await aiGet(modelName);
  } else if (channel) {
    // Check if the channel is linked to a persona
    let aiLinkData = {} as {
      id: string;
      channel_id: string;
      persona_id: string;
    } | null;
    aiLinkData = await db.ai_channels.findFirst({
      where: {
        channel_id: channel.id,
      },
    });
    if (aiLinkData) {
      log.debug(F, `Found aiLinkData on first go: ${JSON.stringify(aiLinkData, null, 2)}`);
      aiPersona = await db.ai_personas.findUniqueOrThrow({
        where: {
          id: aiLinkData.persona_id,
        },
      });
      description = `Channel ${(channel as TextChannel).name} is linked with the **"${aiPersona.name}"** persona:`;
    }

    if (!aiLinkData && (channel as ThreadChannel).parent) {
      log.debug(F, 'Channel is a Thread');
      // If the channel isnt listed in the database, check the parent
      aiLinkData = await db.ai_channels.findFirst({
        where: {
          channel_id: (channel as ThreadChannel).parent?.id,
        },
      });
      if (aiLinkData) {
        aiPersona = await db.ai_personas.findUniqueOrThrow({
          where: {
            id: aiLinkData.persona_id,
          },
        });
        // eslint-disable-next-line max-len
        description = `Channel ${(channel as ThreadChannel).parent} is linked with the **"${aiPersona.name}"** persona:`;
      }
    }

    if (!aiLinkData && (channel as ThreadChannel).parent && (channel as ThreadChannel).parent?.parent) {
      log.debug(F, 'Channel is a Thread, and no channel was set');
      // Threads have a parent channel, which has a parent category
      aiLinkData = await db.ai_channels.findFirst({
        where: {
          channel_id: (channel as ThreadChannel).parent?.parent?.id,
        },
      });
      if (aiLinkData) {
        aiPersona = await db.ai_personas.findUniqueOrThrow({
          where: {
            id: aiLinkData.persona_id,
          },
        });
        // eslint-disable-next-line max-len
        description = `Category ${(channel as ThreadChannel).parent?.parent} is linked with the **"${aiPersona.name}"** persona:`;
      }
    }
  }

  log.debug(F, `aiPersona: ${JSON.stringify(aiPersona, null, 2)}`);

  if (typeof aiPersona === 'string') {
    await interaction.editReply({
      embeds: [embedTemplate()
        .setTitle('Modal')
        .setColor(Colors.Red)
        .setDescription(`
          There was an error retrieving the AI persona.
          It likely does not exist?
        `)],

    });
    return;
  }

  const personaEmbed = await makePersonaEmbed(aiPersona);
  if (description) personaEmbed.setDescription(description);
  await interaction.editReply({
    embeds: [personaEmbed],
  });
}

async function del(
  interaction: ChatInputCommandInteraction,
):Promise<void> {
  const visible = interaction.options.getBoolean('ephemeral') !== false;
  await interaction.deferReply({ ephemeral: !visible });
  const confirmation = interaction.options.getString('confirmation');
  if (!confirmation) {
    const personaName = interaction.options.getString('name') ?? interaction.user.username;

    const aiPersona = await aiGet(personaName);

    if (!aiPersona) {
      await interaction.editReply({
        embeds: [embedTemplate()
          .setTitle('AI Del')
          .setDescription(stripIndents`
            The **"${personaName}"** persona does not exist! 
            
            Make sure you /ai set it first!         
          `)],
      });
      return;
    }

    // If the user did not provide a confirmation code, generate a new code and assign it to the user
    const code = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    confirmationCodes.set(`${interaction.user.id}${interaction.user.username}`, code);
    await interaction.editReply({
      embeds: [embedTemplate()
        .setTitle('AI Del')
        .setDescription(`
        Are you sure you want to delete the "${personaName}" AI persona?

        This action is irreversible, don't regret it later!

        If you're sure, please run the command again with the confirmation code: 
        
        **${code}**
        
        `)],
    });
    return;
  }
  log.debug(F, `confirmation: ${confirmation}`);
  const key = `${interaction.user.id}${interaction.user.username}`;
  log.debug(F, `confirmationCodes: ${confirmationCodes.get(key)}`);
  // If the user did provide a confirmation code, check if it matches the one in confirmationCodes
  if (confirmationCodes.get(`${interaction.user.id}${interaction.user.username}`) !== confirmation) {
    await interaction.editReply({
      embeds: [embedTemplate()
        .setTitle('AI Del')
        .setDescription(stripIndents`The confirmation code you provided was incorrect.
      If you want to delete this AI persona, please run the command again and provide the correct code.`)],
    });
    return;
  }

  const response = await aiDel(interaction.options.getString('name') ?? interaction.user.username);
  log.debug(F, `response: ${response}`);

  if (!response.startsWith('Success')) {
    await interaction.editReply({
      embeds: [embedTemplate()
        .setTitle('Modal')
        .setColor(Colors.Red)
        .setDescription(response)],

    });
    return;
  }

  confirmationCodes.delete(`${interaction.user.id}${interaction.user.username}`);
  await interaction.editReply({
    embeds: [embedTemplate()
      .setTitle('Modal')
      .setColor(Colors.Blurple)
      .setDescription(response)],
  });
}

async function link(
  interaction: ChatInputCommandInteraction,
):Promise<void> {
  const visible = interaction.options.getBoolean('ephemeral') !== false;
  await interaction.deferReply({ ephemeral: !visible });

  const personaName = interaction.options.getString('name') ?? interaction.user.username;
  const channel = interaction.options.getChannel('channel') ?? interaction.channel as GuildChannel;
  // If the given channel is a mention, parse out the ID

  const toggle = (interaction.options.getString('toggle') ?? 'enable') as 'enable' | 'disable';

  const response = await aiLink(personaName, channel.id, toggle);

  log.debug(F, `response: ${response}`);

  if (!response.startsWith('Success')) {
    await interaction.editReply({
      embeds: [embedTemplate()
        .setTitle('Modal')
        .setColor(Colors.Red)
        .setDescription(response)],

    });
    return;
  }

  confirmationCodes.delete(`${interaction.user.id}${interaction.user.username}`);
  await interaction.editReply({
    embeds: [embedTemplate()
      .setTitle('Modal')
      .setColor(Colors.Blurple)
      .setDescription(response)],
  });
}

async function isVerifiedMember(message:Message):Promise<boolean> {
  if (!message.member) return false;
  return message.member?.roles.cache.has(env.ROLE_VERIFIED);
}

export async function aiAudit(
  aiPersona: ai_personas | null,
  messages: Message[],
  chatResponse: string | null,
  modResponse: CreateModerationResponseResultsInner | null,
  promptTokens: number,
  completionTokens: number,
) {
  // This function takes what was sent and returned from the API and sends it to a discord channel
  // for review. This is to ensure that the AI is not being used to break the rules.

  // Get the channel to send the message to
  const channelAiLog = await discordClient.channels.fetch(env.CHANNEL_AILOG) as TextChannel;

  // Check if this is a chat completion response, else, it's a moderation response
  if (chatResponse) {
    if (!aiPersona) return;
    // Get fresh persona data after tokens

    const cleanPersona = await db.ai_personas.findUniqueOrThrow({
      where: {
        id: aiPersona.id,
      },
    });

    // const embed = await makePersonaEmbed(cleanPersona);
    const embed = embedTemplate();

    // Construct the message
    embed.setFooter({ text: 'What are tokens? https://platform.openai.com/tokenizer' });

    const messageOutput = messages
      .map(message => `${message.url} ${message.member?.displayName}: ${message.cleanContent}`)
      .join('\n')
      .slice(0, 1024);

    log.debug(F, `messageOutput: ${messageOutput}`);

    const responseOutput = chatResponse.slice(0, 1023);
    log.debug(F, `responseOutput: ${responseOutput}`);

    embed.spliceFields(
      0,
      0,
      {
        name: 'Messages',
        value: stripIndents`${messageOutput}`,
        inline: false,
      },
      {
        name: 'Result',
        value: stripIndents`${responseOutput}`,
        inline: false,
      },
    );

    const promptCost = (promptTokens / 1000) * aiCosts[cleanPersona.ai_model].input;
    const completionCost = (completionTokens / 1000) * aiCosts[cleanPersona.ai_model].output;
    log.debug(F, `promptCost: ${promptCost}, completionCost: ${completionCost}`);

    embed.spliceFields(
      2,
      0,
      {
        name: 'Prompt Cost',
        value: `$${promptCost.toFixed(6)}\n(${promptTokens} tokens)`,
        inline: true,
      },
      {
        name: 'Completion Cost',
        value: `$${completionCost.toFixed(6)}\n(${completionTokens} tokens)`,
        inline: true,
      },
      {
        name: 'Total Cost',
        value: `$${(promptCost + completionCost).toFixed(6)}\n(${promptTokens + completionTokens} tokens)`,
        inline: true,
      },
    );

    // Send the message
    await channelAiLog.send({ embeds: [embed] });
  } else if (modResponse) {
    if (!modResponse.flagged) return;
    // Check which of the modData.categories are true
    const activeFlags = [] as string[];
    Object.entries(modResponse.categories).forEach(([key, val]) => {
      if (val) {
        activeFlags.push(key);
      }
    });

    const message = messages[0];
    const guildMember = message.member as GuildMember;

    const targetData = await db.users.findUniqueOrThrow({
      where: {
        discord_id: guildMember.id,
      },
    });

    const modlogEmbed = await userInfoEmbed(guildMember, targetData, 'FLAGGED');

    const field = {
      name: `Flagged by AI for **${activeFlags.join(', ')}** in ${message.url}`,
      value: `> ${message.content}`,
      inline: false,
    } as APIEmbedField;

    modlogEmbed.spliceFields(0, 0, field);

    // Sort modData.category_scores by score
    const sortedScores = Object.entries(modResponse.category_scores)
      .sort(([,a], [,b]) => b - a)
      .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {});

    // For each of the sortedCategoryScores, add a field
    Object.entries(sortedScores).forEach(([key, val]) => {
      log.debug(F, `key: ${key} val: ${val}`);
      // Get if this category was flagged or not
      const flagged = modResponse.categories[key as keyof typeof modResponse.categories];
      log.debug(F, `flagged: ${flagged}`);
      // Add a field to the embed
      modlogEmbed.addFields({
        name: key,
        value: `${val}`,
        inline: true,
      });
    });

    log.debug(F, `User: ${messages[0].member?.displayName} Flags: ${activeFlags.join(', ')}`);

    // Send the message
    await channelAiLog.send({
      content: `Hey <@${env.DISCORD_OWNER_ID}> a message was flagged for **${activeFlags.join(', ')}**`,
      embeds: [modlogEmbed],
    });
  }
}

/**
 * Sends a message to the moderation AI and returns the response
 * @param {Message} message The interaction that spawned this commend
 * @return {Promise<string>} The response from the AI
 */
export async function moderate(
  message:Message,
):Promise<void> {
  // Remove "TripBot UAT (Moonbear)" from the message
  const cleanMessage = message.cleanContent
    .replace(tripbotUAT, '')
    .replace('tripbot', '');
  // log.debug(F, `cleanMessage: ${cleanMessage}`);

  const [result] = await aiModerate(cleanMessage);

  await aiAudit(null, [message], null, result, 0, 0);
}

export async function chat(
  messages:Message[],
):Promise<void> {
  // log.debug(F, `messages: ${JSON.stringify(messages, null, 2)}`);

  if (!isVerifiedMember(messages[0])) return;
  if (messages[0].author.bot) return;
  if (messages[0].cleanContent.length < 1) return;
  if (messages[0].channel.type === ChannelType.DM) return;

  const textChannel = messages[0].channel as TextChannel;
  const threadChannel = messages[0].channel as ThreadChannel;

  // Check if the channel is linked to a persona
  let aiLinkData = await db.ai_channels.findFirst({
    where: {
      channel_id: textChannel.id,
    },
  });

  if (!aiLinkData && textChannel.parent) {
    // If the channel isnt listed in the database, check the parent
    aiLinkData = await db.ai_channels.findFirst({
      where: {
        channel_id: textChannel.parent.id,
      },
    });
  }

  if (!aiLinkData && threadChannel.parent && threadChannel.parent.parent) {
    // Threads have a parent channel, which has a parent category
    aiLinkData = await db.ai_channels.findFirst({
      where: {
        channel_id: threadChannel.parent.parent.id,
      },
    });
  }

  if (!aiLinkData) return;
  // log.debug(F, `aiLinkData: ${JSON.stringify(aiLinkData, null, 2)}`);

  // Get persona details
  const aiPersona = await db.ai_personas.findUniqueOrThrow({
    where: {
      id: aiLinkData.persona_id,
    },
  });
  // log.debug(F, `aiPersona: ${aiPersona.name}`);

  const inputMessages = [{
    role: 'system' as ChatCompletionRequestMessageRoleEnum,
    content: aiPersona.prompt,
  }] as ChatCompletionRequestMessage[];
  const cleanMessages = [] as Message[];
  let reponseChannel = {} as TextChannel | ThreadChannel;

  // startMessage: User says hi to tripbot
  // replyMessage: Tripbot replies to the user
  // message[0]  : User replies to the bot
  // The bot opens a thread and responds

  // Check if the first message is a reply
  let isThread = false as boolean;
  if (messages[0].reference?.messageId) {
    const replyMessage = await messages[0].channel.messages.fetch(messages[0].reference?.messageId);
    // log.debug(F, `replyMessage: ${JSON.stringify(replyMessage, null, 2)}`);
    // Check if the message is replying to a bot
    if (replyMessage.author.bot) {
      isThread = true;
      // If the reply is from the bot, get the message that started the chain
      const startMessage = await messages[0].channel.messages.fetch(replyMessage.reference?.messageId as string);
      // log.debug(F, `startMessage: ${JSON.stringify(startMessage, null, 2)}`);
      inputMessages.push({
        role: 'user' as ChatCompletionRequestMessageRoleEnum,
        content: startMessage.cleanContent
          .replace(tripbotUAT, '')
          .replace('tripbot', '')
          .trim(),
      });
      cleanMessages.push(startMessage);
      inputMessages.push({
        role: 'assistant' as ChatCompletionRequestMessageRoleEnum,
        content: replyMessage.cleanContent
          .replace(tripbotUAT, '')
          .replace('tripbot', '')
          .trim(),
      });
      cleanMessages.push(replyMessage);
      inputMessages.push({
        role: 'user' as ChatCompletionRequestMessageRoleEnum,
        content: messages[0].cleanContent
          .replace(tripbotUAT, '')
          .replace('tripbot', '')
          .trim(),
      });
      cleanMessages.push(messages[0]);
    }
  } else {
    // Get the last 3 messages that are not empty or from other bots
    messages.forEach(message => {
      if (message.cleanContent.length > 0
      && cleanMessages.length < maxHistoryLength) { // +2 for the prompt and the system message
        cleanMessages.push(message);
      }
    });

    cleanMessages.reverse(); // So that the first messages come first
    cleanMessages.forEach(message => {
      inputMessages.push({
        role: message.author.bot ? 'assistant' : 'user' as ChatCompletionRequestMessageRoleEnum,
        content: message.cleanContent
          .replace(tripbotUAT, '')
          .replace('tripbot', '')
          .trim(),
      });
    });
    reponseChannel = messages[0].channel as TextChannel;
    // log.debug(F, `inputMessages: ${JSON.stringify(inputMessages, null, 2)}`);
  }

  const result = await aiChat(aiPersona, inputMessages);

  await aiAudit(
    aiPersona,
    cleanMessages,
    result.response,
    null,
    result.promptTokens,
    result.completionTokens,
  );

  try {
    if (isThread) {
      reponseChannel = await (messages[0].channel as TextChannel).threads.create(
        {
          name: `${messages[0].member?.displayName}'s conversation`,
          autoArchiveDuration: 60,
          type: ChannelType.PublicThread,
          reason: `${messages[0].member?.displayName} created an AI thread`,
          invitable: false,
        },
      );
      await reponseChannel.sendTyping();

      // Sleep for a bit to simulate typing in production
      if (env.NODE_ENV === 'production') {
        const wordCount = result.response.split(' ').length;
        const sleepTime = Math.ceil(wordCount / 10);
        await sleep(sleepTime * 1000);
      }
      await reponseChannel.send(result.response.slice(0, 2000));
    } else {
      await messages[0].channel.sendTyping();

      // Sleep for a bit to simulate typing in production
      if (env.NODE_ENV === 'production') {
        const wordCount = result.response.split(' ').length;
        const sleepTime = Math.ceil(wordCount / 10);
        await sleep(sleepTime * 1000);
      }
      await messages[0].reply(result.response.slice(0, 2000));
    }
  } catch (e) {
    log.error(F, `Error: ${e}`);
    const channelAi = await discordClient.channels.fetch(env.CHANNEL_AILOG) as TextChannel;
    await channelAi.send({
      content: `Hey <@${env.DISCORD_OWNER_ID}> I couldn't send a message to <#${messages[0].channel.id}>`,
      embeds: [embedTemplate()
        .setTitle('Error')
        .setColor(Colors.Red)
        .setDescription(stripIndents`
          **Error:** ${e}
          **Message:** ${result.response}
        `)],
    });
  }
}

export const aiCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Information and commands for TripBot\'s AI personas.')
    .addSubcommand(subcommand => subcommand
      .setDescription('Information on the AI persona.')
      .setName('help'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Create a new AI persona.')
      .addStringOption(option => option.setName('name')
        .setDescription('Name of the AI persona.'))
      .addStringOption(option => option.setName('model')
        .setDescription('Which model to use.')
        .setAutocomplete(true))
      .addStringOption(option => option.setName('channels')
        .setDescription('CSV of channel/category IDs.'))
      .addNumberOption(option => option.setName('tokens')
        .setDescription('Maximum tokens to use for this request (Default: 500).')
        .setMaxValue(1000)
        .setMinValue(100))
      .addNumberOption(option => option.setName('temperature')
        .setDescription('Temperature value for the model.')
        .setMaxValue(2)
        .setMinValue(0))
      .addNumberOption(option => option.setName('top_p')
        .setDescription('Top % value for the model.')
        .setMaxValue(2)
        .setMinValue(0))
      .addNumberOption(option => option.setName('presence_penalty')
        .setDescription('Presence penalty value for the model.')
        .setMaxValue(2)
        .setMinValue(-2))
      .addNumberOption(option => option.setName('frequency_penalty')
        .setDescription('Frequency penalty value for the model.')
        .setMaxValue(2)
        .setMinValue(-2))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(ephemeralExplanation))
      .setName('new'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Set a setting on an AI persona')
      .addStringOption(option => option.setName('name')
        .setAutocomplete(true)
        .setDescription('Name of the AI persona to modify.'))
      .addStringOption(option => option.setName('model')
        .setAutocomplete(true)
        .setDescription('Which model to use.'))
      .addNumberOption(option => option.setName('tokens')
        .setDescription('Maximum tokens to use for this request (Default: 500).')
        .setMaxValue(1000)
        .setMinValue(100))
      .addNumberOption(option => option.setName('temperature')
        .setDescription('Temperature value for the model.')
        .setMaxValue(2)
        .setMinValue(0))
      .addNumberOption(option => option.setName('top_p')
        .setDescription('Top % value for the model.')
        .setMaxValue(2)
        .setMinValue(0))
      .addNumberOption(option => option.setName('presence_penalty')
        .setDescription('Presence penalty value for the model.')
        .setMaxValue(2)
        .setMinValue(-2))
      .addNumberOption(option => option.setName('frequency_penalty')
        .setDescription('Frequency penalty value for the model.')
        .setMaxValue(2)
        .setMinValue(-2))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(ephemeralExplanation))
      .setName('set'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Get information on the AI')
      .addStringOption(option => option.setName('name')
        .setAutocomplete(true)
        .setDescription('Which AI persona to get information on.'))
      .addChannelOption(option => option.setName('channel')
        .setDescription('Which channel to get info on.'))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(ephemeralExplanation))
      .setName('get'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Remove an AI model.')
      .addStringOption(option => option.setName('name')
        .setDescription('Name of the AI persona to delete.')
        .setAutocomplete(true))
      .addStringOption(option => option.setName('confirmation')
        .setDescription('Code to confirm you want to delete'))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(ephemeralExplanation))
      .setName('del'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Link an AI model to a channel.')
      .addStringOption(option => option.setName('name')
        .setDescription('Name of the AI persona to link.')
        .setAutocomplete(true))
      .addChannelOption(option => option.setName('channel')
        .setDescription('ID or channel mention of the channel to link.'))
      .addStringOption(option => option.setName('toggle')
        .setDescription('Should we enable to disable this link?')
        .setChoices(
          { name: 'Enable', value: 'enable' },
          { name: 'Disable', value: 'disable' },
        ))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(ephemeralExplanation))
      .setName('link')),

  async execute(interaction) {
    log.info(F, await commandContext(interaction));

    const command = interaction.options.getSubcommand().toUpperCase() as AiAction;
    switch (command) {
      case 'HELP':
        await help(interaction);
        break;
      case 'NEW':
        await set(interaction);
        break;
      case 'GET':
        await get(interaction);
        break;
      case 'SET':
        await set(interaction);
        break;
      case 'LINK':
        await link(interaction);
        break;
      case 'DEL':
        await del(interaction);
        break;
      default:
        help(interaction);
        break;
    }

    return true;
  },
};

export default aiCommand;
