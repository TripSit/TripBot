/* eslint-disable max-len */
/* eslint-disable sonarjs/no-duplicate-string */
import {
  ActionRowBuilder,
  Colors,
  SlashCommandBuilder,
  // ChatInputCommandInteraction,
  GuildMember,
  // time,
  Message,
  TextChannel,
  // ThreadChannel,
  TextBasedChannel,
  CategoryChannel,
  ForumChannel,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  EmbedBuilder,
  // APIButtonComponent,
  // APIActionRowComponent,
  // APIMessageComponentEmoji,
  Events,
  InteractionEditReplyOptions,
  ChatInputCommandInteraction,
  ChannelSelectMenuBuilder,
  StringSelectMenuBuilder,
  SelectMenuComponentOptionData,
  ChannelSelectMenuInteraction,
  StringSelectMenuInteraction,
  StringSelectMenuComponent,
  ChannelSelectMenuComponent,
  PermissionFlagsBits,
  time,
  TextInputBuilder,
  ModalBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
  MessageReaction,
  User,
  MessageReplyOptions,
} from 'discord.js';
import {
  APIInteractionDataResolvedChannel,
  ChannelType,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import {
  ai_channels,
  ai_model,
  ai_moderation,
  ai_personas,
} from '@prisma/client';
import { Run } from 'openai/resources/beta/threads/runs/runs';
import { MessageContentText } from 'openai/resources/beta/threads/messages/messages';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';
import { sleep } from '../guild/d.bottest';
import aiChat, {
  aiModerate, createMessage, getAssistant, getMessages, getThread, readRun, runThread,
} from '../../../global/commands/g.ai';
// import { modModal } from '../guild/d.moderate';
// import tripsitInfo from '../../../global/commands/g.about';

/* TODO
* conversations
* If the user starts typing again, cancel the run and wait for them to either stop typing or send a message
*/
const F = f(__filename);

// const maxHistoryLength = 3;

// const ephemeralExplanation = 'Set to "True" to show the response only to you';
// const personaDoesNotExist = 'This persona does not exist. Please create it first.';
const tripbotUAT = '@TripBot UAT (Moonbear)';

// Costs per 1k tokens
const aiCosts = {
  GPT_3_5_TURBO: {
    input: 0.0005,
    output: 0.0015,
  },
  // GPT_3_5_TURBO_1106: {
  //   input: 0.001,
  //   output: 0.002,
  // },
  GPT_4_TURBO: {
    input: 0.01,
    output: 0.03,
  },
  // GPT_4: {
  //   input: 0.03,
  //   output: 0.06,
  // },
  // GPT_4_1106_PREVIEW: {
  //   input: 0.01,
  //   output: 0.03,
  // },
  // GPT_4_1106_VISION_PREVIEW: {
  //   input: 0.01,
  //   output: 0.03,
  // },
  // DALL_E_2: {
  //   input: 0.00,
  //   output: 0.04,
  // },
  // DALL_E_3: {
  //   input: 0.00,
  //   output: 0.02,
  // },
  GEMINI_PRO: {
    input: 0.00,
    output: 0.00,
  },
  // GEMINI_PRO_VISION: {
  //   input: 0.00,
  //   output: 0.00,
  // },
  // AQA: {
  //   input: 0.00,
  //   output: 0.00,
  // },
} as {
  [key in ai_model]: {
    input: number,
    output: number,
  }
};

const buttonAiHelp = new ButtonBuilder()
  .setCustomId('AI~help')
  .setLabel('Help')
  .setEmoji('❓')
  .setStyle(ButtonStyle.Primary);

const buttonAiPersonas = new ButtonBuilder()
  .setCustomId('AI~personas')
  .setLabel('Personas')
  .setEmoji('🤖')
  .setStyle(ButtonStyle.Secondary);

const buttonAiLink = new ButtonBuilder()
  .setCustomId('AI~link')
  .setLabel('Link')
  .setEmoji('🔗')
  .setStyle(ButtonStyle.Primary);

const buttonAiUnlink = new ButtonBuilder()
  .setCustomId('AI~unlink')
  .setLabel('Unlink')
  .setEmoji('❌')
  .setStyle(ButtonStyle.Danger);

const buttonAiSetup = new ButtonBuilder()
  .setCustomId('AI~setup')
  .setLabel('Setup')
  .setEmoji('⚙️')
  .setStyle(ButtonStyle.Success);

const buttonAiAgree = new ButtonBuilder()
  .setCustomId('AI~agree')
  .setLabel('I agree')
  .setStyle(ButtonStyle.Success);

const buttonAiModify = new ButtonBuilder()
  .setCustomId('AI~modify')
  .setLabel('Modify')
  .setEmoji('🔧')
  .setStyle(ButtonStyle.Secondary);

const buttonAiNew = new ButtonBuilder()
  .setCustomId('AI~new')
  .setLabel('New')
  .setEmoji('🆕')
  .setStyle(ButtonStyle.Secondary);

const buttonAiCreate = new ButtonBuilder()
  .setCustomId('AI~create')
  .setLabel('Create')
  .setEmoji('✨')
  .setStyle(ButtonStyle.Success);

const buttonAiDelete = new ButtonBuilder()
  .setCustomId('AI~delete')
  .setLabel('Delete')
  .setEmoji('❌')
  .setStyle(ButtonStyle.Danger);

const buttonAiDeleteConfirm = new ButtonBuilder()
  .setCustomId('AI~deleteConfirm')
  .setLabel('Yes I\'m sure')
  .setEmoji('❌')
  .setStyle(ButtonStyle.Danger);

const menuAiChannels = new ChannelSelectMenuBuilder()
  .setCustomId('AI~channel')
  .setPlaceholder('Please select a channel to manage');

const menuAiPersonas = new StringSelectMenuBuilder()
  .setCustomId('AI~personaInfo')
  .setPlaceholder('Please select a persona to view.');

const menuAiPersonaSetup = new StringSelectMenuBuilder()
  .setCustomId('AI~personaSetup')
  .setPlaceholder('Please select a persona to link.');

const menuAiModels = new StringSelectMenuBuilder()
  .setCustomId('AI~model')
  .setPlaceholder('Please select a model.');

const menuAiPublic = new StringSelectMenuBuilder()
  .setCustomId('AI~public');

const termsOfService = stripIndents`
➤ I understand this 'AI' is not 'intelligent', I will not use it for any kind of drug/medical advice.
➤ The bot only responds to @ messages, the bot does not store any history or context.
➤ I cannot directly modify the bot's behavior, I can only audit the bot\'s responses, or join the TripSit guild to give feedback.
➤ I will not abuse the bot or use it to break the rules, abuse of this feature may result in a ban from using the bot entirely.
`;

async function makePersonaEmbed(
  persona: ai_personas,
) {
  log.debug(F, `makePersonaEmbed started with persona: ${JSON.stringify(persona, null, 2)}`);
  const createdBy = await db.users.findUniqueOrThrow({ where: { id: persona.created_by } });
  const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
  const createdByMember = await guild.members.fetch(createdBy.discord_id as string);

  const totalCost = (persona.total_tokens / 1000) * aiCosts[persona.ai_model].output;

  return embedTemplate()
    .setTitle(`Info on '${persona.name}' persona:`)
    .setColor(Colors.Blurple)
    .setDescription(persona.prompt)
    .setFields([
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
        name: 'Score',
        value: `👍x ${persona.upvotes.toString()} / 👎x ${persona.downvotes.toString()}`,
        inline: true,
      },
      {
        name: 'Tokens',
        value: `$${(totalCost).toFixed(6)}\n(${persona.total_tokens} tokens)`,
        inline: true,
      },
      {
        name: 'Created',
        value: `${time(persona.created_at, 'R')} by <@${createdByMember.id}>`,
        inline: true,
      },
    ]);
}

async function getLinkedChannel(
  channel: CategoryChannel | ForumChannel | APIInteractionDataResolvedChannel | TextBasedChannel,
): Promise<ai_channels | null> {
  // With the way AI personas work, they can be assigned to a category, channel, or thr ead
  // This function will check if the given channel is linked to an AI persona
  // If it is not, it will check the channel's parent; either the Category or Channel (in case of Thread)
  // If the parent isn't linked, it'll check the parent's parent; this is only for Thread channels.
  // Once a link is fount, it will return that link data
  // If no link is found, it'll return null

  // Check if the channel is linked to a persona
  let aiLinkData = await db.ai_channels.findFirst({ where: { channel_id: channel.id } });

  // If the channel isn't listed in the database, check the parent
  if (!aiLinkData && 'parent' in channel && channel.parent) {
    aiLinkData = await db.ai_channels.findFirst({ where: { channel_id: channel.parent.id } });
    // If /that/ channel doesn't exist, check the parent of the parent, this is for threads
    if (!aiLinkData && channel.parent.parent) {
      aiLinkData = await db.ai_channels.findFirst({ where: { channel_id: channel.parent.parent.id } });
    }
  }

  return aiLinkData;
}

// async function saveThreshold(
//   interaction: ButtonInteraction,
// ): Promise<void> {
//   log.debug(F, 'saveThreshold started');
//   if (!(interaction.member as GuildMember).roles.cache.has(env.DISCORD_OWNER_ID)) return;
//   const buttonID = interaction.customId;
//   log.debug(F, `buttonID: ${buttonID}`);
//   if (!interaction.guild) return;

//   const [, , category, amount] = interaction.customId.split('~');
//   const amountFloat = parseFloat(amount);

//   const buttonRows = interaction.message.components
//     .map(row => row.toJSON() as APIActionRowComponent<APIButtonComponent>);
//   // log.debug(F, `buttonRows: ${JSON.stringify(buttonRows, null, 2)}`);

//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const categoryRow = buttonRows
//     .find(row => row.components
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       .find(button => (button as any).custom_id?.includes(category))) as APIActionRowComponent<APIButtonComponent>;
//   // log.debug(F, `categoryRow: ${JSON.stringify(categoryRow, null, 2)}`);

//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const saveButton = categoryRow.components
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     .find(button => (button as any).custom_id?.includes('save')) as APIButtonComponent;

//   const labelBreakdown = (saveButton.label as string).split(' ') as string[];
//   labelBreakdown.splice(0, 1, 'Saved');
//   const newLabel = labelBreakdown.join(' ');

//   // Replace the save button with the new value
//   categoryRow.components.splice(4, 1, {
//     custom_id: `aiMod~save~${category}~${amountFloat}`,
//     label: newLabel,
//     emoji: '💾' as APIMessageComponentEmoji,
//     style: ButtonStyle.Success,
//     type: 2,
//   } as APIButtonComponent);

//   // Replace the category row with the new buttons
//   buttonRows.splice(
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     buttonRows.findIndex(row => row.components.find(button => (button as any).custom_id?.includes(category))),
//     1,
//     categoryRow,
//   );

//   const moderationData = await db.ai_moderation.upsert({
//     where: {
//       guild_id: interaction.guild.id,
//     },
//     create: {
//       guild_id: interaction.guild.id,
//     },
//     update: {},
//   });

//   const oldValue = moderationData[category as keyof typeof moderationData];

//   await db.ai_moderation.update({
//     where: {
//       guild_id: interaction.guild.id,
//     },
//     data: {
//       [category]: amountFloat,
//     },
//   });

//   // Get the channel to send the message to
//   const channelAiModLog = await discordClient.channels.fetch(env.CHANNEL_AIMOD_LOG) as TextChannel;
//   await channelAiModLog.send({
//     content: `${interaction.member} adjusted the ${category} limit from ${oldValue} to ${amountFloat}`,
//   });

//   await interaction.update({
//     components: buttonRows,
//   });
// }

// async function adjustThreshold(
//   interaction: ButtonInteraction,
// ): Promise<void> {
//   log.debug(F, 'adjustThreshold started');
//   if (!(interaction.member as GuildMember).roles.cache.has(env.DISCORD_OWNER_ID)) return;
//   // const buttonID = interaction.customId;
//   // log.debug(F, `buttonID: ${buttonID}`);

//   const [, , category, amount] = interaction.customId.split('~');
//   const amountFloat = parseFloat(amount);

//   // Go through the components on the message and find the button that has a customID that includes 'save'
//   const buttonRows = interaction.message.components
//     .map(row => row.toJSON() as APIActionRowComponent<APIButtonComponent>);
//   // log.debug(F, `buttonRows: ${JSON.stringify(buttonRows, null, 2)}`);

//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const categoryRow = buttonRows
//     .find(row => row.components
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       .find(button => (button as any).custom_id?.includes(category))) as APIActionRowComponent<APIButtonComponent>;
//   // log.debug(F, `categoryRow: ${JSON.stringify(categoryRow, null, 2)}`);

//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const saveButton = categoryRow.components
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     .find(button => (button as any).custom_id?.includes('save')) as APIButtonComponent;
//   log.debug(F, `saveButton: ${JSON.stringify(saveButton, null, 2)}`);

//   const saveValue = parseFloat((saveButton.label as string).split(' ')[3] as string);
//   log.debug(F, `saveValue: ${JSON.stringify(saveValue, null, 2)}`);

//   const newValue = saveValue + amountFloat;
//   log.debug(F, `newValue: ${JSON.stringify(newValue.toFixed(2), null, 2)}`);

//   const labelBreakdown = (saveButton.label as string).split(' ') as string[];
//   labelBreakdown.splice(3, 1, newValue.toFixed(2));
//   const newLabel = labelBreakdown.join(' ');

//   // Replace the save button with the new value
//   categoryRow.components.splice(4, 1, {
//     custom_id: `aiMod~save~${category}~${newValue}`,
//     label: newLabel,
//     emoji: '💾' as APIMessageComponentEmoji,
//     style: ButtonStyle.Primary,
//     type: 2,
//   } as APIButtonComponent);

//   // Replace the category row with the new buttons
//   buttonRows.splice(
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     buttonRows.findIndex(row => row.components.find(button => (button as any).custom_id?.includes(category))),
//     1,
//     categoryRow,
//   );

//   // const newComponentList = newRows.map(row => ActionRowBuilder.from(row));

//   await interaction.update({
//     components: buttonRows,
//   });
// }

async function aiAudit(
  aiPersona: ai_personas,
  messages: Message[],
  chatResponse: string,
  promptTokens: number,
  completionTokens: number,
) {
  // This function takes what was sent and returned from the API and sends it to a discord channel
  // for review. This is to ensure that the AI is not being used to break the rules.

  // const embed = await makePersonaEmbed(cleanPersona);

  const promptMessage = messages[messages.length - 1];
  const contextMessages = messages.slice(0, messages.length - 1);

  const embed = embedTemplate()
    .setFooter({ text: 'What are tokens? https://platform.openai.com/tokenizer' })
    // .setThumbnail(promptMessage.author.displayAvatarURL())
    .setColor(Colors.Yellow);

  const contextMessageOutput = contextMessages
    .map(message => `${message.url} ${message.member?.displayName}: ${message.cleanContent}`)
    .join('\n')
    .slice(0, 1024);

  const promptCost = (promptTokens / 1000) * aiCosts[aiPersona.ai_model].input;
  const completionCost = (completionTokens / 1000) * aiCosts[aiPersona.ai_model].output;

  const userData = await db.users.upsert({
    where: { discord_id: promptMessage.author.id },
    create: { discord_id: promptMessage.author.id },
    update: { discord_id: promptMessage.author.id },
  });

  const aiUsageData = await db.ai_usage.upsert({
    where: {
      user_id: userData.id,
    },
    create: {
      user_id: userData.id,
    },
    update: {},
  });

  try {
    embed.addFields({
      name: 'Persona',
      value: stripIndents`**${aiPersona.name} (${aiPersona.ai_model})**`,
      inline: false,
    });
  } catch (error) {
    log.error(F, `${error}`);
    log.error(F, `${JSON.stringify({
      name: 'Persona',
      value: stripIndents`**${aiPersona.name} (${aiPersona.ai_model})**`,
      inline: false,
    }, null, 2)}`);
  }

  try {
    embed.addFields({
      name: 'Context',
      value: stripIndents`${contextMessageOutput || 'No context'}`,
      inline: false,
    });
  } catch (error) {
    log.error(F, `${error}`);
    log.error(F, `${JSON.stringify({
      name: 'Context',
      value: stripIndents`${contextMessageOutput || 'No context'}`,
      inline: false,
    }, null, 2)}`);
  }

  try {
    embed.addFields({
      name: 'Prompt',
      value: stripIndents`${promptMessage.url} ${promptMessage.member?.displayName}: ${promptMessage.cleanContent}`,
      inline: false,
    });
  } catch (error) {
    log.error(F, `${error}`);
    log.error(F, `${JSON.stringify({
      name: 'Prompt',
      value: stripIndents`${promptMessage.url} ${promptMessage.member?.displayName}: ${promptMessage.cleanContent}`,
      inline: false,
    }, null, 2)}`);
  }

  try {
    embed.addFields({
      name: 'Result',
      value: stripIndents`${chatResponse.slice(0, 1023)}`,
      inline: false,
    });
  } catch (error) {
    log.error(F, `${error}`);
    log.error(F, `${JSON.stringify({
      name: 'Result',
      value: stripIndents`${chatResponse.slice(0, 1023)}`,
      inline: false,
    }, null, 2)}`);
  }

  try {
    embed.addFields({
      name: 'Chat Tokens',
      value: stripIndents`${promptTokens + completionTokens} Tokens \n($${(promptCost + completionCost).toFixed(6)})`,
      inline: true,
    });
  } catch (error) {
    log.error(F, `${error}`);
    log.error(F, `${JSON.stringify({
      name: 'Chat Tokens',
      value: stripIndents`${promptTokens + completionTokens} Tokens \n($${(promptCost + completionCost).toFixed(6)})`,
      inline: true,
    }, null, 2)}`);
  }

  try {
    embed.addFields({
      name: 'User Tokens',
      value: `${aiUsageData.tokens} Tokens\n($${((aiUsageData.tokens / 1000)
        * aiCosts[aiPersona.ai_model].output).toFixed(6)})`,
      inline: true,
    });
  } catch (error) {
    log.error(F, `${error}`);
    log.error(F, `${JSON.stringify({
      name: 'User Tokens',
      value: `${aiUsageData.tokens} Tokens\n($${((aiUsageData.tokens / 1000)
        * aiCosts[aiPersona.ai_model].output).toFixed(6)})`,
      inline: true,
    }, null, 2)}`);
  }

  try {
    embed.addFields({
      name: 'Persona Tokens',
      value: `${aiPersona.total_tokens} Tokens\n($${((aiPersona.total_tokens / 1000)
        * aiCosts[aiPersona.ai_model].output).toFixed(6)})`,
      inline: true,
    });
  } catch (error) {
    log.error(F, `${error}`);
    log.error(F, `${JSON.stringify({
      name: 'Persona Tokens',
      value: `${aiPersona.total_tokens} Tokens\n($${((aiPersona.total_tokens / 1000)
        * aiCosts[aiPersona.ai_model].output).toFixed(6)})`,
      inline: true,
    }, null, 2)}`);
  }

  // Get the channel to send the message to
  const channelAiLog = await discordClient.channels.fetch(env.CHANNEL_AILOG) as TextChannel;

  // Send the message
  await channelAiLog.send({ embeds: [embed] });
}

async function helpPage(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
):Promise<InteractionEditReplyOptions> {
  const helpButtons = new ActionRowBuilder<ButtonBuilder>();

  const userData = await db.users.upsert({
    where: { discord_id: interaction.user.id },
    create: { discord_id: interaction.user.id },
    update: {},
  });

  if (userData.ai_terms_agree) {
    helpButtons
      .addComponents(
        buttonAiSetup,
        buttonAiPersonas,
      );
  } else {
    helpButtons
      .addComponents(
        buttonAiAgree,
      );
  }

  return {
    embeds: [embedTemplate()
      .setTitle('🤖 Welcome to TripBot\'s AI Module! 🤖')
      .setDescription(`
      🌐 Experience Cutting-Edge Technology
      Dive into the world of artificial intelligence with TripBot, powered by OpenAI's Chat GPT 3.5-Turbo API. \
      This Language Learning Model (LLM) offers you the prowess of a highly advanced writing assistant, crafting sentences with ease. \
      Remember, it's intelligent but not sentient.

      🤖 Meet TripBot's Persona
      We've tailored TripBot's persona to be friendly and helpful, with a touch of quirkiness. \
      We're still trying to make this persona as helpful as possible, and **you can help us improve the AI by auditing its responses by reacting to messages with the provided thumbs.** \
      If enough people agree, we'll take note and try to improve the bot behavior.

      🚦 Important Caution
      While TripBot's AI provides impressive accuracy, it's not perfect. \
      **Please refrain from relying on it for harm reduction advice, drug dosages, combo info, or medical guidance.** \
      Consider its suggestions with a critical eye, as it may occasionally fabricate information. \
      Your judgment is paramount.

      👥 How It Works
      Simply agree to our terms, and on the next page you can enable the AI in the channels you choose. \
      Once set up, anyone can @ mention TripBot to get a response from the AI. \
      Note: "AI doesn't remember context of previous questions and doesn't store any message data" \
      It does not store any history or context, every message is treated as a new conversation. \
      However, do not expect that your conversations with the bot are private: every message sent through the bot is logged for moderation purposes.

      **Ready to get started? Please agree to the following:**
      ${termsOfService}
      `)
      .setFooter(null)],
    components: [helpButtons],
  };
}

async function deletePage(
  interaction: ButtonInteraction,
):Promise<InteractionEditReplyOptions> {
  const selectedPersona = (interaction.message.components[0].components[0] as StringSelectMenuComponent).options.find(option => option.default)?.value;

  const personaData = await db.ai_personas.findFirstOrThrow({
    where: {
      name: selectedPersona,
    },
  });

  return {
    embeds: [embedTemplate()
      .setTitle('🤖 Welcome to TripBot\'s AI Module! 🤖')
      .setDescription(`
        Are you sure you want to delete the persona ${personaData.name}? This action cannot be undone.
      `)
      .setFooter(null)],
    components: [new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        buttonAiPersonas,
        buttonAiDeleteConfirm
          .setCustomId(`AI~deleteConfirm~${selectedPersona}`),
      )],
  };
}

async function deletePersona(
  interaction: ButtonInteraction,
):Promise<InteractionEditReplyOptions> {
  log.debug(F, `Customid: ${interaction.customId}`);
  const selectedPersona = interaction.customId?.split('~')[2];

  log.debug(F, `selectedPersona: ${selectedPersona}`);

  await db.ai_personas.delete({
    where: {
      name: selectedPersona,
    },
  });

  // Get the channel to send the message to
  const channelAiLog = await discordClient.channels.fetch(env.CHANNEL_AILOG) as TextChannel;

  // Send the message
  await channelAiLog.send({
    content: `Hey <@${env.DISCORD_OWNER_ID}>, ${interaction.member} deleted the '${selectedPersona}' persona.`,
  });

  return {
    embeds: [embedTemplate()
      .setDescription(`
        Persona ${selectedPersona} has been deleted.
      `)
      .setFooter(null)],
    components: [new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        buttonAiHelp,
        buttonAiSetup,
        buttonAiPersonas,
      )],
  };
}

async function personasPage(
  interaction: ChatInputCommandInteraction | ButtonInteraction | StringSelectMenuInteraction,
):Promise<InteractionEditReplyOptions> {
  log.debug(F, 'personasPage started');
  const personaButtons = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      buttonAiHelp,
      buttonAiSetup,
    );

  const aiPersonaList = interaction.guild?.id === env.DISCORD_GUILD_ID
    ? await db.ai_personas.findMany()
    : await db.ai_personas.findMany({
      where: {
        OR: [
          { name: 'tripbot' },
        ],
      },
    });

  const aiPersonaOptions = aiPersonaList.length === 0
    ? [{
      label: 'No personas available',
      description: 'Please tell moonbear about this.',
      value: 'none',
      default: true,
    }] as SelectMenuComponentOptionData[]
    : aiPersonaList.map(persona => ({
      label: persona.name,
      value: persona.name,
    } as SelectMenuComponentOptionData));

  log.debug(F, `aiPersonaOptions: ${JSON.stringify(aiPersonaOptions, null, 2)}`);

  let selectedPersona = undefined as string | undefined;

  if (interaction.isButton() && interaction.message.components[0].components[0].customId === 'AI~personaInfo') {
    selectedPersona = (interaction.message.components[0].components[0] as StringSelectMenuComponent).options.find(option => option.default)?.value;
    log.debug(F, `selectedPersona: ${JSON.stringify(selectedPersona, null, 2)}`);
    if (selectedPersona) {
      const personaOption = aiPersonaOptions.find(persona => persona.value === selectedPersona);
      if (personaOption) {
        personaOption.default = true;
      }
    }
  }

  if (interaction.isStringSelectMenu()) {
    [selectedPersona] = interaction.values;

    log.debug(F, `selectedPersona: ${JSON.stringify(selectedPersona, null, 2)}`);
    // If it exists, make sure the aiPersonaOptions has it marked default
    if (selectedPersona) {
      const personaOption = aiPersonaOptions.find(persona => persona.value === selectedPersona);
      if (personaOption) {
        personaOption.default = true;
      }
    }
  }

  log.debug(F, `aiPersonaOptions: ${JSON.stringify(aiPersonaOptions, null, 2)}`);

  // If there's only one persona in the list, set it as the default
  // if (aiPersonaList.length === 1) {
  //   aiPersonaOptions[0].default = true;
  //   selectedPersona = aiPersonaOptions[0].value;
  // }

  // If the user is a developer in the home guild, show the buttonAiModify button
  const tripsitGuild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
  const tripsitMember = await tripsitGuild.members.fetch(interaction.user.id);

  if (selectedPersona) {
    const persona = await db.ai_personas.findFirstOrThrow({
      where: {
        name: selectedPersona,
      },
    });

    log.debug(F, 'Adding three buttons to personaButtons');
    if (tripsitMember.roles.cache.has(env.ROLE_DEVELOPER)) {
      personaButtons.addComponents(buttonAiNew, buttonAiModify, buttonAiDelete);
    }

    if (persona.public) {
      menuAiPublic.setOptions(
        {
          label: 'Not available outside of TripSit',
          value: 'private',
        },
        {
          label: 'Available outside of TripSit',
          value: 'public',
          default: true,
        },
      );
    } else {
      menuAiPublic.setOptions(
        {
          label: 'Not available outside of TripSit',
          value: 'private',
          default: true,
        },
        {
          label: 'Available outside of TripSit',
          value: 'public',
        },
      );
    }

    return {
      embeds: [await makePersonaEmbed(persona)],
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents([
          menuAiPersonas.setOptions(aiPersonaOptions),
        ]),
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents([
          menuAiPublic,
        ]),
        personaButtons,
      ],
    };
  }

  if (tripsitMember.roles.cache.has(env.ROLE_DEVELOPER)) {
    personaButtons.addComponents(buttonAiNew);
  }

  return {
    embeds: [embedTemplate()
      .setTitle('Persona Information')
      .setDescription(stripIndents` 
      A persona is a set of parameters that the AI uses to generate responses. \
      This allows us to have different 'personalities' for the AI. \
      The AI will use the persona that is linked to the channel it is responding in, and return responses based on that persona's personality.

      This menu is used to set the parameters of an AI persona, or create a new persona. The parameters are:
      **Name**
      > The name of the persona. This is used to identify the persona in the AI Get command.
      **Model**
      > The model to use for the persona. This is a dropdown list of available models.
      **Prompt**
      > The prompt to use for the persona. This is the text that the AI will use to generate responses.
      **Max Tokens**
      > The maximum number of tokens to use for the AI response.
      > What are tokens? <https://platform.openai.com/tokenizer>
      **Temperature**
      > Adjusts the randomness of the AI's answers.
      > Lower values make the AI more predictable and focused, while higher values make it more random and varied.`)
      .setFooter(null)],
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents([
        menuAiPersonas.setOptions(aiPersonaOptions),
      ]),
      personaButtons,
    ],
  };
}

async function setPublicity(
  interaction: StringSelectMenuInteraction,
):Promise<InteractionEditReplyOptions> {
  log.debug(F, 'setPublicity started');
  // log.debug(F, `components: ${JSON.stringify(interaction.message.components, null, 2)}`);
  const selectedPersona = (interaction.message.components[0].components[0] as StringSelectMenuComponent).options.find(option => option.default)?.value;
  log.debug(F, `selectedPersona: ${JSON.stringify(selectedPersona, null, 2)}`);
  const isPublic = interaction.values[0] === 'public';
  log.debug(F, `isPublic: ${isPublic}`);

  await db.ai_personas.update({
    where: {
      name: selectedPersona,
    },
    data: {
      public: isPublic,
    },
  });

  // Get the channel to send the message to
  const channelAiLog = await discordClient.channels.fetch(env.CHANNEL_AILOG) as TextChannel;

  // Send the message
  await channelAiLog.send({
    content: `Hey <@${env.DISCORD_OWNER_ID}>, ${interaction.member} set'${selectedPersona}' to ${isPublic ? 'public' : 'private'}.`,
  });

  return personasPage(interaction);
}

async function setupPage(
  interaction: ChatInputCommandInteraction | ButtonInteraction | ChannelSelectMenuInteraction | StringSelectMenuInteraction,
):Promise<InteractionEditReplyOptions> {
  log.info(F, await commandContext(interaction));
  if (!interaction.guild) return { content: 'This command only works in a server.' };
  if (!interaction.member) return { content: 'This command only works in a server.' };

  // Check if the member who did this command has the Manage Channels permission
  if (!(interaction.member as GuildMember).permissions.has(PermissionFlagsBits.ManageChannels)) return { content: 'You do not have permission to modify channels on this guild. Talk to your guild\'s admin if you feel this is a mistake.' };

  const userData = await db.users.upsert({
    where: { discord_id: interaction.user.id },
    create: { discord_id: interaction.user.id },
    update: {},
  });

  log.debug(F, `userData: ${JSON.stringify(userData, null, 2)}`);

  // If the user hasn't agreed to the terms, show them the help page so they can
  if (!userData.ai_terms_agree) return helpPage(interaction as ChatInputCommandInteraction | ButtonInteraction);

  // If this is not the home guild, only get the approved personas
  const aiPersonaList = interaction.guild?.id === env.DISCORD_GUILD_ID
    ? await db.ai_personas.findMany()
    : await db.ai_personas.findMany({
      where: {
        OR: [
          { name: 'tripbot' },
        ],
      },
    });

  // log.debug(F, `aiPersonaList: ${JSON.stringify(aiPersonaList, null, 2)}`);

  const aiPersonaOptions = aiPersonaList.length === 0
    ? [{
      label: 'No personas available',
      description: 'Please tell moonbear about this.',
      value: 'none',
      default: true,
    }] as SelectMenuComponentOptionData[]
    : aiPersonaList.map(persona => ({
      label: persona.name,
      value: persona.name,
    } as SelectMenuComponentOptionData));

  let aiLinkData = null as ai_channels | null;
  let channelSelectComponent = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents([
    menuAiChannels,
  ]);
  let selectedChannel = undefined as string | undefined;
  let selectedPersona = undefined as string | undefined;

  if (interaction.isChannelSelectMenu()) {
    log.debug(F, 'interaction is channel select menu');
    // log.debug(F, `interaction.values ${JSON.stringify(interaction.values[0], null, 2)}`);
    [selectedChannel] = interaction.values;
    selectedPersona = (interaction.message.components[1].components[0] as StringSelectMenuComponent).options.find(option => option.default)?.value;
    log.debug(F, `selectedChannel: ${JSON.stringify(selectedChannel, null, 2)}`);
    log.debug(F, `selectedPersona: ${JSON.stringify(selectedPersona, null, 2)}`);

    channelSelectComponent = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents([
      menuAiChannels.setCustomId(`AI~channel~${selectedChannel}`),
    ]);

    // Check if there is an existing link between the provided channel and a persona
    aiLinkData = await db.ai_channels.findFirst({
      where: {
        channel_id: selectedChannel,
      },
    });

    if (aiLinkData) {
      const personaData = await db.ai_personas.findUniqueOrThrow({
        where: {
          id: aiLinkData.persona_id,
        },
      });
      selectedPersona = personaData.name;
    }

    // If it exists, make sure the aiPersonaOptions has it marked default
    if (selectedPersona) {
      const personaOption = aiPersonaOptions.find(persona => persona.value === selectedPersona);
      if (personaOption) {
        personaOption.default = true;
      }
    }
  }

  if (interaction.isStringSelectMenu()) {
    log.debug(F, 'interaction is string select menu');
    // log.debug(F, `interaction.values ${JSON.stringify(interaction.values[0], null, 2)}`);
    [,,selectedChannel] = (interaction.message.components[0].components[0] as ChannelSelectMenuComponent).customId.split('~');
    [selectedPersona] = interaction.values;
    log.debug(F, `selectedChannel: ${JSON.stringify(selectedChannel, null, 2)}`);
    log.debug(F, `selectedPersona: ${JSON.stringify(selectedPersona, null, 2)}`);

    const personaOption = aiPersonaOptions.find(persona => persona.value === selectedPersona);
    if (personaOption) {
      personaOption.default = true;
    }

    aiLinkData = await db.ai_channels.findFirst({
      where: {
        channel_id: selectedChannel,
      },
    });
  }

  if (interaction.isButton()) {
    log.debug(F, 'interaction is button');

    if (interaction.message.components.length >= 3) {
      [,,selectedChannel] = (interaction.message.components[0].components[0] as ChannelSelectMenuComponent).customId.split('~');
      selectedPersona = (interaction.message.components[1].components[0] as StringSelectMenuComponent).options.find(option => option.default)?.value;

      // If it exists, make sure the aiPersonaOptions has it marked default
      if (selectedPersona) {
        const personaOption = aiPersonaOptions.find(persona => persona.value === selectedPersona);
        if (personaOption) {
          personaOption.default = true;
        }
      }

      if (selectedChannel) {
        aiLinkData = await db.ai_channels.findFirst({
          where: {
            channel_id: selectedChannel,
          },
        });
      }

      channelSelectComponent = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents([
        menuAiChannels.setCustomId(`AI~channel~${selectedChannel}`),
      ]);
    }
  }

  // If there's only one persona in the list, set it as the default
  if (aiPersonaList.length === 1) {
    aiPersonaOptions[0].default = true;
  }
  // log.debug(F, `aiPersonaOptions: ${JSON.stringify(aiPersonaOptions, null, 2)}`);

  // Logic for which buttons should appear:
  // If the 'channel' select menu is not set, don't show the buttons
  // If the 'channel' select menu is set, show the buttons
  const setupButtons = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      buttonAiHelp,
      buttonAiPersonas,
    );
  if (aiLinkData) {
    setupButtons.addComponents(
      buttonAiUnlink,
    );
  } else if (selectedChannel && selectedPersona) {
    setupButtons.addComponents(
      buttonAiLink,
    );
  }

  // Get the existing links for this guild
  const existingLinkData = await db.ai_channels.findMany({
    where: {
      guild_id: interaction.guild.id,
    },
  });
  const existingLinks = await Promise.all(existingLinkData.map(async linkData => {
    const persona = await db.ai_personas.findUniqueOrThrow({
      where: {
        id: linkData.persona_id,
      },
    });
    const channel = await discordClient.channels.fetch(linkData.channel_id) as TextChannel;
    return `<#${channel.id}> is linked with the **"${persona.name}"** persona`;
  }));

  return {
    embeds: [embedTemplate()
      .setAuthor(null)
      .setTitle(`${interaction.guild.name}'s AI Setup`)
      .setDescription(stripIndents`
        Here we can link the bot's personas to channels and categories.
        ${existingLinks.join('\n')}
      `)
      .setFooter(null)],
    components: [
      channelSelectComponent,
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents([
        menuAiPersonaSetup.setOptions(aiPersonaOptions),
      ]),
      setupButtons,
    ],
  };
}

async function createPage(
  interaction: ChatInputCommandInteraction | ButtonInteraction | StringSelectMenuInteraction,
):Promise<InteractionEditReplyOptions> {
  log.debug(F, 'createPage started');
  const createButtons = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      buttonAiHelp,
      buttonAiSetup,
      buttonAiPersonas,
    );

  const aiModelList = Object.keys(ai_model).map(model => ({ name: model }));

  const aiModelOptions = aiModelList.map(model => ({
    label: model.name,
    value: model.name,
  } as SelectMenuComponentOptionData));

  log.debug(F, `aiModelOptions: ${JSON.stringify(aiModelOptions, null, 2)}`);

  let selectedModel = undefined as string | undefined;
  if (interaction.isStringSelectMenu()) {
    [selectedModel] = interaction.values;

    log.debug(F, `selectedModel: ${JSON.stringify(selectedModel, null, 2)}`);
    // If it exists, make sure the aiPersonaOptions has it marked default
    if (selectedModel) {
      const modelOption = aiModelOptions.find(model => model.value === selectedModel);
      if (modelOption) {
        modelOption.default = true;
      }
    }
  }

  log.debug(F, `aiModelOptions: ${JSON.stringify(aiModelOptions, null, 2)}`);

  if (selectedModel) {
    createButtons.addComponents(buttonAiCreate);
  }

  return {
    embeds: [embedTemplate()
      .setTitle('New Persona')
      .setDescription(stripIndents` 
        This page will create help create a new persona for the AI.

        Select the model you want to use below, then click the create button.

        You'll be able to fill in parameters for the new persona on the modal that appears.

        For explanations on the parameters, check the /ai peronsas command.
      `)
      .setFooter(null)],
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents([
        menuAiModels.setOptions(aiModelOptions),
      ]),
      createButtons,
    ],
  };
}

async function link(
  interaction: ButtonInteraction,
):Promise<InteractionEditReplyOptions> {
  log.info(F, await commandContext(interaction));
  if (!interaction.guild) return { content: 'This command only works in a server.' };

  const [,,selectedChannel] = (interaction.message.components[0].components[0] as ChannelSelectMenuComponent).customId.split('~');
  const selectedPersona = (interaction.message.components[1].components[0] as StringSelectMenuComponent).options.find(option => option.default)?.value;
  log.debug(F, `selectedChannel: ${selectedChannel}`);
  log.debug(F, `selectedPersona: ${selectedPersona}`);

  const personaData = await db.ai_personas.findUniqueOrThrow({
    where: {
      name: selectedPersona,
    },
  });

  const aiLinkData = await db.ai_channels.findFirst({
    where: {
      channel_id: selectedChannel,
    },
  });

  const guildData = await db.discord_guilds.upsert({
    where: { id: interaction.guild.id },
    create: { id: interaction.guild.id },
    update: {},
  });

  const verb = aiLinkData ? 'updated' : 'created';

  await db.ai_channels.upsert({
    where: {
      channel_id_persona_id: {
        channel_id: selectedChannel,
        persona_id: personaData.id,
      },
    },
    create: {
      channel_id: selectedChannel,
      persona_id: personaData.id,
      guild_id: guildData.id,
    },
    update: {
      channel_id: selectedChannel,
      persona_id: personaData.id,
      guild_id: guildData.id,
    },
  });

  const channelAiLog = await discordClient.channels.fetch(env.CHANNEL_AILOG) as TextChannel;
  await channelAiLog.send({
    content: `AI link between ${selectedPersona} and <#${selectedChannel}> on the ${interaction.guild.name} server ${verb} (<@${env.DISCORD_OWNER_ID}>)`,
  });

  return setupPage(interaction);
}

async function unlink(
  interaction: ButtonInteraction,
):Promise<InteractionEditReplyOptions> {
  log.info(F, await commandContext(interaction));
  if (!interaction.guild) return { content: 'This command only works in a server.' };

  const [,,selectedChannel] = (interaction.message.components[0].components[0] as ChannelSelectMenuComponent).customId.split('~');
  const selectedPersona = (interaction.message.components[1].components[0] as StringSelectMenuComponent).options.find(option => option.default)?.value;
  log.debug(F, `selectedChannel: ${JSON.stringify(selectedChannel, null, 2)}`);
  log.debug(F, `selectedPersona: ${JSON.stringify(selectedPersona, null, 2)}`);

  const aiLinkData = await db.ai_channels.findFirstOrThrow({
    where: {
      channel_id: selectedChannel,
    },
  });

  const verb = 'deleted';

  await db.ai_channels.delete({
    where: {
      id: aiLinkData.id,
    },
  });

  const channelAiLog = await discordClient.channels.fetch(env.CHANNEL_AILOG) as TextChannel;
  await channelAiLog.send({
    content: `AI link between ${selectedPersona} and <#${selectedChannel}> on the ${interaction.guild.name} server ${verb} (<@${env.DISCORD_OWNER_ID}>)`,
  });

  return setupPage(interaction);
}

async function createPersona(
  interaction: ButtonInteraction,
):Promise<void> {
  log.info(F, await commandContext(interaction));
  if (!interaction.guild) {
    await interaction.reply({ content: 'This command only works in a server.' });
    return;
  }

  const selectedModel = (interaction.message.components[0].components[0] as StringSelectMenuComponent).options.find(option => option.default)?.value;
  log.debug(F, `selectedModel: ${JSON.stringify(selectedModel, null, 2)}`);

  // const personaButtons = new ActionRowBuilder<ButtonBuilder>()
  //   .addComponents(
  //     buttonAiHelp,
  //     buttonAiPersonas,
  //     buttonAiNew,
  //   );

  await interaction.showModal(new ModalBuilder()
    .setCustomId(`aiPromptModal~${interaction.id}`)
    .setTitle('Modal')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(new TextInputBuilder()
          .setCustomId('name')
          .setPlaceholder(stripIndents`TripBot V3`)
          .setValue(stripIndents`TripBot V3`)
          .setLabel('Unique name for your persona')
          .setMinLength(3)
          .setStyle(TextInputStyle.Short)),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(new TextInputBuilder()
          .setCustomId('description')
          .setPlaceholder(stripIndents`A helpful and friendly persona.`)
          .setValue(stripIndents`A helpful and friendly persona.`)
          .setLabel('Describe your persona')
          .setMinLength(10)
          .setStyle(TextInputStyle.Short)),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(new TextInputBuilder()
          .setCustomId('temperature')
          .setPlaceholder(stripIndents`1.3 is a decent value.`)
          .setValue('1.3')
          .setLabel('Set the temperature value, 0.0-2.0')
          .setMinLength(1)
          .setMaxLength(3)
          .setStyle(TextInputStyle.Short)),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(new TextInputBuilder()
          .setCustomId('tokens')
          .setPlaceholder(stripIndents`500 is default`)
          .setValue('500')
          .setLabel('Set allowed token usage')
          .setMinLength(1)
          .setMaxLength(5)
          .setStyle(TextInputStyle.Short)),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(new TextInputBuilder()
          .setCustomId('prompt')
          .setPlaceholder(stripIndents`
            You are a harm reduction assistant and should only give helpful, non-judgemental advice.
          `)
          .setValue(stripIndents`
            You are a harm reduction assistant and should only give helpful, non-judgemental advice.
          `)
          .setLabel('Prompt (Personality)')
          .setStyle(TextInputStyle.Paragraph)),
    ));

  const filter = (i:ModalSubmitInteraction) => i.customId.includes('aiPromptModal');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;
      if (!i.isModalSubmit()) return;
      if (!i.isFromMessage()) return;
      // await i.deferUpdate();

      const personaName = i.fields.getTextInputValue('name');
      const temperature = parseFloat(i.fields.getTextInputValue('temperature'));
      // if temperature is outside of 0.0 - 2.0, tell the user and return
      if (temperature < 0.0 || temperature > 2.0) {
        await i.editReply({
          embeds: [embedTemplate()
            .setTitle('Modal')
            .setColor(Colors.Red)
            .setDescription('Temperature must be between 0.0 and 2.0')],
        });
        return;
      }

      const maxTokens = parseInt(i.fields.getTextInputValue('tokens'), 10);
      // If maxTokens is outside of 1 - 2048, tell the user and return
      if (maxTokens < 1 || maxTokens > 2048) {
        await i.editReply({
          embeds: [embedTemplate()
            .setTitle('Modal')
            .setColor(Colors.Red)
            .setDescription('Max Tokens must be between 1 and 2048')],
        });
        return;
      }

      const description = i.fields.getTextInputValue('description');
      const prompt = i.fields.getTextInputValue('prompt');

      const alreadyExists = await db.ai_personas.findFirst({
        where: {
          name: personaName,
        },
      });

      // If the persona name already exists, tell the user and return
      if (alreadyExists) {
        await i.editReply({
          embeds: [embedTemplate()
            .setTitle('Modal')
            .setColor(Colors.Red)
            .setDescription('A persona with that name already exists')],
        });
        return;
      }

      const userData = await db.users.upsert({
        where: { discord_id: interaction.user.id },
        create: { discord_id: interaction.user.id },
        update: { discord_id: interaction.user.id },
      });

      const aiPersona = await db.ai_personas.create({
        data: {
          name: personaName,
          ai_model: selectedModel as ai_model,
          description,
          prompt,
          temperature,
          top_p: null,
          presence_penalty: 0,
          frequency_penalty: 0,
          max_tokens: maxTokens,
          logit_bias: null,
          total_tokens: 0,
          created_by: userData.id,
          created_at: new Date(),
        },
      });

      await i.update({
        embeds: [embedTemplate()
          .setTitle('Modal')
          .setColor(Colors.Green)
          .setDescription(`Success! ${personaName} has been created! You can now link it to a channel.`)],
      });

      const channelAiLog = await interaction.guild?.channels.fetch(env.CHANNEL_AILOG) as TextChannel;
      await channelAiLog.send({
        content: `Hey <@${env.DISCORD_OWNER_ID}>, ${interaction.user.username} created the ${personaName} AI Persona!`,
        embeds: [embedTemplate()
          .setTitle('AI Persona')
          .setColor(Colors.Blurple)
          .setDescription(stripIndents`${JSON.stringify(aiPersona, null, 2)}`)],
      });
    });
}

async function modifyPersona(
  interaction: ButtonInteraction,
):Promise<void> {
  log.info(F, await commandContext(interaction));
  if (!interaction.guild) {
    await interaction.reply({ content: 'This command only works in a server.' });
    return;
  }

  const selectedPersona = (interaction.message.components[0].components[0] as StringSelectMenuComponent).options.find(option => option.default)?.value;
  log.debug(F, `selectedPersona: ${JSON.stringify(selectedPersona, null, 2)}`);

  const persona = await db.ai_personas.findUniqueOrThrow({
    where: {
      name: selectedPersona,
    },
  });

  await interaction.showModal(new ModalBuilder()
    .setCustomId(`aiPromptModal~${interaction.id}`)
    .setTitle('Modal')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(new TextInputBuilder()
          .setCustomId('name')
          .setPlaceholder(stripIndents`TripBot V3`)
          .setValue(persona.name)
          .setLabel('Unique name for your persona')
          .setMinLength(3)
          .setStyle(TextInputStyle.Short)),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(new TextInputBuilder()
          .setCustomId('description')
          .setPlaceholder(stripIndents`A helpful and friendly persona.`)
          .setValue(persona.description ?? '')
          .setLabel('Describe your persona')
          .setMinLength(10)
          .setStyle(TextInputStyle.Short)),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(new TextInputBuilder()
          .setCustomId('temperature')
          .setPlaceholder(stripIndents`1.3 is a decent value.`)
          .setValue(persona.temperature?.toString() ?? '1.3')
          .setLabel('Set the temperature value, 0.0-2.0')
          .setMinLength(1)
          .setMaxLength(3)
          .setStyle(TextInputStyle.Short)),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(new TextInputBuilder()
          .setCustomId('tokens')
          .setPlaceholder(stripIndents`500 is default`)
          .setValue(persona.max_tokens.toString())
          .setLabel('Set allowed token usage')
          .setMinLength(1)
          .setMaxLength(5)
          .setStyle(TextInputStyle.Short)),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(new TextInputBuilder()
          .setCustomId('prompt')
          .setPlaceholder(stripIndents`
            You are a harm reduction assistant and should only give helpful, non-judgemental advice.
          `)
          .setValue(persona.prompt)
          .setLabel('Prompt (Personality)')
          .setStyle(TextInputStyle.Paragraph)),
    ));

  const filter = (i:ModalSubmitInteraction) => i.customId.includes('aiPromptModal');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;
      if (!i.isModalSubmit()) return;
      if (!i.isFromMessage()) return;
      // await i.deferUpdate();

      const personaName = i.fields.getTextInputValue('name');
      const temperature = parseFloat(i.fields.getTextInputValue('temperature'));
      // if temperature is outside of 0.0 - 2.0, tell the user and return
      if (temperature < 0.0 || temperature > 2.0) {
        await i.editReply({
          embeds: [embedTemplate()
            .setTitle('Modal')
            .setColor(Colors.Red)
            .setDescription('Temperature must be between 0.0 and 2.0')],
        });
        return;
      }

      const maxTokens = parseInt(i.fields.getTextInputValue('tokens'), 10);
      // If maxTokens is outside of 1 - 2048, tell the user and return
      if (maxTokens < 1 || maxTokens > 2048) {
        await i.editReply({
          embeds: [embedTemplate()
            .setTitle('Modal')
            .setColor(Colors.Red)
            .setDescription('Max Tokens must be between 1 and 2048')],
        });
        return;
      }

      const description = i.fields.getTextInputValue('description');
      const prompt = i.fields.getTextInputValue('prompt');

      const userData = await db.users.upsert({
        where: { discord_id: interaction.user.id },
        create: { discord_id: interaction.user.id },
        update: { discord_id: interaction.user.id },
      });

      const aiPersona = await db.ai_personas.update({
        where: {
          id: persona.id,
        },
        data: {
          name: personaName,
          ai_model: persona.ai_model as ai_model,
          description,
          prompt,
          temperature,
          top_p: null,
          presence_penalty: 0,
          frequency_penalty: 0,
          max_tokens: maxTokens,
          logit_bias: null,
          total_tokens: 0,
          created_by: userData.id,
          created_at: new Date(),
        },
      });

      // await i.update({
      //   embeds: [embedTemplate()
      //     .setTitle('Modal')
      //     .setColor(Colors.Green)
      //     .setDescription(`Success! ${personaName} has been modified!`)],
      // });

      await i.update(await personasPage(interaction));

      const channelAiLog = await interaction.guild?.channels.fetch(env.CHANNEL_AILOG) as TextChannel;
      await channelAiLog.send({
        content: `Hey <@${env.DISCORD_OWNER_ID}>, ${interaction.user.username} modified the ${personaName} AI Persona!`,
        embeds: [embedTemplate()
          .setTitle('AI Persona')
          .setColor(Colors.Blurple)
          .setDescription(stripIndents`${JSON.stringify(aiPersona, null, 2)}`)],
      });
    });
}

// async function mod(
//   interaction: ChatInputCommandInteraction,
// ):Promise<void> {
//   // .addSubcommand(subcommand => subcommand
//   //   .setDescription('Change moderation parameters.')
//   //   .addNumberOption(option => option.setName('harassment')
//   //     .setDescription('Set harassment limit.'))
//   //   .addNumberOption(option => option.setName('harassment_threatening')
//   //     .setDescription('Set harassment_threatening limit.'))
//   //   .addNumberOption(option => option.setName('hate')
//   //     .setDescription('Set hate limit.'))
//   //   .addNumberOption(option => option.setName('hate_threatening')
//   //     .setDescription('Set hate_threatening limit.'))
//   //   .addNumberOption(option => option.setName('self_harm')
//   //     .setDescription('Set self_harm limit.'))
//   //   .addNumberOption(option => option.setName('self_harm_instructions')
//   //     .setDescription('Set self_harm_instructions limit.'))
//   //   .addNumberOption(option => option.setName('self_harm_intent')
//   //     .setDescription('Set self_harm_intent limit.'))
//   //   .addNumberOption(option => option.setName('sexual')
//   //     .setDescription('Set sexual limit.'))
//   //   .addNumberOption(option => option.setName('sexual_minors')
//   //     .setDescription('Set sexual_minors limit.'))
//   //   .addNumberOption(option => option.setName('violence')
//   //     .setDescription('Set violence limit.'))
//   //   .addNumberOption(option => option.setName('violence_graphic')
//   //     .setDescription('Set violence_graphic limit.'))
//   //   .setName('mod')),

//   if (!interaction.guild) return;
//   await interaction.deferReply({ ephemeral: true });

//   const moderationData = await db.ai_moderation.upsert({
//     where: {
//       guild_id: interaction.guild.id,
//     },
//     create: {
//       guild_id: interaction.guild.id,
//     },
//     update: {},
//   });

//   await db.ai_moderation.update({
//     where: {
//       guild_id: interaction.guild.id,
//     },
//     data: {
//       harassment: interaction.options.getNumber('harassment') ?? moderationData.harassment,
//       harassment_threatening: interaction.options.getNumber('harassment_threatening') ?? moderationData.harassment_threatening,
//       hate: interaction.options.getNumber('hate') ?? moderationData.hate,
//       hate_threatening: interaction.options.getNumber('hate_threatening') ?? moderationData.hate_threatening,
//       self_harm: interaction.options.getNumber('self_harm') ?? moderationData.self_harm,
//       self_harm_instructions: interaction.options.getNumber('self_harm_instructions') ?? moderationData.self_harm_instructions,
//       self_harm_intent: interaction.options.getNumber('self_harm_intent') ?? moderationData.self_harm_intent,
//       sexual: interaction.options.getNumber('sexual') ?? moderationData.sexual,
//       sexual_minors: interaction.options.getNumber('sexual_minors') ?? moderationData.sexual_minors,
//       violence: interaction.options.getNumber('violence') ?? moderationData.violence,
//       violence_graphic: interaction.options.getNumber('violence_graphic') ?? moderationData.violence_graphic,
//     },
//   });
// }

export async function discordAiModerate(
  messageData: Message,
): Promise<void> {
  if (messageData.author.bot) return;
  if (messageData.cleanContent.length < 1) return;
  if (messageData.channel.type === ChannelType.DM) return;
  if (!messageData.guild) return;

  const modResults = await aiModerate(
    messageData.cleanContent.replace(tripbotUAT, '').replace('tripbot', ''),
    messageData.guild.id,
  );

  if (modResults.length === 0) return;

  const activeFlags = modResults.map(modResult => modResult.category);

  const targetMember = messageData.member as GuildMember;
  // const userData = await db.users.upsert({
  //   where: { discord_id: guildMember.id },
  //   create: { discord_id: guildMember.id },
  //   update: {},
  // });

  // const aiEmbed = await userInfoEmbed(guildMember, userData, 'FLAGGED');
  const aiEmbed = new EmbedBuilder()
    .setThumbnail(targetMember.user.displayAvatarURL())
    .setColor(Colors.Yellow)
    .addFields(
      {
        name: 'Member',
        value: stripIndents`<@${targetMember.id}>`,
        inline: true,
      },
      {
        name: 'Flags',
        value: stripIndents`${activeFlags.join(', ')}`,
        inline: true,
      },
      {
        name: 'Channel',
        value: stripIndents`${messageData.url}`,
        inline: true,
      },
      {
        name: 'Message',
        value: stripIndents`${messageData.cleanContent}`,
        inline: false,
      },
    );

  const modAiModifyButtons = [] as ActionRowBuilder<ButtonBuilder>[];
  // For each of the sortedCategoryScores, add a field
  modResults.forEach(result => {
    const safeCategoryName = result.category
      .replace('/', '_')
      .replace('-', '_') as keyof ai_moderation;
    if (result.value > 0.90) {
      aiEmbed.setColor(Colors.Red);
    }
    aiEmbed.addFields(
      {
        name: result.category,
        value: '\u200B',
        inline: true,
      },
      {
        name: 'AI Value',
        value: `${result.value.toFixed(2)}`,
        inline: true,
      },
      {
        name: 'Threshold Value',
        value: `${result.limit}`,
        inline: true,
      },
    );
    modAiModifyButtons.push(new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`aiMod~adjust~${safeCategoryName}~-0.10`)
        .setLabel('-0.10')
        .setEmoji('⏪')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`aiMod~adjust~${safeCategoryName}~-0.01`)
        .setLabel('-0.01')
        .setEmoji('◀️')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`aiMod~adjust~${safeCategoryName}~+0.01`)
        .setLabel('+0.01')
        .setEmoji('▶️')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`aiMod~adjust~${safeCategoryName}~+0.10`)
        .setLabel('+0.10')
        .setEmoji('⏩')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`aiMod~save~${safeCategoryName}~${result.limit}`)
        .setLabel(`Save ${result.category} at ${result.limit.toFixed(2)}`)
        .setEmoji('💾')
        .setStyle(ButtonStyle.Primary),
    ));
  });

  const userActions = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`aiMod~note~${messageData.author.id}`)
      .setLabel('Note')
      .setEmoji('🗒️')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`aiMod~warn~${messageData.author.id}`)
      .setLabel('Warn')
      .setEmoji('⚠️')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`aiMod~timeout~${messageData.author.id}`)
      .setLabel('Mute')
      .setEmoji('⏳')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`aiMod~ban~${messageData.author.id}`)
      .setLabel('Ban')
      .setEmoji('🔨')
      .setStyle(ButtonStyle.Danger),
  );

  // Get the channel to send the message to
  const channelAiModLog = await discordClient.channels.fetch(env.CHANNEL_AIMOD_LOG) as TextChannel;
  // Send the message
  try {
    await channelAiModLog.send({
      content: `${targetMember.displayName} was flagged by AI for ${activeFlags.join(', ')} in ${messageData.url}`,
      embeds: [aiEmbed],
      components: [userActions, ...modAiModifyButtons],
    });
  } catch (err) {
    log.error(F, `Error sending message: ${err}`);
    log.error(F, `${JSON.stringify({
      content: `${targetMember.displayName} was flagged by AI for ${activeFlags.join(', ')} in ${messageData.url}`,
      embeds: [aiEmbed],
      components: [userActions, ...modAiModifyButtons],
    }, null, 2)}`);
  }
}

async function agreeToTerms(
  messageData:Message,
):Promise<MessageReplyOptions> {
  return {
    embeds: [embedTemplate()
      .setTitle('🤖 Welcome to TripBot\'s AI Module! 🤖')
      .setDescription(`
        Please agree to the following. Use /ai help for more information.

        ${termsOfService}
      `)
      .setFooter(null)],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        buttonAiAgree.setCustomId(`AI~messageAgree~${messageData.id}`),
        buttonAiHelp,
      ),
    ],
  };
}

export async function discordAiConversate(
  messageData: Message<boolean>,
): Promise<void> {
  if (!env.OPENAI_API_ORG || !env.OPENAI_API_KEY) return;
  // log.debug(F, `discordAiConversate - messageData: ${JSON.stringify(messageData.cleanContent, null, 2)}`);

  if (!messageData.member?.roles.cache.has(env.ROLE_VERIFIED)) return;
  if (messageData.author.bot) return;
  if (messageData.cleanContent.length < 1) return;
  if (messageData.channel.type === ChannelType.DM) return;
  if (messageData.author.id !== env.DISCORD_OWNER_ID) return;

  // Get the assistant for this channel.
  // Right now the only assistant is the 'tripsitter' assistant
  const assistant = await getAssistant('tripsitter');
  // log.debug(F, `assistant: ${JSON.stringify(assistant, null, 2)}`);

  // Get the thread for the user who said something
  const thread = await getThread('thread_GXG53Z1LS3ZdKBcOHRfRsd70');
  // log.debug(F, `thread: ${JSON.stringify(thread, null, 2)}`);

  // Add the message to the thread
  await createMessage(
    thread,
    {
      role: 'user',
      content: messageData.cleanContent,
    },
  );

  // Function to handle the logic after waiting
  const handleTimeout = async () => {
    // Your logic here
    log.debug(F, 'Continuing after wait...');

    // This parses out some values from the assistant object
    // There's probably a better way to do this
    const {
      id,
      name,
      created_at, // eslint-disable-line @typescript-eslint/naming-convention
      description,
      file_ids, // eslint-disable-line @typescript-eslint/naming-convention
      object,
      ...restOfAssistant
    } = assistant;

    // Run the thread
    const run = await runThread(
      thread,
      {
        assistant_id: assistant.id,
        ...restOfAssistant,
      },
    );

    // Wait for the run to complete
    let runStatus = 'queued' as Run['status'];
    while (['queued', 'in_progress'].includes(runStatus)) {
      // Send the typing indicator to show tripbot is thinking
      // eslint-disable-next-line no-await-in-loop
      await messageData.channel.sendTyping();

      // eslint-disable-next-line no-await-in-loop
      await sleep(1000);
      // eslint-disable-next-line no-await-in-loop
      const runStatusResponse = await readRun(thread, run);
      // log.debug(F, `runStatusResponse: ${JSON.stringify(runStatusResponse, null, 2)}`);
      runStatus = runStatusResponse.status;
    }

    // log.debug(F, `runStatus: ${runStatus}`);

    const devRoom = await discordClient.channels.fetch(env.CHANNEL_BOTERRORS) as TextChannel;

    // Depending on how the run ended, do something
    switch (runStatus) {
      case 'completed': {
        // This should pull the thread and then get the last message in the thread, which should be from the assistant
        const messagePage = await getMessages(thread, { limit: 10 });
        // log.debug(F, `messagePage: ${JSON.stringify(messagePage, null, 2)}`);
        const messages = messagePage.getPaginatedItems();
        const message = messages[0];
        const [messageContent] = message.content;
        if ((messageContent as MessageContentText).text) {
          log.debug(F, `messageContent: ${JSON.stringify(messageContent, null, 2)}`);

          // Send the result to the dev room
          await devRoom.send(`AI Conversation succeeded: ${JSON.stringify(messageContent, null, 2)}`);

          // await messages[0].reply(result.response.slice(0, 2000));
          await messageData.reply((messageContent as MessageContentText).text.value);
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
        await messageData.reply('**sad trombone**');
        break;
      }
      default:
        break;
    }
  };

  // Set a timer for 5 seconds
  const timer = setTimeout(handleTimeout, 5000);

  // Function to reset the timer
  // const resetTimer = () => {
  //   clearTimeout(timer);
  //   timer = setTimeout(handleTimeout, 10000);
  // };

  // Listen for typing event
  // This doesn't work for some reason
  // discordClient.on(Events.TypingStart, interaction => {
  //   // if (interaction.user.id === messageData.author.id && interaction.channel.id === messageData.channel.id) {
  //   log.debug(F, `Typing started: ${interaction.user.id}`);
  //   resetTimer();
  //   // }
  // });

  // Handling additional messages
  discordClient.on(Events.MessageCreate, (newMessage: Message) => {
    if (newMessage.author.id === messageData.author.id && newMessage.channel.id === messageData.channel.id) {
      log.debug(F, 'New message clearing timeout');
      clearTimeout(timer);
      // Process the new message as required
    }
  });
}

export async function aiMessage(
  messageData: Message<boolean>,
): Promise<void> {
  if (!env.OPENAI_API_ORG || !env.OPENAI_API_KEY) return;
  await messageData.fetch();

  let isAfterAgreement = false;
  const ogMessage = messageData;

  if (messageData.components.length > 0) {
    // log.debug(F, `messageData.components: ${JSON.stringify(messageData.components, null, 2)}`);
    isAfterAgreement = true;
    const [,,messageId] = (messageData.components[0].components[0].customId as string).split('~');
    log.debug(F, `messageId ${messageId}`);
    // eslint-disable-next-line no-param-reassign
    messageData = await messageData.channel?.messages.fetch(messageId);
  }

  // log.debug(F, `messageData: ${JSON.stringify(messageData, null, 2)}`);
  // log.debug(F, `isAfterAgreement: ${JSON.stringify(isAfterAgreement, null, 2)}`);

  // const channelMessages = await messageData.channel.messages.fetch({ limit: 10 });
  // log.debug(F, `channelMessages: ${JSON.stringify(channelMessages.map(message => message.cleanContent), null, 2)}`);

  // const messages = [...channelMessages.values()];

  // if (!messages[0].member?.roles.cache.has(env.ROLE_VERIFIED)) return;
  if (messageData.author.bot) {
    log.debug(F, 'Message was from a bot, returning');
    return;
  }
  if (messageData.cleanContent.length < 1) {
    log.debug(F, 'Message was empty, returning');
    return;
  }
  if (messageData.channel.type === ChannelType.DM) {
    log.debug(F, 'Message was from a DM, returning');
    return;
  }

  log.debug(F, `${messageData.author.displayName} asked me '${messageData.cleanContent}'`);

  // Determine if the user has agreed to the AI terms
  const userData = await db.users.upsert({
    where: { discord_id: messageData.author.id },
    create: { discord_id: messageData.author.id },
    update: {},
  });

  if (!userData.ai_terms_agree) {
    log.debug(F, `${messageData.author.displayName} has not agreed to the AI terms`);
    await messageData.reply(await agreeToTerms(messageData));
    return;
  }

  // Check if the channel is linked to a persona
  const aiLinkData = await getLinkedChannel(messageData.channel);
  // log.debug(F, `aiLinkData: ${JSON.stringify(aiLinkData, null, 2)}`);
  if (!aiLinkData) return;
  // log.debug(F, `aiLinkData: ${JSON.stringify(aiLinkData, null, 2)}`);

  // Get persona details for this channel, throw an error if the persona was deleted
  const aiPersona = await db.ai_personas.findUniqueOrThrow({
    where: {
      id: aiLinkData.persona_id,
    },
  });
  // log.debug(F, `aiPersona: ${aiPersona.name}`);

  log.debug(F, `${messageData.channel.name} is linked to the '${aiPersona.name}' persona`);

  // Get the last 3 messages that are not empty or from other bots
  // const messageList = messages
  //   .filter(message => message.cleanContent.length > 0 && !message.author.bot)
  //   .map(message => ({
  //     role: 'user',
  //     content: message.cleanContent
  //       .replace(tripbotUAT, '')
  //       .replace('tripbot', '')
  //       .trim(),
  //   }))
  //   .slice(0, maxHistoryLength)
  //   .reverse() as OpenAI.Chat.ChatCompletionMessageParam[];

  // log.debug(F, `messageList: ${JSON.stringify(messageList, null, 2)}`);

  // const cleanMessageList = messages
  //   .filter(message => message.cleanContent.length > 0 && !message.author.bot)
  //   .slice(0, maxHistoryLength)
  //   .reverse();

  const cleanMessageList = [messageData];

  const messageList = [{
    role: 'user',
    content: messageData.cleanContent
      .replace(tripbotUAT, '')
      .replace('tripbot', '')
      .trim(),
  }] as {
    role: 'user';
    content: string;
  }[];

  // log.debug(F, `messageData: ${JSON.stringify(messageData, null, 2)}`);

  const attachmentInfo = {
    url: null,
    mimeType: null,
  } as {
    url: string | null;
    mimeType: string | null;
  };

  if (messageData.attachments && messageData.attachments.size >= 1) {
    attachmentInfo.url = messageData.attachments.first()?.url as string;
    attachmentInfo.mimeType = messageData.attachments.first()?.contentType as string;
  }

  if (messageData.reference) {
    const refMessage = await messageData.fetchReference();
    attachmentInfo.url = refMessage.attachments.first()?.url as string;
    attachmentInfo.mimeType = refMessage.attachments.first()?.contentType as string;
  }

  log.debug(F, `Sending messages to API: ${JSON.stringify(messageList, null, 2)}`);
  log.debug(F, `attachmentInfo: ${JSON.stringify(attachmentInfo, null, 2)}`);

  const { response, promptTokens, completionTokens } = await aiChat(aiPersona, messageList, messageData.author.id, attachmentInfo);

  log.debug(F, `response from API: ${response}`);
  // log.debug(F, `promptTokens: ${promptTokens}`);
  // log.debug(F, `completionTokens: ${completionTokens}`);

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

  const costUsd = (aiCosts[aiPersona.ai_model as keyof typeof aiCosts].input * promptTokens)
    + (aiCosts[aiPersona.ai_model as keyof typeof aiCosts].output * completionTokens);

  await db.ai_usage.upsert({
    where: {
      user_id: userData.id,
    },
    create: {
      user_id: userData.id,
      tokens: completionTokens + promptTokens,
      usd: costUsd,
    },
    update: {
      usd: {
        increment: costUsd,
      },
      tokens: {
        increment: completionTokens + promptTokens,
      },
    },
  });

  await aiAudit(
    aiPersona,
    cleanMessageList,
    response,
    promptTokens,
    completionTokens,
  );

  if (isAfterAgreement) {
    ogMessage.edit({
      content: response.slice(0, 2000),
      embeds: [],
      components: [],
      allowedMentions: { parse: [] },
    });
  } else {
    await messageData.channel.sendTyping();
    const wpm = 120;
    const wordCount = response.split(' ').length;
    const sleepTime = (wordCount / wpm) * 60000;
    // log.debug(F, `Typing ${wordCount} at ${wpm} wpm will take ${sleepTime / 1000} seconds`);
    await sleep(sleepTime > 10000 ? 5000 : sleepTime); // Don't wait more than 5 seconds
    const replyMessage = await messageData.reply({
      content: response.slice(0, 2000),
      allowedMentions: { parse: [] },
    });

    // React to that message with thumbs up and thumbs down emojis
    try {
      await replyMessage.react(env.EMOJI_THUMB_UP);
      await replyMessage.react(env.EMOJI_THUMB_DOWN);
    } catch (error) {
      log.error(F, `Error reacting to message: ${messageData.url}`);
      log.error(F, `${error}`);
    }
  }
}

export async function aiReaction(
  messageReaction: MessageReaction,
  user: User,
) {
  if (!messageReaction.message.guild) return; // Ignore DMs
  // We want to collect every message tripbot sends that gets three thumbs downs
  const thumbsUpEmojis = ['👍', '👍🏻', '👍🏼', '👍🏽', '👍🏾', '👍🏿', 'ts_thumbup'];
  const thumbsDownEmojis = ['👎', '👎🏻', '👎🏼', '👎🏽', '👎🏾', '👎🏿', 'ts_thumbdown'];
  if (messageReaction.message.reference === null) return;
  const originalMessage = await messageReaction.message.fetchReference();
  const aiLinkData = await db.ai_channels.findFirst({
    where: {
      channel_id: originalMessage.channel.id,
    },
  });
  if (aiLinkData
        && messageReaction.message.author?.bot
        && !user.bot
        && (thumbsUpEmojis.includes(messageReaction.emoji.name as string)
          || thumbsDownEmojis.includes(messageReaction.emoji.name as string)
        )
  ) {
  // log.debug(F, `Someone reacted to tripbot's message with an audit emoji (${messageReaction.emoji.name})`);

    const channelAiVoteLog = await discordClient.channels.fetch(env.CHANNEL_AIVOTELOG) as TextChannel;
    const action = thumbsUpEmojis.includes(messageReaction.emoji.name as string) ? 'approve' : 'reject';

    const auditLimit = env.NODE_ENV === 'production' ? 4 : 2;
    // log.debug(F, `Audit limit is ${auditLimit}, emoji count is ${messageReaction.count}`);
    if (messageReaction.count === auditLimit) {
    // log.debug(F, `Audit limit reached (${auditLimit})`);

      const message = thumbsUpEmojis.includes(messageReaction.emoji.name as string)
        ? stripIndents`${messageReaction.message.cleanContent}
            
        **Thank you for your feedback, I have notified Moonbear that this response was excellent.**`
        : stripIndents`~~${messageReaction.message.cleanContent}~~
            
        **Thank you for your feedback, I have notified Moonbear that this response was improper.**`;

      // This happens before the message is edited, so we need to fetch the original message

      await channelAiVoteLog.send({
        content: stripIndents`
            The following AI response was deemed ${action === 'reject' ? 'improper' : 'excellent'} by ${messageReaction.message.guild.name} <@${env.DISCORD_OWNER_ID}>`,
      });

      await messageReaction.message.edit(message);

      // Remove the emojis so someone can't just toggle it on and off
      await messageReaction.message.reactions.removeAll();
    }

    const personaData = await db.ai_personas.findFirstOrThrow({
      where: {
        id: aiLinkData.persona_id,
      },
    });

    await db.ai_personas.update({
      where: {
        id: personaData.id,
      },
      data: (thumbsUpEmojis.includes(messageReaction.emoji.name as string)
        ? {
          upvotes: {
            increment: 1,
          },
        }
        : {
          downvotes: {
            increment: 1,
          },
        }),
    });

    await channelAiVoteLog.send({
      embeds: [embedTemplate()
        .setTitle(`AI ${action}`)
        .setDescription(stripIndents`
            ${originalMessage.author.displayName} (${originalMessage.author.id}):
            \`${originalMessage.cleanContent}\`

            TripBot:
            \`${messageReaction.message.cleanContent}\`
          `)],
    });
  }
}

export async function aiMenu(
  interaction: ChannelSelectMenuInteraction | StringSelectMenuInteraction,
):Promise<InteractionEditReplyOptions> {
  const menuId = interaction.customId;
  log.debug(F, `menuId: ${menuId}`);
  const [, menuAction] = menuId.split('~');

  // eslint-disable-next-line sonarjs/no-small-switch
  switch (menuAction) {
    case 'channel':
      return setupPage(interaction as ChannelSelectMenuInteraction);
    case 'persona':
      return setupPage(interaction as StringSelectMenuInteraction);
    case 'personaInfo':
      return personasPage(interaction as StringSelectMenuInteraction);
    case 'personaSetup':
      return setupPage(interaction as StringSelectMenuInteraction);
    case 'model':
      return createPage(interaction as StringSelectMenuInteraction);
    case 'public':
      return setPublicity(interaction as StringSelectMenuInteraction);
    default:
      return setupPage(interaction);
  }
}

export async function aiButton(
  interaction: ButtonInteraction,
):Promise<void> {
  const buttonID = interaction.customId;
  log.debug(F, `buttonID: ${buttonID}`);
  const [, buttonAction] = buttonID.split('~');

  // eslint-disable-next-line sonarjs/no-small-switch
  switch (buttonAction) {
    case 'agree':
      await db.users.update({
        where: {
          discord_id: interaction.user.id,
        },
        data: {
          ai_terms_agree: true,
        },
      });
      log.debug(F, `User ${interaction.user.id} agreed to the terms`);
      await interaction.update(await setupPage(interaction));
      break;
    case 'messageAgree': {
      await db.users.update({
        where: {
          discord_id: interaction.user.id,
        },
        data: {
          ai_terms_agree: true,
        },
      });

      await aiMessage(interaction.message);
      break;
    }
    case 'help':
      await interaction.update(await helpPage(interaction));
      break;
    case 'delete':
      await interaction.update(await deletePage(interaction));
      break;
    case 'deleteConfirm':
      await interaction.update(await deletePersona(interaction));
      break;
    case 'link':
      await interaction.update(await link(interaction));
      break;
    case 'unlink':
      await interaction.update(await unlink(interaction));
      break;
    case 'setup':
      await interaction.update(await setupPage(interaction));
      break;
    case 'personas':
      await interaction.update(await personasPage(interaction));
      break;
    case 'new':
      await interaction.update(await createPage(interaction));
      break;
    case 'create':
      await createPersona(interaction);
      break;
    case 'modify':
      await modifyPersona(interaction);
      break;
    default:
      await helpPage(interaction);
      break;
  }
}

export const aiCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription('TripBot\'s AI')
    .addSubcommand(subcommand => subcommand
      .setDescription('Setup the TripBot AI')
      .setName('setup'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Get information on the various personas available for the AI module')
      .setName('personas'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Get info on the AI module')
      .setName('help')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: true });

    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case 'setup':
        await interaction.editReply(await setupPage(interaction));
        break;
      case 'help':
        await interaction.editReply(await helpPage(interaction));
        break;
      case 'personas':
        await interaction.editReply(await personasPage(interaction));
        break;
      default:
        await interaction.editReply(await helpPage(interaction));
        break;
    }
    return true;
  },
};

export default aiCommand;
