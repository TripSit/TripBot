import {
  ActionRowBuilder,
  Colors,
  SlashCommandBuilder,
  GuildMember,
  Message,
  TextChannel,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  EmbedBuilder,
  InteractionEditReplyOptions,
  ChannelSelectMenuInteraction,
  StringSelectMenuInteraction,
  MessageReaction,
  User,
  ChannelType,
  MessageFlags,
  ModalSubmitInteraction,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { ai_moderation } from '@prisma/client';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';
import { aiModerate } from '../../../global/commands/g.ai';
import {
  checkPremiumStatus,
} from '../../utils/commandRateLimiter';

import AiText from '../../utils/aiTexts';
import AiFunction from '../../utils/aiFunctions';
import AiModal from '../../utils/aiModals';
import AiPage from '../../utils/aiPages';
import { OpenRouterClient } from '../../utils/aiClients/openrouter.client';
import { PersonaId } from '../../utils/aiTypes';

const F = f(__filename);

export const aiCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription("TripBot's AI")
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setDescription('Setup the TripBot AI in your server')
      .setName('setup'))
    .addSubcommand(subcommand => subcommand
      .setDescription(
        'Get information on the various personas available for the AI module',
      )
      .setName('personas'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Configure your settings')
      .setName('settings'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Get info on the AI module')
      .setName('info'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Get the privacy policy for the AI module')
      .setName('privacy'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Get the terms of service for the AI module')
      .setName('tos')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const subcommand = interaction.options.getSubcommand() as keyof typeof AiText.AiSubcommand;
    switch (subcommand) {
      case AiText.AiSubcommand.INFO:
        await interaction.editReply(await AiPage.info(interaction));
        break;
      case AiText.AiSubcommand.PERSONAS:
        await interaction.editReply(await AiPage.personas(interaction));
        break;
      case AiText.AiSubcommand.SETTINGS:
        await interaction.editReply(
          await AiPage.userSettings(interaction),
        );
        break;
      case AiText.AiSubcommand.SETUP:
        await interaction.editReply(
          await AiPage.guildSettings(interaction),
        );
        break;
      case AiText.AiSubcommand.PRIVACY:
        await interaction.editReply(await AiPage.privacy(interaction));
        break;
      case AiText.AiSubcommand.TOS:
        await interaction.editReply(await AiPage.tos(interaction));
        break;
      default:
        await interaction.editReply(await AiPage.info(interaction));
        break;
    }
    return true;
  },
};

export async function discordAiModerate(messageData: Message): Promise<void> {
  if (messageData.author.bot) return;
  if (messageData.cleanContent.length < 1) return;
  if (messageData.channel.type === ChannelType.DM) return;
  if (!messageData.guild) return;

  const modResults = await aiModerate(
    messageData.cleanContent
      .replace(AiText.tripbotUAT, '')
      .replace('tripbot', ''),
    messageData.guild.id,
  );

  if (modResults.length === 0) return;

  const activeFlags = modResults.map(modResult => modResult.category);

  const targetMember = messageData.member as GuildMember;
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
    if (result.value > 0.9) {
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
    modAiModifyButtons.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
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
      ),
    );
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
  const channelAiModLog = (await discordClient.channels.fetch(
    env.CHANNEL_AIMOD_LOG,
  )) as TextChannel;
  // Send the message
  try {
    await channelAiModLog.send({
      content: `${targetMember.displayName} was flagged by AI for ${activeFlags.join(', ')} in ${messageData.url}`,
      embeds: [aiEmbed],
      components: [userActions, ...modAiModifyButtons],
    });
  } catch (err) {
    log.error(F, `Error sending message: ${err}`);
    log.error(
      F,
      `${JSON.stringify(
        {
          content: `${targetMember.displayName} was flagged by AI for ${activeFlags.join(', ')} in ${messageData.url}`,
          embeds: [aiEmbed],
          components: [userActions, ...modAiModifyButtons],
        },
        null,
        2,
      )}`,
    );
  }
}

export async function aiMessage(messageData: Message<boolean>): Promise<void> {
  // Get the message data, this should only be necessary if the bot has restarted, otherwise the message is cached
  await messageData.fetch();

  let isAfterAgreement = false;
  const ogMessage = messageData;

  // Idk why this is here, i should comment this
  if (messageData.reference) {
    isAfterAgreement = true;
    // eslint-disable-next-line no-param-reassign
    messageData = await messageData.fetchReference();
  }

  // Various checks to filter out messages that are not relevant to the AI module
  if (messageData.author.bot) {
    log.debug(F, 'Message was from a bot, returning');
    return;
  }
  if (messageData.cleanContent.length < 1) {
    log.debug(F, 'Message was empty, returning');
    return;
  }
  if (messageData.channel.type !== ChannelType.GuildText
    && messageData.channel.type !== ChannelType.PublicThread
    && messageData.channel.type !== ChannelType.PrivateThread
    && messageData.channel.type !== ChannelType.DM
    && messageData.channel.type !== ChannelType.GroupDM
  ) {
    log.debug(F, 'Message was not in a text channel, returning');
    return;
  }

  log.debug(
    F,
    `${messageData.author.displayName} prompted me with: '${messageData.cleanContent}'`,
  );

  // TODO - Do PM stuff here
  if (!messageData.guild) {
    log.debug(F, 'Message was not in a guild, returning');
    return;
  }

  // Determine if the guild has set up ai channels.
  const guildData = await db.discord_guilds.upsert({
    where: { id: messageData.guild.id },
    create: {
      id: messageData.guild.id,
    },
    update: {},
    include: {
      ai_channels: true,
    },
  });
  if (guildData.ai_channels.length === 0) {
    log.debug(F, 'Guild has no AI channels, returning');
    await messageData.reply({
      content: stripIndents`
        This server has not set up the AI module. 
        Please contact ask someone with channel management permissions to run \`/ai setup\`.
        You can also message me directly if you would rather not spam chat.
      `,
    });
    return;
  }

  // Get user data, including the last 24 hours of messages
  const userData = await db.users.upsert({
    where: { discord_id: messageData.author.id },
    create: {
      discord_id: messageData.author.id,
      ai_info: { create: {} },
    },
    update: {
      ai_info: {
        update: {},
      },
    },
    include: {
      ai_info: {
        include: {
          ai_messages: {
            where: {
              created_at: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
              },
            },
          },
        },
      },
    },
  });

  if (!userData.ai_info?.ai_tos_agree || !userData.ai_info?.ai_privacy_agree) {
    if (!userData.ai_info?.ai_tos_agree && !userData.ai_info?.ai_privacy_agree) {
      await messageData.reply('You need to agree to the /ai tos and /ai privacy');
      return;
    }
    if (!userData.ai_info?.ai_tos_agree) {
      await messageData.reply('You still need to agree to the /ai tos');
      return;
    }
    if (!userData.ai_info?.ai_privacy_agree) {
      await messageData.reply('You still need to agree to the /ai privacy');
      return;
    }
    return;
  }

  const { channel } = messageData;

  if (channel.type === ChannelType.GuildText
    || channel.type === ChannelType.PublicThread
    || channel.type === ChannelType.PrivateThread) {
    await channel.sendTyping();
  }

  const typingInterval = setInterval(() => {
    (channel as TextChannel).sendTyping();
  }, 9000); // Start typing indicator every 9 seconds

  const typingFailsafe = setInterval(() => {
    clearInterval(typingInterval); // Stop sending typing indicator
  }, 30000); // Failsafe to stop typing indicator after 30 seconds

  let response = '';
  let promptTokens = 0;
  let completionTokens = 0;
  let usd = 0;

  let differenceInMs = 0;

  // Check if user is a Patreon subscriber
  const isPatreonSubscriber = checkPremiumStatus(
    messageData.member,
    env.PATREON_SUBSCRIBER_ROLE_ID,
    true,
  );
  log.debug(F, `They are ${isPatreonSubscriber ? 'a' : 'not a'} Patreon subscriber`);

  // Sum up the usd of each ai message
  const totalRollingCost = userData.ai_info?.ai_messages.reduce((acc, message) => acc + message.usd, 0) ?? 0;

  const maxCost = isPatreonSubscriber ? 0.35 : 0.10;

  log.debug(F, `Has used ${totalRollingCost} of ${maxCost} USD`);

  let model: string;
  if (totalRollingCost > maxCost) {
    model = userData.ai_info?.secondary_model || 'deepseek/deepseek-chat-v3-0324:free';
  } else {
    model = userData.ai_info?.primary_model || 'google/gemini-2.0-flash-001';
  }
  log.debug(F, `Using ${model} for this message`);

  try {
    const startTime = Date.now();
    const prompt = await AiFunction.createPrompt(messageData, userData.ai_info?.persona_name as PersonaId || 'tripbot');
    const chatResponse = await OpenRouterClient.chat({
      model,
      max_tokens: userData.ai_info?.response_size || 1000,
      prompt,
    });
    const endTime = Date.now();
    differenceInMs = endTime - startTime;
    log.debug(F, `AI response took ${differenceInMs}ms`);
    await AiFunction.aiAudit(messageData.author, messageData, prompt, chatResponse, model);
    response = chatResponse.content;
    promptTokens = chatResponse.usage?.promptTokens ?? 0;
    completionTokens = chatResponse.usage?.completionTokens ?? 0;
    usd = chatResponse.usage?.cost ?? 0;
  } finally {
    clearInterval(typingInterval); // Stop sending typing indicator
    clearTimeout(typingFailsafe); // Clear the failsafe timeout to prevent  it from running
  }

  log.debug(F, `response from API: ${response}`);
  log.debug(F, `cost: ${usd.toFixed(4)}`);

  const personaData = await db.ai_persona.upsert({
    where: {
      name: userData.ai_info?.persona_name || 'Tripbot',
    },
    create: {
      name: userData.ai_info?.persona_name || 'Tripbot',
    },
    update: {},
  });

  if (!userData.ai_info?.id) {
    throw new Error('Missing ai_info');
  }

  // Increment the tokens used
  await db.ai_message.create({
    data: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      tokens: completionTokens + promptTokens,
      usd,
      ai_persona_id: personaData.id,
      ai_info_id: userData.ai_info.id,
      message_id: messageData.id,
    },
  });

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
    // Handle error case - decrement rate limit count
    if (response.length === 0) {
      response = stripIndents`This is unexpected but somehow I don't appear to have anything to say!
      By the way, this is an error message and something went wrong. Please try again.
      Time from query to error: ${(differenceInMs / 1000).toFixed(2)} seconds`;
    }

    // Handle response and rate limit message
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
  user: User, // Discord user
) {
  // We want to collect every message tripbot sends that gets three thumbs downs
  const thumbsUpEmojis = ['👍', '👍🏻', '👍🏼', '👍🏽', '👍🏾', '👍🏿', 'ts_thumbup'];
  const thumbsDownEmojis = ['👎', '👎🏻', '👎🏼', '👎🏽', '👎🏾', '👎🏿', 'ts_thumbdown'];
  if (!messageReaction.message.guild) return; // Ignore DMs
  if (messageReaction.message.reference === null) return;
  if (!messageReaction.message.author?.bot) return; // Ignore non-bot messages
  if (user.bot) return; // Ignore bot users
  if (
    !thumbsUpEmojis.includes(messageReaction.emoji.name as string)
    && !thumbsDownEmojis.includes(messageReaction.emoji.name as string)
  ) return; // Ignore non-audit emojis

  let originalMessage: Message;
  try {
    originalMessage = await messageReaction.message.fetchReference();
  } catch (error) {
    log.error(F, `Error fetching reference: ${error}`);
    log.error(F, `Reaction: ${JSON.stringify(messageReaction, null, 2)}`);
    log.error(
      F,
      `Message: ${JSON.stringify(messageReaction.message, null, 2)}`,
    );
    return;
  }

  log.debug(
    F,
    `${user.displayName} reacted to tripbot's message with an audit emoji (${messageReaction.emoji.name})`,
  );

  // Get the message data from the db

  const messageData = await db.ai_message.findUniqueOrThrow({
    where: {
      message_id: originalMessage.id,
    },
    include: {
      ai_persona: true,
    },
  });

  const action = thumbsUpEmojis.includes(messageReaction.emoji.name as string)
    ? 'approve'
    : 'reject';
  log.debug(F, `Updating  ${messageData.ai_persona.name} with ${action} vote`);

  await db.ai_persona.update({
    where: {
      name: messageData.ai_persona.name,
    },
    data: thumbsUpEmojis.includes(messageReaction.emoji.name as string)
      ? {
        upvotes: {
          increment: 1,
        },
      }
      : {
        downvotes: {
          increment: 1,
        },
      },
  });

  const channelAiVoteLog = (await discordClient.channels.fetch(
    env.CHANNEL_AIVOTELOG,
  )) as TextChannel;
  log.debug(F, 'Sending message to vote room');
  await channelAiVoteLog.send({
    embeds: [
      embedTemplate().setTitle(`AI ${action}`).setDescription(stripIndents`
            ${originalMessage.author.displayName} (${originalMessage.author.id}):
            \`${originalMessage.cleanContent}\`

            TripBot:
            \`${messageReaction.message.cleanContent}\`
          `),
    ],
  });

  const auditLimit = env.NODE_ENV === 'production' ? 4 : 3;
  if (messageReaction.count === auditLimit) {
    const message = thumbsUpEmojis.includes(
      messageReaction.emoji.name as string,
    )
      ? stripIndents`${messageReaction.message.cleanContent}
            
        **Thank you for your feedback, I have notified Moonbear that this response was excellent.**`
      : stripIndents`~~${messageReaction.message.cleanContent}~~
            
        **Thank you for your feedback, I have notified Moonbear that this response was improper.**`;

    // This happens before the message is edited, so we need to fetch the original message

    await channelAiVoteLog.send({
      content: stripIndents`
            The following AI response was deemed ${action === 'reject' ? 'improper' : 'excellent'} by \
            ${messageReaction.message.guild.name} <@${env.DISCORD_OWNER_ID}>`,
    });

    await messageReaction.message.edit(message);

    // Remove the emojis so someone can't just toggle it on and off
    await messageReaction.message.reactions.removeAll();
  }
}

export async function aiMenu(
  interaction: ChannelSelectMenuInteraction | StringSelectMenuInteraction,
): Promise<InteractionEditReplyOptions> {
  const menuId = interaction.customId as keyof typeof AiText.MenuId;

  // eslint-disable-next-line sonarjs/no-small-switch
  switch (menuId) {
    case AiText.MenuId.GUILD_CHANNELS: {
      if (!interaction.guild) {
        log.error(F, 'No guild found');
        return {
          content: 'No guild found',
        };
      }
      // First, save the list of channels to the database
      await db.ai_channel.deleteMany({
        where: {
          guild_id: interaction.guild.id,
        },
      });

      await Promise.all(
        interaction.values.map(async (channelId: string) => {
          await db.ai_channel.create({
            data: {
              channel_id: channelId,
              guild_id: interaction.guild?.id as string,
            },
          });
        }),
      );

      log.debug(F, 'Channels saved to database');

      // Then return the guild setup page

      return AiPage.guildSettings(
        interaction as ChannelSelectMenuInteraction,
      );
    }
    case AiText.MenuId.PERSONA_INFO:
      return AiPage.personas(interaction as StringSelectMenuInteraction);
    case AiText.MenuId.PERSONA_SELECT: {
      await db.users.update({
        where: { discord_id: interaction.user.id },
        data: {
          ai_info: {
            upsert: {
              update: { persona_name: interaction.values[0] },
              create: {
                persona_name: interaction.values[0],
              },
            },
          },
        },
      });
      return AiPage.userSettings(
        interaction as StringSelectMenuInteraction,
      );
    }
    case AiText.MenuId.MODEL_SELECT_PRIMARY: {
      await db.users.update({
        where: { discord_id: interaction.user.id },
        data: {
          ai_info: {
            upsert: {
              update: { primary_model: interaction.values[0] },
              create: {
                primary_model: interaction.values[0],
              },
            },
          },
        },
      });
      return AiPage.userSettings(
        interaction as StringSelectMenuInteraction,
      );
    }
    case AiText.MenuId.MODEL_SELECT_SECONDARY: {
      await db.users.update({
        where: {
          discord_id: interaction.user.id,
        },
        data: {
          ai_info: {
            upsert: {
              update: {
                secondary_model: interaction.values[0],
              },
              create: {
                secondary_model: interaction.values[0],
              },
            },
          },
        },
      });
      return AiPage.userSettings(
        interaction as StringSelectMenuInteraction,
      );
    }
    case AiText.MenuId.PAGE_SELECT:
    default: {
      // eslint-disable-next-line sonarjs/no-nested-switch
      switch (interaction.values[0]) {
        case AiText.Page.INFO.value:
          return AiPage.info(interaction as StringSelectMenuInteraction);
        case AiText.Page.PERSONAS.value:
          return AiPage.personas(interaction as StringSelectMenuInteraction);
        case AiText.Page.USER_SETTINGS.value:
          return AiPage.userSettings(interaction as StringSelectMenuInteraction);
        case AiText.Page.GUILD_SETUP.value:
          return AiPage.guildSettings(interaction as StringSelectMenuInteraction);
        case AiText.Page.PRIVACY.value:
          return AiPage.privacy(interaction as StringSelectMenuInteraction);
        case AiText.Page.TOS.value:
          return AiPage.tos(interaction as StringSelectMenuInteraction);
        default:
          return AiPage.userSettings(interaction as StringSelectMenuInteraction);
      }
    }
  }
}

export async function aiButton(interaction: ButtonInteraction): Promise<void> {
  const buttonID = interaction.customId as keyof typeof AiText.ButtonId;

  // eslint-disable-next-line sonarjs/no-small-switch
  switch (buttonID) {
    case AiText.ButtonId.AGREE_TOS:
      await db.users.update({
        where: {
          discord_id: interaction.user.id,
        },
        data: {
          ai_info: {
            upsert: {
              update: { ai_tos_agree: new Date() },
              create: { ai_tos_agree: new Date() },
            },
          },
        },
      });
      log.debug(F, `User ${interaction.user.id} agreed to the terms`);
      await interaction.update(await AiPage.tos(interaction));
      break;
    case AiText.ButtonId.AGREE_PRIVACY: {
      await db.users.update({
        where: {
          discord_id: interaction.user.id,
        },
        data: {
          ai_info: {
            upsert: {
              update: { ai_privacy_agree: new Date() },
              create: { ai_privacy_agree: new Date() },
            },
          },
        },
      });
      log.debug(F, `User ${interaction.user.id} agreed to the privacy policy`);
      await interaction.update(await AiPage.privacy(interaction));
      break;
    }
    case AiText.ButtonId.RESPONSE_SIZE: {
      log.debug(F, 'Response size button pressed');
      const userData = await db.users.findUniqueOrThrow({
        where: { discord_id: interaction.user.id },
        include: {
          ai_info: true,
        },
      });
      log.debug(F, `Response size: ${userData.ai_info?.response_size}`);
      await interaction.showModal(
        AiModal.responseSize(userData.ai_info?.response_size || 500),
      );
      break;
    }
    case AiText.ButtonId.CONTEXT_SIZE: {
      log.debug(F, 'Context size button pressed');
      const userData = await db.users.findUniqueOrThrow({
        where: { discord_id: interaction.user.id },
        include: {
          ai_info: true,
        },
      });
      await interaction.showModal(
        AiModal.contextSize(userData.ai_info?.context_size || 10000),
      );
      break;
    }
    default:
      await AiPage.userSettings(interaction);
      break;
  }
}

export async function aiModal(
  interaction: ModalSubmitInteraction,
): Promise<void> {
  const modalId = interaction.customId as keyof typeof AiModal.ID;
  switch (modalId) {
    case AiModal.ID.RESPONSE_SIZE:
      await interaction.deferUpdate();
      await db.users.update({
        where: {
          discord_id: interaction.user.id,
        },
        data: {
          ai_info: {
            upsert: {
              update: {
                response_size: Number(
                  interaction.fields.getTextInputValue(
                    AiModal.ID.RESPONSE_SIZE,
                  ),
                ),
              },
              create: {
                response_size: Number(
                  interaction.fields.getTextInputValue(
                    AiModal.ID.RESPONSE_SIZE,
                  ),
                ),
              },
            },
          },
        },
      });
      await interaction.editReply(await AiPage.userSettings(interaction));
      break;
    case AiModal.ID.CONTEXT_SIZE:
      await interaction.deferUpdate();
      await db.users.update({
        where: {
          discord_id: interaction.user.id,
        },
        data: {
          ai_info: {
            upsert: {
              update: {
                context_size: Number(
                  interaction.fields.getTextInputValue(AiModal.ID.CONTEXT_SIZE),
                ),
              },
              create: {
                context_size: Number(
                  interaction.fields.getTextInputValue(AiModal.ID.CONTEXT_SIZE),
                ),
              },
            },
          },
        },
      });
      await interaction.editReply(await AiPage.userSettings(interaction));
      break;
    default:
      log.debug(F, 'Unknown modal submitted');
      break;
  }
}

export default aiCommand;
