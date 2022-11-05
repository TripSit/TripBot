/* eslint-disable no-unused-vars */
import {
  Guild,
  Role,
  ThreadChannel,
} from 'discord.js';
import {db, getUser} from '../../global/utils/knex';
import {DateTime} from 'luxon';
import {
  Users,
  UserDrugDoses,
  DrugNames,
  UserReminders,
  UserTickets,
  ReactionRoles,
  TicketStatus,
} from '../../global/@types/pgdb.d';
import env from './env.config';
import log from './log';

import {parse} from 'path';
const PREFIX = parse(__filename).name;

// Value in miliseconds (1000 * 60 = 1 minute)
const interval = env.NODE_ENV === 'production' ? 1000 * 60 : 1000 * 10;

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
        // log.info(`[${PREFIX}] Checking timers...`);
        // Process reminders
        const reminderData = await db<UserReminders>('user_reminders')
          .select(
            db.ref('id'),
            db.ref('trigger_at'),
            db.ref('user_id'),
            db.ref('reminder_text'),
          );
        if (reminderData.length > 0) {
          // Loop through each reminder
          for (const reminder of reminderData) {
            // Check if the reminder is ready to be triggered
            if (!reminder.trigger_at) {
              log.error(`[${PREFIX}] Reminder ${reminder.id} has no trigger date!`);
              continue;
            };
            if (DateTime.fromJSDate(reminder.trigger_at) <= DateTime.local()) {
              // Get the user's discord id
              const userData = await getUser(null, reminder.user_id);

              // Send the user a message
              if (userData) {
                if (userData.discord_id) {
                  const user = await global.client.users.fetch(userData.discord_id);
                  if (user) {
                    user.send(`Hey ${user.username}, you asked me to remind you: ${reminder.reminder_text}`);
                  }
                }
              }

              // Delete the reminder from the database
              await db<UserReminders>('user_reminders')
                .delete()
                .where('id', reminder.id);
            }
          }
        }

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
          for (const user of mindsetRoleData) {
            // Check if the user has a mindset role
            if (user.mindset_role && user.mindset_role_expires_at) {
              const expires = DateTime.fromJSDate(user.mindset_role_expires_at);
              // log.debug(
              //   `[${PREFIX}] ${user.discord_id}'s ${user.mindset_role}
              // ${expires.toLocaleString(DateTime.DATETIME_MED)}`, // eslint-disable-line max-len
              // );
              // Check if the user's mindset role has expired
              if (DateTime.fromJSDate(user.mindset_role_expires_at) <= DateTime.local()) {
                // Get the user's discord id
                if (user.discord_id) {
                  // Get the user's discord object
                  const discordUser = await global.client.users.fetch(user.discord_id);
                  if (discordUser) {
                    // Get the guild
                    const guild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
                    if (guild) {
                      // Get the user's discord member object
                      const member = await guild.members.fetch(discordUser);
                      if (member) {
                        // Get the role
                        const role = await guild.roles.fetch(user.mindset_role);
                        if (role) {
                          // Get the reaction role info from the db
                          const reactionRoleData = await db<ReactionRoles>('reaction_roles')
                            .select(
                              db.ref('message_id'),
                              db.ref('emoji'),
                            )
                            .where('role_id', user.mindset_role)
                            .first();

                          // Remove the reaction from the role message
                          await member.roles.remove(role);
                          // log.debug(`[${PREFIX}] Removed ${user.discord_id}'s ${user.mindset_role} role`);
                          // Update the user's mindset role in the database
                          await db<Users>('users')
                            .insert({
                              discord_id: user.discord_id,
                              mindset_role: null,
                              mindset_role_expires_at: null,
                            })
                            .onConflict('discord_id')
                            .merge();
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }

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
        if (ticketData.length > 0) {
          // Loop through each ticket
          for (const ticket of ticketData) {
            // Check if the ticket is ready to be archived
            if (ticket.archived_at && ticket.status !== 'ARCHIVED') {
              if (DateTime.fromJSDate(ticket.archived_at) <= DateTime.local()) {
                // Archive the ticket set the deleted time to 1 week from now
                await db<UserTickets>('user_tickets')
                  .update({
                    status: 'ARCHIVED' as TicketStatus,
                    deleted_at: DateTime.local().plus({days: 7}).toJSDate(),
                  })
                  .where('id', ticket.id);

                // Archive the thread on discord
                try {
                  const thread = await global.client.channels.fetch(ticket.thread_id) as ThreadChannel;
                  await thread.setArchived(true);
                } catch (error) {
                  // log.debug(`[${PREFIX}] There was an error archiving the thread, it was likely deleted`);
                }

                const userData = await getUser(null, ticket.user_id);
                if (userData.discord_id) {
                  const discordUser = await global.client.users.fetch(userData.discord_id);
                  if (discordUser) {
                    const guild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
                    if (guild) {
                      const member = await guild.members.fetch(discordUser);
                      if (member) {
                        const myMember = await guild.members.fetch(env.DISCORD_CLIENT_ID);
                        const myRole = myMember.roles.highest;

                        // Restore the old roles
                        if (userData.roles) {
                          // log.debug(`[${PREFIX}] Restoring ${userData.discord_id}'s roles: ${userData.roles}`);
                          const roles = userData.roles.split(',');
                          for (const role of roles) {
                            const roleObj = await guild.roles.fetch(role);
                            if (roleObj && roleObj.name !== '@everyone' && roleObj.id !== env.ROLE_NEEDSHELP) {
                              // Check if the bot has permission to add the role
                              if (roleObj.comparePositionTo(myRole) < 0) {
                                // log.debug(`[${PREFIX}] Adding ${userData.discord_id}'s ${role} role`);
                                await member.roles.add(roleObj);
                              }
                            }
                          }

                          // Remove the needshelp role
                          const needshelpRole = await guild.roles.fetch(env.ROLE_NEEDSHELP);
                          if (needshelpRole) {
                            if (needshelpRole.comparePositionTo(myRole) < 0) {
                              await member.roles.remove(needshelpRole);
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            // Check if the ticket is ready to be deleted
            if (ticket.deleted_at && ticket.status === 'ARCHIVED') {
              if (DateTime.fromJSDate(ticket.deleted_at) <= DateTime.local()) {
                // Delete the ticket
                await db<UserTickets>('user_tickets')
                  .delete()
                  .where('id', ticket.id);

                // Delete the thread on discord
                const thread = await global.client.channels.fetch(ticket.thread_id) as ThreadChannel;
                if (thread) {
                  await thread.delete();
                }
              }
            }
          }
        }
        checkTimers();
      },
      interval,
    );
  }
  checkTimers();
};
