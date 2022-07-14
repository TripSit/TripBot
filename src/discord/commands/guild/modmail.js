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
const template = require('../../../global/embed-template');
const logger = require('../../../global/logger');
const {
  // getUserInfo,
  // setUserInfo,
  getTicketInfo,
  setTicketInfo,
} = require('../../../global/firebaseAPI');

const {
  NODE_ENV,
  channelTripsitId,
  discordGuildId,
  channelModeratorsId,
  channelIrcId,
  roleModeratorId,
  roleIrcadminId,
  roleDiscordadminId,
  roleDeveloperId,
} = require('../../../../env');

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

// Declare the static test nitice
const testNotice = '🧪THIS IS A TEST PLEASE IGNORE🧪\n\n';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modmail')
    .setDescription('Modmail actions!')
    .addSubcommand(subcommand => subcommand
      .setDescription('Close this ticket as resolved')
      .setName('closed'))
    // .addSubcommand(subcommand => subcommand
    //   .setDescription('Get the ID of this ticket')
    //   .setName('id'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Block this user from future messages/tickets')
      .setName('blocked'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Take the ticket off hold')
      .setName('open'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Put the ticket on hold')
      .setName('paused')),
  async execute(interaction) {
    logger.debug(`[${PREFIX}] Started!`);
    const command = interaction.options.getSubcommand();
    logger.debug(`[${PREFIX}] Command: ${command}`);

    // Get the actor
    // const actor = interaction.user;

    // Get the ticket info
    const [ticketData, ticketFbid] = await getTicketInfo(interaction.channel.id, 'channel');

    // Transform actor data
    if (command === 'closed') {
      logger.debug(`[${PREFIX}] Closing ticket!`);
      ticketData.issueStatus = 'closed';
      const ticketChannel = interaction.client.channels.cache.get(ticketData.issueThread);

      // Reply before you archive, or else you'll just unarchive
      await interaction.reply('It looks like we\'re done here, this ticket has been archived by a moderator!');

      // Archive the channel
      ticketChannel.setArchived(true, 'Archiving after close');
      setTicketInfo(ticketFbid, ticketData);
    } else if (command === 'block') {
      logger.debug(`[${PREFIX}] Blocking user!`);
      // Reply before you archive, or else you'll just unarchive
      await interaction.reply('This user has been blocked from creating future tickets!');

      ticketData.issueStatus = 'blocked';

      // Archive the channel
      const ticketChannel = interaction.client.channels.cache.get(ticketData.issueThread);
      ticketChannel.setArchived(true, 'Archiving after close');
      setTicketInfo(ticketFbid, ticketData);
    } else if (command === 'unblock') {
      logger.debug(`[${PREFIX}] Unblocking user!`);
      // Reply before you archive, or else you'll just unarchive
      await interaction.reply('This user has been un-blocked from creating future tickets!');

      ticketData.issueStatus = 'closed';

      // Archive the channel
      setTicketInfo(ticketFbid, ticketData);
    } else if (command === 'unpause') {
      logger.debug(`[${PREFIX}] Unpausing ticket!`);
      await interaction.reply('This ticket has been unpaused and can communication can resume!');

      ticketData.issueStatus = 'open';

      setTicketInfo(ticketFbid, ticketData);
    } else if (command === 'pause') {
      logger.debug(`[${PREFIX}] Pausing ticket!`);
      await interaction.reply('This ticket has been paused, please wait to communicate further!');

      ticketData.issueStatus = 'paused';

      // Archive the channel
      setTicketInfo(ticketFbid, ticketData);
    }
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
    const member = await guild.members.fetch(interaction.user.id);
    logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}!`);
    if (member) {
      const channelTripsit = await guild.channels.fetch(channelTripsitId);
      interaction.reply(stripIndents`
      Click the button in ${channelTripsit.toString()}!`);
    } else {
      interaction.reply(stripIndents`
      You must join ${guild} to get tripsitting help!
      http://discord.gg/tripsit`);
    }
    // Create the modal
    // const modal = new Modal()
    //   .setCustomId('tripsitModmailModal')
    //   .setTitle('TripSit Help Request');
    // modal.addComponents(new MessageActionRow().addComponents(new TextInputComponent()
    //   .setCustomId('triageInput')
    //   .setLabel('What substance? How much taken? What time?')
    //   .setStyle('SHORT')));
    // modal.addComponents(new MessageActionRow().addComponents(new TextInputComponent()
    //   .setCustomId('introInput')
    //   .setLabel('What\'s going on? Give us the details!')
    //   .setStyle('PARAGRAPH')));
    // await interaction.showModal(modal);
  },
  // async modmailTripsitterSubmit(interaction) {
  //   const guild = await interaction.client.guilds.fetch(discordGuildId);
  //   const member = await guild.members.fetch(interaction.user.id);
  //   logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}!`);
  // },
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

    const roleDeveloper = interaction.guild.roles.cache.find(role => role.id === roleDeveloperId);
    logger.debug(`[${PREFIX}] roleDeveloper: ${roleDeveloper}`);

    const isDev = interaction.member.roles.cache.find(
      role => role.id === roleDeveloper.id,
    ) !== undefined;

    // Get the moderator role
    const tripsitGuild = await interaction.client.guilds.cache.get(discordGuildId);
    const roleModerator = tripsitGuild.roles.cache.find(role => role.id === roleModeratorId);

    // Get the moderation channel
    const modChan = interaction.client.channels.cache.get(channelModeratorsId);
    const ircAdminEmbed = template.embedTemplate()
      .setColor('RANDOM')
      .setDescription(stripIndents`
      Hey ${isDev ? 'moderators' : roleModerator}!

      Someone has subitted feedback:

      > ${modalInput}`);
    modChan.send({ embeds: [ircAdminEmbed] });
    interaction.reply('Thank you for the feedback! Here\'s a cookie: 🍪');
  },
  async modmailIssue(interaction, issueType) {
    // logger.debug(`[${PREFIX}] Message: ${JSON.stringify(interaction, null, 2)}!`);

    let placeholder = '';
    if (issueType === 'irc') {
      placeholder = 'I\'ve been banned on IRC and I dont know why.\nMy nickname is Strongbad and my IP is 192.168.100.200';
    } else if (issueType === 'discord') {
      placeholder = 'I have an issue with discord, can you please help?';
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
    const guild = await interaction.client.guilds.fetch(discordGuildId);
    const member = await guild.members.fetch(interaction.user.id);
    // logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}!`);
    if (member) {
      // Dont run if the user is on timeout
      if (member.communicationDisabledUntilTimestamp !== null) {
        return member.send(stripIndents`
        Hey!

        Looks like you're on timeout =/

        You can't use the modmail while on timeout.`);
      }
    } else {
      interaction.reply('Thank you, we will respond to right here when we can!');
    }
    // Get the moderator role
    const tripsitGuild = await interaction.client.guilds.cache.get(discordGuildId);
    const roleModerator = tripsitGuild.roles.cache.find(role => role.id === roleModeratorId);
    const roleDeveloper = tripsitGuild.roles.cache.find(role => role.id === roleDeveloperId);

    // Determine if this command was started by a Developer
    const isDev = await roleDeveloper.members.map(m => m.user.id === interaction.user.id);

    logger.debug(`[${PREFIX}] isDev: ${JSON.stringify(isDev, null, 2)}!`);

    const channel = interaction.client.channels.cache.get(channelIrcId);
    // Debating if there should be a sparate channel for discord issues or if just use irc?
    // if (issueType === 'discord') {
    //   // Get the moderation channel
    //   channel = interaction.client.channels.cache.get(channelIrcId);
    // } else if (issueType === 'irc') {
    //   // Get the irc channel
    //   channel = interaction.client.channels.cache.get(channelIrcId);
    // }

    // Get whatever they sent in the modal
    const modalInput = interaction.fields.getTextInputValue(`${issueType}IssueInput`);
    logger.debug(`[${PREFIX}] modalInput: ${modalInput}!`);

    // // Get the actor
    const actor = interaction.user;
    const [ticketData, ticketFbid] = await getTicketInfo(actor.id, 'user');
    logger.debug(`[${PREFIX}] ticketData: ${JSON.stringify(ticketData, null, 2)}!`);

    // Check if an open thread already exists, and if so, update that thread, return
    if (Object.keys(ticketData).length !== 0) {
      // const issueType = ticketInfo.issueType;
      try {
        const issueThread = await channel.threads.fetch(ticketData.issueThread);
        // logger.debug(`[${PREFIX}] issueThread: ${JSON.stringify(issueThread, null, 2)}!`);
        if (issueThread) {
          // Ping the user in the help thread
          const helpMessage = stripIndents`
            Hey team, ${actor} submitted a new request for help:

            > ${modalInput}
          `;
          issueThread.send(helpMessage);
          const embed = template.embedTemplate();
          embed.setDescription(stripIndents`You already have an open issue here ${issueThread.toString()}!`);
          interaction.reply({ embeds: [embed], ephemeral: true });
          return;
        }
      } catch (err) {
        logger.debug(`[${PREFIX}] The thread has likely been deleted!`);
        ticketData.issueStatus = 'closed';
        setTicketInfo(ticketFbid, ticketData);
      }
    }

    // Create a new thread in channel
    const ticketThread = await channel.threads.create({
      name: `${actor.username}'s ${issueType} issue!`,
      autoArchiveDuration: 1440,
      type: NODE_ENV === 'production' ? 'GUILD_PRIVATE_THREAD' : 'GUILD_PUBLIC_THREAD',
      reason: `${actor.username} submitted a(n) ${issueType} issue`,
    });
    logger.debug(`[${PREFIX}] Created meta-thread ${ticketThread.id}`);

    const embed = template.embedTemplate();
    embed.setDescription(stripIndents`Thank you, check out ${ticketThread} to talk with a team member about your issue!`);
    interaction.reply({ embeds: [embed], ephemeral: true });

    let message = stripIndents`
      Hey ${isDev ? 'moderators' : roleModerator}! ${actor} has submitted a new issue:

      > ${modalInput}

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
      issueDesc: modalInput,
    };
    setTicketInfo(null, newTicketData);

    logger.debug(`[${PREFIX}] issueType: ${issueType}!`);
    await tripsitGuild.members.fetch();
    let role = {};
    if (issueType.includes('irc')) {
      // Get the moderator role
      role = await tripsitGuild.roles.fetch(roleIrcadminId);
    }
    if (issueType.includes('discord')) {
      // Get the moderator role
      role = await tripsitGuild.roles.fetch(roleDiscordadminId);
    }
    const admins = await role.members;
    logger.debug(`[${PREFIX}] admins: ${JSON.stringify(admins, null, 2)}!`);
    admins.forEach(async admin => {
      // Alert the admin that the new thread is created
      let response = stripIndents`
      Hey ${admin.toString()}, ${actor} has an issue in ${ticketThread.toString()}!`;
      if (isDev) {
        response = testNotice + response;
      }
      admin.send(response);
    });
  },
};
