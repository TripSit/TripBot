/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
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
  GuildMemberRoleManager,
  Message,
  MessageReaction,
  User,
  // ChatInputCommandInteraction,
  PermissionsBitField,
  // TextChannel,
  // MessageFlags,
  MessageMentionTypes,
  CommandInteraction,
  ChatInputCommandInteraction,
} from 'discord.js';
import {
  TextInputStyle,
  ChannelType,
  ButtonStyle,
} from 'discord-api-types/v10';
import {db} from '../../global/utils/knex';
import {
  Users,
  UserTickets,
  // TicketStatus,
} from '../../global/@types/pgdb.d';
import env from '../../global/utils/env.config';
import {stripIndents} from 'common-tags';
import logger from '../../global/utils/logger';
import {embedTemplate} from './embedTemplate';

import * as path from 'path';
const PREFIX = path.parse(__filename).name;

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
 * Creates the tripsit modal
 * @param {ButtonInteraction} interaction The interaction that started this
 * @param {GuildMember?} memberInput The member being aced upon
 * @param {string} triage Given triage information
 * @param {string} intro Given intro information
 */
export async function tripSitMe(
  interaction:ModalSubmitInteraction,
  memberInput:GuildMember | null,
  triage:string,
  intro:string,
) {
  const roleNeedshelpId = interaction.customId.split('~')[1];
  const roleTripsitterId = interaction.customId.split('~')[2];
  const channelTripsittersId = interaction.customId.split('~')[3];

  logger.debug(`[${PREFIX}] submitted with |
      user: ${interaction.user.tag} (${interaction.user.id}) \
      guild: ${interaction.guild?.name} (${interaction.guild?.id}) \
      memberInput: ${memberInput} \
      roleTripsitterId: ${roleTripsitterId} \
      channelTripsittersId: ${channelTripsittersId} \
      triage: ${triage} \
      intro: ${intro}`);

  if (!interaction.guild) {
    logger.debug(`[${PREFIX}] no guild!`);
    interaction.reply('This must be performed in a guild!');
    return;
  }
  if (!interaction.member) {
    logger.debug(`[${PREFIX}] no member!`);
    interaction.reply('This must be performed by a member of a guild!');
    return;
  }

  // Get the roles we'll be referencing
  const roleHelper = await interaction.guild.roles.fetch(roleTripsitterId) as Role;
  logger.debug(`[${PREFIX}] roleHelper: ${roleHelper}`);
  const roleTripsitter = interaction.guild.roles.cache.find((role) => role.id === env.ROLE_TRIPSITTER) as Role;
  logger.debug(`[${PREFIX}] roleTripsitter: ${roleTripsitter}`);

  // Determine the actor.
  const actor = interaction.member;
  logger.debug(`[${PREFIX}] actor: ${actor.user.username}#${actor.user.discriminator}`);

  // Determine if this command was started by an Admin (for testing)
  const actorIsAdmin = (actor as GuildMember).permissions.has(PermissionsBitField.Flags.Administrator);
  const showMentions = actorIsAdmin ? [] : ['users', 'roles'] as MessageMentionTypes[];
  logger.debug(`[${PREFIX}] actorIsAdmin: ${actorIsAdmin}`);
  logger.debug(`[${PREFIX}] showMentions: ${showMentions}`);

  // Determine the target.
  // If the user clicked the button, the target is whoever started the interaction.
  // Otherwise, the target is the user mentioned in the /tripsit command.
  const target = (memberInput ?? interaction.member) as GuildMember;
  // logger.debug(`[${PREFIX}] target: ${target}`);

  // Get a list of the target's roles
  // const targetRoleNames = (target.roles as GuildMemberRoleManager).cache.map((role) => role.name);
  // logger.debug(`[${PREFIX}] targetRoleNames: ${targetRoleNames}`);

  // const targetRoleIds = (target.roles as GuildMemberRoleManager).cache.map((role) => role.id);
  // logger.debug(`[${PREFIX}] targetRoleIds: ${targetRoleIds}`);

  // Get the tripsit channel from the guild
  const tripsitChannel = interaction.channel as TextChannel;

  // Create a new private thread in the channel
  // If we're not in production we need to create a public thread
  const threadHelpUser = await tripsitChannel.threads.create({
    name: `🧡│${target.displayName}'s channel!`,
    autoArchiveDuration: 1440,
    type: interaction.guild?.premiumTier > 2 ? ChannelType.GuildPrivateThread : ChannelType.GuildPublicThread,
    reason: `${target.displayName} requested help`,
  }) as ThreadChannel;
  logger.debug(`[${PREFIX}] Created threadHelpUser ${threadHelpUser.id}`);

  // Send the triage info to the thread
  const replyMessage = memberInput ?
    stripIndents`
        Hey ${interaction.member}, we've activated tripsit mode on ${target.user.username}!

        Check your channel list for ${threadHelpUser.toString()} to talk to the user

        **Be sure add some information about the user to the thread!**` :
    stripIndents`
        Hey ${target}, thank you for asking for assistance!

        Click here to be taken to your private room: ${threadHelpUser.toString()}

        You can also click in your channel list to see your private room!`;

  const embed = embedTemplate()
    .setColor(Colors.DarkBlue)
    .setDescription(replyMessage);
  interaction.reply({embeds: [embed], ephemeral: true});
  logger.debug(`[${PREFIX}] Sent response to user`);

  // Send the intro message to the threadHelpUser
  const firstMessage = memberInput ?
    stripIndents`
      Hey ${target}, the team thinks you could use assistance!
      ${roleHelper} and ${roleTripsitter} will be with you as soon as they're available!
      If this is a medical emergency please contact your local /EMS: we do not call EMS on behalf of anyone.` :
    stripIndents`
      Hey ${target}, thank you for asking for assistance!

      You've taken: ${triage ? `\n${triage}` : '\n*No info given*'}

      Your issue: ${intro ? `\n${intro}` : '\n*No info given*'}

      ${roleHelper} and ${roleTripsitter} will be with you as soon as they're available!
      If this is a medical emergency please contact your local /EMS: we do not call EMS on behalf of anyone.
      When you're feeling better you can use the "I'm Good" button to let the team know you're okay.
      If you just would like someone to talk to, check out the warmline directory: https://warmline.org/warmdir.html#directory
      `;

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`tripsitmeFinish~me~${target.id}~${roleNeedshelpId}~${channelTripsittersId}`)
        .setLabel('I\'m good now!')
        .setStyle(ButtonStyle.Success),
    );

  await threadHelpUser.send({
    content: firstMessage,
    components: [row],
    allowedMentions: {
      'parse': showMentions,
    },
    flags: ['SuppressEmbeds'],
  });

  logger.debug(`[${PREFIX}] Sent intro message to threadHelpUser ${threadHelpUser.id}`);

  // Send an embed to the tripsitter room
  const embedTripsitter = embedTemplate()
    .setColor(Colors.DarkBlue)
    .setDescription(stripIndents`
      ${target} has requested assistance!
      They've taken: ${triage ? `\n${triage}` : '\n*No info given*'}
      Their issue: ${intro ? `\n${intro}` : '\n*No info given*'}
      Please read the log before interacting and use this thread to coordinate efforts with your fellow Tripsitters/Helpers!
      **Keep in mind: We're not qualified to handle suicidal users here. If the user is considering / talking about suicide, direct them to the suicide hotline!**
      `)
    .setFooter({text: 'If you need help click the Backup button to summon Helpers and Tripsitters'});

  const endSession = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`tripsitmeFinish~them~${target.id}~${threadHelpUser.id}~${roleNeedshelpId}`)
        .setLabel('They\'re good now!')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`tripsitmeMetaThread`)
        .setLabel('Create thread')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`tripsitmeBackup`)
        .setLabel('I need backup')
        .setStyle(ButtonStyle.Danger),
    );

  const channelTripsitMeta = await interaction.client.channels.fetch(channelTripsittersId) as TextChannel;
  await channelTripsitMeta.send({
    embeds: [embedTripsitter],
    components: [endSession],
    allowedMentions: {},
  });
  logger.debug(`[${PREFIX}] Sent message to tripsittersChannel ${channelTripsitMeta.name}`);

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

  const userUniqueId = await db
    .select(db.ref('id'))
    .from<Users>('users')
    .where('discord_id', target.id)
    .first();

  // Set ticket information
  const newTicketData = {
    user_id: userUniqueId!.id,
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

  // Update thet ticket in the DB
  await db
    .insert(newTicketData)
    .into<UserTickets>('user_tickets');
};

/**
 * Applies the NeedHelp role on a user and removes their other roles
 * @param {GuildMember} interaction
 * @param {GuildMember} target
 **/
export async function needsHelpmode(
  interaction: ModalSubmitInteraction | ButtonInteraction,
  target: GuildMember,
) {
  if (!interaction.guild) {
    logger.debug(`[${PREFIX}] no guild!`);
    interaction.reply('This must be performed in a guild!');
    return;
  }
  if (!interaction.member) {
    logger.debug(`[${PREFIX}] no member!`);
    interaction.reply('This must be performed by a member of a guild!');
    return;
  }

  const roleNeedshelpId = interaction.customId.split('~')[1];
  const roleNeedshelp = await interaction.guild.roles.fetch(roleNeedshelpId) as Role;
  // logger.debug(`[${PREFIX}] roleNeedshelp: ${roleNeedshelp}`);

  // Check if the target already has the needshelp role
  const targetHasRoleNeedshelp = (target.roles as GuildMemberRoleManager).cache.find(
    (role) => role === roleNeedshelp,
  ) !== undefined;
  // logger.debug(`[${PREFIX}] targetHasRoleNeedshelp: ${targetHasRoleNeedshelp}`);

  // Save the user's roles to the DB
  const targetRoleIds = target.roles.cache.map((role) => role.id);
  // logger.debug(`[${PREFIX}] targetRoleIds: ${targetRoleIds}`);
  await db
    .insert({
      discord_id: target.id,
      roles: targetRoleIds.toString(),
    })
    .into<Users>('users')
    .onConflict('discord_id')
    .merge();

  const myMember = await interaction.guild?.members.fetch(interaction.client.user!.id)!;
  const myRole = myMember.roles.highest;
  // Remove all roles, except team and vanity, from the target
  target.roles.cache.forEach((role) => {
    // logger.debug(`[${PREFIX}] role: ${role.name} - ${role.id}`);
    if (!ignoredRoles.includes(role.id) && !role.name.includes('@everyone') && !role.name.includes('NeedsHelp')) {
      if (role.comparePositionTo(myRole) < 0) {
        logger.debug(`[${PREFIX}] Removing role ${role.name} from ${target.displayName}`);
        try {
          target.roles.remove(role);
        } catch (err) {
          logger.debug(`[${PREFIX}] There was an error removing the role ${role.name} from ${target.displayName}\n${err}`);
        }
      }
    }
  });

  // Add the needsHelp role to the target
  try {
    logger.debug(`[${PREFIX}] Adding role ${roleNeedshelp.name} to ${target.displayName}`);
    await target.roles.add(roleNeedshelp);
  } catch (err) {
    logger.error(`[${PREFIX}] Error adding role to target: ${err}`);
    return interaction.reply(stripIndents`There was an error adding the NeedsHelp role!
      Make sure the bot's role is higher than NeedsHelp in the Role list!`);
  }
}

/**
 * Handles removing of the NeedsHelp mode
 * @param {ButtonInteraction} interaction
 */
export async function tripsitmeFinish(
  interaction:ButtonInteraction,
) {
  logger.debug(`[${PREFIX}] Finish starting!`);
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
  const channelTripsittersId = interaction.customId.split('~')[4];

  const target = await interaction.guild?.members.fetch(targetId)!;
  const actor = interaction.member as GuildMember;

  if (meOrThem === 'me' && targetId !== actor.id) {
    logger.debug(`[${PREFIX}] not the target!`);
    interaction.editReply({content: 'Only the user receiving help can click this button!'});
    return;
  }

  const userData = await db
    .select(
      db.ref('id'),
      db.ref('roles'),
    )
    .from<Users>('users')
    .where('discord_id', target.id)
    .first();

  const ticketData = await db
    .select(
      db.ref('id').as('id'),
      db.ref('user_id').as('user_id'),
      db.ref('description').as('description'),
      db.ref('thread_id').as('thread_id'),
      db.ref('type').as('type'),
      db.ref('status').as('status'),
      db.ref('first_message_id').as('first_message_id'),
      db.ref('closed_by').as('closed_by'),
      db.ref('closed_at').as('closed_at'),
      db.ref('archived_at').as('archived_at'),
      db.ref('deleted_at').as('deleted_at'),
      db.ref('created_at').as('created_at'),
    )
    .from<UserTickets>('user_tickets')
    .where('user_id', userData?.id)
    .where('type', 'TRIPSIT')
    .andWhereNot('status', 'CLOSED')
    .andWhereNot('status', 'RESOLVED')
    .first();

  if (ticketData === undefined) {
    logger.debug(`[${PREFIX}] no ticket!`);
    const rejectMessage = `Hey ${interaction.member}, ${meOrThem === 'me' ? 'you\'re' : `${target} is`} does not have an open session!`;
    const embed = embedTemplate().setColor(Colors.DarkBlue);
    embed.setDescription(rejectMessage);
    logger.debug(`[${PREFIX}] target ${target} does not need help!`);
    interaction.editReply({embeds: [embed]});
    logger.debug(`[${PREFIX}] finished!`);
    return true;
  }

  const targetLastHelpedThreadId = ticketData.thread_id;
  const targetRoles:string[] = userData?.roles?.split(',') || [];

  logger.debug(`[${PREFIX}] targetLastHelpedThreadId: ${targetLastHelpedThreadId}`);

  // Get the channel objects for the help thread
  let threadHelpUser = {} as ThreadChannel;
  try {
    threadHelpUser = await interaction.guild.channels.fetch(ticketData.thread_id) as ThreadChannel;
  } catch (err) {
    logger.debug(`[${PREFIX}] There was an error updating the help thread, it was likely deleted:\n ${err}`);
  }
  threadHelpUser.setName(`💚│${target.displayName}'s channel!`);

  const roleNeedshelp = await interaction.guild.roles.fetch(roleNeedshelpId)!;
  const targetHasNeedsHelpRole = (target.roles as GuildMemberRoleManager).cache.find(
    (role:Role) => role === roleNeedshelp,
  ) !== undefined;
  logger.debug(`[${PREFIX}] targetHasNeedsHelpRole: ${targetHasNeedsHelpRole}`);

  const myMember = await interaction.guild?.members.fetch(interaction.client.user!.id)!;
  const myRole = myMember.roles.highest;

  // For each role in targetRoles2, add it to the target
  if (targetRoles) {
    targetRoles.forEach(async (roleId) => {
      logger.debug(`[${PREFIX}] Re-adding roleId: ${roleId}`);
      const roleObj = interaction.guild!.roles.cache.find((r) => r.id === roleId) as Role;
      if (!ignoredRoles.includes(roleObj.id) &&
      roleObj.name !== '@everyone' &&
      roleObj.id !== roleNeedshelp!.id) {
        if (roleObj.comparePositionTo(myRole) < 0) {
          logger.debug(`[${PREFIX}] Adding role ${roleObj.name} to ${target.displayName}`);
          try {
            target.roles.add(roleObj);
          } catch (err) {
            logger.error(`[${PREFIX}] Error adding role ${roleObj.name} to ${target.displayName}`);
            logger.error(err);
          }
        }
      }
    });
  }

  if (roleNeedshelp!.comparePositionTo(myRole) < 0) {
    try {
      logger.debug(`[${PREFIX}] Removing ${roleNeedshelp!.name} from ${target.displayName}`);
      target.roles.remove(roleNeedshelp!);
    } catch (err) {
      logger.error(`[${PREFIX}] Error removing ${roleNeedshelp!.name} from ${target.displayName}`);
      logger.error(err);
    }
  }

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
        logger.debug(`[${PREFIX}] Collected ${reaction.emoji.name} from ${threadHelpUser}`);
        const finalEmbed = embedTemplate()
          .setColor(Colors.Blue)
          .setDescription(`Collected ${reaction.emoji.name} from ${threadHelpUser}`);
        try {
          const channelTripsitMeta = interaction.client.channels.cache.get(channelTripsittersId) as TextChannel;
          await channelTripsitMeta.send({embeds: [finalEmbed]});
        } catch (err) {
          logger.debug(`[${PREFIX}] Failed to send message, am i still in the tripsit guild?`);
        }
        msg.delete();
        collector.stop();
      });
    });

  logger.debug(`[${PREFIX}] target ${target} is no longer being helped!`);
  logger.debug(`[${PREFIX}] finished!`);
  await interaction.editReply({content: 'Done!'});
};
