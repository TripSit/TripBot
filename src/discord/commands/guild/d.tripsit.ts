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
  Guild,
  AllowedThreadTypeForTextChannel,
  time,
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
  AnySelectMenuInteraction,
  Utils,
  RoleSelectMenuBuilder,
  UserSelectMenuBuilder,
  StringSelectMenuBuilder,
  ChannelSelectMenuComponent,
  GuildTextBasedChannel,
} from 'discord.js';
import {
  TextInputStyle,
  ChannelType,
  ButtonStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { DateTime } from 'luxon';
import {
  ticket_status, user_tickets, users,
} from '@prisma/client';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';
import { checkChannelPermissions, checkGuildPermissions } from '../../utils/checkPermissions';
import { SlashCommand } from '../../@types/commandDef';
import { getComponentById } from '../global/d.ai';

const F = f(__filename);

/* TODO
* When threads remove someone from a thread, re-archive it
* Update the icon when someone first talks in the thread
* Remove the "own" button since it's automatic now
* Record the survey score
* Remove the meta button since no one uses it
* AI summary of the thread
* Allow the guild to select which roles to ignore
* Display how many sessions the user has had in the past
* Stats page
* Add ignored roles to the setup
* Turn all the function namespaces into consts, when possible
* MAke it so that if no one responds after 5 minutes or so, suggest an AI tripsitter
*/

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
  env.ROLE_DONOR_RED,
  env.ROLE_DONOR_ORANGE,
  env.ROLE_DONOR_YELLOW,
  env.ROLE_DONOR_GREEN,
  env.ROLE_DONOR_BLUE,
  env.ROLE_DONOR_PURPLE,
  env.ROLE_DONOR_PINK,
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

const deleteDuration = env.NODE_ENV === 'production'
  ? { days: 13.9 }
  : { minutes: 20.5 };

const archiveDuration = env.NODE_ENV === 'production'
  ? { days: 7 }
  : { minutes: 10 };

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

namespace text {

  export async function guildOnly() {
    return 'This must be performed in a guild!';
  }

  export async function memberOnly() {
    return 'This must be performed by a member of a guild!';
  }

  export async function title() {
    return '**Need to talk with a TripSitter? Click the button below!**';
  }

  export async function description() {
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

  export async function footer() {
    return '🛑 Please do not message anyone directly! 🛑';
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

    // Get the log channel
    const channelTripsitLogs = discordClient.channels.cache.get(env.CHANNEL_TRIPSIT_LOG) as TextChannel;

    // Loop through each ticket
    if (ticketData.length > 0) {
      ticketData.forEach(async ticket => {
        log.debug(F, `Archiving ticket ${ticket.id}...`);

        // Update the ticket status and date it should be deleted
        const updatedTicket = ticket;
        updatedTicket.status = 'ARCHIVED' as ticket_status;
        updatedTicket.deleted_at = DateTime.utc().plus(deleteDuration).toJSDate();

        // Update the ticket in the database
        await db.user_tickets.update({
          where: { id: ticket.id },
          data: updatedTicket,
        });

        // Archive the thread on discord
        let thread = {} as null | Channel;
        try {
          thread = await global.discordClient.channels.fetch(ticket.thread_id);
        } catch (err) {
          // Thread was likely manually deleted
        }

        if (thread?.isThread()) {
          await thread.setArchived(true, 'Automatically archived.');
        } else {
          log.debug(F, `Thread ${ticket.thread_id} was likely manually deleted`);
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

        const name = member ?? userData.discord_id;
        const description = thread
          ? stripIndents`${name}'s Ticket ${(thread as ThreadChannel).name} was archived after ${DateTime.now().diff(DateTime.fromJSDate(ticket.created_at)).toFormat('hh:mm:ss')}
        
            It will be deleted ${time(ticket.deleted_at, 'R')}
            `
          : `Thread ${ticket.thread_id} was likely manually deleted, no further actions will be taken.`;

        await channelTripsitLogs.send({
          allowedMentions: {},
          embeds: [
            embedTemplate()
              .setAuthor({
                name: `${name}`,
                iconURL: member ? member.user.displayAvatarURL() : '',
              })
              .setDescription(description)
              .setColor(Colors.Green),
          ],
        });

        if (member) {
          await util.restoreRoles(userData, ticket);
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

    // Get the log channel
    const channelTripsitLogs = discordClient.channels.cache.get(env.CHANNEL_TRIPSIT_LOG) as TextChannel;

    // Loop through each ticket
    if (ticketData.length > 0) {
      ticketData.forEach(async ticket => {
        log.debug(F, `Deleting ticket ${ticket.id}...`);

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
          log.debug(F, `Thread ${ticket.thread_id} was likely manually deleted`);
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
        const name = member ?? userData.discord_id;

        // Get a list of all deleted tickets, calculate the average ticket time
        const tickets = await db.user_tickets.findMany({
          where: {
            status: 'DELETED',
          },
          select: {
            created_at: true,
            deleted_at: true,
          },
        });

        // Calculate differences in milliseconds and filter out invalid entries
        const differences: number[] = tickets
          .map(ticketDataAvg => {
            if (ticketDataAvg.deleted_at && ticketDataAvg.created_at) {
              return DateTime.fromJSDate(new Date(ticketDataAvg.deleted_at))
                .diff(DateTime.fromJSDate(new Date(ticketDataAvg.created_at)), 'seconds')
                .as('seconds'); // Get difference in seconds
            }
            return null;
          })
          .filter(diff => diff !== null) as number[]; // Filter out tickets where calculation was not possible
        log.debug(F, `Differences: ${JSON.stringify(differences, null, 2)}`);

        // Calculate average
        const averageSeconds = differences.reduce((acc, curr) => acc + curr, 0) / differences.length;
        log.debug(F, `Average: ${averageSeconds}`);

        // Convert average seconds to a more readable format if needed
        const averageDuration = DateTime.fromObject({ second: averageSeconds }).toFormat('hh:mm:ss');
        log.debug(F, `Average duration: ${averageDuration}`);

        const description = thread
          ? stripIndents`
            ${member ?? userData.discord_id}'s ticket was deleted
                
            Total ticket time: ${DateTime.now().diff(DateTime.fromJSDate(ticket.created_at)).toFormat('hh:mm:ss')}
  
            Average ticket time is: ${averageDuration}`
          : stripIndents`
            ${member ?? userData.discord_id}'s ticket was likely manually deleted, no further actions will be taken.
          
            Average ticket time is: ${averageDuration}`;

        await channelTripsitLogs.send({
          allowedMentions: {},
          embeds: [
            embedTemplate()
              .setAuthor({
                name: `${name}`,
                iconURL: member ? member.user.displayAvatarURL() : '',
              })
              .setTitle('Ticket Deleted')
              .setDescription(description)
              .setColor(Colors.DarkOrange),
          ],
        });

        if (member) {
          await util.restoreRoles(userData, ticket);
        }
      });
    }
  }

  export async function cleanupTickets() {
    const guildDataList = await db.discord_guilds.findMany();
    const promises = guildDataList.map(async guildData => {
      try {
        const guild = await discordClient.guilds.fetch(guildData.id);
        if (!guild || !guildData.channel_tripsit) return;

        const channel = await guild.channels.fetch(guildData.channel_tripsit) as TextChannel;
        const tripsitPerms = await checkChannelPermissions(channel, ['ViewChannel', 'ManageThreads']);

        if (tripsitPerms.length > 0) return;

        const threadList = await channel.threads.fetch({
          archived: {
            type: 'private',
            fetchAll: true,
          },
        });

        const deletePromises = threadList.threads.map(async thread => {
          try {
            await thread.fetch();
            const messages = await thread.messages.fetch({ limit: 1 });
            const lastMessage = messages.first();
            if (!lastMessage) return;

            if (DateTime.fromJSDate(lastMessage.createdAt) >= DateTime.utc().minus(deleteDuration)) {
              await thread.delete();
              // Consider logging outside the loop or summarizing deletions to minimize log entries
            }
          } catch (err) {
            // Handle thread fetch or delete error
          }
        });

        await Promise.all(deletePromises);
      } catch (err) {
        // Handle guild fetch error or other errors
        if ((err as DiscordErrorData).message === 'GUILD_DELETED') {
          await db.discord_guilds.update({
            where: { id: guildData.id },
            data: { channel_tripsit: null },
          });
        }
      }
    });

    await Promise.all(promises);
  }
}

namespace util {
  export async function tripsitmeOwned(
    interaction: ButtonInteraction,
  ) {
    await interaction.deferReply({ ephemeral: true });
    if (!interaction.guild) {
      // log.debug(F, `no guild!`);
      await interaction.editReply(await text.guildOnly());
      return;
    }
    // log.debug(F, `tripsitmeOwned`);
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
        const channelPerms = await checkChannelPermissions(metaChannel, permissionList.metaChannel);
        if (channelPerms.length > 0) {
          const guildOwner = await interaction.guild.fetchOwner();
          await guildOwner.send({ content: `Please make sure I can ${channelPerms.join(', ')} in ${metaChannel.name} so I can run ${F}!` }); // eslint-disable-line
          log.error(F, `Missing permissions ${channelPerms.join(', ')} in ${metaChannel.name}!`);
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
    interaction: ButtonInteraction,
  ) {
    await interaction.deferReply({ ephemeral: true });
    if (!interaction.guild) {
      // log.debug(F, `no guild!`);
      await interaction.editReply(await text.guildOnly());
      return;
    }
    // log.debug(F, `tripsitmeMeta`);
    const userId = interaction.customId.split('~')[1];
    const actor = interaction.member as GuildMember;
    const target = await interaction.guild.members.fetch(userId);

    if (!interaction.guild) {
      // log.debug(F, `no guild!`);
      await interaction.editReply(await text.guildOnly());
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

  export async function tripsitmeBackup(
    interaction: ButtonInteraction,
  ) {
    await interaction.deferReply({ ephemeral: true });
    // log.debug(F, `tripsitmeBackup`);
    if (!interaction.guild) {
      // log.debug(F, `no guild!`);
      await interaction.editReply(await text.guildOnly());
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

  export async function tripsitmeTeamClose(
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
      // log.debug(F, `There was an error fetching the target, it was likely deleted:\n ${err}`);
      // await interaction.editReply({ content: 'Sorry, this user has left the guild.' });
      // return;
    }

    const actor = interaction.member as GuildMember;

    if (targetId === actor.id) {
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
    log.debug(F, `guildData: ${JSON.stringify(guildData, null, 2)}`);

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
    ticketData.archived_at = DateTime.utc().plus(archiveDuration).toJSDate();
    ticketData.deleted_at = DateTime.utc().plus(deleteDuration).toJSDate();

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

  export async function tripsitmeUserClose(
    interaction: ButtonInteraction,
  ) {
    if (!interaction.guild) return;
    if (!interaction.member) return;
    if (!interaction.channel) return;
    log.info(F, await commandContext(interaction));

    await interaction.deferReply({ ephemeral: false });

    const targetId = interaction.customId.split('~')[1];
    const override = interaction.customId.split('~')[0] === 'tripsitmodeOffOverride';

    const target = await interaction.guild.members.fetch(targetId);
    const actor = interaction.member as GuildMember;

    if (targetId !== actor.id && !override) {
      // log.debug(F, `not the target!`);
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
      const rejectMessage = stripIndents`Hey ${(interaction.member as GuildMember).displayName}, you do not have an open session!
      If you need help, please click the button again!`;
      const embed = embedTemplate().setColor(Colors.DarkBlue);
      embed.setDescription(rejectMessage);
      // log.debug(F, `target ${target} does not need help!`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // log.debug(F, `ticketData: ${JSON.stringify(ticketData, null, 2)}`);
    if (Object.entries(ticketData).length === 0) {
      const rejectMessage = stripIndents`Hey ${(interaction.member as GuildMember).displayName}, you do not have an open session!
      If you need help, please click the button again!`;
      const embed = embedTemplate().setColor(Colors.DarkBlue);
      embed.setDescription(rejectMessage);
      // log.debug(F, `target ${target} does not need help!`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // log.debug(F, `ticketData: ${JSON.stringify(ticketData, null, 2)}`);
    if (ticketData.status === 'CLOSED') {
      const rejectMessage = stripIndents`Hey ${(interaction.member as GuildMember).displayName}, you already closed this session!`;
      const embed = embedTemplate().setColor(Colors.DarkBlue);
      embed.setDescription(rejectMessage);
      // log.debug(F, `target ${target} does not have an open session!`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Remove the needshelp role
    let roleNeedshelp = {} as Role;
    if (guildData.role_needshelp) {
      try {
        roleNeedshelp = await interaction.guild.roles.fetch(guildData.role_needshelp) as Role;
        const myMember = await interaction.guild.members.fetch(interaction.client.user.id);
        const myRole = myMember.roles.highest;
        if (roleNeedshelp && roleNeedshelp.comparePositionTo(myRole) < 0) {
          // log.debug(F, `Removing ${roleNeedshelp.name} from ${target.displayName}`);
          await target.roles.remove(roleNeedshelp);
        }
      } catch (err) {
        // log.debug(F, `There was an error fetching the needshelp role, it was likely deleted:\n ${err}`);
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
    }

    // Remove the needshelp role
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

    // Readd old roles
    if (userData.roles
      // Patch for BlueLight: Since we didn't remove roles, don't re-add them
      && target.guild.id !== env.DISCORD_BL_ID
      // && target.guild.id !== env.DISCORD_GUILD_ID // For testing
    ) {
      const myMember = await interaction.guild.members.fetch(interaction.client.user.id);
      const myRole = myMember.roles.highest;
      const targetRoles: string[] = userData.roles.split(',') || [];

      // readd each role to the target
      if (targetRoles.length > 0) {
        targetRoles.forEach(async roleId => {
          // log.debug(F, `Re-adding roleId: ${roleId}`);
          if (!interaction.guild) {
            log.error(F, 'no guild!');
            return;
          }
          const roleObj = await interaction.guild.roles.fetch(roleId) as Role;
          if (roleObj
            && !ignoredRoles.includes(roleObj.id)
            && roleObj.name !== '@everyone'
            && roleObj.id !== roleNeedshelp.id
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
      // log.debug(F, `There was an error updating the help thread, it was likely deleted:\n ${err}`);
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
        await msg.react('🙁');
        await msg.react('😕');
        await msg.react('😐');
        await msg.react('🙂');
        await msg.react('😁');

        // Setup the reaction collector
        const filter = (reaction: MessageReaction, user: User) => user.id === target.id;
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
    ticketData.archived_at = DateTime.utc().plus(archiveDuration).toJSDate();
    ticketData.deleted_at = DateTime.utc().plus(deleteDuration).toJSDate();

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

  export async function tripsitmeButton(
    interaction: ButtonInteraction,
  ) {
    log.info(F, await commandContext(interaction));
    const target = interaction.member as GuildMember;

    // log.debug(F, `target: ${JSON.stringify(target, null, 2)}`);

    // const actorIsAdmin = target.permissions.has(PermissionsBitField.Flags.Administrator);
    // const showMentions = actorIsAdmin ? [] : ['users', 'roles'] as MessageMentionTypes[];

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

    // log.debug(F, `tripsitChannel: ${JSON.stringify(tripsitChannel, null, 2)}`);

    if (!tripsitChannel.id) {
      log.debug(F, 'No tripsit channel!');
      await interaction.reply({
        content: 'No tripsit channel found! Make sure to run /setup tripsit, or ask an admin to re-run setup!',
        ephemeral: true,
      });
      return;
    }

    const channelPerms = await checkChannelPermissions(tripsitChannel, permissionList.tripsitChannel);
    if (channelPerms.length > 0) {
      log.error(F, `Missing TS channel permission ${channelPerms.join(', ')} in ${tripsitChannel.name}!`);
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
      log.error(F, `Missing TS channel permission ${channelPerms.join(', ')} in ${tripsitChannel.name}!`);
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

    const metaPerms = await checkChannelPermissions(channelTripsitmeta, permissionList.metaChannel);
    if (channelPerms.length > 0) {
      log.error(F, `Missing TS channel permission ${channelPerms.join(', ')} in ${channelTripsitmeta.name}!`);
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
      log.error(F, `Missing permission ${channelPerms.join(', ')} in ${tripsitChannel.name}!`);
      return;
    }

    // log.debug(F, `Target: ${target.displayName} (${target.id})`);

    const userData = await db.users.upsert({
      where: {
        discord_id: target.id,
      },
      create: {
        discord_id: target.id,
      },
      update: {},
    });
    // log.debug(F, `Target userData: ${JSON.stringify(userData, null, 2)}`);

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
      log.debug(F, `Target has tickets: ${JSON.stringify(ticketData, null, 2)}`);
      let threadHelpUser = {} as ThreadChannel;
      try {
        threadHelpUser = await interaction.guild?.channels.fetch(ticketData.thread_id) as ThreadChannel;
      } catch (err) {
        log.debug(F, 'There was an error updating the help thread, it was likely deleted');
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
          if (minutes > 5) {
            const helperString = `and/or ${roleHelper}`;
            metaMessage = `Hey ${roleTripsitter} ${guildData.role_helper ?? helperString} team, ${target.toString()} has indicated they need assistance!`;
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

        ticketData.archived_at = DateTime.utc().plus(archiveDuration).toJSDate();
        ticketData.deleted_at = DateTime.utc().plus(deleteDuration).toJSDate();
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
    } else {
      log.debug(F, 'No open ticket found');
    }

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

  export async function restoreRoles(
    userData: users,
    ticket: user_tickets,
  ) {
    // Restore roles
    const guild = await discordClient.guilds.fetch(ticket.guild_id);
    const member = await guild.members.fetch(userData.discord_id as string);
    if (member) {
      const myMember = guild.members.me as GuildMember;
      const myRole = myMember.roles.highest;

      const guildData = await db.discord_guilds.upsert({
        where: { id: guild.id },
        create: { id: guild.id },
        update: {},
      });

      // Remove the needshelp role
      const needshelpRole = await guild.roles.fetch(guildData.role_needshelp as string);
      if (needshelpRole && needshelpRole.comparePositionTo(myRole) < 0) {
        await member.roles.remove(needshelpRole);
      }

      // Restore the old roles
      if (userData.roles) {
        // log.debug(F, `Restoring ${userData.discord_id}'s roles: ${userData.roles}`);
        const roles = userData.roles.split(',');

        const promises = roles.map(async role => {
          const roleObj = await guild.roles.fetch(role);
          if (roleObj && roleObj.name !== '@everyone'
            && roleObj.id !== guildData.role_needshelp
            && roleObj.comparePositionTo(myRole) < 0
            && member.guild.id !== env.DISCORD_BL_ID
          ) {
            // Check if the bot has permission to add the role
            log.debug(F, `Adding ${userData.discord_id}'s ${role} role`);
            try {
              await member.roles.add(roleObj);
              return `Role ${role} added successfully.`; // Return something meaningful or null
            } catch (err) {
              log.error(F, `Failed to add ${member.displayName}'s ${roleObj.name} role in ${member.guild.name}: ${err}`);
              return `Failed to add role ${role}.`; // Return something meaningful or null
            }
          } else {
            return `Role ${role} skipped.`; // Return something meaningful or null
          }
        });

        // Wait for all promises to resolve
        const results = await Promise.all(promises);

        // Get the log channel
        const channelTripsitLogs = discordClient.channels.cache.get(env.CHANNEL_TRIPSIT_LOG) as TextChannel;

        await channelTripsitLogs.send({
          allowedMentions: {},
          embeds: [
            embedTemplate()
              .setAuthor({
                name: `${member}`,
                iconURL: member ? member.user.displayAvatarURL() : '',
              })
              .setDescription(results.join('\n'))
              .setColor(Colors.Green),
          ],
        });
      }
    } else {
      // User likely left the guild
    }
  }

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

    const perms = await checkGuildPermissions(guild, permissionList.guildPermissions);
    if (perms.length > 0) {
      const guildOwner = await guild.fetchOwner();
      await guildOwner.send({ content: `Please make sure I can ${perms.join(', ')} in ${guild} so I can run ${F}!` }); // eslint-disable-line
      log.error(F, `Missing permission ${perms.join(', ')} in ${guild}!`);
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
    target.fetch();
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

    const myMember = await interaction.guild?.members.fetch(interaction.client.user.id) as GuildMember;
    const myRole = myMember.roles.highest;

    // Patch for BlueLight: They don't want to remove roles from the target at all
    if (
      target.guild.id !== env.DISCORD_BL_ID
      // && target.guild.id !== env.DISCORD_GUILD_ID // For testing
    ) {
      // Remove all roles, except team and vanity, from the target
      target.roles.cache.forEach(async role => {
        // log.debug(F, `role: ${role.name} - ${role.id}`);

        if (!ignoredRoles.includes(role.id)
          && !role.name.includes('@everyone')
          && role.id !== roleNeedshelp.id
          && role.comparePositionTo(myRole)) {
          log.debug(F, `Removing role ${role.name} from ${target.displayName}`);
          try {
            await target.roles.remove(role);
          } catch (err) {
            log.error(F, `Error removing role from target: ${err}`);
            const guildOwner = await interaction.guild?.fetchOwner();
            await guildOwner?.send({
              content: stripIndents`There was an error removing ${role.name} from ${target.displayName}!
              Please make sure I have the Manage Roles permission, or put this role above mine so I don't try to remove it.
              If there's any questions please contact Moonbear#1024 on TripSit!` }); // eslint-disable-line
            log.error(F, `Missing permission ${perms.join(', ')} in ${interaction.guild}! Sent the guild owner a DM!`);
          }
        }
      });
    }

    // Add the needsHelp role to the target
    try {
      log.debug(F, `Adding role ${roleNeedshelp.name} to ${target.displayName}`);
      await target.roles.add(roleNeedshelp);
    } catch (err) {
      const guildOwner = await interaction.guild?.fetchOwner();
      await guildOwner?.send({
        content: stripIndents`There was an error adding the ${roleNeedshelp.name} role to ${target.displayName}!
            Please make sure I have the Manage Roles permission, or put this role below mine so I can give it to people!
            If there's any questions please contact Moonbear#1024 on TripSit!` }); // eslint-disable-line
      log.error(F, `Missing permission ${perms.join(', ')} in ${interaction.guild}! Sent the guild owner a DM!`);
    }
    log.debug(F, 'Finished needshelp mode');
  }

  export async function tripsitmodeOn(
    interaction: ChatInputCommandInteraction,
    target: GuildMember,
  ) {
    if (!interaction.guild) return false;
    if (!interaction.member) return false;

    let guildData = await db.discord_guilds.upsert({
      where: {
        id: interaction.guild?.id,
      },
      create: {
        id: interaction.guild?.id,
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
      // log.debug(F, `There was an error fetching the tripsit channel, it was likely deleted:\n ${err}`);
      // Update the ticket status to closed
      guildData = await db.discord_guilds.update({
        where: {
          id: interaction.guild.id,
        },
        data: {
          channel_tripsit: null,
        },
      });
    }

    const channelPerms = await checkChannelPermissions(tripsitChannel, permissionList.tripsitChannel);
    if (channelPerms.length > 0) {
      log.error(F, `Missing TS channel permission ${channelPerms.join(', ')} in ${tripsitChannel.name}!`);
      const guildOwner = await interaction.guild?.fetchOwner();
      await guildOwner.send({
        content: stripIndents`Missing permissions in ${tripsitChannel}!
      In order to setup the tripsitting feature I need:
      View Channel - to see the channel
      Send Messages - to send messages
      Create Private Threads - to create private threads
      Send Messages in Threads - to send messages in threads
      Manage Threads - to delete threads when they're done
      `}); // eslint-disable-line
      log.error(F, `Missing TS channel permission ${channelPerms.join(', ')} in ${tripsitChannel.name}!`);
      return false;
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
      guildData = await db.discord_guilds.update({
        where: {
          id: interaction.guild.id,
        },
        data: {
          channel_tripsitmeta: null,
        },
      });
    }

    const metaPerms = await checkChannelPermissions(channelTripsitmeta, permissionList.metaChannel);
    if (metaPerms.length > 0) {
      log.error(F, `Missing TS channel permission ${channelPerms.join(', ')} in ${channelTripsitmeta.name}!`);
      const guildOwner = await interaction.guild?.fetchOwner();
      await guildOwner.send({
        content: stripIndents`Missing permissions in ${channelTripsitmeta}!
    In order to setup the tripsitting feature I need:
    View Channel - to see the channel
    Send Messages - to send messages
    Create Private Threads - to create private threads, when requested through the bot
    Send Messages in Threads - to send messages in threads
    Manage Threads - to delete threads when they're done
    `}); // eslint-disable-line
      log.error(F, `Missing permission ${channelPerms.join(', ')} in ${tripsitChannel.name}!`);
      return false;
    }
    // const showMentions = actorIsAdmin ? [] : ['users', 'roles'] as MessageMentionTypes[];

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
    log.debug(F, `Target userData: ${JSON.stringify(userData, null, 2)}`);
    let ticketData = await db.user_tickets.findFirst({
      where: {
        user_id: userData.id,
        type: 'TRIPSIT',
      },
      orderBy: {
        thread_id: 'desc',
      },
    });
    log.debug(F, `Target ticket data: ${JSON.stringify(ticketData, null, 2)}`);

    // If a thread exists, re-apply needsHelp, update the thread, remind the user
    if (ticketData) {
      log.debug(F, `Target has tickets: ${JSON.stringify(ticketData, null, 2)}`);

      let threadHelpUser = {} as ThreadChannel;
      try {
        threadHelpUser = await interaction.guild?.channels.fetch(ticketData.thread_id) as ThreadChannel;
      } catch (err) {
        log.debug(F, 'There was an error updating the help thread, it was likely deleted');
        ticketData = await db.user_tickets.update({
          where: {
            id: ticketData.id,
          },
          data: {
            status: 'DELETED',
            archived_at: new Date(),
            deleted_at: new Date(),
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
        let roleNeedshelp = {} as Role;
        if (guildData.role_tripsitter) {
          roleTripsitter = await interaction.guild?.roles.fetch(guildData.role_tripsitter) as Role;
        }
        if (guildData.role_helper) {
          roleHelper = await interaction.guild?.roles.fetch(guildData.role_helper) as Role;
        }
        if (guildData.role_needshelp) {
          roleNeedshelp = await interaction.guild?.roles.fetch(guildData.role_needshelp) as Role;
        }
        log.debug(F, `Helper Role : ${roleHelper.name}`);
        log.debug(F, `Tripsitter Role : ${roleTripsitter.name}`);
        log.debug(F, `Needshelp Role : ${roleNeedshelp.name}`);

        // Remind the user that they have a channel open
        // const recipient = '' as string;

        let helpMessage = stripIndents`Hey ${target}, the team thinks you could still use some help, lets continue talking here!`; // eslint-disable-line max-len

        // If the help ticket was created < 5 mins ago, don't re-ping the team
        const createdDate = new Date(ticketData.reopened_at ?? ticketData.created_at);
        const now = new Date();
        const diff = now.getTime() - createdDate.getTime();
        const minutes = Math.floor(diff / 1000 / 60);
        if (minutes > 5) {
          const helperStr = `and/or ${roleHelper}`;
          // log.debug(F, `Target has open ticket, and it was created over 5 minutes ago!`);
          helpMessage += `\n\nSomeone from the ${roleTripsitter} ${guildData.role_helper ? helperStr : ''} team will be with you as soon as they're available!`; // eslint-disable-line max-len
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
        log.debug(F, 'Updated thread name');

        // If the meta thread exists, update the name and ping the team
        if (ticketData.meta_thread_id) {
          let metaMessage = '';
          if (minutes > 5) {
            const helperString = `and/or ${roleHelper}`;
            metaMessage = `Hey ${roleTripsitter} ${guildData.role_helper ?? helperString} team, ${interaction.member} has indicated that ${target.displayName} needs assistance!`; // eslint-disable-line max-len
          } else {
            metaMessage = `${interaction.member} has indicated that ${target.displayName} needs assistance!`;
          }
          // Get the tripsit meta channel from the guild
          let metaThread = {} as ThreadChannel;
          try {
            metaThread = await interaction.guild?.channels.fetch(ticketData.meta_thread_id) as ThreadChannel;
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
            ticketData = await db.user_tickets.update({
              where: {
                id: ticketData.id,
              },
              data: {
                meta_thread_id: null,
              },
            });
          }
        }

        ticketData = await db.user_tickets.update({
          where: {
            id: ticketData.id,
          },
          data: {
            status: 'OPEN' as ticket_status,
            reopened_at: new Date(),
            archived_at: env.NODE_ENV === 'production'
              ? DateTime.local().plus({ days: 7 }).toJSDate()
              : DateTime.local().plus({ minutes: 1 }).toJSDate(),
            deleted_at: env.NODE_ENV === 'production'
              ? DateTime.local().plus({ days: 14 }).toJSDate()
              : DateTime.local().plus({ minutes: 2 }).toJSDate(),
          },
        });

        // remind the user they have an open thread
        const embed = embedTemplate()
          .setColor(Colors.DarkBlue)
          .setDescription(stripIndents`Hey ${interaction.member}, ${target.displayName} already has an open ticket!
            I've re-applied the ${roleNeedshelp} role to them, and updated the thread.
            Check your channel list or click '${threadHelpUser.toString()} to see!`);
        await interaction.editReply({ embeds: [embed] });
        return true;
      }
    }

    // If no existing threads are available, create a new one
    await interaction.showModal(new ModalBuilder()
      .setCustomId(`tripsitmeSubmit~${interaction.id}`)
      .setTitle('TripSit Mode Activated!')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>()
          .addComponents(
            new TextInputBuilder()
              .setCustomId('triageInput')
              .setLabel('What substance did they take, etc?')
              .setPlaceholder('This will be posted in the channel for them to see!')
              .setStyle(TextInputStyle.Short),
          ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
          .setCustomId('introInput')
          .setLabel('What\'s going on with them?')
          .setPlaceholder('This will be posted in the channel for them to see!')
          .setStyle(TextInputStyle.Paragraph)),
      ));

    const filter = (i: ModalSubmitInteraction) => i.customId.startsWith('tripsitmeSubmit');
    await interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        if (i.customId.split('~')[1] !== interaction.id) return;
        await i.deferReply({ ephemeral: true });
        const triage = i.fields.getTextInputValue('triageInput');
        const intro = i.fields.getTextInputValue('introInput');

        const threadHelpUser = await tripSitMe(i, target, triage, intro) as ThreadChannel;

        const replyMessage = stripIndents`
      Hey ${i.member}, you activated tripsit mode on ${target.displayName}!

      Click here to be taken to their private room: ${threadHelpUser}

      You can also click in your channel list to see your private room!`;
        const embed = embedTemplate()
          .setColor(Colors.DarkBlue)
          .setDescription(replyMessage);
        await i.editReply({ embeds: [embed] });
      });

    return true;
  }

  export async function tripSitMe(
    interaction: ModalSubmitInteraction,
    memberInput: GuildMember | null,
    triage: string,
    intro: string,
  ): Promise<ThreadChannel | null> {
    // Used in m.tripsitme.ts
    log.info(F, await commandContext(interaction));
    // await interaction.deferReply({ ephemeral: true });

    // Lookup guild information for variables
    if (!interaction.guild) {
      // log.debug(F, `no guild!`);
      await interaction.editReply(await text.guildOnly());
      return null;
    }
    if (!interaction.member) {
      // log.debug(F, `no member!`);
      await interaction.editReply(await text.memberOnly());
      return null;
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
    log.debug(F, `threadHelpUser: ${threadHelpUser.name} (${threadHelpUser.id})`);

    // Team check - Cannot be run on team members
    // If this user is a developer then this is a test run and ignore this check,
    // but we'll change the output down below to make it clear this is a test.
    let targetIsTeamMember = false;
    target.roles.cache.forEach(async role => {
      if (teamRoles.includes(role.id)) {
        targetIsTeamMember = true;
      }
    });

    log.debug(F, `targetIsTeamMember: ${targetIsTeamMember}`);

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

    const archiveTime = DateTime.utc().plus(archiveDuration);
    const deleteTime = DateTime.utc().plus(deleteDuration);

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
        guild_id: interaction.guild.id,
        thread_id: newTicketData.thread_id,
        type: newTicketData.type,
        status: newTicketData.status,
        first_message_id: newTicketData.first_message_id,
        archived_at: newTicketData.archived_at,
        deleted_at: newTicketData.deleted_at,
      },
    });

    const channelTripsitLog = await interaction.guild.channels.fetch(env.CHANNEL_TRIPSIT_LOG) as TextChannel;
    await channelTripsitLog.send({
      content: stripIndents`**${target.displayName}** requested help in <#${threadHelpUser.id}>`,
    });

    return threadHelpUser;
  }

  export async function navMenu(
    page: 'start' | 'help' | 'privacy' | 'setup' | 'stats',
  ):Promise<ActionRowBuilder<ButtonBuilder>> {
    return new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        button.start().setStyle(page === 'start' ? ButtonStyle.Success : ButtonStyle.Primary),
        button.help().setStyle(page === 'help' ? ButtonStyle.Success : ButtonStyle.Primary),
        button.privacy().setStyle(page === 'privacy' ? ButtonStyle.Success : ButtonStyle.Primary),
        button.setup().setStyle(page === 'setup' ? ButtonStyle.Success : ButtonStyle.Primary),
        button.stats().setStyle(page === 'stats' ? ButtonStyle.Success : ButtonStyle.Primary),
      );
  }

  export async function setupMenu(
    page: 'setupPageOne' | 'setupPageTwo' | 'setupPageThree',
    interaction: ChatInputCommandInteraction | ButtonInteraction | ChannelSelectMenuInteraction | RoleSelectMenuInteraction,
  ):Promise<ActionRowBuilder<ButtonBuilder | ChannelSelectMenuBuilder | StringSelectMenuBuilder | RoleSelectMenuBuilder >[]> {
    if (!interaction.guild) return [];

    await util.sessionData(interaction.guild.id);

    const setupMenuRow = new ActionRowBuilder<ButtonBuilder>();

    const setupRows: ActionRowBuilder<
    ButtonBuilder
    | ChannelSelectMenuBuilder
    | StringSelectMenuBuilder
    | RoleSelectMenuBuilder >[] = [setupMenuRow];

    setupMenuRow.addComponents(
      button.pageOne().setStyle(page === 'setupPageOne' ? ButtonStyle.Success : ButtonStyle.Primary),
      button.pageTwo().setStyle(page === 'setupPageTwo' ? ButtonStyle.Success : ButtonStyle.Primary),
      button.pageThree().setStyle(page === 'setupPageThree' ? ButtonStyle.Success : ButtonStyle.Primary),
    );

    // Only show the save button if the user has the Manage Channels permission
    // And all of the required setup options are set correctly
    // Otherwise, they can still view the setup options
    if ((interaction.member as GuildMember).permissions.has(PermissionFlagsBits.ManageChannels)
    && global.sessionsSetupData[interaction.guild.id].tripsitChannel && global.sessionsSetupData[interaction.guild.id].tripsitterRoles) {
      let permissionsPassed = true as boolean;

      if (global.sessionsSetupData[interaction.guild.id].tripsitChannel) {
        const channelId = global.sessionsSetupData[interaction.guild.id].tripsitChannel as string;
        const channel = interaction.guild.channels.cache.get(channelId) as GuildTextBasedChannel;

        const perms = await checkChannelPermissions(channel, permissionList.tripsitChannel);
        if (perms.length > 0) {
          permissionsPassed = false;
        }
      }

      if (global.sessionsSetupData[interaction.guild.id].metaChannel) {
        const channelId = global.sessionsSetupData[interaction.guild.id].metaChannel as string;
        const channel = interaction.guild.channels.cache.get(channelId) as GuildTextBasedChannel;
        const perms = await checkChannelPermissions(channel, permissionList.metaChannel);
        if (perms.length > 0) {
          permissionsPassed = false;
        }
      }

      if (global.sessionsSetupData[interaction.guild.id].givingRoles
      || global.sessionsSetupData[interaction.guild.id].removingRoles) {
        const perms = await checkGuildPermissions(interaction.guild, permissionList.guildPermissions);
        if (perms.length > 0) {
          permissionsPassed = false;
        }
      }

      if (global.sessionsSetupData[interaction.guild.id].logChannel) {
        const channelId = global.sessionsSetupData[interaction.guild.id].logChannel as string;
        const channel = interaction.guild.channels.cache.get(channelId) as GuildTextBasedChannel;
        const perms = await checkChannelPermissions(channel, permissionList.logChannel);
        if (perms.length > 0) {
          permissionsPassed = false;
        }
      }

      if (permissionsPassed) {
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
    - Tripsit Threads
      - Logs of threads put into #tripsitters
      - Record the survey score
      - Update survey?
    - Experience
      - New people to reach X milestone this day/week/month
      - How many people have reached X milestone
      - Changes since last snapshot
      - Send messages when people hit milestones, not just for #vip-lounge
    */

    if (!message.guild) return;
    if (!message.channel) return;
    if (message.channel.isDMBased()) return;
    if (message.guild.id !== process.env.DISCORD_GUILD_ID) return;
    log.debug(F, `messageStats started at ${DateTime.now().toISOTime()}`);

    // Check if the message was sent in a tripsit thread
    const ticketData = await db.user_tickets.findFirst({
      where: {
        thread_id: message.channel.id,
      },
    });

    if (ticketData) {
      const channelTripsitLogs = message.guild.channels.cache.get(env.CHANNEL_TRIPSIT_LOG) as TextChannel;
      const userData = await db.users.upsert({
        where: { discord_id: message.author.id },
        create: { discord_id: message.author.id },
        update: {},
      });

      // Check if the first_response_user field is null, and if it's a different user than the person who made the thread
      if (
        (!ticketData.first_response_user && ticketData.user_id !== userData.id)
        || userData.discord_id === env.DISCORD_OWNER_ID
      ) {
        log.debug(F, `Adding <@!${message.author.id}> as the first response user for thread ${message.channel.name}`);
        await db.user_tickets.update({
          where: {
            id: ticketData.id,
          },
          data: {
            first_response_user: message.author.id,
          },
        });

        // Get a list of all tickets, calculate the average first response time
        const tickets = await db.user_tickets.findMany({
          where: {
            first_response_user: { not: null },
            first_response_datetime: { not: null },
          },
          select: {
            created_at: true,
            first_response_user: true,
            first_response_datetime: true,
          },
        });

        // Calculate differences in milliseconds and filter out invalid entries
        const differences: number[] = tickets
          .map(ticket => {
            if (ticket.first_response_datetime && ticket.created_at) {
              return DateTime.fromJSDate(new Date(ticket.first_response_datetime))
                .diff(DateTime.fromJSDate(new Date(ticket.created_at)), 'seconds')
                .as('seconds'); // Get difference in seconds
            }
            return null;
          })
          .filter(diff => diff !== null) as number[]; // Filter out tickets where calculation was not possible
        log.debug(F, `Differences: ${JSON.stringify(differences, null, 2)}`);

        // Calculate average
        const averageSeconds = differences.reduce((acc, curr) => acc + curr, 0) / differences.length;
        log.debug(F, `Average: ${averageSeconds}`);

        // Convert average seconds to a more readable format if needed
        const averageDuration = DateTime.fromObject({ second: averageSeconds }).toFormat('hh:mm:ss');
        log.debug(F, `Average duration: ${averageDuration}`);

        await channelTripsitLogs.send({
          content: stripIndents`
        <@!${message.author.id}> was the first responder to [their thread](${message.channel.url})
  
        The first response took ${DateTime.now().diff(DateTime.fromJSDate(ticketData.created_at)).toFormat('hh:mm:ss')}
  
        Average first response time is: ${averageDuration} seconds
        `,
          allowedMentions: {},
        });
      }

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

      log.debug(F, stripIndents`${message.author.username} has sent ${participationData.messages} messages in \
      thread ${message.channel.name}`);
    }
  }

  export async function sessionData(
    guildId: string,
  ) {
    if (!global.sessionsSetupData) {
      // If the global variable doesn't exist, create it
      global.sessionsSetupData = {};
    }

    if (!global.sessionsSetupData[guildId]) {
      // If the global variable doesn't exist, create it
      global.sessionsSetupData[guildId] = {
        tripsitChannel: null,
        tripsitterRoles: null,
        metaChannel: null,
        givingRoles: null,
        logChannel: null,
        removingRoles: null,
        title: await text.title(),
        description: await text.description(),
        footer: await text.footer(),
      };
    }
  }
}

namespace button {
  export function help() {
    return new ButtonBuilder()
      .setCustomId('tripsit~help')
      .setLabel('Help')
      .setEmoji('❓')
      .setStyle(ButtonStyle.Primary);
  }

  export function setup() {
    return new ButtonBuilder()
      .setCustomId('tripsit~setup')
      .setLabel('Setup')
      .setEmoji('⚙️')
      .setStyle(ButtonStyle.Primary);
  }

  export function privacy() {
    return new ButtonBuilder()
      .setCustomId('tripsit~privacy')
      .setLabel('Privacy')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Primary);
  }

  export function start() {
    return new ButtonBuilder()
      .setCustomId('tripsit~start')
      .setLabel('Start')
      .setEmoji('🚀')
      .setStyle(ButtonStyle.Primary);
  }

  export function stats() {
    return new ButtonBuilder()
      .setCustomId('tripsit~stats')
      .setLabel('Stats')
      .setEmoji('📊')
      .setStyle(ButtonStyle.Primary);
  }

  export function pageOne() {
    return new ButtonBuilder()
      .setCustomId('tripsit~pageOne')
      .setLabel('Page One')
      .setEmoji('1️⃣')
      .setStyle(ButtonStyle.Primary);
  }

  export function pageTwo() {
    return new ButtonBuilder()
      .setCustomId('tripsit~pageTwo')
      .setLabel('Page Two')
      .setEmoji('2️⃣')
      .setStyle(ButtonStyle.Primary);
  }

  export function pageThree() {
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
}

namespace page {
  export async function start(
    interaction: ChatInputCommandInteraction | ButtonInteraction
    | UserSelectMenuInteraction,
  ): Promise<InteractionEditReplyOptions> {
    log.info(F, await commandContext(interaction));
    if (!interaction.guild || !interaction.member) return { content: await text.guildOnly() };

    return {
      embeds: [embedTemplate()
        .setAuthor(null)
        .setTitle(`${interaction.guild.name}'s TripSit Sessions Start`)
        .setDescription(stripIndents`
          Here we can start a new session
        `)
        .setFooter(null)],
      components: [
        await util.navMenu('start'),
      ],
    };
  }

  export async function help(
    interaction: ChatInputCommandInteraction | ButtonInteraction,
  ): Promise<InteractionEditReplyOptions> {
    log.info(F, await commandContext(interaction));
    if (!interaction.guild || !interaction.member) return { content: await text.guildOnly() };

    return {
      embeds: [embedTemplate()
        .setAuthor(null)
        .setTitle(`${interaction.guild.name}'s TripSit Sessions Help`)
        .setDescription(stripIndents`
          Information on TripSit Sessions
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
    if (!interaction.guild || !interaction.member) return { content: await text.guildOnly() };

    return {
      embeds: [embedTemplate()
        .setAuthor(null)
        .setTitle(`${interaction.guild.name}'s TripSit Sessions Privacy`)
        .setDescription(stripIndents`
          Here we can review your privacy and delete your thread.
        `)
        .setFooter(null)],
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
    if (!interaction.guild || !interaction.member || !interaction.channel || interaction.channel.isDMBased()) return { content: await text.guildOnly() };
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

    await util.sessionData(interaction.guild.id);

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

    // log.debug(F, `setupOptions: ${JSON.stringify(global.sessionsSetupData[interaction.guild.id], null, 2)}`);

    if (global.sessionsSetupData[interaction.guild.id].tripsitChannel) {
      const channelId = global.sessionsSetupData[interaction.guild.id].tripsitChannel as string;
      const channel = interaction.guild.channels.cache.get(channelId) as GuildTextBasedChannel;

      const channelPerms = await checkChannelPermissions(channel, permissionList.tripsitChannel);
      if (channelPerms.length > 0) {
        log.error(F, `Missing TS channel permission ${channelPerms.join(', ')} in ${channel.name}!`);
        description += `\n\n**⚠️ Missing ${channelPerms.join(', ')} permission in ${channel} ⚠️**!`;
      }
    }

    if (global.sessionsSetupData[interaction.guild.id].metaChannel) {
      const channelId = global.sessionsSetupData[interaction.guild.id].metaChannel as string;
      const channel = interaction.guild.channels.cache.get(channelId) as GuildTextBasedChannel;
      const channelPerms = await checkChannelPermissions(channel, permissionList.metaChannel);
      if (channelPerms.length > 0) {
        log.error(F, `Missing TS channel permission ${channelPerms.join(', ')} in ${channel.name}!`);
        description += `\n\n**⚠️Missing ${channelPerms.join(', ')} permission in ${channel}⚠️**!`;
      }
    }

    return {
      embeds: [embedTemplate()
        .setAuthor(null)
        .setTitle(`${interaction.guild.name}'s TripSit Sessions Setup`)
        .setDescription(description)
        .setFooter(null)],
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
    if (!interaction.guild || !interaction.member) return { content: await text.guildOnly() };
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

    if (global.sessionsSetupData[interaction.guild.id].givingRoles
      || global.sessionsSetupData[interaction.guild.id].removingRoles) {
      const perms = await checkGuildPermissions(interaction.guild, permissionList.guildPermissions);
      if (perms.length > 0) {
        log.error(F, `Missing guild permission ${perms.join(', ')} in ${interaction.guild}!`);
        description += stripIndents`**⚠️n\nMissing ${perms.join(', ')} permission in ${interaction.guild}!⚠️**`;
      }
    }

    if (global.sessionsSetupData[interaction.guild.id].logChannel) {
      const channelId = global.sessionsSetupData[interaction.guild.id].logChannel as string;
      const channel = interaction.guild.channels.cache.get(channelId) as GuildTextBasedChannel;
      const perms = await checkChannelPermissions(channel, permissionList.logChannel);
      if (perms.length > 0) {
        log.error(F, `Missing TS channel permission ${perms.join(', ')} in ${channel.name}!`);
        description += stripIndents`\n\n**⚠️Missing ${perms.join(', ')} permission in ${channel}⚠️**!`;
      }
    }

    return {
      embeds: [embedTemplate()
        .setAuthor(null)
        .setTitle(`${interaction.guild.name}'s TripSit Sessions Setup Page Two`)
        .setDescription(description)
        .setFooter(null)],
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
    if (!interaction.guild || !interaction.member) return { content: await text.guildOnly() };

    await util.sessionData(interaction.guild.id);

    return {
      embeds: [embedTemplate()
        .setAuthor(null)
        .setTitle(`${interaction.guild.name}'s TripSit Sessions Setup Page Three`)
        .setDescription(stripIndents`
          This is where you can setup the button that will be used to start a session.
          ### Title
          > ${global.sessionsSetupData[interaction.guild.id].title}
          ### Description
          ${global.sessionsSetupData[interaction.guild.id].description.split('\n').map(line => `> ${line}`).join('\n')}
          ### Footer
          > ${global.sessionsSetupData[interaction.guild.id].footer}
        `)
        .setFooter(null)],
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
    if (!interaction.guild || !interaction.member || !interaction.channel || interaction.channel.isDMBased()) return { content: await text.guildOnly() };

    return {
      embeds: [embedTemplate()
        .setAuthor(null)
        .setTitle(`${interaction.guild.name}'s TripSit Sessions Setup Saved`)
        .setDescription(stripIndents`
          You saved your settings!
        `)
        .setFooter(null)],
      components: [
        await util.navMenu('setup'),
      ],
    };
  }

  export async function stats(
    interaction: ChatInputCommandInteraction | ButtonInteraction,
  ): Promise<InteractionEditReplyOptions> {
    log.info(F, await commandContext(interaction));
    if (!interaction.guild || !interaction.member) return { content: await text.guildOnly() };

    return {
      embeds: [embedTemplate()
        .setAuthor(null)
        .setTitle(`${interaction.guild.name}'s TripSit Sessions Stats`)
        .setDescription(stripIndents`
          Statistics on sessions
        `)
        .setFooter(null)],
      components: [
        await util.navMenu('stats'),
      ],
    };
  }
}

namespace modal {
  export async function updateEmbed(
    interaction: ButtonInteraction,
  ) {
    if (!interaction.guild) return;
    if (!interaction.channel) return;
    if (interaction.channel.type !== ChannelType.GuildText) return;

    await util.sessionData(interaction.guild.id);

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
      ));

    const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('tripsitmeModal');
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        if (i.customId.split('~')[1] !== interaction.id) return;
        if (!i.guild) return;
        await i.deferReply({ ephemeral: true });

        global.sessionsSetupData[i.guild.id].title = i.fields.getTextInputValue('tripsit~title');
        global.sessionsSetupData[i.guild.id].description = i.fields.getTextInputValue('tripsit~description');
        global.sessionsSetupData[i.guild.id].footer = i.fields.getTextInputValue('tripsit~footer');

        await i.editReply(await page.setupPageThree(interaction));
      });
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

  export function user() {
    return new UserSelectMenuBuilder()
      .setCustomId('tripsit~user')
      .setPlaceholder('User to start session with')
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
}

export async function tripsitTimer() {
  // Used in timer.ts
  // Runs every 60 seconds in production
  await timer.archiveTickets();
  await timer.deleteTickets();
  await timer.cleanupTickets();
}

export async function tripsitMessage(
  messageData: Message<boolean>,
): Promise<void> {
  // Used in messageCreate.ts
  if (!env.OPENAI_API_ORG || !env.OPENAI_API_KEY) return;
  await messageData.fetch();
  await util.messageStats(messageData);
}

export async function tripsitReaction(
  messageReaction: MessageReaction,
  user: User,
): Promise<void> {
  // Used in messageReactionAdd.ts
  if (!messageReaction.message.guild) return; // Ignore DMs
  await messageReaction.fetch();
  await user.fetch();
}

export async function tripsitSelect(
  interaction: ChannelSelectMenuInteraction | StringSelectMenuInteraction | RoleSelectMenuInteraction | UserSelectMenuInteraction,
): Promise<void> {
  if (!interaction.guild) return;
  // Used in selectMenu.ts
  const menuId = interaction.customId;
  log.debug(F, `menuId: ${menuId}`);
  const [, menuAction] = menuId.split('~') as [
    null,
    /* Setup Options */'tripsitChannel' | 'metaChannel' | 'tripsitterRoles' | 'givingRoles' | 'removingRoles' |
    /* Tripsitting selection */ 'user',
  ];

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
    }
    if (interaction.isRoleSelectMenu()) {
      if (interaction.customId === 'tripsit~tripsitterRoles') {
        log.debug(F, `tripsit~tripsitterRoles interaction.values: ${interaction.values}`);
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
  // log.debug(F, `setupOptionsAfter: ${JSON.stringify(setupOptions, null, 2)}`);

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
    case 'user':
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
  log.debug(F, `buttonID: ${buttonID}`);
  const [, buttonAction] = buttonID.split('~') as [
    null,
    /* button actions */ 'owned' | 'meta' | 'backup' | 'teamClose' | 'userClose' | 'startSession' | 'updateEmbed' |
    /* page buttons */ 'start' | 'privacy' | 'help' | 'setup' | 'stats' | 'pageOne' | 'pageTwo' | 'pageThree' | 'dev' | 'save',
  ];

  // eslint-disable-next-line sonarjs/no-small-switch
  switch (buttonAction) {
    case 'owned':
      await util.tripsitmeOwned(interaction);
      break;
    case 'meta':
      await util.tripsitmeMeta(interaction);
      break;
    case 'backup':
      await util.tripsitmeBackup(interaction);
      break;
    case 'teamClose':
      await util.tripsitmeTeamClose(interaction);
      break;
    case 'userClose':
      await util.tripsitmeUserClose(interaction);
      break;
    case 'startSession':
      await util.tripsitmeButton(interaction);
      break;
    case 'start':
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
      await modal.updateEmbed(interaction);
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
          console.log(error);
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
