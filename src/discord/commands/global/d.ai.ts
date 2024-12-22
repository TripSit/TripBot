/* eslint-disable max-len */
/* eslint-disable sonarjs/no-duplicate-string */
import {
  ActionRowBuilder,
  Colors,
  SlashCommandBuilder,
  GuildMember,
  Message,
  TextChannel,
  TextBasedChannel,
  CategoryChannel,
  ForumChannel,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  EmbedBuilder,
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
  MessageActionRowComponent,
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
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';
import { aiModerate, handleAiMessageQueue } from '../../../global/commands/g.ai';

/* TODO
* only direct @ message should trigger a response
* If the user starts typing again, cancel the run and wait for them to either stop typing or send a message
*/
const F = f(__filename);

// const maxHistoryLength = 3;

// const ephemeralExplanation = 'Set to "True" to show the response only to you';
// const personaDoesNotExist = 'This persona does not exist. Please create it first.';
const tripbotUAT = '@TripBot UAT (Moonbear)';

// Costs per 1k tokens
const aiCosts = {
  GPT_3_5_TURBO: { // LAZY TEMP FIX - CHANGE NAME THESE PRICES ARE FOR 4o MINI NOW
    input: 0.00015,
    output: 0.00060,
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
  .setStyle(ButtonStyle.Primary);

const buttonAiSetup = new ButtonBuilder()
  .setCustomId('AI~setup')
  .setLabel('Setup')
  .setEmoji('⚙️')
  .setStyle(ButtonStyle.Primary);

const buttonAiPrivacy = new ButtonBuilder()
  .setCustomId('AI~privacy')
  .setLabel('Privacy')
  .setEmoji('🔒')
  .setStyle(ButtonStyle.Primary);

const buttonAiLink = new ButtonBuilder()
  .setCustomId('AI~link')
  .setLabel('Link')
  .setEmoji('🔗')
  .setStyle(ButtonStyle.Success);

const buttonAiUnlink = new ButtonBuilder()
  .setCustomId('AI~unlink')
  .setLabel('Unlink')
  .setEmoji('❌')
  .setStyle(ButtonStyle.Danger);

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
  .setEmoji('🗑️')
  .setStyle(ButtonStyle.Danger);

const buttonAiDeleteHistory = new ButtonBuilder()
  .setCustomId('AI~deleteHistory')
  .setLabel('Delete my history')
  .setEmoji('🗑️')
  .setStyle(ButtonStyle.Danger);

const buttonAiDeleteHistoryConfirm = new ButtonBuilder()
  .setCustomId('AI~deleteHistoryConfirm')
  .setLabel('Yes I\'m sure')
  .setEmoji('🗑️')
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

function getComponentById(
  interaction: ButtonInteraction | StringSelectMenuInteraction | ChannelSelectMenuInteraction,
  id: string,
):MessageActionRowComponent | null {
  // This function will take an interaction and a customId and return the component with that customId
  // If no component is found, it will return null
  // This is useful for finding the button that was clicked, or select menu that was used

  // log.debug(F, `getComponentById started with id: ${id}`);
  // log.debug(F, `Components: ${JSON.stringify(interaction.message.components, null, 2)}`);

  if (interaction.message?.components) {
    // eslint-disable-next-line no-restricted-syntax
    for (const row of interaction.message.components) {
      // eslint-disable-next-line no-restricted-syntax
      for (const component of row.components) {
        if (component.customId?.includes(id)) {
          return component;
        }
      }
    }
  }

  // Return null if no component with the customId is found
  return null;
}

const termsOfService = stripIndents`
➤ This 'AI' is not 'intelligent', do not depend on it for any kind of drug/medical advice.
➤ It stores your chat history in a database, delete your history with \`/ai privacy\`.
➤ Abuse of this service may result in a ban from using the bot entirely!
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

async function deletedPage(
  interaction: ButtonInteraction,
):Promise<InteractionEditReplyOptions> {
  log.debug(F, `CustomId: ${interaction.customId}`);
  const menuButtons = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      buttonAiHelp.setStyle(ButtonStyle.Primary),
      buttonAiSetup.setStyle(ButtonStyle.Primary),
      buttonAiPersonas.setStyle(ButtonStyle.Primary),
      buttonAiPrivacy.setStyle(ButtonStyle.Primary),
    );

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
    components: [
      menuButtons,
    ],
  };
}

async function deletePage(
  interaction: ButtonInteraction,
):Promise<InteractionEditReplyOptions> {
  const personaSelectMenu = getComponentById(interaction, 'AI~personaInfo') as StringSelectMenuComponent;
  const selectedPersona = personaSelectMenu.options.find(option => option.default)?.value;
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
    components: [
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          buttonAiHelp.setStyle(ButtonStyle.Primary),
          buttonAiSetup.setStyle(ButtonStyle.Primary),
          buttonAiPersonas.setStyle(ButtonStyle.Primary),
          buttonAiPrivacy.setStyle(ButtonStyle.Primary),
        ),
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          buttonAiDeleteConfirm
            .setCustomId(`AI~deleteConfirm~${selectedPersona}`),
        ),
    ],
  };
}

async function deletedHistoryPage(
  interaction: ButtonInteraction,
):Promise<InteractionEditReplyOptions> {
  await db.users.update({
    where: {
      discord_id: interaction.user.id,
    },
    data: {
      ai_terms_agree: false,
      ai_history_google: null,
      ai_history_openai: null,
    },
  });

  const channelAiLog = await discordClient.channels.fetch(env.CHANNEL_AILOG) as TextChannel;
  await channelAiLog.send({
    content: `${interaction.member} deleted their history successfully.`,
  });

  return {
    embeds: [embedTemplate()
      .setDescription(`
        Your history has been deleted successfully!

        To confirm, you @ mention the bot and it will ask you to re-agree to the terms.
      `)
      .setFooter(null)],
    components: [
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          buttonAiHelp.setStyle(ButtonStyle.Primary),
          buttonAiSetup.setStyle(ButtonStyle.Primary),
          buttonAiPersonas.setStyle(ButtonStyle.Primary),
          buttonAiPrivacy.setStyle(ButtonStyle.Primary),
        ),
    ],
  };
}

async function deleteHistoryPage():Promise<InteractionEditReplyOptions> {
  return {
    embeds: [embedTemplate()
      .setTitle('AI History Deletion')
      .setDescription(`
        Are you sure you want to delete your AI history? This action cannot be undone.
      `)
      .setFooter(null)],
    components: [
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          buttonAiHelp.setStyle(ButtonStyle.Primary),
          buttonAiSetup.setStyle(ButtonStyle.Primary),
          buttonAiPersonas.setStyle(ButtonStyle.Primary),
          buttonAiPrivacy.setStyle(ButtonStyle.Primary),
        ),
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          buttonAiDeleteHistoryConfirm
            .setCustomId('AI~deleteHistoryConfirm'),
        ),
    ],
  };
}

async function createPersona(
  interaction: ButtonInteraction,
):Promise<void> {
  log.info(F, await commandContext(interaction));
  if (!interaction.guild) {
    await interaction.reply({ content: 'This command only works in a server.' });
    return;
  }

  const modelSelectMenu = getComponentById(interaction, 'AI~model') as StringSelectMenuComponent;
  const selectedModel = modelSelectMenu.options.find(option => option.default)?.value;
  log.debug(F, `selectedModel: ${JSON.stringify(selectedModel, null, 2)}`);

  let modelName = '';
  if (selectedModel === 'GPT_3_5_TURBO') {
    modelName = 'GPT-3.5';
  } else if (selectedModel === 'GPT_4_TURBO') {
    modelName = 'GPT-4';
  } else if (selectedModel === 'GEMINI_PRO') {
    modelName = 'Gemini';
  }

  await interaction.showModal(new ModalBuilder()
    .setCustomId(`aiPromptModal~${interaction.id}`)
    .setTitle('Modal')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(new TextInputBuilder()
          .setCustomId('name')
          .setPlaceholder(stripIndents`TripBot V3`)
          .setValue(stripIndents`TripBot (${modelName})`)
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
      await i.deferUpdate();

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

      await i.editReply({
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

async function helpPage(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
):Promise<InteractionEditReplyOptions> {
  const userData = await db.users.upsert({
    where: { discord_id: interaction.user.id },
    create: { discord_id: interaction.user.id },
    update: {},
  });

  const components = [
    new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        buttonAiHelp.setStyle(ButtonStyle.Secondary),
        buttonAiSetup.setStyle(ButtonStyle.Primary),
        buttonAiPersonas.setStyle(ButtonStyle.Primary),
        buttonAiPrivacy.setStyle(ButtonStyle.Primary),
      ),
  ];

  if (!userData.ai_terms_agree) {
    components.push(new ActionRowBuilder<ButtonBuilder>()
      .addComponents(buttonAiAgree));
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
      Do not expect that your conversations with the bot are private: every message sent through the bot is logged for moderation purposes.

      **Ready to get started? Please agree to the following:**
      ${termsOfService}
      `)
      .setFooter(null)],
    components,
  };
}

async function privacyPage(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
):Promise<InteractionEditReplyOptions> {
  const userData = await db.users.upsert({
    where: { discord_id: interaction.user.id },
    create: { discord_id: interaction.user.id },
    update: {},
  });

  const components = [
    new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        buttonAiHelp.setStyle(ButtonStyle.Primary),
        buttonAiSetup.setStyle(ButtonStyle.Primary),
        buttonAiPersonas.setStyle(ButtonStyle.Primary),
        buttonAiPrivacy.setStyle(ButtonStyle.Secondary),
      ),
  ];

  if (userData.ai_history_google || userData.ai_history_openai) {
    components.push(new ActionRowBuilder<ButtonBuilder>()
      .addComponents(buttonAiDeleteHistory));
  }

  return {
    embeds: [embedTemplate()
      .setTitle('This page explains how your data is used, and how to remove it.')
      .setDescription(stripIndents`
        # What data is stored?
        OpenAI models (GPT) requires that we store a "Thread ID".
        Google models (Gemini) require we store encrypted message history.

        **We don't send identifying information to either API, only what you say in the message.**
        # How can I remove my data?

        You can remove your data at any time by clicking the button below.

        This will delete your thread off the OpenAI servers, and remove your thread ID from our DB. \ 
        It will remove your encrypted chat history from our database.

        **You can further remove your data from TripSit's servers with the \`/privacy\`.**
      `)
      .setFooter(null)],
    components,
  };
}

async function personasPage(
  interaction: ChatInputCommandInteraction | ButtonInteraction | StringSelectMenuInteraction,
):Promise<InteractionEditReplyOptions> {
  log.debug(F, 'personasPage started');

  const aiPersonaList = interaction.guild?.id === env.DISCORD_GUILD_ID
    ? await db.ai_personas.findMany()
    : await db.ai_personas.findMany({
      where: {
        public: true,
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

  log.debug(F, `aiPersonaOptions1: ${JSON.stringify(aiPersonaOptions, null, 2)}`);

  let selectedPersona = undefined as string | undefined;

  if (interaction.isButton()) {
    const personaSelectMenu = getComponentById(interaction, 'AI~personaInfo') as StringSelectMenuComponent;
    if (personaSelectMenu) {
      selectedPersona = personaSelectMenu.options.find(option => option.default)?.value;
      log.debug(F, `selectedPersona: ${JSON.stringify(selectedPersona, null, 2)}`);
      if (selectedPersona) {
        const personaOption = aiPersonaOptions.find(persona => persona.value === selectedPersona);
        if (personaOption) {
          personaOption.default = true;
        }
      }
    }
  }

  if (interaction.isStringSelectMenu()) {
    // Get the ID of the select menu
    log.debug(F, `interaction.customId: ${interaction.customId}`);

    if (interaction.customId === 'AI~personaInfo') {
      [selectedPersona] = interaction.values;

      log.debug(F, `selectedPersona: ${JSON.stringify(selectedPersona, null, 2)}`);
      // If it exists, make sure the aiPersonaOptions has it marked  default
      if (selectedPersona) {
        const personaOption = aiPersonaOptions.find(persona => persona.value === selectedPersona);
        if (personaOption) {
          personaOption.default = true;
        }
      }
    } else if (interaction.customId === 'AI~public') {
      const personaSelectMenu = getComponentById(interaction, 'AI~personaInfo') as StringSelectMenuComponent;
      if (personaSelectMenu) {
        selectedPersona = personaSelectMenu.options.find(option => option.default)?.value;
        log.debug(F, `selectedPersona: ${JSON.stringify(selectedPersona, null, 2)}`);
        if (selectedPersona) {
          const personaOption = aiPersonaOptions.find(persona => persona.value === selectedPersona);
          if (personaOption) {
            personaOption.default = true;
          }
        }
      }
    }
  }

  log.debug(F, `aiPersonaOptions2: ${JSON.stringify(aiPersonaOptions, null, 2)}`);

  // If there's only one persona in the list, set it as the default
  // if (aiPersonaList.length === 1) {
  //   aiPersonaOptions[0].default = true;
  //   selectedPersona = aiPersonaOptions[0].value;
  // }

  // If the user is a developer in the home guild, show the buttonAiModify button
  const tripsitGuild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
  let tripsitMember = null;
  try {
    tripsitMember = await tripsitGuild.members.fetch(interaction.user.id);
  } catch (err) {
    // do nothing
  }

  const components = [
    new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        buttonAiHelp.setStyle(ButtonStyle.Primary),
        buttonAiSetup.setStyle(ButtonStyle.Primary),
        buttonAiPersonas.setStyle(ButtonStyle.Secondary),
        buttonAiPrivacy.setStyle(ButtonStyle.Primary),
      ),
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents([
      menuAiPersonas.setOptions(aiPersonaOptions),
    ]),

  ];

  // log.debug(F, `There are ${components.length} components in the array`);

  if (selectedPersona !== 'none' && selectedPersona !== undefined) {
    const persona = await db.ai_personas.findFirstOrThrow({
      where: {
        name: selectedPersona,
      },
    });

    log.debug(F, 'Adding three buttons to personaButtons');
    if (tripsitMember && tripsitMember.roles.cache.has(env.ROLE_DEVELOPER)) {
      components.push(
        new ActionRowBuilder<ButtonBuilder>()
          .addComponents(buttonAiNew, buttonAiModify, buttonAiDelete),
      );
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

    if (tripsitMember && tripsitMember.roles.cache.has(env.ROLE_DEVELOPER)) {
      components.push(
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents([
          menuAiPublic,
        ]),
      );
    }

    return {
      embeds: [await makePersonaEmbed(persona)],
      components,
    };
  }

  if (tripsitMember && tripsitMember.roles.cache.has(env.ROLE_DEVELOPER)) {
    log.debug(F, 'Adding buttonAiNew to components');
    components.push(
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(buttonAiNew),
    );
  }

  // log.debug(F, `Final components: ${JSON.stringify(components, null, 2)}`);
  // log.debug(F, `components 2 0 : ${JSON.stringify(components[2], null, 2)}`);
  return {
    embeds: [embedTemplate()
      .setTitle('Persona Information')
      .setDescription(stripIndents` 
      A persona is a set of parameters that the AI uses to generate responses. \
      This allows us to have different 'personalities' for the AI. \
      The AI will use the persona that is linked to the channel it is responding in, and return responses based on that persona's personality. \
      You can use the below menu to get information on each persona available. 

      **Model**
      The model to use for the persona. Currently we offer two models, GPT-3.5-Turbo and Gemini Pro.
      GPT is offered through OpenAI and Gemini is offered through Google.
      Google models have image processing capabilities.

      **Prompt**
      The prompt to use for the persona. This is the text that the AI will use to generate responses.
      
      **Max Tokens**
      The maximum number of tokens to use for the AI response.
      What are tokens? <https://platform.openai.com/tokenizer>
      
      **Temperature**
      Adjusts the randomness of the AI's answers.
      Lower values make the AI more predictable and focused, while higher values make it more random and varied.`)
      .setFooter(null)],
    components,
  };
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

  // log.debug(F, `userData: ${JSON.stringify(userData, null, 2)}`);

  // If the user hasn't agreed to the terms, show them the help page so they can
  if (!userData.ai_terms_agree) return helpPage(interaction as ChatInputCommandInteraction | ButtonInteraction);

  // If this is not the home guild, only get the approved personas
  const aiPersonaList = interaction.guild?.id === env.DISCORD_GUILD_ID
    ? await db.ai_personas.findMany()
    : await db.ai_personas.findMany({
      where:
      {
        public: true,
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
  let linkedPersona = undefined as string | undefined;

  if (interaction.isChannelSelectMenu()) {
    log.debug(F, 'interaction is channel select menu');
    // log.debug(F, `interaction.values ${JSON.stringify(interaction.values[0], null, 2)}`);
    [selectedChannel] = interaction.values;
    const personaSelectMenu = getComponentById(interaction, 'AI~personaSetup') as StringSelectMenuComponent;
    selectedPersona = personaSelectMenu.options.find(option => option.default)?.value;
    log.debug(F, `selectedChannel: ${JSON.stringify(selectedChannel, null, 2)}`);
    log.debug(F, `selectedPersona1: ${JSON.stringify(selectedPersona, null, 2)}`);

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
      linkedPersona = personaData.name;
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
    const channelSelectMenu = getComponentById(interaction, 'AI~channel') as ChannelSelectMenuComponent;
    [,,selectedChannel] = channelSelectMenu.customId.split('~');
    [selectedPersona] = interaction.values;
    log.debug(F, `selectedChannel: ${JSON.stringify(selectedChannel, null, 2)}`);
    log.debug(F, `selectedPersona2: ${JSON.stringify(selectedPersona, null, 2)}`);

    const personaOption = aiPersonaOptions.find(persona => persona.value === selectedPersona);
    if (personaOption) {
      personaOption.default = true;
    }

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
      linkedPersona = personaData.name;
    }
  }

  if (interaction.isButton()) {
    log.debug(F, 'interaction is button');

    if (interaction.message.components.length >= 3) {
      const channelSelectMenu = getComponentById(interaction, 'AI~channel') as ChannelSelectMenuComponent;
      if (channelSelectMenu) {
        [,,selectedChannel] = channelSelectMenu.customId.split('~');
      }

      const personaSelectMenu = getComponentById(interaction, 'AI~personaSetup') as StringSelectMenuComponent;
      if (personaSelectMenu) {
        selectedPersona = personaSelectMenu.options.find(option => option.default)?.value;
      }

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

  log.debug(F, `aiLinkData: ${JSON.stringify(aiLinkData, null, 2)}`);
  log.debug(F, `selectedPersona: ${JSON.stringify(selectedPersona, null, 2)}`);

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

  const components = [
    new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        buttonAiHelp.setStyle(ButtonStyle.Primary),
        buttonAiSetup.setStyle(ButtonStyle.Secondary),
        buttonAiPersonas.setStyle(ButtonStyle.Primary),
        buttonAiPrivacy.setStyle(ButtonStyle.Primary),
      ),
    channelSelectComponent,
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents([
      menuAiPersonaSetup.setOptions(aiPersonaOptions),
    ]),
  ];

  if ((interaction.member as GuildMember).permissions.has(PermissionFlagsBits.ManageChannels)) {
    if (aiLinkData && linkedPersona === selectedPersona) {
      components.push(new ActionRowBuilder<ButtonBuilder>()
        .addComponents(buttonAiUnlink));
    } else if (selectedChannel && selectedPersona && selectedPersona !== 'none') {
      components.push(new ActionRowBuilder<ButtonBuilder>()
        .addComponents(buttonAiLink));
    }
  }

  return {
    embeds: [embedTemplate()
      .setAuthor(null)
      .setTitle(`${interaction.guild.name}'s AI Setup`)
      .setDescription(stripIndents`
        Here we can link the bot's personas to channels and categories.
        ${existingLinks.join('\n')}
      `)
      .setFooter(null)],
    components,
  };
}

async function createPage(
  interaction: ChatInputCommandInteraction | ButtonInteraction | StringSelectMenuInteraction,
):Promise<InteractionEditReplyOptions> {
  log.debug(F, 'createPage started');

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

  const components = [
    new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        buttonAiHelp.setStyle(ButtonStyle.Primary),
        buttonAiSetup.setStyle(ButtonStyle.Primary),
        buttonAiPersonas.setStyle(ButtonStyle.Primary),
        buttonAiPrivacy.setStyle(ButtonStyle.Primary),
      ),
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents([
      menuAiModels.setOptions(aiModelOptions),
    ]),
  ];

  if (selectedModel) {
    components.push(new ActionRowBuilder<ButtonBuilder>()
      .addComponents(buttonAiCreate));
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
    components,
  };
}

async function modifyPersona(
  interaction: ButtonInteraction,
):Promise<void> {
  log.info(F, await commandContext(interaction));
  if (!interaction.guild) {
    await interaction.reply({ content: 'This command only works in a server.' });
    return;
  }

  const personaSelectMenu = getComponentById(interaction, 'AI~personaInfo') as StringSelectMenuComponent;
  const selectedPersona = personaSelectMenu.options.find(option => option.default)?.value;
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

async function setPublicity(
  interaction: StringSelectMenuInteraction,
):Promise<InteractionEditReplyOptions> {
  log.debug(F, 'setPublicity started');
  const personaSelectMenu = getComponentById(interaction, 'AI~personaInfo') as StringSelectMenuComponent;
  const selectedPersona = personaSelectMenu.options.find(option => option.default)?.value;
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

async function agreeToTerms(
  messageData:Message,
):Promise<MessageReplyOptions> {
  return {
    embeds: [embedTemplate()
      .setTitle('🤖 Welcome to TripBot\'s AI Module! 🤖')
      .setDescription(`
        Please agree to the following. Use \`/ai help\` for more information.

        ${termsOfService}
      `)
      .setFooter(null)],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        buttonAiAgree.setCustomId(`AI~messageAgree~${messageData.author.id}`),
      ),
    ],
  };
}

async function link(
  interaction: ButtonInteraction,
):Promise<InteractionEditReplyOptions> {
  log.info(F, await commandContext(interaction));
  if (!interaction.guild) return { content: 'This command only works in a server.' };

  const channelSelectMenu = getComponentById(interaction, 'AI~channel') as ChannelSelectMenuComponent;
  const [,,selectedChannel] = channelSelectMenu.customId.split('~');

  const personaSelectMenu = getComponentById(interaction, 'AI~personaSetup') as StringSelectMenuComponent;
  const selectedPersona = personaSelectMenu.options.find(option => option.default)?.value;
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
    // where: {
    //   channel_id_persona_id: {
    //     channel_id: selectedChannel,
    //     persona_id: personaData.id,
    //   },
    // },
    where: {
      channel_id: selectedChannel,
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

  const channelSelectMenu = getComponentById(interaction, 'AI~channel') as ChannelSelectMenuComponent;
  const [,,selectedChannel] = channelSelectMenu.customId.split('~');

  const personaSelectMenu = getComponentById(interaction, 'AI~personaSetup') as StringSelectMenuComponent;
  const selectedPersona = personaSelectMenu.options.find(option => option.default)?.value;
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

export async function aiMessage(
  messageData: Message<boolean>,
): Promise<void> {
  if (!env.OPENAI_API_ORG || !env.OPENAI_API_KEY) return;
  await messageData.fetch();

  let isAfterAgreement = false;
  const ogMessage = messageData;

  if (messageData.reference) {
    isAfterAgreement = true;
    // eslint-disable-next-line no-param-reassign
    messageData = await messageData.fetchReference();
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

  // Check if the channel is linked to a persona
  const aiLinkData = await getLinkedChannel(messageData.channel);
  // log.debug(F, `aiLinkData: ${JSON.stringify(aiLinkData, null, 2)}`);
  if (!aiLinkData) return;

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

  // log.debug(F, `attachmentInfo: ${JSON.stringify(attachmentInfo, null, 2)}`);
  // log.debug(F, `Sending messages to API: ${JSON.stringify(messageList, null, 2)}`);

  await messageData.channel.sendTyping();

  const typingInterval = setInterval(() => {
    messageData.channel.sendTyping();
  }, 9000); // Start typing indicator every 9 seconds
  let response = '';
  let promptTokens = 0;
  let completionTokens = 0;

  const typingFailsafe = setInterval(() => {
    clearInterval(typingInterval); // Stop sending typing indicator
  }, 30000); // Failsafe to stop typing indicator after 30 seconds

  try {
    const chatResponse = await handleAiMessageQueue(aiPersona, messageList, messageData, attachmentInfo);
    response = chatResponse.response;
    promptTokens = chatResponse.promptTokens;
    completionTokens = chatResponse.completionTokens;
  } finally {
    clearInterval(typingInterval); // Stop sending typing indicator
    clearTimeout(typingFailsafe); // Clear the failsafe timeout to prevent  it from running if we've successfully stopped typing
  }

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
  } else if (response === 'functionFinished') {
    log.debug(F, 'Function finished, returning');
  } else {
    // await messageData.channel.sendTyping();
    // const wpm = 120;
    // const wordCount = response.split(' ').length;
    // const sleepTime = (wordCount / wpm) * 60000;
    // // log.debug(F, `Typing ${wordCount} at ${wpm} wpm will take ${sleepTime / 1000} seconds`);
    // await sleep(sleepTime > 10000 ? 5000 : sleepTime); // Don't wait more than 5 seconds
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
  let originalMessage = {} as Message;
  try {
    originalMessage = await messageReaction.message.fetchReference();
  } catch (error) {
    log.error(F, `Error fetching reference: ${error}`);
    log.error(F, `Reaction: ${JSON.stringify(messageReaction, null, 2)}`);
    log.error(F, `Message: ${JSON.stringify(messageReaction.message, null, 2)}`);
    return;
  }
  const aiLinkData = await getLinkedChannel(originalMessage.channel);

  // log.debug(F, `aiLinkData: ${JSON.stringify(aiLinkData, null, 2)}`);
  // log.debug(F, `messageReaction: ${JSON.stringify(messageReaction, null, 2)}`);
  // log.debug(F, `messageReaction.message.author: ${JSON.stringify(messageReaction.message.author, null, 2)}`);
  // log.debug(F, `user: ${JSON.stringify(user, null, 2)}`);
  // log.debug(F, `Emoji name: ${messageReaction.emoji.name}`);

  if (aiLinkData
        && messageReaction.message.author?.bot
        && !user.bot
        && (thumbsUpEmojis.includes(messageReaction.emoji.name as string)
          || thumbsDownEmojis.includes(messageReaction.emoji.name as string)
        )
  ) {
    log.debug(F, `Someone reacted to tripbot's message with an audit emoji (${messageReaction.emoji.name})`);

    const channelAiVoteLog = await discordClient.channels.fetch(env.CHANNEL_AIVOTELOG) as TextChannel;
    const action = thumbsUpEmojis.includes(messageReaction.emoji.name as string) ? 'approve' : 'reject';

    const auditLimit = env.NODE_ENV === 'production' ? 4 : 3;
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

    log.debug(F, `personaData: ${JSON.stringify(personaData, null, 2)}`);

    log.debug(F, `Updating db.ai_personas with ${action} vote`);

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

    log.debug(F, 'Sending message to vote room');
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
  const [, menuAction] = menuId.split('~') as [null, 'channel' | 'personaInfo' | 'personaSetup' | 'model' | 'public'];

  // eslint-disable-next-line sonarjs/no-small-switch
  switch (menuAction) {
    case 'channel':
      return setupPage(interaction as ChannelSelectMenuInteraction);
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
  const [, buttonAction, messageAuthorId] = buttonID.split('~') as [
    null,
    'help' | 'personas' | 'setup' | 'agree' | 'privacy' |
    'link' | 'unlink' | 'messageAgree' | 'modify' | 'new' |
    'create' | 'delete' | 'deleteConfirm' | 'deleteHistory' | 'deleteHistoryConfirm',
    string];

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

      // const messageData = await interaction.message.fetchReference();

      if (messageAuthorId !== interaction.user.id) {
        log.debug(F, `${interaction.user.displayName} tried to accept the AI ToS using someone else's instance of the ToS.`);
        return;
      }
      await aiMessage(interaction.message);
      break;
    }
    case 'help':
      await interaction.update(await helpPage(interaction));
      break;
    case 'privacy':
      await interaction.update(await privacyPage(interaction));
      break;
    case 'delete':
      await interaction.update(await deletePage(interaction));
      break;
    case 'deleteConfirm':
      await interaction.update(await deletedPage(interaction));
      break;
    case 'deleteHistory':
      await interaction.update(await deleteHistoryPage());
      break;
    case 'deleteHistoryConfirm':
      await interaction.update(await deletedHistoryPage(interaction));
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
      .setDescription('Get info on your data usage, and delete it if you want')
      .setName('privacy'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Get info on the AI module')
      .setName('help')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: true });

    const subcommand = interaction.options.getSubcommand() as | 'setup' | 'personas' | 'privacy' | 'help';
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
      case 'privacy':
        await interaction.editReply(await privacyPage(interaction));
        break;
      default:
        await interaction.editReply(await helpPage(interaction));
        break;
    }
    return true;
  },
};

export default aiCommand;
