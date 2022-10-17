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
  MessageReaction,
  User,
  // Role,
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
      .setDescription('Close this ticket as resolved')
      .setName('close'))
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
    logger.debug(`[${PREFIX}] Started!`);
    const command = interaction.options.getSubcommand();
    logger.debug(`[${PREFIX}] Command: ${command}`);

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

    logger.debug(`[${PREFIX}] ticketData: ${JSON.stringify(ticketData, null, 2)}!`);

    const ticketChannel = interaction.client.channels.cache.get(ticketData.issueThread) as ThreadChannel;

    if (!ticketChannel) {
      interaction.reply({content: 'This user\'s ticket thread does not exist!', ephemeral: true});
      return;
    }

    const target = interaction.client.users.cache.get(ticketData.issueUser) as User;
    let verb = '';
    let noun = '';
    if (command === 'close') {
      logger.debug(`[${PREFIX}] Closing ticket!`);
      ticketData.issueStatus = 'closed';
      noun = 'Ticket';
      verb = 'CLOSED';
      // Reply before you archive, or else you'll just unarchive
      await interaction.reply(`It looks like we're done here, this ticket has been closed!`);
    } else if (command === 'block') {
      logger.debug(`[${PREFIX}] Blocking user!`);
      ticketData.issueStatus = 'blocked';
      noun = 'User';
      verb = 'BLOCKED';
      ticketChannel.setArchived(true, 'Archiving after close');
    } else if (command === 'unblock') {
      ticketData.issueStatus = 'open';
      noun = 'User';
      verb = 'UNBLOCKED';
    } else if (command === 'unpause') {
      ticketData.issueStatus = 'open';
      noun = 'Ticket';
      verb = 'UNPAUSE';
    } else if (command === 'pause') {
      ticketData.issueStatus = 'paused';
      noun = 'Ticket';
      verb = 'PAUSE';
    }

    await interaction.reply(`${noun} has been ${verb} by ${actor}! (The user cannot see this)`);

    if (command === 'close' || command === 'block') {
      ticketChannel.setArchived(true, 'Archiving after close');
    }

    if (command === 'pause' || command === 'unpause' || command === 'closed') {
      ticketChannel.send(false, 'Unarchiving after close');
    }

    if (global.db) {
      const ref = db.ref(path);
      await ref.set(ticketData);
    }

    const channelModlog = interaction.guild!.channels.cache.get(env.CHANNEL_MODLOG) as TextChannel;
    // Transform actor data
    const modlogEmbed = embedTemplate()
      .setColor(Colors.Blue)
      .setDescription(`${actor} ${command}ed ${target.tag} in ${ticketChannel}`);
    channelModlog.send({embeds: [modlogEmbed]});
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

  const modmailButtons = new ActionRowBuilder<ButtonBuilder>()
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

  message.author.send({embeds: [embed], components: [modmailButtons]});
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

  const member = interaction.member as GuildMember;
  logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}!`);

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
  logger.debug(`[${PREFIX}] ticketData: ${JSON.stringify(ticketData, null, 2)}!`);

  // Get the parent channel to be used
  const channel = interaction.client.channels.cache.get(modmailVars[issueType].channelId) as TextChannel;

  // Check if an open thread already exists, and if so, update that thread
  if (Object.keys(ticketData).length !== 0) {
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

      const tripsitGuild = interaction.client.guilds.cache.get(env.DISCORD_GUILD_ID)!;

      const roleHelper = await tripsitGuild.roles.fetch(env.ROLE_TRIPSITTER) as Role;
      logger.debug(`[${PREFIX}] roleHelper: ${roleHelper}`);
      const roleTripsitter = tripsitGuild.roles.cache.find((role) => role.id === env.ROLE_TRIPSITTER) as Role;
      logger.debug(`[${PREFIX}] roleTripsitter: ${roleTripsitter}`);

      // If the user is on the guild, direct them to their thread
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
          If this is a medical emergency please contact your local /EMS: we do not call EMS on behalf of anyone.
          When you're feeling better you can use the "I'm Good" button to let the team know you're okay.
          If you just would like someone to talk to, check out the warmline directory: https://warmline.org/warmdir.html#directory
  
          **We will respond to right here when we can!**`
          ;
        }
        embed.setDescription(firstResponse);

        const finishedButton = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`issueFinish`)
              .setLabel('I\'m good now!')
              .setStyle(ButtonStyle.Success),
          );

        interaction.reply({
          embeds: [embed],
          components: [finishedButton],
          ephemeral: false,
          flags: ['SuppressEmbeds'],
        });
      }

      // Determine if this command was started by a Developer
      const roleDeveloper = tripsitGuild.roles.cache.find((role) => role.id === env.ROLE_DEVELOPER)!;
      const isDev = roleDeveloper.members.map((m) => m.user.id === interaction.user.id);
      logger.debug(`[${PREFIX}] isDev: ${JSON.stringify(isDev, null, 2)}!`);
      const pingRole = tripsitGuild.roles.cache.find((role) => role.id === modmailVars[issueType].pingRole)!;
      let threadFirstResponse = stripIndents`
        Hey ${isDev ? pingRole.toString() : pingRole}! ${actor} has submitted a new ticket:

        ${modmailVars[issueType].labelA}
        > ${modalInputA}
        ${modalInputB !== '' ? `${modmailVars[issueType].labelB}
        > ${modalInputB}
        ` : ''}
        Please look into it and respond to them in this thread!

        When you're done remember to '/modmail close' this ticket!
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

          When you're done remember to '/modmail close' this ticket!
        `;
      }

      const finishedButton = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`issueFinish`)
            .setLabel(`We're done here!`)
            .setStyle(ButtonStyle.Success),
        );

      await ticketThread.send({
        content: threadFirstResponse,
        components: [finishedButton],
        flags: ['SuppressEmbeds'],
      });

      logger.debug(`[${PREFIX}] Sent intro message to thread ${ticketThread.id}`);

      // Set ticket information
      const newTicketData = {
        issueThread: ticketThread.id,
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

      const threadArchiveTime = new Date();
      // define one week in milliseconds
      // const thirtySec = 1000 * 30;
      const tenMins = 1000 * 60 * 10;
      const oneDay = 1000 * 60 * 60 * 24;
      const archiveTime = env.NODE_ENV === 'production' ?
        threadArchiveTime.getTime() + oneDay :
        threadArchiveTime.getTime() + tenMins;
      threadArchiveTime.setTime(archiveTime);
      logger.debug(`[${PREFIX}] threadArchiveTime: ${threadArchiveTime}`);

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
    message.author.send('You are blocked!');
    return;
  }

  if (Object.keys(ticketData).length !== 0) {
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
 * Handles finishing the session
 * @param {ButtonInteraction} interaction
 */
export async function modmailFinish(
  interaction:ButtonInteraction,
) {
  logger.debug(`[${PREFIX}] starting!`);
  await interaction.deferReply({ephemeral: true});
  if (!interaction.guild) {
    logger.debug(`[${PREFIX}] no guild!`);
    interaction.editReply('This must be performed in a guild!');
    return;
  }
  if (!interaction.member) {
    logger.debug(`[${PREFIX}] no member!`);
    interaction.editReply('This must be performed by a member of a guild!');
    return;
  }

  const meOrThem = interaction.customId.split('~')[1];
  const targetId = interaction.customId.split('~')[2];
  const roleNeedshelpId = interaction.customId.split('~')[3];

  const target = await interaction.guild?.members.fetch(targetId)!;
  const actor = interaction.member as GuildMember;

  if (meOrThem === 'me' && targetId !== actor.id) {
    logger.debug(`[${PREFIX}] not the target!`);
    interaction.editReply({content: 'Only the user receiving help can click this button!'});
    return;
  }

  let targetLastHelpedDate = new Date();
  let targetLastHelpedThreadId = '';
  let targetLastHelpedMetaThreadId = '';
  let targetRoles:string[] = [];

  if (global.db) {
    const ref = db.ref(`${env.FIREBASE_DB_TIMERS}/${target.user.id}/`);
    await ref.once('value', (data) => {
      if (data.val() !== null) {
        Object.keys(data.val()).forEach((key) => {
          logger.debug(`[${PREFIX}] data.val()[key]: ${JSON.stringify(data.val()[key], null, 2)}`);
          logger.debug(`[${PREFIX}] key: ${key}`);
          if (data.val()[key].type === 'helpthread') {
            targetLastHelpedDate = new Date(parseInt(key));
            targetLastHelpedThreadId = data.val()[key].value.lastHelpedThreadId;
            targetLastHelpedMetaThreadId = data.val()[key].value.lastHelpedMetaThreadId;
            targetRoles = data.val()[key].value.roles;
          }
        });
      }
    });
  }

  logger.debug(`[${PREFIX}] targetLastHelpedDate: ${targetLastHelpedDate}`);
  logger.debug(`[${PREFIX}] targetLastHelpedThreadId: ${targetLastHelpedThreadId}`);
  logger.debug(`[${PREFIX}] targetLastHelpedMetaThreadId: ${targetLastHelpedMetaThreadId}`);

  // const channelOpentripsit = await interaction.client.channels.cache.get(env.CHANNEL_OPENTRIPSIT);
  // const channelSanctuary = await interaction.client.channels.cache.get(env.CHANNEL_SANCTUARY);
  // Get the channel objects for the help and meta threads
  const threadHelpUser = interaction.guild.channels.cache
    .find((chan) => chan.id === targetLastHelpedThreadId) as ThreadChannel;
  // const threadDiscussUser = interaction.guild.channels.cache
  //   .find((chan) => chan.id === targetLastHelpedMetaThreadId) as ThreadChannel;

  // await threadDiscussUser.setName(`💚│${target.displayName} discussion`);
  await threadHelpUser.setName(`💚│${target.displayName}'s channel!`);

  const roleNeedshelp = await interaction.guild.roles.fetch(roleNeedshelpId)!;
  const targetHasNeedsHelpRole = (target.roles as GuildMemberRoleManager).cache.find(
    (role:Role) => role === roleNeedshelp,
  ) !== undefined;
  logger.debug(`[${PREFIX}] targetHasNeedsHelpRole: ${targetHasNeedsHelpRole}`);

  if (!targetHasNeedsHelpRole) {
    const rejectMessage = `Hey ${interaction.member}, ${meOrThem === 'me' ? 'you\'re' : `${target} is`} not currently being taken care of!`;

    const embed = embedTemplate().setColor(Colors.DarkBlue);
    embed.setDescription(rejectMessage);
    logger.debug(`[${PREFIX}] target ${target} does not need help!`);
    interaction.editReply({embeds: [embed]});
    logger.debug(`[${PREFIX}] finished!`);
    return;
  }

  // if (targetLastHelpedDate && meOrThem === 'me') {
  //   const lastHour = Date.now() - (1000 * 60 * 60);
  //   logger.debug(`[${PREFIX}] lastHelp: ${targetLastHelpedDate.valueOf() * 1000}`);
  //   logger.debug(`[${PREFIX}] lastHour: ${lastHour.valueOf()}`);
  //   if (targetLastHelpedDate.valueOf() * 1000 > lastHour.valueOf()) {
  //     const message = stripIndents`Hey ${interaction.member} you just asked for help recently!
  //     Take a moment to breathe and wait for someone to respond =)
  //     Maybe try listening to some lofi music while you wait?`;

  //     const embed = embedTemplate()
  //       .setColor(Colors.DarkBlue)
  //       .setDescription(message);
  //     interaction.editReply({embeds: [embed]});

  //     //       if (threadDiscussUser) {
  //     //         const metaUpdate = stripIndents`Hey team, ${target.displayName} said they're good \
  //     // but it's been less than an hour since they asked for help.

  //     // If they still need help it's okay to leave them with that role.`;
  //     //         threadDiscussUser.send(metaUpdate);
  //     //       }

  //     logger.debug(`[${PREFIX}] finished!`);

  //     logger.debug(`[${PREFIX}] Rejected the "im good" button`);
  //     return;
  //   }
  // }

  // For each role in targetRoles2, add it to the target
  if (targetRoles) {
    targetRoles.forEach((roleId) => {
      logger.debug(`[${PREFIX}] Re-adding roleId: ${roleId}`);
      const roleObj = interaction.guild!.roles.cache.find((r) => r.id === roleId) as Role;
      if (!ignoredRoles.includes(roleObj.id) && roleObj.name !== '@everyone') {
        logger.debug(`[${PREFIX}] Adding role ${roleObj.name} to ${target.displayName}`);
        try {
          target.roles.add(roleObj);
        } catch (err) {
          logger.error(`[${PREFIX}] Error adding role ${roleObj.name} to ${target.displayName}`);
          logger.error(err);
        }
      }
    });
  }

  target.roles.remove(roleNeedshelp!);
  logger.debug(`[${PREFIX}] Removed ${roleNeedshelp!.name} from ${target.displayName}`);

  const endHelpMessage = stripIndents`Hey ${target}, we're glad you're doing better!
    We've restored your old roles back to normal <3
    This thread will remain here for a day if you want to follow up tomorrow.
    After 7 days, or on request, it will be deleted to preserve your privacy =)`;

  try {
    threadHelpUser.send(endHelpMessage);
  } catch (err) {
    logger.error(`[${PREFIX}] Error sending end help message to ${threadHelpUser}`);
    logger.error(err);
  }


  let message:Message;
  await threadHelpUser.send(stripIndents`
      ${env.EMOJI_INVISIBLE}
      > **If you have a minute, your feedback is important to us!**
      > Please rate your experience with ${interaction.guild.name}'s service by reacting below.
      > Thank you!
      ${env.EMOJI_INVISIBLE}
      `)
    .then(async (msg) => {
      message = msg;
      await msg.react('🙁');
      await msg.react('😕');
      await msg.react('😐');
      await msg.react('🙂');
      await msg.react('😁');

      // Setup the reaction collector
      const filter = (reaction:MessageReaction, user:User) => user.id === target.id;
      const collector = message.createReactionCollector({filter, time: 1000 * 60 * 60 * 24});
      collector.on('collect', async (reaction, user) => {
        threadHelpUser.send(stripIndents`
          ${env.EMOJI_INVISIBLE}
          > Thank you for your feedback, here's a cookie! 🍪
          ${env.EMOJI_INVISIBLE}
          `);
        logger.debug(`[${PREFIX}] Collected ${reaction.emoji.name} from ${user.tag}`);
        const finalEmbed = embedTemplate()
          .setColor(Colors.Blue)
          .setDescription(`Collected ${reaction.emoji.name} from ${user.tag}`);
        try {
          const channelTripsitMeta = interaction.client.channels.cache.get(env.CHANNEL_TRIPSITMETA) as TextChannel;
          await channelTripsitMeta.send({embeds: [finalEmbed]});
        } catch (err) {
          logger.debug(`[${PREFIX}] Failed to send message, am i still in the tripsit guild?`);
        }
        msg.delete();
        collector.stop();
      });
    });

  // const endMetaHelpMessage = stripIndents`${meOrThem === 'me' ? target.displayName : actor.displayName} has indicated that ${meOrThem === 'me' ? 'they' : target.displayName} no longer need help!
  //   *This thread, and ${threadHelpUser.toString()}, will remain un-archived for 24 hours to allow the user to follow-up.
  //   If the user requests help again within 7 days these threads will be un-archived.
  //   After 7 days the threads will be deleted to preserve privacy.*`;

  // threadDiscussUser.send(endMetaHelpMessage);


  logger.debug(`[${PREFIX}] target ${target} is no longer being helped!`);
  logger.debug(`[${PREFIX}] finished!`);
  await interaction.editReply({content: 'Done!'});
// async submit(interaction) {
//   const feedback = interaction.fields.getTextInputValue('feedbackReport');
//   logger.debug(feedback);
// },
};

const teamRoles = [
  env.ROLE_DIRECTOR,
  env.ROLE_SUCCESSOR,
  env.ROLE_SYSADMIN,
  env.ROLE_LEADDEV,
  env.ROLE_IRCADMIN,
  env.ROLE_DISCORDADMIN,
  env.ROLE_IRCOP,
  env.ROLE_MODERATOR,
  env.ROLE_TRIPSITTER,
  env.ROLE_TEAMTRIPSIT,
  env.ROLE_TRIPBOT2,
  env.ROLE_TRIPBOT,
  env.ROLE_BOT,
  env.ROLE_DEVELOPER,
];

const colorRoles = [
  env.ROLE_TREE,
  env.ROLE_SPROUT,
  env.ROLE_SEEDLING,
  env.ROLE_BOOSTER,
  env.ROLE_RED,
  env.ROLE_ORANGE,
  env.ROLE_YELLOW,
  env.ROLE_GREEN,
  env.ROLE_BLUE,
  env.ROLE_PURPLE,
  env.ROLE_PINK,
  // env.ROLE_BROWN,
  env.ROLE_BLACK,
  env.ROLE_WHITE,
];

const mindsetRoles = [
  env.ROLE_DRUNK,
  env.ROLE_HIGH,
  env.ROLE_ROLLING,
  env.ROLE_TRIPPING,
  env.ROLE_DISSOCIATING,
  env.ROLE_STIMMING,
  env.ROLE_NODDING,
  env.ROLE_SOBER,
];

const otherRoles = [
  env.ROLE_VERIFIED,
];

const ignoredRoles = `${teamRoles},${colorRoles},${mindsetRoles},${otherRoles}`;
