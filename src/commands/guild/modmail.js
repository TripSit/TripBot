'use strict';

const PREFIX = require('path').parse(__filename).name;
// const ms = require('ms');
const {
  MessageActionRow,
  MessageButton,
  Modal,
  TextInputComponent,
} = require('discord.js');
const { stripIndents } = require('common-tags/lib');
const { SlashCommandBuilder } = require('@discordjs/builders');
const template = require('../../utils/embed-template');
const logger = require('../../utils/logger');
const { getUserInfo, setUserInfo } = require('../../utils/firebase');

// const { db } = global;

const {
  NODE_ENV,
  discordOwnerId,
  discordGuildId,
  channelModeratorsId,
  roleModeratorId,
} = require('../../../env');

const modmailButtons = new MessageActionRow()
  .addComponents(
    new MessageButton()
      .setCustomId('modmailTripsitter')
      .setLabel('I need a tripsitter')
      .setStyle('SUCCESS'),
    // new MessageButton()
    //   .setCustomId('modmailCommands')
    //   .setLabel('Show me your commands')
    //   .setStyle('PRIMARY'),
    new MessageButton()
      .setCustomId('modmailFeedback')
      .setLabel('Give Feedback')
      .setStyle('PRIMARY'),
    new MessageButton()
      .setCustomId('modmailIrcissue')
      .setLabel('IRC issues')
      .setStyle('DANGER'),
    new MessageButton()
      .setCustomId('modmailDiscordissue')
      .setLabel('Discord issues')
      .setStyle('SECONDARY'),
  );

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modmail')
    .setDescription('Modmail actions!')
    .addSubcommand(subcommand => subcommand
      .setDescription('Close this ticket as resolved')
      .setName('close'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Get the ID of this ticket')
      .setName('id'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Block this user from future messages/tickets')
      .setName('block'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Take the ticket off hold')
      .setName('unpause'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Put the ticket on hold')
      .setName('pause')),
  async execute(/* interaction, client */) {
    logger.debug(`[${PREFIX}] Started!`);
  },
  async modmailInitialResponse(message) {
    // logger.debug(`[${PREFIX}] Message: ${JSON.stringify(message, null, 2)}!`);

    const embed = template.embedTemplate()
      .setColor('BLUE');

    const author = message.author;
    const guild = await message.client.guilds.fetch(discordGuildId);
    logger.debug(`[${PREFIX}] Message sent in DM by ${message.author.username}!`);
    const description = stripIndents`Hey there ${author}! I'm a helper bot for ${guild} =)

    How can I help?`;
    embed.setDescription(description);

    message.author.send({ embeds: [embed], components: [modmailButtons] });
  },
  async modmailTripsitter(interaction) {
    const guild = await interaction.client.guilds.fetch(discordGuildId);
    logger.debug(`[${PREFIX}] Message: ${JSON.stringify(interaction, null, 2)}!`);
    interaction.reply(stripIndents`
    For now you must join ${guild} to get tripsitting help!

    http://discord.gg/tripsit`);
  },
  // async modmailCommands(interaction) {
  //   logger.debug(`[${PREFIX}] Message: ${JSON.stringify(interaction, null, 2)}!`);
  //   interaction.reply(`[${PREFIX}] modmailCommands!`);
  // },
  async modmailFeedback(interaction) {
    logger.debug(`[${PREFIX}] Message: ${JSON.stringify(interaction, null, 2)}!`);
    // Create the modal
    const modal = new Modal()
      .setCustomId('modmailFeedbackModal')
      .setTitle('TripSit Feedback');
    const timeoutReason = new TextInputComponent()
      .setLabel('What would you like to let the team know?')
      .setStyle('PARAGRAPH')
      .setPlaceholder('This bot is cool and I have a suggestion...')
      .setCustomId('feedbackInput')
      .setRequired(true);
    // An action row only holds one text input, so you need one action row per text input.
    const firstActionRow = new MessageActionRow().addComponents(timeoutReason);
    // Add inputs to the modal
    modal.addComponents(firstActionRow);
    // Show the modal to the user
    await interaction.showModal(modal);
  },
  async modmailFeedbackSubmit(interaction) {
    logger.debug(`[${PREFIX}] Message: ${JSON.stringify(interaction, null, 2)}!`);
    const modalInput = interaction.fields.getTextInputValue('feedbackInput');
    logger.debug(`[${PREFIX}] modalInput: ${modalInput}!`);

    // Get the actor
    const actor = interaction.user;
    logger.debug(`[${PREFIX}] actor: ${actor}!`);

    // Get the moderator role
    const tripsitGuild = await interaction.client.guilds.cache.get(discordGuildId);
    const moderatorRole = tripsitGuild.roles.cache.find(role => role.id === roleModeratorId);

    // Get the moderation channel
    const modChan = interaction.client.channels.cache.get(channelModeratorsId);
    const ircAdminEmbed = template.embedTemplate()
      .setColor('RANDOM')
      .setDescription(stripIndents`
      Hey ${moderatorRole.toString()}!

      Someone has subitted feedback:

      > ${modalInput}`);
    modChan.send({ embeds: [ircAdminEmbed] });
    interaction.reply('Thank you for the feedback!');
  },
  async modmailIssue(interaction, issueType) {
    // logger.debug(`[${PREFIX}] Message: ${JSON.stringify(interaction, null, 2)}!`);

    let placeholder = '';
    if (issueType === 'irc') {
      placeholder = 'I\'ve been banned on IRC and I dont know why.\nMy nickname is Strongbad and my IP is 192.168.100.200';
    } else if (issueType === 'discord') {
      placeholder = 'I\'ve been banned on Discord and I dont know why, can you please help?';
    }
    // Create the modal
    const modal = new Modal()
      .setCustomId(`${issueType}ModmailIssueModal`)
      .setTitle('TripSit Feedback');
    const timeoutReason = new TextInputComponent()
      .setLabel('What is your issue? Be super detailed!')
      .setStyle('PARAGRAPH')
      .setPlaceholder(placeholder)
      .setCustomId(`${issueType}IssueInput`)
      .setRequired(true);
    // An action row only holds one text input, so you need one action row per text input.
    const firstActionRow = new MessageActionRow().addComponents(timeoutReason);
    // Add inputs to the modal
    modal.addComponents(firstActionRow);
    // Show the modal to the user
    await interaction.showModal(modal);
  },
  async modmailIssueSubmit(interaction, issueType) {
    // logger.debug(`[${PREFIX}] interaction: ${JSON.stringify(interaction, null, 2)}!`);

    // Respond right away cuz the rest of this doesn't matter
    interaction.reply('Thank you, we will respond to right here when we can!');

    // Get the moderator role
    const tripsitGuild = await interaction.client.guilds.cache.get(discordGuildId);
    const moderatorRole = tripsitGuild.roles.cache.find(role => role.id === roleModeratorId);

    // Get the moderation channel
    const modChan = interaction.client.channels.cache.get(channelModeratorsId);

    // Get whatever they sent in the modal
    const modalInput = interaction.fields.getTextInputValue(`${issueType}IssueInput`);
    logger.debug(`[${PREFIX}] modalInput: ${modalInput}!`);

    // Get the actor
    const actor = interaction.user;
    logger.debug(`[${PREFIX}] actor: ${actor}!`);

    // Dont run if the user is on timeout
    // if (actor.communicationDisabledUntilTimestamp !== null) {
    //   return actor.send(stripIndents`
    //   Hey!

    //   Looks like you're on timeout =/

    //   You can't use the modmail while on timeout.`);
    // }

    const [actorData, actorFbid] = await getUserInfo(actor);

    // Get ticket information
    let ticketInfo = {};
    if ('discord' in actorData) {
      if ('tickets' in actorData.discord) {
        // Check if the 'status' of each ticket is 'open' and if so make a list
        actorData.discord.tickets.forEach(ticket => {
          if (ticket.issueStatus === 'open') {
            ticketInfo = ticket;
          }
        });
      }
    }

    // Get the ticket ID
    logger.debug(`[${PREFIX}] ticketInfo: ${JSON.stringify(ticketInfo, null, 2)}!`);
    if (Object.keys(ticketInfo).length !== 0) {
      // const issueType = ticketInfo.issueType;
      const issueThread = await modChan.threads.fetch(ticketInfo.issueThread);
      // logger.debug(`[${PREFIX}] issueThread: ${JSON.stringify(issueThread, null, 2)}!`);
      if (issueThread) {
        issueThread.send(modalInput);
        return;
      }
    }

    // Create a new thread in mod channel
    const ticketThread = await modChan.threads.create({
      name: `${actor.username}'s ${issueType} issue!`,
      autoArchiveDuration: 1440,
      type: NODE_ENV === 'production' ? 'GUILD_PRIVATE_THREAD' : 'GUILD_PUBLIC_THREAD',
      reason: `${actor.username} submitted a(n) ${issueType} issue`,
    });
    logger.debug(`[${PREFIX}] Created meta-thread ${ticketThread.id}`);

    const embed = template.embedTemplate()
      .setColor('DARK_BLUE')
      .setDescription(stripIndents`Hey ${moderatorRole}s! ${actor} has submitted a new issue:

    > ${modalInput}

    Please look into it and respond to them in this thread!

    When you're done remember to '/modmail close' this ticket!`);

    await ticketThread.send({ embeds: [embed], ephemeral: true });
    logger.debug(`[${PREFIX}] Sent intro message to meta-thread ${ticketThread.id}`);

    // Set ticket information
    if ('discord' in actorData) {
      if ('tickets' in actorData.discord) {
        actorData.discord.tickets.push({
          issueThread: ticketThread.id,
          issueUser: actor.id,
          issueType,
          issueStatus: 'open',
        });
      } else {
        actorData.discord.tickets = [{
          threadId: ticketThread.id,
          issueUser: actor.id,
          type: issueType,
          status: 'open',
        }];
      }
    } else {
      actorData.discord = {
        tickets: [{
          threadId: ticketThread.id,
          issueUser: actor.id,
          type: issueType,
          status: 'open',
        }],
      };
    }
    setUserInfo(actorFbid, actorData);

    // Get the IRC admin
    const ircAdmin = interaction.client.users.cache.get(discordOwnerId);
    // Alert the admin that the new thread is created
    const ircAdminEmbed = template.embedTemplate()
      .setColor('RANDOM')
      .setDescription(stripIndents`
      Hey ${ircAdmin.toString()}, ${actor} has an issue in ${ticketThread.toString()}!`);
    ircAdmin.send({ embeds: [ircAdminEmbed] });
  },
};
