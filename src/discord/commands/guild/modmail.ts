/* eslint-disable max-len */
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ModalBuilder,
  ButtonBuilder,
  TextInputBuilder,
  Colors,
  ThreadChannel,
  Message,
  ButtonInteraction,
  TextChannel,
  ModalSubmitInteraction,
  Role,
  // Guild,
  GuildMember,
} from 'discord.js';
import {
  ChannelType,
  ButtonStyle,
  TextInputStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import {
  getOpenTicket,
  getUser,
  ticketGet,
  ticketUpdate,
  usersUpdate,
} from '../../../global/utils/knex';
import {
  UserTickets,
  TicketStatus,
} from '../../../global/@types/database.d';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { startLog } from '../../utils/startLog';

/* Test script
1a) Init !
Trigger: Send a message to the bot
Result: Bot responds with the ModMailInitialResponse embed

1b) Init again !
Trigger: Send another message to the bot
Result: Bot responds with the ModMailInitialResponse embed, again

2a) External tripsit start !
Trigger: Make sure you're not in the tripsit guild and click the tripsitme button in the DM
Result: Bot shows an embed to ask for info

2a) External tripsit submit !
Trigger: Fill in the modal and click submit
Result: New thread is created in the guild with an orange icon, user is told that their message was submitted

2a) External tripsit start, again !
Trigger: Click the Trip Sit Me button again
Result: Bot says you have an active thread and that you can just type in dm

2b) External tripsit - send dm message !
Trigger: Send another message to the bot
Result: Message is sent to the thread

2c) External tripsit - send thread message !
Trigger: In the thread, send a message
Result: Message is sent to to the DM

3) Modmail Own !
Trigger: While inside the thread, click the own button
Result: Message is posted in the thread, message is sent to the user, channel icon changes to Yellow

4a) Modmail pause
Trigger: While inside the thread, click the pause button
Result: Message is posted in the thread, message is sent to the user, channel icon changes to ???

4b) Modmail pause - send dm message
Trigger: Send a DM to the bot
Result: bot responds in dm "Sorry this ticket is paused"

4c) Modmail pause - send thread message
Trigger: Send a message in the thread
Result: Bot responds in thread "Sorry this ticket is paused, the user cannot see this, you must unpause to send a message"

4d) Modmail unpause
Trigger: While inside the thread, click the unpause button
Result: Message is posted in the thread, message is sent to the user, channel icon changes to ???

5a) Modmail block
Trigger: While inside the thread, click the block button
Result: Message is posted in the thread, message is sent to the user, channel icon changes to ???

5b) Modmail block - send dm message
Trigger: Send a DM to the bot
Result: bot responds in dm "sad beeps"

5c) Modmail block - send thread message
Trigger: Send a message in the thread
Result: Bot responds in thread "Sorry this user is blocked, the user cannot see this, you must unpause to send a message"

5d) Modmail unblock
Trigger: While inside the thread, click the unblock button
Result: Message is posted in the thread, message is sent to the user, channel icon changes to ???

6a) Modmail close
Trigger: While inside the thread, click the close button
Result: Message is posted in the thread, message is sent to the user, channel icon changes to ???

6b) Modmail close - send dm message
Trigger: Send a DM to the bot
Result: Message is sent to the thread

6c) Modmail close - send thread message
Trigger: Send a message in the thread
Result: Message is sent to to the DM

7a) Modmail I'm Good (DM)
Trigger: Click the Im Good button in DM
Result: Message is posted in the thread, message is sent to the user, channel icon changes to ???

7b) Modmail I'm Good (DM) - send dm message
Trigger: Send a DM to the bot
Result: Re-show the prompt for the Im Good button

7c) Modmail I'm Good (DM) - send thread message
Trigger: Send a message in the thread
Result: "Sorry this ticket is resolved, the user will need to create a new ticket for you to send them a message"

8a) Bot banned
Trigger: Use the /botmod botban command to ban a user
Result: Message is posted to the modlog room

8c) Bot banned - send dm message
Trigger: Send a DM to the bot
Result: bot responds in dm "sad beeps"

8b) Bot banned - send thread message
Trigger: Send a message in the thread
Result: Bot responds in thread "Sorry this user is bot banned, the user cannot see this, you must unpause to send a message"
*/

const modMailOwn = 'modmailIssue~own';
const modMailPause = 'modmailIssue~pause';
const modMailUnpause = 'modmailIssue~unpause';
const modMailBlock = 'modmailIssue~block';
const modMailUnblock = 'modmailIssue~unblock';
const modMailClose = 'modmailIssue~close';
const modMailReopen = 'modmailIssue~reopen';
const modMailResolve = 'modmailIssue~resolve';
const modMailIssuePlaceholder = 'I have an issue, can you please help?';

const F = f(__filename);

export default modmail;

async function updateButtons(
  interaction: ButtonInteraction | ChatInputCommandInteraction,
  newButtons: ActionRowBuilder<ButtonBuilder>,
  ticketData: UserTickets | null,
) {
  if (interaction.channel) {
    let initialMessage = {} as Message;
    let content = '';
    if (interaction.channel.type !== ChannelType.DM) {
      if (interaction.isButton()) {
        initialMessage = interaction.message;
        content = interaction.message.content;
      }
      if (interaction.isCommand() && interaction.channel) {
        initialMessage = await interaction.channel.messages.fetch((ticketData as UserTickets).first_message_id) as Message;
        content = initialMessage.content;
      }

      if (initialMessage.id) {
        initialMessage.edit({
          content,
          components: [newButtons],
          flags: ['SuppressEmbeds'],
        });
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
  startLog(F, interaction);
  let command = '';
  if (interaction.isButton()) {
    const varArray = interaction.customId.split('~');
    [, command] = varArray; // , skips the first element
    // command = varArray[1];
  } else if (interaction.isCommand()) {
    command = interaction.options.getSubcommand();
  }

  const actor = interaction.user;
  // log.debug(F, `actor: ${actor.username}!`);
  // log.debug(F, `ticketChannel.name: ${ticketChannel.name}!`);
  // log.debug(F, `ticketChannel.type: ${ticketChannel.type}!`);

  // Get the ticket info
  let ticketData = {} as UserTickets;
  if (interaction.channel
    && (interaction.channel.type === ChannelType.PublicThread
    || interaction.channel.type === ChannelType.PrivateThread)) {
    // log.debug(F, `interaction.channel.id: ${interaction.channel.id}!`);
    const ticketDataRaw = await getOpenTicket(null, interaction.channel.id);

    if (!ticketDataRaw) {
      interaction.reply({ content: 'This ticket thread does not exist!', ephemeral: true });
      return;
    }
    ticketData = ticketDataRaw;
  } else if (interaction.channel && interaction.channel.type === ChannelType.DM) {
    const actorUserData = await getUser(actor.id, null, null);
    const ticketDataRaw = await getOpenTicket(actorUserData.id, null);

    if (!ticketDataRaw) {
      interaction.reply({ content: 'This user\'s ticket thread does not exist!', ephemeral: true });
      return;
    }
    ticketData = ticketDataRaw;
  }

  // log.debug(F, `ticketData: ${JSON.stringify(ticketData, null, 2)}!`);

  const ticketChannel = await interaction.client.channels.fetch(ticketData.thread_id) as ThreadChannel;

  const targetUserData = await getUser(null, null, ticketData.user_id);
  if (!targetUserData.discord_id) {
    log.error(F, `No discord_id found for user ${ticketData.user_id}!`);
    return;
  }
  const target = await interaction.client.users.fetch(targetUserData.discord_id);
  if (!ticketChannel) {
    // log.debug(F, `ticketChannel not found!`);
    interaction.reply({ content: 'This user\'s ticket thread does not exist!', ephemeral: true });
    return;
  }

  let verb = '';
  let noun = '';
  let updatedModmailButtons = new ActionRowBuilder<ButtonBuilder>();
  let userMessage = '';

  // log.debug(F, `command: ${command}!`);
  if (command === 'close') {
    updatedModmailButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(modMailBlock).setLabel('Block').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(modMailReopen).setLabel('Reopen').setStyle(ButtonStyle.Danger),
    );
    if (ticketData.status === 'CLOSED') {
      await interaction.reply({ content: 'This ticket is already closed!', ephemeral: true });
    } else {
      // log.debug(F, `Closing ticket!`);
      noun = 'Ticket';
      verb = 'CLOSED';
      ticketData.status = 'CLOSED' as TicketStatus;
      userMessage = 'It looks like we\'re good here! We\'ve closed this ticket, but if you need anything else, feel free to open a new one!';
      await target.send(userMessage);
      ticketChannel.setName(`💚${ticketChannel.name.substring(1)}`);
    }
  } else if (command === 'reopen') {
    updatedModmailButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(modMailPause).setLabel('Pause').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(modMailBlock).setLabel('Block').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(modMailClose).setLabel('Close').setStyle(ButtonStyle.Danger),
    );
    if (ticketData.status !== 'CLOSED') {
      await interaction.reply({ content: 'This ticket is not closed!', ephemeral: true });
    } else {
      // log.debug(F, `Reopening ticket!`);
      noun = 'Ticket';
      verb = 'REOPENED';
      ticketData.status = 'OWNED' as TicketStatus;
      userMessage = 'This ticket has been reopened! Feel free to continue the conversation here.';
      await target.send(userMessage);
      ticketChannel.setName(`❤${ticketChannel.name.substring(1)}`);
    }
  } else if (command === 'block') {
    updatedModmailButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(modMailUnblock).setLabel('Unblock').setStyle(ButtonStyle.Secondary),
    );
    if (ticketData.status === 'BLOCKED') {
      await interaction.reply({ content: 'This ticket is already blocked!', ephemeral: true });
    } else {
    // log.debug(F, `Blocking user!`);
      noun = 'User';
      verb = 'BLOCKED';
      ticketData.status = 'BLOCKED' as TicketStatus;
      userMessage = 'You have been blocked from using modmail. Please email us at appeals@tripsit.me if you feel this was an error!';
      await target.send(userMessage);
      ticketChannel.setName(`❤${ticketChannel.name.substring(1)}`);

      // Block impacts the user directly
      targetUserData.discord_bot_ban = true;

      await usersUpdate(targetUserData);
    }
  } else if (command === 'unblock') {
    updatedModmailButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(modMailPause).setLabel('Pause').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(modMailBlock).setLabel('Block').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(modMailClose).setLabel('Close').setStyle(ButtonStyle.Danger),
    );
    if (ticketData.status !== 'BLOCKED') {
      await interaction.reply({ content: 'This ticket is not blocked!', ephemeral: true });
    } else {
      // log.debug(F, `Unblocking user!`);
      noun = 'User';
      verb = 'UNBLOCKED';
      ticketData.status = 'OWNED' as TicketStatus;
      userMessage = 'You have been unblocked from using modmail!';
      await target.send(userMessage);
      ticketChannel.setName(`💛${ticketChannel.name.substring(1)}`);
      targetUserData.discord_bot_ban = false;
      await usersUpdate(targetUserData);
    }
  } else if (command === 'pause') {
    updatedModmailButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(modMailUnpause).setLabel('Unpause').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(modMailBlock).setLabel('Block').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(modMailClose).setLabel('Close').setStyle(ButtonStyle.Danger),
    );
    if (ticketData.status === 'PAUSED') {
      await interaction.reply({ content: 'This ticket is already paused!', ephemeral: true });
    } else {
      noun = 'Ticket';
      verb = 'PAUSED';
      ticketData.status = 'PAUSED' as TicketStatus;
      userMessage = 'This ticket has been paused while we look into this, thank you for your patience!';
      await target.send(userMessage);
    }
  } else if (command === 'unpause') {
    updatedModmailButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(modMailPause).setLabel('Pause').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(modMailBlock).setLabel('Block').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(modMailClose).setLabel('Close').setStyle(ButtonStyle.Danger),
    );
    if (ticketData.status !== 'PAUSED') {
      await interaction.reply({ content: 'This ticket is not paused!', ephemeral: true });
    } else {
    // log.debug(F, `Unpausing ticket!`);
      noun = 'Ticket';
      verb = 'UNPAUSED';
      ticketData.status = 'OWNED' as TicketStatus;
      userMessage = 'This ticket has been taken off hold, thank you for your patience!';
      await target.send(userMessage);
      ticketChannel.setName(`💛${ticketChannel.name.substring(1)}`);
    }
  } else if (command === 'own') {
    updatedModmailButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(modMailPause).setLabel('Pause').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(modMailBlock).setLabel('Block').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(modMailClose).setLabel('Close').setStyle(ButtonStyle.Danger),
    );
    if (ticketData.status === 'OWNED') {
      await interaction.reply({ content: 'This ticket is already owned!', ephemeral: true });
    } else {
    // log.debug(F, `Claiming ticket!`);
      noun = 'Ticket';
      verb = 'OWNED';
      ticketData.status = 'OWNED' as TicketStatus;
      userMessage = `${actor} has claimed this issue and will either help you or figure out how to get you help!`;
      await target.send(userMessage);
      ticketChannel.setName(`💛${ticketChannel.name.substring(1)}`);
    }
  } else if (command === 'resolve') {
    updatedModmailButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(modMailBlock).setLabel('Block').setStyle(ButtonStyle.Secondary),
    );
    if (ticketData.status === 'RESOLVED') {
      await interaction.reply({ content: 'This ticket is already resolved!', ephemeral: true });
    } else {
    // log.debug(F, 'Resolving ticket!'); // I'm good button
      noun = 'Ticket';
      verb = 'RESOLVED';
      ticketData.status = 'RESOLVED' as TicketStatus;
      userMessage = stripIndents`Hey ${target}, we're glad your issue is resolved!
    This ticket has been marked as resolved, but if you need anything else feel free to open a new one!`;
      ticketChannel.setName(`💚${ticketChannel.name.substring(1)}`);
      await ticketChannel.send(stripIndents`Hey team! ${target.toString()} has indicated that they no longer need help!`);
    }
  }

  if (ticketChannel.archived) {
    await ticketChannel.setArchived(false);
  }

  if (!interaction.replied) {
    if (command === 'resolve') {
      await interaction.reply(userMessage);
    } else {
      await interaction.reply(`${noun} has been ${verb} by ${actor}! I told the user: \n>${userMessage}`);
    }
  }

  await ticketUpdate(ticketData);

  const tripsitGuild = await interaction.client.guilds.fetch(env.DISCORD_GUILD_ID);
  const modlog = await tripsitGuild.channels.fetch(env.CHANNEL_MODLOG) as TextChannel;
  // Transform actor data
  const modlogEmbed = embedTemplate()
    .setColor(Colors.Blue)
    .setDescription(`${actor} ${command}ed ${target.tag} in ${ticketChannel}`);
  await modlog.send({ embeds: [modlogEmbed] });

  await updateButtons(
    interaction,
    updatedModmailButtons,
    ticketData,
  );
}

export const modmail: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('modmail')
    .setDescription('Modmail actions!')
    .addSubcommand(subcommand => subcommand
      .setDescription('Own this ticket')
      .setName('own'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Close this ticket as resolved')
      .setName('close'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Reopen this ticket')
      .setName('reopen'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Block this user from future messages/tickets')
      .setName('block'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Unblock this user')
      .setName('unblock'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Take the ticket off hold')
      .setName('unpause'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Put the ticket on hold')
      .setName('pause')),
  async execute(interaction:ChatInputCommandInteraction) {
    startLog(F, interaction);
    await modmailActions(interaction);
    return true;
  },
};

/**
 * The first response when someone messages the bot
 * @param {Message} message The message sent to the bot
 */
export async function modmailInitialResponse(message:Message) {
  // log.debug(F, `Message: ${JSON.stringify(message, null, 2)}!`);

  const embed = embedTemplate()
    .setColor(Colors.Blue);

  const { author } = message;
  const guildTripsit = await message.client.guilds.fetch(env.DISCORD_GUILD_ID);
  // log.debug(F, `Message sent in DM by ${message.author.username}!`);
  const description = stripIndents`Hey there ${author}! I'm a helper bot for ${guildTripsit} =)

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

  await message.author.send({ embeds: [embed], components: [modmailInitialResponseButtons] });
}

/**
 *
 * @param {ButtonInteraction} interaction
 * @param {'APPEAL' | 'TRIPSIT' | 'TECH' | 'FEEDBACK'} issueType
 */
export async function modmailCreate(
  interaction:ButtonInteraction,
  issueType:'APPEAL' | 'TRIPSIT' | 'TECH' | 'FEEDBACK',
) {
  // Get the actor
  const actor = interaction.user;

  // Get the tripsit guild
  const tripsitGuild = await interaction.client.guilds.fetch(env.DISCORD_GUILD_ID);

  let member = {} as GuildMember;
  try {
    member = await tripsitGuild.members.fetch(actor.id);
  } catch (error) {
    // This just means the actor isn't in the guild
  }

  // log.debug(F, `Member: ${JSON.stringify(member, null, 2)}!`);
  if (member.id) {
    if (issueType === 'TRIPSIT') {
      const channelTripsit = await tripsitGuild.channels.fetch(env.CHANNEL_TRIPSIT) as TextChannel;
      await interaction.reply({ content: `Please use the button in ${channelTripsit}!` });
      return;
    }
    if (issueType === 'TECH') {
      const channelTechhelp = await tripsitGuild.channels.fetch(env.CHANNEL_HELPDESK) as TextChannel;
      await interaction.reply({ content: `Please use the button in ${channelTechhelp}!` });
      return;
    }
    if (issueType === 'FEEDBACK') {
      const channelSuggestions = await tripsitGuild.channels.fetch(env.CHANNEL_SUGGESTIONS) as TextChannel;
      await interaction.reply({ content: `Please use the button in ${channelSuggestions}!` });
      return;
    }
  }

  // Create a dict of variables to be used based on the type of request
  const modmailVars = {
    APPEAL: {
      customId: `ModmailIssueModal~${issueType}`,
      title: 'Ban Appeal',
      description: 'Please be patient and do not PM moderators directly.',
      labelA: 'What is your appeal? Be super detailed!',
      placeholderA: modMailIssuePlaceholder,
      labelB: '',
      placeholderB: '',
      color: Colors.Red,
      channelId: env.CHANNEL_MODERATORS,
      channelTitle: `🧡│${member.id ? member.displayName : actor.username}'s ban appeal`,
      pingRole: env.ROLE_MODERATOR,
      firstResponse: 'thank you for using the bot to appeal your ban!',
    },
    TRIPSIT: {
      customId: `ModmailIssueModal~${issueType}`,
      title: 'Tripsit Me!',
      description: 'You can also join our Discord server and ask for help there!',
      labelA: 'What substance? How much taken? What time?',
      placeholderA: modMailIssuePlaceholder,
      labelB: 'What\'s going on? Give us the details!',
      placeholderB: modMailIssuePlaceholder,
      color: Colors.Green,
      channelId: env.CHANNEL_TRIPSIT,
      channelTitle: `🧡│${member.id ? member.displayName : actor.username}'s channel`,
      pingRole: env.ROLE_HELPER,
      firstResponse: 'thank you for asking for assistance!',
    },
    TECH: {
      customId: `ModmailIssueModal~${issueType}`,
      title: 'Technical Issues',
      description: 'Please be detailed with your problem so we can try to help!',
      labelA: 'What is your issue? Be super detailed!',
      placeholderA: modMailIssuePlaceholder,
      labelB: '',
      placeholderB: '',
      color: Colors.Grey,
      channelId: env.CHANNEL_HELPDESK,
      channelTitle: `🧡│${member.id ? member.displayName : actor.username}'s tech issue`,
      pingRole: env.ROLE_MODERATOR,
      firstResponse: 'thank you for asking for assistance!',
    },
    FEEDBACK: {
      customId: `ModmailIssueModal~${issueType}`,
      title: 'Give Feedback',
      description: 'Can be a suggestion, feedback, or issue. Please be detailed!',
      labelA: 'What is your feedback/suggestion?',
      placeholderA: 'This bot is cool and I have a suggestion...',
      labelB: '',
      placeholderB: '',
      color: Colors.Blue,
      channelId: env.CHANNEL_SUGGESTIONS,
      channelTitle: `🧡│${member.id ? member.displayName : actor.username}'s feedback`,
      pingRole: env.ROLE_MODERATOR,
      firstResponse: 'thank you for your feedback!',
    },
  };

  const userData = await getUser(actor.id, null, null);

  // const ticketData = await getOpenTicket(userData.id, null);

  const ticketData = await ticketGet(userData.id) as UserTickets | undefined;

  // log.debug(F, `ticketData: ${ticketData?.status}!`);

  // Get the parent channel to be used
  const channel = await interaction.client.channels.fetch(modmailVars[issueType].channelId) as TextChannel;

  // Check if an open thread already exists, and if so, update that thread
  if (ticketData) {
    // const issueType = ticketInfo.issueType;
    let issueThread = {} as ThreadChannel;
    try {
      issueThread = await channel.threads.fetch(ticketData.thread_id) as ThreadChannel;
    } catch (err) {
      // log.debug(F, 'Cant find thread, it has likely been deleted!');
      ticketData.status = 'DELETED' as TicketStatus;
      await ticketUpdate(ticketData);
    }
    // log.debug(F, `thread_id: ${JSON.stringify(thread_id, null, 2)}!`);
    if (issueThread.id) {
      const embed = embedTemplate();
      embed.setDescription(stripIndents`
        You already have an open session, you can talk to the team by responding here!
      `);
      interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }
  }

  // Create the modal
  const modal = new ModalBuilder()
    .setCustomId(`${modmailVars[issueType].customId}~${interaction.id}`)
    .setTitle(modmailVars[issueType].title);

  // An action row only holds one text input, so you need one action row per text input.
  const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
    .setLabel(modmailVars[issueType].labelA)
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder(modmailVars[issueType].placeholderA)
    .setCustomId('inputA')
    .setRequired(true));

  // Only the Tripsit modal has a second text input
  if (modmailVars[issueType].labelB !== '') {
    const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
      .setLabel(modmailVars[issueType].labelB)
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder(modmailVars[issueType].placeholderB)
      .setCustomId('inputB')
      .setRequired(true));
      // Add inputs to the modal
    modal.addComponents(firstActionRow, secondActionRow);
  } else {
    // Add inputs to the modal
    modal.addComponents(firstActionRow);
  }

  // Show the modal to the user
  await interaction.showModal(modal);

  // Collect a modal submit interaction
  const filter = (i:ModalSubmitInteraction) => i.customId.includes('ModmailIssueModal');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[2] !== interaction.id) return;
      // Get whatever they sent in the modal
      const modalInputA = i.fields.getTextInputValue('inputA');
      // log.debug(F, `modalInputA: ${modalInputA}!`);
      let modalInputB = '';
      try {
        modalInputB = i.fields.getTextInputValue('inputB');
        // log.debug(F, `modalInputB: ${modalInputB}!`);
      } catch (e) {
        // This is fine
      }

      // Create the thread in the tripsit guild
      const threadType = channel.guild.premiumTier > 2 ? ChannelType.PrivateThread : ChannelType.PublicThread;
      // log.debug(F, `thread type: ${threadType}!`);
      // log.debug(F, `name: ${modmailVars[issueType].channelTitle}!`);
      // log.debug(F, `reason: ${actor.username} submitted a(n) ${issueType} ticket!!`);
      const ticketThread = await channel.threads.create({
        name: modmailVars[issueType].channelTitle,
        autoArchiveDuration: 1440,
        type: threadType,
        reason: `${actor.username} submitted a(n) ${issueType} ticket!`,
      });
        // log.debug(F, `Created thread ${ticketThread.id}`);

      // Get the helper and TS roles
      const roleHelper = await tripsitGuild.roles.fetch(env.ROLE_TRIPSITTER) as Role;
      // log.debug(F, `roleHelper: ${roleHelper}`);
      const roleTripsitter = await tripsitGuild.roles.fetch(env.ROLE_TRIPSITTER) as Role;
      // log.debug(F, `roleTripsitter: ${roleTripsitter}`);

      // Respond to the user
      let firstResponse = stripIndents`
          Hey ${actor}, ${modmailVars[issueType].firstResponse}

          We've sent the following details to the team:

          ${modmailVars[issueType].labelA}
          > ${modalInputA}
          ${modalInputB !== '' ? stripIndents`${modmailVars[issueType].labelB}
          > ${modalInputB}
          ` : ''}
          **We will respond to right here when we can!**
        `;
      if (issueType === 'TRIPSIT') {
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

          **We will respond to right here when we can!**`;
      }

      // log.debug(F, `firstResponse: ${firstResponse}`);
      const embedDM = embedTemplate();
      embedDM.setDescription(firstResponse);

      const finishedButton = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(modMailResolve)
            .setLabel('I\'m good now!')
            .setStyle(ButtonStyle.Success),
        );

      i.reply({
        embeds: [embedDM],
        components: issueType === 'TRIPSIT' ? [finishedButton] : undefined,
        ephemeral: false,
        // flags: ['SuppressEmbeds'],
      });

      // Determine if this command was initialized by a Developer
      tripsitGuild.roles.fetch();
      const roleDeveloper = await tripsitGuild.roles.fetch(env.ROLE_DEVELOPER) as Role;
      const isDev = roleDeveloper.members.map(m => m.user.id === i.user.id);
      const pingRole = await tripsitGuild.roles.fetch(modmailVars[issueType].pingRole) as Role;
      const tripsitterRole = await tripsitGuild.roles.fetch(env.ROLE_TRIPSITTER) as Role;

      // Send a message to the thread
      let threadFirstResponse = stripIndents`
        Hey ${isDev ? pingRole.toString() : pingRole}! ${actor.tag} has submitted a new ticket:

        ${modmailVars[issueType].labelA}
        > ${modalInputA}
        ${modalInputB !== '' ? `${modmailVars[issueType].labelB}
        > ${modalInputB}
        ` : ''}

        **You can respond to them in this thread!**
      `;
      if (issueType === 'TRIPSIT') {
        threadFirstResponse = stripIndents`
          Hey ${isDev ? pingRole.toString() : pingRole} and ${isDev ? tripsitterRole.toString() : tripsitterRole}! ${actor.tag} has submitted a new ticket:

          ${modmailVars[issueType].labelA}
          > ${modalInputA}
          ${modalInputB !== '' ? `${modmailVars[issueType].labelB}
          > ${modalInputB}
          ` : ''}

          If this is a medical emergency they need to initiate EMS: we do not call EMS on behalf of anyone.
          When they're feeling better you can use the "I'm Good" button to let the team know they're okay.
          If they they would like someone to talk to, check out the warmline directory: https://warmline.org/warmdir.html#directory

          **You can respond to them in this thread!**
        `;
      }

      // Create the buttons
      const modmailButtons = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(modMailOwn)
            .setLabel('Own')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(modMailPause)
            .setLabel('Pause')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(modMailBlock)
            .setLabel('Block')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(modMailClose)
            .setLabel('Close')
            .setStyle(ButtonStyle.Secondary),
        );

      const firstResponseMessage = await ticketThread.send({
        content: threadFirstResponse,
        components: [modmailButtons],
        flags: ['SuppressEmbeds'],
      });
        // log.debug(F, `Sent intro message to thread ${ticketThread.id}`);

      // Determine when the thread should be archived
      const threadArchiveTime = new Date();
      const archiveTime = env.NODE_ENV === 'production'
        ? threadArchiveTime.getTime() + 1000 * 60 * 60 * 24
        : threadArchiveTime.getTime() + 1000 * 60 * 10;
      threadArchiveTime.setTime(archiveTime);
      // log.debug(F, `threadArchiveTime: ${threadArchiveTime}`);

      // Set ticket information
      const modalBStr = `${modmailVars[issueType].labelB}
      > ${modalInputB}
      `;

      const newTicketData = {
        user_id: userData.id,
        description: `${modmailVars[issueType].labelA}
        > ${modalInputA}
    
        ${modalInputB !== '' ? modalBStr : ''}`,
        thread_id: ticketThread.id,
        type: issueType,
        status: 'OPEN',
        first_message_id: firstResponseMessage.id,
        archived_at: threadArchiveTime,
        deleted_at: new Date(threadArchiveTime.getTime() + 1000 * 60 * 60 * 24 * 7),
      } as UserTickets;

      // log.debug(F, `newTicketData: ${JSON.stringify(newTicketData)}`);

      // Insert that ticket in the DB
      await ticketUpdate(newTicketData);

      // Save the user's roles in the db
      let actorRoles = [] as string[];
      if (member.id) {
        actorRoles = member.roles.cache.map(role => role.name);
      }

      userData.roles = actorRoles.toString();
      await usersUpdate(userData);
    });
}

/**
 * What happens when someone DM's the bot
 * @param {Message} message The message sent to the bot
 */
export async function modmailDMInteraction(message:Message) {
  // Don't run if the user mentions @everyone or @here.
  if (message.content.includes('@everyone') || message.content.includes('@here')) {
    await message.author.send('You\'re not allowed to use those mentions.');
    return;
  }

  const userData = await getUser(message.author.id, null, null);
  // log.debug(F, `userData: ${JSON.stringify(userData, null, 2)}!`);

  if (userData && userData.ticket_ban) {
    // log.debug(F, `User ${message.author.tag} is banned from creating tickets.`);
    return;
  }

  const ticketData = await getOpenTicket(userData.id, null);
  // log.debug(F, `ticketData (DM): ${JSON.stringify(ticketData, null, 2)}!`);

  if (ticketData) {
    if (ticketData.status === 'BLOCKED') {
      await message.author.send('*beeps sadly*');
      return;
    }

    if (ticketData.status === 'PAUSED') {
      await message.author.send('Hey there! This ticket is currently on hold, please wait for a moderator to respond before sending another message.');
      return;
    }

    // Send a message to the thread
    const channel = await message.client.channels.fetch(env.CHANNEL_HELPDESK) as TextChannel;
    let thread = {} as ThreadChannel;
    try {
      thread = await channel.threads.fetch(ticketData.thread_id) as ThreadChannel;
    } catch (error) {
      // log.debug(F, `Error fetching thread, it was likely deleted: ${error}`);
      // This just means the thread is deleted
    }
    // log.debug(F, `thread: ${JSON.stringify(thread, null, 2)}!`);
    if (thread.id && ticketData.status !== 'CLOSED') {
      const embed = embedTemplate();
      embed.setDescription(message.content);
      embed.setAuthor({
        name: message.author.username,
        iconURL: message.author.displayAvatarURL(),
      });
      embed.setFooter(null);
      await thread.send({ embeds: [embed] });
      // Reset the archived_at time
      // Determine when the thread should be archived
      const threadArchiveTime = new Date();
      const archiveTime = env.NODE_ENV === 'production'
        ? threadArchiveTime.getTime() + 1000 * 60 * 60 * 24
        : threadArchiveTime.getTime() + 1000 * 60 * 10;
      threadArchiveTime.setTime(archiveTime);

      ticketData.archived_at = threadArchiveTime;
      ticketData.deleted_at = new Date(threadArchiveTime.getTime() + 1000 * 60 * 60 * 24 * 7);

      // Update the ticket in the DB
      await ticketUpdate(ticketData);

      return;
    }
    // If the thread is deleted, delete the ticket from the db
    // log.debug(F, `Deleting ticket ${ticketData.id} in the DB!`);
    ticketData.status = 'DELETED' as TicketStatus;
    await ticketUpdate(ticketData);
  }

  modmailInitialResponse(message);
}

/**
 * What happens when someone sends a message in a modmail thread
 * @param {Message} message The message sent to the bot
 */
export async function modmailThreadInteraction(message:Message) {
  if (message.member) {
    const threadMessage = message.channel.type === ChannelType.PublicThread
    || message.channel.type === ChannelType.PrivateThread;
    // log.debug(F, `threadMessage: ${threadMessage}!`);
    if (threadMessage
      && (message.channel.parentId === env.CHANNEL_HELPDESK
      || message.channel.parentId === env.CHANNEL_MODERATORS
      || message.channel.parentId === env.CHANNEL_TRIPSIT)) {
      // log.debug(F, `message.channel.parentId: ${message.channel.parentId}!`);
      // log.debug(F, `message sent in a thread in a helpdesk channel!`);
      // Get the ticket info
      const ticketData = await getOpenTicket(null, message.channel.id);
      if (ticketData) {
        // log.debug(F, `ticketData (Thread): ${JSON.stringify(ticketData, null, 2)}!`);

        if (ticketData.status === 'BLOCKED') {
          await message.channel.send(`Hey ${message.author.username}, this user is currently blocked. Please '/modmail block off', or click the button at the top, before conversation can resume.`);
          return;
        }
        if (ticketData.status === 'PAUSED') {
          await message.channel.send(`Hey ${message.author.username}, this ticket is currently paused. Please '/modmail pause off', or click the button at the top, before conversation can resume.`);
          return;
        }
        if (ticketData.status === 'CLOSED') {
          await message.channel.send(`Hey ${message.author.username}, this ticket is currently paused. Please '/modmail close off', or click the button at the top, before conversation can resume.`);
          return;
        }
        if (ticketData.status === 'RESOLVED') {
          await message.channel.send(`Hey ${message.author.username}, this ticket is currently resolved, the user will need to submit a new issue before conversation can resume.`);
          return;
        }

        const userData = await getUser(null, null, ticketData.user_id);
        if (!userData.discord_id) {
          log.error(F, `No discord_id found for user ${ticketData.user_id}!`);
          return;
        }

        // Get the user from the ticketData
        const user = await message.client.users.fetch(userData.discord_id);
        // log.debug(F, `user: ${JSON.stringify(user, null, 2)}!`);

        // Send the message to the user
        const embed = embedTemplate();
        embed.setDescription(message.content);
        embed.setAuthor({
          name: message.member.displayName,
          iconURL: message.member.displayAvatarURL(),
        });
        embed.setFooter(null);
        try {
          await user.send({ embeds: [embed] });
        } catch (error) {
          log.error(F, `Error sending message to user: ${error}`);
          log.error(F, `User: ${JSON.stringify(user, null, 2)}`);
        }
        // log.debug(F, `message sent to user!`);

        // Reset the archived_at time
        // Determine when the thread should be archived
        const threadArchiveTime = new Date();
        const archiveTime = env.NODE_ENV === 'production'
          ? threadArchiveTime.getTime() + 1000 * 60 * 60 * 24
          : threadArchiveTime.getTime() + 1000 * 60 * 10;
        threadArchiveTime.setTime(archiveTime);
        // log.debug(F, `threadArchiveTime reset: ${threadArchiveTime}`);

        // Update the ticket in the DB

        ticketData.archived_at = threadArchiveTime;
        ticketData.deleted_at = new Date(threadArchiveTime.getTime() + 1000 * 60 * 60 * 24 * 7);
        await ticketUpdate(ticketData);
      }
    }
  }
}
