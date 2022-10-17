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

// Declare the static test nitice
const testNotice = '🧪THIS IS A TEST PLEASE IGNORE🧪\n\n';

export const modmail: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('modmail')
    .setDescription('Modmail actions!')
    .addSubcommand((subcommand) => subcommand
      .setDescription('Close this ticket as resolved')
      .setName('closed'))
    .addSubcommand((subcommand) => subcommand
      .setDescription('Block this user from future messages/tickets')
      .setName('blocked'))
    .addSubcommand((subcommand) => subcommand
      .setDescription('Take the ticket off hold')
      .setName('open'))
    .addSubcommand((subcommand) => subcommand
      .setDescription('Put the ticket on hold')
      .setName('paused')),
  async execute(interaction:ChatInputCommandInteraction) {
    logger.debug(`[${PREFIX}] Started!`);
    const command = interaction.options.getSubcommand();
    // logger.debug(`[${PREFIX}] Command: ${command}`);
    const member = interaction.options.getMember('target')! as GuildMember;
    // logger.debug(`[${PREFIX}] member: ${member}`);

    // Get the ticket info
    let ticketData = {} as ticketDbEntry;

    const ref = db.ref(`${env.FIREBASE_DB_TICKETS}/${member.user.id}/`);
    await ref.once('value', (data) => {
      if (data.val() !== null) {
        ticketData = data.val();
      } else {
        interaction.reply({content: 'This user does not have a ticket!', ephemeral: true});
        return;
      }
    });

    const ticketChannel = interaction.client.channels.cache.get(ticketData.issueThread) as ThreadChannel;

    if (!ticketChannel) {
      interaction.reply({content: 'This user\'s ticket thread does not exist!', ephemeral: true});
      return;
    }

    // Transform actor data
    if (command === 'closed') {
      logger.debug(`[${PREFIX}] Closing ticket!`);
      ticketData.issueStatus = 'closed';

      // Reply before you archive, or else you'll just unarchive
      await interaction.reply('It looks like we\'re done here, this ticket has been archived by a moderator!');

      ticketChannel.setArchived(true, 'Archiving after close');

      await ref.set(ticketData);
    } else if (command === 'block') {
      logger.debug(`[${PREFIX}] Blocking user!`);
      ticketData.issueStatus = 'blocked';

      // Reply before you archive, or else you'll just unarchive
      await interaction.reply('This user has been blocked from creating future tickets!');

      ticketChannel.setArchived(true, 'Archiving after close');

      await ref.set(ticketData);
    } else if (command === 'unblock') {
      logger.debug(`[${PREFIX}] Unblocking user!`);
      ticketData.issueStatus = 'open';

      // Reply before you archive, or else you'll just unarchive
      await interaction.reply('This user has been un-blocked from creating future tickets!');

      await ref.set(ticketData);
    } else if (command === 'unpause') {
      logger.debug(`[${PREFIX}] Unpausing ticket!`);
      ticketData.issueStatus = 'open';

      // Reply before you archive, or else you'll just unarchive
      await interaction.reply('This ticket has been unpaused and can communication can resume!');

      await ref.set(ticketData);
    } else if (command === 'pause') {
      logger.debug(`[${PREFIX}] Pausing ticket!`);
      ticketData.issueStatus = 'paused';

      // Reply before you archive, or else you'll just unarchive
      await interaction.reply('This ticket has been paused, please wait to communicate further!');

      await ref.set(ticketData);
    }
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
    },
    tripsit: {
      customId: `ModmailIssueModal~${issueType}`,
      title: 'Tripsit Me!',
      description: 'You can also join our Discord server and ask for help there!',
      labelA: 'What is your issue? Be super detailed!',
      placeholderA: `I have an issue, can you please help?`,
      labelB: 'What is your appeal? Be super detailed!',
      placeholderB: `I have an issue, can you please help?`,
      color: Colors.Green,
      channelId: env.CHANNEL_TRIPSIT,
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
    },
    feedback: {
      customId: `ModmailIssueModal~${issueType}`,
      title: 'Give Feedback',
      description: 'Can be a suggestion, feedback, or issue. Please be detailed!',
      labelA: 'What is your feedback/suggestion? Be super detailed!',
      placeholderA: `I have an issue, can you please help?`,
      labelB: '',
      placeholderB: '',
      color: Colors.Blue,
      channelId: env.CHANNEL_TRIPBOT,
    },
  };

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
      const member = interaction.member;
      logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}!`);

      // Get the parent channel to be used
      const channel = interaction.client.channels.cache.get(modmailVars[issueType].channelId) as TextChannel;

      // Get whatever they sent in the modal
      const modalInputA = interaction.fields.getTextInputValue(`inputA`);
      logger.debug(`[${PREFIX}] modalInputA: ${modalInputA}!`);
      let modalInputB = '';
      try {
        modalInputB = interaction.fields.getTextInputValue(`inputB`);
        logger.debug(`[${PREFIX}] modalInputB: ${modalInputB}!`);
      } catch (e) {}

      // Get the actor
      const actor = interaction.user;

      // Get the ticket info, if it exists
      let ticketData = {} as ticketDbEntry;
      if (global.db) {
        const ref = db.ref(`${env.FIREBASE_DB_TICKETS}/${member ? member.user.id : interaction.user.id}/`);
        await ref.once('value', (data) => {
          if (data.val() !== null) {
            ticketData = data.val();
          } else {
            interaction.reply({content: 'This user does not have a ticket!', ephemeral: true});
            return;
          }
        });
      }
      logger.debug(`[${PREFIX}] ticketData: ${JSON.stringify(ticketData, null, 2)}!`);

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
          // Ping the user in the help thread
          const helpMessage = stripIndents`
            Hey team, ${actor} submitted a new request for help:

            ${modmailVars[issueType].labelA}
            > ${modalInputA}

            ${modalInputB !== '' ? `${modmailVars[issueType].labelB}
            > ${modalInputB}
            ` : ''}
          `;
          issueThread.send(helpMessage);
          const embed = embedTemplate();
          embed.setDescription(stripIndents`
            You already have an open issue, we've updated it with your notes, but please be patient!
          `);
          if (member instanceof GuildMember) {
            embed.setDescription(stripIndents`
              You already have an open issue here, please be patient! ${issueThread.toString()}!
            `);
          }
          interaction.reply({embeds: [embed], ephemeral: true});
          return;
        }
      }

      // Create a new thread in channel
      // let threadtype = {} as AllowedThreadTypeForTextChannel;
      // if (channel.guild.premiumTier > 2) {
      //   threadtype = ChannelType.PrivateThread;
      // } else {
      //   threadtype = ChannelType.PublicThread;
      // }

      const threadtype = channel.guild.premiumTier > 2 ? ChannelType.PrivateThread : ChannelType.PublicThread;

      const ticketThread = await channel.threads.create({
        name: `🧡│${actor.username}'s ${issueType} issue!`,
        autoArchiveDuration: 1440,
        type: threadtype,
        reason: `${actor.username} submitted a(n) ${issueType} issue`,
      });
      logger.debug(`[${PREFIX}] Created meta-thread ${ticketThread.id}`);


      if (member instanceof GuildMember) {
        const embed = embedTemplate();
        embed.setDescription(stripIndents`
    Thank you, check out ${ticketThread} to talk with a team member about your issue!
    `);
        interaction.reply({embeds: [embed], ephemeral: true});
      } else {
        interaction.reply('Thank you, we will respond to right here when we can!');
      }

      // Determine if this command was started by a Developer
      const tripsitGuild = interaction.client.guilds.cache.get(env.DISCORD_GUILD_ID)!;
      const roleDeveloper = tripsitGuild.roles.cache.find((role) => role.id === env.ROLE_DEVELOPER)!;
      const isDev = roleDeveloper.members.map((m) => m.user.id === interaction.user.id);
      logger.debug(`[${PREFIX}] isDev: ${JSON.stringify(isDev, null, 2)}!`);
      const roleModerator = tripsitGuild.roles.cache.find((role) => role.id === env.ROLE_MODERATOR);
      let message = stripIndents`
    Hey ${isDev ? 'moderators' : roleModerator}! ${actor} has submitted a new issue:

    ${modmailVars[issueType].labelA}
    > ${modalInputA}

    ${modalInputB !== '' ? `${modmailVars[issueType].labelB}
    > ${modalInputB}
    ` : ''}

    Please look into it and respond to them in this thread!

    When you're done remember to '/modmail close' this ticket!`;

      if (isDev) {
        message = testNotice + message;
      }

      await ticketThread.send(message);
      logger.debug(`[${PREFIX}] Sent intro message to meta-thread ${ticketThread.id}`);

      // Webhooks dont work in threads, but leaving this code here for later
      // const webhook = await ticketThread.createWebhook(
      // actor.username, { avatar: actor.avatarURL()
      //   }});
      // logger.debug(`[${PREFIX}] Created webhook ${JSON.stringify(webhook, null, 2)}!`);

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

      if (global.db) {
        const ref = db.ref(`${env.FIREBASE_DB_TICKETS}/${member ? member.user.id : interaction.user.id}/`);
        await ref.update(newTicketData);
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
      thread.send(`<${message.author.tag}> ${message.content}`);
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
          user.send(`<${message.member.nickname}> ${message.content}`);
          return;
        }
      }
    }
  }
}

/**
 *
 * @param {ButtonInteraction} interaction
 */
export async function modmailFeedback(interaction:ButtonInteraction) {
  logger.debug(`[${PREFIX}] Message: ${JSON.stringify(interaction, null, 2)}!`);
  // Create the modal
  const modal = new ModalBuilder()
    .setCustomId('modmailFeedbackModal')
    .setTitle('TripSit Feedback');
  const timeoutReason = new TextInputBuilder()
    .setLabel('What would you like to let the team know?')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('This bot is cool and I have a suggestion...')
    .setCustomId('feedbackInput')
    .setRequired(true);
  // An action row only holds one text input, so you need one action row per text input.
  const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(timeoutReason);
  // Add inputs to the modal
  modal.addComponents(firstActionRow);
  // Show the modal to the user
  await interaction.showModal(modal);

  // Collect a modal submit interaction
  const filter = (interaction:ModalSubmitInteraction) => interaction.customId.startsWith(`modmailFeedbackModal`);
  interaction.awaitModalSubmit({filter, time: 0})
    .then(async (interaction) => {
      logger.debug(`[${PREFIX}] Message: ${JSON.stringify(interaction, null, 2)}!`);
      const modalInput = interaction.fields.getTextInputValue('feedbackInput');
      logger.debug(`[${PREFIX}] modalInput: ${modalInput}!`);

      // Get the actor
      const actor = interaction.user;
      logger.debug(`[${PREFIX}] actor: ${actor}!`);

      // Get the moderation channel
      const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
      const tripsitguild = client.guilds.cache.get(env.DISCORD_GUILD_ID)!;
      const tripbotdevrole = tripsitguild.roles.cache.get(env.ROLE_TRIPBOTDEV);
      botlog.send(`Hey ${tripbotdevrole}, someone has submitted feedback:
        ${modalInput}
      `);
      interaction.reply('Thank you for the feedback! Here\'s a cookie: 🍪');
    });
}


