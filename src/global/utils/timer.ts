import {
  TextChannel,
  ThreadChannel,
} from 'discord.js';
import { DateTime } from 'luxon';
import { db, getGuild, getUser } from './knex';
import {
  Users,
  UserReminders,
  UserTickets,
  TicketStatus,
  DiscordGuilds,
} from '../@types/pgdb.d';

import { embedTemplate } from '../../discord/utils/embedTemplate';

const F = f(__filename);

// Value in miliseconds (1000 * 60 = 1 minute)
const interval = env.NODE_ENV === 'production' ? 1000 * 30 : 1000 * 10;

export default runTimer;

async function checkStats() {
  // Determine how many people are in the tripsit guild
  const tripsitGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
  if (tripsitGuild) {
    // Total member count
    const { memberCount } = tripsitGuild;
    const channelTotal = await tripsitGuild.channels.fetch(env.CHANNEL_STATS_TOTAL);
    if (channelTotal) {
      const currentCount = parseInt(channelTotal.name.split(': ')[1], 10);
      if (currentCount !== memberCount) {
        channelTotal.setName(`Total Members: ${memberCount}`);
        // log.debug(F, `Updated total members to ${memberCount}!`);
        // Check if the total members is divisible by 100
        if (memberCount % 100 === 0) {
          const channelGeneral = await tripsitGuild.channels.fetch(env.CHANNEL_GENERAL) as TextChannel;
          if (channelGeneral) {
            const embed = embedTemplate()
              .setTitle('🎈🎉🎊New Record🎊🎉🎈')
              .setDescription(`We have reached ${memberCount} total members!`);
            await channelGeneral.send({ embeds: [embed] });
          }
        }
      }
    }

    // Determine how many people have the Verified role
    const roleVerified = await tripsitGuild.roles.fetch(env.ROLE_VERIFIED);
    if (roleVerified) {
      const { members } = roleVerified;
      // log.debug(F, `Role verified members: ${members.size}`);
      const channelVerified = await tripsitGuild.channels.fetch(env.CHANNEL_STATS_VERIFIED);
      if (channelVerified) {
        const currentCount = parseInt(channelVerified.name.split(': ')[1], 10);
        if (currentCount !== members.size) {
          channelVerified.setName(`Verified Members: ${members.size}`);
          // log.debug(F, `Updated verified members to ${members.size}!`);
          if (members.size % 100 === 0) {
            const channelGeneral = await tripsitGuild.channels.fetch(env.CHANNEL_GENERAL) as TextChannel;
            if (channelGeneral) {
              const embed = embedTemplate()
                .setTitle('🎈🎉🎊 New Record 🎊🎉🎈')
                .setDescription(`We have reached ${memberCount} verified members!`);
              await channelGeneral.send({ embeds: [embed] });
            }
          }
        }
      }
    }

    // Determine the number of users currently online
    const onlineCount = tripsitGuild.members.cache.filter(
      member => member.presence?.status !== undefined && member.presence?.status !== 'offline',
    ).size;
    // const onlineCount = 10;
    const channelOnline = await tripsitGuild.channels.fetch(env.CHANNEL_STATS_ONLINE);
    if (channelOnline) {
      const currentCount = parseInt(channelOnline.name.split(': ')[1], 10);
      if (currentCount !== onlineCount) {
        channelOnline.setName(`Online Members: ${onlineCount}`);
        // log.debug(F, `Updated online members to ${onlineCount}!`);
      } else {
        // log.debug(F, `Online members is already ${onlineCount}!`);
      }
    }

    // Max online count
    let maxCount = 0;
    // Update the database's max_online_members if it's higher than the current value
    // log.debug(F, `Getting guild data`);
    const guildData = await getGuild(env.DISCORD_GUILD_ID);
    if (guildData) {
      if (guildData.max_online_members) {
        maxCount = guildData.max_online_members;
        if (onlineCount > guildData.max_online_members) {
          maxCount = onlineCount;
          await db<DiscordGuilds>('discord_guilds')
            .update({
              max_online_members: onlineCount,
            })
            .where('id', env.DISCORD_GUILD_ID);
          const channelGeneral = await tripsitGuild.channels.fetch(env.CHANNEL_GENERAL) as TextChannel;
          if (channelGeneral) {
            const embed = embedTemplate()
              .setTitle('🎈🎉🎊New Record🎊🎉🎈')
              .setDescription(`We have reached ${maxCount} online members!`);
            await channelGeneral.send({ embeds: [embed] });
          }
        }
      } else {
        await db<DiscordGuilds>('discord_guilds')
          .update({
            max_online_members: onlineCount,
          })
          .where('id', env.DISCORD_GUILD_ID);
      }
    }
    const channelMax = await tripsitGuild.channels.fetch(env.CHANNEL_STATS_MAX);
    if (channelMax) {
      const currentCount = parseInt(channelMax.name.split(': ')[1], 10);
      // log.debug(F, `currentCount: ${currentCount} | maxCount: ${maxCount}`);
      if (maxCount > currentCount) {
        channelMax.setName(`Max Online: ${maxCount}`);
        // log.debug(F, `Updated max online members to ${maxCount}!`);
      } else {
        // log.debug(F, `Max members is already ${maxCount}!`);
      }
    }
  }
}

async function checkReminders() {
  // log.info(F, `Checking timers...`);
  // Process reminders
  const reminderData = await db<UserReminders>('user_reminders')
    .select(
      db.ref('id'),
      db.ref('user_id'),
      db.ref('reminder_text'),
      db.ref('trigger_at'),
    );
  if (reminderData.length > 0) {
    // Loop through each reminder
    // for (const reminder of reminderData) {
    reminderData.forEach(async reminder => {
      // Check if the reminder is ready to be triggered
      if (reminder.trigger_at) {
        if (DateTime.fromJSDate(reminder.trigger_at) <= DateTime.local()) {
          // Get the user's discord id
          const userData = await getUser(null, reminder.user_id);

          // Send the user a message
          if (userData && userData.discord_id) {
            const user = await global.client.users.fetch(userData.discord_id);
            if (user) {
              await user.send(`Hey ${user.username}, you asked me to remind you: ${reminder.reminder_text}`);
            }
          }

          // Delete the reminder from the database
          await db<UserReminders>('user_reminders')
            .delete()
            .where('id', reminder.id);
        }
      } else {
        log.error(F, `Reminder ${reminder.id} has no trigger date!`);
      }
    });
  }
}

async function checkTickets() {
  // Process tickets
  const ticketData = await db<UserTickets>('user_tickets')
    .select(
      db.ref('id'),
      db.ref('archived_at'),
      db.ref('status'),
      db.ref('thread_id'),
      db.ref('user_id'),
      db.ref('deleted_at'),
    )
    .whereNot('status', 'DELETED');
  // Loop through each ticket
  // for (const ticket of ticketData) {
  ticketData.forEach(async ticket => {
    // log.debug(F, `Ticket: ${ticket.id} archives on ${ticket.archived_at} deletes on ${ticket.deleted_at}`);
    // Check if the ticket is ready to be archived
    if (ticket.archived_at
      && ticket.status !== 'ARCHIVED'
      && DateTime.fromJSDate(ticket.archived_at) <= DateTime.local()) {
      log.debug(F, `Archiving ticket ${ticket.id}...`);

      // Archive the ticket set the deleted time to 1 week from now
      await db<UserTickets>('user_tickets')
        .update({
          status: 'ARCHIVED' as TicketStatus,
          deleted_at: DateTime.local().plus({ days: 7 }).toJSDate(),
        })
        .where('id', ticket.id);

      // Archive the thread on discord
      if (ticket.thread_id) {
        try {
          const thread = await global.client.channels.fetch(ticket.thread_id) as ThreadChannel;
          await thread.setArchived(true);
        } catch (err) {
          // Thread was likely manually deleted
        }
      }

      // Restore roles on the user
      const userData = await getUser(null, ticket.user_id);
      if (userData.discord_id) {
        const discordUser = await global.client.users.fetch(userData.discord_id);
        if (discordUser) {
          const guild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
          if (guild) {
            const searchResults = await guild.members.search({ query: discordUser.username });
            // log.debug(F, `searchResults: ${JSON.stringify(searchResults)}`);
            if (searchResults.size > 0) {
              const member = await guild.members.fetch(discordUser);
              if (member) {
                const myMember = await guild.members.fetch(env.DISCORD_CLIENT_ID);
                const myRole = myMember.roles.highest;

                // Restore the old roles
                if (userData.roles) {
                  // log.debug(F, `Restoring ${userData.discord_id}'s roles: ${userData.roles}`);
                  const roles = userData.roles.split(',');
                  // for (const role of roles) {
                  roles.forEach(async role => {
                    const roleObj = await guild.roles.fetch(role);
                    if (roleObj && roleObj.name !== '@everyone'
                            && roleObj.id !== env.ROLE_NEEDSHELP
                            && roleObj.comparePositionTo(myRole) < 0
                    ) {
                      // Check if the bot has permission to add the role
                      // log.debug(F, `Adding ${userData.discord_id}'s ${role} role`);
                      await member.roles.add(roleObj);
                    }
                  });

                  // Remove the needshelp role
                  const needshelpRole = await guild.roles.fetch(env.ROLE_NEEDSHELP);
                  if (needshelpRole && needshelpRole.comparePositionTo(myRole) < 0) {
                    await member.roles.remove(needshelpRole);
                  }
                }
              }
            }
          }
        }
      }
    } else if (ticket.status === 'ARCHIVED') {
      // log.debug(F, `Ticket ${ticket.id} is already archived`);
    } else {
      // log.debug(F, `Ticket ${ticket.id} is not ready to be archived`);
    }

    // Check if the ticket is ready to be deleted
    if (ticket.deleted_at
      && DateTime.fromJSDate(ticket.deleted_at) <= DateTime.local()
    ) {
      log.debug(F, `Deleting ticket ${ticket.id}...`);
      // Delete the ticket
      await db<UserTickets>('user_tickets')
        .delete()
        .where('id', ticket.id);

      // Delete the thread on discord
      if (ticket.thread_id) {
        try {
          const thread = await global.client.channels.fetch(ticket.thread_id) as ThreadChannel;
          await thread.delete();
        } catch (err) {
          // Thread was likely manually deleted
        }
      }
    } else {
      // log.debug(F, `Ticket ${ticket.id} is not ready to be deleted`);
    }
  });

  // As a failsafe, loop through the Tripsit room and delete any threads that are older than 10 days and are archived
  const guild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
  if (guild) {
    log.debug(F, 'Checking Tripsit room for old threads...');
    const guildData = await getGuild(guild.id);
    if (guildData && guildData.channel_tripsit) {
      log.debug(F, `Tripsit room: ${guildData.channel_tripsit}`);
      const channel = await guild.channels.fetch(guildData.channel_tripsit) as TextChannel;
      if (channel) {
        log.debug(F, `Tripsit room: ${channel.name} (${channel.id})`);
        const threadList = await channel.threads.fetchArchived({ type: 'private', fetchAll: true });
        log.debug(F, `Found ${threadList.threads.size} archived threads in Tripsit room`);
        threadList.threads.forEach(async thread => {
          // Check if the thread was created over a week ago
          await thread.fetch();
          if (DateTime.fromJSDate(thread.createdAt as Date) <= DateTime.local().minus({ days: 10 })) {
            thread.delete();
            log.debug(F, `Thread ${thread.id} is deleted`);
          } else {
            log.debug(F, `Thread ${thread.id} is not ready to be deleted ${thread.createdAt}`);
          }
        });
      }
    }
  }
}

async function checkMindsets() {
  // Process mindset roles
  const mindsetRoleData = await db<Users>('users')
    .select(
      db.ref('mindset_role'),
      db.ref('mindset_role_expires_at'),
      db.ref('discord_id'),
    )
    .whereNotNull('mindset_role_expires_at');
  if (mindsetRoleData.length > 0) {
    // Loop through each user
    // for (const user of mindsetRoleData) {
    mindsetRoleData.forEach(async mindetUser => {
      // log.debug(F, `mindsetUser: ${JSON.stringify(mindetUser, null, 2)}`);
      // log.debug(F, `Expires: ${DateTime.fromJSDate(mindetUser.mindset_role_expires_at!) <= DateTime.local()}`);

      // Check if the user has a mindset role
      if (mindetUser.mindset_role
              && mindetUser.mindset_role_expires_at
              && DateTime.fromJSDate(mindetUser.mindset_role_expires_at) <= DateTime.local()
              && mindetUser.discord_id
      ) {
        // const expires = DateTime.fromJSDate(user.mindset_role_expires_at);
        // log.debug(F, `${DateTime.fromJSDate(mindetUser.mindset_role_expires_at)}`); // eslint-disable-line max-len
        // Check if the user's mindset role has expired
        // Get the user's discord id
        // Get the user's discord object
        const user = await global.client.users.fetch(mindetUser.discord_id);
        const guild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
        if (user && guild) {
          const searchResults = await guild.members.search({ query: user.username });
          // log.debug(F, `searchResults: ${JSON.stringify(searchResults)}`);
          // log.debug(F, `searchResults.keys: ${searchResults.size}`);
          if (searchResults.size > 0) {
            // Get the user's discord member object
            const member = await guild.members.fetch(user.id);
            const role = await guild.roles.fetch(mindetUser.mindset_role);
            // log.debug(F, `member: ${JSON.stringify(member, null, 2)}`);
            // log.debug(F, `role: ${JSON.stringify(role, null, 2)}`);
            if (member && role) {
              // Get the reaction role info from the db
              // const reactionRoleData = await db<ReactionRoles>('reaction_roles')
              //   .select(
              //     db.ref('message_id'),
              //     db.ref('emoji'),
              //   )
              //   .where('role_id', user.mindset_role)
              //   .first();

              // Remove the reaction from the role message
              await member.roles.remove(role);
              // log.debug(F, `Removed ${user.discord_id}'s ${user.mindset_role} role`);
              // Update the user's mindset role in the database
              await db<Users>('users')
                .insert({
                  discord_id: mindetUser.discord_id,
                  mindset_role: null,
                  mindset_role_expires_at: null,
                })
                .onConflict('discord_id')
                .merge();
            }
          }
        }
      }
    });
  }
}

/**
 * This function is called on start.ts and runs the timers
 */
export async function runTimer() {
  /**
   * This timer runs every (INTERVAL) to determine if there are any tasks to perform
   * This function uses setTimeout so that it can finish runing before the next loop
   */
  function checkTimers() {
    setTimeout(
      async () => {
        await checkStats();
        await checkReminders();
        await checkTickets();
        await checkMindsets();

        checkTimers();
      },
      interval,
    );
  }
  checkTimers();
}
