/* eslint-disable max-len */
/* eslint-disable max-len */
import {
  ActivityType,
  CategoryChannel,
  ChannelType,
  Colors,
  Guild,
  GuildMember,
  PermissionResolvable,
  TextChannel,
  ThreadChannel,
} from 'discord.js';
import Parser from 'rss-parser';
import { DateTime } from 'luxon';
import axios from 'axios';
import { stripIndents } from 'common-tags';
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
  db,
  database,
  rssGet,
  rssSet,
} from './knex';
import {
  TicketStatus, UserTickets, TicketType, DiscordGuilds, ExperienceCategory, ExperienceType,
} from '../@types/database.d';
import { checkChannelPermissions } from '../../discord/utils/checkPermissions';
import { embedTemplate } from '../../discord/utils/embedTemplate';
import { experience } from './experience';
import { profile } from '../commands/g.learn';

const F = f(__filename);

const lastReminder = {} as {
  [key: string]: DateTime;
};

const newRecordString = '🎈🎉🎊 New Record 🎊🎉🎈';

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

// const intervalP = env.NODE_ENV === 'production' ? 1000 * 30 : 1000 * 1;

export default runTimer;

async function checkReminders() { // eslint-disable-line @typescript-eslint/no-unused-vars
  // log.debug(F, 'Checking reminders...');
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
          if (userData?.discord_id) {
            const user = await global.discordClient.users.fetch(userData.discord_id);
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

async function checkTickets() { // eslint-disable-line @typescript-eslint/no-unused-vars
  // log.debug(F, 'Checking tickets...');
  // Process tickets
  const ticketData = await ticketGet() as UserTickets[];
  // Loop through each ticket
  if (ticketData.length > 0) {
    ticketData.forEach(async ticket => {
      // const archiveDate = DateTime.fromJSDate(ticket.archived_at);
      // const deleteDate = DateTime.fromJSDate(ticket.deleted_at);
      // log.debug(F, `Ticket: ${ticket.id} archives on ${archiveDate.toLocaleString(DateTime.DATETIME_FULL)} deletes on ${deleteDate.toLocaleString(DateTime.DATETIME_FULL)}`);
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
        updatedTicket.deleted_at = env.NODE_ENV === 'production'
          ? DateTime.local().plus({ days: 7 }).toJSDate()
          : DateTime.local().plus({ minutes: 1 }).toJSDate();
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
            const thread = await global.discordClient.channels.fetch(ticket.thread_id) as ThreadChannel;
            await thread.setArchived(true);
            log.debug(F, `Archived thread ${thread.name}`);
          } catch (err) {
            // Thread was likely manually deleted
          }
        }

        // Restore roles on the user
        const userData = await getUser(null, null, ticket.user_id);
        if (userData.discord_id) {
          const discordUser = await discordClient.users.fetch(userData.discord_id);
          if (discordUser) {
            let threadChannel = {} as ThreadChannel;
            try {
              threadChannel = await discordClient.channels.fetch(ticket.thread_id) as ThreadChannel;
              const guild = await discordClient.guilds.fetch(threadChannel.guild.id);
              const guildData = await getGuild(guild.id);
              const searchResults = await guild.members.search({ query: discordUser.username });
              // log.debug(F, `searchResults: ${JSON.stringify(searchResults)}`);
              if (searchResults.size > 0) {
                const member = await guild.members.fetch(discordUser);
                if (member) {
                  const myMember = guild.members.me as GuildMember;
                  const myRole = myMember.roles.highest;

                  // Restore the old roles
                  if (userData.roles) {
                    // log.debug(F, `Restoring ${userData.discord_id}'s roles: ${userData.roles}`);
                    const roles = userData.roles.split(',');
                    // for (const role of roles) {
                    roles.forEach(async role => {
                      const roleObj = await guild.roles.fetch(role);
                      if (roleObj && roleObj.name !== '@everyone'
                          && roleObj.id !== guildData.role_needshelp
                          && roleObj.comparePositionTo(myRole) < 0
                          && member.guild.id !== env.DISCORD_BL_ID
                          // && member.guild.id !== env.DISCORD_GUILD_ID // Patch for BL not to re-add roles
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
                  }
                }
              }
            } catch (err) {
              // Thread was likely manually deleted
            }
          }
        }
      }

      // Check if the ticket is ready to be deleted
      if (ticket.deleted_at
        && ticket.status === 'ARCHIVED'
        && DateTime.fromJSDate(ticket.deleted_at) <= DateTime.local()
      ) {
        log.debug(F, `Deleting ticket ${ticket.id}...`);
        // Delete the ticket
        await ticketDel(ticket.id);

        // Delete the thread on discord
        if (ticket.thread_id) {
          try {
            const thread = await global.discordClient.channels.fetch(ticket.thread_id) as ThreadChannel;
            await thread.delete();
            log.debug(F, `Thread ${ticket.thread_id} was deleted`);
          } catch (err) {
            // Thread was likely manually deleted
            log.debug(F, `Thread ${ticket.thread_id} was likely manually deleted`);
          }
        }

        const updatedTicket = ticket;
        updatedTicket.status = 'DELETED' as TicketStatus;
        await ticketUpdate(updatedTicket);
      }
    });
  }

  // As a failsafe, loop through the Tripsit room and delete any threads that are older than 7 days and are archived
  const guildDataList = env.POSTGRES_DB_URL
    ? await db<DiscordGuilds>('discord_guilds').select('*')
    : [];
  if (guildDataList.length > 0) {
    guildDataList.forEach(async guildData => {
      // log.debug(F, `Checking guild  room for old threads...`);
      let guild = {} as Guild;
      try {
        guild = await discordClient.guilds.fetch(guildData.id);
      } catch (err) {
        // Guild was likely deleted
        return;
      }
      if (guild && guildData.channel_tripsit) {
        // log.debug(F, 'Checking Tripsit room for old threads...');
        // log.debug(F, `Tripsit room: ${guildData.channel_tripsit}`);
        let channel = {} as TextChannel;
        try {
          channel = await guild.channels.fetch(guildData.channel_tripsit) as TextChannel;
        } catch (err) {
          // Channel was likely deleted, remove it from the db
          const newGuildData = guildData;
          newGuildData.channel_tripsit = null;

          await database.guilds.set(newGuildData);
          return;
        }
        // log.debug(F, `Tripsit room: ${channel.name} (${channel.id})`);
        const tripsitPerms = await checkChannelPermissions(channel, [
          'ViewChannel' as PermissionResolvable,
          'ManageThreads' as PermissionResolvable,
        ]);

        if (!tripsitPerms.hasPermission) {
          // Check if you have reminder the guild owner in the last 24 hours
          const lastRemdinerSent = lastReminder[guild.id];
          if (!lastRemdinerSent || lastRemdinerSent < DateTime.local().minus({ hours: 24 })) {
            log.debug(F, `Sending reminder to ${(await guild.fetchOwner()).user.username}...`);
            // const guildOwner = await channel.guild.fetchOwner();
            // await guildOwner.send({
            //   content: `I am trying to prune threads in ${channel} but
            //  I don't have the ${tripsitPerms.permission} permission.`, // eslint-disable-line max-len
            // });
            const botOwner = await discordClient.users.fetch(env.DISCORD_OWNER_ID);
            await botOwner.send({
              content: `I am trying to prune threads in ${channel} of ${channel.guild.name} but I don't have the ${tripsitPerms.permission} permission.`, // eslint-disable-line max-len
            });
            lastReminder[guild.id] = DateTime.local();
          }
          return;
        }

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

            // Get the last message sent int he thread
            const messages = await thread.messages.fetch({ limit: 1 });
            const lastMessage = messages.first();

            // Determine if this message was sent longer than a week ago
            if (lastMessage && DateTime.fromJSDate(lastMessage.createdAt) >= DateTime.local().minus({ days: 7 })) {
              thread.delete();
              log.debug(F, `Deleted thread ${thread.name} in ${channel.name} because the last message was sent over a week ago`);
            }
          } catch (err) {
            // Thread was likely manually deleted
          }
        });
      }
    });
  }
}

async function checkMindsets() { // eslint-disable-line @typescript-eslint/no-unused-vars
  // log.debug(F, 'Checking mindsets...');
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
        const user = await global.discordClient.users.fetch(mindsetUser.discord_id);
        const guild = await global.discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
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

async function checkRss() { // eslint-disable-line @typescript-eslint/no-unused-vars
  // log.debug(F, 'Checking rss...');
  const parser: Parser<RedditFeed, RedditItem> = new Parser();
  (async () => {
    const guild = await global.discordClient.guilds.fetch(env.DISCORD_GUILD_ID);

    // log.debug(F, `guild: ${JSON.stringify(guild, null, 2)}\n`);
    const rssData = await rssGet(guild.id);
    // log.debug(F, `rssData: ${JSON.stringify(rssData, null, 2)}\n`);

    rssData.forEach(async feed => {
      let mostRecentPost = {} as RedditItem & Parser.Item;
      try {
        [mostRecentPost] = (await parser.parseURL(feed.url)).items;
      } catch (error) {
        // log.debug(F, `Error parsing ${feed.url}: ${error}`);
        return;
      }
      // log.debug(F, `mostRecentPost: ${JSON.stringify(mostRecentPost, null, 2)}`);

      if (feed.last_post_id === mostRecentPost.id) return;

      // log.debug(F, `New post: ${JSON.stringify(mostRecentPost, null, 2)}`);

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

      // log.debug(F, `submittedBy: ${submittedBy}`);

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
      } catch (error) {
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

      await rssSet(newFeed);
    });
  })();
}

async function callUptime() { // eslint-disable-line @typescript-eslint/no-unused-vars
  // log.debug(F, 'Calling uptime...');
  if (env.NODE_ENV !== 'production') return;
  axios.get(`https://uptime.tripsit.me/api/push/UyL8LkDKtG?status=up&msg=OK?ping=${discordClient.ws.ping}`).catch(e => {
    log.debug(F, `Error when calling uptime monitor! ${e}`);
  });
}

async function checkVoice() {
  // This function will run every minute and check every voice channel on the guild
  // If someone satisfies the following conditions, they will be awarded voice exp
  // 1. They are not a bot
  // 2. They are in a voice channel
  // 3. They have been in the voice channel for at least 5 minutes
  // 4. They have not been awarded voice exp in the last 5 minutes
  // 5. Are not AFK
  // 6. Are not deafened
  // 7. Are not muted
  // 8. Are not streaming
  // 9. Are not in a stage channel
  // 10. With another human in the channel
  // 11. Dot not have the NeedsHelp role

  // The type of voice exp is determined by the category the voice channel is in
  // GENERAL = Campground and Backstage
  // TRIPSITTER = HR
  // TEAM = Team
  // DEVELOPER = Development

  // The amount of of voice gained is ((A random value between 15 and 25) / 2)
  (async () => {
    // Define each category type and the category channel id
    const categoryDefs = [
      { category: 'GENERAL' as ExperienceCategory, id: env.CATEGORY_CAMPGROUND },
      { category: 'GENERAL' as ExperienceCategory, id: env.CATEGORY_BACKSTAGE },
      { category: 'TEAM' as ExperienceCategory, id: env.CATEGORY_TEAMTRIPSIT },
      { category: 'TRIPSITTER' as ExperienceCategory, id: env.CATEGORY_HARMREDUCTIONCENTRE },
      { category: 'DEVELOPER' as ExperienceCategory, id: env.CATEGORY_DEVELOPMENT },
    ];

    // For each of the above types, check each voice channel in the category
    categoryDefs.forEach(async categoryDef => {
      // log.debug(F, `Checking ${categoryDef.category} voice channels...`);
      const category = await discordClient.channels.fetch(categoryDef.id) as CategoryChannel;
      category.children.cache.forEach(async channel => {
        // log.debug(F, `Checking ${channel.name}...`);
        if (channel.type === ChannelType.GuildVoice
        && channel.id !== env.CHANNEL_CAMPFIRE
        /* && channel.members.size > 1 */) { // For testing
          // Check to see if the people in the channel meet the right requirements
          const humansInChat = channel.members.filter(member => (
            !(member.user.bot
            || member.voice.selfDeaf
            || member.voice.serverDeaf
            || member.voice.selfMute
            || member.voice.serverMute
            || member.voice.streaming
            || member.voice.suppress
            || member.roles.cache.has(env.ROLE_NEEDS_HELP)
            )
          ));
          if ((env.NODE_ENV === 'production' && humansInChat && humansInChat.size > 1)
          || (env.NODE_ENV !== 'production' && humansInChat && humansInChat.size > 0)) {
            // log.debug(F, `There are ${humansInChat.size} humans in ${channel.name}`);
            // For each human in chat, check if they have been awarded voice exp in the last 5 minutes
            // If they have not, award them voice exp
            humansInChat.forEach(async member => {
              await experience(member, categoryDef.category, 'VOICE' as ExperienceType, channel);
            });
          }
        }
      });
    });
  })();
}

async function changeStatus() {
  discordClient.user?.setActivity('with a test kit', { type: ActivityType.Playing });
  // let state = 0;
  // let presence = activities[state];
  // log.debug(F, `Setting presence to ${presence.message}`);
  // log.debug(F, `Setting presence type to ${presence.type}`);
  // @ts-ignore
  // discordClient.user?.setActivity(presence.message, {type: presence.type});
  // setInterval(() => {
  //   state = (state + 1) % activities.length;
  //   presence = activities[state];
  //   // log.debug(F, `Setting activity to ${presence.type} ${presence.message}`);
  //   // @ts-ignore
  //   discordClient.user?.setActivity(presence.message, {type: presence.type});
  // }, delay);
}

async function checkStats() {
  // log.debug(F, 'Checking stats...');
  // Determine how many people are in the tripsit guild
  const tripsitGuild = await global.discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
  if (!tripsitGuild) return;

  const { memberCount } = tripsitGuild;

  // Total member count
  // log.debug(F, `memberCount: ${memberCount}`);
  const channelTotal = await tripsitGuild.channels.fetch(env.CHANNEL_STATS_TOTAL);
  // log.debug(F, `channelTotal: ${channelTotal?.name}`);
  if (channelTotal) {
    const name = `Total: ${memberCount}`;
    if (channelTotal.name !== name) {
      // log.debug(F, `Updating total members to ${memberCount}!`);
      const perms = await checkChannelPermissions(channelTotal, [
        'ViewChannel' as PermissionResolvable,
        'Connect' as PermissionResolvable,
        'ManageChannels' as PermissionResolvable,
      ]);

      if (!perms.hasPermission) {
        log.error(F, `I do not have the '${perms.permission}' permission in ${channelTotal.name}!`);
        return;
      }
      channelTotal.setName(name);
      // log.debug(F, `Updated total members to ${memberCount}!`);
      // Check if the total members is divisible by 100
      if (memberCount % 100 === 0) {
        const embed = embedTemplate()
          .setTitle(newRecordString)
          .setDescription(`We have reached ${memberCount} total members!`);
        const channelLounge = await tripsitGuild.channels.fetch(env.CHANNEL_LOUNGE) as TextChannel;
        if (channelLounge) {
          await channelLounge.send({ embeds: [embed] });
        }
        const channelTeamtripsit = await tripsitGuild.channels.fetch(env.CHANNEL_TEAMTRIPSIT) as TextChannel;
        if (channelTeamtripsit) {
          await channelTeamtripsit.send({ embeds: [embed] });
        }
      }
    }
  } else {
    log.error(F, 'Could not find channel total!');
  }

  // Determine how many people have the Verified role
  await tripsitGuild.members.fetch();
  const roleVerified = await tripsitGuild.roles.fetch(env.ROLE_VERIFIED);
  // log.debug(F, `roleVerified: ${roleVerified?.name} (${roleVerified?.id})`);

  if (roleVerified) {
    const { members } = roleVerified;
    // log.debug(F, `Role verified members: ${members.size}`);
    const channelVerified = await tripsitGuild.channels.fetch(env.CHANNEL_STATS_VERIFIED);
    if (channelVerified) {
      // log.debug(F, `${members.size} / ${memberCount} = ${(members.size / memberCount) * 10000}`);
      const percentVerified = Math.round(((members.size / memberCount) * 10000)) / 100;
      // log.debug(F, `percentVerified: ${percentVerified}%`);
      const name = `Verified: ${members.size} (${percentVerified}%)`;
      // log.debug(F, `channelVerified: ${channelVerified.name}`);
      // log.debug(F, `name: ${name}`);
      if (channelVerified.name !== name) {
        // log.debug(F, `Updating verified members to ${members.size}!`);
        const perms = await checkChannelPermissions(channelVerified, [
          'ViewChannel' as PermissionResolvable,
          'Connect' as PermissionResolvable,
          'ManageChannels' as PermissionResolvable,
        ]);
        if (!perms.hasPermission) {
          log.error(F, `I do not have the '${perms.permission}' permission in ${channelVerified.name}!`);
          return;
        }
        // log.debug(F, `perms: ${JSON.stringify(perms)}`);
        await channelVerified.setName(name);
        // log.debug(F, `Updated verified members to ${members.size}!`);
        if (members.size % 100 === 0) {
          const embed = embedTemplate()
            .setTitle(newRecordString)
            .setDescription(`We have reached ${members.size} verified members!`);
          const channelLounge = await tripsitGuild.channels.fetch(env.CHANNEL_LOUNGE) as TextChannel;
          if (channelLounge) {
            const channelPerms = await checkChannelPermissions(channelLounge, [
              'SendMessages' as PermissionResolvable,
            ]);
            if (!channelPerms.hasPermission) {
              log.error(F, `I do not have the '${channelPerms.permission}' permission in ${channelLounge.name}!`);
              return;
            }
            await channelLounge.send({ embeds: [embed] });
          }
          const channelTeamtripsit = await tripsitGuild.channels.fetch(env.CHANNEL_TEAMTRIPSIT) as TextChannel;
          if (channelTeamtripsit) {
            const channelPerms = await checkChannelPermissions(channelTeamtripsit, [
              'SendMessages' as PermissionResolvable,
            ]);
            if (!channelPerms.hasPermission) {
              log.error(F, `I do not have the '${channelPerms.permission}' permission in ${channelLounge.name}!`);
              return;
            }
            await channelTeamtripsit.send({ embeds: [embed] });
          }
        }
      }
    }
  } else {
    log.error(F, 'Could not find role verified!');
  }

  // Determine the number of users currently online
  // const onlineCount = tripsitGuild.members.cache.filter(
  //   member => member.presence?.status !== undefined && member.presence?.status !== 'offline',
  // ).size;
  // const channelOnline = await tripsitGuild.channels.fetch(env.CHANNEL_STATS_ONLINE);
  // if (channelOnline) {
  //   // log.debug(F, `onlineCount: ${onlineCount}`);
  //   const name = `Online: ${onlineCount}`;
  //   if (channelOnline.name !== name) {
  //     const perms = await checkChannelPermissions(channelOnline, [
  //       'ViewChannel' as PermissionResolvable,
  //       'Connect' as PermissionResolvable,
  //       'ManageChannels' as PermissionResolvable,
  //     ]);
  //     // log.debug(F, `perms: ${JSON.stringify(perms)}`);
  //     if (!perms.hasPermission) {
  //       log.error(F, `I do not have the '${perms.permission}' permission in ${channelOnline.name}!`);
  //       return;
  //     }
  //     // log.debug(F, `Updating online members to ${name}!`);
  //     channelOnline.setName(name);
  //   }
  // }

  // // Update the database's max_online_members if it's higher than the current value
  // // log.debug(F, `Getting guild data`);
  // const guildData = await getGuild(env.DISCORD_GUILD_ID);
  // if (guildData) {
  //   // log.debug(F, `Updating guild data (max_online_members: ${guildData.max_online_members})`);
  //   const newGuild = guildData;
  //   if (guildData.max_online_members) {
  //     // log.debug(F, `guildData.max_online_members: ${guildData.max_online_members}`);
  //     let maxCount = guildData.max_online_members;
  //     if (onlineCount > maxCount) {
  //       // log.debug(F, `onlineCount (${onlineCount}) > maxCount (${maxCount})`);
  //       maxCount = onlineCount;
  //       newGuild.max_online_members = maxCount;
  //       await guildUpdate(newGuild);
  //       // log.debug(F, 'Test0');
  //       const embed = embedTemplate()
  //         .setTitle(newRecordString)
  //         .setDescription(`We have reached ${maxCount} online members!`);

  //       const channelLounge = await tripsitGuild.channels.fetch(env.CHANNEL_LOUNGE) as TextChannel;
  //       if (channelLounge) {
  //         // log.debug(F, `channelLounge: ${channelLounge.name}`);
  //         const channelPerms = await checkChannelPermissions(channelLounge, [
  //           'SendMessages' as PermissionResolvable,
  //         ]);
  //         if (!channelPerms.hasPermission) {
  //           log.error(F, `I do not have the '${channelPerms.permission}' permission in ${channelLounge.name}!`);
  //           return;
  //         }
  //         await channelLounge.send({ embeds: [embed] });
  //         // log.debug(F, `Sent new record message to ${channelLounge.name}!`);
  //       }
  //       // log.debug(F, 'TestA');
  //       const channelTeamtripsit = await tripsitGuild.channels.fetch(env.CHANNEL_TEAMTRIPSIT) as TextChannel;
  //       if (channelTeamtripsit) {
  //         // log.debug(F, `channelTeamtripsit: ${channelTeamtripsit.name}`);
  //         const channelPerms = await checkChannelPermissions(channelTeamtripsit, [
  //           'SendMessages' as PermissionResolvable,
  //         ]);
  //         if (!channelPerms.hasPermission) {
  //           log.error(F, `I do not have the '${channelPerms.permission}' permission in ${channelTeamtripsit.name}!`);
  //           return;
  //         }
  //         await channelTeamtripsit.send({ embeds: [embed] });
  //         // log.debug(F, `Sent new record message to ${channelTeamtripsit.name}!`);
  //       }
  //       // log.debug(F, 'TestB');

  //       const channelMax = await tripsitGuild.channels.fetch(env.CHANNEL_STATS_MAX);
  //       if (channelMax) {
  //         // log.debug(F, `channelMax: ${channelMax.name}`);
  //         const currentCount = parseInt(channelMax.name.split(': ')[1], 10);
  //         if (maxCount > currentCount) {
  //           const name = `Max: ${maxCount}`;
  //           if (channelMax.name !== name) {
  //             const channelPerms = await checkChannelPermissions(channelMax, [
  //               'ViewChannel' as PermissionResolvable,
  //               'Connect' as PermissionResolvable,
  //               'ManageChannels' as PermissionResolvable,
  //             ]);
  //             if (!channelPerms.hasPermission) {
  //               log.error(F, `I do not have the '${channelPerms.permission}' permission in ${channelMax.name}!`);
  //               return;
  //             }
  //             channelMax.setName(`Max: ${maxCount}`);
  //           }
  //           // log.debug(F, `Updated max online members to ${maxCount}!`);
  //         } else {
  //           // log.debug(F, `Max members is already ${maxCount}!`);
  //         }
  //       }
  //       // log.debug(F, 'TestC');
  //     }
  //   } else {
  //     // log.debug(F, `Updating guild data (max_online_members: ${onlineCount})`);
  //     newGuild.max_online_members = onlineCount;
  //     await guildUpdate(newGuild);
  //   }
  // }
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

  // log.debug(F, 'Checking Moodle...');

  const userDataList = env.POSTGRES_DB_URL
    ? await database.users.getMoodleUsers()
    : [];
  // log.debug(F, `userDataList: ${JSON.stringify(userDataList, null, 2)}`);

  const courseRoleMap = {
    'Intro to Tripsitting': env.ROLE_TS100,
  };

  const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
  const channelHowToVolunteer = await guild.channels.fetch(env.CHANNEL_HOW_TO_VOLUNTEER);
  const channelContent = await guild.channels.fetch(env.CHANNEL_CONTENT);

  userDataList.forEach(async user => {
    const moodleProfile = await profile(user.discord_id as string);
    const member = await guild.members.fetch(user.discord_id as string);
    // log.debug(F, `Checking ${member.user.username}...`);
    if (moodleProfile.completedCourses.length > 0) {
      moodleProfile.completedCourses.forEach(async course => {
        // log.debug(F, `${member.user.username} completed ${course}...`);
        const roleId = courseRoleMap[course as keyof typeof courseRoleMap];
        const role = await guild.roles.fetch(roleId);

        if (role) {
          // log.debug(F, `Found role: ${JSON.stringify(role, null, 2)}`);
          // check if the member already has the role
          if (member.roles.cache.has(role.id)) {
            // log.debug(F, `${member.user.username} already has the ${role.name} role`);
            return;
          }

          if (channelContent) {
            // log.debug(F, `Sending message to ${channelContent.name}`);
            (channelContent as TextChannel).send({
              embeds: [
                embedTemplate()
                  .setColor(Colors.Green)
                  .setDescription(`Congratulate ${member} on completing "${course}"!`),
              ],
            },
              ); // eslint-disable-line
          }

          member.roles.add(role);
          log.info(F, `Gave ${member.user.username} the ${role.name} role`);

          // eslint-disable max-len
          member.user.send({
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
                Anyone can [verify the code on your certificate](https://learn.pantheon.tripsit.me/mod/customcert/verify_certificate.php) to see you completed the course.

                Finally, if you have any feedback on the course, please let us know in the ${channelContent} channel, or on the forum in the course!

                Thanks so much for taking the time to learn with us, we hope you enjoyed it!
                `),
            ],
          });
          // log.debug(F, `Sent ${member.user.username} a message!`);
        }
      });
    } else {
      // log.debug(F, 'No completed courses found');
    }
  });
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
  // log.debug(F, `Database URL: ${env.POSTGRES_DB_URL}`);
  const seconds5 = 1000 * 5;
  const seconds10 = 1000 * 10;
  const seconds30 = 1000 * 30;
  const seconds60 = 1000 * 60;
  const minutes5 = 1000 * 60 * 5;
  const hours24 = 1000 * 60 * 60 * 24;

  const timers = [
    { callback: checkReminders, interval: env.NODE_ENV === 'production' ? seconds10 : seconds5 },
    { callback: checkTickets, interval: env.NODE_ENV === 'production' ? seconds60 : seconds10 },
    { callback: checkMindsets, interval: env.NODE_ENV === 'production' ? seconds60 : seconds5 },
    { callback: callUptime, interval: env.NODE_ENV === 'production' ? seconds60 : seconds5 },
    { callback: checkRss, interval: env.NODE_ENV === 'production' ? seconds30 : seconds5 },
    { callback: checkVoice, interval: env.NODE_ENV === 'production' ? seconds60 : seconds5 },
    { callback: changeStatus, interval: env.NODE_ENV === 'production' ? hours24 : seconds5 },
    { callback: checkStats, interval: env.NODE_ENV === 'production' ? minutes5 : seconds5 },
    { callback: checkMoodle, interval: env.NODE_ENV === 'production' ? seconds60 : seconds10 },
    // { callback: checkLpm, interval: env.NODE_ENV === 'production' ? seconds10 : seconds5 },
  ];

  timers.forEach(timer => {
    checkEvery(timer.callback, timer.interval);
  });
}
