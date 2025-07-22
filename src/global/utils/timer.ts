import type {
  experience_category,
  experience_type,
  ticket_status,
  ticket_type,
} from '@prisma/client';
import type {
  CategoryChannel,
  Guild,
  GuildMember,
  PermissionResolvable,
  TextChannel,
  ThreadChannel,
} from 'discord.js';

import axios from 'axios';
import { stripIndents } from 'common-tags';
import { ActivityType, ChannelType, Colors } from 'discord.js';
import { DateTime } from 'luxon';
import Parser from 'rss-parser';

import { checkChannelPermissions } from '../../discord/utils/checkPermissions';
import { embedTemplate } from '../../discord/utils/embedTemplate';
import { profile } from '../commands/g.learn';
import getTripSitStatistics from '../commands/g.tripsitstats';
import { experience } from './experience';
import updateDatabase from './updateDb';

const F = f(__filename);

// const lastReminder = {} as {
//   [key: string]: DateTime;
// };

const newRecordString = '🎈🎉🎊 New Record 🎊🎉🎈';

interface RedditFeed {
  feedUrl: string;
  items: RedditItem[];
  lastBuildDate: string;
  link: string;
  title: string;
}

interface RedditItem {
  author: string;
  content: string;
  contentSnippet: string;
  id: string;
  isoDate: string;
  link: string;
  pubDate: string;
  title: string;
}

// const intervalP = env.NODE_ENV === 'production' ? 1000 * 30 : 1000 * 1;

export default runTimer;

async function callUptime() {
  if (env.NODE_ENV !== 'production') {
    return;
  }
  axios
    .get(
      `https://uptime.tripsit.me/api/push/B11H5MbsKx?status=up&msg=OK&ping=${discordClient.ws.ping}`,
    )
    .catch((error) => {
      log.debug(F, `Error when calling uptime monitor! ${error}`);
    });
}

async function checkEvery(callback: () => Promise<void>, interval: number) {
  setTimeout(async () => {
    await callback();
    checkEvery(callback, interval);
  }, interval);
}

async function checkMindsets() {
  // log.debug(F, 'Checking mindsets...');
  // Process mindset roles
  const mindsetRoleData = await db.users.findMany({
    where: {
      mindset_role: {
        not: null,
      },
    },
  });
  if (mindsetRoleData.length > 0) {
    // Loop through each user
    // for (const user of mindsetRoleData) {
    mindsetRoleData.forEach(async (mindsetUser) => {
      // log.debug(F, `mindsetUser: ${JSON.stringify(mindsetUser, null, 2)}`);
      // log.debug(F, `Expires: ${DateTime.fromJSDate(mindsetUser.mindset_role_expires_at!) <= DateTime.local()}`);

      // Check if the user has a mindset role
      if (
        mindsetUser.mindset_role &&
        mindsetUser.mindset_role_expires_at &&
        DateTime.fromJSDate(mindsetUser.mindset_role_expires_at) <= DateTime.local() &&
        mindsetUser.discord_id
      ) {
        // const expires = DateTime.fromJSDate(user.mindset_role_expires_at);
        // log.debug(F, `${DateTime.fromJSDate(mindsetUser.mindset_role_expires_at)}`); // eslint-disable-line max-len
        // Check if the user's mindset role has expired
        // Get the user's discord id
        // Get the user's discord object
        const user = await globalThis.discordClient.users.fetch(mindsetUser.discord_id);
        const guild = await globalThis.discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
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

              // await usersUpdate(updatedUser);
              if (updatedUser.discord_id) {
                await db.users.update({
                  data: {
                    mindset_role: updatedUser.mindset_role,
                    mindset_role_expires_at: updatedUser.mindset_role_expires_at,
                  },
                  where: {
                    discord_id: updatedUser.discord_id,
                  },
                });
              }
            }
          }
        }
      }
    });
  }
}

async function checkReminders() {
  // log.debug(F, 'Checking reminders...');
  // Process reminders
  // const reminderData = await reminderGet();
  const reminderData = await db.user_reminders.findMany();
  if (reminderData.length > 0) {
    // Loop through each reminder
    // for (const reminder of reminderData) {
    reminderData.forEach(async (reminder) => {
      // Check if the reminder is ready to be triggered
      if (reminder.trigger_at) {
        if (DateTime.fromJSDate(reminder.trigger_at) <= DateTime.local()) {
          // Get the user's discord id
          const userData = await db.users.upsert({
            create: {
              id: reminder.user_id,
            },
            update: {},
            where: {
              id: reminder.user_id,
            },
          });

          // Send the user a message
          if (userData?.discord_id) {
            const user = await globalThis.discordClient.users.fetch(userData.discord_id);
            if (user) {
              await user.send(
                `Hey ${user.username}, you asked me to remind you: ${reminder.reminder_text}`,
              );
            }
          }

          // Delete the reminder from the database
          await db.user_reminders.delete({
            where: {
              id: reminder.id,
            },
          });
        }
      } else {
        log.error(F, `Reminder ${reminder.id} has no trigger date!`);
      }
    });
  }
}

async function checkRss() {
  // log.debug(F, 'Checking rss...');
  const parser = new Parser<RedditFeed, RedditItem>();
  (async () => {
    const guild = await globalThis.discordClient.guilds.fetch(env.DISCORD_GUILD_ID);

    // log.debug(F, `guild: ${JSON.stringify(guild, null, 2)}\n`);
    const rssData = await db.rss.findMany({
      where: {
        guild_id: guild.id,
      },
    });
    // log.debug(F, `rssData: ${JSON.stringify(rssData, null, 2)}\n`);

    rssData.forEach(async (feed) => {
      let mostRecentPost = {} as Parser.Item & RedditItem;
      try {
        [mostRecentPost] = (await parser.parseURL(feed.url)).items;
      } catch {
        // log.debug(F, `Error parsing ${feed.url}: ${error}`);
        return;
      }
      // log.debug(F, `mostRecentPost: ${JSON.stringify(mostRecentPost, null, 2)}`);

      if (feed.last_post_id === mostRecentPost.id) {
        return;
      }

      // log.debug(F, `New post: ${JSON.stringify(mostRecentPost, null, 2)}`);

      const channelBotlog = (await guild.channels.fetch(feed.destination)) as TextChannel;

      // Gets everything before "submitted by"
      const bigBody = mostRecentPost.contentSnippet.slice(
        0,
        mostRecentPost.contentSnippet.indexOf('submitted by'),
      );

      // Gets the first 2000 characters of the body
      const body = bigBody.slice(0, 2000);

      // Capitalizes the B in by and gets the username
      const submittedBy = `B${mostRecentPost.contentSnippet
        .slice(
          mostRecentPost.contentSnippet.indexOf('submitted by') + 11,
          mostRecentPost.contentSnippet.indexOf('[link]'),
        )
        .replaceAll('    ', ' ')}`;

      // log.debug(F, `submittedBy: ${submittedBy}`);

      const subreddit = mostRecentPost.link.slice(
        mostRecentPost.link.indexOf('/r/') + 3,
        mostRecentPost.link.indexOf('/comments'),
      );

      const embed = embedTemplate();
      try {
        embed.setAuthor({ iconURL: env.TS_ICON_URL, name: `New /r/${subreddit} post` });
        embed.setTitle(mostRecentPost.title.slice(0, 256));
        embed.setURL(mostRecentPost.link);
        embed.setFooter({ iconURL: env.FLAME_ICON_URL, text: submittedBy });
        embed.setTimestamp(new Date(mostRecentPost.pubDate));
      } catch {
        // log.debug(F, `Error creating embed: ${error}`);
        // log.debug(F, `mostRecentPost: ${JSON.stringify(mostRecentPost, null, 2)}`);
        return;
      }

      if (body.length > 0) {
        embed.setDescription(stripIndents`
          ${body}
        `);
      }

      channelBotlog.send({ embeds: [embed] });

      const newFeed = feed;
      newFeed.last_post_id = mostRecentPost.id;

      await db.rss.update({
        data: {
          last_post_id: newFeed.last_post_id,
        },
        where: {
          id: newFeed.id,
        },
      });
    });
  })();
}

async function checkStats() {
  // log.debug(F, 'Checking stats...');
  // Determine how many people are in the tripsit guild
  const tripsitGuild = await globalThis.discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
  if (!tripsitGuild) {
    return;
  }

  const { memberCount } = tripsitGuild;

  // Total member count
  // Check if the total members is divisible by 100
  if (memberCount % 100 === 0) {
    const embed = embedTemplate()
      .setTitle(newRecordString)
      .setDescription(`We have reached ${memberCount} total members!`);
    const channelLounge = (await tripsitGuild.channels.fetch(env.CHANNEL_LOUNGE)) as TextChannel;
    if (channelLounge) {
      await channelLounge.send({ embeds: [embed] });
    }
    const channelTeamtripsit = (await tripsitGuild.channels.fetch(
      env.CHANNEL_TEAMTRIPSIT,
    )) as TextChannel;
    if (channelTeamtripsit) {
      await channelTeamtripsit.send({ embeds: [embed] });
    }
  }
}

// async function changeStatus() {
//   discordClient.user?.setActivity('with a test kit', { type: ActivityType.Playing });
//   // let state = 0;
//   // let presence = activities[state];
//   // log.debug(F, `Setting presence to ${presence.message}`);
//   // log.debug(F, `Setting presence type to ${presence.type}`);
//   // @ts-ignore
//   // discordClient.user?.setActivity(presence.message, {type: presence.type});
//   // setInterval(() => {
//   //   state = (state + 1) % activities.length;
//   //   presence = activities[state];
//   //   // log.debug(F, `Setting activity to ${presence.type} ${presence.message}`);
//   //   // @ts-ignore
//   //   discordClient.user?.setActivity(presence.message, {type: presence.type});
//   // }, delay);
// }

async function checkTickets() {
  // log.debug(F, 'Checking tickets...');
  // Process tickets
  const ticketData = await db.user_tickets.findMany();
  // Loop through each ticket
  if (ticketData.length > 0) {
    ticketData.forEach(async (ticket) => {
      // const archiveDate = DateTime.fromJSDate(ticket.archived_at);
      // const deleteDate = DateTime.fromJSDate(ticket.deleted_at);
      // log.debug(F, `Ticket: ${ticket.id} archives on ${archiveDate.toLocaleString(DateTime.DATETIME_FULL)} deletes on ${deleteDate.toLocaleString(DateTime.DATETIME_FULL)}`);
      // Check if the ticket is ready to be archived
      if (
        ticket.archived_at &&
        ticket.status !== 'ARCHIVED' &&
        ticket.status !== 'DELETED' &&
        ticket.status !== 'PAUSED' &&
        DateTime.fromJSDate(ticket.archived_at) <= DateTime.local()
      ) {
        // log.debug(F, `Archiving ticket ${ticket.id}...`);

        // Archive the ticket set the deleted time to 1 week from now

        const updatedTicket = ticket;
        updatedTicket.status = 'ARCHIVED' as ticket_status;
        updatedTicket.deleted_at =
          env.NODE_ENV === 'production'
            ? DateTime.local().plus({ days: 3 }).toJSDate()
            : DateTime.local().plus({ minutes: 1 }).toJSDate();
        if (!updatedTicket.description) {
          updatedTicket.description = 'Ticket archived';
        }
        if (!updatedTicket.type) {
          updatedTicket.type = 'TRIPSIT' as ticket_type;
        }
        if (!updatedTicket.first_message_id) {
          updatedTicket.first_message_id = '123';
        }

        // await ticketUpdate(updatedTicket);
        await db.user_tickets.update({
          data: {
            deleted_at: updatedTicket.deleted_at,
            description: updatedTicket.description,
            first_message_id: updatedTicket.first_message_id,
            status: updatedTicket.status,
            type: updatedTicket.type,
          },
          where: {
            id: updatedTicket.id,
          },
        });

        // Archive the thread on discord
        if (ticket.thread_id) {
          try {
            const thread = (await globalThis.discordClient.channels.fetch(
              ticket.thread_id,
            )) as ThreadChannel;
            await thread.setArchived(true);
            log.debug(F, `Archived thread ${thread.name}`);
          } catch {
            // Thread was likely manually deleted
          }
        }

        // Restore roles on the user
        const userData = await db.users.upsert({
          create: {},
          update: {},
          where: {
            id: ticket.user_id,
          },
        });
        if (userData.discord_id) {
          const discordUser = await discordClient.users.fetch(userData.discord_id);
          if (discordUser) {
            let threadChannel = {} as ThreadChannel;
            try {
              threadChannel = (await discordClient.channels.fetch(
                ticket.thread_id,
              )) as ThreadChannel;
              const guild = await discordClient.guilds.fetch(threadChannel.guild.id);
              const guildData = await db.discord_guilds.upsert({
                create: {
                  id: guild.id,
                },
                update: {},
                where: {
                  id: guild.id,
                },
              });
              const searchResults = await guild.members.search({ query: discordUser.username });
              // log.debug(F, `searchResults: ${JSON.stringify(searchResults)}`);
              if (searchResults.size > 0) {
                const member = await guild.members.fetch(discordUser);
                if (member) {
                  const myMember = guild.members.me!;
                  const myRole = myMember.roles.highest;

                  // Restore the old roles
                  if (userData.roles) {
                    // log.debug(F, `Restoring ${userData.discord_id}'s roles: ${userData.roles}`);
                    const roles = userData.roles.split(',');
                    // for (const role of roles) {
                    roles.forEach(async (role) => {
                      const roleObject = await guild.roles.fetch(role);
                      if (
                        roleObject &&
                        roleObject.name !== '@everyone' &&
                        roleObject.id !== guildData.role_needshelp &&
                        roleObject.comparePositionTo(myRole) < 0 &&
                        member.guild.id !== env.DISCORD_BL_ID
                        // && member.guild.id !== env.DISCORD_GUILD_ID // Patch for BL not to re-add roles
                      ) {
                        // Check if the bot has permission to add the role
                        log.debug(F, `Adding ${userData.discord_id}'s ${role} role`);
                        try {
                          await member.roles.add(roleObject);
                        } catch (error) {
                          log.error(
                            F,
                            stripIndents`Failed to add ${member.displayName}'s ${roleObject.name}\
                           role in ${member.guild.name}: ${error}`,
                          );
                        }
                      }
                    });

                    // Remove the needshelp role
                    const needshelpRole = await guild.roles.fetch(guildData.role_needshelp);
                    if (needshelpRole && needshelpRole.comparePositionTo(myRole) < 0) {
                      await member.roles.remove(needshelpRole);
                    }
                  }
                }
              }
            } catch {
              // Thread was likely manually deleted
            }
          }
        }
      }

      // Check if the ticket is ready to be deleted
      if (
        ticket.deleted_at &&
        ticket.status === 'ARCHIVED' &&
        DateTime.fromJSDate(ticket.deleted_at) <= DateTime.local()
      ) {
        log.debug(F, `Deleting ticket ${ticket.id}...`);

        // Delete the thread on discord
        if (ticket.thread_id) {
          try {
            const thread = (await globalThis.discordClient.channels.fetch(
              ticket.thread_id,
            )) as ThreadChannel;
            await thread.delete();
            log.debug(F, `Thread ${ticket.thread_id} was deleted`);
          } catch {
            // Thread was likely manually deleted
            log.debug(F, `Thread ${ticket.thread_id} was likely manually deleted`);
          }
        }
        await db.user_tickets.update({
          data: {
            status: 'DELETED' as ticket_status,
          },
          where: {
            id: ticket.id,
          },
        });
      }
    });
  }

  // As a failsafe, loop through the Tripsit room and delete any threads that are older than 7 days and are archived
  const guildDataList = await db.discord_guilds.findMany();
  if (guildDataList.length > 0) {
    guildDataList.forEach(async (guildData) => {
      // log.debug(F, `Checking guild  room for old threads...`);
      let guild = {} as Guild;
      try {
        guild = await discordClient.guilds.fetch(guildData.id);
      } catch {
        // Guild was likely deleted
        return;
      }
      if (guild && guildData.channel_tripsit) {
        // log.debug(F, 'Checking Tripsit room for old threads...');
        // log.debug(F, `Tripsit room: ${guildData.channel_tripsit}`);
        let channel = {} as TextChannel;
        try {
          channel = (await guild.channels.fetch(guildData.channel_tripsit)) as TextChannel;
        } catch {
          // Channel was likely deleted, remove it from the db
          const newGuildData = guildData;
          newGuildData.channel_tripsit = null;

          await db.discord_guilds.update({
            data: {
              channel_tripsit: newGuildData.channel_tripsit,
            },
            where: {
              id: newGuildData.id,
            },
          });
          return;
        }
        // log.debug(F, `Tripsit room: ${channel.name} (${channel.id})`);
        const tripsitPerms = await checkChannelPermissions(channel, [
          'ViewChannel' as PermissionResolvable,
          'ManageThreads' as PermissionResolvable,
        ]);

        if (!tripsitPerms.hasPermission) {
          // // Check if you have reminder the guild owner in the last 24 hours
          // const lastRemdinerSent = lastReminder[guild.id];
          // if (!lastRemdinerSent || lastRemdinerSent < DateTime.local().minus({ hours: 24 })) {
          //   // log.debug(F, `Sending reminder to ${(await guild.fetchOwner()).user.username}...`);
          //   // const guildOwner = await channel.guild.fetchOwner();
          //   // await guildOwner.send({
          //   //   content: `I am trying to prune threads in ${channel} but
          //   //  I don't have the ${tripsitPerms.permission} permission.`, // eslint-disable-line max-len
          //   // });
          //   const botOwner = await discordClient.users.fetch(env.DISCORD_OWNER_ID);
          //   await botOwner.send({
          //     content: `I am trying to prune threads in ${channel} of ${channel.guild.name} but I don't have the ${tripsitPerms.permission} permission.`, // eslint-disable-line max-len
          //   });
          //   lastReminder[guild.id] = DateTime.local();
          // }
          return;
        }

        // log.debug(F, 'Deleting old threads...');
        const threadList = await channel.threads.fetch({
          archived: {
            before: new Date().setDate(new Date().getDate() - 5),
            fetchAll: true,
            type: 'private',
          },
        });
        // const threadList = await channel.threads.fetchArchived({ type: 'private', fetchAll: true });
        // log.debug(F, `Found ${threadList.threads.size} archived threads in Tripsit room`);
        threadList.threads.forEach(async (thread) => {
          // Check if the thread was created over a week ago
          try {
            await thread.fetch();

            // Get messages and filter out system messages
            const messages = await thread.messages.fetch({ limit: 10 }); // Fetch more to account for system messages
            const userMessages = messages.filter((message) => !message.system);
            const lastUserMessage = userMessages.first();

            // Determine if this message was sent longer than a week ago
            if (
              lastUserMessage &&
              DateTime.fromJSDate(lastUserMessage.createdAt) >= DateTime.local().minus({ days: 5 })
            ) {
              thread.delete();
              log.debug(
                F,
                `Deleted thread ${thread.name} in ${channel.name} because the last user message was sent over 5 days ago`,
              );
            }
          } catch {
            // Thread was likely manually deleted
          }
        });
      }
    });
  }
}

// async function checkLpm() { // eslint-disable-line
//   const channels = [
//     env.CHANNEL_LOUNGE,
//     // env.CATEGORY_HARMREDUCTIONCENTRE,
//     env.CHANNEL_TRIPSITMETA,
//     env.CHANNEL_TRIPSIT,
//     env.CHANNEL_OPENTRIPSIT1,
//     env.CHANNEL_OPENTRIPSIT2,
//     env.CHANNEL_WEBTRIPSIT1,
//     env.CHANNEL_WEBTRIPSIT2,
//     env.CHANNEL_CLOSEDTRIPSIT,
//     env.CHANNEL_RTRIPSIT,
//     // env.CATEGORY_BACKSTAGE,
//     env.CHANNEL_PETS,
//     env.CHANNEL_FOOD,
//     env.CHANNEL_OCCULT,
//     env.CHANNEL_MUSIC,
//     env.CHANNEL_MEMES,
//     env.CHANNEL_MOVIES,
//     env.CHANNEL_GAMING,
//     env.CHANNEL_SCIENCE,
//     env.CHANNEL_CREATIVE,
//     env.CHANNEL_COMPSCI,
//     env.CHANNEL_REPLICATIONS,
//     env.CHANNEL_PHOTOGRAPHY,
//     // env.CHANNEL_RECOVERY,
//     // env.CATEGORY_CAMPGROUND,
//     env.CHANNEL_VIPLOUNGE,
//     env.CHANNEL_GOLDLOUNGE,
//     env.CHANNEL_SANCTUARY,
//     env.CHANNEL_TREES,
//     env.CHANNEL_OPIATES,
//     env.CHANNEL_STIMULANTS,
//     env.CHANNEL_DEPRESSANTS,
//     env.CHANNEL_DISSOCIATIVES,
//     env.CHANNEL_PSYCHEDELICS,
//   ];

//   const startTime = Date.now();
//   // log.debug(F, 'Checking LPM...');

//   if (!global.lpmDict) {
//     global.lpmDict = {};
//   }

//   const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
//   await guild.channels.fetch();

//   async function getLpm(channelId:string, index:number) {
//     // const channel = await guild.channels.fetch(channelId) as TextChannel;
//     const channel = guild.channels.cache.get(channelId) as TextChannel;
//     const messages = await channel.messages.fetch({ limit: 100 }); // eslint-disable-line no-await-in-loop

//     // Filter bots out of messages
//     const filteredMessages = messages.filter(message => !message.author.bot);

//     const lines1 = filteredMessages.reduce((acc, cur) => {
//       if (Date.now() - cur.createdTimestamp > 1000 * 60) return acc;
//       return acc + cur.content.split('\n').length;
//     }, 0);

//     const lines5 = filteredMessages.reduce((acc, cur) => {
//       if (Date.now() - cur.createdTimestamp > 1000 * 60 * 5) return acc;
//       return acc + cur.content.split('\n').length;
//     }, 0);

//     const lines10 = filteredMessages.reduce((acc, cur) => {
//       if (Date.now() - cur.createdTimestamp > 1000 * 60 * 10) return acc;
//       return acc + cur.content.split('\n').length;
//     }, 0);

//     const lines30 = filteredMessages.reduce((acc, cur) => {
//       if (Date.now() - cur.createdTimestamp > 1000 * 60 * 30) return acc;
//       return acc + cur.content.split('\n').length;
//     }, 0);

//     const lines60 = filteredMessages.reduce((acc, cur) => {
//       if (Date.now() - cur.createdTimestamp > 1000 * 60 * 60) return acc;
//       return acc + cur.content.split('\n').length;
//     }, 0);

//     if (lines5) {
//       if (global.lpmDict[channelId]) {
//         // log.debug(F, `lpmDict: ${JSON.stringify(global.lpmDict[channelId])}`);
//         if (global.lpmDict[channelId].lp1 === lines1 && global.lpmDict[channelId].lp60 === lines60) {
//           return;
//         }
//         if (global.lpmDict[channelId].lp1Max < lines1) {
//           global.lpmDict[channelId].lp1Max = lines1;
//         }
//         if (global.lpmDict[channelId].lp5Max < lines5) {
//           global.lpmDict[channelId].lp5Max = lines5;
//         }
//         if (global.lpmDict[channelId].lp10Max < lines10) {
//           global.lpmDict[channelId].lp10Max = lines10;
//         }
//         if (global.lpmDict[channelId].lp30Max < lines30) {
//           global.lpmDict[channelId].lp30Max = lines30;
//         }
//         if (global.lpmDict[channelId].lp60Max < lines60) {
//           global.lpmDict[channelId].lp60Max = lines60;
//         }
//         global.lpmDict[channelId].position = index;
//         global.lpmDict[channelId].name = channel.name;
//         global.lpmDict[channelId].lp1 = lines1;
//         global.lpmDict[channelId].lp5 = lines5;
//         global.lpmDict[channelId].lp10 = lines10;
//         global.lpmDict[channelId].lp30 = lines30;
//         global.lpmDict[channelId].lp60 = lines60;
//       } else {
//         global.lpmDict[channelId] = {
//           position: index,
//           name: channel.name,
//           alert: 0,
//           lp1: lines1,
//           lp1Max: lines1,
//           lp5: lines5,
//           lp5Max: lines5,
//           lp10: lines10,
//           lp10Max: lines10,
//           lp30: lines30,
//           lp30Max: lines30,
//           lp60: lines60,
//           lp60Max: lines60,
//         };
//       }
//     }
//   }

//   await Promise.all(channels.map(async (channelId, index) => {
//     await getLpm(channelId, index + 1);
//   }));
//   if (global.lpmTime) {
//     global.lpmTime.push(Date.now() - startTime);
//   } else {
//     global.lpmTime = [Date.now() - startTime];
//   }
//   // log.debug(F, `LPM check took ${Date.now() - startTime}ms`);
// }

async function checkMoodle() { // eslint-disable-line
  // This function will pull all users from postgres that have a moodle_id
  // It will loop through each of those users and check their enrollments and course status in moodle
  // If the user has completed a course, it will attempt to give that user a role in discord

  // log.debug(F, 'Starting checkMoodle');

  // Set the connection status on first run
  if (globalThis.moodleConnection === undefined) {
    // log.debug(F, 'moodleConnection is undefined setting it to true and now');
    globalThis.moodleConnection = {
      date: DateTime.now(),
      status: true,
    };
  }

  // If the connection is bad and it has been less than 5 minutes, return;
  if (
    !globalThis.moodleConnection.status &&
    DateTime.now().diff(globalThis.moodleConnection.date, 'minutes').minutes <= 5
  ) {
    // log.debug(F, 'Connection is bad and it has been less than 5 minutes, returning...');
    return;
  }

  const userDataList = await db.users.findMany({
    where: {
      moodle_id: {
        not: null,
      },
    },
  });
  // log.debug(F, `userDataList: ${JSON.stringify(userDataList, null, 2)}`);

  const courseRoleMap = {
    'Intro to Tripsitting': env.ROLE_TS100,
  };

  const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
  const channelHowToVolunteer = await guild.channels.fetch(env.CHANNEL_HOW_TO_VOLUNTEER);
  const channelContent = await guild.channels.fetch(env.CHANNEL_CONTENT);

  // log.debug(F, 'Starting to check each user');

  // FIXED: Use reduce to process users sequentially instead of concurrent forEach
  await userDataList.reduce(async (previousPromise, user) => {
    await previousPromise; // Wait for the previous user to complete

    let member = {} as GuildMember;
    try {
      member = await guild.members.fetch(user.discord_id);
    } catch {
      // log.debug(F, `Error fetching member: ${error}`);
      return; // Skip this user and continue with the next one
    }

    let moodleProfile: { completedCourses?: string[] | undefined };
    try {
      // Add timeout protection for the profile lookup
      moodleProfile = (await Promise.race([
        profile(user.discord_id),
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Profile lookup timeout'));
          }, 8000);
        }),
      ])) as { completedCourses?: string[] | undefined };
    } catch (error) {
      log.error(F, `Error getting moodle profile for user ${user.discord_id}: ${error}`);
      return; // Skip this user and continue with the next one
    }

    // log.debug(F, `Checking ${member.user.username}...`);
    if (moodleProfile.completedCourses && moodleProfile.completedCourses.length > 0) {
      // FIXED: Also use reduce for sequential course processing
      await moodleProfile.completedCourses.reduce(
        async (coursePrevious: Promise<void>, course: string) => {
          await coursePrevious; // Wait for the previous course to complete

          try {
            // log.debug(F, `${member.user.username} completed ${course}...`);
            const roleId = courseRoleMap[course as keyof typeof courseRoleMap];
            const role = await guild.roles.fetch(roleId);

            if (role) {
              // log.debug(F, `Found role: ${JSON.stringify(role, null, 2)}`);
              // check if the member already has the role
              if (member.roles.cache.has(role.id)) {
                // log.debug(F, `${member.user.username} already has the ${role.name} role`);
                return; // Skip to next course
              }

              if (channelContent) {
                // log.debug(F, `Sending message to ${channelContent.name}`);
                await (channelContent as TextChannel).send({
                  embeds: [
                    embedTemplate()
                      .setColor(Colors.Green)
                      .setDescription(`Congratulate ${member} on completing "${course}"!`),
                  ],
              }); // eslint-disable-line
              }

              if (member.roles.cache.has(env.ROLE_NEEDSHELP)) {
                log.info(
                  F,
                  `Skipped giving ${member.user.username} the ${role.name} because they have the Needs Help role`,
                );
              } else {
                await member.roles.add(role);
                log.info(F, `Gave ${member.user.username} the ${role.name} role`);
              }

              // eslint-disable max-len
              try {
                await member.user.send({
                  embeds: [
                    embedTemplate()
                      .setColor(Colors.Green)
                      .setTitle(`Congratulations on completing "${course}"!`)
                      .setDescription(stripIndents`
                    Give yourself deserved pack on the back, you deserve it!
                                 
                    But your journey doesn't end here...

                    You can now become a TripSit Helper!
                    Head over to ${channelHowToVolunteer} and post your introduction.

                    Show off your achievement with \`/learn profile\` in any discord guild with TripBot.
                    Maybe you'll inspire someone else to learn too!

                    No tripbot? No problem!
                    Anyone can [verify the code on your certificate](https://learn.tripsit.me/mod/customcert/verify_certificate.php) to see you completed the course.

                    Finally, if you have any feedback on the course, please let us know in the ${channelContent} channel, or on the forum in the course!

                    Thanks so much for taking the time to learn with us, we hope you enjoyed it!
                    `),
                  ],
                });
                // log.debug(F, `Sent ${member.user.username} a message!`);
              } catch (error) {
                log.warn(F, `Could not send DM to ${member.user.username}: ${error}`);
              }
            }
          } catch (error) {
            log.error(
              F,
              `Error processing course ${course} for user ${member.user.username}: ${error}`,
            );
          }
        },
        Promise.resolve(),
      );
    }
  }, Promise.resolve());

  // log.debug(F, 'Finished checking moodle!');
  // log.debug(F, `connection: ${JSON.stringify(global.moodleConnection, null, 2)}`);

  // if (!global.moodleConnection.status) {
  //   log.debug(F, 'moodleConnection failed, hopefully you\'re in dev LMAO');
  // }
}

/* async function pruneInactiveHelpers() {
  const inactiveThreshold = new Date();
  // 2 months for production, 1 minute for dev
  if (env.NODE_ENV === 'production') {
    inactiveThreshold.setMonth(inactiveThreshold.getMonth() - 2);
  } else {
    inactiveThreshold.setMinutes(inactiveThreshold.getMinutes() - 1);
  }

  const inactiveHelpers = await db.users.findMany({
    where: {
      last_helper_activity: {
        lt: inactiveThreshold,
      },
    },
  });

  const guild = discordClient.guilds.cache.get(env.DISCORD_GUILD_ID);
  if (!guild) {
    log.error(F, `Guild with ID ${env.DISCORD_GUILD_ID} not found.`);
    return;
  }

  const guildData = await db.discord_guilds.upsert({
    where: {
      id: guild.id,
    },
    create: {
      id: guild.id,
    },
    update: {},
  });

  if (!guildData.role_helper) {
    log.error(F, `Unable to fetch helper role from db in pruneInactiveHelpers for guild ID ${env.DISCORD_GUILD_ID}`);
    return;
  }

  const role = guild.roles.cache.get(guildData.role_helper);
  if (!role) {
    log.error(F, `Unable to fetch helper role from Discord in pruneInactiveHelpers for guild ID ${env.DISCORD_GUILD_ID}`);
    return;
  }

  // Loop through the inactive helpers and check their guild membership
  const promises = inactiveHelpers.map(async user => {
    if (!user.discord_id) {
      log.info(F, `Failed to fetch discord ID for db entry ${user.id}`);
      return; // No need to continue for this user
    }

    const member = await guild.members.fetch(user.discord_id).catch(() => null);
    if (member) {
      await member.roles.remove(role);

      try {
        const channelHowToVolunteer = await guild.channels.fetch(env.CHANNEL_HOW_TO_VOLUNTEER);
        await member.send(stripIndents`
          Your helper role has been automatically removed on TripSit due to inactivity,
          but no worries—you can easily reapply for it at any time through ${channelHowToVolunteer}
          if you’d like to start helping out again.

          Thank you for all your past contributions, and we’d love to have you back whenever you're ready!
        `);
      } catch (error) {
        log.error(F, `Failed to send DM to ${member.user.username}: ${error}`);
      }
    } else { // If we run into a Helper who is no longer a member, then notify the Tripsitters.
      const target = await guild.client.users.fetch(user.discord_id);
      log.info(F, `Helper ${target.username}(${user.discord_id}) is no longer a member of the guild :(`);
      const channelTripsitters = await guild.channels.fetch(env.CHANNEL_TRIPSITTERS) as TextChannel;
      await channelTripsitters.send(stripIndents`Helper ${target.username}(${user.discord_id}) is no longer a member of the guild :(`);
    }

    // Reset activity to prevent looping the same user again
    await db.users.upsert({
      where: {
        discord_id: user.discord_id,
      },
      create: {
        discord_id: user.discord_id,
      },
      update: {
        last_helper_activity: null,
      },
    });
  });

  await Promise.all(promises); // Wait for all promises to resolve
  log.info(F, `${inactiveHelpers.length} inactive helpers have been pruned and notified.`);
} */

async function checkVoice() {
  // This function will run every minute and check every voice channel on the guild
  // If someone satisfies the following conditions, they will be awarded voice exp
  // 1. They are not a bot
  // 2. They are in a voice channel
  // 4. They have not been awarded voice exp in the last 5 minutes
  // 5. Are not AFK
  // 6. Are not deafened
  // 7. Are not muted
  // 9. Are not in a stage channel
  // 10. Do not have the NeedsHelp role
  // 10. With another human in the channel that also meets these conditions

  // The type of voice exp is determined by the category the voice channel is in
  // GENERAL = Campground and Backstage
  // TRIPSITTER = HR
  // TEAM = Team
  // DEVELOPER = Development

  // The amount of of voice gained is ((A random value between 15 and 25) / 2)

  // log.info('voiceExp', 'Checking voice channels...');
  (async () => {
    // Define each category type and the category channel id
    const categoryDefs = [
      { category: 'GENERAL' as experience_category, id: env.CATEGORY_CAMPGROUND },
      { category: 'GENERAL' as experience_category, id: env.CATEGORY_VOICE },
      { category: 'GENERAL' as experience_category, id: env.CATEGORY_BACKSTAGE },
      { category: 'TEAM' as experience_category, id: env.CATEGORY_TEAMTRIPSIT },
      { category: 'TRIPSITTER' as experience_category, id: env.CATEGORY_HARMREDUCTIONCENTRE },
      { category: 'DEVELOPER' as experience_category, id: env.CATEGORY_DEVELOPMENT },
    ];

    // For each of the above types, check each voice channel in the category
    categoryDefs.forEach(async (categoryDef) => {
      const category = (await discordClient.channels.fetch(categoryDef.id)) as CategoryChannel;
      category.children.cache.forEach(async (channel) => {
        if (
          channel.type === ChannelType.GuildVoice &&
          channel.id !== env.CHANNEL_CAMPFIRE
          /* && channel.members.size > 1 */
        ) {
          // For testing
          // Check to see if the people in the channel meet the right requirements
          if (channel.members.size === 0) {
            return;
          }
          // log.info('voiceExp', `${channel.name} has ${channel.members.size} people in it`);
          const humansInChat = channel.members.filter((member) => {
            if (member.user.bot) {
              // log.info('voiceExp', `${member.displayName} is a bot`);
              return false;
            }
            if (member.voice.selfDeaf) {
              // log.info('voiceExp', `${member.displayName} is self deafened`);
              return false;
            }
            if (member.voice.serverDeaf) {
              // log.info('voiceExp', `${member.displayName} is server deafened`);
              return false;
            }
            if (member.voice.selfMute) {
              // log.info('voiceExp', `${member.displayName} is self muted`);
              return false;
            }
            if (member.voice.serverMute) {
              // log.info('voiceExp', `${member.displayName} is server muted`);
              return false;
            }
            // if (member.voice.streaming) {
            //   // log.info('voiceExp', `${member.displayName} is streaming`);
            //   return false;
            // }
            if (member.voice.suppress) {
              // log.info('voiceExp', `${member.displayName} is suppressed`);
              return false;
            }
            if (member.voice.channel?.type === ChannelType.GuildStageVoice) {
              // log.info('voiceExp', `${member.displayName} is in a stage channel`);
              return false;
            }
            if (member.roles.cache.has(env.ROLE_NEEDSHELP)) {
              // log.info('voiceExp', `${member.displayName} has the NeedsHelp role`);
              return false;
            }
            return !(channel.members.size < 2 && env.NODE_ENV === 'production');
          });
          // log.info('voiceExp', `${channel.name} has ${humansInChat.size} people actively chatting in it`);
          if (
            (env.NODE_ENV === 'production' && humansInChat && humansInChat.size > 1) ||
            (env.NODE_ENV !== 'production' && humansInChat && humansInChat.size > 0)
          ) {
            // log.info('voiceExp', `Attempting to give experience to ${humansInChat.size} people in ${channel.name}: ${humansInChat.map(member => member.displayName).join(', ')}`);
            // For each human in chat, check if they have been awarded voice exp in the last 5 minutes
            // If they have not, award them voice exp
            humansInChat.forEach(async (member) => {
              await experience(member, categoryDef.category, 'VOICE' as experience_type, channel);
            });
          }
        }
      });
    });
  })();
}

async function monthlySessionStats() {
  const now = new Date();
  // Get the last day of current month (handles 28, 29, 30, or 31 days automatically)
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();

  // Check if we're on the last day of the month
  if (currentDay === lastDayOfMonth) {
    const stats = await getTripSitStatistics('session');
    const embed = embedTemplate().setTitle('TripSit Session Stats').setDescription(stats);

    // Get the channel and send the embed
    const channel = discordClient.channels.cache.get(env.CHANNEL_HELPERLOUNGE) as TextChannel;
    if (channel && channel.guildId === env.DISCORD_GUILD_ID && channel.isTextBased()) {
      await channel.send({ embeds: [embed] });
      log.info(F, 'Sent TripSit Session Stats in Helper Lounge!');
    }
  }
}

async function runTimer() {
  /**
   * This timer runs every (INTERVAL) to determine if there are any tasks to perform
   * This function uses setTimeout so that it can finish running before the next loop
   */
  discordClient.user?.setActivity('with a test kit', { type: ActivityType.Playing });
  const seconds5 = 1000 * 5;
  const seconds10 = 1000 * 10;
  const seconds30 = 1000 * 30;
  const seconds60 = 1000 * 60;
  const minutes5 = 1000 * 60 * 5;
  const hours24 = 1000 * 60 * 60 * 24;
  const hours48 = 1000 * 60 * 60 * 48;

  const timers = [
    { callback: checkReminders, interval: env.NODE_ENV === 'production' ? seconds10 : seconds5 },
    { callback: checkTickets, interval: env.NODE_ENV === 'production' ? seconds60 : seconds10 },
    { callback: checkMindsets, interval: env.NODE_ENV === 'production' ? seconds60 : seconds5 },
    { callback: callUptime, interval: env.NODE_ENV === 'production' ? seconds60 : seconds5 },
    { callback: checkRss, interval: env.NODE_ENV === 'production' ? seconds30 : seconds5 },
    { callback: checkVoice, interval: env.NODE_ENV === 'production' ? seconds60 : seconds5 },
    // { callback: changeStatus, interval: env.NODE_ENV === 'production' ? hours24 : seconds5 },
    { callback: checkStats, interval: env.NODE_ENV === 'production' ? minutes5 : seconds5 },
    { callback: checkMoodle, interval: env.NODE_ENV === 'production' ? seconds60 : seconds5 },
    // { callback: checkLpm, interval: env.NODE_ENV === 'production' ? seconds10 : seconds5 },
    { callback: updateDatabase, interval: env.NODE_ENV === 'production' ? hours24 : hours48 },
    // { callback: pruneInactiveHelpers, interval: env.NODE_ENV === 'production' ? hours48 : seconds60 },
    {
      callback: undoExpiredBans,
      interval: env.NODE_ENV === 'production' ? hours24 / 2 : seconds10,
    },
    {
      callback: monthlySessionStats,
      interval: env.NODE_ENV === 'production' ? hours24 / 2 : hours24 / 3,
    }, // 8 hours on dev
  ];

  for (const timer of timers) {
    checkEvery(timer.callback, timer.interval);
  }
}

async function undoExpiredBans() {
  const expiredBans = await db.user_actions.findMany({
    where: {
      expires_at: { lte: new Date(), not: null },
      type: 'FULL_BAN',
    },
  });

  if (expiredBans.length === 0) {
    return;
  }

  await Promise.all(
    expiredBans.map(async (activeBan) => {
      // Use map + Promise.all for async handling
      if (!activeBan.target_discord_id) {
        return;
      }

      let targetGuild: Guild | null = null;

      try {
        const user = await globalThis.discordClient.users.fetch(activeBan.target_discord_id);
        if (!user) {
          return;
        }

        targetGuild = await globalThis.discordClient.guilds.fetch(activeBan.guild_id);

        // Ensure guild exists
        if (!targetGuild) {
          return;
        }

        const targetGuildData = await db.discord_guilds.findUnique({
          where: { id: activeBan.guild_id },
        });

        // Unban user
        await targetGuild.bans.remove(user, 'Temporary ban expired');
        log.info(
          F,
          `Temporary ban for ${user.username} (${activeBan.target_discord_id}) in ${targetGuild.name} has expired and been lifted!`,
        );

        // Ensure mod log channel exists
        if (!targetGuildData?.channel_mod_log) {
          return;
        }
        const modlog = (await targetGuild.channels.fetch(
          targetGuildData.channel_mod_log,
        )) as null | TextChannel;

        // Fetch mod thread & user data
        const targetUserData = await db.users.findUnique({
          where: { discord_id: activeBan.target_discord_id },
        });
        const moduleThread = targetUserData?.mod_thread_id
          ? ((await targetGuild.channels.fetch(
              targetUserData.mod_thread_id,
            )) as null | ThreadChannel)
          : null;

        // Ensure valid dates
        if (!activeBan.created_at || !activeBan.expires_at) {
          return;
        }

        const durationMs =
          new Date(activeBan.expires_at).getTime() - new Date(activeBan.created_at).getTime();
        const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));

        // Send messages
        const embed = embedTemplate()
          .setColor(Colors.Green)
          .setDescription(
            `${user.username} (${activeBan.target_discord_id}) has been unbanned after ${days} days`,
          );

        if (moduleThread) {
          await moduleThread.send({ embeds: [embed] });
        }
        if (modlog) {
          await modlog.send({ embeds: [embed] });
        }
      } catch {
        log.error(
          F,
          `Failed to remove temporary ban on ${activeBan.target_discord_id} in ${targetGuild?.name}. Likely already unbanned.`,
        );
      } finally {
        // Reset expires_at to null
        await db.user_actions.update({
          data: { expires_at: null },
          where: { id: activeBan.id },
        });
      }
    }),
  );
}
