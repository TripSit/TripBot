import {
  PermissionResolvable,
  TextChannel,
  ThreadChannel,
} from 'discord.js';
import { DateTime } from 'luxon';
import {
  reminderGet,
  reminderDel,
  ticketGet,
  ticketDel,
  getGuild,
  getUser,
  ticketUpdate,
  usersGetMindsets,
  usersUpdate,
} from './knex';
import {
  TicketStatus, UserTickets, TicketType,
} from '../@types/database.d';
import { checkChannelPermissions } from '../../discord/utils/checkPermissions';

const F = f(__filename);

// Value in milliseconds (1000 * 60 = 1 minute)
const interval = env.NODE_ENV === 'production' ? 1000 * 30 : 1000 * 10;

export default runTimer;

async function checkReminders() {
  // log.info(F, `Checking timers...`);
  // Process reminders
  const reminderData = await reminderGet();
  if (reminderData.length > 0) {
    // Loop through each reminder
    // for (const reminder of reminderData) {
    reminderData.forEach(async reminder => {
      // Check if the reminder is ready to be triggered
      if (reminder.trigger_at) {
        if (DateTime.fromJSDate(reminder.trigger_at) <= DateTime.local()) {
          // Get the user's discord id
          const userData = await getUser(null, null, reminder.user_id);

          // Send the user a message
          if (userData && userData.discord_id) {
            const user = await global.client.users.fetch(userData.discord_id);
            if (user) {
              await user.send(`Hey ${user.username}, you asked me to remind you: ${reminder.reminder_text}`);
            }
          }

          // Delete the reminder from the database
          await reminderDel(reminder.id);
        }
      } else {
        log.error(F, `Reminder ${reminder.id} has no trigger date!`);
      }
    });
  }
}

async function checkTickets() {
  // Process tickets
  const ticketData = await ticketGet() as UserTickets[];
  // Loop through each ticket
  // for (const ticket of ticketData) {
  if (ticketData.length > 0) {
    ticketData.forEach(async ticket => {
      // log.debug(F, `Ticket: ${ticket.id} archives on ${ticket.archived_at} deletes on ${ticket.deleted_at}`);
      // Check if the ticket is ready to be archived
      if (ticket.archived_at
        && ticket.status !== 'ARCHIVED'
        && ticket.status !== 'DELETED'
        && ticket.status !== 'PAUSED'
        && DateTime.fromJSDate(ticket.archived_at) <= DateTime.local()) {
        // log.debug(F, `Archiving ticket ${ticket.id}...`);

        // Archive the ticket set the deleted time to 1 week from now

        const updatedTicket = ticket;
        updatedTicket.status = 'ARCHIVED' as TicketStatus;
        updatedTicket.deleted_at = DateTime.local().plus({ days: 7 }).toJSDate();
        if (!updatedTicket.description) {
          updatedTicket.description = 'Ticket archived';
        }
        if (!updatedTicket.type) {
          updatedTicket.type = 'TRIPSIT' as TicketType;
        }
        if (!updatedTicket.first_message_id) {
          updatedTicket.first_message_id = '123';
        }

        await ticketUpdate(updatedTicket);

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
        const userData = await getUser(null, null, ticket.user_id);
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
        // log.debug(F, `Deleting ticket ${ticket.id}...`);
        // Delete the ticket
        await ticketDel(ticket.id);

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
  }

  // As a failsafe, loop through the Tripsit room and delete any threads that are older than 7 days and are archived
  const guild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
  if (guild) {
    // log.debug(F, 'Checking Tripsit room for old threads...');
    const guildData = await getGuild(guild.id);
    if (guildData && guildData.channel_tripsit) {
      // log.debug(F, `Tripsit room: ${guildData.channel_tripsit}`);
      const channel = await guild.channels.fetch(guildData.channel_tripsit) as TextChannel;
      if (channel) {
        // log.debug(F, `Tripsit room: ${channel.name} (${channel.id})`);
        const perms = await checkChannelPermissions(channel, [
          'ManageThreads' as PermissionResolvable,
        ]);

        if (perms.hasPermission) {
          // log.debug(F, 'Deleting old threads...');
          const threadList = await channel.threads.fetch({
            archived: {
              type: 'private',
              fetchAll: true,
              before: new Date().setDate(new Date().getDate() - 7),
            },
          });
          // const threadList = await channel.threads.fetchArchived({ type: 'private', fetchAll: true });
          // log.debug(F, `Found ${threadList.threads.size} archived threads in Tripsit room`);
          threadList.threads.forEach(async thread => {
            // Check if the thread was created over a week ago
            try {
              await thread.fetch();
              if (DateTime.fromJSDate(thread.createdAt as Date) <= DateTime.local().minus({ days: 7 })) {
                thread.delete();
                // log.debug(F, `Thread ${thread.id} is deleted`);
              } else {
                // log.debug(F, `Thread ${thread.id} is not ready to be deleted ${thread.createdAt}`);
              }
            } catch (err) {
              // Thread was likely manually deleted
            }
          });
        } else {
          const guildOwner = await channel.guild.fetchOwner();
          await guildOwner.send({
            content: `I am trying to get threads in ${channel} but I don't have the ${perms.permission} permission.`,
          });
        }
      }
    }
  }
}

async function checkMindsets() {
  // Process mindset roles
  const mindsetRoleData = await usersGetMindsets();
  if (mindsetRoleData.length > 0) {
    // Loop through each user
    // for (const user of mindsetRoleData) {
    mindsetRoleData.forEach(async mindsetUser => {
      // log.debug(F, `mindsetUser: ${JSON.stringify(mindsetUser, null, 2)}`);
      // log.debug(F, `Expires: ${DateTime.fromJSDate(mindsetUser.mindset_role_expires_at!) <= DateTime.local()}`);

      // Check if the user has a mindset role
      if (mindsetUser.mindset_role
              && mindsetUser.mindset_role_expires_at
              && DateTime.fromJSDate(mindsetUser.mindset_role_expires_at) <= DateTime.local()
              && mindsetUser.discord_id
      ) {
        // const expires = DateTime.fromJSDate(user.mindset_role_expires_at);
        // log.debug(F, `${DateTime.fromJSDate(mindsetUser.mindset_role_expires_at)}`); // eslint-disable-line max-len
        // Check if the user's mindset role has expired
        // Get the user's discord id
        // Get the user's discord object
        const user = await global.client.users.fetch(mindsetUser.discord_id);
        const guild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
        if (user && guild) {
          const searchResults = await guild.members.search({ query: user.username });
          // log.debug(F, `searchResults: ${JSON.stringify(searchResults)}`);
          // log.debug(F, `searchResults.keys: ${searchResults.size}`);
          if (searchResults.size > 0) {
            // Get the user's discord member object
            const member = await guild.members.fetch(user.id);
            const role = await guild.roles.fetch(mindsetUser.mindset_role);
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

              const updatedUser = mindsetUser;
              updatedUser.mindset_role = null;
              updatedUser.mindset_role_expires_at = null;

              await usersUpdate(updatedUser);
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
   * This function uses setTimeout so that it can finish running before the next loop
   */
  // log.debug(F, `Database URL: ${env.POSTGRES_DB_URL}`);
  function checkTimers() {
    setTimeout(
      async () => {
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
