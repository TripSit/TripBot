/* eslint-disable max-len */
import {
  ActivityType,
  CategoryChannel,
  ChannelType,
  Colors,
  Guild,
  GuildBasedChannel,
  GuildMember,
  PermissionResolvable,
  TextChannel,
  ThreadChannel,
} from 'discord.js';
import Parser from 'rss-parser';
import { DateTime } from 'luxon';
import axios from 'axios'; // eslint-disable-line
import { stripIndents } from 'common-tags';
import {
  experience_category, experience_type, ticket_status, ticket_type,
} from '@db/tripbot';
import updateDb from './updateDb';
import { checkChannelPermissions } from '../../discord/utils/checkPermissions';
import { embedTemplate } from '../../discord/utils/embedTemplate';
import { experience } from './experience';
import { profile } from '../commands/g.learn';
import getTripSitStatistics from '../commands/g.tripsitstats';
import { getOrCreateGuild } from './dbRecords';
import { pruneCommandParameters, pruneModerationActions, purgeInactiveUsers } from '../commands/g.privacy';

const F = f(__filename);

type RedditItem = {
  title: string,
  link: string,
  pubDate: string,
  author: string,
  content: string,
  contentSnippet: string,
  id: string,
  isoDate: string,
};

type RedditFeed = {
  title: string;
  link: string;
  feedUrl: string;
  lastBuildDate: string;
  items: RedditItem[];
};

export default runTimer;

async function checkReminders() { // eslint-disable-line @typescript-eslint/no-unused-vars
  // log.debug(F, 'Checking reminders...');
  // Process reminders
  // const reminderData = await reminderGet();
  const reminderData = await db.user_reminders.findMany();
  if (reminderData.length > 0) {
    // Loop through each reminder
    // for (const reminder of reminderData) {
    reminderData.forEach(async reminder => {
      // Check if the reminder is ready to be triggered
      if (reminder.trigger_at) {
        if (DateTime.fromJSDate(reminder.trigger_at) <= DateTime.local()) {
          // Get the user's discord id
          const userData = await db.users.upsert({
            where: {
              id: reminder.user_id,
            },
            create: {
              id: reminder.user_id,
            },
            update: {},
          });

          try {
            // Send the user a message
            if (userData?.discord_id) {
              const user = await global.discordClient.users.fetch(userData.discord_id);
              if (user) {
                await user.send(`Hey ${user.username}, you asked me to remind you: ${reminder.reminder_text}`);
              }
            }
          } catch (err) { // do nothing, user likely disabled DMs or not in a shared guild
            log.error(F, `Error sending reminder DM to user ${userData?.discord_id}: ${err}`);
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

type TicketRow = Awaited<ReturnType<typeof db.user_tickets.findMany>>[number];
type GuildRow = Awaited<ReturnType<typeof db.discord_guilds.findMany>>[number];
type UserRow = Awaited<ReturnType<typeof db.users.upsert>>;

async function restoreTicketRoles(ticket: TicketRow, userData: UserRow): Promise<void> {
  if (!userData.discord_id) return;
  const discordUser = await discordClient.users.fetch(userData.discord_id);
  if (!discordUser) return;
  try {
    const threadChannel = await discordClient.channels.fetch(ticket.thread_id) as ThreadChannel;
    const guild = await discordClient.guilds.fetch(threadChannel.guild.id);
    const guildData = await getOrCreateGuild(guild.id);
    const searchResults = await guild.members.search({ query: discordUser.username });
    if (searchResults.size === 0) return;
    const member = await guild.members.fetch(discordUser);
    if (!member || !userData.roles) return;

    const myMember = guild.members.me as GuildMember;
    const myRole = myMember.roles.highest;

    // Restore the old roles
    userData.roles.split(',').forEach(async role => {
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
        } catch (err) {
          log.error(F, stripIndents`Failed to add ${member.displayName}'s ${roleObj.name}\
           role in ${member.guild.name}: ${err}`);
        }
      }
    });

    // Remove the needshelp role
    const needshelpRole = await guild.roles.fetch(guildData.role_needshelp as string);
    if (needshelpRole && needshelpRole.comparePositionTo(myRole) < 0) {
      await member.roles.remove(needshelpRole);
    }
  } catch {
    // Thread was likely manually deleted
  }
}

async function archiveTicket(ticket: TicketRow): Promise<void> {
  // Archive the ticket set the deleted time to 1 week from now
  const updatedTicket = ticket;
  updatedTicket.status = 'ARCHIVED' as ticket_status;
  updatedTicket.deleted_at = env.NODE_ENV === 'production'
    ? DateTime.local().plus({ days: 3 }).toJSDate()
    : DateTime.local().plus({ minutes: 15 }).toJSDate();
  updatedTicket.type ??= 'TRIPSIT' as ticket_type;
  updatedTicket.first_message_id ??= '123';

  await db.user_tickets.update({
    where: {
      id: updatedTicket.id,
    },
    data: {
      status: updatedTicket.status,
      deleted_at: updatedTicket.deleted_at,
      type: updatedTicket.type,
      first_message_id: updatedTicket.first_message_id,
    },
  });

  // Archive the thread on discord
  if (ticket.thread_id) {
    try {
      const thread = await global.discordClient.channels.fetch(ticket.thread_id) as ThreadChannel;
      await thread.setArchived(true);
      log.debug(F, `Archived thread ${thread.name}`);
    } catch {
      // Thread was likely manually deleted
    }
  }

  // Restore roles on the user
  const userData = await db.users.upsert({
    where: {
      id: ticket.user_id,
    },
    create: {},
    update: {},
  });
  await restoreTicketRoles(ticket, userData);

  // Roles are only kept while a ticket is open
  if (userData.roles) {
    await db.users.update({ where: { id: userData.id }, data: { roles: null } });
  }
}

async function deleteTicket(ticket: TicketRow): Promise<void> {
  log.debug(F, `Deleting ticket ${ticket.id}...`);

  // Delete the thread on discord
  if (ticket.thread_id) {
    try {
      const thread = await global.discordClient.channels.fetch(ticket.thread_id) as ThreadChannel;
      await thread.delete();
      log.debug(F, `Thread ${ticket.thread_id} was deleted`);
    } catch {
      // Thread was likely manually deleted
      log.debug(F, `Thread ${ticket.thread_id} was likely manually deleted`);
    }
  }
  await db.user_tickets.update({
    where: {
      id: ticket.id,
    },
    data: {
      status: 'DELETED' as ticket_status,
    },
  });
}

async function processTicket(ticket: TicketRow): Promise<void> {
  // Check if the ticket is ready to be archived
  if (ticket.archived_at
    && ticket.status !== 'ARCHIVED'
    && ticket.status !== 'DELETED'
    && ticket.status !== 'PAUSED'
    && DateTime.fromJSDate(ticket.archived_at) <= DateTime.local()) {
    await archiveTicket(ticket);
  }

  // Check if the ticket is ready to be deleted
  if (ticket.deleted_at
    && ticket.status === 'ARCHIVED'
    && DateTime.fromJSDate(ticket.deleted_at) <= DateTime.local()
  ) {
    await deleteTicket(ticket);
  }
}

async function deleteStaleThread(thread: ThreadChannel, channel: TextChannel): Promise<void> {
  // Check if the thread was created over a week ago
  try {
    await thread.fetch();

    // Get messages and filter out system messages
    const messages = await thread.messages.fetch({ limit: 10 }); // Fetch more to account for system messages
    const userMessages = messages.filter(msg => !msg.system);
    const lastUserMessage = userMessages.first();

    // Determine if this message was sent longer than a week ago
    if (lastUserMessage && DateTime.fromJSDate(lastUserMessage.createdAt) >= DateTime.local().minus({ days: 5 })) {
      thread.delete();
      log.debug(F, `Deleted thread ${thread.name} in ${channel.name} because the last user message was sent over 5 days ago`);
    }
  } catch {
    // Thread was likely manually deleted
  }
}

async function cleanTripsitThreads(guildData: GuildRow): Promise<void> {
  let guild: Guild;
  try {
    guild = await discordClient.guilds.fetch(guildData.id);
  } catch {
    // Guild was likely deleted
    return;
  }
  if (!guild || !guildData.channel_tripsit) return;

  let channel: TextChannel;
  try {
    channel = await guild.channels.fetch(guildData.channel_tripsit) as TextChannel;
  } catch {
    // Channel was likely deleted, remove it from the db
    const newGuildData = guildData;
    newGuildData.channel_tripsit = null;

    await db.discord_guilds.update({
      where: {
        id: newGuildData.id,
      },
      data: {
        channel_tripsit: newGuildData.channel_tripsit,
      },
    });
    return;
  }
  const tripsitPerms = await checkChannelPermissions(channel, [
    'ViewChannel' as PermissionResolvable,
    'ManageThreads' as PermissionResolvable,
  ]);

  if (!tripsitPerms.hasPermission) {
    return;
  }

  const threadList = await channel.threads.fetch({
    archived: {
      type: 'private',
      fetchAll: true,
      before: new Date().setDate(new Date().getDate() - 5),
    },
  });
  threadList.threads.forEach(thread => deleteStaleThread(thread, channel));
}

async function checkTickets() { // eslint-disable-line @typescript-eslint/no-unused-vars
  // Process tickets
  const ticketData = await db.user_tickets.findMany();
  // Loop through each ticket
  ticketData.forEach(ticket => processTicket(ticket));

  // As a failsafe, loop through the Tripsit room and delete any threads that are older than 7 days and are archived
  const guildDataList = await db.discord_guilds.findMany();
  guildDataList.forEach(guildData => cleanTripsitThreads(guildData));
}

async function expireMindsetRole(mindsetUser: UserRow): Promise<void> {
  // Check if the user has a mindset role that has expired
  if (!mindsetUser.mindset_role
    || !mindsetUser.mindset_role_expires_at
    || DateTime.fromJSDate(mindsetUser.mindset_role_expires_at) > DateTime.local()
    || !mindsetUser.discord_id
  ) {
    return;
  }

  // Get the user's discord object
  const user = await global.discordClient.users.fetch(mindsetUser.discord_id);
  const guild = await global.discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
  if (!user || !guild) return;

  const searchResults = await guild.members.search({ query: user.username });
  if (searchResults.size === 0) return;

  // Get the user's discord member object
  const member = await guild.members.fetch(user.id);
  const role = await guild.roles.fetch(mindsetUser.mindset_role);
  if (!member || !role) return;

  // Remove the role from the member
  await member.roles.remove(role);

  // Update the user's mindset role in the database
  const updatedUser = mindsetUser;
  updatedUser.mindset_role = null;
  updatedUser.mindset_role_expires_at = null;

  if (updatedUser.discord_id) {
    await db.users.update({
      where: {
        discord_id: updatedUser.discord_id,
      },
      data: {
        mindset_role: updatedUser.mindset_role,
        mindset_role_expires_at: updatedUser.mindset_role_expires_at,
      },
    });
  }
}

async function checkMindsets() { // eslint-disable-line @typescript-eslint/no-unused-vars
  // Process mindset roles
  const mindsetRoleData = await db.users.findMany({
    where: {
      mindset_role: {
        not: null,
      },
    },
  });
  // Loop through each user
  mindsetRoleData.forEach(mindsetUser => expireMindsetRole(mindsetUser));
}

async function checkRss() { // eslint-disable-line @typescript-eslint/no-unused-vars
  // log.debug(F, 'Checking rss...');
  const parser: Parser<RedditFeed, RedditItem> = new Parser();
  (async () => {
    const guild = await global.discordClient.guilds.fetch(env.DISCORD_GUILD_ID);

    const rssData = await db.rss.findMany({
      where: {
        guild_id: guild.id,
      },
    });

    rssData.forEach(async feed => {
      let mostRecentPost: RedditItem & Parser.Item;
      try {
        [mostRecentPost] = (await parser.parseURL(feed.url)).items;
      } catch {
        return;
      }

      if (feed.last_post_id === mostRecentPost.id) return;

      const channelBotlog = await guild.channels.fetch(feed.destination) as TextChannel;

      // Gets everything before "submitted by"
      const bigBody = mostRecentPost.contentSnippet.slice(
        0,
        mostRecentPost.contentSnippet.indexOf('submitted by'),
      );

      // Gets the first 2000 characters of the body
      const body = bigBody.slice(0, 2000);

      // Capitalizes the B in by and gets the username
      const submittedBy = `B${mostRecentPost.contentSnippet.slice(
        mostRecentPost.contentSnippet.indexOf('submitted by') + 11,
        mostRecentPost.contentSnippet.indexOf('[link]'),
      ).replaceAll('    ', ' ')}`;

      const subreddit = mostRecentPost.link.slice(
        mostRecentPost.link.indexOf('/r/') + 3,
        mostRecentPost.link.indexOf('/comments'),
      );

      const embed = embedTemplate();
      try {
        embed.setAuthor({ name: `New /r/${subreddit} post`, iconURL: env.TS_ICON_URL });
        embed.setTitle(`${mostRecentPost.title.slice(0, 256)}`);
        embed.setURL(mostRecentPost.link);
        embed.setFooter({ text: submittedBy, iconURL: env.FLAME_ICON_URL });
        embed.setTimestamp(new Date(mostRecentPost.pubDate));
      } catch {
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
        where: {
          id: newFeed.id,
        },
        data: {
          last_post_id: newFeed.last_post_id,
        },
      });
    });
  })();
}

async function callUptime() { // eslint-disable-line @typescript-eslint/no-unused-vars
  if (env.NODE_ENV !== 'production') return;
  axios.get(`https://uptime.tripsit.me/api/push/B11H5MbsKx?status=up&msg=OK&ping=${discordClient.ws.ping}`).catch(e => {
    log.debug(F, `Error when calling uptime monitor! ${e}`);
  });
}

/** A member only earns voice exp when they are actually participating in the voice channel. */
function isEligibleForVoiceExp(member: GuildMember, channelMemberCount: number): boolean {
  const { voice } = member;
  const ineligible = member.user.bot
    || voice.selfDeaf
    || voice.serverDeaf
    || voice.selfMute
    || voice.serverMute
    || voice.suppress
    || voice.channel?.type === ChannelType.GuildStageVoice
    || member.roles.cache.has(env.ROLE_NEEDS_HELP);
  if (ineligible) {
    return false;
  }
  return !(channelMemberCount < 2 && env.NODE_ENV === 'production');
}

async function awardVoiceExpInChannel(channel: GuildBasedChannel, category: experience_category): Promise<void> {
  if (channel.type !== ChannelType.GuildVoice || channel.id === env.CHANNEL_CAMPFIRE) {
    return;
  }
  // Check to see if the people in the channel meet the right requirements
  if (channel.members.size < 1) {
    return;
  }
  const humansInChat = channel.members.filter(member => isEligibleForVoiceExp(member, channel.members.size));
  const minimumHumans = env.NODE_ENV === 'production' ? 1 : 0;
  if (humansInChat.size > minimumHumans) {
    // For each human in chat, check if they have been awarded voice exp in the last 5 minutes
    // If they have not, award them voice exp
    humansInChat.forEach(async member => {
      await experience(member, category, 'VOICE' as experience_type, channel);
    });
  }
}

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
    categoryDefs.forEach(async categoryDef => {
      const category = await discordClient.channels.fetch(categoryDef.id) as CategoryChannel;
      category.children.cache.forEach(channel => awardVoiceExpInChannel(channel, categoryDef.category));
    });
  })();
}

//   async function getLpm(channelId:string, index:number) {
//     // const channel = await guild.channels.fetch(channelId) as TextChannel;
//     const channel = guild.channels.cache.get(channelId) as TextChannel;
//     const messages = await channel.messages.fetch({ limit: 100 }); // eslint-disable-line no-await-in-loop

async function checkMoodle() { // eslint-disable-line
  // This function will pull all users from postgres that have a moodle_id
  // It will loop through each of those users and check their enrollments and course status in moodle
  // If the user has completed a course, it will attempt to give that user a role in discord

  // Set the connection status on first run
  global.moodleConnection ??= {
    status: true,
    date: DateTime.now(),
  };

  // If the connection is bad and it has been less than 5 minutes, return;
  if (!global.moodleConnection.status
    && DateTime.now().diff(global.moodleConnection.date, 'minutes').minutes <= 5) {
    return;
  }

  const userDataList = await db.users.findMany({
    where: {
      moodle_id: {
        not: null,
      },
    },
  });

  const courseRoleMap = {
    'Intro to Tripsitting': env.ROLE_TS100,
  };

  const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
  const channelHowToVolunteer = await guild.channels.fetch(env.CHANNEL_HOW_TO_VOLUNTEER);
  const channelContent = await guild.channels.fetch(env.CHANNEL_CONTENT);

  // FIXED: Use reduce to process users sequentially instead of concurrent forEach
  await userDataList.reduce(async (previousPromise, user) => {
    await previousPromise; // Wait for the previous user to complete

    let member = {} as GuildMember;
    try {
      member = await guild.members.fetch(user.discord_id as string);
    } catch {
      return; // Skip this user and continue with the next one
    }

    let moodleProfile: { completedCourses?: string[] };
    try {
      // Add timeout protection for the profile lookup
      moodleProfile = await Promise.race([
        profile(user.discord_id as string),
        new Promise((_, reject) => { setTimeout(() => reject(new Error('Profile lookup timeout')), 8000); }),
      ]) as { completedCourses?: string[] };
    } catch (error) {
      log.error(F, `Error getting moodle profile for user ${user.discord_id}: ${error}`);
      return; // Skip this user and continue with the next one
    }

    if (moodleProfile.completedCourses && moodleProfile.completedCourses.length > 0) {
      // FIXED: Also use reduce for sequential course processing
      await moodleProfile.completedCourses.reduce(async (coursePrevious: Promise<void>, course: string) => {
        await coursePrevious; // Wait for the previous course to complete

        try {
          const roleId = courseRoleMap[course as keyof typeof courseRoleMap];
          const role = await guild.roles.fetch(roleId);

          if (role) {
            // log.debug(F, `Found role: ${JSON.stringify(role, null, 2)}`);
            // check if the member already has the role
            if (member.roles.cache.has(role.id)) {
              return; // Skip to next course
            }

            if (channelContent) {
              await (channelContent as TextChannel).send({
                embeds: [
                  embedTemplate()
                    .setColor(Colors.Green)
                    .setDescription(`Congratulate ${member} on completing "${course}"!`),
                ],
              }); // eslint-disable-line
            }

            if (!member.roles.cache.has(env.ROLE_NEEDS_HELP)) {
              await member.roles.add(role);
              log.info(F, `Gave ${member.user.username} the ${role.name} role`);
            } else {
              log.info(F, `Skipped giving ${member.user.username} the ${role.name} because they have the Needs Help role`);
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
            } catch (error) {
              log.info(F, `Could not send DM to ${member.user.username}: ${error}`);
            }
          }
        } catch (error) {
          log.error(F, `Error processing course ${course} for user ${member.user.username}: ${error}`);
        }
      }, Promise.resolve());
    }
  }, Promise.resolve());
}

async function undoExpiredBans() {
  const expiredBans = await db.user_actions.findMany({
    where: {
      expires_at: { not: null, lte: new Date() },
      type: 'FULL_BAN',
    },
  });

  if (expiredBans.length === 0) return;

  await Promise.all(expiredBans.map(async activeBan => { // Use map + Promise.all for async handling
    if (!activeBan.target_discord_id) return;

    let targetGuild: Guild | null = null;

    try {
      const user = await global.discordClient.users.fetch(activeBan.target_discord_id);
      if (!user) return;

      targetGuild = await global.discordClient.guilds.fetch(activeBan.guild_id);

      // Ensure guild exists
      if (!targetGuild) return;

      const targetGuildData = await db.discord_guilds.findUnique({ where: { id: activeBan.guild_id } });

      // Unban user
      await targetGuild.bans.remove(user, 'Temporary ban expired');
      log.info(F, `Temporary ban for ${user.username} (${activeBan.target_discord_id}) in ${targetGuild.name} has expired and been lifted!`);

      // Ensure mod log channel exists
      if (!targetGuildData?.channel_mod_log) return;
      const modlog = await targetGuild.channels.fetch(targetGuildData.channel_mod_log) as TextChannel | null;

      // Fetch mod thread & user data
      const targetUserData = await db.users.findUnique({ where: { discord_id: activeBan.target_discord_id } });
      const modThread = targetUserData?.mod_thread_id
        ? await targetGuild.channels.fetch(targetUserData.mod_thread_id) as ThreadChannel | null
        : null;

      // Ensure valid dates
      if (!activeBan.created_at || !activeBan.expires_at) return;

      const durationMs = new Date(activeBan.expires_at).getTime() - new Date(activeBan.created_at).getTime();
      const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));

      // Send messages
      const embed = embedTemplate()
        .setColor(Colors.Green)
        .setDescription(`${user.username} (${activeBan.target_discord_id}) has been unbanned after ${days} days`);

      if (modThread) await modThread.send({ embeds: [embed] });
      if (modlog) await modlog.send({ embeds: [embed] });
    } catch {
      log.error(F, `Failed to remove temporary ban on ${activeBan.target_discord_id} in ${targetGuild?.name}. Likely already unbanned.`);
    } finally {
      // Reset expires_at to null
      await db.user_actions.update({
        where: { id: activeBan.id },
        data: { expires_at: null },
      });
    }
  }));
}

async function monthlySessionStats() {
  const now = new Date();
  // Get the last day of current month (handles 28, 29, 30, or 31 days automatically)
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();

  // Check if we're on the last day of the month
  if (currentDay === lastDayOfMonth) {
    const stats = await getTripSitStatistics('session');
    const embed = embedTemplate()
      .setTitle('TripSit Session Stats')
      .setDescription(stats);

    // Get the channel and send the embed
    const channel = discordClient.channels.cache.get(env.CHANNEL_HELPERLOUNGE) as TextChannel;
    if (channel && channel.guildId === env.DISCORD_GUILD_ID && channel.isTextBased()) {
      await channel.send({ embeds: [embed] });
      log.info(F, 'Sent TripSit Session Stats in Helper Lounge!');
    }
  }
}

async function checkBirthdays() {
  try {
    // Get today's date in MM-DD format for comparison
    const today = new Date();
    const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
    const todayDay = String(today.getDate()).padStart(2, '0');
    const todayMMDD = `${todayMonth}-${todayDay}`;

    // Find users whose birthday is today
    // Assuming birthday is stored as a Date field, we extract month and day
    const birthdayUsers = await db.users.findMany({
      where: {
        birthday: {
          not: null,
        },
      },
    });

    // Filter users whose birthday is today
    const todaysBirthdayUsers = birthdayUsers.filter((user: typeof birthdayUsers[0]) => {
      if (!user.birthday) return false;

      const birthdayDate = new Date(user.birthday);
      const birthdayMonth = String(birthdayDate.getMonth() + 1).padStart(2, '0');
      const birthdayDay = String(birthdayDate.getDate()).padStart(2, '0');
      const birthdayMMDD = `${birthdayMonth}-${birthdayDay}`;

      return birthdayMMDD === todayMMDD;
    });

    // Send birthday messages to the lounge channel
    const birthdayPromises = todaysBirthdayUsers.map(async (user: typeof birthdayUsers[0]) => {
      try {
        if (!user.discord_id) {
          log.debug(F, `User ${user.id} has no discord_id, skipping birthday message`);
          return;
        }

        // Check if user is in the server
        const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
        const member = await guild.members.fetch(user.discord_id).catch(() => null);

        if (!member) {
          log.debug(F, `User ${user.discord_id} is not in the server, skipping birthday message`);
          return;
        }

        // Send message to VIP lounge channel
        const vipLounge = await discordClient.channels.fetch(env.CHANNEL_VIPLOUNGE) as TextChannel;
        await vipLounge.send(`Happy Birthday, <@${user.discord_id}>! 🎉`);
        log.info(F, `Birthday message sent for user: ${user.discord_id}`);
      } catch (messageError) {
        log.error(F, `Failed to send birthday message for user ${user.id}: ${messageError}`);
      }
    });

    await Promise.all(birthdayPromises);

    log.info(F, `Birthday check completed. Found ${todaysBirthdayUsers.length} birthday(s) today.`);
  } catch (error) {
    log.error(F, `Error in checkBirthdays function: ${error}`);
    throw error;
  }
}

async function checkEvery(
  callback: () => Promise<void>,
  interval: number,
) {
  setTimeout(
    async () => {
      await callback();
      checkEvery(callback, interval);
    },
    interval,
  );
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
    // { callback: checkStats, interval: env.NODE_ENV === 'production' ? minutes5 : seconds5 },
    { callback: checkMoodle, interval: env.NODE_ENV === 'production' ? seconds60 : seconds5 },
    // { callback: checkLpm, interval: env.NODE_ENV === 'production' ? seconds10 : seconds5 },
    { callback: updateDb, interval: env.NODE_ENV === 'production' ? hours24 : hours48 },
    // { callback: pruneInactiveHelpers, interval: env.NODE_ENV === 'production' ? hours48 : seconds60 },
    { callback: undoExpiredBans, interval: env.NODE_ENV === 'production' ? hours24 / 2 : seconds10 },
    { callback: monthlySessionStats, interval: env.NODE_ENV === 'production' ? hours24 : hours24 / 3 }, // 8 hours on dev
    { callback: checkBirthdays, interval: env.NODE_ENV === 'production' ? hours24 : hours24 / 3 }, // 8 hours on dev
    {
      callback: async () => {
        await purgeInactiveUsers();
        await pruneModerationActions();
        await pruneCommandParameters();
      },
      interval: env.NODE_ENV === 'production' ? hours24 : hours48,
    },
  ];

  timers.forEach(timer => {
    checkEvery(timer.callback, timer.interval);
  });
}
