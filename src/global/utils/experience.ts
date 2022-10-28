/* eslint-disable no-unused-vars*/
/* eslint-disable max-len*/

import {
  Message,
  Role,
  TextChannel,
  User,
} from 'discord.js';
import {DateTime} from 'luxon';
import {db} from '../utils/knex';
import {Users, UserExperience} from '../@types/pgdb';
import env from './env.config';
import logger from './logger';
import fs from 'fs';
// import {stripIndents} from 'common-tags';
import {stripIndents} from 'common-tags';
import mee6data from '../assets/config/mee6-leaderboard.json';

import * as path from 'path';
const PREFIX = path.parse(__filename).name;

// Define the time in between messages where exp will count
const bufferTime = env.NODE_ENV === 'production' ? 60 * 1000 : 1 * 1000;

const ignoredRoles = Object.values({
  'needshelp': [env.ROLE_NEEDSHELP],
  'newbie': [env.ROLE_NEWBIE],
  'underban': [env.ROLE_UNDERBAN],
  'muted': [env.ROLE_MUTED],
  'tempvoice': [env.ROLE_TEMPVOICE],
}).flat();

const ignoredNicknames = Object.values({
  'tripbot': [
    'TS',
    'tripbot',
    'TSDev',
    'TS1',
    'TSTelegram',
    'TSDiscord',
    'tripbot1',
    'TSDev1',
    'TS11',
    'TSTelegram1',
    'TSDiscord1'],
  'github': ['GitHub', 'github'],
}).flat();

const ignoredChannels = Object.values({
  'start-here': [env.CHANNEL_START, '#start-here'],
  'announcements': [env.CHANNEL_ANNOUNCEMENTS, '#announcements'],
  'rules': [env.CHANNEL_RULES, '#rules'],
  'bot-spam': [env.CHANNEL_BOTSPAM, '#bot-spam'],
  'help-desk': [env.CHANNEL_HELPDESK, '#help-desk'],
  'kudos': [env.CHANNEL_KUDOS, '#kudos'],
  'best-of-tripsit': [env.CHANNEL_BESTOF, '#best-of-tripsit'],
  'talk-to-tripsit': [env.CHANNEL_TALKTOTS, '#talk-to-tripsit'],
}).flat();

const tripsitterChannels = Object.values({
  'tripsit-meta': [env.CHANNEL_TRIPSITMETA, '#tripsit-meta'],
  'tripsit': [env.CHANNEL_TRIPSIT, '#tripsit'],
  // 'opentripsit': [env.CHANNEL_OPENTRIPSIT, '#opentripsit'],
  'opentripsit1': [env.CHANNEL_OPENTRIPSIT1, '#opentripsit1'],
  'opentripsit2': [env.CHANNEL_OPENTRIPSIT2, '#opentripsit2'],
  'webtripsit': [env.CHANNEL_WEBTRIPSIT, '#webtripsit'],
  'webtripsit1': [env.CHANNEL_WEBTRIPSIT1, '#webtripsit1'],
  'webtripsit2': [env.CHANNEL_WEBTRIPSIT2, '#webtripsit2'],
  'closedtripsit': [env.CHANNEL_CLOSEDTRIPSIT, '#closedtripsit'],
  'hrresources': [env.CHANNEL_HRRESOURCES, '#hr-resources'],
  'drugquestions': [env.CHANNEL_DRUGQUESTIONS, '#drugquestions'],
}).flat();

const developerChannels = Object.values({
  'applications': [env.CHANNEL_APPLICATIONS, '#applications'],
  'dev-announce': [env.CHANNEL_DEVANNCOUNCE, '#dev-announce'],
  'dev-offtopic': [env.CHANNEL_DEVOFFTOPIC, '#dev-offtopic'],
  'dev-general': [env.CHANNEL_DEVELOPMENT, '#dev-general'],
  'discord': [env.CHANNEL_DISCORD, '#discord'],
  'tripbot': [env.CHANNEL_TRIPBOT, '#tripbot'],
  'design': [env.CHANNEL_DESIGN, '#design'],
  'content': [env.CHANNEL_WIKICONTENT, '#content'],
  'irc': [env.CHANNEL_IRC, '#irc'],
  'matrix': [env.CHANNEL_MATRIX, '#matrix'],
  'sandbox': [env.CHANNEL_SANDBOX, '#sandbox'],
  'development-vc': [env.CHANNEL_DEVELOPMENTVOICE, '#development-vc'],
}).flat();

const teamChannels = Object.values({
  'modhaven': [env.CHANNEL_MODHAVEN, '#modhaven'],
  'teamtripsit': [env.CHANNEL_TEAMTRIPSIT, '#teamtripsit'],
  'moderators': [env.CHANNEL_MODERATORS, '#moderators'],
  'modlog': [env.CHANNEL_MODLOG, '#modlog'],
  'botlog': [env.CHANNEL_BOTLOG, '#botlog'],
  'team-meeting': [env.CHANNEL_TEAMMEETING, '#team-meeting'],
}).flat();

/**
 * This takes a messsage and gives the user experience
 * @param {Message} message The message object to check
 */
export async function experience(
  message:Message,
) {
  // If the message didnt come from a guild member, or inside of a channel, ignore it
  if (!message.member || !message.channel) {
    return;
  }

  logger.debug(stripIndents`[${PREFIX}] Message sent by ${message.author.username} \
in ${(message.channel as TextChannel).name} on ${message.guild}`);

  // Check if the user has an ignored role
  if (ignoredRoles.some((role) => message.member!.roles.cache.has(role))) {
    logger.debug(`[${PREFIX}] Message sent by a user with an ignored role`);
    return;
  }


  // Determine what kind of experience to give
  const channel = message.channel as TextChannel;
  let experienceType = 'GENERAL';
  if ((channel).parent) {
    // logger.debug(`[${PREFIX}] parent: ${channel.parent.name} ${channel.parent.id}`);
    if (channel.parent.parent) {
      // logger.debug(`[${PREFIX}] parent-parent: ${channel.parent.parent.name} ${channel.parent.parent.id}`);
      if (channel.parent.parent.id === env.CATEGORY_TEAMTRIPSIT) {
        experienceType = 'TEAM';
      } else if (channel.parent.parent.id === env.CATEGORY_DEVELOPMENT) {
        experienceType = 'DEVELOPER';
      } else if (channel.parent.parent.id === env.CATEGROY_HARMREDUCTIONCENTRE) {
        experienceType = 'TRIPSITTER';
      } else if (channel.parent.parent.id === env.CATEGORY_GATEWAY) {
        experienceType = 'IGNORED';
      } else {
        experienceType = 'GENERAL';
      }
    } else if (channel.parent.id === env.CATEGORY_TEAMTRIPSIT) {
      experienceType = 'TEAM';
    } else if (channel.parent.id === env.CATEGORY_DEVELOPMENT) {
      experienceType = 'DEVELOPER';
    } else if (channel.parent.id === env.CATEGROY_HARMREDUCTIONCENTRE) {
      experienceType = 'TRIPSITTER';
    } else if (channel.parent.id === env.CATEGORY_GATEWAY) {
      experienceType = 'IGNORED';
    } else {
      experienceType = 'GENERAL';
    }
  } else {
    experienceType = 'IGNORED';
  }
  logger.debug(`[${PREFIX}] experienceType: ${experienceType}`);

  // Get random value between 15 and 25
  const expPoints = env.NODE_ENV === 'production' ?
    Math.floor(Math.random() * (25 - 15 + 1)) + 15 :
    100;

  const userUniqueId = (await db
    .select(db.ref('id'))
    .from<Users>('users')
    .where('discord_id', message.author.id))[0].id;

  logger.debug(`[${PREFIX}] userUniqueId: ${userUniqueId}`);

  const experienceData = {
    user_id: userUniqueId,
    type: experienceType,
    level: 0,
    level_points: expPoints,
    total_points: expPoints,
    last_message_at: new Date(),
    last_message_channel: message.channel.id,
    created_at: new Date(),
  };

  const experienceDicts = await db
    .select(
      db.ref('id').as('id'),
      db.ref('user_id').as('user_id'),
      db.ref('type').as('type'),
      db.ref('level').as('level'),
      db.ref('level_points').as('level_points'),
      db.ref('total_points').as('total_points'),
      db.ref('last_message_at').as('last_message_at'),
      db.ref('last_message_channel').as('last_message_channel'),
      db.ref('created_at').as('created_at'),
    )
    .from<UserExperience>('user_experience')
    .where('user_id', userUniqueId);

  logger.debug(`[${PREFIX}] experienceDicts: ${JSON.stringify(experienceDicts)}`);

  await db('user_experience')
    .insert({
      user_id: userUniqueId,
      type: experienceType,
      level: 0,
      level_points: expPoints,
      total_points: expPoints,
      last_message_at: new Date(),
      last_message_channel: message.channel.id,
      created_at: new Date(),
    })
    .onConflict('user_id')
    .merge()
    .returning('*');

  // await ref.once('value', async (data) => {
  //   if (data.val() !== null) {
  //     experienceDict = data.val();

  //     // logger.debug(`[${PREFIX}] experienceDictStart: ${JSON.stringify(experienceDict, null, 2)}`);

  //     /**
  //        * Processes experience points for a user
  //        * @param {expDict} expDict - all exp data
  //        * @param {string} expType - the type of exp to process
  //        * @return {expDict} - the processed exp data
  //        */
  //     async function processExp(
  //       expDict:expDict,
  //       expType:string,
  //     ):Promise<expDict> {
  //       const expData = expDict[expType as keyof typeof expDict];
  //       if (expData) {
  //         // logger.debug(`[${PREFIX}] ${expType} exp found!`);
  //         // logger.debug(`[${PREFIX}] expData.lastMessageDate: ${expData.lastMessageDate}`);
  //         const lastMessageDate = new Date(expData.lastMessageDate);
  //         // logger.debug(`[${PREFIX}] lastMessageDate: ${lastMessageDate}`);
  //         // logger.debug(`[${PREFIX}] currMessageDate.valueOf(): ${currMessageDate.valueOf()}`);
  //         // logger.debug(`[${PREFIX}] lastMessageDate.valueOf(): ${lastMessageDate.valueOf()}`);
  //         const timeDiff = currMessageDate.valueOf() - lastMessageDate.valueOf();
  //         // logger.debug(`[${PREFIX}] timeDiff: ${timeDiff}`);
  //         // logger.debug(`[${PREFIX}] bufferTime: ${bufferTime}`);
  //         if (timeDiff > bufferTime) {
  //           // If the time diff is over one bufferTime, increase the experience points
  //           let levelExpPoints = expData.levelExpPoints + expPoints;
  //           const totalExpPoints = expData.totalExpPoints + expPoints;

  //           let level = expData.level;
  //           const expToLevel = 5 * (level ** 2) + (50 * level) + 100;

  //           // eslint-disable-next-line max-len
  //           logger.debug(stripIndents`[${PREFIX}] ${actor.username } (lv${level}) +${expPoints} ${expType} exp | TotalExp: ${totalExpPoints}, LevelExp: ${levelExpPoints}, ExpNeededForLevel ${level + 1}: ${expToLevel}`);
  //           if (expToLevel < levelExpPoints) {
  //             level += 1;
  //             logger.debug(stripIndents`[${PREFIX}] ${actor.username} has leveled up to ${expType} level ${level}!`);

  //             if (level % 5 === 0) {
  //               const channelTripbotlogs = global.client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
  //               channelTripbotlogs.send(stripIndents`${actor.username} has leveled up to ${expType} level ${level}!`);
  //             }
  //             // channelTripbotlogs.send({embeds: [embed]});
  //             levelExpPoints -= expToLevel;
  //           }
  //           expData.level = level;
  //           expData.levelExpPoints = levelExpPoints;
  //           expData.totalExpPoints = totalExpPoints;
  //           expData.lastMessageDate = currMessageDate.valueOf();
  //           expData.lastMessageChannel = messageChannelId;
  //           // logger.debug(`[${PREFIX}] categoryExperienceData: ${JSON.stringify(expData, null, 2)}`);
  //           // logger.debug(`[${PREFIX}] experienceType: ${expType}`);

  //           experienceDict[expType as keyof typeof experienceDict] = expData;
  //           // logger.debug(`[${PREFIX}] experienceDictA: ${JSON.stringify(experienceDict, null, 2)}`);
  //           // logger.debug(`[${PREFIX}] experienceDataC: ${JSON.stringify(experienceData, null, 2)}`);
  //         }
  //       } else {
  //         experienceDict[expType as keyof typeof expDict] = {
  //           level: 0,
  //           levelExpPoints: expPoints,
  //           totalExpPoints: expPoints,
  //           lastMessageDate: currMessageDate.valueOf(),
  //           lastMessageChannel: messageChannelId,
  //         };
  //       }
  //       // logger.debug(`[${PREFIX}] experienceDictB: ${JSON.stringify(experienceDict, null, 2)}`);
  //       return experienceDict;
  //     };

  //     // logger.debug(`[${PREFIX}] experienceDict1: ${JSON.stringify(experienceDict, null, 2)}`);
  //     await processExp(experienceDict, 'total')
  //       .then(async (expDictA) => {
  //         // logger.debug(`[${PREFIX}] experienceDict2: ${JSON.stringify(expDictA, null, 2)}`);
  //         await processExp(expDictA, experienceType)
  //           .then(async (expDictB) => {
  //             // logger.debug(`[${PREFIX}] experienceDict3: ${JSON.stringify(expDictB, null, 2)}`);
  //             ref.update(expDictB);
  //           });
  //       });
  //   } else {
  //     // logger.debug(`[${PREFIX}] experienceDictB: ${JSON.stringify(experienceDict, null, 2)}`);
  //     experienceDict[experienceType as keyof typeof experienceDict] = {
  //       level: 0,
  //       levelExpPoints: expPoints,
  //       totalExpPoints: expPoints,
  //       lastMessageDate: currMessageDate.valueOf(),
  //       lastMessageChannel: messageChannelId,
  //     };
  //     logger.debug(`[${PREFIX}] settin new EXP}`);
  //     ref.set(experienceDict);
  //   }
  // });
};
