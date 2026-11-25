/* eslint-disable max-len */
import { discord_guilds, ticket_status, user_tickets } from '@db/tripbot';
import { stripIndents } from 'common-tags';
import {
  ButtonStyle,
  ChannelType,
  MessageFlags,
  TextInputStyle,
} from 'discord-api-types/v10';
import {
  ActionRowBuilder,
  AllowedThreadTypeForTextChannel,
  ButtonBuilder,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Colors,
  Guild,
  GuildMember,
  Message,
  // ChatInputCommandInteraction,
  // PermissionsBitField,
  // TextChannel,
  // MessageFlags,
  MessageMentionTypes,
  MessageReaction,
  ModalBuilder,
  ModalSubmitInteraction,
  PermissionResolvable,
  Role,
  TextChannel,
  TextInputBuilder,
  ThreadChannel,
  User,
  LabelBuilder,
} from 'discord.js';
import { DateTime } from 'luxon';
import { getOrCreateGuild, getOrCreateUser } from '../../global/utils/dbRecords';
import { getOpenTicket, ticketExpiryDates } from '../../global/utils/tickets';
import {
  ensurePermissions, TRIPSIT_CHANNEL_PERMS, tripsitChannelOwnerMessage,
} from './checkPermissions';
import commandCooldown from './commandCooldown';
import commandContext from './context';
import { embedTemplate } from './embedTemplate';
import { replyGuildOnly } from './guildOnly';
import {
  TEAM_ROLES, TRIPSITME_COLOR_ROLES, TRIPSITME_MINDSET_ROLES, TRIPSITME_OTHER_ROLES,
} from './roleGroups';
import {
  retagTicketChannelName, setTicketChannelName,
  ticketIcons,
  TicketIconStatus,
} from './ticketIcons';
import { awaitModal } from './awaitModal';
import { tripSitReminderState } from './tripsitResponseReminder';

const F = f(__filename);
const REMOVED_THREAD_ERROR = 'Ticket thread was already removed';

const teamRoles = TEAM_ROLES;
const colorRoles = TRIPSITME_COLOR_ROLES;
const mindsetRoles = TRIPSITME_MINDSET_ROLES;
const otherRoles = TRIPSITME_OTHER_ROLES;

const ignoredRoles = `${teamRoles},${colorRoles},${mindsetRoles},${otherRoles}`;

const memberOnly = 'This must be performed by a member of a guild!';

function ticketChannelName(
  status: TicketIconStatus,
  displayName: string,
  thread: 'channel' | 'discussion',
): string {
  return `${ticketIcons[status]}│${displayName}'s ${thread}!`;
}

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
* As the system, archive the ticket 3 days after its lifecycle timer is set
* As the system, delete the ticket and metadata threads after 6 days
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
  const guildData = await getOrCreateGuild(guild.id);

  if (!await ensurePermissions(guild, ['ManageRoles' as PermissionResolvable], F)) return;

  let roleNeedshelp = {} as Role;
  if (guildData.role_needshelp) {
    try {
      roleNeedshelp = await guild.roles.fetch(guildData.role_needshelp) as Role;
    } catch {
      const guildOwner = await guild.fetchOwner();
      await guildOwner.send({ content: `The 'needshelp' role has been deleted, please remake the #tripsit channel with the new role!` }); // eslint-disable-line
      return;
    }
  }

  // Save the user's roles to the DB
  await target.fetch();
  const targetRoleIds = target.roles.cache.map(role => role.id);

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
        log.error(F, `Missing permission 'ManageRoles' in ${interaction.guild}! Sent the guild owner a DM!`);
      }
    });
  }

  // Add the needsHelp role to the target
  try {
    await target.roles.add(roleNeedshelp);
    log.debug(F, `${roleNeedshelp.name} (${roleNeedshelp.id}) added to ${target.displayName} (${target.id})`);
  } catch {
    const guildOwner = await interaction.guild?.fetchOwner();
    await guildOwner?.send({
      content: stripIndents`There was an error adding the ${roleNeedshelp.name} role to ${target.displayName}!
          Please make sure I have the Manage Roles permission, or put this role below mine so I can give it to people!
          If there's any questions please contact Moonbear#1024 on TripSit!` }); // eslint-disable-line
    log.error(F, `Missing permission 'ManageRoles' in ${interaction.guild}! Sent the guild owner a DM!`);
  }
  log.debug(F, 'Finished needshelp mode');
}

/**
 * Handles the Own button
 * @param {ButtonInteraction} interaction
 * */
function userCloseButton(targetId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`tripsitmeUserClose~${targetId}`)
        .setLabel('I\'m good now!')
        .setStyle(ButtonStyle.Success),
    );
}

function tripsitterButtons(
  targetId: string,
  { includeMeta }: { includeMeta: boolean },
): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`tripsitmeOwned~${targetId}`)
        .setLabel('Owned')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`tripsitmeTeamClose~${targetId}`)
        .setLabel('They\'re good now!')
        .setStyle(ButtonStyle.Success),
    );

  if (includeMeta) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`tripsitmeMeta~${targetId}`)
        .setLabel('Create thread')
        .setStyle(ButtonStyle.Secondary),
    );
  }

  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`tripsitmeBackup~${targetId}`)
      .setLabel('I need backup')
      .setStyle(ButtonStyle.Danger),
  );

  return row;
}

export async function tripsitmeOwned(
  interaction:ButtonInteraction,
) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  if (!interaction.guild) {
    await replyGuildOnly(interaction);
    return;
  }
  const userId = interaction.customId.split('~')[1];
  const actor = interaction.member as GuildMember;

  const target = await interaction.guild.members.fetch(userId);

  if (target.id === actor.id) {
    await interaction.editReply({ content: "You can't own your own ticket!" });
    return;
  }

  const userData = await getOrCreateUser(userId);

  const ticketData = await getOpenTicket(userData.id);

  const guildData = await getOrCreateGuild(interaction.guild?.id);

  if (!ticketData) {
    const rejectMessage = `Hey ${interaction.member as GuildMember}, ${target.displayName} does not have an open session!`;
    const embed = embedTemplate().setColor(Colors.DarkBlue);
    embed.setDescription(rejectMessage);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const metaChannelId = ticketData.meta_thread_id ?? guildData.channel_tripsitmeta;
  if (metaChannelId) {
    let metaChannel = {} as TextChannel;
    try {
      metaChannel = await interaction.guild.channels.fetch(metaChannelId) as TextChannel;
    } catch {
      // Meta channel deleted
    }

    if (metaChannel.id) {
      if (!await ensurePermissions(metaChannel, ['SendMessages' as PermissionResolvable], F)) return;

      await metaChannel.send({
        content: stripIndents`${actor.displayName} has indicated that ${target.toString()} is receiving help!`,
      });
      if (metaChannelId !== guildData.channel_tripsitmeta) {
        setTicketChannelName(metaChannel, ticketChannelName('inProgress', target.displayName, 'discussion'));
      }
    }
  }

  // Update the ticket's name
  try {
    if (!ticketData.thread_id) throw new Error(REMOVED_THREAD_ERROR);
    const channel = await interaction.guild.channels.fetch(ticketData.thread_id) as TextChannel;
    setTicketChannelName(channel, ticketChannelName('inProgress', target.displayName, 'channel'));
  } catch {
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
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  if (!interaction.guild) {
    await replyGuildOnly(interaction);
    return;
  }
  const userId = interaction.customId.split('~')[1];
  const actor = interaction.member as GuildMember;
  const target = await interaction.guild.members.fetch(userId);

  if (!interaction.channel) {
    await interaction.editReply('This must be performed in a channel!');
    return;
  }
  if (!interaction.member) {
    await interaction.editReply('This must be performed by a member!');
    return;
  }

  const userData = await getOrCreateUser(userId);

  const ticketData = await getOpenTicket(userData.id);

  if (!ticketData) {
    const rejectMessage = `Hey ${(interaction.member as GuildMember).displayName}, ${target.displayName} does not have an open session!`;
    const embed = embedTemplate().setColor(Colors.DarkBlue);
    embed.setDescription(rejectMessage);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const channel = interaction.channel as TextChannel;
  const metaChannel = await channel.threads.create(
    {
      name: ticketChannelName('inProgress', target.displayName, 'discussion'),
      autoArchiveDuration: 1440,
      type: ChannelType.PrivateThread as AllowedThreadTypeForTextChannel,
      reason: `${actor.displayName} created meta thread for ${target.displayName}`,
      invitable: false,
    },
  );

  ticketData.meta_thread_id = metaChannel.id;

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

      **Read the log before interacting**
      Use this channel coordinate efforts.

      **No one is qualified to handle suicidal users here**
      If the user is considering / talking about suicide, direct them to the suicide hotline!

      **Do not engage in DM**
      Keep things in the open where you have the team's support!
      `)
    .setFooter({ text: 'If you need help click the Backup button to summon Helpers and Tripsitters' });

  const endSession = tripsitterButtons(target.id, { includeMeta: false });

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
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  if (!interaction.guild) {
    await replyGuildOnly(interaction);
    return;
  }
  if (!interaction.channel) {
    await interaction.editReply('This must be performed in a channel!');
    return;
  }
  const userId = interaction.customId.split('~')[1];
  const actor = interaction.member as GuildMember;
  const target = await interaction.guild.members.fetch(userId);

  const userData = await getOrCreateUser(userId);

  const ticketData = await getOpenTicket(userData.id);

  if (!ticketData) {
    const rejectMessage = `Hey ${interaction.member as GuildMember}, ${target.displayName} does not have an open session!`;
    const embed = embedTemplate().setColor(Colors.DarkBlue);
    embed.setDescription(rejectMessage);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const guildData = await getOrCreateGuild(interaction.guild?.id);

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
    } catch {
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
  } else if (interaction.channel instanceof TextChannel) {
    await interaction.channel.send(backupMessage);
  } else {
    log.error(F, 'Cannot send a message in this channel type!');
  }

  await interaction.editReply({ content: 'Backup message sent!' });
}

type TicketData = NonNullable<Awaited<ReturnType<typeof getOpenTicket>>>;
type GuildData = Awaited<ReturnType<typeof getOrCreateGuild>>;
type UserData = Awaited<ReturnType<typeof getOrCreateUser>>;

/** Tells the team's meta channel (or thread) that the user no longer needs help. */
async function announceTeamClose(
  guild: Guild,
  ticketData: TicketData,
  guildData: GuildData,
  actor: GuildMember,
  target: GuildMember | null,
): Promise<void> {
  const metaChannelId = ticketData.meta_thread_id ?? guildData.channel_tripsitmeta;
  /* v8 ignore next -- a ticket always has a meta thread or the guild has a meta channel */
  if (!metaChannelId) return;
  try {
    const metaChannel = await guild.channels.fetch(metaChannelId) as TextChannel;
    await metaChannel.send({
      content: stripIndents`${actor.displayName} has indicated that ${target ? target.displayName : 'this user'} no longer needs help!`,
    });
    if (metaChannelId !== guildData.channel_tripsitmeta) {
      await setTicketChannelName(metaChannel, retagTicketChannelName(metaChannel.name, 'resolved'));
    }
  } catch {
    if (metaChannelId === ticketData.meta_thread_id) {
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
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const targetId = interaction.customId.split('~')[1];

  let target = null as GuildMember | null;
  try {
    target = await interaction.guild.members.fetch(targetId);
  } catch {
    // The target may have left the guild; continue without them.
  }

  const actor = interaction.member as GuildMember;

  if (targetId === actor.id && actor.id !== env.DISCORD_OWNER_ID) {
    await interaction.editReply({ content: 'You should not be able to see this button!' });
    return;
  }

  const userData = await getOrCreateUser(targetId);

  const ticketData = await getOpenTicket(userData.id);

  const guildData = await getOrCreateGuild(interaction.guild?.id);

  if (!ticketData || Object.entries(ticketData).length === 0) {
    const rejectMessage = `Hey ${(interaction.member as GuildMember).displayName}, ${target ? target.displayName : 'this user'} does not have an open session!`;
    const embed = embedTemplate().setColor(Colors.DarkBlue);
    embed.setDescription(rejectMessage);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // Get the channel objects for the help thread
  let threadHelpUser = {} as ThreadChannel;
  try {
    if (!ticketData.thread_id) throw new Error(REMOVED_THREAD_ERROR);
    threadHelpUser = await interaction.guild.channels.fetch(ticketData.thread_id) as ThreadChannel;

    // The target may have left the guild, so keep the rest of the existing name
    await setTicketChannelName(threadHelpUser, retagTicketChannelName(threadHelpUser.name, 'resolved'));
  } catch {
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

  const row = userCloseButton(targetId);

  await threadHelpUser.send({
    content: closeMessage,
    components: [row],
  });

  await announceTeamClose(interaction.guild, ticketData, guildData, actor, target);

  // Update the ticket status to resolved
  ticketData.status = 'RESOLVED' as ticket_status;
  const teamCloseExpiry = ticketExpiryDates();
  ticketData.archived_at = teamCloseExpiry.archivedAt;
  ticketData.deleted_at = teamCloseExpiry.deletedAt;

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

  await interaction.editReply({ content: 'Done!' });
}

/** Fetches the team's meta channel. If it can't be fetched (it was likely deleted) the setting is cleared. */
async function fetchMetaChannel(guild: Guild, guildData: GuildData): Promise<TextChannel> {
  let channel = {} as TextChannel;
  if (!guildData.channel_tripsitmeta) return channel;
  try {
    channel = await guild.channels.fetch(guildData.channel_tripsitmeta) as TextChannel;
  } catch {
    // The meta channel was likely deleted, so forget about it
    await db.discord_guilds.update({
      where: {
        id: guildData.id,
      },
      data: {
        channel_tripsitmeta: null,
      },
    });
  }
  return channel;
}

/** Takes the needshelp role off the user (when I'm allowed to), returning the role for the guild. */
async function removeNeedsHelpRole(
  guild: Guild,
  botUserId: string,
  guildData: GuildData,
  target: GuildMember,
): Promise<Role> {
  let roleNeedshelp = {} as Role;
  if (guildData.role_needshelp) {
    try {
      roleNeedshelp = await guild.roles.fetch(guildData.role_needshelp) as Role;
      const myMember = await guild.members.fetch(botUserId);
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
    log.debug(F, `${guild.name} does not have a needshelp role!`);
  }
  return roleNeedshelp;
}

/** Gives a user back the roles that were saved when they asked for help. */
async function restoreOldRoles(
  guild: Guild,
  botUserId: string,
  target: GuildMember,
  userData: UserData,
  roleNeedshelp: Role,
): Promise<void> {
  // Patch for BlueLight: Since we didn't remove roles, don't re-add them
  if (!userData.roles || target.guild.id === env.DISCORD_BL_ID) return;

  const myMember = await guild.members.fetch(botUserId);
  const myRole = myMember.roles.highest;
  const targetRoles:string[] = userData.roles.split(',');

  log.debug(F, `Adding ${targetRoles.length} old roles to ${target.displayName} (${target.id})`);

  // readd each role to the target
  if (targetRoles.length > 0) {
    // Read once so the narrowing from the guild check above carries into the async callback
    const roleGuild = guild;
    await Promise.all(targetRoles.map(async roleId => {
      // Roles saved from another guild, or since deleted, are skipped
      const roleObj = await roleGuild.roles.fetch(roleId).catch(() => null);
      if (!roleObj) {
        log.debug(F, `Role ${roleId} does not exist in this guild, skipping!`);
        return;
      }

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
        log.error(F, `${roleObj.name} could not be added to ${target.displayName} (${target.id}) in ${roleGuild}!`);
      }
    }));
  }
}

/** Tells the team's meta channel (or thread) that the user says they no longer need help. */
async function announceUserClose(
  guild: Guild,
  ticketData: TicketData,
  guildData: GuildData,
  actor: GuildMember,
  target: GuildMember,
  override: boolean,
): Promise<void> {
  const metaChannelId = ticketData.meta_thread_id ?? guildData.channel_tripsitmeta;
  /* v8 ignore next -- a ticket always has a meta thread or the guild has a meta channel */
  if (!metaChannelId) return;
  try {
    const metaChannel = await guild.channels.fetch(metaChannelId) as TextChannel;
    // When a helper turns tripsit mode off for someone, the person who needed help is not the one acting
    const content = override
      ? `${actor.displayName} has turned off tripsit mode for ${target.displayName}!`
      : `${actor.displayName} has indicated that they no longer need help!`;
    await metaChannel.send({ content: stripIndents`${content}` });
    if (metaChannelId !== guildData.channel_tripsitmeta) {
      setTicketChannelName(metaChannel, ticketChannelName('closed', target.displayName, 'discussion'));
    }
  } catch {
    // Meta thread likely doesn't exist
    if (metaChannelId === ticketData.meta_thread_id) {
      Object.assign(ticketData, { meta_thread_id: null });
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
    await interaction.reply({ content: cooldown.message, flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.deferReply({ });

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

  const userData = await getOrCreateUser(target.id);

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

  const guildData = await getOrCreateGuild(interaction.guild?.id);

  if (!ticketData) {
    log.debug(F, `${actor.displayName} does not have any tickets that are not closed or deleted`);
    const rejectMessage = stripIndents`Hey ${actor.displayName}, you do not have an open session!
    If you need help, please click the button again!`;
    const embed = embedTemplate().setColor(Colors.DarkBlue);
    embed.setDescription(rejectMessage);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  log.debug(F, `Found ticket in ${ticketData.status} status`);

  // Remove the needshelp role
  const roleNeedshelp = await removeNeedsHelpRole(interaction.guild, interaction.client.user.id, guildData, target);

  // Get the meta room, if it exists
  let channelTripsitmeta = {} as TextChannel;
  channelTripsitmeta = await fetchMetaChannel(interaction.guild, guildData);

  // Re-add old roles
  await restoreOldRoles(interaction.guild, interaction.client.user.id, target, userData, roleNeedshelp);

  // Roles are only kept in the database while a ticket is open
  if (userData.roles) {
    await db.users.update({ where: { id: userData.id }, data: { roles: null } });
  }

  // Change the channel icon
  let threadHelpUser = {} as ThreadChannel;
  try {
    if (!ticketData.thread_id) throw new Error(REMOVED_THREAD_ERROR);
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
  }

  if (threadHelpUser.archived) {
    await threadHelpUser.setArchived(false);
    log.debug(F, `Un-archived ${threadHelpUser.name}`);
  }

  // Let the meta channel know the user has been helped
  await announceUserClose(interaction.guild, ticketData, guildData, actor, target, override);

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
      const validEmojis = ['🙁', '😕', '😐', '🙂', '😁'];

      await Promise.all(validEmojis.map(emoji => msg.react(emoji)));

      // Setup the reaction collector
      const filter = (reaction:MessageReaction, user:User) => user.id === target.id && validEmojis.includes(reaction.emoji.name ?? '');
      const collector = message.createReactionCollector({ filter, time: 0 });
      collector.on('collect', async reaction => {
        await threadHelpUser.send(stripIndents`
          ${emojiGet('Invisible')}
          > Thank you for your feedback, here's a cookie! 🍪
          ${emojiGet('Invisible')}
          `);
        const finalEmbed = embedTemplate()
          .setColor(Colors.Blue)
          .setDescription(`Collected ${reaction.emoji.name} from ${threadHelpUser}`);
        try {
          await channelTripsitmeta.send({ embeds: [finalEmbed] });
        } catch {
          // The channel may have been deleted or become unavailable.
        }
        msg.delete();
        collector.stop();
      });
    });

  // Do this last because it looks weird to have it happen in-between messages
  setTicketChannelName(threadHelpUser, ticketChannelName('closed', target.displayName, 'channel'));

  // Update the ticket status to closed
  ticketData.status = 'CLOSED' as ticket_status;
  const userCloseExpiry = ticketExpiryDates();
  ticketData.archived_at = userCloseExpiry.archivedAt;
  ticketData.deleted_at = userCloseExpiry.deletedAt;

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

async function fetchTicketRole(guild: Guild, roleId: string | null): Promise<Role> {
  if (!roleId) return {} as Role;
  return await guild.roles.fetch(roleId) as Role;
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

  // Lookup guild information for variables
  if (!interaction.guild) {
    await replyGuildOnly(interaction);
    return null;
  }
  if (!interaction.member) {
    await interaction.editReply(memberOnly);
    return null;
  }

  const cooldown = await commandCooldown(interaction.user, interaction.customId);

  if (!cooldown.success && cooldown.message) {
    await interaction.editReply(cooldown.message);
  }

  const guildData = await getOrCreateGuild(interaction.guild?.id);

  // let backupMessage = 'Hey ';
  // Get the roles we'll be referencing
  const roleTripsitter = await fetchTicketRole(interaction.guild, guildData.role_tripsitter);
  const roleHelper = await fetchTicketRole(interaction.guild, guildData.role_helper);
  const channelTripsitmeta = await fetchMetaChannel(interaction.guild, guildData);
  log.debug(F, `roleTripsitter: ${roleTripsitter.name} (${roleTripsitter.id})`);
  log.debug(F, `roleHelper: ${roleHelper.name} (${roleHelper.id})`);
  log.debug(F, `channelTripsitmeta: ${channelTripsitmeta.name} (${channelTripsitmeta.id})`);

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

  await needsHelpMode(interaction, target);

  // Get the tripsit channel from the guild
  let tripsitChannel = {} as TextChannel;
  try {
    if (guildData.channel_tripsit) {
      tripsitChannel = await interaction.guild.channels.fetch(guildData.channel_tripsit) as TextChannel;
    }
  } catch {
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
    await interaction.editReply({ content: 'No tripsit channel found! Make sure to run /setup tripsit' });
    return null;
  }

  // The team announcement below needs the meta channel, so stop before creating a thread that would be orphaned
  if (!channelTripsitmeta.id) {
    await interaction.editReply({ content: 'No tripsit meta channel found! Make sure to run /setup tripsit' });
    return null;
  }

  // Create a new thread in the channel
  // If we're not in production we need to create a public thread
  const threadHelpUser = await tripsitChannel.threads.create({
    name: ticketChannelName('new', target.displayName, 'channel'),
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

  const row = userCloseButton(target.id);
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

  const endSession = tripsitterButtons(target.id, { includeMeta: true });

  await channelTripsitmeta.send({
    embeds: [embedTripsitter],
    components: [endSession],
    allowedMentions: {
      // parse: showMentions,
      parse: ['users', 'roles'] as MessageMentionTypes[],
    },
  });

  const { archivedAt: archiveTime, deletedAt: deleteTime } = ticketExpiryDates();

  log.debug(F, `Ticket archives on ${DateTime.fromJSDate(archiveTime).toLocaleString(DateTime.DATETIME_FULL)} deletes on ${DateTime.fromJSDate(deleteTime).toLocaleString(DateTime.DATETIME_FULL)}`);

  const userData = await getOrCreateUser(target.id);

  // Set ticket information. What the user took and their issue stay in the Discord thread, not the database.
  const newTicketData = {
    user_id: userData.id,
    thread_id: threadHelpUser.id,
    type: 'TRIPSIT',
    status: 'OPEN',
    first_message_id: '',
    archived_at: archiveTime,
    deleted_at: deleteTime,
  } as user_tickets;

  // Update the ticket in the DB
  await db.user_tickets.create({
    data: {
      user_id: newTicketData.user_id,
      thread_id: newTicketData.thread_id,
      type: newTicketData.type,
      status: newTicketData.status,
      first_message_id: newTicketData.first_message_id,
      archived_at: newTicketData.archived_at,
      deleted_at: newTicketData.deleted_at,
      ...tripSitReminderState('TRIPSIT', 'OPEN', threadHelpUser.createdAt ?? undefined),
    },
  });

  return threadHelpUser;
}

interface ReopenTicketOptions {
  interaction: ButtonInteraction | ChatInputCommandInteraction;
  target: GuildMember;
  guildData: discord_guilds;
  ticketData: user_tickets;
  threadHelpUser: ThreadChannel;
  helpMessage: string;
  metaSubject: string;
  /** OWNED when the team reopened it themselves, since someone's clearly already on it */
  status?: 'OPEN' | 'OWNED';
}

/**
 * Shared steps for reopening an existing ticket: pings the help thread (and meta thread, if any),
 * renames the channels, and sets the ticket back to OPEN (or OWNED) with fresh expiry dates.
 */
export async function reopenTicket({
  interaction, target, guildData, ticketData, threadHelpUser, helpMessage, metaSubject, status = 'OPEN',
}: ReopenTicketOptions): Promise<user_tickets> {
  const reopenedAt = new Date();
  const iconStatus: TicketIconStatus = status === 'OWNED' ? 'inProgress' : 'reopened';
  let roleTripsitter = {} as Role;
  let roleHelper = {} as Role;
  if (guildData.role_tripsitter) {
    roleTripsitter = await interaction.guild?.roles.fetch(guildData.role_tripsitter) as Role;
  }
  if (guildData.role_helper) {
    roleHelper = await interaction.guild?.roles.fetch(guildData.role_helper) as Role;
  }

  // Check if the created_by is in the last 5 minutes
  const createdDate = new Date(ticketData.reopened_at ?? ticketData.created_at);
  const now = new Date();
  const diff = now.getTime() - createdDate.getTime();
  const minutes = Math.floor(diff / 1000 / 60);

  let finalHelpMessage = helpMessage;
  if (minutes > 5) {
    const helperStr = `and/or ${roleHelper}`;
    finalHelpMessage += `\n\nSomeone from the ${roleTripsitter} ${guildData.role_helper ? helperStr : ''} team will be with you as soon as they're available!`;
  }

  const row = userCloseButton(target.id);
  await threadHelpUser.send({
    content: finalHelpMessage,
    components: [row],
    allowedMentions: {
      parse: ['users', 'roles'] as MessageMentionTypes[],
    },
  });
  setTicketChannelName(threadHelpUser, ticketChannelName(iconStatus, target.displayName, 'channel'));

  if (ticketData.meta_thread_id) {
    let metaMessage = '';
    if (minutes > 5) { // Switch to seconds > 10 for dev server
      const helperString = `and/or ${roleHelper}`;
      metaMessage = `Hey ${roleTripsitter} ${guildData.role_helper ? helperString : ''} team, ${metaSubject}`;
    } else {
      metaMessage = metaSubject;
    }
    // Get the tripsit meta channel from the guild
    try {
      const metaThread = await interaction.guild?.channels.fetch(ticketData.meta_thread_id) as ThreadChannel;
      setTicketChannelName(metaThread, ticketChannelName(iconStatus, target.displayName, 'discussion'));
      await metaThread.send({
        content: metaMessage,
        allowedMentions: {
          parse: ['users', 'roles'] as MessageMentionTypes[],
        },
      });
    } catch {
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

  const { archivedAt, deletedAt } = ticketExpiryDates();

  return db.user_tickets.update({
    where: {
      id: ticketData.id,
    },
    data: {
      status: status as ticket_status,
      reopened_at: reopenedAt,
      ...tripSitReminderState(ticketData.type, status, reopenedAt),
      archived_at: archivedAt,
      deleted_at: deletedAt,
    },
  });
}

export async function tripsitmeButton(
  interaction:ButtonInteraction,
) {
  log.info(F, await commandContext(interaction));
  const target = interaction.member as GuildMember;

  const cooldown = await commandCooldown(interaction.user, interaction.customId);

  if (!cooldown.success && cooldown.message) {
    await interaction.reply({ content: cooldown.message, flags: MessageFlags.Ephemeral });
    return;
  }

  // log.debug(F, `target: ${JSON.stringify(target, n ull, 2)}`);

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

  if (!await ensurePermissions(tripsitChannel, TRIPSIT_CHANNEL_PERMS, F, {
    ownerMessage: () => tripsitChannelOwnerMessage(tripsitChannel, false),
  })) return;

  // Get the tripsit meta channel from the guild
  let channelTripsitmeta = {} as TextChannel;
  try {
    if (guildData.channel_tripsitmeta) {
      channelTripsitmeta = await interaction.guild?.channels.fetch(guildData.channel_tripsitmeta) as TextChannel;
    }
  } catch {
    // log.debug(F, `There was an error fetching the tripsit channel, it was likely deleted:\n ${err}`);
    // Update the ticket status to closed
    guildData.channel_tripsitmeta = null;
    await db.discord_guilds.update({
      where: {
        id: guildData.id,
      },
      data: {
        channel_tripsitmeta: null,
      },
    });
  }

  if (!await ensurePermissions(channelTripsitmeta, TRIPSIT_CHANNEL_PERMS, F, {
    ownerMessage: () => tripsitChannelOwnerMessage(channelTripsitmeta, true),
  })) return;

  log.debug(F, `Target: ${target.displayName} (${target.id})`);

  const userData = await getOrCreateUser(target.id);
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
      if (!ticketData.thread_id) throw new Error(REMOVED_THREAD_ERROR);
      threadHelpUser = await interaction.guild?.channels.fetch(ticketData.thread_id) as ThreadChannel;
    } catch {
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
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await needsHelpMode(interaction, target);
      log.debug(F, 'Added needshelp to user');

      // Remind the user that they have a channel open
      const embed = embedTemplate()
        .setColor(Colors.DarkBlue)
        .setDescription(stripIndents`Hey ${interaction.member as GuildMember}, you have an open session!

        Check your channel list or click '${threadHelpUser.toString()} to get help!`);
      await interaction.editReply({ embeds: [embed] });
      log.debug(F, 'Told user they already have an open channel');

      await reopenTicket({
        interaction,
        target,
        guildData,
        ticketData,
        threadHelpUser,
        helpMessage: stripIndents`Hey ${target}, thanks for asking for help, we can continue talking here! What's up?`,
        metaSubject: `${target.toString()} has indicated they need assistance!`,
      });

      return;
    }
  }

  await interaction.showModal(new ModalBuilder()
    .setCustomId(`tripsitmeSubmit~${interaction.id}`)
    .setTitle('Tripsitter Help Request')
    .addLabelComponents(
      new LabelBuilder().setLabel('What substance? How much taken? How long ago?').setTextInputComponent(new TextInputBuilder()
        .setCustomId('triageInput')

        .setMaxLength(120)
        .setStyle(TextInputStyle.Short)),
      new LabelBuilder().setLabel('What\'s going on? Give us the details!').setTextInputComponent(new TextInputBuilder()
        .setCustomId('introInput')

        .setMaxLength(1100)
        .setStyle(TextInputStyle.Paragraph)),
    ));

  const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('tripsitmeSubmit') && i.customId.split('~')[1] === interaction.id;
  await awaitModal(interaction, filter)
    .then(async i => {
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      const triage = i.fields.getTextInputValue('triageInput');
      const intro = i.fields.getTextInputValue('introInput');

      const threadHelpUser = await tripSitMe(i, target, triage, intro) as ThreadChannel;

      if (!threadHelpUser) {
        const embed = embedTemplate()
          .setColor(Colors.DarkBlue)
          .setDescription(stripIndents`Hey ${interaction.member as GuildMember}, there was an error creating your help thread! The Guild owner should get a message with specifics!`);
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
