import { ai_moderation } from '@db/tripbot';
import { stripIndents } from 'common-tags';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelSelectMenuInteraction,
  ChannelType,
  ClientUser,
  Colors,
  EmbedBuilder,
  GuildMember,
  InteractionEditReplyOptions,
  Message,
  MessageFlags,
  MessageReaction,
  SlashCommandBuilder,
  StringSelectMenuInteraction,
  TextChannel,
  User,
} from 'discord.js';
import { aiModerate } from '../../../global/commands/g.ai';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';

import {
  AiFunction,
  AiPage,
  AiText,
  PersonaId,
} from '../../utils/ai';
import { OpenRouterClient } from '../../utils/aiClients/openrouter.client';

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
  await messageData.fetch();

  // Basic Filters
  if (messageData.author.bot || messageData.cleanContent.length < 1) return;
  if (!messageData.guild) return;

  log.debug(F, `Received message for AI processing: ${messageData.cleanContent} in #${messageData.channelId} by ${messageData.author.tag}`);

  // 1. Permission/Guild Check
  const guildData = await db.discord_guilds.findUnique({
    where: { id: messageData.guild.id },
    include: { ai_channels: true },
  });

  log.debug(F, `Fetched guild data for ${messageData.guild.id}: ${JSON.stringify(guildData)}`);

  const isAiEnabled = guildData?.ai_channels.some(c => c.channel_id === messageData.channelId);
  if (!isAiEnabled) {
    if (messageData.mentions.has(discordClient.user as ClientUser)) {
      await messageData.reply('AI is not enabled in this channel. Ask an admin to run `/ai setup`.');
    }
    return;
  }

  log.debug(F, `AI is enabled for channel ${messageData.channelId}. Continuing processing.`);

  // 2. User Data & Agreement Check
  const userData = await db.users.upsert({
    where: { discord_id: messageData.author.id },
    create: { discord_id: messageData.author.id, ai_info: { create: {} } },
    update: {},
    include: { ai_info: true },
  });

  log.debug(F, `Fetched user data for ${messageData.author.id}: ${JSON.stringify(userData)}`);

  if (!userData.ai_info?.ai_tos_agree || !userData.ai_info?.ai_privacy_agree) {
    await messageData.reply('Please review and agree to `/ai tos` and `/ai privacy` before chatting.');
    return;
  }

  log.debug(F, `User ${messageData.author.id} has agreed to TOS and Privacy. Continuing processing.`);

  // 3. Cost & Model Selection
  const isPremium = AiFunction.checkPremiumStatus(messageData.member as GuildMember);

  log.debug(F, `User ${messageData.author.id} premium status: ${isPremium}`);

  // Use aggregate and alias to avoid ESLint dangling underscore errors
  const rollingStats = await db.ai_message.aggregate({
    _sum: { usd: true },
    where: {
      ai_info_id: userData.ai_info.id,
      created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  log.debug(F, `Fetched rolling stats for ${messageData.author.id}: ${JSON.stringify(rollingStats)}`);

  const { _sum: rollingSum } = rollingStats; // Aliasing here
  const currentCost = rollingSum.usd ? rollingSum.usd.toNumber() : 0;

  const dailyLimit = isPremium ? 0.50 : 0.05;
  const model = currentCost < dailyLimit ? AiText.primaryModel : AiText.backupModel;

  log.debug(F, `Selected model for user ${messageData.author.id}: ${model} (Current cost: $${currentCost.toFixed(4)}, Daily limit: $${dailyLimit})`);

  // 4. Typing Indicator Setup
  if (messageData.channel.isTextBased() && !messageData.channel.isDMBased()) {
    await messageData.channel.sendTyping();
  }

  log.debug(F, `Sent typing indicator in channel ${messageData.channelId}`);

  // 5. Generate and Process Response
  try {
    const personaId = (userData.ai_info.persona_id as PersonaId) || 'tripbot';

    log.debug(F, `Using persona ${personaId} for user ${messageData.author.id}`);

    const prompt = await AiFunction.createPrompt(messageData, personaId);

    log.debug(F, `Generated prompt for user ${messageData.author.id} with persona ${personaId}: ${prompt}`);

    const chatResponse = await OpenRouterClient.chat({
      model,
      max_tokens: 1000,
      prompt,
    });

    const { content, usage } = chatResponse;

    log.debug(F, `Received response from OpenRouter for user ${messageData.author.id}: ${content} (Usage: ${JSON.stringify(usage)})`);

    // Audit & Database Logging
    await AiFunction.aiAudit(messageData.author, messageData, prompt, chatResponse, model);

    const personaData = await db.ai_persona.upsert({
      where: { name: personaId },
      create: { name: personaId },
      update: {},
    });

    log.debug(F, `Upserted persona data for ${personaId}: ${JSON.stringify(personaData)}`);

    await db.ai_message.create({
      data: {
        prompt_tokens: usage?.promptTokens || 0,
        completion_tokens: usage?.completionTokens || 0,
        tokens: (usage?.promptTokens || 0) + (usage?.completionTokens || 0),
        usd: usage?.cost || 0,
        ai_persona_id: personaData.id,
        ai_info_id: userData.ai_info.id,
        message_id: messageData.id,
      },
    });

    log.debug(F, `Created AI message for user ${messageData.author.id}: ${JSON.stringify(messageData)}`);

    const reply = await messageData.reply({
      content: content.slice(0, 2000),
      allowedMentions: { parse: [] },
    });

    log.debug(F, `Sent AI response to user ${messageData.author.id} in channel ${messageData.channelId}`);

    await reply.react('👍');
    await reply.react('👎');
  } catch (err) {
    log.error(F, `AI Error: ${err}`);
    await messageData.reply("I'm having trouble thinking right now. Try again in a minute.");
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

  const channelAiVoteLog = await discordClient.channels.fetch(
    env.CHANNEL_AIVOTELOG,
  );
  if (!channelAiVoteLog || !channelAiVoteLog.isSendable()) {
    log.error(F, 'AI Vote Log channel not found or not text-based');
    return;
  }
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

    // This happens before the message is edited, so we need to fetch the original message.

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
  const {
    customId, values, user,
  } = interaction;

  log.debug(F, `AI Menu interaction with customId: ${customId}`);

  switch (customId) {
    case AiText.MenuId.PERSONA_SELECT: {
      const selectedId = values[0] as PersonaId;
      log.debug(F, `User selected a persona: ${selectedId}`);

      const userData = await db.users.upsert({
        where: { discord_id: user.id },
        create: { discord_id: user.id },
        update: {},
      });

      log.debug(F, `User data ${JSON.stringify(userData)}`);

      await db.ai_info.update({
        where: { user_id: userData.id },
        data: { persona_id: selectedId },
      });

      log.debug(F, `Updated persona for user ${user.id} to ${selectedId} in the database`);

      return AiPage.userSettings(interaction);
    }
    case AiText.MenuId.GUILD_CHANNELS: {
      if (!interaction.inGuild()) {
        return { content: 'This command can only be used in a server.' };
      }

      const { guildId } = interaction;

      // Run both operations in a transaction for safety and speed
      await db.$transaction([
        // 1. Remove channels that are NO LONGER selected
        db.ai_channel.deleteMany({
          where: {
            guild_id: guildId,
            channel_id: { notIn: values },
          },
        }),

        // 2. Add new channels (ignoring ones that already exist)
        // createMany is much more efficient than a forEach loop
        db.ai_channel.createMany({
          data: values.map(id => ({
            channel_id: id,
            guild_id: guildId,
          })),
          skipDuplicates: true, // This prevents errors if the channel is already there
        }),
      ]);

      log.debug(F, `Synced AI channels for guild ${guildId}. Current count: ${values.length}`);

      return AiPage.guildSettings(interaction);
    }
    default:
      break;
  }

  switch (values[0] as string) {
    case AiText.Page.INFO.value:
      return AiPage.info(interaction);
    case AiText.Page.PERSONAS.value:
      return AiPage.personas(interaction);
    case AiText.Page.USER_SETTINGS.value:
      return AiPage.userSettings(interaction);
    case AiText.Page.GUILD_SETUP.value:
      return AiPage.guildSettings(interaction);
    case AiText.Page.PRIVACY.value:
      return AiPage.privacy(interaction);
    case AiText.Page.TOS.value:
      return AiPage.tos(interaction);
    default:
      return AiPage.userSettings(interaction);
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
    // case AiText.ButtonId.RESPONSE_SIZE: {
    //   log.debug(F, 'Response size button pressed');
    //   const userData = await db.users.findUniqueOrThrow({
    //     where: { discord_id: interaction.user.id },
    //     include: {
    //       ai_info: true,
    //     },
    //   });
    //   log.debug(F, `Response size: ${userData.ai_info?.response_size}`);
    //   await interaction.showModal(
    //     AiModal.responseSize(userData.ai_info?.response_size || 500),
    //   );
    //   break;
    // }
    // case AiText.ButtonId.CONTEXT_SIZE: {
    //   log.debug(F, 'Context size button pressed');
    //   const userData = await db.users.findUniqueOrThrow({
    //     where: { discord_id: interaction.user.id },
    //     include: {
    //       ai_info: true,
    //     },
    //   });
    //   await interaction.showModal(
    //     AiModal.contextSize(userData.ai_info?.context_size || 10000),
    //   );
    //   break;
    // }
    default:
      await AiPage.userSettings(interaction);
      break;
  }
}

// export async function aiModal(
//   interaction: ModalSubmitInteraction,
// ): Promise<void> {
//   const modalId = interaction.customId as keyof typeof AiModal.ID;
//   switch (modalId) {
//     case AiModal.ID.RESPONSE_SIZE:
//       await interaction.deferUpdate();
//       await db.users.update({
//         where: {
//           discord_id: interaction.user.id,
//         },
//         data: {
//           ai_info: {
//             upsert: {
//               update: {
//                 response_size: Number(
//                   interaction.fields.getTextInputValue(
//                     AiModal.ID.RESPONSE_SIZE,
//                   ),
//                 ),
//               },
//               create: {
//                 response_size: Number(
//                   interaction.fields.getTextInputValue(
//                     AiModal.ID.RESPONSE_SIZE,
//                   ),
//                 ),
//               },
//             },
//           },
//         },
//       });
//       await interaction.editReply(await AiPage.userSettings(interaction));
//       break;
//     case AiModal.ID.CONTEXT_SIZE:
//       await interaction.deferUpdate();
//       await db.users.update({
//         where: {
//           discord_id: interaction.user.id,
//         },
//         data: {
//           ai_info: {
//             upsert: {
//               update: {
//                 context_size: Number(
//                   interaction.fields.getTextInputValue(AiModal.ID.CONTEXT_SIZE),
//                 ),
//               },
//               create: {
//                 context_size: Number(
//                   interaction.fields.getTextInputValue(AiModal.ID.CONTEXT_SIZE),
//                 ),
//               },
//             },
//           },
//         },
//       });
//       await interaction.editReply(await AiPage.userSettings(interaction));
//       break;
//     default:
//       log.debug(F, 'Unknown modal submitted');
//       break;
//   }
// }

export default aiCommand;
