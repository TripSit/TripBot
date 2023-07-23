import { Request, Response } from 'express';
import {
  ActionRowBuilder,
  AuditLogEvent,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  Guild,
  GuildBan,
  TextChannel,
  ThreadChannel,
  time,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { DateTime, Interval } from 'luxon';
import { database } from '../../../global/utils/knex';
import { AppealStatus, Appeals, Users } from '../../../global/@types/database';

const F = f(__filename);

// Will run when there are any incoming POST requests to https://localhost:(port)/user.
// Note that a POST request is different from a GET request
// so this won't exactly work when you actually visit https://localhost:(port)/user

type Appeal = {
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
}

type AppealPayload = {
  newAppealData: Appeal,
  userData: Users,
  appealData: Appeals[],
  banData: GuildBan,
}

export default {
  async handle(
    req: Request,
    res: Response,
  ) {
    // log.info(F, `Received request: ${JSON.stringify(req.method)}, ${JSON.stringify(req.url)}`);
    // log.info(F, `Request headers: ${JSON.stringify(req.headers, null, 2)}`);
    // log.debug(F, `Request body: ${JSON.stringify(req.body, null, 2)}`);
    const body = req.body as AppealPayload;
  
    // Get guild from DB
    const guildData = await database.guilds.get(body.newAppealData.guild);
    if (!guildData) {
      log.error(F, `Could not find guild with id ${body.newAppealData.guild}`);
      res.status(500).send(`Could not find guild with id ${body.newAppealData.guild}`);
      return;
    }
    if (!guildData.partner) {
      log.error(F, `Guild with id ${body.newAppealData.guild} is not a partner`);
      res.status(500).send(`Guild with id ${body.newAppealData.guild} is not a partner`);
      return;
    }
    // log.debug(F, `guildData: ${JSON.stringify(guildData, null, 2)}`);
    log.debug(F, `guildData.partner: ${guildData.partner}`);
  
    // Get guild from discord
    let guild = {} as Guild;
    try {
      guild = await discordClient.guilds.fetch(body.newAppealData.guild);
    } catch (e) {
      log.error(F, `Could not find guild with id ${body.newAppealData.guild}`);
      res.status(500).send(`Could not find guild with id ${body.newAppealData.guild}`);
      return;
    }
    // log.debug(F, `guild: ${JSON.stringify(guild, null, 2)}`);
    log.debug(F, `guild.name: ${guild.name}`);
  
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
    log.debug(F, `channelModerators.name: ${channelModerators.name}`);
  
    // Get the ban information from discord
    const banInfo = body.banData;
    // let banInfo = {} as GuildBan;
    // try {
    //   banInfo = await guild.bans.fetch(body.newAppealData.userId);
    // } catch (err) {
    //   res.status(418).send(`You are not banned from ${guild.name}`);
    //   return;
    // }
    log.debug(F, `banInfo: ${JSON.stringify(banInfo, null, 2)}`);
  
    // Get the appeal data from the database
    // const [appealData] = await database.appeals.get(body.newAppealData.userId, body.newAppealData.guild);
    const appealData = body.appealData;
    log.debug(F, `appealData: ${JSON.stringify(appealData, null, 2)}`);
  
    // If an appeal exists and was created in the last 3 months, return the status of the appeal
    // if (appealData) {
    //   const createdDate = DateTime.fromJSDate(appealData.created_at);
    //   const lastThreeMonthsInterval = Interval.fromDateTimes(
    //     createdDate.minus({ months: 3 }),
    //     createdDate,
    //   );
    //   if (lastThreeMonthsInterval.contains(DateTime.now())) {
    //     if (appealData.status === 'OPEN') {
    //       // If the appeal is still open, and the appeal was created over a week ago, we send a reminder to the guild
    //       let lastWeekInterval = {} as Interval;
    //       if (appealData.reminded_at) {
    //         const remindedDate = DateTime.fromJSDate(appealData.reminded_at);
    //         lastWeekInterval = Interval.fromDateTimes(
    //           remindedDate.minus({ weeks: 1 }),
    //           remindedDate,
    //         );
    //       } else {
    //         lastWeekInterval = Interval.fromDateTimes(
    //           createdDate.minus({ weeks: 1 }),
    //           createdDate,
    //         );
    //       }
  
    //       if (lastWeekInterval.contains(DateTime.now())) {
    //         // Send a reminder to the guild
    //         const modThread = await getModThread(guild, body.newAppealData.userId, body.newAppealData.username);
    //         await modThread.send('hey fuckos, check my appeal');
    //         res.status(418).send('Thank you for asking, your appeal is still undecided, and it\'s been over a week so I sent a reminder to the guild.');
    //         return;
    //       }
  
    //       res.status(418).send('Thank you for asking, you have an existing appeal that is still open. Please be patient.');
    //       return;
    //     }
    //     if (appealData.status === 'ACCEPTED') {
    //       res.status(418).send('You have an existing appeal that was accepted');
    //       return;
    //     }
    //     if (appealData.status === 'DENIED') {
    //       res.status(418).send('You have an existing appeal that was denied');
    //       return;
    //     }
    //   }
    // }
  
    const modThread = await getModThread(guild, body.newAppealData.userId, body.newAppealData.username);
  
    // Get a date that is 24 hours in the future
    const expiresAtDate = new Date();
    expiresAtDate.setDate(expiresAtDate.getDate() + 1);
  
    // Look up the audit logs to see when this user was banned
    const banLogs = await guild.fetchAuditLogs({
      type: AuditLogEvent.MemberBanAdd,
    });
    // log.debug(F, `banLogs: ${JSON.stringify(banLogs, null, 2)}`);
  
    // Find the ban log that matches the user id
    const banLog = banLogs.entries.find(entry => entry.target && entry.target.id === body.newAppealData.userId);
    log.debug(F, `banLog: ${JSON.stringify(banLog, null, 2)}`);
  
    const actorString = banLog?.executor ? `${banLog.executor.username}#${banLog.executor.discriminator}` : 'unknown member';
    const dateString = banLog?.createdAt ? time(banLog.createdAt, 'R') : 'on unknown date';
    const reasonString = banInfo?.reason ? banInfo.reason : 'No reason provided';
  
    // Construct the message that will be sent to the room
    const roleMod = await guild.roles.fetch(env.ROLE_MODERATOR);
    const post = await modThread.send({
      content: `Hey ${roleMod}, <@${body.newAppealData.userId}> has submitted a new appeal:`,
      embeds: [
        new EmbedBuilder()
          .setTitle(`${body.newAppealData.username}#${body.newAppealData.discriminator} (${body.newAppealData.userId})`)
          .setThumbnail(body.newAppealData.avatar)
          .setDescription(stripIndents`
          Original ban ${dateString} by ${actorString}:
          ${reasonString}
          Please vote and put your thoughts below.
          Actions will unlock ${time(expiresAtDate, 'R')}!
          `)
          .addFields([
            { name: 'Reason', value: body.newAppealData.reason },
            { name: 'Solution', value: body.newAppealData.solution },
            { name: 'Future', value: body.newAppealData.future },
            { name: 'Extra', value: body.newAppealData.extra },
          ]),
      ],
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`appealAccept~${body.newAppealData.userId}~${body.newAppealData.email}`)
          .setLabel('Appeal Accepted - Unban!')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`appealReject~${body.newAppealData.userId}~${body.newAppealData.email}`)
          .setLabel('Appeal Rejected - Keep ban!')
          .setStyle(ButtonStyle.Danger),
      )],
    });
  
    await post.react(emojiGet('ts_thumbup'));
    await post.react(emojiGet('ts_thumbdown'));

    // Save the appeal to the database
    await database.appeals.set([{
      guild_id: body.newAppealData.guild,
      user_id: body.userData.id,
      appeal_number: 1,
      reason: body.newAppealData.reason,
      solution: body.newAppealData.solution,
      future: body.newAppealData.future,
      extra: body.newAppealData.extra,
      status: AppealStatus.Open,
      appeal_message_id: post.id,
      response_message: null,
      created_at: new Date(),
      reminded_at: null,
      decided_at: null,
    } as Appeals]);
  
    return true;
  }
};

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

