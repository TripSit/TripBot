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
  // PermissionsBitField,
  // TextChannel,
  // MessageFlags,
  MessageMentionTypes,
  ChatInputCommandInteraction,
  PermissionResolvable,
  Guild,
  AllowedThreadTypeForTextChannel,
} from 'discord.js';
import {
  TextInputStyle,
  ChannelType,
  ButtonStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { DateTime } from 'luxon';
import { ticket_status, user_tickets } from '@prisma/client';
import commandContext from './context';
import { embedTemplate } from './embedTemplate';
import { checkChannelPermissions, checkGuildPermissions } from './checkPermissions';
import commandCooldown from './commandCooldown';

const F = f(__filename);

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
  env.ROLE_REDORANGE,
  env.ROLE_ORANGE,
  env.ROLE_YELLOW,
  env.ROLE_YELLOWGREEN,
  env.ROLE_GREEN,
  env.ROLE_GREENBLUE,
  env.ROLE_BLUE,
  env.ROLE_BLUEPURPLE,
  env.ROLE_PURPLE,
  env.ROLE_PINK,
  env.ROLE_PINKRED,
  env.ROLE_WHITE,

  env.ROLE_DONOR_RED,
  env.ROLE_DONOR_REDORANGE,
  env.ROLE_DONOR_ORANGE,
  env.ROLE_DONOR_YELLOW,
  env.ROLE_DONOR_YELLOWGREEN,
  env.ROLE_DONOR_GREEN,
  env.ROLE_DONOR_GREENBLUE,
  env.ROLE_DONOR_BLUE,
  env.ROLE_DONOR_BLUEPURPLE,
  env.ROLE_DONOR_PURPLE,
  env.ROLE_DONOR_PINK,
  env.ROLE_DONOR_PINKRED,
  env.ROLE_DONOR_BLACK,
];

const mindsetRoles = [
  env.ROLE_DRUNK,
  env.ROLE_HIGH,
  env.ROLE_ROLLING,
  env.ROLE_TRIPPING,
  env.ROLE_DISSOCIATING,
  env.ROLE_STIMMING,
  env.ROLE_SEDATED,
  env.ROLE_SOBER,
];

const otherRoles = [
  env.ROLE_VERIFIED,
  env.ROLE_PREMIUM,
  env.ROLE_BOOSTER,
  env.ROLE_PATRON,
];

const ignoredRoles = `${teamRoles},${colorRoles},${mindsetRoles},${otherRoles}`;

const guildOnly = 'This must be performed in a guild!';
const memberOnly = 'This must be performed by a member of a guild!';

/* Testing Scripts

# Initialize
* As a user, create a new ticket
  Click the I need help button
  FIll in information
  Click submit
  - On BL your roles are not removed
  - On other guilds your roles are removed
  A thread is created
  The user, helpers and tripsitters are invited to that thread
* As a team member, can't create ticket
  Click the I need help button
  Bot responds "As a member of the team you cannot be publicly helped!"

# During
* As a user, continue a ticket that has not been deleted
  Click the I need help button
  Bot responds "As a member of the team you cannot be publicly helped!"
* As a user, talk in the thread
  Open the thread and talk
* As a team member, talk in the thread
  Open the thread and talk
* As a team member, Meta button works
  Click the Meta button
  A new thread is created that matches the existing threads name
* As a team member, Owned button works
  Click the Owned button
  Channel name is updated to a yellow heart
  Meta channel name is updated to a yellow heart
* As a team member, Backup button works
  Click the Backup button
  Bot sends a notification to the channel that you need help
  - If a meta channel exists, it pings there instead

# End
* As a team member, prompt to end ticket
  Click the "they're good now" button
  Bot responds "Hey <user>, it looks like you're doing somewhat better!"
  Bot responds with a button that lets the user close the session
  Bot updates the name of the channel with a blue heart
* As the system, update the meta thread name when the team prompts to end the session
  Click the "they're good now" button
  Bot updates the name of the channel with a blue heart
* As a user, end ticket
  Click the "im good now"
  Bot updates the name of the channel with a green heart
  - On most guilds your roles are returned
  - On BL your roles are not removed
* As the system, update the meta thread name when the user ends the session
  Click the "im good now"
  Bot updates the name of the meta channel with a green heart
* As the system, archive the ticket after a period of time
  After 7 days since the user last talked, the channel is archived
* As the system, delete the ticket after a period of time
  After 14 days since the user last talked, the channel is deleted
* As the system, archive the meta thread after a period of time
  After 7 days since the user last talked, the meta channel is archived
* As the system, delete the meta thread after a period of time
  After 14 days since the user last talked, the meta channel is deleted
*/

/**
 * Applies the NeedHelp role on a user and removes their other roles
 * @param {GuildMember} interaction
 * @param {GuildMember} target
 * */
export async function needsHelpMode(
  interaction: ModalSubmitInteraction | ButtonInteraction | ChatInputCommandInteraction,
  target: GuildMember,
) {
  const guild = interaction.guild as Guild;
  const guildData = await db.discord_guilds.upsert({
    where: {
      id: guild.id,
    },
    create: {
      id: guild.id,
    },
    update: {},
  });

  const perms = await checkGuildPermissions(guild, [
    'ManageRoles' as PermissionResolvable,
  ]);
  if (!perms.hasPermission) {
    const guildOwner = await guild.fetchOwner();
    await guildOwner.send({ content: `Please make sure I can ${perms.permission} in ${guild} so I can run ${F}!` }); // eslint-disable-line
    log.error(F, `Missing permission ${perms.permission} in ${guild}!`);
    return;
  }

  let roleNeedshelp = {} as Role;
  if (guildData.role_needshelp) {
    try {
      roleNeedshelp = await guild.roles.fetch(guildData.role_needshelp) as Role;
    } catch (err) {
      const guildOwner = await guild.fetchOwner();
      await guildOwner.send({ content: `The 'needshelp' role has been deleted, please remake the #tripsit channel with the new role!` }); // eslint-disable-line
      return;
    }
  }

  // Save the user's roles to the DB
  await target.fetch();
  const targetRoleIds = target.roles.cache.map(role => role.id);
  // log.debug(F, `targetRoleIds: ${targetRoleIds}`);

  await db.users.upsert({
    where: {
      discord_id: target.id,
    },
    create: {
      discord_id: target.id,
      roles: targetRoleIds.toString(),
    },
    update: {
      roles: targetRoleIds.toString(),
    },
  });
  log.debug(F, `I saved ${target.displayName}'s (${target.id}) ${targetRoleIds.length} roles to the database!`);

  const myMember = await interaction.guild?.members.fetch(interaction.client.user.id) as GuildMember;
  const highestBotRole = myMember.roles.highest;

  // Patch for BlueLight: They don't want to remove roles from the target at all
  if (
    target.guild.id !== env.DISCORD_BL_ID
    // && target.guild.id !== env.DISCORD_GUILD_ID // For testing
  ) {
  // Remove all roles, except team and vanity, from the target
    target.roles.cache.forEach(async role => {
      if (ignoredRoles.includes(role.id)) {
        log.debug(F, `${role.name} (${role.id}) is a team role or vanity role, skipping!`);
        return;
      }

      if (role.name.includes('@everyone')) {
        log.debug(F, `${role.name} (${role.id}) is the everyone role, skipping!`);
        return;
      }

      if (role.id === roleNeedshelp.id) {
        log.debug(F, `${role.name} (${role.id}) is the needshelp role, skipping!`);
        return;
      }

      if (highestBotRole.comparePositionTo(role) < 0) {
        log.debug(F, `${role.name} (${role.id}) is above my role, skipping!`);
        return;
      }

      try {
        await target.roles.remove(role);
        log.debug(F, `${role.name} (${role.id}) removed from ${target.displayName} (${target.id})`);
      } catch (err) {
        log.error(F, `${role.name} (${role.id}) could not be removed from ${target.displayName} (${target.id}): ${err}`);
        const guildOwner = await interaction.guild?.fetchOwner();
        await guildOwner?.send({
          content: stripIndents`There was an error removing ${role.name} from ${target.displayName}!
          Please make sure I have the Manage Roles permission, or put this role above mine so I don't try to remove it.
          If there's any questions please contact Moonbear#1024 on TripSit!` }); // eslint-disable-line
        log.error(F, `Missing permission ${perms.permission} in ${interaction.guild}! Sent the guild owner a DM!`);
      }
    });
  }

  // Add the needsHelp role to the target
  try {
    await target.roles.add(roleNeedshelp);
    log.debug(F, `${roleNeedshelp.name} (${roleNeedshelp.id}) added to ${target.displayName} (${target.id})`);
  } catch (err) {
    const guildOwner = await interaction.guild?.fetchOwner();
    await guildOwner?.send({
      content: stripIndents`There was an error adding the ${roleNeedshelp.name} role to ${target.displayName}!
          Please make sure I have the Manage Roles permission, or put this role below mine so I can give it to people!
          If there's any questions please contact Moonbear#1024 on TripSit!` }); // eslint-disable-line
    log.error(F, `Missing permission ${perms.permission} in ${interaction.guild}! Sent the guild owner a DM!`);
  }
  log.debug(F, 'Finished needshelp mode');
}

/**
 * Handles the Own button
 * @param {ButtonInteraction} interaction
 * */
export async function tripsitmeOwned(
  interaction:ButtonInteraction,
) {
  await interaction.deferReply({ ephemeral: true });
  if (!interaction.guild) {
    // log.debug(F, `no guild!`);
    await interaction.editReply(guildOnly);
    return;
  }
  // log.debug(F, `tripsitmeOwned`);
  const userId = interaction.customId.split('~')[1];
  const actor = interaction.member as GuildMember;

  const target = await interaction.guild.members.fetch(userId);

  if (target.id === actor.id) {
    await interaction.editReply({ content: "You can't own your own ticket!" });
    return;
  }

  const userData = await db.users.upsert({
    where: {
      discord_id: userId,
    },
    create: {
      discord_id: userId,
    },
    update: {},
  });

  const ticketData = await db.user_tickets.findFirst({
    where: {
      user_id: userData.id,
      status: {
        not: {
          in: ['CLOSED', 'RESOLVED', 'DELETED'],
        },
      },
    },
  });

  const guildData = await db.discord_guilds.upsert({
    where: {
      id: interaction.guild?.id,
    },
    create: {
      id: interaction.guild?.id,
    },
    update: {},
  });

  // log.debug(F, `ticketData: ${JSON.stringify(ticketData, null, 2)}`);

  if (!ticketData) {
    const rejectMessage = `Hey ${interaction.member}, ${target.displayName} does not have an open session!`;
    const embed = embedTemplate().setColor(Colors.DarkBlue);
    embed.setDescription(rejectMessage);
    // log.debug(F, `target ${target} does not need help!`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const metaChannelId = ticketData.meta_thread_id ?? guildData.channel_tripsitmeta;
  if (metaChannelId) {
    // log.debug(F, `metaChannelId: ${metaChannelId}`);
    let metaChannel = {} as TextChannel;
    try {
      metaChannel = await interaction.guild.channels.fetch(metaChannelId) as TextChannel;
    } catch (err) {
      // Meta channel deleted
    }

    if (metaChannel.id) {
      const channelPerms = await checkChannelPermissions(metaChannel, [
        'SendMessages' as PermissionResolvable,
      ]);
      if (!channelPerms.hasPermission) {
        const guildOwner = await interaction.guild.fetchOwner();
        await guildOwner.send({ content: `Please make sure I can ${channelPerms.permission} in ${metaChannel.name} so I can run ${F}!` }); // eslint-disable-line
        log.error(F, `Missing permission ${channelPerms.permission} in ${metaChannel.name}!`);
        return;
      }

      await metaChannel.send({
        content: stripIndents`${actor.displayName} has indicated that ${target.toString()} is receiving help!`,
      });
      if (metaChannelId !== guildData.channel_tripsitmeta) {
        metaChannel.setName(`💛│${target.displayName}'s discussion!`);
      }
    }
  }

  // Update the ticket's name
  try {
    const channel = await interaction.guild.channels.fetch(ticketData.thread_id) as TextChannel;
    channel.setName(`💛│${target.displayName}'s channel!`);
  } catch (err) {
    // Thread likely deleted
  }

  // Update the ticket's status in the DB
  ticketData.status = 'OWNED' as ticket_status;

  await db.user_tickets.update({
    where: {
      id: ticketData.id,
    },
    data: {
      status: 'OWNED' as ticket_status,
    },
  });

  // Reply to the user
  await interaction.editReply({ content: 'Thanks!' });
}

export async function tripsitmeMeta(
  interaction:ButtonInteraction,
) {
  await interaction.deferReply({ ephemeral: true });
  if (!interaction.guild) {
    // log.debug(F, `no guild!`);
    await interaction.editReply(guildOnly);
    return;
  }
  // log.debug(F, `tripsitmeMeta`);
  const userId = interaction.customId.split('~')[1];
  const actor = interaction.member as GuildMember;
  const target = await interaction.guild.members.fetch(userId);

  if (!interaction.guild) {
    // log.debug(F, `no guild!`);
    await interaction.editReply(guildOnly);
    return;
  }
  if (!interaction.channel) {
    // log.debug(F, `no channel!`);
    await interaction.editReply('This must be performed in a channel!');
    return;
  }
  if (!interaction.member) {
    // log.debug(F, `no member!`);
    await interaction.editReply('This must be performed by a member!');
    return;
  }

  const userData = await db.users.upsert({
    where: {
      discord_id: userId,
    },
    create: {
      discord_id: userId,
    },
    update: {},
  });

  const ticketData = await db.user_tickets.findFirst({
    where: {
      user_id: userData.id,
      status: {
        not: {
          in: ['CLOSED', 'RESOLVED', 'DELETED'],
        },
      },
    },
  });

  if (!ticketData) {
    const rejectMessage = `Hey ${(interaction.member as GuildMember).displayName}, ${target.displayName} does not have an open session!`;
    const embed = embedTemplate().setColor(Colors.DarkBlue);
    embed.setDescription(rejectMessage);
    // log.debug(F, `target ${target} does not need help!`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const channel = interaction.channel as TextChannel;
  const metaChannel = await channel.threads.create(
    {
      name: `💛│${target.displayName}'s discussion!`,
      autoArchiveDuration: 1440,
      type: ChannelType.PrivateThread as AllowedThreadTypeForTextChannel,
      reason: `${actor.displayName} created meta thread for ${target.displayName}`,
      invitable: false,
    },
  );

  ticketData.meta_thread_id = metaChannel.id;

  // await ticketUpdate(ticketData);
  await db.user_tickets.update({
    where: {
      id: ticketData.id,
    },
    data: {
      meta_thread_id: metaChannel.id,
    },
  });

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
        .setCustomId(`tripsitmeTeamClose~${target.id}`)
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
    allowedMentions: {
      // parse: showMentions,
      parse: ['users', 'roles'] as MessageMentionTypes[],
    },
  });

  await interaction.editReply({ content: 'Donezo!' });
}

/**
 * Handles the Backup button
 * @param {ButtonInteraction} interaction
 * */
export async function tripsitmeBackup(
  interaction:ButtonInteraction,
) {
  await interaction.deferReply({ ephemeral: true });
  // log.debug(F, `tripsitmeBackup`);
  if (!interaction.guild) {
    // log.debug(F, `no guild!`);
    await interaction.editReply(guildOnly);
    return;
  }
  if (!interaction.channel) {
    // log.debug(F, `no channel!`);
    await interaction.editReply('This must be performed in a channel!');
    return;
  }
  const userId = interaction.customId.split('~')[1];
  const actor = interaction.member as GuildMember;
  const target = await interaction.guild.members.fetch(userId);

  const userData = await db.users.upsert({
    where: {
      discord_id: userId,
    },
    create: {
      discord_id: userId,
    },
    update: {},
  });

  const ticketData = await db.user_tickets.findFirst({
    where: {
      user_id: userData.id,
      status: {
        not: {
          in: ['CLOSED', 'RESOLVED', 'DELETED'],
        },
      },
    },
  });

  if (!ticketData) {
    const rejectMessage = `Hey ${interaction.member}, ${target.displayName} does not have an open session!`;
    const embed = embedTemplate().setColor(Colors.DarkBlue);
    embed.setDescription(rejectMessage);
    // log.debug(F, `target ${target} does not need help!`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const guildData = await db.discord_guilds.upsert({
    where: {
      id: interaction.guild?.id,
    },
    create: {
      id: interaction.guild?.id,
    },
    update: {},
  });

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

  backupMessage += stripIndents`team, ${actor} has indicated they could use some backup!
    
  Be sure to read the log so you have the context!`;

  if (ticketData.meta_thread_id) {
    try {
      const metaThread = await interaction.guild.channels.fetch(ticketData.meta_thread_id) as ThreadChannel;
      await metaThread.send(backupMessage);
    } catch (err) {
      // meta thread deleted
      await db.user_tickets.update({
        where: {
          id: ticketData.id,
        },
        data: {
          meta_thread_id: null,
        },
      });
    }
  } else {
    await interaction.channel.send(backupMessage);
  }

  await interaction.editReply({ content: 'Backup message sent!' });
}

/**
 * Handles removing of the NeedsHelp mode
 * @param {ButtonInteraction} interaction
 */
export async function tripsitmeTeamClose(
  interaction:ButtonInteraction,
) {
  if (!interaction.guild) return;
  if (!interaction.member) return;
  if (!interaction.channel) return;
  log.info(F, await commandContext(interaction));
  await interaction.deferReply({ ephemeral: true });

  const targetId = interaction.customId.split('~')[1];

  let target = null as GuildMember | null;
  try {
    target = await interaction.guild.members.fetch(targetId);
  } catch (err) {
    // log.debug(F, `There was an error fetching the target, it was likely deleted:\n ${err}`);
    // await interaction.editReply({ content: 'Sorry, this user has left the guild.' });
    // return;
  }

  const actor = interaction.member as GuildMember;

  if (targetId === actor.id && actor.id !== env.DISCORD_OWNER_ID) {
    // log.debug(F, `not the target!`);
    await interaction.editReply({ content: 'You should not be able to see this button!' });
    return;
  }

  const userData = await db.users.upsert({
    where: {
      discord_id: targetId,
    },
    create: {
      discord_id: targetId,
    },
    update: {},
  });

  const ticketData = await db.user_tickets.findFirst({
    where: {
      user_id: userData.id,
      status: {
        not: {
          in: ['CLOSED', 'RESOLVED', 'DELETED'],
        },
      },
    },
  });

  const guildData = await db.discord_guilds.upsert({
    where: {
      id: interaction.guild?.id,
    },
    create: {
      id: interaction.guild?.id,
    },
    update: {},
  });
  // log.debug(F, `guildData: ${JSON.stringify(guildData, null, 2)}`);

  if (!ticketData) {
    const rejectMessage = `Hey ${(interaction.member as GuildMember).displayName}, ${target ? target.displayName : 'this user'} does not have an open session!`;
    const embed = embedTemplate().setColor(Colors.DarkBlue);
    embed.setDescription(rejectMessage);
    // log.debug(F, `target ${target} does not need help!`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // log.debug(F, `ticketData: ${JSON.stringify(ticketData, null, 2)}`);
  if (Object.entries(ticketData).length === 0) {
    const rejectMessage = `Hey ${(interaction.member as GuildMember).displayName}, ${target ? target.displayName : 'this user'} does not have an open session!`;
    const embed = embedTemplate().setColor(Colors.DarkBlue);
    embed.setDescription(rejectMessage);
    // log.debug(F, `target ${target} does not need help!`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // Get the channel objects for the help thread
  let threadHelpUser = {} as ThreadChannel;
  try {
    threadHelpUser = await interaction.guild.channels.fetch(ticketData.thread_id) as ThreadChannel;

    // Replace the first character of the channel name with a blue heart using slice to preserve the rest of the name
    await threadHelpUser.setName(`💙${threadHelpUser.name.slice(1)}`);
  } catch (err) {
    // log.debug(F, `There was an error updating the help thread, it was likely deleted:\n ${err}`);
    // Update the ticket status to closed
    await db.user_tickets.update({
      where: {
        id: ticketData.id,
      },
      data: {
        status: 'DELETED' as ticket_status,
        archived_at: new Date(),
        deleted_at: new Date(),
      },
    });
    interaction.editReply({ content: 'It looks like this thread was deleted, so consider this closed!' });
  // log.debug(F, `Updated ticket status to DELETED`);
  }

  if (threadHelpUser.archived) {
    await threadHelpUser.setArchived(false);
    log.debug(F, `Un-archived ${threadHelpUser.name}`);
  }

  const closeMessage = stripIndents`Hey ${target}, it looks like you're doing somewhat better!
    This thread will remain here for a day if you want to follow up tomorrow.
    After 7 days, or on request, it will be deleted to preserve your privacy =)
    If you'd like to go back to social mode, just click the button below!
    `;

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`tripsitmeUserClose~${targetId}`)
        .setLabel('I\'m good now!')
        .setStyle(ButtonStyle.Success),
    );

  await threadHelpUser.send({
    content: closeMessage,
    components: [row],
  });

  const metaChannelId = ticketData.meta_thread_id ?? guildData.channel_tripsitmeta;
  if (metaChannelId) {
    try {
      const metaChannel = await interaction.guild.channels.fetch(metaChannelId) as TextChannel;
      await metaChannel.send({
        content: stripIndents`${actor.displayName} has indicated that ${target ? target.displayName : 'this user'} no longer needs help!`,
      });
      if (metaChannelId !== guildData.channel_tripsitmeta) {
        await metaChannel.setName(`💙${threadHelpUser.name.slice(1)}`);
      }
    } catch (err) {
      if (metaChannelId === ticketData.meta_thread_id) {
        // await database.tickets.set(ticketData);
        await db.user_tickets.update({
          where: {
            id: ticketData.id,
          },
          data: {
            meta_thread_id: null,
          },
        });
      }
    }
  }

  // Update the ticket status to resolved
  ticketData.status = 'RESOLVED' as ticket_status;
  ticketData.archived_at = env.NODE_ENV === 'production'
    ? DateTime.local().plus({ days: 7 }).toJSDate()
    : DateTime.local().plus({ minutes: 1 }).toJSDate();

  ticketData.deleted_at = env.NODE_ENV === 'production'
    ? DateTime.local().plus({ days: 14 }).toJSDate()
    : DateTime.local().plus({ minutes: 2 }).toJSDate();

  // await database.tickets.set(ticketData);
  await db.user_tickets.update({
    where: {
      id: ticketData.id,
    },
    data: {
      status: 'RESOLVED' as ticket_status,
      archived_at: ticketData.archived_at,
      deleted_at: ticketData.deleted_at,
    },
  });

  log.debug(F, 'Updated ticket status to RESOLVED');

  // log.debug(F, `${target.user.tag} (${target.user.id}) is no longer being helped!`);
  await interaction.editReply({ content: 'Done!' });
}

/**
 * Handles removing of the NeedsHelp mode
 * @param {ButtonInteraction} interaction
 */
export async function tripsitmeUserClose(
  interaction:ButtonInteraction,
) {
  if (!interaction.guild) return;
  if (!interaction.member) return;
  if (!interaction.channel) return;
  log.info(F, await commandContext(interaction));

  const cooldown = await commandCooldown(interaction.user, interaction.customId);

  if (!cooldown.success && cooldown.message) {
    await interaction.reply({ content: cooldown.message, ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: false });

  const targetId = interaction.customId.split('~')[1];
  const override = interaction.customId.split('~')[0] === 'tripsitmodeOffOverride';

  const target = await interaction.guild.members.fetch(targetId);
  const actor = interaction.member as GuildMember;
  await actor.fetch();
  log.debug(F, `${actor.displayName} (${actor.id}) clicked "I'm good" in ${target.displayName}'s (${target.id}) session `);

  if (targetId !== actor.id && !override) {
    log.debug(F, 'They did not create the thread, so I am not doing anything!');
    await interaction.editReply({ content: 'Only the user receiving help can click this button!' });
    return;
  }

  const userData = await db.users.upsert({
    where: {
      discord_id: target.id,
    },
    create: {
      discord_id: target.id,
    },
    update: {},
  });

  const ticketData = await db.user_tickets.findFirst({
    where: {
      user_id: userData.id,
      status: {
        not: {
          in: ['CLOSED', 'DELETED'],
        },
      },
    },
  });

  const guildData = await db.discord_guilds.upsert({
    where: {
      id: interaction.guild?.id,
    },
    create: {
      id: interaction.guild?.id,
    },
    update: {},
  });

  if (!ticketData) {
    log.debug(F, `${actor.displayName} does not have any tickets that are not closed or deleted`);
    const rejectMessage = stripIndents`Hey ${actor.displayName}, you do not have an open session!
    If you need help, please click the button again!`;
    const embed = embedTemplate().setColor(Colors.DarkBlue);
    embed.setDescription(rejectMessage);
    // log.debug(F, `target ${target} does not need help!`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  log.debug(F, `Found ticket in ${ticketData.status} status`);
  // if (Object.entries(ticketData).length === 0) {
  //   log.debug(F, `${actor.displayName} does not have any tickets that are not closed or deleted`);
  //   const rejectMessage = stripIndents`Hey ${(interaction.member as GuildMember).displayName}, you do not have an open session
  //   If you need help, please click the button again!`;
  //   const embed = embedTemplate().setColor(Colors.DarkBlue);
  //   embed.setDescription(rejectMessage);
  //   // log.debug(F, `target ${target} does not need help!`);
  //   await interaction.editReply({ embeds: [embed] });
  //   return;
  // }

  // if (ticketData.status === 'CLOSED') {
  //   const rejectMessage = stripIndents`Hey ${(interaction.member as GuildMember).displayName}, you already closed this session!`;
  //   const embed = embedTemplate().setColor(Colors.DarkBlue);
  //   embed.setDescription(rejectMessage);
  //   // log.debug(F, `target ${target} does not have an open session!`);
  //   await interaction.editReply({ embeds: [embed] });
  //   return;
  // }

  // Remove the needshelp role
  let roleNeedshelp = {} as Role;
  if (guildData.role_needshelp) {
    try {
      roleNeedshelp = await interaction.guild.roles.fetch(guildData.role_needshelp) as Role;
      const myMember = await interaction.guild.members.fetch(interaction.client.user.id);
      const highestBotRole = myMember.roles.highest;

      if (roleNeedshelp.comparePositionTo(highestBotRole) < 0) {
        log.debug(F, `Removing ${roleNeedshelp.name} from ${target.displayName}`);
        await target.roles.remove(roleNeedshelp);
        log.debug(F, `${roleNeedshelp.name} (${roleNeedshelp.id}) removed from ${target.displayName} (${target.id})`);
      } else {
        log.debug(F, `Skipping ${roleNeedshelp.name} because it is above my role!`);
      }
    } catch (err) {
      log.debug(F, `There was an error removing needshelp (${guildData.role_needshelp}) role, it was likely deleted:\n ${err}`);
      // Update the ticket status to closed
      await db.discord_guilds.update({
        where: {
          id: guildData.id,
        },
        data: {
          role_needshelp: null,
        },
      });
    }
  } else {
    log.debug(F, `${interaction.guild.name} does not have a needshelp role!`);
  }

  // Get the meta room, if it exists
  let channelTripsitmeta = {} as TextChannel;
  if (guildData.channel_tripsitmeta) {
    try {
      channelTripsitmeta = await interaction.guild.channels.fetch(guildData.channel_tripsitmeta) as TextChannel;
    } catch (err) {
      // log.debug(F, `There was an error fetching the meta channel, it was likely deleted:\n ${err}`);
      // Update the ticket status to closed
      await db.discord_guilds.update({
        where: {
          id: guildData.id,
        },
        data: {
          channel_tripsitmeta: null,
        },
      });
    }
  }

  // Re-add old roles
  if (userData.roles
    // Patch for BlueLight: Since we didn't remove roles, don't re-add them
    && target.guild.id !== env.DISCORD_BL_ID
    // && target.guild.id !== env.DISCORD_GUILD_ID // For testing
  ) {
    const myMember = await interaction.guild.members.fetch(interaction.client.user.id);
    const myRole = myMember.roles.highest;
    const targetRoles:string[] = userData.roles.split(',') || [];

    log.debug(F, `Adding ${targetRoles.length} old roles to ${target.displayName} (${target.id})`);

    // readd each role to the target
    if (targetRoles.length > 0) {
      targetRoles.forEach(async roleId => {
        if (!interaction.guild) {
          log.error(F, 'no guild!');
          return;
        }
        const roleObj = await interaction.guild.roles.fetch(roleId) as Role;

        if (ignoredRoles.includes(roleObj.id)) {
          log.debug(F, `${roleObj.name} (${roleObj.id}) is a team role or vanity role, skipping!`);
          return;
        }

        if (roleObj.name.includes('@everyone')) {
          log.debug(F, `${roleObj.name} (${roleObj.id}) is Everyone, skipping!`);
          return;
        }

        if (roleObj.id === roleNeedshelp.id) {
          log.debug(F, `${roleObj.name} (${roleObj.id}) is the needshelp role, skipping!`);
          return;
        }

        if (myRole.comparePositionTo(roleObj) < 0) {
          log.debug(F, `${roleObj.name} (${roleObj.id}) is above my role, skipping!`);
          return;
        }

        try {
          await target.roles.add(roleObj);
          log.debug(F, `${roleObj.name} (${roleObj.id}) added to ${target.displayName} (${target.id})`);
        } catch (err) {
          log.error(F, `Error adding role to target: ${err}`);
          log.error(F, `${roleObj.name} could not be added to ${target.displayName} (${target.id}) in ${interaction.guild}!`);
        }
      });
    }
  }

  // Change the channel icon
  let threadHelpUser = {} as ThreadChannel;
  try {
    threadHelpUser = await interaction.guild.channels.fetch(ticketData.thread_id) as ThreadChannel;
  } catch (err) {
    log.error(F, `There was an error updating the help thread, it was likely deleted:\n ${err}`);
    log.error(F, `Ticket Data: ${JSON.stringify(ticketData, null, 2)}`);
    // Update the ticket status to closed
    await db.user_tickets.update({
      where: {
        id: ticketData.id,
      },
      data: {
        status: 'DELETED' as ticket_status,
        archived_at: ticketData.archived_at,
        deleted_at: ticketData.deleted_at,
      },
    });
    await interaction.editReply({ content: 'Could not find this help thread, it was likely deleted manually!' });
    return;
  // log.debug(F, `Updated ticket status to DELETED`);
  }

  if (threadHelpUser.archived) {
    await threadHelpUser.setArchived(false);
    log.debug(F, `Un-archived ${threadHelpUser.name}`);
  }

  // Let the meta channel know the user has been helped
  const metaChannelId = ticketData.meta_thread_id ?? guildData.channel_tripsitmeta;
  if (metaChannelId) {
    try {
      const metaChannel = await interaction.guild.channels.fetch(metaChannelId) as TextChannel;
      await metaChannel.send({
        content: stripIndents`${actor.displayName} has indicated that they no longer need help!`,
      });
      if (metaChannelId !== guildData.channel_tripsitmeta) {
        metaChannel.setName(`💚│${target.displayName}'s discussion!`);
      }
    } catch (err) {
      // Meta thread likely doesn't exist
      if (metaChannelId === ticketData.meta_thread_id) {
        ticketData.meta_thread_id = null;
        // await ticketUpdate(ticketData);
        await db.user_tickets.update({
          where: {
            id: ticketData.id,
          },
          data: {
            meta_thread_id: null,
          },
        });
      }
    }
  }

  // Send the end message to the user
  try {
    await interaction.editReply(stripIndents`Hey ${target}, we're glad you're doing better!
    We've restored your old roles back to normal <3
    This thread will remain here for a day if you want to follow up tomorrow.
    After 7 days, or on request, it will be deleted to preserve your privacy =)`);
  } catch (err) {
    log.error(F, `Error sending end help message to ${threadHelpUser}`);
    log.error(F, err as string);
  }

  // Send the survey
  let message:Message;
  await threadHelpUser.send(stripIndents`
      ${emojiGet('Invisible')}
      > **If you have a minute, your feedback is important to us!**
      > Please rate your experience with ${interaction.guild.name}'s service by reacting below.
      > Thank you!
      ${emojiGet('Invisible')}
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
      const collector = message.createReactionCollector({ filter, time: 0 });
      collector.on('collect', async reaction => {
        await threadHelpUser.send(stripIndents`
          ${emojiGet('Invisible')}
          > Thank you for your feedback, here's a cookie! 🍪
          ${emojiGet('Invisible')}
          `);
        // log.debug(F, `Collected ${reaction.emoji.name} from ${threadHelpUser}`);
        const finalEmbed = embedTemplate()
          .setColor(Colors.Blue)
          .setDescription(`Collected ${reaction.emoji.name} from ${threadHelpUser}`);
        try {
          await channelTripsitmeta.send({ embeds: [finalEmbed] });
        } catch (err) {
          // log.debug(F, `Failed to send message, am i still in the tripsit guild?`);
        }
        msg.delete();
        collector.stop();
      });
    });

  // Do this last because it looks weird to have it happen in-between messages
  threadHelpUser.setName(`💚│${target.displayName}'s channel!`);

  // log.debug(F, `${target.user.tag} (${target.user.id}) is no longer being helped!`);
  // await interaction.editReply({ content: 'Done!' });

  // Update the ticket status to closed
  ticketData.status = 'CLOSED' as ticket_status;
  ticketData.archived_at = env.NODE_ENV === 'production'
    ? DateTime.local().plus({ days: 7 }).toJSDate()
    : DateTime.local().plus({ minutes: 1 }).toJSDate();

  ticketData.deleted_at = env.NODE_ENV === 'production'
    ? DateTime.local().plus({ days: 14 }).toJSDate()
    : DateTime.local().plus({ minutes: 2 }).toJSDate();

  await db.user_tickets.update({
    where: {
      id: ticketData.id,
    },
    data: {
      status: 'CLOSED' as ticket_status,
      archived_at: ticketData.archived_at,
      deleted_at: ticketData.deleted_at,
    },
  });
  log.debug(F, 'Updated ticket status to CLOSED');
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
):Promise<ThreadChannel | null> {
  log.info(F, await commandContext(interaction));
  // await interaction.deferReply({ ephemeral: true });

  // Lookup guild information for variables
  if (!interaction.guild) {
    // log.debug(F, `no guild!`);
    await interaction.editReply(guildOnly);
    return null;
  }
  if (!interaction.member) {
    // log.debug(F, `no member!`);
    await interaction.editReply(memberOnly);
    return null;
  }

  const cooldown = await commandCooldown(interaction.user, interaction.customId);

  if (!cooldown.success && cooldown.message) {
    await interaction.editReply(cooldown.message);
  }

  // const actor = interaction.member;
  const guildData = await db.discord_guilds.upsert({
    where: {
      id: interaction.guild?.id,
    },
    create: {
      id: interaction.guild?.id,
    },
    update: {},
  });

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
    try {
      channelTripsitmeta = await interaction.guild.channels.fetch(guildData.channel_tripsitmeta) as TextChannel;
    } catch (err) {
      // log.debug(F, `There was an error fetching the meta channel, it was likely deleted:\n ${err}`);
      // Update the ticket status to closed
      await db.discord_guilds.update({
        where: {
          id: guildData.id,
        },
        data: {
          channel_tripsitmeta: null,
        },
      });
    }
  }
  log.debug(F, `roleTripsitter: ${roleTripsitter.name} (${roleTripsitter.id})`);
  log.debug(F, `roleHelper: ${roleHelper.name} (${roleHelper.id})`);
  log.debug(F, `channelTripsitmeta: ${channelTripsitmeta.name} (${channelTripsitmeta.id})`);

  // log.debug(F, `submitted with |
  //   user: ${interaction.user.tag} (${interaction.user.id})
  //   guild: ${interaction.guild.name} (${interaction.guild.id})
  //   memberInput: ${memberInput}
  //   roleTripsitterId: ${roleTripsitter.id}
  //   channelTripsittersId: ${channelTripsitmeta.id}
  //   triage: ${triage}
  //   intro: ${intro}
  // `);

  // Determine if this command was initialized by an Admin (for testing)
  // const actorIsAdmin = (actor as GuildMember).permissions.has(PermissionsBitField.Flags.Administrator);
  // const showMentions = actorIsAdmin ? [] : ['users', 'roles'] as MessageMentionTypes[];
  // log.debug(F, `actorIsAdmin: ${actorIsAdmin}`);
  // log.debug(F, `showMentions: ${showMentions}`);

  // Determine the target.
  // If the user clicked the button, the target is whoever initialized the interaction.
  // Otherwise, the target is the user mentioned in the /tripsit command.
  // log.debug(F, `memberInput: ${JSON.stringify(memberInput, null, 2)}`);
  // log.debug(F, `interaction.member: ${JSON.stringify(interaction.member, null, 2)}`);
  const target = (memberInput ?? interaction.member) as GuildMember;
  // log.debug(F, `target: ${target}`);

  await needsHelpMode(interaction, target);

  // Get the tripsit channel from the guild
  let tripsitChannel = {} as TextChannel;
  try {
    if (guildData.channel_tripsit) {
      tripsitChannel = await interaction.guild.channels.fetch(guildData.channel_tripsit) as TextChannel;
    }
  } catch (err) {
    // log.debug(F, `There was an error fetching the tripsit channel, it was likely deleted:\n ${err}`);
    // Update the ticket status to closed
    await db.discord_guilds.update({
      where: {
        id: guildData.id,
      },
      data: {
        channel_tripsit: null,
      },
    });
  }

  if (!tripsitChannel.id) {
    // log.debug(F, `no tripsit channel!`);
    await interaction.editReply({ content: 'No tripsit channel found! Make sure to run /setup tripsit' });
    return null;
  }

  // Create a new thread in the channel
  // If we're not in production we need to create a public thread
  const threadHelpUser = await tripsitChannel.threads.create({
    name: `🧡│${target.displayName}'s channel!`,
    autoArchiveDuration: 1440,
    type: ChannelType.PrivateThread as AllowedThreadTypeForTextChannel,
    reason: `${target.displayName} requested help`,
    invitable: false,
  });
  log.debug(F, `Created thread ${threadHelpUser.name} (${threadHelpUser.id})`);

  // Team check - Cannot be run on team members
  // If this user is a developer then this is a test run and ignore this check,
  // but we'll change the output down below to make it clear this is a test.
  let targetIsTeamMember = false;
  target.roles.cache.forEach(async role => {
    if (teamRoles.includes(role.id)) {
      targetIsTeamMember = true;
    }
  });

  // log.debug(F, `targetIsTeamMember: ${targetIsTeamMember}`);

  const noInfo = '\n*No info given*';
  const firstMessage = stripIndents`
      Hey ${target}, thank you for asking for assistance!

      You've taken: ${triage ? `\n${triage}` : noInfo}

      Your issue: ${intro ? `\n${intro}` : noInfo}

      Someone from the ${roleTripsitter} ${guildData.role_helper && !targetIsTeamMember ? `and/or ${roleHelper}` : ''} team will be with you as soon as they're available!

      If this is a medical emergency please contact your local emergency services: we do not call EMS on behalf of anyone.
      
      When you're feeling better you can use the "I'm Good" button to let the team know you're okay.

      **Not in an emergency, but still want to talk to a mental health advisor? Warm lines provide non-crisis mental health support and guidance from trained volunteers. https://warmline.org/warmdir.html#directory**

      **The wonderful people at the Fireside project can also help you through a rough trip. You can check them out: https://firesideproject.org/**
      `;

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`tripsitmeUserClose~${target.id}`)
        .setLabel('I\'m good now!')
        .setStyle(ButtonStyle.Success),
    );
  await threadHelpUser.send({
    content: firstMessage,
    components: [row],
    allowedMentions: {
      // parse: showMentions,
      parse: ['users', 'roles'] as MessageMentionTypes[],
    },
    flags: ['SuppressEmbeds'],
  }).then(async message => {
    log.debug(F, 'Pinning message');
    try {
      await message.pin();
    } catch (error) {
      log.error(F, `Failed to pin message: ${error}`);
      const guildOwner = await interaction.guild?.fetchOwner();
      await guildOwner?.send({
        content: stripIndents`There was an error pinning a message in ${threadHelpUser.name}!
          Please make sure I have the Manage Messages permission in this room!
          If there's any questions please contact Moonbear#1024 on TripSit!` }); // eslint-disable-line
    }
  });

  // log.debug(F, `Sent intro message to ${threadHelpUser.name} ${threadHelpUser.id}`);

  // Send an embed to the tripsitter room
  const embedTripsitter = embedTemplate()
    .setColor(Colors.DarkBlue)
    .setDescription(stripIndents`
      ${target} has requested assistance!
      **They've taken:** ${triage ? `${triage}` : noInfo}
      **Their issue: ** ${intro ? `${intro}` : noInfo}

      **Read the log before interacting**
      Use this channel coordinate efforts.

      **No one is qualified to handle suicidal users here**
      If the user is considering / talking about suicide, direct them to the suicide hotline!

      **Do not engage in DM**
      Keep things in the open where you have the team's support!

      **→ Go to <#${threadHelpUser.id}>**
      `)
    .setFooter({ text: 'If you need help click the Backup button to summon Helpers and Tripsitters' });

  const endSession = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`tripsitmeOwned~${target.id}`)
        .setLabel('Owned')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`tripsitmeTeamClose~${target.id}`)
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
    allowedMentions: {
      // parse: showMentions,
      parse: ['users', 'roles'] as MessageMentionTypes[],
    },
  });
  // log.debug(F, `Sent message to ${channelTripsitmeta.name} (${channelTripsitmeta.id})`);

  const archiveTime = env.NODE_ENV === 'production'
    ? DateTime.local().plus({ days: 7 })
    : DateTime.local().plus({ minutes: 1 });

  const deleteTime = env.NODE_ENV === 'production'
    ? DateTime.local().plus({ days: 14 })
    : DateTime.local().plus({ minutes: 2 });

  log.debug(F, `Ticket archives on ${archiveTime.toLocaleString(DateTime.DATETIME_FULL)} deletes on ${deleteTime.toLocaleString(DateTime.DATETIME_FULL)}`);

  const userData = await db.users.upsert({
    where: {
      discord_id: target.id,
    },
    create: {
      discord_id: target.id,
    },
    update: {},
  });

  // Set ticket information
  const introStr = intro ? `\n${intro}` : noInfo;
  const newTicketData = {
    user_id: userData.id,
    description: `
    They've taken: ${triage ? `\n${triage}` : noInfo}

    Their issue: ${introStr}`,
    thread_id: threadHelpUser.id,
    type: 'TRIPSIT',
    status: 'OPEN',
    first_message_id: '',
    archived_at: archiveTime.toJSDate(),
    deleted_at: deleteTime.toJSDate(),
  } as user_tickets;

  // log.debug(F, `newTicketData: ${JSON.stringify(newTicketData, null, 2)}`);

  // Update the ticket in the DB
  await db.user_tickets.create({
    data: {
      user_id: newTicketData.user_id,
      description: newTicketData.description,
      thread_id: newTicketData.thread_id,
      type: newTicketData.type,
      status: newTicketData.status,
      first_message_id: newTicketData.first_message_id,
      archived_at: newTicketData.archived_at,
      deleted_at: newTicketData.deleted_at,
    },
  });

  return threadHelpUser;
}

export async function tripsitmeButton(
  interaction:ButtonInteraction,
) {
  log.info(F, await commandContext(interaction));
  const target = interaction.member as GuildMember;

  const cooldown = await commandCooldown(interaction.user, interaction.customId);

  if (!cooldown.success && cooldown.message) {
    await interaction.reply({ content: cooldown.message, ephemeral: true });
    return;
  }

  // log.debug(F, `target: ${JSON.stringify(target, n ull, 2)}`);

  // const actorIsAdmin = target.permissions.has(PermissionsBitField.Flags.Administrator);
  // const showMentions = actorIsAdmin ? [] : ['users', 'roles'] as MessageMentionTypes[];

  // const guildData = await getGuild(interactio n.guild.id) as DiscordGuilds;

  // Get the roles we'll be referencing
  // let roleTripsitter = {} as Role;
  // let roleHelper = {} as Role;
  // if (guildData.role_tripsitter) {
  //   roleTripsitter = await interaction.guild.roles.fetch(guildData.role_tripsitter) as Role;
  // }
  // if (guildData.role_helper) {
  //   roleHelper = await interaction.guild.roles.fetch(guildData.role_helper) as Role;
  // }

  const guildData = await db.discord_guilds.upsert({
    where: {
      id: interaction.guild?.id,
    },
    create: {
      id: interaction.guild?.id as string,
    },
    update: {},
  });

  // Get the tripsit channel from the guild
  let tripsitChannel = {} as TextChannel;
  try {
    if (guildData.channel_tripsit) {
      tripsitChannel = await interaction.guild?.channels.fetch(guildData.channel_tripsit) as TextChannel;
    }
  } catch (err) {
    log.debug(F, `There was an error fetching the tripsit channel, it was likely deleted:\n ${err}`);
    // Update the ticket status to closed
    await db.discord_guilds.update({
      where: {
        id: guildData.id,
      },
      data: {
        channel_tripsit: null,
      },
    });
  }

  log.debug(F, `tripsitChannel: ${tripsitChannel.name} (${tripsitChannel.id})`);

  const channelPerms = await checkChannelPermissions(tripsitChannel, [
    'ViewChannel' as PermissionResolvable,
    'SendMessages' as PermissionResolvable,
    'SendMessagesInThreads' as PermissionResolvable,
    // 'CreatePublicThreads' as PermissionResolvable,
    'CreatePrivateThreads' as PermissionResolvable,
    // 'ManageMessages' as PermissionResolvable,
    'ManageThreads' as PermissionResolvable,
    // 'EmbedLinks' as PermissionResolvable,
  ]);
  if (!channelPerms.hasPermission) {
    log.error(F, `Missing TS channel permission ${channelPerms.permission} in ${tripsitChannel.name}!`);
    const guildOwner = await interaction.guild?.fetchOwner() as GuildMember;
    await guildOwner.send({
      content: stripIndents`Missing permissions in ${tripsitChannel}!
      In order to setup the tripsitting feature I need:
      View Channel - to see the channel
      Send Messages - to send messages
      Create Private Threads - to create private threads
      Send Messages in Threads - to send messages in threads
      Manage Threads - to delete threads when they're done
      `}); // eslint-disable-line
    log.error(F, `Missing TS channel permission ${channelPerms.permission} in ${tripsitChannel.name}!`);
    return;
  }

  // Get the tripsit meta channel from the guild
  let channelTripsitmeta = {} as TextChannel;
  try {
    // log.debug(F, `guildData.channel_tripsitmeta: ${guildData.channel_tripsitmeta}`);
    if (guildData.channel_tripsitmeta) {
      channelTripsitmeta = await interaction.guild?.channels.fetch(guildData.channel_tripsitmeta) as TextChannel;
    }
  } catch (err) {
    // log.debug(F, `There was an error fetching the tripsit channel, it was likely deleted:\n ${err}`);
    // Update the ticket status to closed
    guildData.channel_tripsitmeta = null;
    // await database.guilds.set(guildData);
    await db.discord_guilds.update({
      where: {
        id: guildData.id,
      },
      data: {
        channel_tripsitmeta: null,
      },
    });
  }

  const metaPerms = await checkChannelPermissions(channelTripsitmeta, [
    'ViewChannel' as PermissionResolvable,
    'SendMessages' as PermissionResolvable,
    'SendMessagesInThreads' as PermissionResolvable,
    // 'CreatePublicThreads' as PermissionResolvable,
    'CreatePrivateThreads' as PermissionResolvable,
    // 'ManageMessages' as PermissionResolvable,
    'ManageThreads' as PermissionResolvable,
    // 'EmbedLinks' as PermissionResolvable,
  ]);
  if (!metaPerms.hasPermission) {
    log.error(F, `Missing TS channel permission ${channelPerms.permission} in ${channelTripsitmeta.name}!`);
    const guildOwner = await interaction.guild?.fetchOwner() as GuildMember;
    await guildOwner.send({
      content: stripIndents`Missing permissions in ${channelTripsitmeta}!
        In order to setup the tripsitting feature I need:
        View Channel - to see the channel
        Send Messages - to send messages
        Create Private Threads - to create private threads, when requested through the bot
        Send Messages in Threads - to send messages in threads
        Manage Threads - to delete threads when they're done
        `}); // eslint-disable-line
    log.error(F, `Missing permission ${metaPerms.permission} in ${tripsitChannel.name}!`);
    return;
  }

  log.debug(F, `Target: ${target.displayName} (${target.id})`);

  const userData = await db.users.upsert({
    where: {
      discord_id: target.id,
    },
    create: {
      discord_id: target.id,
    },
    update: {},
  });
  log.debug(F, `Target userData: ${userData.id}`);

  const ticketData = await db.user_tickets.findFirst({
    where: {
      user_id: userData.id,
      status: {
        not: {
          in: ['DELETED'],
        },
      },
    },
  });

  log.debug(F, `Target ticket data: ${JSON.stringify(ticketData, null, 2)}`);

  if (ticketData) {
    log.debug(F, `Target has tickets: ${JSON.stringify(ticketData, null, 2)}`);
    let threadHelpUser = {} as ThreadChannel;
    try {
      threadHelpUser = await interaction.guild?.channels.fetch(ticketData.thread_id) as ThreadChannel;
    } catch (err) {
      log.debug(F, 'There was an error updating the help thread, it was likely deleted');
      // Update the ticket statu s to closed

      await db.user_tickets.update({
        where: {
          id: ticketData.id,
        },
        data: {
          status: 'DELETED' as ticket_status,
          archived_at: ticketData.archived_at,
          deleted_at: ticketData.deleted_at,
        },
      });
      log.debug(F, 'Updated ticket status to DELETED');
      log.debug(F, `Ticket: ${JSON.stringify(ticketData, null, 2)}`);
    }

    log.debug(F, `ThreadHelpUser: ${threadHelpUser.name}`);

    if (threadHelpUser.id) {
      await interaction.deferReply({ ephemeral: true });
      await needsHelpMode(interaction, target);
      log.debug(F, 'Added needshelp to user');
      let roleTripsitter = {} as Role;
      let roleHelper = {} as Role;
      if (guildData.role_tripsitter) {
        roleTripsitter = await interaction.guild?.roles.fetch(guildData.role_tripsitter) as Role;
      }
      if (guildData.role_helper) {
        roleHelper = await interaction.guild?.roles.fetch(guildData.role_helper) as Role;
      }
      log.debug(F, `Helper Role : ${roleHelper.name}`);
      log.debug(F, `Tripsitter Role : ${roleTripsitter.name}`);

      // Remind the user that they have a channel open
      // const recipient = '' as string;

      const embed = embedTemplate()
        .setColor(Colors.DarkBlue)
        .setDescription(stripIndents`Hey ${interaction.member}, you have an open session!
  
        Check your channel list or click '${threadHelpUser.toString()} to get help!`);
      await interaction.editReply({ embeds: [embed] });
      log.debug(F, 'Told user they already have an open channel');
      // log.debug(F, `Rejected need for help`);

      // Check if the created_by is in the last 5 minutes
      const createdDate = new Date(ticketData.reopened_at ?? ticketData.created_at);
      const now = new Date();
      const diff = now.getTime() - createdDate.getTime();
      const minutes = Math.floor(diff / 1000 / 60);
      // const seconds = Math.floor(diff / 1000); // Uncomment this for dev server

      // Send the update message to the thread
      let helpMessage = stripIndents`Hey ${target}, thanks for asking for help, we can continue talking here! What's up?`;
      if (minutes > 5) {
        const helperStr = `and/or ${roleHelper}`;
        // log.debug(F, `Target has open ticket, and it was created over 5 minutes ago!`);
        helpMessage += `\n\nSomeone from the ${roleTripsitter} ${guildData.role_helper ? helperStr : ''} team will be with you as soon as they're available!`;
      }
      await threadHelpUser.send({
        content: helpMessage,
        allowedMentions: {
          // parse: showMentions,
          parse: ['users', 'roles'] as MessageMentionTypes[],
        },
      });
      log.debug(F, 'Pinged user in help thread');
      threadHelpUser.setName(`🧡│${target.displayName}'s channel!`);

      if (ticketData.meta_thread_id) {
        let metaMessage = '';
        if (minutes > 5) { // Switch to seconds > 10 for dev server
          const helperString = `and/or ${roleHelper}`;
          try {
            metaMessage = `Hey ${roleTripsitter} ${guildData.role_helper ? helperString : ''} team, ${target.toString()} has indicated they need assistance!`;
          } catch (err) {
            // If for example helper role has been deleted but the ID is still stored, do this
            metaMessage = `Hey ${roleTripsitter} team, ${target.toString()} has indicated they need assistance!`;
            log.error(F, `Stored Helper ID for guild ${guildData.id} is no longer valid. Role is unfetchable or deleted.`);
          }
        } else {
          metaMessage = `${target.toString()} has indicated they need assistance!`;
        }
        // Get the tripsit meta channel from the guild
        let metaThread = {} as ThreadChannel;
        try {
          if (ticketData.meta_thread_id) {
            metaThread = await interaction.guild?.channels.fetch(ticketData.meta_thread_id) as ThreadChannel;
          }
          metaThread.setName(`🧡│${target.displayName}'s discussion!`);
          await metaThread.send({
            content: metaMessage,
            allowedMentions: {
              // parse: showMentions,
              parse: ['users', 'roles'] as MessageMentionTypes[],
            },
          });
          log.debug(F, 'Pinged team in meta thread!');
        } catch (err) {
          // log.debug(F, `There was an error fetching the tripsit channel, it was likely deleted:\n ${err}`);
          // Update the ticket status to closed
          await db.user_tickets.update({
            where: {
              id: ticketData.id,
            },
            data: {
              meta_thread_id: null,
            },
          });
        }
      }

      ticketData.status = 'OPEN' as ticket_status;
      ticketData.reopened_at = new Date();
      ticketData.archived_at = env.NODE_ENV === 'production'
        ? DateTime.local().plus({ days: 7 }).toJSDate()
        : DateTime.local().plus({ minutes: 1 }).toJSDate();

      ticketData.deleted_at = env.NODE_ENV === 'production'
        ? DateTime.local().plus({ days: 14 }).toJSDate()
        : DateTime.local().plus({ minutes: 2 }).toJSDate();
      // await database.tickets.set(ticketData);

      await db.user_tickets.update({
        where: {
          id: ticketData.id,
        },
        data: {
          status: 'OPEN' as ticket_status,
          reopened_at: ticketData.reopened_at,
          archived_at: ticketData.archived_at,
          deleted_at: ticketData.deleted_at,
        },
      });

      return;
    }
  }

  await interaction.showModal(new ModalBuilder()
    .setCustomId(`tripsitmeSubmit~${interaction.id}`)
    .setTitle('Tripsitter Help Request')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(new TextInputBuilder()
          .setCustomId('triageInput')
          .setLabel('What substance? How much taken? How long ago?')
          .setMaxLength(120)
          .setStyle(TextInputStyle.Short)),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(new TextInputBuilder()
          .setCustomId('introInput')
          .setLabel('What\'s going on? Give us the details!')
          .setMaxLength(1100)
          .setStyle(TextInputStyle.Paragraph)),
    ));

  const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('tripsitmeSubmit');
  await interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;
      await i.deferReply({ ephemeral: true });
      const triage = i.fields.getTextInputValue('triageInput');
      const intro = i.fields.getTextInputValue('introInput');

      const threadHelpUser = await tripSitMe(i, target, triage, intro) as ThreadChannel;

      if (!threadHelpUser) {
        const embed = embedTemplate()
          .setColor(Colors.DarkBlue)
          .setDescription(stripIndents`Hey ${interaction.member}, there was an error creating your help thread! The Guild owner should get a message with specifics!`);
        await i.editReply({ embeds: [embed] });
        return;
      }

      const replyMessage = stripIndents`
      Hey ${target}, thank you for asking for assistance!
      
      Click here to be taken to your private room: ${threadHelpUser.toString()}
  
      You can also click in your channel list to see your private room!`;
      const embed = embedTemplate()
        .setColor(Colors.DarkBlue)
        .setDescription(replyMessage);
      try {
        await i.editReply({ embeds: [embed] });
      } catch (err) {
        log.error(F, `There was an error responding to the user! ${err}`);
        log.error(F, `Error: ${JSON.stringify(err, null, 2)}`);
      }
    });
}
