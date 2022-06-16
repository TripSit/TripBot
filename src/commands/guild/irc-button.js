'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  MessageActionRow,
  MessageButton,
  Modal,
  TextInputComponent,
} = require('discord.js');
const { stripIndents } = require('common-tags');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');
const {
  // getUserInfo,
  // setUserInfo,
  getTicketInfo,
  setTicketInfo,
} = require('../../utils/firebase');

const PREFIX = path.parse(__filename).name;

const {
  NODE_ENV,
  discordOwnerId,
  channelIrcId,
  discordGuildId,
  roleModeratorId,
} = require('../../../env');

let {
  discordIrcAdminId,
} = require('../../../env');

if (NODE_ENV !== 'production') {
  // If we're in development then don't bother the irc admin
  discordIrcAdminId = discordOwnerId;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('irc-button')
    .setDescription('Creates the IRC room info!'),
  async execute(interaction) {
    const channelIrc = interaction.client.channels.cache.get(channelIrcId);

    const buttonText = stripIndents`
      Welcome to TripSit's IRC help channel!

      This channel can be used to get in contact with the Team Tripsit!

      If you can't connect to the IRC and don't know why, click the red button and give us your details.
      This will make a **private** thread with moderators, so please be detailed and include your IP address.

      If you've been banned and know why, click the blue button and give us your details.
      This will also make a **private** thread with moderators.
      Please do not interact with the rest of the discord while your appeal is being processed.
      It may be considered ban evasion if you get banned on IRC and immediately on discord outside of this channel!

      Other issues, questions, feedback can be privately discussed with the team with the grey button.

      Thanks for reading, stay safe!
    `;

    // Create a new button embed
    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('ircConnect')
          .setLabel('I can\'t connect!')
          .setStyle('DANGER'),
        new MessageButton()
          .setCustomId('ircAppeal')
          .setLabel('I want to appeal!')
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId('ircOther')
          .setLabel('I have other issues!')
          .setStyle('SECONDARY'),
      );

    // Create a new button
    await channelIrc.send({ content: buttonText, components: [row] });
    await interaction.reply({ content: 'done!', ephemeral: true });
    logger.debug(`[${PREFIX}] finished!`);
  },
  async ircClick(interaction, issueType) {
    // logger.debug(`[${PREFIX}] Message: ${JSON.stringify(interaction, null, 2)}!`);

    let placeholder = '';
    if (issueType === 'ircConnect') {
      placeholder = 'I\'ve been banned on IRC and I dont know why.\nMy nickname is Strongbad and my IP is 192.168.100.200';
    } else if (issueType === 'ircAppeal') {
      placeholder = 'I was a jerk it, wont happen again. My nickname is Strongbad';
    } else if (issueType === 'ircOther') {
      placeholder = 'I just wanted to say that Tripsit is super cool and I love it!';
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
  async ircSubmit(interaction, issueType) {
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
    const moderatorRole = tripsitGuild.roles.cache.find(role => role.id === roleModeratorId);

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
    const [ticketData] = await getTicketInfo(actor.id, 'user');
    logger.debug(`[${PREFIX}] ticketData: ${JSON.stringify(ticketData, null, 2)}!`);

    // Check if an open thread already exists, and if so, update that thread, return
    if (Object.keys(ticketData).length !== 0) {
      // const issueType = ticketInfo.issueType;
      const issueThread = await channel.threads.fetch(ticketData.issueThread);
      // logger.debug(`[${PREFIX}] issueThread: ${JSON.stringify(issueThread, null, 2)}!`);
      if (issueThread) {
        // Ping the user in the help thread
        const helpMessage = stripIndents`
          Hey team, ${actor} submitted a new request for help:

          > ${modalInput}
        `;
        issueThread.send(helpMessage);
        interaction.reply(`You already have an open issue here ${issueThread.toString()}!`);
        return;
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

    interaction.reply(`Thank you, check out ${ticketThread} to talk with a team member about your issue!`);

    const embed = template.embedTemplate()
      .setColor('DARK_BLUE')
      .setDescription(stripIndents`
      Hey ${moderatorRole}s! ${actor} has submitted a new issue:

      > ${modalInput}

      Please look into it and respond to them in this thread!

      When you're done remember to '/modmail close' this ticket!`);

    await ticketThread.send({ embeds: [embed], ephemeral: true });
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

    if (issueType === 'irc') {
      const ircAdmin = interaction.client.users.cache.get(discordIrcAdminId);
      // Alert the admin that the new thread is created
      const ircAdminEmbed = template.embedTemplate()
        .setColor('RANDOM')
        .setDescription(stripIndents`
        Hey ${ircAdmin.toString()}, ${actor} has an issue in ${ticketThread.toString()}!`);
      ircAdmin.send({ embeds: [ircAdminEmbed] });
    }
    if (issueType === 'discord') {
      const discordAdmin = interaction.client.users.cache.get(discordOwnerId);
      // Alert the admin that the new thread is created
      const discordAdminEmbed = template.embedTemplate()
        .setColor('RANDOM')
        .setDescription(stripIndents`
      Hey ${discordAdmin.toString()}, ${actor} has an issue in ${ticketThread.toString()}!`);
      discordAdmin.send({ embeds: [discordAdminEmbed] });
    }
  },
};
