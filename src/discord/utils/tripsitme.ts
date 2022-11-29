/* eslint-disable max-len */
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  ButtonBuilder,
  ModalSubmitInteraction,
  TextChannel,
  Colors,
  GuildMember,
  Role,
  ThreadChannel,
  ButtonInteraction,
  Message,
  MessageReaction,
  User,
  // ChatInputCommandInteraction,
  PermissionsBitField,
  // TextChannel,
  // MessageFlags,
  MessageMentionTypes,
} from 'discord.js';
import {
  TextInputStyle,
  ChannelType,
  ButtonStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { parse } from 'path';
import {
  db,
  getGuild,
  getOpenTicket,
  getUser,
} from '../../global/utils/knex';
import {
  Users,
  UserTickets,
  TicketStatus,
} from '../../global/@types/pgdb.d';
import { startLog } from './startLog';
import env from '../../global/utils/env.config';
import log from '../../global/utils/log';
import { embedTemplate } from './embedTemplate';

const PREFIX = parse(__filename).name;

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

/**
 * Applies the NeedHelp role on a user and removes their other roles
 * @param {GuildMember} interaction
 * @param {GuildMember} target
 * */
export async function needsHelpmode(
  interaction: ModalSubmitInteraction | ButtonInteraction,
  target: GuildMember,
) {
  if (!interaction.guild) {
    // log.debug(`[${PREFIX}] no guild!`);
    interaction.reply('This must be performed in a guild!');
    return;
  }
  if (!interaction.member) {
    // log.debug(`[${PREFIX}] no member!`);
    interaction.reply('This must be performed by a member of a guild!');
    return;
  }

  const guildData = await getGuild(interaction.guild.id);

  let roleNeedshelp = {} as Role;
  if (guildData.role_needshelp) {
    roleNeedshelp = await interaction.guild.roles.fetch(guildData.role_needshelp) as Role;
  }

  // Check if the target already has the needshelp role
  // const targetHasRoleNeedshelp = target.roles.cache.find(
  //   (role) => role === roleNeedshelp,
  // ) !== undefined;
  // log.debug(`[${PREFIX}] targetHasRoleNeedshelp: ${targetHasRoleNeedshelp}`);

  // Save the user's roles to the DB
  const targetRoleIds = target.roles.cache.map(role => role.id);
  // log.debug(`[${PREFIX}] targetRoleIds: ${targetRoleIds}`);
  await db<Users>('users')
    .insert({
      discord_id: target.id,
      roles: targetRoleIds.toString(),
    })
    .onConflict('discord_id')
    .merge();

  const myMember = await interaction.guild.members.fetch(interaction.client.user.id);
  const myRole = myMember.roles.highest;
  // Remove all roles, except team and vanity, from the target
  target.roles.cache.forEach(async role => {
    // log.debug(`[${PREFIX}] role: ${role.name} - ${role.id}`);
    if (!ignoredRoles.includes(role.id) && !role.name.includes('@everyone') && role.id !== roleNeedshelp.id) {
      if (role.comparePositionTo(myRole) < 0) {
        // log.debug(`[${PREFIX}] Removing role ${role.name} from ${target.displayName}`);
        try {
          await target.roles.remove(role);
        } catch (err) {
          // log.debug(`[${PREFIX}] There was an error removing the role ${role.name} from ${target.displayName}`);
        }
      }
    }
  });

  // Add the needsHelp role to the target
  try {
    // log.debug(`[${PREFIX}] Adding role ${roleNeedshelp.name} to ${target.displayName}`);
    await target.roles.add(roleNeedshelp);
  } catch (err) {
    log.error(`[${PREFIX}] Error adding role to target: ${err}`);
    interaction.reply(stripIndents`There was an error adding the NeedsHelp role!
      Make sure the bot's role is higher than NeedsHelp in the Role list!`);
  }
}

/**
 * Handles the Own button
 * @param {ButtonInteraction} interaction
 * */
export async function tripsitmeOwned(
  interaction:ButtonInteraction,
) {
  if (!interaction.guild) {
    // log.debug(`[${PREFIX}] no guild!`);
    interaction.reply('This must be performed in a guild!');
    return;
  }
  // log.debug(`[${PREFIX}] tripsitmeOwned`);
  const userId = interaction.customId.split('~')[1];
  const actor = interaction.member as GuildMember;

  const target = await interaction.guild.members.fetch(userId) as GuildMember;

  const userData = await getUser(userId, null);
  const ticketData = await getOpenTicket(userData.id, null);

  // log.debug(`[${PREFIX}] ticketData: ${JSON.stringify(ticketData, null, 2)}`);

  if (!ticketData) {
    const rejectMessage = `Hey ${interaction.member}, ${target.displayName} not have an open session!`;
    const embed = embedTemplate().setColor(Colors.DarkBlue);
    embed.setDescription(rejectMessage);
    // log.debug(`[${PREFIX}] target ${target} does not need help!`);
    interaction.editReply({ embeds: [embed] });
    return;
  }

  const metaChannelId = ticketData?.meta_thread_id ?? env.CHANNEL_TRIPSITMETA;
  const metaChannel = await interaction.guild.channels.fetch(metaChannelId) as TextChannel;
  metaChannel.send({
    content: stripIndents`${actor.displayName} has indicated that ${target.toString()} is receiving help!`,
  });
  if (metaChannelId !== env.CHANNEL_TRIPSITMETA) {
    metaChannel.setName(`💛│${target.displayName}'s discussion!`);
  }

  // Update the ticket's name
  const channel = await interaction.guild.channels.fetch(ticketData.thread_id) as TextChannel;
  channel.setName(`💛│${target.displayName}'s channel!`);

  // Update the ticket's status in the DB
  ticketData.status = 'OWNED' as TicketStatus;
  await db<UserTickets>('user_tickets')
    .update(ticketData)
    .where('id', ticketData.id);

  // Reply to the user
  interaction.reply({ content: 'Thanks!', ephemeral: true });
}

/**
 * Handles the Meta Thread button
 * @param {ButtonInteraction} interaction
 * */
export async function tripsitmeMeta(
  interaction:ButtonInteraction,
) {
  if (!interaction.guild) {
    // log.debug(`[${PREFIX}] no guild!`);
    interaction.reply('This must be performed in a guild!');
    return;
  }
  // log.debug(`[${PREFIX}] tripsitmeMeta`);
  const userId = interaction.customId.split('~')[1];
  const actor = interaction.member as GuildMember;
  const target = await interaction.guild.members.fetch(userId) as GuildMember;

  if (!interaction.guild) {
    // log.debug(`[${PREFIX}] no guild!`);
    interaction.reply('This must be performed in a guild!');
    return;
  }
  if (!interaction.channel) {
    // log.debug(`[${PREFIX}] no channel!`);
    interaction.reply('This must be performed in a channel!');
    return;
  }
  if (!interaction.member) {
    // log.debug(`[${PREFIX}] no member!`);
    interaction.reply('This must be performed by a member!');
    return;
  }

  const userData = await getUser(userId, null);
  const ticketData = await getOpenTicket(userData.id, null);

  if (!ticketData) {
    const rejectMessage = `Hey ${interaction.member}, ${target.displayName} not have an open session!`;
    const embed = embedTemplate().setColor(Colors.DarkBlue);
    embed.setDescription(rejectMessage);
    // log.debug(`[${PREFIX}] target ${target} does not need help!`);
    interaction.editReply({ embeds: [embed] });
    return;
  }

  const channel = interaction.channel as TextChannel;
  const metaChannel = await channel.threads.create(
    {
      name: `💛│${target.displayName}'s discussion!`,
      autoArchiveDuration: 1440,
      type: interaction.guild.premiumTier > 2 ? ChannelType.PrivateThread : ChannelType.PublicThread,
      reason: `${actor.displayName} created meta thread for ${target.displayName}`,
    },
  );

  ticketData.meta_thread_id = metaChannel.id;

  await db<UserTickets>('user_tickets')
    .insert(ticketData)
    .onConflict('id')
    .merge();

  // Send an embed to the meta room
  const embedTripsitter = embedTemplate()
    .setColor(Colors.DarkBlue)
    .setDescription(stripIndents`
      ${actor.toString()} has created a meta thread for ${target.toString()}!

      ${ticketData.description}

      **Read the log before interacting**
      Use this channel coordinate efforts.

      **No one is qualified to handle suicidal users here**
      If the user is considering / talking about suicide, direct them to the suicide hotline!

      **Do not engage in DM**
      Keep things in the open where you have the team's support!
      `)
    .setFooter({ text: 'If you need help click the Backup button to summon Helpers and Tripsitters' });

  const endSession = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`tripsitmeOwned~${target.id}`)
        .setLabel('Owned')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`tripsitmeClose~${target.id}`)
        .setLabel('They\'re good now!')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`tripsitmeBackup~${target.id}`)
        .setLabel('I need backup')
        .setStyle(ButtonStyle.Danger),
    );

  await metaChannel.send({
    embeds: [embedTripsitter],
    components: [endSession],
    allowedMentions: {},
  });

  interaction.reply({ content: 'Donezo!', ephemeral: true });
}

/**
 * Handles the Backup button
 * @param {ButtonInteraction} interaction
 * */
export async function tripsitmeBackup(
  interaction:ButtonInteraction,
) {
  // log.debug(`[${PREFIX}] tripsitmeBackup`);
  if (!interaction.guild) {
    // log.debug(`[${PREFIX}] no guild!`);
    interaction.reply('This must be performed in a guild!');
    return;
  }
  if (!interaction.channel) {
    // log.debug(`[${PREFIX}] no channel!`);
    interaction.reply('This must be performed in a channel!');
    return;
  }
  const userId = interaction.customId.split('~')[1];
  const actor = interaction.member as GuildMember;
  const target = await interaction.guild.members.fetch(userId) as GuildMember;

  const userData = await getUser(userId, null);
  const ticketData = await getOpenTicket(userData.id, null);

  if (!ticketData) {
    const rejectMessage = `Hey ${interaction.member}, ${target.displayName} not have an open session!`;
    const embed = embedTemplate().setColor(Colors.DarkBlue);
    embed.setDescription(rejectMessage);
    // log.debug(`[${PREFIX}] target ${target} does not need help!`);
    interaction.editReply({ embeds: [embed] });
    return;
  }

  const guildData = await getGuild(interaction.guild.id);

  let backupMessage = 'Hey ';
  // Get the roles we'll be referencing
  let roleTripsitter = {} as Role;
  let roleHelper = {} as Role;
  if (guildData.role_tripsitter) {
    roleTripsitter = await interaction.guild.roles.fetch(guildData.role_tripsitter) as Role;
    backupMessage += `<@&${roleTripsitter.id}> `;
  }
  if (guildData.role_helper) {
    roleHelper = await interaction.guild.roles.fetch(guildData.role_helper) as Role;
    backupMessage += `and/or <@&${roleHelper.id}> `;
  }

  backupMessage += stripIndents`team, ${actor} has inidicated they could use some backup!
    
  Be sure to read the log so you have the context!`;

  if (ticketData.meta_thread_id) {
    const metaThread = await interaction.guild.channels.fetch(ticketData.meta_thread_id) as ThreadChannel;
    await metaThread.send(backupMessage);
  } else {
    await interaction.channel.send(backupMessage);
  }

  interaction.reply({ content: 'Backup message sent!', ephemeral: true });
}

/**
 * Handles removing of the NeedsHelp mode
 * @param {ButtonInteraction} interaction
 */
export async function tripsitmeClose(
  interaction:ButtonInteraction,
) {
  startLog(PREFIX, interaction);
  await interaction.deferReply({ ephemeral: true });
  if (!interaction.guild) {
    // log.debug(`[${PREFIX}] no guild!`);
    interaction.editReply('This must be performed in a guild!');
    return;
  }
  if (!interaction.member) {
    // log.debug(`[${PREFIX}] no member!`);
    interaction.editReply('This must be performed by a member of a guild!');
    return;
  }

  const targetId = interaction.customId.split('~')[1];

  // const guildData = await getGuild(interaction.guild.id);

  // let roleNeedshelp = {} as Role;
  // let channelTripsitmeta = {} as TextChannel;
  // if (guildData.role_needshelp) {
  //   roleNeedshelp = await interaction.guild.roles.fetch(guildData.role_needshelp) as Role;
  // }
  // if (guildData.channel_tripsitmeta) {
  //   channelTripsitmeta = await interaction.guild.channels.fetch(guildData.channel_tripsitmeta) as TextChannel;
  // }

  const target = await interaction.guild.members.fetch(targetId);
  const actor = interaction.member as GuildMember;

  if (targetId === actor.id) {
    // log.debug(`[${PREFIX}] not the target!`);
    interaction.editReply({ content: 'You should not be able to see this button!' });
    return;
  }

  const userData = await getUser(target.id, null);
  const ticketData = await getOpenTicket(userData.id, null);

  // log.debug(`[${PREFIX}] ticketData: ${JSON.stringify(ticketData, null, 2)}`);

  if (!ticketData) {
    const rejectMessage = `Hey ${interaction.member}, ${target.displayName} not have an open session!`;
    const embed = embedTemplate().setColor(Colors.DarkBlue);
    embed.setDescription(rejectMessage);
    // log.debug(`[${PREFIX}] target ${target} does not need help!`);
    interaction.editReply({ embeds: [embed] });
    return;
  }

  // Get the channel objects for the help thread
  let threadHelpUser = {} as ThreadChannel;
  try {
    threadHelpUser = await interaction.guild.channels.fetch(ticketData.thread_id) as ThreadChannel;
    threadHelpUser.setName(`💙│${target.displayName}'s channel!`);
  } catch (err) {
    // log.debug(`[${PREFIX}] There was an error updating the help thread, it was likely deleted:\n ${err}`);
    // Update the ticket status to closed
    ticketData.status = 'DELETED' as TicketStatus;
    await db<UserTickets>('user_tickets')
      .insert(ticketData)
      .onConflict('id')
      .merge();
  // log.debug(`[${PREFIX}] Updated ticket status to DELETED`);
  }

  const closeMessage = stripIndents`Hey ${target}, it looks like you're doing somewhat better!
    This thread will remain here for a day if you want to follow up tomorrow.
    After 7 days, or on request, it will be deleted to preserve your privacy =)
    If you'd like to go back to social mode, just click the button below!
    `;

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`tripsitmeResolve~${target.id}`)
        .setLabel('I\'m good now!')
        .setStyle(ButtonStyle.Success),
    );

  await threadHelpUser.send({
    content: closeMessage,
    components: [row],
  });

  const metaChannelId = ticketData?.meta_thread_id ?? env.CHANNEL_TRIPSITMETA;
  const metaChannel = await interaction.guild.channels.fetch(metaChannelId) as TextChannel;
  metaChannel.send({
    content: stripIndents`${actor.displayName} has indicated that ${target.toString()} no longer needs help!`,
  });
  if (metaChannelId !== env.CHANNEL_TRIPSITMETA) {
    metaChannel.setName(`💙│${target.displayName}'s discussion!`);
  }

  // Update the ticket status to closed
  ticketData.status = 'CLOSED' as TicketStatus;
  await db<UserTickets>('user_tickets')
    .insert(ticketData)
    .onConflict('id')
    .merge();

  // log.debug(`[${PREFIX}] ${target.user.tag} (${target.user.id}) is no longer being helped!`);
  await interaction.editReply({ content: 'Done!' });
}

/**
 * Handles removing of the NeedsHelp mode
 * @param {ButtonInteraction} interaction
 */
export async function tripsitmeResolve(
  interaction:ButtonInteraction,
) {
  startLog(PREFIX, interaction);
  await interaction.deferReply({ ephemeral: true });
  if (!interaction.guild) {
    // log.debug(`[${PREFIX}] no guild!`);
    interaction.editReply('This must be performed in a guild!');
    return;
  }
  if (!interaction.member) {
    // log.debug(`[${PREFIX}] no member!`);
    interaction.editReply('This must be performed by a member of a guild!');
    return;
  }

  const targetId = interaction.customId.split('~')[1];

  const guildData = await getGuild(interaction.guild.id);

  let roleNeedshelp = {} as Role;
  let channelTripsitmeta = {} as TextChannel;
  if (guildData.role_needshelp) {
    roleNeedshelp = await interaction.guild.roles.fetch(guildData.role_needshelp) as Role;
  }
  if (guildData.channel_tripsitmeta) {
    channelTripsitmeta = await interaction.guild.channels.fetch(guildData.channel_tripsitmeta) as TextChannel;
  }

  const target = await interaction.guild.members.fetch(targetId);
  const actor = interaction.member as GuildMember;

  // log.debug(stripIndents`[${PREFIX}]:
  //   meOrThem: ${meOrThem}
  //   targetId: ${targetId}
  //   roleNeedshelpId: ${roleNeedshelp.id}
  //   channelTripsittersId: ${channelTripsitmeta.id}
  //   actor: ${actor.displayName}
  //   target: ${target.displayName}
  // `);

  if (targetId !== actor.id) {
    // log.debug(`[${PREFIX}] not the target!`);
    interaction.editReply({ content: 'Only the user receiving help can click this button!' });
    return;
  }

  const userData = await getUser(target.id, null);
  const ticketData = await getOpenTicket(userData.id, null);

  // log.debug(`[${PREFIX}] ticketData: ${JSON.stringify(ticketData, null, 2)}`);

  if (ticketData === undefined || Object.entries(ticketData).length === 0) {
    const rejectMessage = `Hey ${interaction.member}, you do not have an open session!`;
    const embed = embedTemplate().setColor(Colors.DarkBlue);
    embed.setDescription(rejectMessage);
    // log.debug(`[${PREFIX}] target ${target} does not need help!`);
    interaction.editReply({ embeds: [embed] });
    return;
  }

  if (userData.roles) {
    const myMember = await interaction.guild.members.fetch(interaction.client.user.id);
    const myRole = myMember.roles.highest;
    const targetRoles:string[] = userData.roles.split(',') || [];

    if (roleNeedshelp) {
      if (roleNeedshelp.comparePositionTo(myRole) < 0) {
        try {
          // log.debug(`[${PREFIX}] Removing ${roleNeedshelp.name} from ${target.displayName}`);
          await target.roles.remove(roleNeedshelp);
        } catch (err) {
          log.error(`[${PREFIX}] Error removing ${roleNeedshelp.name} from ${target.displayName}`);
          log.error(err);
        }
      }
    }

    // readd each role to the target
    if (targetRoles) {
      targetRoles.forEach(async roleId => {
        // log.debug(`[${PREFIX}] Re-adding roleId: ${roleId}`);
        if (!interaction.guild) {
          log.error(`[${PREFIX}] no guild!`);
          return;
        }
        const roleObj = await interaction.guild.roles.fetch(roleId) as Role;
        if (!ignoredRoles.includes(roleObj.id)
          && roleObj.name !== '@everyone'
          && roleObj.id !== roleNeedshelp.id) {
          if (roleObj.comparePositionTo(myRole) < 0) {
            // log.debug(`[${PREFIX}] Adding role ${roleObj.name} to ${target.displayName}`);
            try {
              await target.roles.add(roleObj);
            } catch (err) {
              log.error(`[${PREFIX}] Error adding role ${roleObj.name} to ${target.displayName}`);
              log.error(err);
            }
          }
        }
      });
    }
  }

  // log.debug(`[${PREFIX}] targetLastHelpedThreadId: ${targetLastHelpedThreadId}`);

  // Get the channel objects for the help thread
  let threadHelpUser = {} as ThreadChannel;
  try {
    threadHelpUser = await interaction.guild.channels.fetch(ticketData.thread_id) as ThreadChannel;
    threadHelpUser.setName(`💚│${target.displayName}'s channel!`);
  } catch (err) {
    // log.debug(`[${PREFIX}] There was an error updating the help thread, it was likely deleted:\n ${err}`);
    // Update the ticket status to closed
    ticketData.status = 'DELETED' as TicketStatus;
    await db<UserTickets>('user_tickets')
      .insert(ticketData)
      .onConflict('id')
      .merge();
  // log.debug(`[${PREFIX}] Updated ticket status to DELETED`);
  }

  const endHelpMessage = stripIndents`Hey ${target}, we're glad you're doing better!
    We've restored your old roles back to normal <3
    This thread will remain here for a day if you want to follow up tomorrow.
    After 7 days, or on request, it will be deleted to preserve your privacy =)`;

  try {
    await threadHelpUser.send(endHelpMessage);
  } catch (err) {
    log.error(`[${PREFIX}] Error sending end help message to ${threadHelpUser}`);
    log.error(err);
  }

  let message:Message;
  await threadHelpUser.send(stripIndents`
      ${env.EMOJI_INVISIBLE}
      > **If you have a minute, your feedback is important to us!**
      > Please rate your experience with ${interaction.guild.name}'s service by reacting below.
      > Thank you!
      ${env.EMOJI_INVISIBLE}
      `)
    .then(async msg => {
      message = msg;
      await msg.react('🙁');
      await msg.react('😕');
      await msg.react('😐');
      await msg.react('🙂');
      await msg.react('😁');

      // Setup the reaction collector
      const filter = (reaction:MessageReaction, user:User) => user.id === target.id;
      const collector = message.createReactionCollector({ filter, time: 1000 * 60 * 60 * 24 });
      collector.on('collect', async (reaction: { emoji: { name: any; }; }) => {
        threadHelpUser.send(stripIndents`
          ${env.EMOJI_INVISIBLE}
          > Thank you for your feedback, here's a cookie! 🍪
          ${env.EMOJI_INVISIBLE}
          `);
        // log.debug(`[${PREFIX}] Collected ${reaction.emoji.name} from ${threadHelpUser}`);
        const finalEmbed = embedTemplate()
          .setColor(Colors.Blue)
          .setDescription(`Collected ${reaction.emoji.name} from ${threadHelpUser}`);
        try {
          await channelTripsitmeta.send({ embeds: [finalEmbed] });
        } catch (err) {
          // log.debug(`[${PREFIX}] Failed to send message, am i still in the tripsit guild?`);
        }
        msg.delete();
        collector.stop();
      });
    });

  const metaChannelId = ticketData?.meta_thread_id ?? env.CHANNEL_TRIPSITMETA;
  const metaChannel = await interaction.guild.channels.fetch(metaChannelId) as TextChannel;
  metaChannel.send({
    content: stripIndents`${actor.displayName} has indicated that they no longer need help!`,
  });
  if (metaChannelId !== env.CHANNEL_TRIPSITMETA) {
    metaChannel.setName(`💚│${target.displayName}'s discussion!`);
  }

  // Update the ticket status to resolved
  ticketData.status = 'RESOLVED' as TicketStatus;
  await db<UserTickets>('user_tickets')
    .insert(ticketData)
    .onConflict('id')
    .merge();

  // log.debug(`[${PREFIX}] ${target.user.tag} (${target.user.id}) is no longer being helped!`);
  await interaction.editReply({ content: 'Done!' });
}

/**
 * Creates the tripsit modal
 * @param {ButtonInteraction} interaction The interaction that initialized this
 * @param {GuildMember} memberInput The member being aced upon
 * @param {string} triage Given triage information
 * @param {string} intro Given intro information
 */
export async function tripSitMe(
  interaction:ModalSubmitInteraction,
  memberInput:GuildMember | null,
  triage:string,
  intro:string,
) {
  // Lookup guild information for variables
  if (!interaction.guild) {
    interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
    return;
  }
  const actor = interaction.member;
  const guildData = await getGuild(interaction.guild.id);

  // let backupMessage = 'Hey ';
  // Get the roles we'll be referencing
  let roleTripsitter = {} as Role;
  let roleHelper = {} as Role;
  let channelTripsitmeta = {} as TextChannel;
  if (guildData.role_tripsitter) {
    roleTripsitter = await interaction.guild.roles.fetch(guildData.role_tripsitter) as Role;
    // backupMessage += `<@&${roleTripsitter.id}> `;
  }
  if (guildData.role_helper) {
    roleHelper = await interaction.guild.roles.fetch(guildData.role_helper) as Role;
    // backupMessage += `<@&${roleHelper.id}> `;
  }
  if (guildData.channel_tripsitmeta) {
    channelTripsitmeta = await interaction.guild.channels.fetch(guildData.channel_tripsitmeta) as TextChannel;
  }

  if (!interaction.guild) {
    // log.debug(`[${PREFIX}] no guild!`);
    interaction.reply('This must be performed in a guild!');
    return;
  }
  if (!interaction.member) {
    // log.debug(`[${PREFIX}] no member!`);
    interaction.reply('This must be performed by a member of a guild!');
    return;
  }

  // log.debug(`[${PREFIX}] submitted with |
  //   user: ${interaction.user.tag} (${interaction.user.id})
  //   guild: ${interaction.guild.name} (${interaction.guild.id})
  //   memberInput: ${memberInput}
  //   roleTripsitterId: ${roleTripsitter.id}
  //   channelTripsittersId: ${channelTripsitmeta.id}
  //   triage: ${triage}
  //   intro: ${intro}
  // `);

  // Determine if this command was initialized by an Admin (for testing)
  const actorIsAdmin = (actor as GuildMember).permissions.has(PermissionsBitField.Flags.Administrator);
  const showMentions = actorIsAdmin ? [] : ['users', 'roles'] as MessageMentionTypes[];
  // log.debug(`[${PREFIX}] actorIsAdmin: ${actorIsAdmin}`);
  // log.debug(`[${PREFIX}] showMentions: ${showMentions}`);

  // Determine the target.
  // If the user clicked the button, the target is whoever initialized the interaction.
  // Otherwise, the target is the user mentioned in the /tripsit command.
  // log.debug(`[${PREFIX}] memberInput: ${JSON.stringify(memberInput, null, 2)}`);
  // log.debug(`[${PREFIX}] interaction.member: ${JSON.stringify(interaction.member, null, 2)}`);
  const target = (memberInput ?? interaction.member) as GuildMember;
  // log.debug(`[${PREFIX}] target: ${target}`);

  await needsHelpmode(interaction, target as GuildMember);

  // Get the tripsit channel from the guild
  const tripsitChannel = interaction.channel as TextChannel;

  // Create a new private thread in the channel
  // If we're not in production we need to create a public thread
  const threadHelpUser = await tripsitChannel.threads.create({
    name: `🧡│${target.displayName}'s channel!`,
    autoArchiveDuration: 1440,
    type: interaction.guild.premiumTier > 2 ? ChannelType.PrivateThread : ChannelType.PublicThread,
    reason: `${target.displayName} requested help`,
  }) as ThreadChannel;
  // log.debug(`[${PREFIX}] Created ${threadHelpUser.name} ${threadHelpUser.id}`);

  // Send reply to the actor
  const replyMessage = memberInput
    ? stripIndents`
        Hey ${interaction.member}, we've activated tripsit mode on ${target.user.username}!

        Check your channel list for ${threadHelpUser.toString()} to talk to the user

        **Be sure add some information about the user to the thread!**`
    : stripIndents`
        Hey ${target}, thank you for asking for assistance!

        Click here to be taken to your private room: ${threadHelpUser.toString()}

        You can also click in your channel list to see your private room!`;
  const embed = embedTemplate()
    .setColor(Colors.DarkBlue)
    .setDescription(replyMessage);
  interaction.reply({ embeds: [embed], ephemeral: true });
  // log.debug(`[${PREFIX}] Sent response to ${target.user.tag}`);

  // Send the intro message to the thread
  const firstMessage = memberInput
    ? stripIndents`
      Hey ${target}, the team thinks you could use assistance!
      Someone from the ${roleTripsitter} ${guildData.role_helper ? `and/or ${roleHelper}` : ''} team will be with you as soon as they're available!
      If this is a medical emergency please contact your local /EMS: we do not call EMS on behalf of anyone.`
    : stripIndents`
      Hey ${target}, thank you for asking for assistance!

      You've taken: ${triage ? `\n${triage}` : '\n*No info given*'}

      Your issue: ${intro ? `\n${intro}` : '\n*No info given*'}

      Someone from the ${roleTripsitter} ${guildData.role_helper ? `and/or ${roleHelper}` : ''} team will be with you as soon as they're available!
      If this is a medical emergency please contact your local /EMS: we do not call EMS on behalf of anyone.
      When you're feeling better you can use the "I'm Good" button to let the team know you're okay.
      If you just would like someone to talk to, check out the warmline directory: https://warmline.org/warmdir.html#directory
      `;
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`tripsitmeResolve~${target.id}`)
        .setLabel('I\'m good now!')
        .setStyle(ButtonStyle.Success),
    );
  await threadHelpUser.send({
    content: firstMessage,
    components: [row],
    allowedMentions: {
      parse: showMentions,
    },
    flags: ['SuppressEmbeds'],
  });

  // log.debug(`[${PREFIX}] Sent intro message to ${threadHelpUser.name} ${threadHelpUser.id}`);

  // Send an embed to the tripsitter room
  const embedTripsitter = embedTemplate()
    .setColor(Colors.DarkBlue)
    .setDescription(stripIndents`
      ${target} has requested assistance!
      **They've taken:** 
      ${triage ? `${triage}` : '*No info given*'}
      **Their issue: **
      ${intro ? `${intro}` : '*No info given*'}

      **Read the log before interacting**
      Use this channel coordinate efforts.

      **No one is qualified to handle suicidal users here**
      If the user is considering / talking about suicide, direct them to the suicide hotline!

      **Do not engage in DM**
      Keep things in the open where you have the team's support!
      `)
    .setFooter({ text: 'If you need help click the Backup button to summon Helpers and Tripsitters' });

  const endSession = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`tripsitmeOwned~${target.id}`)
        .setLabel('Owned')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`tripsitmeClose~${target.id}`)
        .setLabel('They\'re good now!')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`tripsitmeMeta~${target.id}`)
        .setLabel('Create thread')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`tripsitmeBackup~${target.id}`)
        .setLabel('I need backup')
        .setStyle(ButtonStyle.Danger),
    );

  await channelTripsitmeta.send({
    embeds: [embedTripsitter],
    components: [endSession],
    allowedMentions: {},
  });
  // log.debug(`[${PREFIX}] Sent message to ${channelTripsitmeta.name} (${channelTripsitmeta.id})`);

  const threadArchiveTime = new Date();
  // define one week in milliseconds
  // const thirtySec = 1000 * 30;
  const tenMins = 1000 * 60 * 10;
  const oneDay = 1000 * 60 * 60 * 24;
  const archiveTime = env.NODE_ENV === 'production'
    ? threadArchiveTime.getTime() + oneDay
    : threadArchiveTime.getTime() + tenMins;
  threadArchiveTime.setTime(archiveTime);
  // log.debug(`[${PREFIX}] threadArchiveTime: ${threadArchiveTime}`);

  const userData = await getUser(target.id, null);

  // Set ticket information
  const newTicketData = {
    user_id: userData.id,
    description: `
    They've taken: ${triage ? `\n${triage}` : '\n*No info given*'}

    Their issue: ${intro ? `\n${intro}` : '\n*No info given*'}`,
    thread_id: threadHelpUser.id,
    type: 'TRIPSIT',
    status: 'OPEN',
    first_message_id: '',
    archived_at: threadArchiveTime,
    deleted_at: new Date(threadArchiveTime.getTime() + 1000 * 60 * 60 * 24 * 7),
  } as UserTickets;

  // log.debug(`[${PREFIX}] newTicketData: ${JSON.stringify(newTicketData, null, 2)}`);

  // Update thet ticket in the DB
  await db<UserTickets>('user_tickets')
    .insert(newTicketData);
}

/**
 * Handles the tripsit button
 * @param {ButtonInteraction} interaction
 */
export async function tripsitmeButton(
  interaction:ButtonInteraction,
) {
  startLog(PREFIX, interaction);
  if (!interaction.guild) {
    // log.debug(`[${PREFIX}] no guild!`);
    interaction.reply('This must be performed in a guild!');
    return;
  }
  if (!interaction.member) {
    // log.debug(`[${PREFIX}] no member!`);
    interaction.reply('This must be performed by a member of a guild!');
    return;
  }
  const target = interaction.member as GuildMember;

  // log.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);

  const actorIsAdmin = (target as GuildMember).permissions.has(PermissionsBitField.Flags.Administrator);
  const showMentions = actorIsAdmin ? [] : ['users', 'roles'] as MessageMentionTypes[];

  // const guildData = await getGuild(interaction.guild.id) as DiscordGuilds;

  // Get the roles we'll be referencing
  // let roleTripsitter = {} as Role;
  // let roleHelper = {} as Role;
  // if (guildData.role_tripsitter) {
  //   roleTripsitter = await interaction.guild.roles.fetch(guildData.role_tripsitter) as Role;
  // }
  // if (guildData.role_helper) {
  //   roleHelper = await interaction.guild.roles.fetch(guildData.role_helper) as Role;
  // }

  // Team check - Cannot be run on team members
  // If this user is a developer then this is a test run and ignore this check,
  // but we'll change the output down below to make it clear this is a test.
  let targetIsTeamMember = false;
  if (!actorIsAdmin) {
    target.roles.cache.forEach(async role => {
      if (teamRoles.includes(role.id)) {
        targetIsTeamMember = true;
      }
    });
    if (targetIsTeamMember) {
      // log.debug(`[${PREFIX}] Target is a team member!`);
      const teamMessage = stripIndents`You are a member of the team and cannot be publicly helped!`;
      const embed = embedTemplate()
        .setColor(Colors.DarkBlue)
        .setDescription(teamMessage);
      if (!interaction.replied) {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
      return;
    }
  }

  const userData = await getUser(target.id, null);

  const ticketData = await getOpenTicket(userData.id, null);

  // log.debug(`[${PREFIX}] Target ticket data: ${JSON.stringify(ticketData, null, 2)}`);

  if (ticketData !== undefined) {
    // log.debug(`[${PREFIX}] Target has open ticket: ${JSON.stringify(ticketData, null, 2)}`);

    let threadHelpUser = {} as ThreadChannel;
    try {
      threadHelpUser = await interaction.guild.channels.fetch(ticketData.thread_id) as ThreadChannel;
    } catch (err) {
    // log.debug(`[${PREFIX}] There was an error updating the help thread, it was likely deleted`);
      // Update the ticket status to closed
      ticketData.status = 'DELETED' as TicketStatus;
      await db<UserTickets>('user_tickets')
        .insert(ticketData)
        .onConflict('id')
        .merge();
    // log.debug(`[${PREFIX}] Updated ticket status to DELETED`);
    // log.debug(`[${PREFIX}] Ticket: ${JSON.stringify(ticketData, null, 2)}`);
    }

    if (threadHelpUser.id) {
      await needsHelpmode(interaction, target);
      const guildData = await getGuild(interaction.guild.id);

      let roleTripsitter = {} as Role;
      let roleHelper = {} as Role;
      if (guildData.role_tripsitter) {
        roleTripsitter = await interaction.guild.roles.fetch(guildData.role_tripsitter) as Role;
      }
      if (guildData.role_helper) {
        roleHelper = await interaction.guild.roles.fetch(guildData.role_helper) as Role;
      }

      // Remind the user that they have a channel open
      // const recipient = '' as string;

      const embed = embedTemplate()
        .setColor(Colors.DarkBlue)
        .setDescription(stripIndents`Hey ${interaction.member}, you have an open session!
  
        Check your channel list or click '${threadHelpUser.toString()} to get help!`);
      interaction.reply({ embeds: [embed], ephemeral: true });
      // log.debug(`[${PREFIX}] Rejected need for help`);

      // Check if the created_by is in the last 5 minutes
      const createdDate = new Date(ticketData.reopened_at ?? ticketData.created_at);
      const now = new Date();
      const diff = now.getTime() - createdDate.getTime();
      const minutes = Math.floor(diff / 1000 / 60);

      // Send the update message to the thread
      let helpMessage = stripIndents`Hey ${target}, thanks for asking for help, we can continue talking here! What's up?`;
      if (minutes > 5) {
        // log.debug(`[${PREFIX}] Target has open ticket, and it was created over 5 minutes ago!`);
        helpMessage += `\n\nSomeone from the ${roleTripsitter} ${guildData.role_helper ? `and/or ${roleHelper}` : ''} team will be with you as soon as they're available!`;
      }
      threadHelpUser.send({
        content: helpMessage,
        allowedMentions: {
          parse: showMentions,
        },
      });
      // log.debug(`[${PREFIX}] Pinged user in help thread`);

      if (ticketData.meta_thread_id) {
        let metaMessage = '';
        if (minutes > 5) {
          metaMessage = `Hey ${roleTripsitter} ${guildData.role_helper ?? `and/or ${roleHelper}`} team, ${target.toString()} has indicated they need assistance!`;
        } else {
          metaMessage = `${target.toString()} has indicated they need assistance!`;
        }
        const metaThread = await interaction.guild.channels.fetch(ticketData.meta_thread_id) as ThreadChannel;
        metaThread.setName(`💛│${target.displayName}'s discussion!`);
        metaThread.send({
          content: metaMessage,
          allowedMentions: {
            parse: showMentions,
          },
        });
        // log.debug(`[${PREFIX}] Pinged team in meta thread!`);
      }
      return;
    }
  }

  const modal = new ModalBuilder()
    .setCustomId(`tripsitmeSubmit~${interaction.id}`)
    .setTitle('Tripsitter Help Request');
  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
    .setCustomId('triageInput')
    .setLabel('What substance? How much taken? How long ago?')
    .setStyle(TextInputStyle.Short)));
  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
    .setCustomId('introInput')
    .setLabel('What\'s going on? Give us the details!')
    .setStyle(TextInputStyle.Paragraph)));
  await interaction.showModal(modal);

  const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('tripsitmeSubmit');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;
      const triage = i.fields.getTextInputValue('triageInput');
      const intro = i.fields.getTextInputValue('introInput');

      tripSitMe(i, target, triage, intro);
    });
}
