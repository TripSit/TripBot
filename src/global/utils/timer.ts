/* eslint-disable no-unused-vars */
import {
  Guild,
  Role,
  ThreadChannel,
} from 'discord.js';
import {db} from '../../global/utils/knex';
import {DateTime} from 'luxon';
import {
  Users,
  UserDrugDoses,
  DrugNames,
  UserReminders,
  UserTickets,
} from '../../global/@types/pgdb.d';
import env from './env.config';
import logger from './logger';

import * as path from 'path';
const PREFIX = path.parse(__filename).name;

// Value in miliseconds (1000 * 60 = 1 minute)
const interval = env.NODE_ENV === 'production' ? 1000 * 60 : 1000 * 10;

/**
 * This function is called on start.ts and runs the timers
 */
export async function runTimer() {
  logger.info(`[${PREFIX}] Started!`);

  /**
   * This timer runs every (INTERVAL) to determine if there are any tasks to perform
   * This function uses setTimeout so that it can finish runing before the next loop
   */
  function checkTimers() {
    setTimeout(
      async () => {
        // logger.info(`[${PREFIX}] Checking timers...`);
        // Process reminders
        const reminderData = await db
          .select(
            db.ref('id').as('id'),
            db.ref('user_id').as('user_id'),
            db.ref('reminder_text').as('reminder_text'),
            db.ref('trigger_at').as('trigger_at'),
            db.ref('created_at').as('created_at'),
          )
          .from<UserReminders>('user_reminders');
        if (reminderData.length > 0) {
          // Loop through each reminder
          for (const reminder of reminderData) {
            // Check if the reminder is ready to be triggered
            if (DateTime.fromJSDate(reminder.trigger_at) <= DateTime.local()) {
              // Get the user's discord id
              const userData = await db
                .select(
                  db.ref('discord_id').as('discord_id'),
                )
                .from<Users>('users')
                .where('id', reminder.user_id)
                .first();

              // Send the user a message
              if (userData) {
                if (userData.discord_id) {
                  const user = await global.client.users.fetch(userData.discord_id!);
                  if (user) {
                    user.send(`Hey ${user.username}, you asked me to remind you: ${reminder.reminder_text}`);
                  }
                }
              }

              // Delete the reminder from the database
              await db
                .delete()
                .from<UserReminders>('user_reminders')
                .where('id', reminder.id);
            }
          }
        }

        // Process mindset roles
        const mindsetRoleData = await db
          .select(
            db.ref('id').as('id'),
            db.ref('discord_id').as('discord_id'),
            db.ref('mindset_role').as('mindset_role'),
            db.ref('mindset_role_expires_at').as('mindset_role_expires_at'),
          )
          .from<Users>('users')
          .whereNotNull('mindset_role_expires_at');
        if (mindsetRoleData.length > 0) {
          // Loop through each user
          for (const user of mindsetRoleData) {
            // Check if the user has a mindset role
            if (user.mindset_role) {
              const expires = DateTime.fromJSDate(user.mindset_role_expires_at!);
              logger.debug(
                `[${PREFIX}] ${user.discord_id}'s ${user.mindset_role} ${expires.toLocaleString(DateTime.DATETIME_MED)}`, // eslint-disable-line max-len
              );
              // Check if the user's mindset role has expired
              if (DateTime.fromJSDate(user.mindset_role_expires_at!) <= DateTime.local()) {
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
                          const reactionRoleData = await db
                            .select(
                              db.ref('message_id').as('message_id'),
                              db.ref('message_id').as('message_id'),
                              db.ref('message_id').as('message_id'),
                            )
                            .first()
                            .from('reaction_roles')
                            .where('role_id', user.mindset_role);

                          // Remove the reaction from the role message
                          await member.roles.remove(role);
                          logger.debug(`[${PREFIX}] Removed ${user.discord_id}'s ${user.mindset_role} role`);
                          // Update the user's mindset role in the database
                          await db
                            .insert({
                              discord_id: user.discord_id,
                              mindset_role: null,
                              mindset_role_expires_at: null,
                            })
                            .into('users')
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
        const ticketData = await db
          .select(
            db.ref('id').as('id'),
            db.ref('user_id').as('user_id'),
            db.ref('thread_id').as('thread_id'),
            db.ref('type').as('type'),
            db.ref('status').as('status'),
            db.ref('first_message_id').as('first_message_id'),
            db.ref('archived_at').as('archived_at'),
            db.ref('deleted_at').as('deleted_at'),
          )
          .from<UserTickets>('user_tickets')
          .whereNot('status', 'DELETED');
        if (ticketData.length > 0) {
          // Loop through each ticket
          for (const ticket of ticketData) {
            // Check if the ticket is ready to be archived
            if (ticket.archived_at && ticket.status !== 'ARCHIVED') {
              if (DateTime.fromJSDate(ticket.archived_at) <= DateTime.local()) {
                // Archive the ticket set the deleted time to 1 week from now
                await db
                  .update({
                    status: 'ARCHIVED',
                    deleted_at: DateTime.local().plus({days: 7}).toJSDate(),
                  })
                  .from<UserTickets>('user_tickets')
                  .where('id', ticket.id);

                // Archive the thread on discord
                const thread = await global.client.channels.fetch(ticket.thread_id) as ThreadChannel;
                if (thread) {
                  await thread.setArchived(true);
                }

                const user = await db
                  .select(
                    db.ref('discord_id').as('discord_id'),
                    db.ref('roles').as('roles'),
                  )
                  .from<Users>('users')
                  .where('id', ticket.user_id)
                  .first();
                if (user) {
                  if (user.discord_id) {
                    const discordUser = await global.client.users.fetch(user.discord_id);
                    if (discordUser) {
                      const guild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
                      if (guild) {
                        const member = await guild.members.fetch(discordUser);
                        if (member) {
                          const myMember = await guild.members.fetch(env.DISCORD_CLIENT_ID)!;
                          const myRole = myMember.roles.highest;

                          // Restore the old roles
                          if (user.roles) {
                            logger.debug(`[${PREFIX}] Restoring ${user.discord_id}'s roles: ${user.roles}`);
                            const roles = user.roles.split(',');
                            for (const role of roles) {
                              const roleObj = await guild.roles.fetch(role);
                              if (roleObj && roleObj.name !== '@everyone' && roleObj.id !== env.ROLE_NEEDSHELP) {
                                // Check if the bot has permission to add the role
                                if (roleObj.comparePositionTo(myRole) < 0) {
                                  logger.debug(`[${PREFIX}] Adding ${user.discord_id}'s ${role} role`);
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
            }
            // Check if the ticket is ready to be deleted
            if (ticket.deleted_at && ticket.status === 'ARCHIVED') {
              if (DateTime.fromJSDate(ticket.deleted_at) <= DateTime.local()) {
                // Delete the ticket
                await db
                  .delete()
                  .from<UserTickets>('user_tickets')
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
