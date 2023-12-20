/* eslint-disable sonarjs/no-duplicate-string */
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
  Message,
  TextChannel,
  ThreadChannel,
  TextBasedChannel,
  CategoryChannel,
  ForumChannel,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  APIEmbedField,
  EmbedBuilder,
  APIButtonComponent,
  APIActionRowComponent,
  APIMessageComponentEmoji,
  Events,
} from 'discord.js';
import {
  APIInteractionDataResolvedChannel,
  ChannelType,
  TextInputStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import {
  PrismaClient,
  ai_channels,
  ai_model,
  ai_moderation,
  ai_personas,
} from '@prisma/client';
import OpenAI from 'openai';
import { Run } from 'openai/resources/beta/threads/runs/runs';
import { MessageContentText } from 'openai/resources/beta/threads/messages/messages';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';
import { moderate } from '../../../global/commands/g.moderate';
import { sleep } from '../guild/d.bottest';
import aiChat, {
  aiModerate, createMessage, getAssistant, getMessages, getThread, readRun, runThread,
} from '../../../global/commands/g.ai';
import { UserActionType } from '../../../global/@types/database';
import { parseDuration } from '../../../global/utils/parseDuration';

const db = new PrismaClient({ log: ['error'] });

const F = f(__filename);

const maxHistoryLength = 3;

const ephemeralExplanation = 'Set to "True" to show the response only to you';
const personaDoesNotExist = 'This persona does not exist. Please create it first.';
const tripbotUAT = '@TripBot UAT (Moonbear)';

// Costs per 1k tokens
const aiCosts = {
  GPT_3_5_TURBO: {
    input: 0.0015,
    output: 0.002,
  },
  GPT_3_5_TURBO_1106: {
    input: 0.001,
    output: 0.002,
  },
  GPT_4: {
    input: 0.03,
    output: 0.06,
  },
  GPT_4_1106_PREVIEW: {
    input: 0.01,
    output: 0.03,
  },
  GPT_4_1106_VISION_PREVIEW: {
    input: 0.01,
    output: 0.03,
  },
  DALL_E_2: {
    input: 0.00,
    output: 0.04,
  },
  DALL_E_3: {
    input: 0.00,
    output: 0.02,
  },
} as {
  [key in ai_model]: {
    input: number,
    output: number,
  }
};

async function help(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const visible = interaction.options.getBoolean('ephemeral') !== false;
  await interaction.deferReply({ ephemeral: visible });
  await interaction.editReply({
    embeds: [embedTemplate()
      .setTitle('AI Help')
      .setDescription(`
      🤖 Welcome to TripBot's AI Module! 🤖

      🌐 Powered by OpenAI's API, this module is a Language Learning Model (LLM) – a sophisticated tool for crafting \
      sentences, but not a sentient AI. It's like having a super-smart writing assistant at your fingertips!
      
      🚦 A Word of Caution: While GPT-3.5 can be impressively accurate, it's not infallible. Treat its responses as \
      suggestions rather than hard facts. There's no human behind its words, so always apply your own judgment.

      👥 How It Works:
      An **AI Persona** defines the AI's interaction style, including tone and content length.
      We've tailored our **TripBot** persona to provide harm reduction info with a touch of quirkiness.
      Currently, TripBot is the sole persona available outside of TripSit. But there's more to come!
      Eager to work with the AI? Join us in the TripSit guild and chat in <#${env.CHANNEL_TRIPBOT}>!
      
      🔗 Bring AI to Your Guild:
      Simple Integration: Want this AI wizardry in your server? Just a single command away!
\`\`\`
/ai link 
  channel:(optional - defaults to current channel)
  toggle:(optional  - defaults to 'on')
\`\`\`
      *You can link entire categories if you want!*
      
      Lost track of linked channels? Run \`/ai get\` to check how an AI Persona is linked that channel.

      📝 Audit responses:
      You can help us improve the AI by auditing its responses. If you see a response that's excellent or improper, \\
      react to it with the provided thumbs. If enough people agree, we'll take note and try to improve the bot behavior.
      
      🚀 Embark on an AI-Enhanced Journey: Prepare for a new era of AI-driven conversations!
      `)],
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

async function get(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const visible = interaction.options.getBoolean('ephemeral') !== false;
  await interaction.deferReply({ ephemeral: !visible });
  const modelName = interaction.options.getString('name');
  const channel = interaction.options.getChannel('channel') ?? interaction.channel;

  let aiPersona: ai_personas | null = null;
  let description = '' as string;
  if (modelName) {
    aiPersona = await db.ai_personas.findUnique({
      where: {
        name: modelName,
      },
    });
  } else if (channel) {
    // Check if the channel is linked to a persona
    let aiLinkData = await db.ai_channels.findFirst({
      where: {
        channel_id: channel.id,
      },
    });
    if (aiLinkData) {
      log.debug(F, `Found aiLinkData on first go: ${JSON.stringify(aiLinkData, null, 2)}`);
      aiPersona = await db.ai_personas.findUnique({
        where: {
          id: aiLinkData.persona_id,
        },
      });
      if (aiPersona) {
        // eslint-disable-next-line max-len
        description = `Channel ${(channel as TextChannel).name} is linked with the **"${aiPersona.name ?? aiPersona}"** persona:`;
      }
    }

    if (!aiLinkData && (channel as ThreadChannel).parent) {
      log.debug(F, 'Channel is a Thread');
      // If the channel isn't listed in the database, check the parent
      aiLinkData = await db.ai_channels.findFirst({
        where: {
          channel_id: (channel as ThreadChannel).parent?.id,
        },
      });
      if (aiLinkData) {
        aiPersona = await db.ai_personas.findUnique({
          where: {
            id: aiLinkData.persona_id,
          },
        });
        if (aiPersona) {
          // eslint-disable-next-line max-len
          description = `Parent category/channel ${(channel as ThreadChannel).parent} is linked with the **"${aiPersona.name}"** persona:`;
        }
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
        aiPersona = await db.ai_personas.findUnique({
          where: {
            id: aiLinkData.persona_id,
          },
        });
        if (aiPersona) {
          // eslint-disable-next-line max-len
          description = `Parent category ${(channel as ThreadChannel).parent?.parent} is linked with the **"${aiPersona.name}"** persona:`;
        }
      }
    }
  }

  // log.debug(F, `aiPersona: ${JSON.stringify(aiPersona, null, 2)}`);

  if (!aiPersona) {
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

async function getLinkedChannel(
  channel: CategoryChannel | ForumChannel | APIInteractionDataResolvedChannel | TextBasedChannel,
): Promise<ai_channels | null> {
  // With the way AI personas work, they can be assigned to a category, channel, or thread
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

async function saveThreshold(
  interaction: ButtonInteraction,
): Promise<void> {
  log.debug(F, 'saveThreshold started');
  if (!(interaction.member as GuildMember).roles.cache.has(env.DISCORD_OWNER_ID)) return;
  const buttonID = interaction.customId;
  log.debug(F, `buttonID: ${buttonID}`);
  if (!interaction.guild) return;

  const [, , category, amount] = interaction.customId.split('~');
  const amountFloat = parseFloat(amount);

  const buttonRows = interaction.message.components
    .map(row => row.toJSON() as APIActionRowComponent<APIButtonComponent>);
  // log.debug(F, `buttonRows: ${JSON.stringify(buttonRows, null, 2)}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categoryRow = buttonRows
    .find(row => row.components
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .find(button => (button as any).custom_id?.includes(category))) as APIActionRowComponent<APIButtonComponent>;
  // log.debug(F, `categoryRow: ${JSON.stringify(categoryRow, null, 2)}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saveButton = categoryRow.components
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .find(button => (button as any).custom_id?.includes('save')) as APIButtonComponent;

  const labelBreakdown = (saveButton.label as string).split(' ') as string[];
  labelBreakdown.splice(0, 1, 'Saved');
  const newLabel = labelBreakdown.join(' ');

  // Replace the save button with the new value
  categoryRow.components.splice(4, 1, {
    custom_id: `aiMod~save~${category}~${amountFloat}`,
    label: newLabel,
    emoji: '💾' as APIMessageComponentEmoji,
    style: ButtonStyle.Success,
    type: 2,
  } as APIButtonComponent);

  // Replace the category row with the new buttons
  buttonRows.splice(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buttonRows.findIndex(row => row.components.find(button => (button as any).custom_id?.includes(category))),
    1,
    categoryRow,
  );

  const moderationData = await db.ai_moderation.upsert({
    where: {
      guild_id: interaction.guild.id,
    },
    create: {
      guild_id: interaction.guild.id,
    },
    update: {},
  });

  const oldValue = moderationData[category as keyof typeof moderationData];

  await db.ai_moderation.update({
    where: {
      guild_id: interaction.guild.id,
    },
    data: {
      [category]: amountFloat,
    },
  });

  // Get the channel to send the message to
  const channelAiModLog = await discordClient.channels.fetch(env.CHANNEL_AIMOD_LOG) as TextChannel;
  await channelAiModLog.send({
    content: `${interaction.member} adjusted the ${category} limit from ${oldValue} to ${amountFloat}`,
  });

  await interaction.update({
    components: buttonRows,
  });
}

async function adjustThreshold(
  interaction: ButtonInteraction,
): Promise<void> {
  log.debug(F, 'adjustThreshold started');
  if (!(interaction.member as GuildMember).roles.cache.has(env.DISCORD_OWNER_ID)) return;
  // const buttonID = interaction.customId;
  // log.debug(F, `buttonID: ${buttonID}`);

  const [, , category, amount] = interaction.customId.split('~');
  const amountFloat = parseFloat(amount);

  // Go through the components on the message and find the button that has a customID that includes 'save'
  const buttonRows = interaction.message.components
    .map(row => row.toJSON() as APIActionRowComponent<APIButtonComponent>);
  // log.debug(F, `buttonRows: ${JSON.stringify(buttonRows, null, 2)}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categoryRow = buttonRows
    .find(row => row.components
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .find(button => (button as any).custom_id?.includes(category))) as APIActionRowComponent<APIButtonComponent>;
  // log.debug(F, `categoryRow: ${JSON.stringify(categoryRow, null, 2)}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saveButton = categoryRow.components
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .find(button => (button as any).custom_id?.includes('save')) as APIButtonComponent;
  log.debug(F, `saveButton: ${JSON.stringify(saveButton, null, 2)}`);

  const saveValue = parseFloat((saveButton.label as string).split(' ')[3] as string);
  log.debug(F, `saveValue: ${JSON.stringify(saveValue, null, 2)}`);

  const newValue = saveValue + amountFloat;
  log.debug(F, `newValue: ${JSON.stringify(newValue.toFixed(2), null, 2)}`);

  const labelBreakdown = (saveButton.label as string).split(' ') as string[];
  labelBreakdown.splice(3, 1, newValue.toFixed(2));
  const newLabel = labelBreakdown.join(' ');

  // Replace the save button with the new value
  categoryRow.components.splice(4, 1, {
    custom_id: `aiMod~save~${category}~${newValue}`,
    label: newLabel,
    emoji: '💾' as APIMessageComponentEmoji,
    style: ButtonStyle.Primary,
    type: 2,
  } as APIButtonComponent);

  // Replace the category row with the new buttons
  buttonRows.splice(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buttonRows.findIndex(row => row.components.find(button => (button as any).custom_id?.includes(category))),
    1,
    categoryRow,
  );

  // const newComponentList = newRows.map(row => ActionRowBuilder.from(row));

  await interaction.update({
    components: buttonRows,
  });
}

async function noteUser(
  interaction: ButtonInteraction,
): Promise<void> {
  log.debug(F, 'noteUser started');
  const buttonID = interaction.customId;
  log.debug(F, `buttonID: ${buttonID}`);

  if (!(interaction.member as GuildMember).roles.cache.has(env.ROLE_MODERATOR)) return;

  const embed = interaction.message.embeds[0].toJSON();

  const flagsField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Flags') as APIEmbedField;

  await interaction.showModal(new ModalBuilder()
    .setCustomId(`noteModal~${interaction.id}`)
    .setTitle('Tripbot Note')
    .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
      .setLabel('What are you noting about this person?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Tell the team why you are noting this user.')
      .setValue(`This user's message was flagged by the AI for ${flagsField.value}`)
      .setMaxLength(1000)
      .setRequired(true)
      .setCustomId('internalNote'))));
  const filter = (i: ModalSubmitInteraction) => i.customId.includes('noteModal');

  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;
      await i.deferReply({ ephemeral: true });

      const messageField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Message') as APIEmbedField;
      const memberField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Member') as APIEmbedField;
      const urlField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Channel') as APIEmbedField;

      await moderate(
        interaction.member as GuildMember,
        'NOTE' as UserActionType,
        memberField.value.slice(2, -1),
        stripIndents`
        ${i.fields.getTextInputValue('internalNote')}
    
        **The offending message**
        > ${messageField.value}
        ${urlField.value}
      `,
        null,
        null,
      );

      const buttonRows = interaction.message.components.map(row => ActionRowBuilder.from(row.toJSON()));

      const actionField = embed.fields?.find(field => field.name === 'Actions');

      if (actionField) {
        // Add the action to the list of actions
        const newActionFiled = actionField?.value.concat(`
        
        ${interaction.user.toString()} noted this user:
        > ${i.fields.getTextInputValue('internalNote')}
        
        Message sent to user:
        > **No message sent to user on notes**
        `);
        // log.debug(F, `newActionFiled: ${newActionFiled}`);

        // Replace the action field with the new one
        embed.fields?.splice(embed.fields?.findIndex(field => field.name === 'Actions'), 1, {
          name: 'Actions',
          value: newActionFiled,
          inline: true,
        });
      } else {
        embed.fields?.push(
          {
            name: 'Actions',
            value: stripIndents`${interaction.user.toString()} noted this user:
            > ${i.fields.getTextInputValue('internalNote')}
        
            Message sent to user:
            > ${i.fields.getTextInputValue('description')}`,
            inline: true,
          },
        );
      }
      embed.color = Colors.Green;

      await i.editReply('User was noted');

      await interaction.message.edit({
        embeds: [embed],
        components: buttonRows as ActionRowBuilder<ButtonBuilder>[],
      });
    });
}

async function muteUser(
  interaction: ButtonInteraction,
): Promise<void> {
  log.debug(F, 'muteUser started');
  const buttonID = interaction.customId;
  log.debug(F, `buttonID: ${buttonID}`);
  if (!(interaction.member as GuildMember).roles.cache.has(env.ROLE_MODERATOR)) return;

  const embed = interaction.message.embeds[0].toJSON();

  const flagsField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Flags') as APIEmbedField;
  const messageField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Message') as APIEmbedField;
  const memberField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Member') as APIEmbedField;
  const urlField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Channel') as APIEmbedField;

  await interaction.showModal(new ModalBuilder()
    .setCustomId(`timeoutModal~${interaction.id}`)
    .setTitle('Tripbot Timeout')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setLabel('Why are you muting this person?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Tell the team why you are muting this user.')
        .setValue(`This user breaks TripSit's policies regarding ${flagsField.value} topics.`)
        .setMaxLength(1000)
        .setRequired(true)
        .setCustomId('internalNote')),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setLabel('What should we tell the user?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('This will be sent to the user!')
        .setValue(stripIndents`
        Your recent messages have broken TripSit's policies regarding ${flagsField.value} topics.
        
        The offending message
        > ${messageField.value}
        ${urlField.value}`)
        .setMaxLength(1000)
        .setRequired(false)
        .setCustomId('description')),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setLabel('Timeout for how long? (Max/default 7 days)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('4 days 3hrs 2 mins 30 seconds')
        .setRequired(false)
        .setCustomId('timeoutDuration')),
    ));
  const filter = (i: ModalSubmitInteraction) => i.customId.includes('timeoutModal');

  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;
      await i.deferReply({ ephemeral: true });

      const duration = i.fields.getTextInputValue('timeoutDuration')
        ? await parseDuration(i.fields.getTextInputValue('timeoutDuration'))
        : 604800000;

      if (duration > 604800000) {
        await i.editReply('Cannot remove messages older than 7 days.');
        return;
      }

      await moderate(
        interaction.member as GuildMember,
        'TIMEOUT' as UserActionType,
        memberField.value.slice(2, -1),
        stripIndents`
        ${i.fields.getTextInputValue('internalNote')}
    
        **The offending message**
        > ${messageField.value}
        ${urlField.value}
      `,
        i.fields.getTextInputValue('description'),
        duration,
      );

      const buttonRows = interaction.message.components.map(row => ActionRowBuilder.from(row.toJSON()));

      const actionField = embed.fields?.find(field => field.name === 'Actions');

      if (actionField) {
        // Add the action to the list of actions
        const newActionFiled = actionField?.value.concat(`
        
        ${interaction.user.toString()} muted this user:
        > ${i.fields.getTextInputValue('internalNote')}
        
        Message sent to user:
        > ${i.fields.getTextInputValue('description')}`);
        // log.debug(F, `newActionFiled: ${newActionFiled}`);

        // Replace the action field with the new one
        embed.fields?.splice(embed.fields?.findIndex(field => field.name === 'Actions'), 1, {
          name: 'Actions',
          value: newActionFiled,
          inline: true,
        });
      } else {
        embed.fields?.push(
          {
            name: 'Actions',
            value: stripIndents`${interaction.user.toString()} muted this user:
            > ${i.fields.getTextInputValue('internalNote')}
        
            Message sent to user:
            > ${i.fields.getTextInputValue('description')}`,
            inline: true,
          },
        );
      }
      embed.color = Colors.Green;

      await i.editReply('User was muted');

      await interaction.message.edit({
        embeds: [embed],
        components: buttonRows as ActionRowBuilder<ButtonBuilder>[],
      });
    });
}

async function warnUser(
  interaction: ButtonInteraction,
): Promise<void> {
  log.debug(F, 'warnUser started');
  const buttonID = interaction.customId;
  log.debug(F, `buttonID: ${buttonID}`);
  if (!(interaction.member as GuildMember).roles.cache.has(env.ROLE_MODERATOR)) return;

  const embed = interaction.message.embeds[0].toJSON();

  const flagsField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Flags') as APIEmbedField;
  const messageField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Message') as APIEmbedField;
  const memberField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Member') as APIEmbedField;
  const urlField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Channel') as APIEmbedField;

  await interaction.showModal(new ModalBuilder()
    .setCustomId(`warnModal~${interaction.id}`)
    .setTitle('Tripbot Warn')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setLabel('Why are you warning this person?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Tell the team why you are warning this user.')
        .setValue(`This user breaks TripSit's policies regarding ${flagsField.value} topics.`)
        .setMaxLength(1000)
        .setRequired(true)
        .setCustomId('internalNote')),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setLabel('What should we tell the user?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('This will be sent to the user!')
        .setValue(stripIndents`Your recent messages have broken TripSit's policies regarding ${flagsField.value} topics.
        
        The offending message
        > ${messageField.value}
        ${urlField.value}`)
        .setMaxLength(1000)
        .setRequired(true)
        .setCustomId('description')),
    ));
  const filter = (i: ModalSubmitInteraction) => i.customId.includes('warnModal');

  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;
      await i.deferReply({ ephemeral: true });

      await moderate(
        interaction.member as GuildMember,
        'WARNING' as UserActionType,
        memberField.value.slice(2, -1),
        stripIndents`
        ${i.fields.getTextInputValue('internalNote')}
    
        **The offending message**
        > ${messageField.value}
        ${urlField.value}
      `,
        i.fields.getTextInputValue('description'),
        null,
      );

      const buttonRows = interaction.message.components.map(row => ActionRowBuilder.from(row.toJSON()));

      const actionField = embed.fields?.find(field => field.name === 'Actions');

      if (actionField) {
        // Add the action to the list of actions
        const newActionFiled = actionField?.value.concat(`
        
        ${interaction.user.toString()} warned this user:
        > ${i.fields.getTextInputValue('internalNote')}
        
        Message sent to user:
        > ${i.fields.getTextInputValue('description')}`);
        // log.debug(F, `newActionFiled: ${newActionFiled}`);

        // Replace the action field with the new one
        embed.fields?.splice(embed.fields?.findIndex(field => field.name === 'Actions'), 1, {
          name: 'Actions',
          value: newActionFiled,
          inline: true,
        });
      } else {
        embed.fields?.push(
          {
            name: 'Actions',
            value: stripIndents`${interaction.user.toString()} warned this user:
            > ${i.fields.getTextInputValue('internalNote')}
        
            Message sent to user:
            > ${i.fields.getTextInputValue('description')}`,
            inline: true,
          },
        );
      }
      embed.color = Colors.Green;

      await i.editReply('User was warned');

      await interaction.message.edit({
        embeds: [embed],
        components: buttonRows as ActionRowBuilder<ButtonBuilder>[],
      });
    });
}

async function banUser(
  interaction: ButtonInteraction,
): Promise<void> {
  log.debug(F, 'banUser started');
  const buttonID = interaction.customId;
  log.debug(F, `buttonID: ${buttonID}`);
  if (!(interaction.member as GuildMember).roles.cache.has(env.ROLE_MODERATOR)) return;

  const embed = interaction.message.embeds[0].toJSON();

  const flagsField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Flags') as APIEmbedField;
  const messageField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Message') as APIEmbedField;
  const memberField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Member') as APIEmbedField;
  const urlField = (embed.fields as APIEmbedField[]).find(field => field.name === 'Channel') as APIEmbedField;

  await interaction.showModal(new ModalBuilder()
    .setCustomId(`banModal~${interaction.id}`)
    .setTitle('Tripbot Ban')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setLabel('Why are you banning this user?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Tell the team why you are banning this user.')
        .setValue(`This user breaks TripSit's policies regarding ${flagsField.value} topics.`)
        .setMaxLength(1000)
        .setRequired(true)
        .setCustomId('internalNote')),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setLabel('What should we tell the user?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('This will be sent to the user!')
        .setValue(stripIndents`Your recent messages have broken TripSit's policies regarding ${flagsField.value} topics.
        
        The offending message
        > ${messageField.value}
        ${urlField.value}`)
        .setMaxLength(1000)
        .setRequired(false)
        .setCustomId('description')),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setLabel('How many days of msg to remove?')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Between 0 and 7 days (Default 0)')
        .setRequired(false)
        .setCustomId('duration')),
    ));
  const filter = (i: ModalSubmitInteraction) => i.customId.includes('banModal');

  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;
      await i.deferReply({ ephemeral: true });

      const duration = i.fields.getTextInputValue('duration')
        ? await parseDuration(i.fields.getTextInputValue('duration'))
        : 0;

      if (duration > 604800000) {
        await i.editReply('Cannot remove messages older than 7 days.');
        return;
      }

      await moderate(
        interaction.member as GuildMember,
        'FULL_BAN' as UserActionType,
        memberField.value.slice(2, -1),
        stripIndents`
        ${i.fields.getTextInputValue('internalNote')}
    
        **The offending message**
        > ${messageField.value}
        ${urlField.value}
      `,
        i.fields.getTextInputValue('description'),
        duration,
      );

      const buttonRows = interaction.message.components.map(row => ActionRowBuilder.from(row.toJSON()));

      const actionField = embed.fields?.find(field => field.name === 'Actions');

      if (actionField) {
        // Add the action to the list of actions
        const newActionFiled = actionField?.value.concat(`
        
        ${interaction.user.toString()} banned this user:
        > ${i.fields.getTextInputValue('internalNote')}
        
        Message sent to user:
        > ${i.fields.getTextInputValue('description')}`);
        // log.debug(F, `newActionFiled: ${newActionFiled}`);

        // Replace the action field with the new one
        embed.fields?.splice(embed.fields?.findIndex(field => field.name === 'Actions'), 1, {
          name: 'Actions',
          value: newActionFiled,
          inline: true,
        });
      } else {
        embed.fields?.push(
          {
            name: 'Actions',
            value: stripIndents`${interaction.user.toString()} noted this user:
            > ${i.fields.getTextInputValue('internalNote')}
        
            Message sent to user:
            > ${i.fields.getTextInputValue('description')}`,
            inline: true,
          },
        );
      }
      embed.color = Colors.Green;

      await i.editReply('User was banned');

      await interaction.message.edit({
        embeds: [embed],
        components: buttonRows as ActionRowBuilder<ButtonBuilder>[],
      });
    });
}

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

async function link(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const visible = interaction.options.getBoolean('ephemeral') !== false;
  if (!interaction.guild) return;
  await interaction.deferReply({ ephemeral: !visible });

  const personaName = interaction.options.getString('name') ?? 'tripbot';
  const toggle = (interaction.options.getString('toggle') ?? 'enable') as 'enable' | 'disable';
  const textChannel = interaction.options.getChannel('channel') ?? interaction.channel;

  if (toggle === 'enable') {
    if (!textChannel) {
      await interaction.editReply({
        embeds: [embedTemplate()
          .setTitle('Modal')
          .setColor(Colors.Red)
          .setDescription('You must provide a text channel to link to.')],

      });
      return;
    }

    const personaData = await db.ai_personas.findUnique({
      where: {
        name: personaName,
      },
    });

    if (!personaData) {
      await interaction.editReply({
        embeds: [embedTemplate()
          .setTitle('Modal')
          .setColor(Colors.Red)
          .setDescription(personaDoesNotExist)],

      });
      return;
    }

    const aiLinkData = await db.ai_channels.findFirst({
      where: {
        channel_id: textChannel.id,
      },
    });

    const verb = aiLinkData ? 'updated' : 'created';

    await db.ai_channels.upsert({
      where: {
        channel_id_persona_id: {
          channel_id: textChannel.id,
          persona_id: personaData.id,
        },
      },
      create: {
        channel_id: textChannel.id,
        persona_id: personaData.id,
      },
      update: {
        channel_id: textChannel.id,
        persona_id: personaData.id,
      },
    });

    await interaction.editReply({
      embeds: [embedTemplate()
        .setTitle('Modal')
        .setColor(Colors.Red)
        .setDescription(`Success: The link between ${personaName} and <#${textChannel.id}> was ${verb}!`)],
    });

    await interaction.editReply({
      embeds: [embedTemplate()
        .setTitle('Modal')
        .setColor(Colors.Red)
        .setDescription(`Success: The link between ${personaName} and <#${textChannel.id}> was ${verb}!`)],
    });

    const channelAiLog = await discordClient.channels.fetch(env.CHANNEL_AILOG) as TextChannel;
    await channelAiLog.send({
      content: `AI link between ${personaName} and <#${textChannel.id}> on the ${interaction.guild.name} server ${verb} (<@${env.DISCORD_OWNER_ID}>)`,
    });
    return;
  }

  const aiLinkData = textChannel
    ? await getLinkedChannel(textChannel as TextChannel)
    : await getLinkedChannel(interaction.channel as TextChannel);

  log.debug(F, `aiLinkData: ${JSON.stringify(aiLinkData, null, 2)}`);
  if (aiLinkData) {
    await db.ai_channels.delete({
      where: {
        id: aiLinkData.id,
      },
    });
    await interaction.editReply({
      embeds: [embedTemplate()
        .setTitle('Modal')
        .setColor(Colors.Red)
        .setDescription(`Link between <#${aiLinkData.channel_id}> and ${personaName} was removed!`)],
    });
    const channelAiLog = await discordClient.channels.fetch(env.CHANNEL_AILOG) as TextChannel;
    await channelAiLog.send({
      content: `AI link between ${personaName} and <#${aiLinkData.channel_id}> on the ${interaction.guild.name} server deleted (<@${env.DISCORD_OWNER_ID}>)`,
    });
  } else {
    await interaction.editReply({
      embeds: [embedTemplate()
        .setTitle('Modal')
        .setColor(Colors.Red)
        .setDescription('This channel is not linked to an AI persona.')],

    });
  }

  // // For toggle off
  // if (textChannel) {
  //   // response = await aiLink(personaName, textChannel.id, toggle);
  //   const existingPersona = await db.ai_personas.findUnique({
  //     where: {
  //       name: personaName,
  //     },
  //   });

  //   if (!existingPersona) {
  //     await interaction.editReply({
  //       embeds: [embedTemplate()
  //         .setTitle('Modal')
  //         .setColor(Colors.Red)
  //         .setDescription(personaDoesNotExist)],

  //     });
  //     return;
  //   }

  //   let existingLink = await db.ai_channels.findFirst({
  //     where: {
  //       channel_id: textChannel.id,
  //       persona_id: existingPersona.id,
  //     },
  //   });

  //   if (!existingLink) {
  //     existingLink = await db.ai_channels.findFirst({
  //       where: {
  //         channel_id: textChannel.id,
  //       },
  //     });

  //     if (!existingLink) {
  //       await interaction.editReply({
  //         embeds: [embedTemplate()
  //           .setTitle('Modal')
  //           .setColor(Colors.Red)
  //           .setDescription(`Error: No link to <#${textChannel.id}> found!`)],

  //       });
  //       return;
  //     }
  //     const personaData = await db.ai_personas.findUnique({
  //       where: {
  //         id: existingLink.persona_id,
  //       },
  //     });
  //     if (!personaData) {
  //       await interaction.editReply({
  //         embeds: [embedTemplate()
  //           .setTitle('Modal')
  //           .setColor(Colors.Red)
  //           .setDescription('Error: No persona found for this link!')],

  //       });
  //       return;
  //     }
  //     await db.ai_channels.delete({
  //       where: {
  //         id: existingLink.id,
  //       },
  //     });
  //   }
  // } else if (interaction.channel) {

  // } else {
  //   await interaction.editReply({
  //     embeds: [embedTemplate()
  //       .setTitle('Modal')
  //       .setColor(Colors.Red)
  //       .setDescription('Could not find a channel to unlnk')],

  //   });
  // }
}

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

export async function discordAiChat(
  messageData: Message<boolean>,
): Promise<void> {
  if (!env.OPENAI_API_ORG || !env.OPENAI_API_KEY) return;
  await messageData.fetch();

  // log.debug(F, `messageData: ${JSON.stringify(messageData, null, 2)}`);

  const channelMessages = await messageData.channel.messages.fetch({ limit: 10 });
  // log.debug(F, `channelMessages: ${JSON.stringify(channelMessages.map(message => message.cleanContent), null, 2)}`);

  const messages = [...channelMessages.values()];

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

  log.debug(F, ` ${messageData.author.displayName} asked me ${messageData.cleanContent}`);

  // Check if the channel is linked to a persona
  const aiLinkData = await getLinkedChannel(messages[0].channel);
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

  // Get the last 3 messages that are not empty or from other bots
  const messageList = messages
    .filter(message => message.cleanContent.length > 0 && !message.author.bot)
    .map(message => ({
      role: 'user',
      content: message.cleanContent
        .replace(tripbotUAT, '')
        .replace('tripbot', '')
        .trim(),
    }))
    .slice(0, maxHistoryLength)
    .reverse() as OpenAI.Chat.ChatCompletionMessageParam[];

  // log.debug(F, `messageList: ${JSON.stringify(messageList, null, 2)}`);

  const cleanMessageList = messages
    .filter(message => message.cleanContent.length > 0 && !message.author.bot)
    .slice(0, maxHistoryLength)
    .reverse();

  const { response, promptTokens, completionTokens } = await aiChat(aiPersona, messageList, messageData.author.id);

  log.debug(F, `response: ${response}`);
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

  const userData = await db.users.upsert({
    where: { discord_id: messageData.author.id },
    create: { discord_id: messageData.author.id },
    update: {},
  });

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

  await messages[0].channel.sendTyping();

  const wpm = 120;
  const wordCount = response.split(' ').length;
  const sleepTime = (wordCount / wpm) * 60000;
  // log.debug(F, `Typing ${wordCount} at ${wpm} wpm will take ${sleepTime / 1000} seconds`);
  await sleep(sleepTime > 10000 ? 5000 : sleepTime); // Don't wait more than 5 seconds
  const replyMessage = await messages[0].reply(response.slice(0, 2000));

  // React to that message with thumbs up and thumbs down emojis
  try {
    await replyMessage.react(env.EMOJI_THUMB_UP);
    await replyMessage.react(env.EMOJI_THUMB_DOWN);
  } catch (error) {
    log.error(F, `Error reacting to message: ${messages[0].url}`);
    log.error(F, `${error}`);
  }
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
      // TODO: If the user starts typing again, cancel the run and wait for them to either stop typing or send a message

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

export async function aiModButton(
  interaction: ButtonInteraction,
) {
  const buttonID = interaction.customId;
  log.debug(F, `buttonID: ${buttonID}`);
  const [, buttonAction] = buttonID.split('~');

  switch (buttonAction) {
    case 'adjust':
      await adjustThreshold(interaction);
      break;
    case 'save':
      await saveThreshold(interaction);
      break;
    case 'note':
      await noteUser(interaction);
      break;
    case 'warn':
      await warnUser(interaction);
      break;
    case 'timeout':
      await muteUser(interaction);
      break;
    case 'ban':
      await banUser(interaction);
      break;
    default:
      break;
  }
}

export const aiCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription('TripBot\'s AI')
    .addSubcommand(subcommand => subcommand
      .setDescription('Information on the AI persona.')
      .setName('help'))
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
      .setDescription('Link an AI model to a channel.')
      .addStringOption(option => option.setName('name')
        .setDescription('AI persona to link. (Default: TripBot)')
        .setAutocomplete(true))
      .addChannelOption(option => option.setName('channel')
        .setDescription('Channel, thread or category. (Default: This channel)'))
      .addStringOption(option => option.setName('toggle')
        .setDescription('Enable to disable this link? (Default: Enable)')
        .setChoices(
          { name: 'Enable', value: 'enable' },
          { name: 'Disable', value: 'disable' },
        ))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(ephemeralExplanation))
      .setName('link')),

  async execute(interaction) {
    log.info(F, await commandContext(interaction));

    const command = interaction.options.getSubcommand().toUpperCase() as 'HELP' | 'GET' | 'LINK';
    switch (command) {
      case 'HELP':
        await help(interaction);
        break;
      case 'GET':
        await get(interaction);
        break;
      case 'LINK':
        await link(interaction);
        break;
      default:
        help(interaction);
        break;
    }

    return true;
  },
};

export default aiCommand;
