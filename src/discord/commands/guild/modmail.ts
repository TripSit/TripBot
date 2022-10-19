/* eslint-disable max-len */
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ModalBuilder,
  ButtonBuilder,
  TextInputBuilder,
  Colors,
  GuildMember,
  ThreadChannel,
  Message,
  ButtonInteraction,
  TextChannel,
  ModalSubmitInteraction,
  Role,
  GuildMemberRoleManager,
  // MessageReaction,
  User,
} from 'discord.js';
import {
  ChannelType,
  ButtonStyle,
  TextInputStyle,
} from 'discord-api-types/v10';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {stripIndents} from 'common-tags';
import env from '../../../global/utils/env.config';
import logger from '../../../global/utils/logger';
import {ticketDbEntry} from '../../../global/@types/database';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const modmail: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('modmail')
    .setDescription('Modmail actions!')
    .addSubcommand((subcommand) => subcommand
      .setDescription('Own this ticket')
      .setName('own'))
    .addSubcommand((subcommand) => subcommand
      .setDescription('Close this ticket as resolved')
      .setName('close'))
    .addSubcommand((subcommand) => subcommand
      .setDescription('Reopen this ticket')
      .setName('reopen'))
    .addSubcommand((subcommand) => subcommand
      .setDescription('Block this user from future messages/tickets')
      .setName('block'))
    .addSubcommand((subcommand) => subcommand
      .setDescription('Unblock this user')
      .setName('unblock'))
    .addSubcommand((subcommand) => subcommand
      .setDescription('Take the ticket off hold')
      .setName('unpause'))
    .addSubcommand((subcommand) => subcommand
      .setDescription('Put the ticket on hold')
      .setName('pause')),
  async execute(interaction:ChatInputCommandInteraction) {
    await modmailActions(interaction);
  },
};

/**
 * The first response when someone messages the bot
 * @param {Message} message The message sent to the bot
 */
export async function modmailInitialResponse(message:Message) {
  // logger.debug(`[${PREFIX}] Message: ${JSON.stringify(message, null, 2)}!`);

  const embed = embedTemplate()
    .setColor(Colors.Blue);

  const author = message.author;
  const guild = await message.client.guilds.fetch(env.DISCORD_GUILD_ID);
  logger.debug(`[${PREFIX}] Message sent in DM by ${message.author.username}!`);
  const description = stripIndents`Hey there ${author}! I'm a helper bot for ${guild} =)

  💚 Trip Sit Me! - This starts a thread with Team TripSit! You can also join our Discord server and ask for help there!
  
  💙 Give Feedback - Sends a note to the dev team: Can be a suggestion, feedback, or issue. Please be detailed!

  🖤 Technical Issues - Starts a thread with the tech team. Please be detailed with your problem so we can try to help!

  ❤ Ban Appeal - Starts a thread with the moderator team. Please be patient and do not PM moderators directly.
  `;
  embed.setDescription(description);

  const modmailInitialResponseButtons = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('modmailTripsitter')
        .setLabel('Trip Sit Me!')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('modmailFeedback')
        .setLabel('Give Feedback')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('modmailTechIssue')
        .setLabel('Tech Issues')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('modmailBanAppeal')
        .setLabel('Ban Appeals')
        .setStyle(ButtonStyle.Danger),
    );

  message.author.send({embeds: [embed], components: [modmailInitialResponseButtons]});
}

/**
 *
 * @param {ButtonInteraction} interaction
 * @param {'appeal' | 'tripsit' | 'tech'} issueType
 */
export async function modmailCreate(
  interaction:ButtonInteraction,
  issueType:'appeal' | 'tripsit' | 'tech' | 'feedback') {
  // logger.debug(`[${PREFIX}] Message: ${JSON.stringify(interaction, null, 2)}!`);

  // Get the actor
  const actor = interaction.user;

  // Get the member object, if it exists
  // This is used later on to check if the user is part of the guild or not
  const member = interaction.member as GuildMember;
  logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}!`);

  // Create a dict of variables to be used based on the type of request
  const modmailVars = {
    appeal: {
      customId: `ModmailIssueModal~${issueType}`,
      title: 'Ban Appeal',
      description: 'Please be patient and do not PM moderators directly.',
      labelA: 'What is your appeal? Be super detailed!',
      placeholderA: `I have an issue, can you please help?`,
      labelB: '',
      placeholderB: '',
      color: Colors.Red,
      channelId: env.CHANNEL_TALKTOTS,
      channelTitle: `🧡│${member ? member.displayName : actor.username}'s ban appeal`,
      pingRole: env.ROLE_MODERATOR,
      firstResponse: 'thank you for using the bot to appeal your ban!',
    },
    tripsit: {
      customId: `ModmailIssueModal~${issueType}`,
      title: 'Tripsit Me!',
      description: 'You can also join our Discord server and ask for help there!',
      labelA: 'What substance? How much taken? What time?',
      placeholderA: `I have an issue, can you please help?`,
      labelB: 'What\'s going on? Give us the details!',
      placeholderB: `I have an issue, can you please help?`,
      color: Colors.Green,
      channelId: env.CHANNEL_TRIPSIT,
      channelTitle: `🧡│${member ? member.displayName : actor.username}'s channel`,
      pingRole: env.ROLE_HELPER,
      firstResponse: 'thank you for asking for assistance!',
    },
    tech: {
      customId: `ModmailIssueModal~${issueType}`,
      title: 'Technical Issues',
      description: 'Please be detailed with your problem so we can try to help!',
      labelA: 'What is your issue? Be super detailed!',
      placeholderA: `I have an issue, can you please help?`,
      labelB: '',
      placeholderB: '',
      color: Colors.Grey,
      channelId: env.CHANNEL_HELPDESK,
      channelTitle: `🧡│${member ? member.displayName : actor.username}'s tech issue`,
      pingRole: env.ROLE_MODERATOR,
      firstResponse: 'thank you for asking for assistance!',
    },
    feedback: {
      customId: `ModmailIssueModal~${issueType}`,
      title: 'Give Feedback',
      description: 'Can be a suggestion, feedback, or issue. Please be detailed!',
      labelA: 'What is your feedback/suggestion?',
      placeholderA: 'This bot is cool and I have a suggestion...',
      labelB: '',
      placeholderB: '',
      color: Colors.Blue,
      channelId: env.CHANNEL_TALKTOTS,
      channelTitle: `🧡│${member ? member.displayName : actor.username}'s feedback`,
      pingRole: env.ROLE_MODERATOR,
      firstResponse: 'thank you for your feedback!',
    },
  };

  // Get the ticket info, if it exists
  let ticketData = {} as ticketDbEntry;
  if (global.db) {
    const ref = db.ref(`${env.FIREBASE_DB_TICKETS}/${member ? member.user.id : interaction.user.id}/`);
    await ref.once('value', (data) => {
      if (data.val() !== null) {
        ticketData = data.val();
      }
    });
  }
  // logger.debug(`[${PREFIX}] ticketData: ${JSON.stringify(ticketData, null, 2)}!`);

  // Get the parent channel to be used
  const channel = interaction.client.channels.cache.get(modmailVars[issueType].channelId) as TextChannel;

  // Check if an open thread already exists, and if so, update that thread
  if (Object.keys(ticketData).length !== 0 && ticketData.issueStatus !== 'closed') {
    // const issueType = ticketInfo.issueType;
    let issueThread = {} as ThreadChannel;
    try {
      issueThread = await channel.threads.fetch(ticketData.issueThread) as ThreadChannel;
    } catch (err) {
      logger.debug(`[${PREFIX}] The thread has likely been deleted!`);
      ticketData.issueStatus = 'closed';
      if (global.db) {
        const ref = db.ref(`${env.FIREBASE_DB_TICKETS}/${member ? member.user.id : interaction.user.id}/`);
        await ref.update(ticketData);
      }
    }
    // logger.debug(`[${PREFIX}] issueThread: ${JSON.stringify(issueThread, null, 2)}!`);
    if (issueThread.id) {
      const embed = embedTemplate();
      if (member instanceof GuildMember) {
        embed.setDescription(stripIndents`
          You already have an open issue here${issueThread.toString()}, come join the conversation!
        `);
      } else {
        embed.setDescription(stripIndents`
          You already have an open issue, you can talk to the team by talking to the bot!
        `);
      }
      interaction.reply({embeds: [embed], ephemeral: true});
      return;
    }
  }

  // Create the modal
  const modal = new ModalBuilder()
    .setCustomId(modmailVars[issueType].customId)
    .setTitle(modmailVars[issueType].title);

  // An action row only holds one text input, so you need one action row per text input.
  const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
    .setLabel(modmailVars[issueType].labelA)
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder(modmailVars[issueType].placeholderA)
    .setCustomId('inputA')
    .setRequired(true),
  );

  // Only the Tripsit modal has a second text input
  if (modmailVars[issueType].labelB !== '') {
    const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
      .setLabel(modmailVars[issueType].labelB)
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder(modmailVars[issueType].placeholderB)
      .setCustomId('inputB')
      .setRequired(true),
    );
      // Add inputs to the modal
    modal.addComponents(firstActionRow, secondActionRow);
  } else {
    // Add inputs to the modal
    modal.addComponents(firstActionRow);
  }

  // Show the modal to the user
  await interaction.showModal(modal);

  // Collect a modal submit interaction
  const filter = (interaction:ModalSubmitInteraction) => interaction.customId.includes(`ModmailIssueModal`);
  interaction.awaitModalSubmit({filter, time: 0})
    .then(async (interaction) => {
      // Get whatever they sent in the modal
      const modalInputA = interaction.fields.getTextInputValue(`inputA`);
      logger.debug(`[${PREFIX}] modalInputA: ${modalInputA}!`);
      let modalInputB = '';
      try {
        modalInputB = interaction.fields.getTextInputValue(`inputB`);
        logger.debug(`[${PREFIX}] modalInputB: ${modalInputB}!`);
      } catch (e) {}

      // Create the thread
      const threadtype = channel.guild.premiumTier > 2 ? ChannelType.PrivateThread : ChannelType.PublicThread;
      const ticketThread = await channel.threads.create({
        name: modmailVars[issueType].channelTitle,
        autoArchiveDuration: 1440,
        type: threadtype,
        reason: `${actor.username} submitted a(n) ${issueType} ticket!`,
      });
      logger.debug(`[${PREFIX}] Created thread ${ticketThread.id}`);

      // Get the tripsit guild
      const tripsitGuild = interaction.client.guilds.cache.get(env.DISCORD_GUILD_ID)!;
      // Get the helper and TS roles
      const roleHelper = await tripsitGuild.roles.fetch(env.ROLE_TRIPSITTER) as Role;
      logger.debug(`[${PREFIX}] roleHelper: ${roleHelper}`);
      const roleTripsitter = tripsitGuild.roles.cache.find((role) => role.id === env.ROLE_TRIPSITTER) as Role;
      logger.debug(`[${PREFIX}] roleTripsitter: ${roleTripsitter}`);

      // Respond to the user
      const embed = embedTemplate();
      let firstResponse = '';
      if (member instanceof GuildMember) {
        firstResponse = stripIndents`
          Hey ${actor}, ${modmailVars[issueType].firstResponse}

          Click here to be taken to your private room: ${ticketThread.toString()}

          You can also click in your channel list to see your private room!
        `;
        if (issueType === 'tripsit') {
          firstResponse = stripIndents`
          Hey ${actor}, ${modmailVars[issueType].firstResponse}

          Click here to be taken to your private room: ${ticketThread.toString()}

          You can also click in your channel list to see your private room!

          ${roleHelper.name} and ${roleTripsitter.name} will be with you as soon as they're available!
          If this is a medical emergency please contact your local /EMS: we do not call EMS on behalf of anyone.
          When you're feeling better you can use the "I'm Good" button to let the team know you're okay.
          If you just would like someone to talk to, check out the warmline directory: https://warmline.org/warmdir.html#directory
        `;
        }
        interaction.reply({
          embeds: [embed],
          flags: ['SuppressEmbeds'],
        });
      } else {
        firstResponse = stripIndents`
          Hey ${actor}, ${modmailVars[issueType].firstResponse}

          We've sent the following details to the team:

          ${modmailVars[issueType].labelA}
          > ${modalInputA}
          ${modalInputB !== '' ? stripIndents`${modmailVars[issueType].labelB}
          > ${modalInputB}
          ` : ''}
          **We will respond to right here when we can!**
        `;
        if (issueType === 'tripsit') {
          firstResponse = stripIndents`
          Hey ${actor}, thank you for asking for assistance!
  
          We've sent the following details to the team:
  
          ${modmailVars[issueType].labelA}
          > ${modalInputA}
            ${modalInputB !== '' ? stripIndents`${modmailVars[issueType].labelB}
          > ${modalInputB}
          ` : ''}

          ${roleHelper.name} and ${roleTripsitter.name} will be with you as soon as they're available!
          **If this is a medical emergency please contact your local /EMS: we do not call EMS on behalf of anyone.**
          If you just would like someone to talk to, check out the warmline directory: https://warmline.org/warmdir.html#directory

          When you're feeling better you can use the "I'm Good" button to let the team know you're okay!

          **We will respond to right here when we can!**`
          ;
        }

        logger.debug(`[${PREFIX}] firstResponse: ${firstResponse}`);
        const embedDM = embedTemplate();
        embedDM.setDescription(firstResponse);

        const finishedButton = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`issueFinish`)
              .setLabel(`I'm good now!`)
              .setStyle(ButtonStyle.Success),
          );

        interaction.reply({
          embeds: [embedDM],
          components: [finishedButton],
          ephemeral: false,
          // flags: ['SuppressEmbeds'],
        });
      }

      // Determine if this command was started by a Developer
      const roleDeveloper = tripsitGuild.roles.cache.find((role) => role.id === env.ROLE_DEVELOPER)!;
      const isDev = roleDeveloper.members.map((m) => m.user.id === interaction.user.id);
      const pingRole = tripsitGuild.roles.cache.find((role) => role.id === modmailVars[issueType].pingRole)!;

      // Send a message to the thread
      let threadFirstResponse = stripIndents`
        Hey ${isDev ? pingRole.toString() : pingRole}! ${actor} has submitted a new ticket:

        ${modmailVars[issueType].labelA}
        > ${modalInputA}
        ${modalInputB !== '' ? `${modmailVars[issueType].labelB}
        > ${modalInputB}
        ` : ''}

        Please look into it and respond to them in this thread!
      `;
      if (issueType === 'tripsit') {
        threadFirstResponse = stripIndents`
          Hey ${isDev ? pingRole.toString() : pingRole}! ${actor} has submitted a new ticket:

          ${modmailVars[issueType].labelA}
          > ${modalInputA}
          ${modalInputB !== '' ? `${modmailVars[issueType].labelB}
          > ${modalInputB}
          ` : ''}
          Please look into it and respond to them in this thread!

          If this is a medical emergency they need to initiate EMS: we do not call EMS on behalf of anyone.
          When they're feeling better you can use the "I'm Good" button to let the team know they're okay.
          If you they would like someone to talk to, check out the warmline directory: https://warmline.org/warmdir.html#directory
        `;
      }

      // Create the buttons
      const modmailButtons = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('modmailIssue~own')
            .setLabel('Own')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('modmailIssue~pause')
            .setLabel('Pause')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('modmailIssue~block')
            .setLabel('Block')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('modmailIssue~close')
            .setLabel(`Close`)
            .setStyle(ButtonStyle.Secondary),
        );

      const firstResponseMessage = await ticketThread.send({
        content: threadFirstResponse,
        components: [modmailButtons],
        flags: ['SuppressEmbeds'],
      });
      logger.debug(`[${PREFIX}] Sent intro message to thread ${ticketThread.id}`);

      // Set ticket information
      const newTicketData = {
        issueThread: ticketThread.id,
        issueFirstMessage: firstResponseMessage.id,
        issueUser: actor.id,
        issueUsername: actor.username,
        issueUserIsbanned: false,
        issueType,
        issueStatus: 'open',
        issueDesc: `${modmailVars[issueType].labelA}
        > ${modalInputA}
    
        ${modalInputB !== '' ? `${modmailVars[issueType].labelB}
        > ${modalInputB}
        ` : ''}`,
      };

      // Determine when the thread should be archived
      const threadArchiveTime = new Date();
      const archiveTime = env.NODE_ENV === 'production' ?
        threadArchiveTime.getTime() + 1000 * 60 * 60 * 24 :
        threadArchiveTime.getTime() + 1000 * 60 * 10;
      threadArchiveTime.setTime(archiveTime);
      logger.debug(`[${PREFIX}] threadArchiveTime: ${threadArchiveTime}`);

      // Update thet ticket in the DB
      if (global.db) {
        const ticketRef = db.ref(`${env.FIREBASE_DB_TICKETS}/${member ? member.user.id : interaction.user.id}/`);
        await ticketRef.update(newTicketData);

        let actorRoles = [] as string[];
        if (member) {
          actorRoles = (member.roles as GuildMemberRoleManager).cache.map((role) => role.name);
        }

        const timerRef = db.ref(`${env.FIREBASE_DB_TIMERS}/${member ? member.user.id : interaction.user.id}/`);
        timerRef.set({
          [threadArchiveTime.valueOf()]: {
            type: 'helpthread',
            value: {
              lastHelpedThreadId: ticketThread.id,
              // lastHelpedMetaThreadId: threadDiscussUser.id,
              roles: actorRoles,
              status: 'open',
            },
          },
        });
      }
    });
}

/**
 * What happens when someone DM's the bot
 * @param {Message} message The message sent to the bot
 */
export async function modmailDMInteraction(message:Message) {
  // Dont run if the user mentions @everyone or @here.
  if (message.content.includes('@everyone') || message.content.includes('@here')) {
    message.author.send('You\'re not allowed to use those mentions.');
    return;
  }

  // Get the ticket info
  let ticketData = {} as ticketDbEntry;
  if (global.db) {
    const ref = db.ref(`${env.FIREBASE_DB_TICKETS}/${message.author.id}/`);
    await ref.once('value', (data) => {
      if (data.val() !== null) {
        ticketData = data.val();
      }
    });
  }
  // logger.debug(`[${PREFIX}] ticketData: ${JSON.stringify(ticketData, null, 2)}!`);

  if (ticketData.issueStatus === 'blocked') {
    message.author.send('*beeps sadly*');
    return;
  }

  if (ticketData.issueStatus === 'paused') {
    message.author.send('Hey there! This ticket is currently on hold, please wait for a moderator to respond before sending another message.');
    return;
  }

  if (Object.keys(ticketData).length !== 0 && ticketData.issueStatus !== 'closed') {
    const guild = await message.client.guilds.fetch(env.DISCORD_GUILD_ID);
    let member = {} as GuildMember;
    try {
      member = await guild.members.fetch(message.author.id);
    } catch (error) {
      // This just means the user is not on the TripSit guild
    }

    // logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}!`);

    // If the user is on the guild, direct them to the existing ticket
    if (member.user) {
      const channel = await message.client.channels.fetch(env.CHANNEL_HELPDESK) as TextChannel;
      const issueThread = await channel.threads.fetch(ticketData.issueThread) as ThreadChannel;
      const embed = embedTemplate();
      embed.setDescription(stripIndents`You already have an open issue here ${issueThread.toString()}!`);
      message.reply({embeds: [embed]});
      return;
    }

    // Otherwise send a message to the thread
    const channel = message.client.channels.cache.get(env.CHANNEL_HELPDESK) as TextChannel;
    let thread = {} as ThreadChannel;
    try {
      thread = await channel.threads.fetch(ticketData.issueThread) as ThreadChannel;
    } catch (error) {
      // This just means the thread is deleted
    }
    // logger.debug(`[${PREFIX}] issueThread: ${JSON.stringify(issueThread, null, 2)}!`);
    if (thread.id) {
      const embed = embedTemplate();
      embed.setDescription(message.content);
      embed.setAuthor({
        name: message.author.username,
        iconURL: message.author.displayAvatarURL(),
      });
      embed.setFooter(null);
      thread.send({embeds: [embed]});
      return;
    }
  }
  logger.debug(`[${PREFIX}] User not member of guild`);
  modmailInitialResponse(message);
  return;
}

/**
 * What happens when someone sends a message in a modmail thread
 * @param {Message} message The message sent to the bot
 */
export async function modmailThreadInteraction(message:Message) {
  const threadMessage = message.channel.type === ChannelType.PublicThread ||
  message.channel.type === ChannelType.PrivateThread;
  logger.debug(`[${PREFIX}] threadMessage: ${threadMessage}!`);
  if (message.member) {
    if (threadMessage) {
      logger.debug(`[${PREFIX}] message.channel.parentId: ${message.channel.parentId}!`);
      if (
        message.channel.parentId === env.CHANNEL_HELPDESK ||
        message.channel.parentId === env.CHANNEL_TALKTOTS ||
        message.channel.parentId === env.CHANNEL_TRIPSIT) {
        logger.debug(`[${PREFIX}] message sent in a thread in a helpdesk channel!`);
        // Get the ticket info
        let ticketData = {} as ticketDbEntry;
        if (global.db) {
          const ref = db.ref(`${env.FIREBASE_DB_TICKETS}`);
          await ref.once('value', (data) => {
            if (data.val() !== null) {
              const allTickets = data.val();
              Object.keys(allTickets).forEach((key) => {
                if (allTickets[key].issueThread === message.channel.id) {
                  ticketData = allTickets[key];
                }
              });
            }
          });
        }

        // logger.debug(`[${PREFIX}] ticketData: ${JSON.stringify(ticketData, null, 2)}!`);

        if (Object.keys(ticketData).length !== 0) {
          // Get the user from the ticketData
          const user = await message.client.users.fetch(ticketData.issueUser);
          // logger.debug(`[${PREFIX}] user: ${JSON.stringify(user, null, 2)}!`);
          const embed = embedTemplate();
          embed.setDescription(message.content);
          embed.setAuthor({
            name: message.member.displayName,
            iconURL: message.member.displayAvatarURL(),
          });
          embed.setFooter(null);
          user.send({embeds: [embed]});
          // user.send(`<${message.member.nickname}> ${message.content}`);
          return;
        }
      }
    }
  }
}

/**
 * Handles modmail buttons
 * @param {ButtonInteraction} interaction
 */
export async function modmailActions(
  interaction:ButtonInteraction | ChatInputCommandInteraction,
) {
  logger.debug(`[${PREFIX}] starting!`);

  let command = '';
  if (interaction.isButton()) {
    command = interaction.customId.split('~')[1];
  } else if (interaction.isCommand()) {
    command = interaction.options.getSubcommand();
  }

  // logger.debug(`[${PREFIX}] Command: ${command}`);

  const actor = interaction.member as GuildMember;

  // Get the ticket info
  let ticketData = {} as ticketDbEntry;
  let path = `${env.FIREBASE_DB_TICKETS}`;
  if (global.db) {
    const ref = db.ref(path);
    await ref.once('value', (data) => {
      if (data.val() !== null) {
        const allTickets = data.val();
        Object.keys(allTickets).forEach((key) => {
          if (allTickets[key].issueThread === interaction.channel!.id) {
            ticketData = allTickets[key];
            path = `${env.FIREBASE_DB_TICKETS}/${key}`;
          }
        });
      }
    });
  }
  // logger.debug(`[${PREFIX}] ticketData: ${JSON.stringify(ticketData, null, 2)}!`);

  const ticketChannel = interaction.client.channels.cache.get(ticketData.issueThread) as ThreadChannel;

  if (!ticketChannel) {
    interaction.reply({content: 'This user\'s ticket thread does not exist!', ephemeral: true});
    return;
  }

  const target = interaction.client.users.cache.get(ticketData.issueUser) as User;
  const channel = interaction.client.channels.cache.get(ticketData.issueThread) as ThreadChannel;
  let verb = '';
  let noun = '';
  let updatedModmailButtons = new ActionRowBuilder<ButtonBuilder>();
  if (command === 'close') {
    logger.debug(`[${PREFIX}] Closing ticket!`);
    ticketData.issueStatus = 'closed';
    noun = 'Ticket';
    verb = 'CLOSED';
    target.send(`It looks like we're good here! We've closed this ticket, but if you need anything else, feel free to open a new one!`);
    channel.setName(`💚${channel.name.substring(1)}`);
    //   let message:Message;
    //   await threadHelpUser.send(stripIndents`
    //       ${env.EMOJI_INVISIBLE}
    //       > **If you have a minute, your feedback is important to us!**
    //       > Please rate your experience with ${interaction.guild.name}'s service by reacting below.
    //       > Thank you!
    //       ${env.EMOJI_INVISIBLE}
    //       `)
    //     .then(async (msg) => {
    //       message = msg;
    //       await msg.react('🙁');
    //       await msg.react('😕');
    //       await msg.react('😐');
    //       await msg.react('🙂');
    //       await msg.react('😁');

    //       // Setup the reaction collector
    //       const filter = (reaction:MessageReaction, user:User) => user.id === target.id;
    //       const collector = message.createReactionCollector({filter, time: 1000 * 60 * 60 * 24});
    //       collector.on('collect', async (reaction, user) => {
    //         threadHelpUser.send(stripIndents`
    //           ${env.EMOJI_INVISIBLE}
    //           > Thank you for your feedback, here's a cookie! 🍪
    //           ${env.EMOJI_INVISIBLE}
    //           `);
    //         logger.debug(`[${PREFIX}] Collected ${reaction.emoji.name} from ${user.tag}`);
    //         const finalEmbed = embedTemplate()
    //           .setColor(Colors.Blue)
    //           .setDescription(`Collected ${reaction.emoji.name} from ${user.tag}`);
    //         try {
    //           const channelTripsitMeta = interaction.client.channels.cache.get(env.CHANNEL_TRIPSITMETA) as TextChannel;
    //           await channelTripsitMeta.send({embeds: [finalEmbed]});
    //         } catch (err) {
    //           logger.debug(`[${PREFIX}] Failed to send message, am i still in the tripsit guild?`);
    //         }
    //         msg.delete();
    //         collector.stop();
    //       });
    //     });
    // ticketChannel.setArchived(true, 'Archiving after close');
    // Update modmail buttons
    updatedModmailButtons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('modmailIssue~own')
          .setLabel('Own')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('modmailIssue~pause')
          .setLabel('Pause')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('modmailIssue~block')
          .setLabel('Block')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('modmailIssue~reopen')
          .setLabel('Reopen')
          .setStyle(ButtonStyle.Danger),
      );
  } else if (command === 'reopen') {
    logger.debug(`[${PREFIX}] Reopening ticket!`);
    ticketData.issueStatus = 'open';
    noun = 'Ticket';
    verb = 'REOPENED';
    target.send('This ticket has been reopened! Feel free to continue the conversation here.');
    // ticketChannel.setArchived(true, 'Archiving after close');
    channel.setName(`❤${channel.name.substring(1)}`);
    updatedModmailButtons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('modmailIssue~own')
          .setLabel('Own')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('modmailIssue~pause')
          .setLabel('Pause')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('modmailIssue~block')
          .setLabel('Block')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('modmailIssue~close')
          .setLabel('Close')
          .setStyle(ButtonStyle.Danger),
      );
  } else if (command === 'block') {
    logger.debug(`[${PREFIX}] Blocking user!`);
    ticketData.issueStatus = 'blocked';
    noun = 'User';
    verb = 'BLOCKED';
    target.send('You have been blocked from using modmail. Please email us at appeals@tripsit.me if you feel this was an error!');
    // ticketChannel.setArchived(true, 'Archiving after close');
    channel.setName(`❤${channel.name.substring(1)}`);
    updatedModmailButtons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('modmailIssue~own')
          .setLabel('Own')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('modmailIssue~pause')
          .setLabel('Pause')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('modmailIssue~unblock')
          .setLabel('Unblock')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('modmailIssue~close')
          .setLabel('Close')
          .setStyle(ButtonStyle.Danger),
      );
  } else if (command === 'unblock') {
    ticketData.issueStatus = 'open';
    noun = 'User';
    verb = 'UNBLOCKED';
    target.send('You have been unblocked from using modmail!');
    channel.setName(`💛${channel.name.substring(1)}`);
    updatedModmailButtons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('modmailIssue~own')
          .setLabel('Own')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('modmailIssue~pause')
          .setLabel('Pause')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('modmailIssue~block')
          .setLabel('Block')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('modmailIssue~close')
          .setLabel('Close')
          .setStyle(ButtonStyle.Danger),
      );
  } else if (command === 'unpause') {
    ticketData.issueStatus = 'open';
    noun = 'Ticket';
    verb = 'UNPAUSED';
    target.send('This ticket has been taken off hold, thank you for your patience!');
    channel.setName(`💛${channel.name.substring(1)}`);
    updatedModmailButtons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('modmailIssue~own')
          .setLabel('Own')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('modmailIssue~pause')
          .setLabel('Pause')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('modmailIssue~block')
          .setLabel('Block')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('modmailIssue~close')
          .setLabel('Close')
          .setStyle(ButtonStyle.Danger),
      );
  } else if (command === 'pause') {
    ticketData.issueStatus = 'paused';
    noun = 'Ticket';
    verb = 'PAUSED';
    target.send('This ticket has been paused while we look into this, thank you for your patience!');
    channel.setName(`🤎${channel.name.substring(1)}`);
    updatedModmailButtons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('modmailIssue~own')
          .setLabel('Own')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('modmailIssue~unpause')
          .setLabel('Unpause')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('modmailIssue~block')
          .setLabel('Block')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('modmailIssue~close')
          .setLabel('Close')
          .setStyle(ButtonStyle.Danger),
      );
  } else if (command === 'own') {
    noun = 'Ticket';
    verb = 'OWNED';
    target.send(`${actor} has claimed this issue and will either help you or figure out how to get you help!`);
    channel.setName(`💛${channel.name.substring(1)}`);
    updatedModmailButtons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('modmailIssue~own')
          .setLabel('Own')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('modmailIssue~pause')
          .setLabel('Pause')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('modmailIssue~block')
          .setLabel('Block')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('modmailIssue~close')
          .setLabel('Close')
          .setStyle(ButtonStyle.Danger),
      );
  }
  await interaction.reply(`${noun} has been ${verb} by ${actor}! (The user cannot see this)`);

  if (global.db) {
    const ref = db.ref(path);
    // logger.debug(`[${PREFIX}] ticketData update: ${JSON.stringify(ticketData, null, 2)}!`);
    await ref.set(ticketData);
  }

  const channelModlog = interaction.guild!.channels.cache.get(env.CHANNEL_MODLOG) as TextChannel;
  // Transform actor data
  const modlogEmbed = embedTemplate()
    .setColor(Colors.Blue)
    .setDescription(`${actor} ${command}ed ${target.tag} in ${ticketChannel}`);
  channelModlog.send({embeds: [modlogEmbed]});


  let initialMessage = {} as Message;
  let content = '';
  if (interaction.isButton()) {
    initialMessage = interaction.message;
    content = interaction.message.content;
  }
  if (interaction.isCommand()) {
    initialMessage = await interaction.channel!.messages.fetch(ticketData.issueFirstMessage) as Message;
    content = initialMessage.content;
  }

  initialMessage.edit({
    content: content,
    components: [updatedModmailButtons],
    flags: ['SuppressEmbeds'],
  });


  logger.debug(`[${PREFIX}] finished!`);
};
