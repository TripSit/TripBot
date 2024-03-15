/* eslint-disable sonarjs/no-small-switch */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
  MessageMentionTypes,
  ChatInputCommandInteraction,
  PermissionResolvable,
  AllowedThreadTypeForTextChannel,
  Channel,
  DiscordErrorData,
  ChannelSelectMenuInteraction,
  StringSelectMenuInteraction,
  RoleSelectMenuInteraction,
  InteractionEditReplyOptions,
  SlashCommandBuilder,
  UserSelectMenuInteraction,
  ChannelSelectMenuBuilder,
  PermissionFlagsBits,
  RoleSelectMenuBuilder,
  UserSelectMenuBuilder,
  StringSelectMenuBuilder,
  GuildTextBasedChannel,
  EmbedBuilder,
  UserSelectMenuComponent,
  time,
} from 'discord.js';
import {
  TextInputStyle,
  ChannelType,
  ButtonStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { DateTime, Duration } from 'luxon';
import {
  $Enums,
  session_data,
  ticket_status, ticket_type, user_tickets, users,
} from '@prisma/client';
import commandContext from '../../utils/context';
import { checkChannelPermissions, checkGuildPermissions } from '../../utils/checkPermissions';
import { SlashCommand } from '../../@types/commandDef';
import { SessionData } from '../../../global/@types/global';
import { getComponentById } from '../global/d.ai';

const F = f(__filename);

/* TODO
* AI summary of the thread
* Stats page
* If no one responds after 5 minutes or so, suggest an AI tripsitter
* Make sure Helper system still works
*/

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
* As a team member, Backup button works
  Click the Backup button
  Bot sends a notification to the channel that you need help

# End
* As a team member, prompt to end ticket
  Click the "they're good now" button
  Bot responds "Hey <user>, it looks like you're doing somewhat better!"
  Bot responds with a button that lets the user close the session
  Bot updates the name of the channel with a blue heart
* As a user, end ticket
  Click the "im good now"
  Bot updates the name of the channel with a green heart
  - On most guilds your roles are returned
  - On BL your roles are not removed
* As the system, archive the ticket after a period of time
  After 7 days since the user last talked, the channel is archived
* As the system, delete the ticket after a period of time
  After 14 days since the user last talked, the channel is deleted
*/

namespace text {
  export function deleteDuration() {
    return env.NODE_ENV === 'production'
      ? { days: 13.9 } // Needs to be under 14 days
      : { seconds: 1000 };
  }

  export function archiveDuration() {
    return env.NODE_ENV === 'production'
      ? { days: 7 }
      : { seconds: 500 };
  }

  export function statusEmoji(
    status: 'OPEN' | 'OWNED' | 'SOFT_CLOSED' | 'HARD_CLOSED' | 'ARCHIVED',
  ) {
    switch (status) {
      case 'OPEN':
        return '🌟';
      case 'OWNED':
        return '🏠';
      case 'SOFT_CLOSED':
        return '👍';
      case 'HARD_CLOSED':
        return '✅';
      case 'ARCHIVED':
        return '📦';
      default:
        return '❓';
    }
  }

  export function threadName(
    target: GuildMember,
    status: 'OPEN' | 'OWNED' | 'SOFT_CLOSED' | 'HARD_CLOSED' | 'ARCHIVED',
  ) {
    return `${text.statusEmoji(status)}│${target.displayName}'s session`;
  }

  export function guildOnly() {
    return 'This must be performed in a guild!';
  }

  export function memberOnly() {
    return 'This must be performed by a member of a guild!';
  }

  export function title() {
    return '**Need to talk with a TripSitter? Click the button below!**';
  }

  export function description() {
    return stripIndents`
    **Need mental health support?**
    Check out [Huddle Humans](https://discord.gg/mentalhealth), a mental health universe!

    **Want professional mental health advisors?**
    The [Warmline Directory](https://warmline.org/warmdir.html#directory) provides non-crisis mental health support and guidance from trained volunteers (US Only).

    **Looking for voice chat?**
    The wonderful people at the [Fireside project](https://firesideproject.org) can also help you through a rough trip! (US Only)
  
    **Having an emergency?**
    We're not doctors: If you are in a medical emergency, please contact emergency medical services.

    **Are you suicidal?**
    If you're having suicidal thoughts please contact your [local hotline](https://en.wikipedia.org/wiki/List_of_suicide_crisis_lines).
    `;
  }

  export function footer() {
    return '🛑 Please do not message anyone directly! 🛑';
  }

  export function buttonText() {
    return 'I want to talk with a tripsitter!';
  }

  export function buttonEmoji() {
    return '⭐';
  }

  export function rateOne() {
    return '🙁';
  }

  export function rateTwo() {
    return '😕';
  }

  export function rateThree() {
    return '😐';
  }

  export function rateFour() {
    return '🙂';
  }

  export function rateFive() {
    return '😁';
  }

}

namespace timer {
  export async function archiveTickets() {
    // Process tickets
    // Remember: The archived_at value is set ahead of time and determines the future time the thread will be archived
    // So we get a list of all tickets that have this date in the past
    const ticketData = await db.user_tickets.findMany({
      where: {
        archived_at: {
          not: undefined,
          lte: new Date(), // Less than or equal to now
        },
        status: { notIn: ['DELETED', 'ARCHIVED', 'PAUSED'] },
      },
    });

    // log.debug(F, `[archiveTickets] archiveTicketData: ${JSON.stringify(ticketData, null, 2)}`);

    // Get the log channel
    // Loop through each ticket
    if (ticketData.length > 0) {
      ticketData.forEach(async ticket => {
        log.debug(F, `[archiveTickets] Archiving ticket ${ticket.id}...`);

        // Update the ticket in the database
        await db.user_tickets.update({
          where: { id: ticket.id },
          data: {
            status: 'ARCHIVED' as ticket_status,
            deleted_at: DateTime.utc().plus(text.deleteDuration()).toJSDate(),
          },
        });
        log.debug(F, '[archiveTickets] Updated the ticket in the db');

        // Archive the thread on discord
        let thread = {} as null | Channel;
        try {
          thread = await global.discordClient.channels.fetch(ticket.thread_id);
          if (thread?.isThread()) {
            await thread.setArchived(true, 'Automatically archived.');
          }
        } catch (err) {
          log.debug(F, `[archiveTickets] Thread ${ticket.thread_id} was likely manually deleted`);
        }
        log.debug(F, '[archiveTickets] Archived the thread');

        const guild = await discordClient.guilds.fetch(ticket.guild_id);

        let member = {} as null | GuildMember;
        // Get the user data
        const userData = await db.users.upsert({
          where: { id: ticket.user_id },
          create: {},
          update: {},
        });
        try {
          member = await guild.members.fetch(userData.discord_id as string);
        } catch (err) {
          // Member left the guild
        }

        const name = member ?? userData.discord_id;

        const userAvgArchiveTime = await statistic.avgArchiveTime(guild.id, 'TRIPSIT', userData.id);
        const serverAvgArchiveTime = await statistic.avgArchiveTime(guild.id, 'TRIPSIT');

        const description = thread
          ? stripIndents`
            ${name}'s ticket in <#${(thread.id)}> was archived after ${DateTime.now().diff(DateTime.fromJSDate(ticket.created_at)).toFormat('hh:mm:ss')}
            
            Their average is archived in ${userAvgArchiveTime.toFormat('hh:mm:ss')}
            The average server ticket is archived in ${serverAvgArchiveTime.toFormat('hh:mm:ss')}

            If no one talks, it will be deleted ${time(ticket.deleted_at, 'R')}
          `
          : `Thread ${ticket.thread_id} was likely manually deleted, no further actions will be taken.`;

        const sessionData = await util.sessionDataInit(guild.id);

        if (sessionData.logChannel) {
          const channelTripsitLogs = discordClient.channels.cache.get(sessionData.logChannel) as TextChannel;

          await channelTripsitLogs.send({
            allowedMentions: {},
            embeds: [
              new EmbedBuilder()
                .setDescription(description)
                .setColor(Colors.Green),
            ],
          });
          log.debug(F, '[archiveTickets] Sent log message');
        }

        if (member) {
          await util.restoreRoles(userData, ticket);
          log.debug(F, '[archiveTickets] Restored roles');
        }
      });
    }
  }

  export async function deleteTickets() {
    // Process tickets
    // Remember: The deleted_at value is set ahead of time and determines the future time the thread will be deleted
    // So we get a list of all tickets that have this date in the past
    const ticketData = await db.user_tickets.findMany({
      where: {
        deleted_at: {
          not: undefined,
          lte: new Date(), // Less than or equal to now
        },
        status: 'ARCHIVED',
      },
    });

    // log.debug(F, `[deleteTickets] deleteTicketData: ${JSON.stringify(ticketData, null, 2)}`);

    // Loop through each ticket
    if (ticketData.length > 0) {
      ticketData.forEach(async ticket => {
        log.debug(F, `[deleteTickets] Deleting ticket ${ticket.id}...`);

        // Update the ticket in the DB
        await db.user_tickets.update({
          where: { id: ticket.id },
          data: { status: 'DELETED' as ticket_status },
        });

        // Delete the thread on discord
        let thread = {} as null | Channel;
        try {
          thread = await global.discordClient.channels.fetch(ticket.thread_id);
        } catch (err) {
          // Thread was likely manually deleted
        }

        if (thread?.isThread()) {
          await thread.delete('Automatically deleted.');
        } else {
          log.debug(F, `[deleteTickets] Thread ${ticket.thread_id} was likely manually deleted`);
        }

        const guild = await discordClient.guilds.fetch(ticket.guild_id);
        let member = {} as null | GuildMember;
        // Get the user data
        const userData = await db.users.upsert({
          where: { id: ticket.user_id },
          create: {},
          update: {},
        });
        try {
          member = await guild.members.fetch(userData.discord_id as string);
        } catch (err) {
          // Member left the guild
        }

        const userTotalTickets = await statistic.totalTickets(guild.id, 'TRIPSIT', userData.id);
        const userAvgTicketTime = await statistic.avgTotalTicketTime(guild.id, 'TRIPSIT', userData.id);
        const totalAvgTicketTime = await statistic.avgTotalTicketTime(guild.id, 'TRIPSIT');

        const description = thread
          ? stripIndents`
            ${member ?? userData.discord_id}'s ticket was deleted after ${DateTime.now().diff(DateTime.fromJSDate(ticket.created_at)).toFormat('hh:mm:ss')}
  

            They have opened **${userTotalTickets}** tickets in total.
            Their average ticket lasts ${userAvgTicketTime.toFormat('hh:mm:ss')}
            The average server ticket lasts ${totalAvgTicketTime.toFormat('hh:mm:ss')}`
          : stripIndents`
            ${member ?? userData.discord_id}'s ticket was likely manually deleted, no further actions will be taken.
          
            They have opened **${userTotalTickets}** tickets in total.
            Their average ticket lasts ${userAvgTicketTime.toFormat('hh:mm:ss')}
            The average server ticket lasts ${totalAvgTicketTime.toFormat('hh:mm:ss')}`;

        const sessionData = await util.sessionDataInit(ticket.guild_id);

        if (sessionData.logChannel) {
          // Get the log channel
          const channelTripsitLogs = discordClient.channels.cache.get(sessionData.logChannel) as TextChannel;

          await channelTripsitLogs.send({
            allowedMentions: {},
            embeds: [
              new EmbedBuilder()
                .setDescription(description)
                .setColor(Colors.DarkOrange),
            ],
          });
        }

        if (member) {
          await util.restoreRoles(userData, ticket);
        }
      });
    }
  }

  export async function cleanupTickets() {
    const sessionDataList = await db.session_data.findMany();

    await Promise.all(sessionDataList.map(async sessionDataInit => {
      try {
        const guild = await discordClient.guilds.fetch(sessionDataInit.guild_id);

        if (!guild || !sessionDataInit?.tripsit_channel) return;

        const channel = await guild.channels.fetch(sessionDataInit.tripsit_channel) as TextChannel;
        const missingPerms = await checkChannelPermissions(channel, permissionList.tripsitChannel);

        if (missingPerms.length > 0) return;

        const threadList = await channel.threads.fetch({
          archived: {
            type: 'private',
            fetchAll: true,
          },
        });

        await Promise.all(threadList.threads.map(async thread => {
          try {
            await thread.fetch();
            const messages = await thread.messages.fetch({ limit: 1 });
            const lastMessage = messages.first();
            if (!lastMessage) return;

            if (DateTime.fromJSDate(lastMessage.createdAt) >= DateTime.utc().minus(text.deleteDuration())) {
              await thread.delete();
              // Consider logging outside the loop or summarizing deletions to minimize log entries
            }
          } catch (err) {
            // Handle thread fetch or delete error
          }
        }));
      } catch (err) {
        // Handle guild fetch error or other errors
        if ((err as DiscordErrorData).message === 'GUILD_DELETED') {
          await db.session_data.delete({
            where: { id: sessionDataInit.id },
          });
        }
      }
    }));
  }
}

export namespace util {
  export async function tripsitmeBackup(
    interaction: ButtonInteraction,
  ) {
    await interaction.deferReply({ ephemeral: true });
    // log.debug(F, `[tripsitmeBackup] tripsitmeBackup`);
    if (!interaction.guild) {
      // log.debug(F, `[tripsitmeBackup] no guild!`);
      await interaction.editReply(text.guildOnly());
      return;
    }
    if (!interaction.channel) {
      // log.debug(F, `[tripsitmeBackup] no channel!`);
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
      // log.debug(F, `[tripsitmeBackup] target ${target} does not need help!`);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.DarkBlue)
            .setDescription(`Hey ${interaction.member}, ${target.displayName} does not have an open session!`),
        ],
      });
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

    const sessionData = await util.sessionDataInit(interaction.guild.id);
    if (sessionData?.tripsitterRoles) {
      await Promise.all(sessionData.tripsitterRoles.map(async roleId => {
        try {
          roleTripsitter = await interaction.guild?.roles.fetch(roleId) as Role;
          backupMessage += `<@&${roleTripsitter.id}> `;
        } catch (err) {
          // log.debug(F, `[tripsitmeBackup] Role ${roleId} was likely deleted`);
        }
      }));
    }

    backupMessage += stripIndents`team, ${actor} has indicated they could use some backup!
      
    Be sure to read the log so you have the context!`;

    await interaction.channel.send(backupMessage);

    await interaction.editReply({ content: 'Backup message sent!' });
  }

  export async function softClose(
    interaction: ButtonInteraction,
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
      // log.debug(F, `[softClose] [tripsitmeBackup] There was an error fetching the target, it was likely deleted:\n ${err}`);
      // await interaction.editReply({ content: 'Sorry, this user has left the guild.' });
      // return;
    }

    const actor = interaction.member as GuildMember;

    if (targetId === actor.id) {
      // log.debug(F, `[softClose] [tripsitmeBackup] not the target!`);
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
    log.debug(F, `[softClose] guildData: ${JSON.stringify(guildData, null, 2)}`);

    if (!ticketData) {
      // log.debug(F, `[softClose] target ${target} does not need help!`);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.DarkBlue)
            .setDescription(`Hey ${(interaction.member as GuildMember).displayName}, ${target ? target.displayName : 'this user'} does not have an open session!`),
        ],
      });
      return;
    }

    // log.debug(F, `[softClose] ticketData: ${JSON.stringify(ticketData, null, 2)}`);
    if (Object.entries(ticketData).length === 0) {
      // log.debug(F, `[softClose] target ${target} does not need help!`);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.DarkBlue)
            .setDescription(`Hey ${(interaction.member as GuildMember).displayName}, ${target ? target.displayName : 'this user'} does not have an open session!`),
        ],
      });
      return;
    }

    // Get the channel objects for the help thread
    let threadHelpUser = {} as ThreadChannel;
    try {
      threadHelpUser = await interaction.guild.channels.fetch(ticketData.thread_id) as ThreadChannel;

      const targetMember = await interaction.guild.members.fetch(targetId);

      // Replace the first character of the channel name with a blue heart using slice to preserve the rest of the name
      await threadHelpUser.setName(text.threadName(targetMember, 'SOFT_CLOSED'));
    } catch (err) {
      // log.debug(F, `[softClose] There was an error updating the help thread, it was likely deleted:\n ${err}`);
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
      // log.debug(F, `[softClose] Updated ticket status to DELETED`);
    }

    if (threadHelpUser.archived) {
      await threadHelpUser.setArchived(false);
      log.debug(F, `[softClose] Un-archived ${threadHelpUser.name}`);
    }

    await threadHelpUser.send({
      content: stripIndents`Hey ${target}, it looks like you're doing somewhat better!
      This thread will remain here for ${text.archiveDuration()} if you want to follow up tomorrow.
      After ${text.deleteDuration()} days, or on request, it will be deleted to preserve your privacy =)
      If you'd like to go back to social mode, just click the button below!
    `,
      components: [
        new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            button.sessionHardClose(targetId),
          ),
      ],
    });

    await db.user_tickets.update({
      where: {
        id: ticketData.id,
      },
      data: {
        status: 'RESOLVED' as ticket_status,
        archived_at: DateTime.utc().plus(text.archiveDuration()).toJSDate(),
        deleted_at: DateTime.utc().plus(text.deleteDuration()).toJSDate(),
      },
    });

    log.debug(F, 'Updated ticket status to RESOLVED');

    // log.debug(F, `[softClose] ${target.user.tag} (${target.user.id}) is no longer being helped!`);
    await interaction.editReply({ content: 'Done!' });
  }

  export async function hardClose(
    interaction: ButtonInteraction,
  ) {
    if (!interaction.guild) return;
    if (!interaction.member) return;
    if (!interaction.channel) return;
    log.info(F, await commandContext(interaction));

    await interaction.deferReply({ ephemeral: false });

    const targetId = interaction.customId.split('~')[1];
    const override = interaction.customId.split('~')[0] === 'tripsitModeOffOverride';

    const target = await interaction.guild.members.fetch(targetId);
    const actor = interaction.member as GuildMember;

    if (targetId !== actor.id && !override) {
      // log.debug(F, `[hardClose] not the target!`);
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
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.DarkBlue)
            .setDescription(stripIndents`
              Hey ${(interaction.member as GuildMember).displayName}, you do not have an open session!
              If you need help, please click the button again!
            `),
        ],
      });
      return;
    }

    // log.debug(F, `[hardClose] ticketData: ${JSON.stringify(ticketData, null, 2)}`);
    if (Object.entries(ticketData).length === 0) {
      // log.debug(F, `[hardClose] target ${target} does not need help!`);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.DarkBlue)
            .setDescription(stripIndents`
              Hey ${(interaction.member as GuildMember).displayName}, you do not have an open session!
              If you need help, please click the button again!
            `),
        ],
      });
      return;
    }

    // log.debug(F, `[hardClose] ticketData: ${JSON.stringify(ticketData, null, 2)}`);
    if (ticketData.status === 'CLOSED') {
      // log.debug(F, `[hardClose] target ${target} does not have an open session!`);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.DarkBlue)
            .setDescription(stripIndents`
              Hey ${(interaction.member as GuildMember).displayName}, you already closed this session!
            `),
        ],
      });
      return;
    }

    // Remove the needshelp role
    // let roleNeedshelp = {} as Role;
    const sessionData = await util.sessionDataInit(interaction.guild.id);
    if (sessionData?.givingRoles) {
      await Promise.all(sessionData.givingRoles.map(async roleId => {
        try {
          const roleToRemove = await interaction.guild?.roles.fetch(roleId) as Role;
          await target.roles.remove(roleToRemove);
        } catch (err) {
          // log.debug(F, `[hardClose] There was an error fetching the needshelp role, it was likely deleted:\n ${err}`);
        }
      }));
    }

    let channelTripsitmeta = {} as TextChannel;
    if (sessionData?.metaChannel) {
      try {
        channelTripsitmeta = await interaction.guild.channels.fetch(sessionData.metaChannel) as TextChannel;
      } catch (err) {
        // log.debug(F, `[hardClose] There was an error fetching the meta channel, it was likely deleted:\n ${err}`);
      }
    }

    // Re-add old roles
    if (userData.roles) {
      const myMember = await interaction.guild.members.fetch(interaction.client.user.id);
      const myRole = myMember.roles.highest;
      const removedRoles = sessionData?.removingRoles ?? [];

      // readd each role to the target
      if (removedRoles.length > 0) {
        removedRoles.forEach(async roleId => {
          // log.debug(F, `[hardClose] Re-adding roleId: ${roleId}`);
          if (!interaction.guild) {
            log.error(F, 'no guild!');
            return;
          }
          const roleObj = await interaction.guild.roles.fetch(roleId) as Role;
          const removingRoles = sessionData?.removingRoles ?? [];
          if (roleObj
            && roleObj.name !== '@everyone'
            && !sessionData.givingRoles?.includes(roleObj.id)
            && roleObj.comparePositionTo(myRole) < 0) {
            try {
              await target.roles.add(roleObj);
            } catch (err) {
              log.error(F, `Error adding role to target: ${err}`);
              log.error(F, `${roleObj.name} to ${target.displayName} in ${interaction.guild}!`);
            }
          }
        });
      }
    }

    // Change the channel icon
    let threadHelpUser = {} as ThreadChannel;
    try {
      threadHelpUser = await interaction.guild.channels.fetch(ticketData.thread_id) as ThreadChannel;
    } catch (err) {
      // log.debug(F, `[hardClose] There was an error updating the help thread, it was likely deleted:\n ${err}`);
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
      // log.debug(F, `[hardClose] Updated ticket status to DELETED`);
    }

    if (threadHelpUser.archived) {
      await threadHelpUser.setArchived(false);
      log.debug(F, `[hardClose] Un-archived ${threadHelpUser.name}`);
    }

    // Let the log channel know the user has been helped
    const channelLogId = sessionData?.logChannel;
    if (channelLogId) {
      try {
        const channelLog = await interaction.guild.channels.fetch(channelLogId);
        if (channelLog?.isTextBased()) {
          await channelLog.send({
            content: stripIndents`${actor.displayName} has indicated that they no longer need help!`,
          });
        }
      } catch (err) {
        // Log thread likely doesn't exist
      }
    }

    // Send the end message to the user
    try {
      await interaction.editReply(stripIndents`Hey ${target}, we're glad you're doing better!
      We've restored your old roles back to normal <3
      This thread will remain here for ${text.archiveDuration()} if you want to follow up tomorrow.
      After ${text.deleteDuration()} days, or on request, it will be deleted to preserve your privacy =)`);
    } catch (err) {
      log.error(F, `Error sending end help message to ${threadHelpUser}`);
      log.error(F, err as string);
    }

    // Send the survey
    let message: Message;
    await threadHelpUser.send(stripIndents`
        ${emojiGet('Invisible')}
        > **If you have a minute, your feedback is important to us!**
        > Please rate your experience with ${interaction.guild.name}'s service by reacting below.
        > Thank you!
        ${emojiGet('Invisible')}
        `)
      .then(async msg => {
        message = msg;
        await msg.react(text.rateOne());
        await msg.react(text.rateTwo());
        await msg.react(text.rateThree());
        await msg.react(text.rateFour());
        await msg.react(text.rateFive());
      });

    // Do this last because it looks weird to have it happen in-between messages
    await threadHelpUser.setName(text.threadName(target, 'HARD_CLOSED'));

    // log.debug(F, `[hardClose] ${target.user.tag} (${target.user.id}) is no longer being helped!`);
    // await interaction.editReply({ content: 'Done!' });

    // Update the ticket status to closed
    ticketData.status = 'CLOSED' as ticket_status;
    ticketData.archived_at = DateTime.utc().plus(text.archiveDuration()).toJSDate();
    ticketData.deleted_at = DateTime.utc().plus(text.deleteDuration()).toJSDate();

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

  export async function startSession(
    interaction: ButtonInteraction,
  ) {
    log.info(F, await commandContext(interaction));
    if (!interaction.guild) return;

    const sessionData = await util.sessionDataInit(interaction.guild.id);

    const failedPermissions:string[] = [];

    failedPermissions.push(...(await validate.tripsitChannel(interaction)));
    failedPermissions.push(...(await validate.tripsitterRoles(interaction)));
    failedPermissions.push(...(await validate.metaChannel(interaction)));
    failedPermissions.push(...(await validate.giveRemoveRoles(interaction)));
    failedPermissions.push(...(await validate.logChannel(interaction)));

    if (!sessionData || failedPermissions.length > 0) {
      await interaction.reply({
        content: 'There is a problem with the setup! Ask the admin to re-run `/tripsit setup!`',
        ephemeral: true,
      });
      return;
    }

    // The target will usually be the person who clicked the button
    // But if the user came in via /tripsit start, and they're also a tripsitter, they can start a session for someone else
    // So we need to check if the `tripsit~sessionUser` component is present, and if so, if it has a selection
    let target = interaction.member as GuildMember;
    const userSelectMenu = getComponentById(interaction, 'tripsit~sessionUser') as UserSelectMenuComponent;
    if (userSelectMenu) {
      const targetId = userSelectMenu.customId.split('~')[2];
      log.debug(F, `[startSession] targetId: ${targetId}`);
      if (targetId && targetId !== target.id) {
        try {
          target = await interaction.guild.members.fetch(targetId);
        } catch (err) {
          log.error(F, `Error fetching target: ${err}`);
          await interaction.reply('There was an error fetching the target user!');
          return;
        }
      }
    }
    log.debug(F, `[startSession] Target: ${target.displayName} (${target.id})`);

    const userData = await db.users.upsert({
      where: { discord_id: target.id },
      create: { discord_id: target.id },
      update: {},
    });
    // log.debug(F, `[startSession] Target userData: ${JSON.stringify(userData, null, 2)}`);

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

    if (ticketData) {
      await util.sessionContinue(interaction, target, ticketData);
      return;
    }
    log.debug(F, 'No open ticket found');

    await util.sessionNew(interaction, target, userData);
  }

  export async function sessionContinue(
    interaction: ButtonInteraction,
    target: GuildMember,
    ticketData: user_tickets,
  ) {
    if (!interaction.guild) return;
    if (!interaction.member) return;
    log.debug(F, `[sessionContinue] Target has tickets: ${JSON.stringify(ticketData, null, 2)}`);

    const sessionData = await util.sessionDataInit(interaction.guild.id);

    let threadHelpUser = {} as ThreadChannel;
    try {
      threadHelpUser = await interaction.guild?.channels.fetch(ticketData.thread_id) as ThreadChannel;
    } catch (err) {
      log.debug(F, 'There was an error updating the help thread, it was likely deleted');
      // Update the ticket status to closed

      await db.user_tickets.update({
        where: { id: ticketData.id },
        data: {
          status: 'DELETED' as ticket_status,
          archived_at: ticketData.archived_at,
          deleted_at: ticketData.deleted_at,
        },
      });
      log.debug(F, 'Updated ticket status to DELETED');
      log.debug(F, `[sessionContinue] Ticket: ${JSON.stringify(ticketData, null, 2)}`);
      // If going down this path, skip down to interaction.showModal
    }

    log.debug(F, `[sessionContinue] ThreadHelpUser: ${threadHelpUser.name}`);

    // If the thread exists
    if (threadHelpUser.id) {
      await interaction.deferReply({ ephemeral: true });
      await needsHelpMode(interaction, target);
      log.debug(F, 'Added needshelp to user');
      let tripsitterRoles = [] as Role[];
      let removeRoles = [] as Role[];
      let giveRoles = [] as Role[];
      if (sessionData.tripsitterRoles) {
        tripsitterRoles = await Promise.all(sessionData.tripsitterRoles.map(async roleId => await interaction.guild?.roles.fetch(roleId) as Role));
      }

      if (sessionData.removingRoles) {
        removeRoles = await Promise.all(sessionData.removingRoles.map(async roleId => await interaction.guild?.roles.fetch(roleId) as Role));
      }

      if (sessionData.givingRoles) {
        giveRoles = await Promise.all(sessionData.givingRoles.map(async roleId => await interaction.guild?.roles.fetch(roleId) as Role));
      }
      log.debug(F, `[sessionContinue] Tripsitter Roles : ${tripsitterRoles.length}`);
      log.debug(F, `[sessionContinue] Remove Roles : ${removeRoles.length}`);
      log.debug(F, `[sessionContinue] Giving Roles : ${giveRoles.length}`);

      const teamInitialized = (interaction.member as GuildMember).id === target.id;

      log.debug(F, 'Told user they already have an open channel');

      // Check if the created_by is in the last 5 minutes
      const minutes = Math.floor(new Date().getTime() - new Date(ticketData.reopened_at ?? ticketData.created_at).getTime() / 1000 / 60);

      // Send the update message to the thread
      let helpMessage = teamInitialized
        ? stripIndents`Hey ${target}, the team thinks you could still use some help, lets continue talking here!`
        : stripIndents`Hey ${target}, thanks for asking for help, we can continue talking here! What's up?`;

      if (minutes > 5) {
        helpMessage += '\n\nSomeone from the team will be with you as soon as they\'re available!';
        if (sessionData?.tripsitterRoles) {
          await Promise.all(sessionData.tripsitterRoles.map(async roleId => {
            try {
              const roleTripsitter = await interaction.guild?.roles.fetch(roleId) as Role;
              helpMessage += `<@&${roleTripsitter.id}> `;
            } catch (err) {
              // log.debug(F, `[sessionContinue] Role ${roleId} was likely deleted`);
            }
          }));
        }
      }
      await threadHelpUser.send({
        content: helpMessage,
        allowedMentions: {
          // parse: showMentions,
          parse: ['users', 'roles'] as MessageMentionTypes[],
        },
      });
      log.debug(F, 'Pinged user in help thread');
      await threadHelpUser.setName(text.threadName(target, 'OPEN'));

      await db.user_tickets.update({
        where: {
          id: ticketData.id,
        },
        data: {
          status: 'OPEN' as ticket_status,
          reopened_at: new Date(),
          archived_at: DateTime.utc().plus(text.deleteDuration()).toJSDate(),
          deleted_at: DateTime.utc().plus(text.archiveDuration()).toJSDate(),
        },
      });

      if (teamInitialized) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.DarkBlue)
              .setDescription(stripIndents`
                Hey ${interaction.member}, ${target.displayName} already has an open ticket!
                I've re-applied the ${giveRoles.join(', ')} role(s) to them, and updated the thread.
                Check your channel list or click '${threadHelpUser.toString()} to see!
              `),
          ],
        });
      } else {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.DarkBlue)
              .setDescription(stripIndents`
                Hey ${interaction.member}, you have an open session!
    
                Check your channel list or click '${threadHelpUser.toString()} to get help!
              `),
          ],
        });
      }
    }
  }

  export async function sessionNew(
    interaction: ButtonInteraction,
    target: GuildMember,
    userData: users,
  ) {
    if (!interaction.guild) return;

    const sessionData = await util.sessionDataInit(interaction.guild.id);

    await interaction.showModal(new ModalBuilder()
      .setCustomId(`tripsitmeSubmit~${interaction.id}`)
      .setTitle('Tripsitter Help Request')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>()
          .addComponents(new TextInputBuilder()
            .setCustomId('triageInput')
            .setLabel('What substance? How much taken? How long ago?')
            .setStyle(TextInputStyle.Short)),
        new ActionRowBuilder<TextInputBuilder>()
          .addComponents(new TextInputBuilder()
            .setCustomId('introInput')
            .setLabel('What\'s going on? Give us the details!')
            .setStyle(TextInputStyle.Paragraph)),
      ));

    const filter = (i: ModalSubmitInteraction) => i.customId.startsWith('tripsitmeSubmit');
    await interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        if (!interaction.guild) return;
        if (i.customId.split('~')[1] !== interaction.id) return;
        await i.deferReply({ ephemeral: true });
        const triage = i.fields.getTextInputValue('triageInput');
        const intro = i.fields.getTextInputValue('introInput');

        // let backupMessage = 'Hey ';
        // Get the roles we'll be referencing
        let tripsitterRoles = [] as Role[];
        let channelTripsitmeta = {} as TextChannel;
        if (sessionData.tripsitterRoles) {
          tripsitterRoles = await Promise.all(sessionData.tripsitterRoles.map(async roleId => await interaction.guild?.roles.fetch(roleId) as Role));
        }
        if (sessionData.metaChannel) {
          try {
            channelTripsitmeta = await interaction.guild.channels.fetch(sessionData.metaChannel) as TextChannel;
          } catch (err) {
          // log.debug(F, `[sessionNew] There was an error fetching the meta channel, it was likely deleted:\n ${err}`);
          }
        }
        // log.debug(F, `[sessionNew] tripsitterRoles: ${tripsitterRoles})`);
        // log.debug(F, `[sessionNew] channelTripsitmeta: ${channelTripsitmeta.name} (${channelTripsitmeta.id})`);

        await needsHelpMode(interaction, target);

        // Get the tripsit channel from the guild
        let tripsitChannel = {} as TextChannel;
        try {
          if (sessionData.tripsitChannel) {
            tripsitChannel = await interaction.guild.channels.fetch(sessionData.tripsitChannel) as TextChannel;
          }
        } catch (err) {
          // log.debug(F, `[sessionNew] There was an error fetching the tripsit channel, it was likely deleted:\n ${err}`);
        }

        if (!tripsitChannel.id) {
        // log.debug(F, `[sessionNew] no tripsit channel!`);
          await interaction.editReply({ content: 'No tripsit channel found! Make sure to run /tripsit setup' });
          return;
        }

        // Create a new thread in the channel
        const threadHelpUser = await tripsitChannel.threads.create({
          name: text.threadName(target, 'OPEN'),
          autoArchiveDuration: 1440,
          type: ChannelType.PrivateThread as AllowedThreadTypeForTextChannel,
          reason: `${target.displayName} requested help`,
          invitable: false,
        });
        log.debug(F, `[sessionNew] Created thread: ${threadHelpUser.name} (${threadHelpUser.id})`);

        // Team check - Cannot be run on team members
        // If this user is a developer then this is a test run and ignore this check,
        // but we'll change the output down below to make it clear this is a test.
        let targetIsTeamMember = false;
        target.roles.cache.forEach(async role => {
          if (sessionData.tripsitterRoles?.includes(role.id)) {
            targetIsTeamMember = true;
          }
        });

        // log.debug(F, `[sessionNew] targetIsTeamMember: ${targetIsTeamMember}`);

        const noInfo = '\n*No info given*';
        const firstMessage = await threadHelpUser.send({
          content: stripIndents`
            Hey ${target}, thank you for asking for assistance!

            You've taken: ${triage ? `\n${triage}` : noInfo}

            Your issue: ${intro ? `\n${intro}` : noInfo}

            Someone from the team will be with you as soon as they're available!

            If this is a medical emergency please contact your local emergency services: we do not call EMS on behalf of anyone.
            
            When you're feeling better you can use the "I'm Good" button to let the team know you're okay.

            **Not in an emergency, but still want to talk to a mental health advisor? Warm lines provide non-crisis mental health support and guidance from trained volunteers. https://warmline.org/warmdir.html#directory**

            **The wonderful people at the Fireside project can also help you through a rough trip. You can check them out: https://firesideproject.org/**

            ${tripsitterRoles.join(' ')}
          `,
          components: [
            new ActionRowBuilder<ButtonBuilder>()
              .addComponents(
                button.sessionHardClose(target.id),
              ),
          ],
          allowedMentions: {
          // parse: showMentions,
            parse: ['users', 'roles'] as MessageMentionTypes[],
          },
          flags: ['SuppressEmbeds'],
        });

        try {
          await firstMessage.pin();
        } catch (error) {
          log.error(F, `Failed to pin message: ${error}`);
          const guildOwner = await interaction.guild?.fetchOwner();
          await guildOwner?.send({
            content: stripIndents`There was an error pinning a message in ${threadHelpUser.name}!
              Please make sure I have the Manage Messages permission in this room!
              If there's any questions please contact Moonbear#1024 on TripSit!
            `,
            }); // eslint-disable-line
        }

        // log.debug(F, `[sessionNew] Sent intro message to ${threadHelpUser.name} ${threadHelpUser.id}`);

        if (sessionData.metaChannel) {
        // Send an embed to the tripsitter room
          await channelTripsitmeta.send({
            embeds: [
              new EmbedBuilder()
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
                .setFooter({ text: 'If you need help click the Backup button to summon Helpers and Tripsitters' }),
            ],
            components: [
              new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                  button.sessionSoftClose(target.id),
                  button.sessionBackup(target.id),
                ),
            ],
            allowedMentions: {
            // parse: showMentions,
              parse: ['users', 'roles'] as MessageMentionTypes[],
            },
          });
          log.debug(F, `[sessionNew] Sent message to ${channelTripsitmeta.name} (${channelTripsitmeta.id})`);
        }

        const archiveTime = DateTime.utc().plus(text.archiveDuration());
        const deleteTime = DateTime.utc().plus(text.deleteDuration());

        // log.debug(F, `[sessionNew] Ticket archives on ${archiveTime.toLocaleString(DateTime.DATETIME_FULL)} deletes on ${deleteTime.toLocaleString(DateTime.DATETIME_FULL)}`);

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
          archived_at: archiveTime.toJSDate(),
          deleted_at: deleteTime.toJSDate(),
        } as user_tickets;

        // log.debug(F, `[sessionNew] newTicketData: ${JSON.stringify(newTicketData, null, 2)}`);

        // Update the ticket in the DB
        await db.user_tickets.create({
          data: {
            user_id: newTicketData.user_id,
            description: newTicketData.description,
            guild_id: interaction.guild.id,
            thread_id: newTicketData.thread_id,
            type: newTicketData.type,
            status: newTicketData.status,
            archived_at: newTicketData.archived_at,
            deleted_at: newTicketData.deleted_at,
          },
        });

        if (sessionData.logChannel) {
          const channelTripsitLog = await interaction.guild.channels.fetch(sessionData.logChannel) as TextChannel;

          const userTotalTickets = await statistic.totalTickets(interaction.guild.id, 'TRIPSIT', userData.id);
          const userFirstResponseTime = await statistic.avgFirstResponseTime(interaction.guild.id, 'TRIPSIT', userData.id);
          const avgFirstResponseTime = await statistic.avgFirstResponseTime(interaction.guild.id, 'TRIPSIT');
          const userAvgTicketTime = await statistic.avgTotalTicketTime(interaction.guild.id, 'TRIPSIT', userData.id);
          const totalAvgTicketTime = await statistic.avgTotalTicketTime(interaction.guild.id, 'TRIPSIT');
          log.debug(F, `[sessionNew] avgFirstResponseTime: ${avgFirstResponseTime.seconds}`);

          await channelTripsitLog.send({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.DarkBlue)
                .setDescription(stripIndents`
                  **<@${target.id}>** requested help in <#${threadHelpUser.id}>

                  **They've taken:** ${triage ? `\n${triage}` : noInfo}
                  **Their issue: ** ${introStr}

                  They have opened **${userTotalTickets}** tickets in total.
                  Their average first response time is ${userFirstResponseTime.toFormat('hh:mm:ss')}
                  The server average first response time is ${avgFirstResponseTime.toFormat('hh:mm:ss')}
                  Their average ticket lasts ${userAvgTicketTime.toFormat('hh:mm:ss')}
                  The server ticket average is ${totalAvgTicketTime.toFormat('hh:mm:ss')}
                `),
            ],
          });
        }

        if (!threadHelpUser) {
          await i.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.DarkBlue)
                .setDescription(stripIndents`
                  Hey ${interaction.member}, there was an error creating your help thread! The Guild owner should get a message with specifics!
                `),
            ],
          });
          return;
        }

        try {
          await i.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.DarkBlue)
                .setDescription(stripIndents`
          Hey ${target}, thank you for asking for assistance!
          
          Click here to be taken to your private room: ${threadHelpUser.toString()}
      
          You can also click in your channel list to see your private room!
        `),
            ],
          });
        } catch (err) {
          log.error(F, `There was an error responding to the user! ${err}`);
          log.error(F, `Error: ${JSON.stringify(err, null, 2)}`);
        }
      });
  }

  export async function restoreRoles(
    userData: users,
    ticket: user_tickets,
  ) {
    // Restore roles
    const guild = await discordClient.guilds.fetch(ticket.guild_id);
    const member = await guild.members.fetch(userData.discord_id as string);
    if (member) {
      const sessionData = await util.sessionDataInit(ticket.guild_id);

      if (sessionData?.givingRoles) {
        await Promise.all(sessionData.givingRoles.map(async roleId => {
          await member.roles.remove(roleId);
        }));
      }

      if (sessionData?.removingRoles) {
        await Promise.all(sessionData.removingRoles.map(async roleId => {
          await member.roles.add(roleId);
        }));
      }
    }
  }

  export async function needsHelpMode(
    interaction: ModalSubmitInteraction | ButtonInteraction | ChatInputCommandInteraction,
    target: GuildMember,
  ):Promise<void> {
    if (!interaction.guild) return;
    const userData = await db.users.upsert({
      where: { discord_id: target.id },
      create: { discord_id: target.id },
      update: {},
    });
    // Restore roles
    const guild = await discordClient.guilds.fetch(interaction.guild.id);
    const member = await guild.members.fetch(userData.discord_id as string);
    if (member) {
      const sessionData = await util.sessionDataInit(interaction.guild.id);

      if (sessionData?.givingRoles) {
        await Promise.all(sessionData.givingRoles.map(async roleId => {
          await member.roles.add(roleId);
        }));
      }

      if (sessionData?.removingRoles) {
        await Promise.all(sessionData.removingRoles.map(async roleId => {
          await member.roles.remove(roleId);
        }));
      }
    }

    log.debug(F, 'Finished needshelp mode');
  }

  export async function navMenu(
    page: 'start' | 'help' | 'privacy' | 'setup' | 'stats',
  ):Promise<ActionRowBuilder<ButtonBuilder>> {
    return new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        button.startPage().setStyle(page === 'start' ? ButtonStyle.Success : ButtonStyle.Primary),
        button.helpPage().setStyle(page === 'help' ? ButtonStyle.Success : ButtonStyle.Primary),
        button.privacyPage().setStyle(page === 'privacy' ? ButtonStyle.Success : ButtonStyle.Primary),
        button.setupPage().setStyle(page === 'setup' ? ButtonStyle.Success : ButtonStyle.Primary),
        button.statsPage().setStyle(page === 'stats' ? ButtonStyle.Success : ButtonStyle.Primary),
      );
  }

  export async function setupMenu(
    page: 'setupPageOne' | 'setupPageTwo' | 'setupPageThree',
    interaction: ChatInputCommandInteraction | ButtonInteraction | ChannelSelectMenuInteraction | RoleSelectMenuInteraction,
  ):Promise<ActionRowBuilder<ButtonBuilder | ChannelSelectMenuBuilder | StringSelectMenuBuilder | RoleSelectMenuBuilder >[]> {
    if (!interaction.guild) return [];

    await util.sessionDataInit(interaction.guild.id);

    const setupMenuRow = new ActionRowBuilder<ButtonBuilder>();

    const setupRows: ActionRowBuilder<
    ButtonBuilder
    | ChannelSelectMenuBuilder
    | StringSelectMenuBuilder
    | RoleSelectMenuBuilder >[] = [setupMenuRow];

    setupMenuRow.addComponents(
      button.setupPageOne().setStyle(page === 'setupPageOne' ? ButtonStyle.Success : ButtonStyle.Primary),
      button.setupPageTwo().setStyle(page === 'setupPageTwo' ? ButtonStyle.Success : ButtonStyle.Primary),
      button.setupPageThree().setStyle(page === 'setupPageThree' ? ButtonStyle.Success : ButtonStyle.Primary),
    );

    // Only show the save button if the user has the Manage Channels permission
    // And all of the required setup options are set correctly
    // Otherwise, they can still view the setup options
    if ((interaction.member as GuildMember).permissions.has(PermissionFlagsBits.ManageChannels)
    && global.sessionsSetupData[interaction.guild.id].tripsitChannel && global.sessionsSetupData[interaction.guild.id].tripsitterRoles) {
      const failedPermissions:string[] = [];

      failedPermissions.push(...(await validate.tripsitChannel(interaction)));
      failedPermissions.push(...(await validate.tripsitterRoles(interaction)));
      failedPermissions.push(...(await validate.metaChannel(interaction)));
      failedPermissions.push(...(await validate.giveRemoveRoles(interaction)));
      failedPermissions.push(...(await validate.logChannel(interaction)));

      if (failedPermissions.length === 0) {
        setupMenuRow.addComponents(
          button.save().setStyle(ButtonStyle.Danger),
        );
      }
    }

    const setupOptions = global.sessionsSetupData[interaction.guild.id];

    switch (page) {
      case 'setupPageOne':
        setupRows.push(
          new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
            setupOptions.tripsitChannel
              ? select.tripsitChannel().setDefaultChannels(setupOptions.tripsitChannel)
              : select.tripsitChannel(),
          ),
          new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
            setupOptions.tripsitterRoles
              ? select.tripsitterRoles().setDefaultRoles(setupOptions.tripsitterRoles)
              : select.tripsitterRoles().setDefaultRoles(),
          ),
          new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
            setupOptions.metaChannel
              ? select.metaChannel().setDefaultChannels(setupOptions.metaChannel)
              : select.metaChannel(),
          ),
        );
        break;
      case 'setupPageTwo':
        setupRows.push(
          new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
            setupOptions.givingRoles
              ? select.givingRoles().setDefaultRoles(setupOptions.givingRoles)
              : select.givingRoles().setDefaultRoles(),
          ),
          new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
            setupOptions.removingRoles
              ? select.removingRoles().setDefaultRoles(setupOptions.removingRoles)
              : select.removingRoles().setDefaultRoles(),
          ),
          new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
            setupOptions.logChannel
              ? select.logChannel().setDefaultChannels(setupOptions.logChannel)
              : select.logChannel().setDefaultChannels(),
          ),
        );
        break;
      case 'setupPageThree':
        setupRows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(
          button.updateEmbed(),
        ));
        break;
      default:
        break;
    }

    // This should only ever return 4 rows, because 1 of the 5 rows will be the navigation array
    if (setupRows.length > 4) {
      log.error(F, `setupRows has more than 4 rows! ${setupRows.length}`);
      throw new Error('setupRows has more than 4 rows!');
    }

    return setupRows;
  }

  export async function messageStats(
    message: Message<boolean>,
  ):Promise<void> {
    /* This command is the discord UI for the g.stats command
    Ideas for statistics:
    - How many times each command is used, and by whom
    - How many times people have broken the token game
    - Experience
      - New people to reach X milestone this day/week/month
      - How many people have reached X milestone
      - Changes since last snapshot
      - Send messages when people hit milestones, not just for #vip-lounge
    */

    if (!message.guild) return;
    if (!message.channel) return;
    if (message.channel.isDMBased()) return;

    // Check if the message was sent in a tripsit thread
    const ticketData = await db.user_tickets.findFirst({
      where: {
        thread_id: message.channel.id,
      },
    });

    if (ticketData) {
      const sessionData = await util.sessionDataInit(message.guild.id);
      if (!sessionData.tripsitChannel) return;

      const userData = await db.users.upsert({
        where: { discord_id: message.author.id },
        create: { discord_id: message.author.id },
        update: {},
      });

      // Add the user to the participants list
      const participationData = await db.user_ticket_participant.upsert({
        where: {
          ticket_id_user_id: {
            ticket_id: ticketData.id,
            user_id: userData.id,
          },
        },
        create: {
          ticket_id: ticketData.id,
          user_id: userData.id,
          messages: 1,
        },
        update: {
          messages: {
            increment: 1,
          },
        },
      });
      log.debug(F, `[messageStats] Added <@!${message.author.id}> to the participants list for thread ${message.channel.name} in the DB`);

      // First responder stuff
      if ((!ticketData.first_response_user && ticketData.user_id !== userData.id) || env.NODE_ENV === 'development') {
        // Check if the first_response_user field is null, and if it's a different user than the person who made the thread
        await db.user_tickets.update({
          where: { id: ticketData.id },
          data: {
            first_response_user: userData.id,
            first_response_datetime: new Date(),
          },
        });
        log.debug(F, `[messageStats] Added <@!${message.author.id}> as the first response user for thread ${message.channel.name} in the DB`);

        const ticketUserData = await db.users.findFirst({
          where: { id: ticketData.user_id },
        });

        const ticketMember = await message.guild.members.fetch(ticketUserData?.discord_id as string);

        // Change the name of the thread
        await message.channel.setName(text.threadName(ticketMember, 'OWNED'));

        // Log the event
        if (sessionData.logChannel) {
          const sessionUserData = await db.users.upsert({
            where: { id: ticketData.user_id },
            create: { id: ticketData.user_id },
            update: {},
          });
          const averageFirstResponseTime = await statistic.avgFirstResponseTime(message.guild.id, 'TRIPSIT');
          const firstResponseCount = await statistic.firstResponseCount(message.guild.id, 'TRIPSIT', userData.id);
          const channelTripsitLogs = await message.guild.channels.fetch(sessionData.logChannel) as TextChannel;
          const userParticipation = await statistic.userParticipation(message.guild.id, 'TRIPSIT', userData.id);
          const userParticipationMessages = userParticipation.reduce((acc, thread) => acc + thread.messages, 0);

          await channelTripsitLogs.send({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.DarkBlue)
                .setDescription(stripIndents`
                  <@!${message.author.id}> was the first responder to <@${sessionUserData.discord_id}>'s <#${message.channel.id}>

                  They have been a first responder ${firstResponseCount} time(s).
                  They have been in ${userParticipation.length} other threads.
                  They have sent ${userParticipationMessages} messages in all threads.
            
                  The first response took ${DateTime.now().diff(DateTime.fromJSDate(ticketData.created_at)).toFormat('hh:mm:ss')}
                  Average first response time is: ${averageFirstResponseTime.toFormat('hh:mm:ss')}
                `),
            ],
          });
          return;
        }

        // Update the database
        await db.user_tickets.update({
          where: { id: ticketData.id },
          data: {
            first_response_user: userData.id,
            first_response_datetime: new Date(),
          },
        });
        log.debug(F, `[messageStats] Added <@!${message.author.id}> as the first response user for thread ${message.channel.name} in the DB`);
      }

      // Log when someone joins the thread
      if (sessionData.logChannel) {
        const sessionUserData = await db.users.upsert({
          where: { id: ticketData.user_id },
          create: { id: ticketData.user_id },
          update: {},
        });
        const channelTripsitLogs = message.guild.channels.cache.get(sessionData.logChannel) as TextChannel;
        const userParticipation = await statistic.userParticipation(message.guild.id, 'TRIPSIT', userData.id);

        // Get a count of all messages they've sent in all threads
        const userParticipationMessages = userParticipation.reduce((acc, thread) => acc + thread.messages, 0);

        await channelTripsitLogs.send({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.DarkBlue)
              .setDescription(stripIndents`
              <@!${message.author.id}> has joined <@${sessionUserData.discord_id}>'s <#${message.channel.id}>
    
              They have been in ${userParticipation.length} other threads.
              They have sent ${userParticipationMessages} messages in other threads.
              `),
          ],
        });
      }

      log.debug(F, stripIndents`${message.author.username} has sent ${participationData.messages} messages in \
      thread ${message.channel.name}`);
    }
  }

  export async function sessionDataInit(
    guildId: string,
  ):Promise<SessionData> {
    let sessionConfig:SessionData = {
      tripsitChannel: null,
      tripsitterRoles: null,
      metaChannel: null,
      givingRoles: null,
      logChannel: null,
      removingRoles: null,
      introMessage: null,
      title: text.title(),
      description: text.description(),
      footer: text.footer(),
      buttonText: text.buttonText(),
      buttonEmoji: text.buttonEmoji(),
    };
    if (!global.sessionsSetupData) {
      // If the global variable doesn't exist, create it
      global.sessionsSetupData = {};
    }

    if (global.sessionsSetupData[guildId]) {
      sessionConfig = global.sessionsSetupData[guildId];
    } else {
      // If there is no session data for this guild, try to pull from database:
      const sessionData = await db.session_data.findFirst({ where: { guild_id: guildId } });

      // If the session data exists, add it to the global variable
      if (sessionData) {
        sessionConfig = {
          tripsitChannel: sessionData.tripsit_channel,
          tripsitterRoles: sessionData.tripsitter_roles,
          metaChannel: sessionData.meta_channel,
          givingRoles: sessionData.giving_roles,
          logChannel: sessionData.log_channel,
          removingRoles: sessionData.removing_roles,
          introMessage: sessionData.intro_message,
          title: sessionData.title,
          description: sessionData.description,
          footer: sessionData.footer,
          buttonText: sessionData.button_text,
          buttonEmoji: sessionData.button_emoji,
        };
        global.sessionsSetupData[guildId] = sessionConfig;
      } else {
        // If the global variable doesn't exist, create it
        global.sessionsSetupData[guildId] = sessionConfig;
      }
    }
    return sessionConfig;
  }

  export async function updateEmbed(
    interaction: ButtonInteraction,
  ) {
    if (!interaction.guild) return;
    if (!interaction.channel) return;
    if (interaction.channel.type !== ChannelType.GuildText) return;

    await util.sessionDataInit(interaction.guild.id);

    await interaction.showModal(new ModalBuilder()
      .setCustomId(`tripsitmeModal~${interaction.id}`)
      .setTitle('Setup your TripSit Room\'s Embed!')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>()
          .addComponents(
            new TextInputBuilder()
              .setLabel('Title')
              .setValue(`${global.sessionsSetupData[interaction.guild.id].title}`)
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setCustomId('tripsit~title'),
          ),
        new ActionRowBuilder<TextInputBuilder>()
          .addComponents(
            new TextInputBuilder()
              .setLabel('Description')
              .setValue(`${global.sessionsSetupData[interaction.guild.id].description}`)
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
              .setCustomId('tripsit~description'),
          ),
        new ActionRowBuilder<TextInputBuilder>()
          .addComponents(
            new TextInputBuilder()
              .setLabel('Footer')
              .setValue(`${global.sessionsSetupData[interaction.guild.id].footer}`)
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setCustomId('tripsit~footer'),
          ),
        new ActionRowBuilder<TextInputBuilder>()
          .addComponents(
            new TextInputBuilder()
              .setLabel('Button Text')
              .setValue(`${global.sessionsSetupData[interaction.guild.id].buttonText}`)
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setMinLength(1)
              .setMaxLength(80)
              .setCustomId('tripsit~buttonText'),
          ),
        new ActionRowBuilder<TextInputBuilder>()
          .addComponents(
            new TextInputBuilder()
              .setLabel('Button Emoji')
              .setValue(`${global.sessionsSetupData[interaction.guild.id].buttonEmoji}`)
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('Accepts Unicode or Custom Emoji: Use format <:emojiName:emojiID> or just emojiID')
              .setRequired(true)
              .setMinLength(1)
              .setMaxLength(80)
              .setCustomId('tripsit~buttonEmoji'),
          ),
      ));

    const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('tripsitmeModal');
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        if (i.customId.split('~')[1] !== interaction.id) return;
        if (!i.isModalSubmit()) return;
        if (!i.isFromMessage()) return;
        if (!interaction.guild) return;
        if (!i.guild) return;

        const sessionData = global.sessionsSetupData[i.guild.id];

        // Validate the emoji given
        const emoji = i.fields.getTextInputValue('tripsit~buttonEmoji');
        log.debug(F, `[updateEmbed] Emoji: ${emoji}`);

        // This regex matches some common Unicode emojis; it's not exhaustive.
        const isStandardEmoji = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu.exec(emoji);
        log.debug(F, `[updateEmbed] isStandardEmoji: ${isStandardEmoji}`);

        // Extract the ID from the custom emoji format
        const isCustomEmoji = /^<a?:.+:(\d+)>$/.exec(emoji);
        log.debug(F, `[updateEmbed] isCustomEmoji: ${isCustomEmoji}`);

        const isEmojiId = /^\d+$/.exec(emoji);
        log.debug(F, `[updateEmbed] isEmojiId: ${isEmojiId}`);

        if (!isStandardEmoji && !isCustomEmoji && !isEmojiId) {
          await i.reply({
            content: 'Please provide a valid emoji!',
            ephemeral: true,
          });
          return;
        }

        if (isCustomEmoji) {
          // Check if the emoji exists in the guild
          try {
            const guildEmoji = await interaction.guild.emojis.fetch(isCustomEmoji[1]);
            if (!guildEmoji) {
              await i.reply({
                content: 'Your custom emoji must be from this server!',
                ephemeral: true,
              });
              return;
            }
          } catch (err) {
            await i.reply({
              content: 'Your custom emoji must be from this server!',
              ephemeral: true,
            });
            return;
          }
        }

        sessionData.title = i.fields.getTextInputValue('tripsit~title');
        sessionData.description = i.fields.getTextInputValue('tripsit~description');
        sessionData.footer = i.fields.getTextInputValue('tripsit~footer');
        sessionData.buttonText = i.fields.getTextInputValue('tripsit~buttonText');
        sessionData.buttonEmoji = isCustomEmoji ? isCustomEmoji[1] : emoji;

        // Idt this is necessary but just to be sure
        global.sessionsSetupData[i.guild.id] = sessionData;

        // log.debug(F, `[updateEmbed] SessionData: ${JSON.stringify(sessionData, null, 2)}`);

        await i.update(await page.setupPageThree(interaction));
      });
  }

  export async function removeExTeamFromThreads(
    newMember: GuildMember,
    role: Role,
  ) {
    if (!newMember.guild) return;
    await util.sessionDataInit(newMember.guild.id);

    const sessionData = await util.sessionDataInit(newMember.guild.id);

    // If sessions are setup, and the role removed was a helper/tripsitter role, we need to remove them from threads they are in
    // When you remove a role from someone already invited to a private thread, they can still access the thread if they can access the channel
    // Since @everyone will have access to the #tripsit channel, where threads are created, we need to manually remove them from the thread
    if (sessionData?.tripsitChannel && sessionData.tripsitterRoles?.includes(role.id)) {
      log.debug(F, `[removeExTeamFromThreads] ${newMember.displayName} had the ${role.name} role removed, which is a tripsitter role!`);
      const userData = await db.users.upsert({
        where: { discord_id: newMember.user.id },
        create: { discord_id: newMember.user.id },
        update: {},
      });

      // Get the user's most recent ticket, if they have one
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

      // Get a list of all the threads in the tripsitting channel
      const channelTripsit = await discordClient.channels.fetch(sessionData.tripsitChannel) as TextChannel;
      const fetchedThreads = await channelTripsit.threads.fetch();

      // For each of those threads, remove the user from the thread
      await Promise.all(fetchedThreads.threads.map(async thread => {
        // If the thread e
        if (thread.id !== ticketData?.thread_id) {
          log.debug(F, `[removeExTeamFromThreads] Removing ${newMember.displayName} from ${thread.name}`);
          await thread.members.remove(newMember.id, 'Helper/Tripsitter role removed');

          // Find the status of the thread we just removed the user from, and if it's already in ARCHIVED status, we need to re-archive it
          const isArchived = await db.user_tickets.findFirst({
            where: {
              thread_id: thread.id,
              status: 'ARCHIVED',
            },
          });

          if (isArchived) {
            await thread.setArchived(true, 'Helper/Tripsitter role removed');
          }
        }
      }));
    }
  }
}

namespace statistic {
  export async function avgFirstResponseTime(
    guildId: string,
    type: ticket_type,
    userId?: string,
  ):Promise<Duration> {
    log.debug(F, `[avgFirstResponseTime] guildId: ${guildId} type: ${type} userId: ${userId}`);
    // Determine average first response time
    const tickets = await db.user_tickets.findMany({
      where: userId
        ? {
          user_id: userId,
          guild_id: guildId,
          type,
          first_response_user: { not: null },
          first_response_datetime: { not: null },
        }
        : {
          guild_id: guildId,
          type,
          first_response_user: { not: null },
          first_response_datetime: { not: null },
        },
      orderBy: {
        created_at: 'asc',
      },
      select: {
        first_response_datetime: true,
        created_at: true,
      },
    });

    log.debug(F, `[avgFirstResponseTime] tickets: ${tickets.length}`);

    if (tickets.length === 0) {
      return Duration.fromObject({ seconds: 0 });
    }

    // Calculate differences in milliseconds and filter out invalid entries
    const durations: number[] = tickets
      .map(ticket => {
        if (ticket.first_response_datetime && ticket.created_at) {
          return DateTime.fromJSDate(new Date(ticket.first_response_datetime))
            .diff(DateTime.fromJSDate(new Date(ticket.created_at)), 'seconds')
            .as('seconds'); // Get difference in seconds
        }
        return null;
      })
      .filter(diff => diff !== null) as number[]; // Filter out tickets where calculation was not possible
    log.debug(F, `[avgFirstResponseTime] durations: ${JSON.stringify(durations, null, 2)}`);

    // Calculate average
    const durationAvg = durations.reduce((acc, curr) => acc + curr, 0) / durations.length;
    log.debug(F, `[avgFirstResponseTime] durationAvg: ${durationAvg}`);

    return Duration.fromObject({ seconds: durationAvg });
  }

  export async function avgArchiveTime(
    guildId: string,
    type: ticket_type,
    userId?: string,
  ):Promise<Duration> {
    // Determine average first response time
    const tickets = await db.user_tickets.findMany({
      where: userId
        ? {
          user_id: userId,
          guild_id: guildId,
          type,
          archived_at: {
            not: undefined,
            lte: new Date(), // Less than or equal to now
          },
        }
        : {
          guild_id: guildId,
          type,
          archived_at: {
            not: undefined,
            lte: new Date(), // Less than or equal to now
          },
        },
      orderBy: {
        created_at: 'asc',
      },
      select: {
        archived_at: true,
        created_at: true,
      },
    });

    log.debug(F, `[avgArchiveTime] tickets: ${tickets.length}`);

    if (tickets.length === 0) {
      return Duration.fromObject({ seconds: 0 });
    }

    // Calculate differences in milliseconds and filter out invalid entries
    const durations: number[] = tickets
      .map(ticket => {
        if (ticket.archived_at && ticket.created_at) {
          return DateTime.fromJSDate(new Date(ticket.archived_at))
            .diff(DateTime.fromJSDate(new Date(ticket.created_at)), 'seconds')
            .as('seconds'); // Get difference in seconds
        }
        return null;
      })
      .filter(diff => diff !== null) as number[]; // Filter out tickets where calculation was not possible
    log.debug(F, `[avgArchiveTime] durations: ${JSON.stringify(durations, null, 2)}`);

    // Calculate average
    const durationAvg = durations.reduce((acc, curr) => acc + curr, 0) / durations.length;
    log.debug(F, `[avgArchiveTime] durationAvg: ${durationAvg}`);

    return Duration.fromObject({ seconds: durationAvg });
  }

  export async function avgTotalTicketTime(
    guildId: string,
    type: ticket_type,
    userId?: string,
  ):Promise<Duration> {
    // Determine average first response time
    const tickets = await db.user_tickets.findMany({
      where: userId
        ? {
          user_id: userId,
          guild_id: guildId,
          type,
          deleted_at: {
            not: undefined,
            lte: new Date(), // Less than or equal to now
          },
        }
        : {
          guild_id: guildId,
          type,
          deleted_at: {
            not: undefined,
            lte: new Date(), // Less than or equal to now
          },
        },
      orderBy: {
        created_at: 'asc',
      },
      select: {
        deleted_at: true,
        created_at: true,
      },
    });
    log.debug(F, `[avgTotalTicketTime] tickets: ${tickets.length}`);

    if (tickets.length === 0) return Duration.fromObject({ seconds: 0 });

    // Calculate differences in milliseconds and filter out invalid entries
    const durations: number[] = tickets
      .map(ticket => {
        if (ticket.deleted_at && ticket.created_at) {
          return DateTime.fromJSDate(new Date(ticket.deleted_at))
            .diff(DateTime.fromJSDate(new Date(ticket.created_at)), 'seconds')
            .as('seconds'); // Get difference in seconds
        }
        return null;
      })
      .filter(diff => diff !== null) as number[]; // Filter out tickets where calculation was not possible
    // log.debug(F, `[avgTotalTicketTime] durations: ${JSON.stringify(durations, null, 2)}`);

    // Calculate average
    const durationAvg = durations.reduce((acc, curr) => acc + curr, 0) / durations.length;
    // log.debug(F, `[avgTotalTicketTime] durationAvg: ${durationAvg}`);

    return Duration.fromObject({ seconds: durationAvg });
  }

  export async function totalTickets(
    guildId: string,
    type: ticket_type,
    userId?: string,
  ):Promise<number> {
    // log.debug(F, '[totalTickets]');
    return db.user_tickets.count({
      where: userId
        ? {
          user_id: userId,
          guild_id: guildId,
          type,
        }
        : {
          guild_id: guildId,
          type,
        },
    });
  }

  export async function firstResponseCount(
    guildId: string,
    type: ticket_type,
    userId: string,
  ):Promise<number> {
    return db.user_tickets.count({
      where: {
        first_response_user: userId,
        guild_id: guildId,
        type,
      },
    });
  }

  export async function userParticipation(
    guildId: string,
    type: ticket_type,
    userId: string,
  ):Promise<{
      messages: number;
      ticket_id: string;
      ticket: {
        guild_id: string;
        type: $Enums.ticket_type;
      };
    }[]> {
    return db.user_ticket_participant.findMany({
      where: {
        user_id: userId,
        ticket: {
          guild_id: guildId,
          type,
        },
      },
      select: {
        ticket_id: true,
        messages: true,
        ticket: {
          select: {
            guild_id: true,
            type: true,
          },
        },
      },
    });
  }
}

namespace validate {
  export async function tripsitChannel(
    interaction: ChatInputCommandInteraction | ButtonInteraction | ChannelSelectMenuInteraction | RoleSelectMenuInteraction,
  ): Promise<string[]> {
    if (!interaction.guild) return [text.guildOnly()];
    await util.sessionDataInit(interaction.guild.id);

    const channelId = global.sessionsSetupData[interaction.guild.id].tripsitChannel;
    if (!channelId) return ['\n\n**⚠️ No TripSit Channel set! ⚠️**'];

    const channel = await interaction.guild.channels.fetch(channelId) as GuildTextBasedChannel;
    if (!channel) return ['\n\n**⚠️ TripSit Channel not found, try again with another channel! ⚠️**'];

    const missingPerms = await checkChannelPermissions(channel, permissionList.tripsitChannel);

    if (missingPerms.length > 0) {
      return [`\n\n**⚠️ Missing ${missingPerms.join(', ')} permission in <#${channel.id}> ⚠️**`];
    }

    // try {
    //   await interaction.guild.channels.fetch(channelId) as TextChannel;
    // } catch (err) {
    //   const sessionData = await db.session_data.findFirst({ where: { guild_id: interaction.guild.id } })
    //   if (sessionData) {
    //     await db.session_data.update({
    //       where: { id: sessionData.id },
    //       data: { tripsit_channel: undefined },
    //     });interaction.guild.channels.cache.get(c
    //   }
    //   return ['Tripsit channel was deleted, please re-run /tripsit setup!'];
    // }

    return [];
  }

  export async function metaChannel(
    interaction: ChatInputCommandInteraction | ButtonInteraction | ChannelSelectMenuInteraction | RoleSelectMenuInteraction,
  ): Promise<string[]> {
    if (!interaction.guild) return [text.guildOnly()];
    await util.sessionDataInit(interaction.guild.id);

    const channelId = global.sessionsSetupData[interaction.guild.id].metaChannel;
    if (!channelId) return []; // Meta channel is optional

    const channel = await interaction.guild.channels.fetch(channelId) as GuildTextBasedChannel;
    if (!channel) return ['\n\n**⚠️ Meta Channel not found, try again with another channel! ⚠️**'];

    const missingPerms = await checkChannelPermissions(channel, permissionList.metaChannel);

    if (missingPerms.length > 0) {
      return [`\n\n**⚠️ Missing ${missingPerms.join(', ')} permission in <#${channel.id}> ⚠️**`];
    }

    // try {
    //   await interaction.guild.channels.fetch(channelId) as TextChannel;
    // } catch (err) {
    //   const sessionData = await db.session_data.findFirst({ where: { guild_id: interaction.guild.id } })
    //   if (sessionData) {
    //     await db.session_data.update({
    //       where: { id: sessionData.id },
    //       data: { metaChannel: undefined },
    //     });
    //   }
    //   return ['Tripsit meta channel was deleted, please re-run /tripsit setup!'];
    // }

    return [];
  }

  export async function logChannel(
    interaction: ChatInputCommandInteraction | ButtonInteraction | ChannelSelectMenuInteraction | RoleSelectMenuInteraction,
  ): Promise<string[]> {
    if (!interaction.guild) return [text.guildOnly()];
    await util.sessionDataInit(interaction.guild.id);

    const channelId = global.sessionsSetupData[interaction.guild.id].logChannel;
    if (!channelId) return [];

    const channel = await interaction.guild.channels.fetch(channelId) as GuildTextBasedChannel;
    if (!channel) return ['\n\n**⚠️ Log Channel not found, try again with another channel! ⚠️**'];

    const missingPerms = await checkChannelPermissions(channel, permissionList.logChannel);

    if (missingPerms.length > 0) {
      return [`\n\n**⚠️ Missing ${missingPerms.join(', ')} permission in <#${channel.id}> ⚠️**`];
    }

    // try {
    //   await interaction.guild.channels.fetch(channelId) as TextChannel;
    // } catch (err) {
    //   const sessionData = await db.session_data.findFirst({ where: { guild_id: interaction.guild.id } })
    //   if (sessionData) {
    //     await db.session_data.update({
    //       where: { id: sessionData.id },
    //       data: { log_channel: undefined },
    //     });
    //   }
    //   return ['Log channel was deleted, please re-run /tripsit setup!'];
    // }

    return [];
  }

  export async function tripsitterRoles(
    interaction: ChatInputCommandInteraction | ButtonInteraction | ChannelSelectMenuInteraction | RoleSelectMenuInteraction,
  ): Promise<string[]> {
    if (!interaction.guild) return [text.guildOnly()];
    const sessionData = await util.sessionDataInit(interaction.guild.id);

    const roleIds = sessionData.tripsitterRoles;
    if (!roleIds) return ['\n**⚠️ No Tripsitter Roles set, I wont be able to invite people to private threads! ⚠️**'];

    const roleCheck = await Promise.all(roleIds.map(async roleId => {
      if (!interaction.guild) return text.guildOnly();
      // For each of the tripsitter roles, validate:

      // The role exists
      const role = await interaction.guild?.roles.fetch(roleId);
      if (!role) return `\n**⚠️ ${role} not found, try again with another role! ⚠️**`;

      // Check that the role is mentionable by the bot
      if (!role.mentionable) {
        // If the role isn't mentionable, double check that the bot doesn't have the permission to mention everyone
        const perms = await checkGuildPermissions(interaction.guild, permissionList.mentionEveryone);
        if (perms.length > 0) {
          return `\n**⚠️ The ${role} isn't mentionable, and I don't have the permission to mention them! ⚠️**`;
        }
        log.debug(F, `[tripsitterRoles] The ${role} isn't mentionable, but I have the permission to mention hidden roles!`);
      }

      return undefined;
    }));

    const filteredResults = roleCheck.filter(role => role !== undefined);

    // log.debug(F, `[tripsitterRoles] filteredResults: ${filteredResults}`);

    return filteredResults as string[];
  }

  export async function giveRemoveRoles(
    interaction: ChatInputCommandInteraction | ButtonInteraction | ChannelSelectMenuInteraction | RoleSelectMenuInteraction,
  ): Promise<string[]> {
    if (!interaction.guild) return [text.guildOnly()];
    const sessionData = await util.sessionDataInit(interaction.guild.id);

    // If the bot should give or remove roles, check if the bot has the ManageRoles permission
    // Also check that the provided roles are below the bot's current role
    const { givingRoles } = sessionData;
    const { removingRoles } = sessionData;
    if (givingRoles || removingRoles) {
      const perms = await checkGuildPermissions(interaction.guild, permissionList.guildPermissions);
      if (perms.length > 0) {
        log.error(F, `Missing guild permission ${perms.join(', ')} in ${interaction.guild}!`);
        return [`\n\n**⚠️ I need the ${perms.join(', ')} permission in order to give or remove roles! ⚠️**`];
      }

      const myRole = interaction.guild.members.me?.roles.highest;

      // Get a list of all roles that are being added or removed
      const roleIds = [
        ...(givingRoles ?? []),
        ...(removingRoles ?? []),
      ];

      // log.debug(F, `[giveRemoveRoles] roleIds: ${roleIds.join(', ')}`);

      const higherRoles = await Promise.all(
        roleIds.map(async roleId => {
          const role = await interaction.guild?.roles.fetch(roleId);
          // log.debug(F, `[giveRemoveRoles] role: ${JSON.stringify(role, null, 2)}`);

          if (myRole && role && myRole.comparePositionTo(role) < 0) {
            // log.debug(F, `[giveRemoveRoles] myRole.comparePositionTo(role): ${myRole?.comparePositionTo(role)}`);
            return role;
          }
          return undefined;
        }),
      );

      // Filter out 'undefined' values
      const filteredResults = higherRoles.filter((role): role is Role => role !== undefined);

      // log.debug(F, `[giveRemoveRoles] filteredResults: ${filteredResults}`);

      if (filteredResults.length > 0) {
        // log.error(F, `The bot's role is not higher than the roles being added in ${interaction.guild.name}!`);
        return [`\n\n**⚠️The bot's role is needs to be higher than the ${filteredResults.join(', ')} role(s)!⚠️**`];
      }

      if (givingRoles && removingRoles) {
        // If both options are supplied, make sure that they don't share any roles
        const sharedRoles = await Promise.all(
          givingRoles.map(async roleId => {
            if (removingRoles.includes(roleId)) {
              return interaction.guild?.roles.fetch(roleId);
            }
            return undefined;
          }),
        );

        // Filter out 'undefined' values
        const filteredShared = sharedRoles.filter((role): role is Role => role !== undefined);

        if (filteredShared.length > 0) {
          return [`\n\n**⚠️The role(s) ${filteredShared.join(', ')} are in both the giving and removing roles!⚠️**`];
        }
      }
    }

    return [];
  }
}

namespace button {
  export function helpPage() {
    return new ButtonBuilder()
      .setCustomId('tripsit~help')
      .setLabel('Help')
      .setEmoji('❓')
      .setStyle(ButtonStyle.Primary);
  }

  export function setupPage() {
    return new ButtonBuilder()
      .setCustomId('tripsit~setup')
      .setLabel('Setup')
      .setEmoji('⚙️')
      .setStyle(ButtonStyle.Primary);
  }

  export function privacyPage() {
    return new ButtonBuilder()
      .setCustomId('tripsit~privacy')
      .setLabel('Privacy')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Primary);
  }

  export function startPage() {
    return new ButtonBuilder()
      .setCustomId('tripsit~startPage')
      .setLabel('Start')
      .setEmoji('🚀')
      .setStyle(ButtonStyle.Primary);
  }

  export function startSession() {
    return new ButtonBuilder()
      .setCustomId('tripsit~startSession')
      .setLabel('I want to talk to a tripsitter!')
      .setEmoji('🚀')
      .setStyle(ButtonStyle.Primary);
  }

  export function statsPage() {
    return new ButtonBuilder()
      .setCustomId('tripsit~stats')
      .setLabel('Stats')
      .setEmoji('📊')
      .setStyle(ButtonStyle.Primary);
  }

  export function setupPageOne() {
    return new ButtonBuilder()
      .setCustomId('tripsit~pageOne')
      .setLabel('Page One')
      .setEmoji('1️⃣')
      .setStyle(ButtonStyle.Primary);
  }

  export function setupPageTwo() {
    return new ButtonBuilder()
      .setCustomId('tripsit~pageTwo')
      .setLabel('Page Two')
      .setEmoji('2️⃣')
      .setStyle(ButtonStyle.Primary);
  }

  export function setupPageThree() {
    return new ButtonBuilder()
      .setCustomId('tripsit~pageThree')
      .setLabel('Page Three')
      .setEmoji('3️⃣')
      .setStyle(ButtonStyle.Primary);
  }

  export function dev() {
    return new ButtonBuilder()
      .setCustomId('tripsit~dev')
      .setLabel('Dev')
      .setEmoji('🛠️')
      .setStyle(ButtonStyle.Primary);
  }

  export function save() {
    return new ButtonBuilder()
      .setCustomId('tripsit~save')
      .setLabel('Save')
      .setEmoji('💾')
      .setStyle(ButtonStyle.Success);
  }

  export function updateEmbed() {
    return new ButtonBuilder()
      .setCustomId('tripsit~updateEmbed')
      .setLabel('Update Embed Text')
      .setEmoji('📝')
      .setStyle(ButtonStyle.Primary);
  }

  export function sessionHardClose(targetId:string) {
    return new ButtonBuilder()
      .setCustomId(`tripsit~hardClose~${targetId}`)
      .setLabel('I\'m good now!')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success);
  }

  export function sessionSoftClose(targetId:string) {
    return new ButtonBuilder()
      .setCustomId(`tripsit~softClose~${targetId}`)
      .setLabel('They\'re good now!')
      .setEmoji('👍')
      .setStyle(ButtonStyle.Success);
  }

  export function sessionBackup(targetId:string) {
    return new ButtonBuilder()
      .setCustomId(`tripsit~sessionBackup~${targetId}`)
      .setLabel('I need backup')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Danger);
  }
}

namespace page {
  export async function start(
    interaction: ChatInputCommandInteraction | ButtonInteraction
    | UserSelectMenuInteraction,
  ): Promise<InteractionEditReplyOptions> {
    log.info(F, await commandContext(interaction));
    if (!interaction.guild || !interaction.member) return { content: text.guildOnly() };

    const sessionData = await util.sessionDataInit(interaction.guild.id);

    const components:ActionRowBuilder<ButtonBuilder | UserSelectMenuBuilder>[] = [
      await util.navMenu('start'),
    ];

    let description = stripIndents`
      Here you  can start a new tripsit session.

      Just click the button below, enter in some details, and we'll create a private thread just for you to talk with our team.
    `;

    // Check if the sessionData has been set up, and if the Tripsitter Roles are provided, and if the user
    // has one of those roles
    if (sessionData.tripsitterRoles) {
      const member = interaction.guild.members.cache.get(interaction.user.id);
      if (member) {
        const hasTripsitterRole = member.roles.cache.some(role => sessionData.tripsitterRoles?.includes(role.id));
        if (hasTripsitterRole) {
          description += `\n\n
            **You have one of the tripsitter roles, and can start on behalf of someone else.**

            If you want to start a session for someone else, select them from the dropdown below, and click the button to start the session.
          `;

          if (interaction.isUserSelectMenu()) {
            log.debug(F, 'Interaction is user select menu');
            components.push(
              new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
                select.sessionUser().setCustomId(`tripsit~sessionUser~${interaction.values[0]}`),
              ),
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                button.startSession().setLabel('I want them to talk to a tripsitter!'),
              ),
            );
          } else {
            components.push(
              new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
                select.sessionUser(),
              ),
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                button.startSession(),
              ),
            );
          }
        } else {
          components.push(
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              button.startSession(),
            ),
          );
        }
      }
    }

    return {
      embeds: [
        new EmbedBuilder()
          .setTitle(`${interaction.guild.name}'s TripSit Sessions Start`)
          .setDescription(description),
      ],
      components,
    };
  }

  export async function help(
    interaction: ChatInputCommandInteraction | ButtonInteraction,
  ): Promise<InteractionEditReplyOptions> {
    log.info(F, await commandContext(interaction));
    if (!interaction.guild || !interaction.member) return { content: text.guildOnly() };

    return {
      embeds: [
        new EmbedBuilder()
          .setAuthor(null)
          .setTitle(`${interaction.guild.name}'s TripSit Sessions Help`)
          .setDescription(stripIndents`
            Information on TripSit Sessions

            ${text.statusEmoji('OPEN')} - Session is brand new
            ${text.statusEmoji('OWNED')} - Session is active
            ${text.statusEmoji('SOFT_CLOSED')} - Session is soft closed (Closed by the team)
            ${text.statusEmoji('HARD_CLOSED')} - Session is hard closed (Closed by the user)
            ${text.statusEmoji('ARCHIVED')} - Session is archived
          `)
          .setFooter(null)],
      components: [
        await util.navMenu('help'),
      ],
    };
  }

  export async function privacy(
    interaction: ChatInputCommandInteraction | ButtonInteraction,
  ): Promise<InteractionEditReplyOptions> {
    log.info(F, await commandContext(interaction));
    if (!interaction.guild || !interaction.member) return { content: text.guildOnly() };

    return {
      embeds: [
        new EmbedBuilder()
          .setTitle(`${interaction.guild.name}'s TripSit Sessions Privacy`)
          .setDescription(stripIndents`
            Here we can review your privacy and delete your thread.
          `),
      ],
      components: [
        await util.navMenu('privacy'),
      ],
    };
  }

  export async function setupPageOne(
    interaction: ChatInputCommandInteraction | ButtonInteraction
    | ChannelSelectMenuInteraction
    | RoleSelectMenuInteraction,
  ): Promise<InteractionEditReplyOptions> {
    log.info(F, await commandContext(interaction));
    if (!interaction.guild || !interaction.member || !interaction.channel || interaction.channel.isDMBased()) return { content: text.guildOnly() };
    // This function will guide the user through setup
    // Discord only allows 5 action rows in an embed, and we're using 1 for the navigation buttons
    // We need another row for the "Save" button, so we only have 3 rows to work with
    // We have 6 options to setup, so we'll need to split it into 2 pages
    // I also added a 'dev' button that will populate it with information that best helps tripsit devs to debug.
    // Setup page is visible to everyone, but only those with ManageChannels permissions can select options

    /* We need to do a bunch of validations to make sure that the inputs are correct:
    TripSit Channel
      View Channel - to see the channel
      Send Messages - to send messages
      Create Private Threads - to create private threads
      Send Messages in Threads - to send messages in threads
      Manage Threads - to delete threads when they're done
      Manage Messages - to pin the "im good" message to the top of the thread
      Double check that @everyone can see this channel
    TripSitter Roles
      Ability to mention? - to ping the roles?
    Meta Channel, if provided
      View Channel - to see the channel
      Send Messages - to send messages
      Create Private Threads - to create private threads, when requested through the bot
      Send Messages in Threads - to send messages in threads
      Manage Threads - to delete threads when they're done
      Double check that the Tripsitter Roles can access this channel, and @everyone can't
    */

    await util.sessionDataInit(interaction.guild.id);

    let description = stripIndents`
      Here we can setup TripSit Sessions in your guild.
      ### Tripsitting Channel
      I will create a button in this channel that users can click to get help.
      I will also create new private threads in this channel.
      This channel should be public to anyone you want to be able to ask for help.
      In order to setup the tripsitting feature I need:
      View Channel - to see the channel
      Send Messages - to send messages
      Create Private Threads - to create private threads
      Send Messages in Threads - to send messages in threads
      Manage Threads - to delete threads when they're done
      Manage Messages - to pin the "im good" message to the top of the thread
      ### Tripsitting Roles
      When the private thread is created, I will ping these roles to invite them to the thread.
      ### Meta Discussion Room (Optional)
      This allows your Tripsitting Roles to coordinate efforts.
      The bot will post when new threads are created, and when they're closed.
      This channel should be private to only your Tripsitting Roles.
      In order to setup the meta channel feature I need:
      View Channel - to see the channel
      Send Messages - to send messages
      Create Private Threads - to create private threads, when requested through the bot
      Send Messages in Threads - to send messages in threads
      Manage Threads - to delete threads when they're done
    `;

    // log.debug(F, `[setupPageOne] setupOptions: ${JSON.stringify(global.sessionsSetupData[interaction.guild.id], null, 2)}`);

    description += await validate.tripsitChannel(interaction);
    description += (await validate.tripsitterRoles(interaction)).join('');
    description += await validate.metaChannel(interaction);

    return {
      embeds: [
        new EmbedBuilder()
          .setTitle(`${interaction.guild.name}'s TripSit Sessions Setup`)
          .setDescription(description),
      ],
      components: [
        await util.navMenu('setup'),
        ...await util.setupMenu('setupPageOne', interaction),
      ],
    };
  }

  export async function setupPageTwo(
    interaction: ChatInputCommandInteraction | ButtonInteraction
    | ChannelSelectMenuInteraction
    | RoleSelectMenuInteraction,
  ): Promise<InteractionEditReplyOptions> {
    log.info(F, await commandContext(interaction));
    if (!interaction.guild || !interaction.member) return { content: text.guildOnly() };
    /* We need to do a bunch of validations to make sure that the inputs are correct:
    Giving Roles
      The bot needs the ManageRoles permission so it can add and remove roles
      Check that the bot's role is higher than all roles being removed or added, otherwise it will error
    Removing Roles
      The bot needs the ManageRoles permission so it can add and remove roles
      Check that the bot's role is higher than all roles being removed or added, otherwise it will error
    Log Channel, if provided
      View Channel - to see the channel
      Send Messages - to send messages
    */

    let description = stripIndents`
      Here we can setup TripSit Sessions in your guild.
      ### Give These Roles (Optional)
      These roles are applied to the person in need of help after they submit their issue.
      This allows your Tripsitting Roles to easily identify who needs help.
      You can also limit access to your server for people with this roles.
      This can make it easier for them to access their help thread when your server has a lot of channels.
      
      In order to give roles to people I need the **Manage Roles** permission.
      My role needs to be higher than all other roles you want removed, so put moderators and admins above me in the list!
      ### Remove These Roles (Optional)
      These roles are removed from the person in need of help after they submit their issue.
      If you have roles that give access to channels, you may need to remove them to clean up the user's UI.
      ### Log Channel (Optional)
      Logging of tripsit session statistics will happen here.
      This is mostly for nerds who want to see how sessions are going.
      In order to setup the log channel feature I need:
      View Channel - to see the channel
      Send Messages - to send messages
    `;

    description += (await validate.giveRemoveRoles(interaction)).join('');
    description += await validate.logChannel(interaction);

    return {
      embeds: [
        new EmbedBuilder()
          .setTitle(`${interaction.guild.name}'s TripSit Sessions Setup Page Two`)
          .setDescription(description),
      ],
      components: [
        await util.navMenu('setup'),
        ...await util.setupMenu('setupPageTwo', interaction),
      ],
    };
  }

  export async function setupPageThree(
    interaction: ChatInputCommandInteraction | ButtonInteraction
    | ChannelSelectMenuInteraction
    | RoleSelectMenuInteraction,
  ): Promise<InteractionEditReplyOptions> {
    log.info(F, await commandContext(interaction));
    if (!interaction.guild || !interaction.member) return { content: text.guildOnly() };

    const sessionData = await util.sessionDataInit(interaction.guild.id);

    return {
      embeds: [
        new EmbedBuilder()
          .setTitle(`${interaction.guild.name}'s TripSit Sessions Setup Page Three`)
          .setDescription(stripIndents`
          This is where you can setup the button that will be used to start a session.
          ### Title
          > ${sessionData.title}
          ### Description
          ${sessionData.description.split('\n').map(line => `> ${line}`).join('\n')}
          ### Footer
          > ${sessionData.footer}
          ### Button Text
          > ${sessionData.buttonText}
          ### Button Emoji
          > ${sessionData.buttonEmoji}
        `),
      ],
      components: [
        await util.navMenu('setup'),
        ...await util.setupMenu('setupPageThree', interaction),
      ],
    };
  }

  export async function setupSave(
    interaction: ButtonInteraction,
  ): Promise<InteractionEditReplyOptions> {
    log.info(F, await commandContext(interaction));
    if (!interaction.guild || !interaction.member || !interaction.channel || interaction.channel.isDMBased()) return { content: text.guildOnly() };

    // Initialize data to be used
    const sessionData = await util.sessionDataInit(interaction.guild.id);
    // The following should not happen because the Save button only appears when the setup is complete
    // This is mostly for type-safety
    if (!sessionData.tripsitChannel) return { content: 'No TripSit Channel set!' };

    // Check if the intro_message has already been sent, and if so, update it with the newest info
    let introMessageUpdated = false;
    let introMessage = {} as Message;
    if (sessionData.introMessage) {
      log.debug(F, `[setupSave] introMessage ID: ${sessionData.introMessage}`);
      const channelTripsit = await interaction.guild.channels.fetch(sessionData.tripsitChannel) as GuildTextBasedChannel;

      log.debug(F, `[setupSave] channelTripsit: ${channelTripsit.name}`);

      try {
        introMessage = await channelTripsit.messages.fetch(sessionData.introMessage) as Message;
        log.debug(F, 'fetched message record');
        // Update the message with the newest info

        await introMessage.edit({
          embeds: [
            new EmbedBuilder()
              .setTitle(sessionData.title)
              .setFooter({ text: sessionData.footer })
              .setDescription(sessionData.description)
              .setColor(Colors.Blue),
          ],
          components: [
            new ActionRowBuilder<ButtonBuilder>()
              .addComponents(
                button.startSession().setLabel(sessionData.buttonText).setEmoji(sessionData.buttonEmoji),
              ),
          ],
        });
        introMessageUpdated = true;
        log.debug(F, 'introMessage updated');
      } catch (err) {
        log.error(F, 'Error updating intro message');
        const guildData = await db.discord_guilds.upsert({
          where: { id: interaction.guild.id },
          create: { id: interaction.guild.id },
          update: {},
        });
        const existingSessionData = await db.session_data.findFirst({ where: { guild_id: guildData.id } });
        if (existingSessionData) {
          await db.session_data.update({
            where: { id: existingSessionData.id },
            data: { intro_message: undefined },
          });
        } else {
          log.error(F, `Error updating intro message, and i couldn't remove it from the db: ${err}`);
        }
      }
    }

    if (!introMessageUpdated) {
    // Send the message with the button to the tripsit room
      const channelTripsit = await interaction.guild.channels.fetch(sessionData.tripsitChannel) as GuildTextBasedChannel;
      // We need to send the message, otherwise it has the "user used /tripsit setup" at the top
      introMessage = await channelTripsit.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(sessionData.title)
            .setFooter({ text: sessionData.footer })
            .setDescription(sessionData.description)
            .setColor(Colors.Blue),
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              button.startSession(),
            ),
        ],
      });
      sessionData.introMessage = introMessage.id;
      log.debug(F, `[setupSave] Sent new intro message in ${channelTripsit.name}`);
    }

    let description = stripIndents`
      I created a button in <#${sessionData.tripsitChannel}> that users can click to get help.
      This is also where I will create new private threads. 
    `;

    if (sessionData.givingRoles || sessionData.removingRoles) {
      if (sessionData.givingRoles) {
        const givingRolesList = sessionData.givingRoles?.map(roleId => `<@&${roleId}>`).join(', ') ?? 'None';
        description += `
          I will give users who need help the ${givingRolesList} role(s).
        `;
      }
      if (sessionData.removingRoles) {
        const removingRolesList = sessionData.removingRoles?.map(roleId => `<@&${roleId}>`).join(', ') ?? 'None';
        description += `
          I will remove the ${removingRolesList} role(s) from users who need help.
        `;
      }
    }

    if (sessionData.metaChannel) {
      // Send the message with the button to the meta tripsit room
      const channelMetaTripsit = await interaction.guild.channels.fetch(sessionData.metaChannel) as GuildTextBasedChannel;
      // We need to send the message, otherwise it has the "user used /tripsit setup" at the top
      await channelMetaTripsit.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('Welcome to TripSit Sessions!')
            .setDescription('This channel will be used to coordinate tripsitting efforts.')
            .setColor(Colors.Blue),
        ],
      });

      description += `
        I will use <#${channelMetaTripsit.id}> to coordinate tripsitting efforts.
      `;
    }

    if (sessionData.logChannel) {
      // Send the message with the button to the meta tripsit room
      const channelLogTripsit = await interaction.guild.channels.fetch(sessionData.logChannel) as GuildTextBasedChannel;
      // We need to send the message, otherwise it has the "user used /tripsit setup" at the top
      await channelLogTripsit.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('Logging channel initialized!')
            .setDescription(stripIndents`Logging initialized for ${interaction.guild.name}!`)
            .setColor(Colors.Blue),
        ],
      });

      description += stripIndents`
        I will use <#${channelLogTripsit.id}> to log tripsitting statistics.
      `;
    }

    const guildData = await db.discord_guilds.upsert({
      where: { id: interaction.guild.id },
      create: { id: interaction.guild.id },
      update: {},
    });
    const userData = await db.users.upsert({
      where: { discord_id: interaction.user.id },
      create: { discord_id: interaction.user.id },
      update: {},
    });

    // Save this info to the DB
    // This runs after the message is sent because we need to update the session_data table with the message ID
    const sessionDataUpdate = {
      guild_id: guildData.id,
      tripsit_channel: sessionData.tripsitChannel,
      tripsitter_roles: sessionData.tripsitterRoles ?? [],
      meta_channel: sessionData.metaChannel,
      log_channel: sessionData.logChannel,
      giving_roles: sessionData.givingRoles ?? [],
      removing_roles: sessionData.removingRoles ?? [],
      title: sessionData.title,
      description: sessionData.description,
      footer: sessionData.footer,
      intro_message: sessionData.introMessage,
      button_emoji: sessionData.buttonEmoji,
      button_text: sessionData.buttonText,
      created_by: userData.id,
      created_at: new Date(),
      updated_by: userData.id,
      updated_at: new Date(),
    } as Omit<session_data, 'id'>;

    const existingSessionData = await db.session_data.findFirst({ where: { guild_id: guildData.id } });
    if (existingSessionData) {
      await db.session_data.update({
        where: { id: existingSessionData.id },
        data: sessionDataUpdate,
      });
    } else {
      await db.session_data.create({
        data: sessionDataUpdate,
      });
    }
    log.debug(F, `[setupSave] saved sessiondata to db: ${JSON.stringify(sessionDataUpdate, null, 2)})`);

    return {
      embeds: [
        new EmbedBuilder()
          .setTitle(`${interaction.guild.name}'s TripSit Sessions Setup ${existingSessionData ? 'Updated' : 'Saved'}`)
          .setDescription(description),
      ],
      components: [
        await util.navMenu('setup'),
      ],
    };
  }

  export async function stats(
    interaction: ChatInputCommandInteraction | ButtonInteraction,
  ): Promise<InteractionEditReplyOptions> {
    log.info(F, await commandContext(interaction));
    if (!interaction.guild || !interaction.member) return { content: text.guildOnly() };

    return {
      embeds: [
        new EmbedBuilder()
          .setTitle(`${interaction.guild.name}'s TripSit Sessions Stats`)
          .setDescription(stripIndents`
          Statistics on sessions
        `),
      ],
      components: [
        await util.navMenu('stats'),
      ],
    };
  }
}

namespace select {
  export function tripsitChannel() {
    return new ChannelSelectMenuBuilder()
      .setCustomId('tripsit~tripsitChannel')
      .setPlaceholder('Tripsitting Channel')
      .addChannelTypes(ChannelType.GuildText)
      .setMinValues(1)
      .setMaxValues(1);
  }

  export function tripsitterRoles() {
    return new RoleSelectMenuBuilder()
      .setCustomId('tripsit~tripsitterRoles')
      .setPlaceholder('Tripsitting Roles')
      .setMinValues(1)
      .setMaxValues(25);
  }

  export function metaChannel() {
    return new ChannelSelectMenuBuilder()
      .setCustomId('tripsit~metaChannel')
      .setPlaceholder('Meta Discussion Room (Optional)')
      .addChannelTypes(ChannelType.GuildText)
      .setMinValues(0)
      .setMaxValues(1);
  }

  export function logChannel() {
    return new ChannelSelectMenuBuilder()
      .setCustomId('tripsit~logChannel')
      .setPlaceholder('Log Channel (Optional)')
      .addChannelTypes(ChannelType.GuildText)
      .setMinValues(0)
      .setMaxValues(1);
  }

  export function givingRoles() {
    return new RoleSelectMenuBuilder()
      .setCustomId('tripsit~givingRoles')
      .setPlaceholder('Give These Roles (Optional)')
      .setMinValues(1)
      .setMaxValues(25);
  }

  export function removingRoles() {
    return new RoleSelectMenuBuilder()
      .setCustomId('tripsit~removingRoles')
      .setPlaceholder('Remove These Roles (Optional)')
      .setMinValues(1)
      .setMaxValues(25);
  }

  export function sessionUser() {
    return new UserSelectMenuBuilder()
      .setCustomId('tripsit~sessionUser')
      .setPlaceholder('User to start session with (Optional)')
      .setMinValues(1)
      .setMaxValues(1);
  }
}

namespace permissionList {
  export const tripsitChannel:PermissionResolvable[] = [
    'ViewChannel',
    'SendMessages',
    'SendMessagesInThreads',
    'CreatePrivateThreads',
    'ManageMessages',
    'ManageThreads',
  ];
  export const guildPermissions:PermissionResolvable[] = [
    'ManageRoles',
  ];
  export const metaChannel:PermissionResolvable[] = [
    'ViewChannel',
    'SendMessages',
    'SendMessagesInThreads',
    'CreatePrivateThreads',
    'ManageThreads',
  ];
  export const logChannel:PermissionResolvable[] = [
    'ViewChannel',
    'SendMessages',
  ];

  export const mentionEveryone:PermissionResolvable[] = [
    'MentionEveryone',
  ];

  export const manageThreads:PermissionResolvable[] = [
    'SendMessages',
    'ManageThreads',
  ];
}

export async function tripsitTimer() {
  // Used in timer.ts
  // Runs every 60 seconds in production
  await timer.archiveTickets();
  await timer.deleteTickets();
  // await timer.cleanupTickets();
}

export async function tripsitMessage(
  messageData: Message<boolean>,
): Promise<void> {
  // Used in messageCreate.ts
  await messageData.fetch();
  await util.messageStats(messageData);
}

export async function tripsitReaction(
  messageReaction: MessageReaction,
  user: User,
): Promise<void> {
  // Used in messageReactionAdd.ts
  if (!messageReaction.message.guild) return; // Ignore DMs
  if (!messageReaction.message.thread) return; // Ignore non-threads
  await messageReaction.fetch();
  await user.fetch();

  log.debug(F, `[tripsitReaction] messageReaction.emoji: ${messageReaction.emoji}`);
  log.debug(F, `[tripsitReaction] messageReaction.emoji.name: ${messageReaction.emoji.name}`);

  const reactionEmojiList = [
    text.rateOne(),
    text.rateTwo(),
    text.rateThree(),
    text.rateFour(),
    text.rateFive(),
  ];

  // If this isn't one of the approved emojis, ignore
  // if (!reactionEmojiList.includes(messageReaction.emoji.name)) return;

  // Get the current threadData from the db
  const threadData = await db.user_tickets.findFirst({
    where: { thread_id: messageReaction.message.thread.id },
  });
  if (!threadData) return;

  const userData = await db.users.upsert({
    where: { discord_id: user.id },
    create: { discord_id: user.id },
    update: {},
  });

  // If the user clicking the reaction is not the thread's user, ignore it
  if (userData.id !== threadData.user_id) return;

  await messageReaction.message.edit({
    content: stripIndents`
    ${emojiGet('Invisible')}
    > Thank you for your feedback, here's a cookie! 🍪
    ${emojiGet('Invisible')}
    `,
  });

  // const score = reactionEmojiList.indexOf(messageReaction.emoji.name) + 1;

  // Add the user's reaction to the db
  // await db.user_tickets.update({
  //   where: { id: threadData.id },
  //   data: {
  //     survey_response: score,
  //   },
  // });

  const sessionData = await util.sessionDataInit(messageReaction.message.guild.id);
  if (sessionData.logChannel) {
    const channelLogTripsit = await messageReaction.message.guild.channels.fetch(sessionData.logChannel) as GuildTextBasedChannel;
    await channelLogTripsit.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Blue)
          .setDescription(stripIndents`
            Collected ${messageReaction.emoji.name} from <@${user.id}>
          `),
      ],
    });
  }
}

export async function tripsitSelect(
  interaction: ChannelSelectMenuInteraction | StringSelectMenuInteraction | RoleSelectMenuInteraction | UserSelectMenuInteraction,
): Promise<void> {
  if (!interaction.guild) return;
  // Used in selectMenu.ts
  const menuId = interaction.customId;
  // log.debug(F, `[tripsitSelect] menuId: ${menuId}`);
  const [, menuAction] = menuId.split('~') as [
    null,
    /* Setup Options */'tripsitChannel' | 'metaChannel' | 'tripsitterRoles' | 'givingRoles' | 'removingRoles' |
    /* Tripsitting selection */ 'sessionUser',
  ];

  await util.sessionDataInit(interaction.guild.id);

  // Save the most recent interaction data to the global  variable
  // We use a global variable so that it persists between interactions, but it's not stored in the db yet
  if (!interaction.isChatInputCommand()) {
    if (interaction.isChannelSelectMenu()) {
      if (interaction.customId === 'tripsit~tripsitChannel') {
        [global.sessionsSetupData[interaction.guild.id].tripsitChannel] = interaction.values;
      }
      if (interaction.customId === 'tripsit~metaChannel') {
        [global.sessionsSetupData[interaction.guild.id].metaChannel] = interaction.values;
      }
      if (interaction.customId === 'tripsit~logChannel') {
        [global.sessionsSetupData[interaction.guild.id].logChannel] = interaction.values;
      }
    }
    if (interaction.isRoleSelectMenu()) {
      if (interaction.customId === 'tripsit~tripsitterRoles') {
        global.sessionsSetupData[interaction.guild.id].tripsitterRoles = interaction.values;
      }
      if (interaction.customId === 'tripsit~givingRoles') {
        global.sessionsSetupData[interaction.guild.id].givingRoles = interaction.values;
      }
      if (interaction.customId === 'tripsit~removingRoles') {
        global.sessionsSetupData[interaction.guild.id].removingRoles = interaction.values;
      }
    }
  }
  // log.debug(F, `[tripsitSelect] setupOptionsAfter: ${JSON.stringify(setupOptions, null, 2)}`);

  switch (menuAction) {
    case 'tripsitChannel':
      await interaction.update(await page.setupPageOne(interaction as ChannelSelectMenuInteraction));
      break;
    case 'tripsitterRoles':
      await interaction.update(await page.setupPageOne(interaction as RoleSelectMenuInteraction));
      break;
    case 'metaChannel':
      await interaction.update(await page.setupPageOne(interaction as ChannelSelectMenuInteraction));
      break;
    case 'givingRoles':
      await interaction.update(await page.setupPageTwo(interaction as RoleSelectMenuInteraction));
      break;
    case 'removingRoles':
      await interaction.update(await page.setupPageTwo(interaction as RoleSelectMenuInteraction));
      break;
    case 'sessionUser':
      await interaction.update(await page.start(interaction as UserSelectMenuInteraction));
      break;
    default:
      await interaction.update({
        content: "I'm sorry, I don't understand that command!",
      });
      break;
  }
}

export async function tripsitButton(
  interaction: ButtonInteraction,
): Promise<void> {
  // Used in buttonClick.ts
  const buttonID = interaction.customId;
  // log.debug(F, `[tripsitButton] buttonID: ${buttonID}`);
  const [, buttonAction] = buttonID.split('~') as [
    null,
    /* button actions */ 'backup' | 'softClose' | 'hardClose' | 'startSession' | 'updateEmbed' |
    /* page buttons */ 'startPage' | 'privacy' | 'help' | 'setup' | 'stats' | 'pageOne' | 'pageTwo' | 'pageThree' | 'dev' | 'save',
  ];

  // eslint-disable-next-line sonarjs/no-small-switch
  switch (buttonAction) {
    case 'backup':
      await util.tripsitmeBackup(interaction);
      break;
    case 'softClose':
      await util.softClose(interaction);
      break;
    case 'hardClose':
      await util.hardClose(interaction);
      break;
    case 'startSession':
      await util.startSession(interaction);
      break;
    case 'startPage':
      await interaction.update(await page.start(interaction));
      break;
    case 'privacy':
      await interaction.update(await page.privacy(interaction));
      break;
    case 'help':
      await interaction.update(await page.help(interaction));
      break;
    case 'setup':
      await interaction.update(await page.setupPageOne(interaction));
      break;
    case 'stats':
      await interaction.update(await page.stats(interaction));
      break;
    case 'pageOne':
      await interaction.update(await page.setupPageOne(interaction));
      break;
    case 'pageTwo':
      await interaction.update(await page.setupPageTwo(interaction));
      break;
    case 'pageThree':
      await interaction.update(await page.setupPageThree(interaction));
      break;
    case 'dev':
      await interaction.update(await page.setupPageOne(interaction));
      break;
    case 'save':
      await interaction.update(await page.setupSave(interaction));
      break;
    case 'updateEmbed':
      await util.updateEmbed(interaction);
      break;
    default:
      break;
  }
}

export const tripsitCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('tripsit')
    .setDescription('Setup TripSitting Sessions')
    .addSubcommand(subcommand => subcommand
      .setDescription('Setup TripSit Sessions')
      .setName('setup'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Start a TripSit Session')
      .setName('start'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Get info on how data is used, and delete it')
      .setName('privacy'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Get statistics on tripsitting sessions')
      .setName('stats'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Get info on the TripSit Sessions module')
      .setName('help')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: true });
    const subcommand = interaction.options.getSubcommand() as | 'setup' | 'start' | 'privacy' | 'help' | 'stats';
    // eslint-disable-next-line sonarjs/no-small-switch
    switch (subcommand) {
      case 'setup':
        try {
          await interaction.editReply(await page.setupPageOne(interaction));
        } catch (error) {
          log.error(F, `Failed to setupPageOne: ${error}`);
          await interaction.editReply({
            content: 'There was an error setting up the TripSit Sessions module!',
          });
        }
        break;
      case 'start':
        await interaction.editReply(await page.start(interaction));
        break;
      case 'privacy':
        await interaction.editReply(await page.privacy(interaction));
        break;
      case 'help':
        await interaction.editReply(await page.help(interaction));
        break;
      case 'stats':
        await interaction.editReply(await page.stats(interaction));
        break;
      default:
        break;
    }
    return true;
  },
};

export default tripsitCommand;
