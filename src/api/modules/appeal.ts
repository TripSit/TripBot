import { Request, Response } from 'express';
import {
  ActionRowBuilder,
  AuditLogEvent,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  Guild,
  GuildBan,
  GuildMember,
  PermissionsBitField,
  TextChannel,
  ThreadChannel,
  time,
} from 'discord.js';
// import { stripIndents } from 'common-tags';
import { stripIndents } from 'common-tags';
import { DateTime, Interval } from 'luxon';
import { database } from '../../global/utils/knex';
import { UserActions } from '../../global/@types/database';
// import { database } from '../../global/utils/knex';

const F = f(__filename);

// Will run when there are any incoming POST requests to https://localhost:(port)/user.
// Note that a POST request is different from a GET request
// so this won't exactly work when you actually visit https://localhost:(port)/user

async function getModThread(
  guild: Guild,
  userId: string,
  username: string,
):Promise<ThreadChannel<boolean>> {
  // Get the user data from the database
  const userData = await database.users.get(userId, null, null);
  // log.debug(F, `userData: ${JSON.stringify(userData, null, 2)}`);
  // Get/create the mod thread for the user
  let modThread = {} as ThreadChannel;
  if (userData.mod_thread_id) {
    log.debug(F, `Mod thread id exists: ${userData.mod_thread_id}`);
    try {
      modThread = await guild.channels.fetch(userData.mod_thread_id) as ThreadChannel;
      log.debug(F, 'Got the mod thread from discord!');
    } catch (err) {
      modThread = {} as ThreadChannel;
      log.debug(F, 'Mod thread not found on discord, it was likely deleted!');
    }
  }
  if (!modThread.id) {
    // Create a new thread in the mod channel
    const modChan = await discordClient.channels.fetch(env.CHANNEL_MODERATORS) as TextChannel;
    modThread = await modChan.threads.create({
      name: `${username}`,
      autoArchiveDuration: 60,
    });
    log.debug(F, 'created mod thread');

    userData.mod_thread_id = modThread.id;
    await database.users.set(userData);
    log.debug(F, 'saved mod thread id to user');
  }
  return modThread;
}

export default async function appeal(
  req: Request,
  res: Response,
) {
  // log.info(F, `Received request: ${JSON.stringify(req.method)}, ${JSON.stringify(req.url)}`);
  // log.info(F, `Request headers: ${JSON.stringify(req.headers, null, 2)}`);
  // log.debug(F, `Request body: ${JSON.stringify(req.body, null, 2)}`);
  const body = req.body as {
    guild: string;
    userId: string;
    username: string;
    discriminator: string;
    avatar: string;
    reason: string;
    solution: string;
    future: string;
    extra: string;
    email: string;
  };

  // Get guild from DB
  const guildData = await database.guilds.get(body.guild);
  if (!guildData) {
    log.error(F, `Could not find guild with id ${body.guild}`);
    res.status(500).send(`Could not find guild with id ${body.guild}`);
    return;
  }
  if (!guildData.partner) {
    log.error(F, `Guild with id ${body.guild} is not a partner`);
    res.status(500).send(`Guild with id ${body.guild} is not a partner`);
    return;
  }
  // log.debug(F, `guildData: ${JSON.stringify(guildData, null, 2)}`);

  // Get guild from discord
  let guild = {} as Guild;
  try {
    guild = await discordClient.guilds.fetch(body.guild);
  } catch (e) {
    log.error(F, `Could not find guild with id ${body.guild}`);
    res.status(500).send(`Could not find guild with id ${body.guild}`);
    return;
  }
  // log.debug(F, `guild: ${JSON.stringify(guild, null, 2)}`);

  // Get the moderation channel from discord
  const channelModerators = await guild.channels.fetch(env.CHANNEL_MODERATORS);
  if (!channelModerators) {
    log.error(F, `Could not find channel with id ${env.CHANNEL_MODERATORS}`);
    res.status(500).send(`Could not find channel with id ${env.CHANNEL_MODERATORS}`);
    return;
  }
  if (channelModerators.type !== ChannelType.GuildText) {
    log.error(F, `Channel with id ${env.CHANNEL_MODERATORS} is not a text channel`);
    res.status(500).send(`Channel with id ${env.CHANNEL_MODERATORS} is not a text channel`);
    return;
  }
  // log.debug(F, `channelModerators: ${JSON.stringify(channelModerators, null, 2)}`);

  // Get the ban information from discord
  let banInfo = {} as GuildBan;
  try {
    banInfo = await guild.bans.fetch(body.userId);
  } catch (err) {
    res.status(418).send(`You are not banned from ${guild.name}`);
    return;
  }
  // log.debug(F, `banInfo: ${JSON.stringify(banInfo, null, 2)}`);

  // Get the appeal data from the database
  const [appealData] = await database.appeals.get(body.userId, body.guild);
  log.debug(F, `appealData: ${JSON.stringify(appealData, null, 2)}`);

  // If an appeal exists and was created in the last 3 months, return the status of the appeal

  if (appealData) {
    const createdDate = DateTime.fromJSDate(appealData.created_at);
    const lastThreeMonthsInterval = Interval.fromDateTimes(
      createdDate.minus({ months: 3 }),
      createdDate,
    );
    if (lastThreeMonthsInterval.contains(DateTime.now())) {
      if (appealData.status === 'OPEN') {
        // If the appeal is still open, and the appeal was created over a week ago, we send a reminder to the guild
        let lastWeekInterval = {} as Interval;
        if (appealData.reminded_at) {
          const remindedDate = DateTime.fromJSDate(appealData.reminded_at);
          lastWeekInterval = Interval.fromDateTimes(
            remindedDate.minus({ weeks: 1 }),
            remindedDate,
          );
        } else {
          lastWeekInterval = Interval.fromDateTimes(
            createdDate.minus({ weeks: 1 }),
            createdDate,
          );
        }

        if (lastWeekInterval.contains(DateTime.now())) {
          // Send a reminder to the guild
          const modThread = await getModThread(guild, body.userId, body.username);
          await modThread.send('hey fuckos, check my appeal');
          res.status(418).send('Thank you for asking, your appeal is still undecided, and it\'s been over a week so I sent a reminder to the guild.');
          return;
        }

        res.status(418).send('Thank you for asking, you have an existing appeal that is still open. Please be patient.');
        return;
      }
      if (appealData.status === 'ACCEPTED') {
        res.status(418).send('You have an existing appeal that was accepted');
        return;
      }
      if (appealData.status === 'DENIED') {
        res.status(418).send('You have an existing appeal that was denied');
        return;
      }
    }
  }

  const modThread = await getModThread(guild, body.userId, body.username);

  // Get a date that is 24 hours in the future
  const expiresAtDate = new Date();
  expiresAtDate.setDate(expiresAtDate.getDate() + 1);

  // Look up the audit logs to see when this user was banned
  const banLogs = await guild.fetchAuditLogs({
    type: AuditLogEvent.MemberBanAdd,
  });
  // log.debug(F, `banLogs: ${JSON.stringify(banLogs, null, 2)}`);

  // Find the ban log that matches the user id
  const banLog = banLogs.entries.find(entry => entry.target && entry.target.id === body.userId);
  log.debug(F, `banLog: ${JSON.stringify(banLog, null, 2)}`);

  const actorString = banLog?.executor ? `${banLog.executor.username}#${banLog.executor.discriminator}` : 'unknown member';
  const dateString = banLog?.createdAt ? time(banLog.createdAt, 'R') : 'on unknown date';
  const reasonString = banInfo?.reason ? banInfo.reason : 'No reason provided';

  // Construct the message that will be sent to the room
  const roleMod = await guild.roles.fetch(env.ROLE_MODERATOR);
  const post = await modThread.send({
    content: `Hey ${roleMod}, <@${body.userId}> has submitted a new appeal:`,
    embeds: [
      new EmbedBuilder()
        .setTitle(`${body.username}#${body.discriminator} (${body.userId})`)
        .setThumbnail(body.avatar)
        .setDescription(stripIndents`
        Original ban ${dateString} by ${actorString}:
        ${reasonString}
        Please vote and put your thoughts below.
        Actions will unlock ${time(expiresAtDate, 'R')}!
        `)
        .addFields([
          { name: 'Reason', value: body.reason },
          { name: 'Solution', value: body.solution },
          { name: 'Future', value: body.future },
          { name: 'Extra', value: body.extra },
        ]),
    ],
    components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`appealAccept~${body.userId}~${body.email}`)
        .setLabel('Appeal Accepted - Unban!')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`appealReject~${body.userId}~${body.email}`)
        .setLabel('Appeal Rejected - Keep ban!')
        .setStyle(ButtonStyle.Danger),
    )],
  });

  await post.react(emojiGet('ts_thumbup'));
  await post.react(emojiGet('ts_thumbdown'));

  // If the userData has a mod_thread_id, then use that thread, otherwise send a new message to the appeals room
  res.status(200).send('okay');
}

export async function appealAccept(
  interaction:ButtonInteraction,
) {
  if (!interaction.guild) return;
  await interaction.deferReply();
  const [customId, userId, email] = interaction.customId.split('~');
  log.debug(`${F} - appealAccept`, `customId: ${customId}`);
  log.debug(`${F} - appealAccept`, `userId: ${userId}`);
  log.debug(`${F} - appealAccept`, `email: ${email}`);

  // Check if the message was created in the last 24 users, and the user who clicked does not have admin permissions
  if (interaction.createdTimestamp > Date.now() - 86400000
  && !(interaction.member as GuildMember).permissions.has(PermissionsBitField.Flags.Administrator)) {
    await interaction.reply({
      content: `This appeal is too new to accept, it will unlock in ${time(new Date(interaction.createdTimestamp + 86400000), 'R')}.

      If you believe this is an error, please contact an administrator.`,
      ephemeral: true,
    });
    return;
  }

  // Modify the user the database
  const userData = await database.users.get(userId, null, null);
  log.debug(`${F} - appealAccept`, `userData: ${JSON.stringify(userData, null, 2)}`);
  userData.removed_at = null;
  await database.users.set(userData);

  // let banInfo = {} as GuildBan;
  // try {
  //   banInfo = await interaction.guild.bans.fetch(userId);
  // } catch (err) {
  //   await interaction.reply({
  //     content: `This user is no longer banned from ${interaction.guild.name}. Did someone undo it manually?`,
  //     ephemeral: true,
  //   });
  //   return;
  // }

  // Look up the audit logs to see when this user was banned
  const banLogs = await interaction.guild.fetchAuditLogs({
    type: AuditLogEvent.MemberBanAdd,
  });

  // Find the ban log that matches the user id
  const banLog = banLogs.entries.find(entry => entry.target && entry.target.id === userId);
  log.debug(F, `banLog: ${JSON.stringify(banLog, null, 2)}`);

  // Construct an action in case this doesn't exist
  let actionData = {} as UserActions;
  // Check if the user already has a FULL_BAN action in the dictionary
  const banRecords = await database.actions.get(userData.id, 'FULL_BAN');
  // If so, then use that action
  if (banRecords.length > 0) {
    [actionData] = banRecords;
    // Ensure that these fields are updated to unban
    actionData.repealed_at = new Date();
    actionData.repealed_by = interaction.user.id;
    actionData.expires_at = null;
    log.debug(F, `actionData: ${JSON.stringify(actionData, null, 2)}`);
    // Set those fields in the database
    await database.actions.set(actionData);
  }

  // Actually unban the user from the discord
  try {
    await interaction.guild.bans.fetch();
    await interaction.guild.bans.remove(userId, 'Appeal accepted');
  } catch (err) {
    log.error(F, `Error: ${err}`);
  }

  const inviteDict = {
    '960606557622657026': 'https://discord.gg/tripsit',
    '1009038673284714526': 'https://discord.gg/rdrugs-official',
    '867876356304666635': 'https://discord.gg/bluelight',
  };

  // Try to find the user in the bot's cache - this can only happen if the user still shares a guild with the bot
  const user = await discordClient.users.fetch(userId);
  let contactMethod = '' as 'DM' | 'email' | '';
  if (user) {
    // Send them a DM letting them know they've been unbanned
    try {
      await user.send(stripIndents`Congratulations, you've been unbanned from ${interaction.guild.name}!
    
      Be safe, have fun, and please follow the rules!
      
      ${inviteDict[interaction.guild.id as keyof typeof inviteDict]}
      `);
      contactMethod = 'DM';
    } catch (err) {
      // log.error(F, `Error: ${err}`);
    }
  } else {
    // Send them an email letting them know they've been unbanned
    // No idea how to do this yet
    contactMethod = 'email';
  }

  // Send a message to the mod thread letting them know the appeal was accepted
  const contactString = contactMethod !== ''
    ? `I let them know the good news via ${contactMethod}!`
    : 'I was unable to contact them, please do so manually.';

  await interaction.editReply({
    content: stripIndents`User <@${userId}> has been unbanned from ${interaction.guild.name}.
    ${contactString}`,
  });
}

export async function appealReject(
  interaction:ButtonInteraction,
) {
  if (!interaction.guild) return;
  const [customId, userId, email] = interaction.customId.split('~');
  log.debug(`${F} - appealReject`, `customId: ${customId}`);
  log.debug(`${F} - appealReject`, `userId: ${userId}`);
  log.debug(`${F} - appealReject`, `email: ${email}`);

  // Check if the message was created in the last 24 users, and the user who clicked does not have admin permissions
  if (interaction.createdTimestamp > Date.now() - 86400000) {
    await interaction.reply({
      content: `This appeal is too new to accept, it will unlock ${time(new Date(interaction.createdTimestamp + 86400000), 'R')}.
  
        If you believe this is an error, please contact an administrator.`,
      ephemeral: true,
    });
    return;
  }

  // Try to find the user in the bot's cache - this can only happen if the user still shares a guild with the bot
  const user = await discordClient.users.fetch(userId);
  if (user) {
    // Send them a DM letting them know they've been unbanned
    await user.send(stripIndents`I'm sorry to inform you that your appeal to ${interaction.guild.name} has been rejected.`);
  } else {
    // Send them an email letting them know they've been unbanned
    // No idea how to do this yet
  }
}
