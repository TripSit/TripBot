/* eslint-disable no-unused-vars*/
/* eslint-disable max-len*/

import {
  Message,
  Role,
  TextChannel,
  User,
} from 'discord.js';
import {expEntry, expDict} from '../../global/@types/database';
import env from './env.config';
import logger from './logger';
// import {stripIndents} from 'common-tags';
import {stripIndents} from 'common-tags';
import {ircMessage} from '../../irc/@types/irc';

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
  'opentripsit': [env.CHANNEL_OPENTRIPSIT, '#opentripsit'],
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
    message:Message | ircMessage,
) {
  let actor = {} as User | any;
  let messageChannelId = '';
  let experienceType = 'general';

  // Determine the channel that was spoken in and type of experience to give
  if (message instanceof Message) {
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

    actor = message.author;
    const channel = message.channel as TextChannel;

    // logger.debug(`[${PREFIX}] channel: ${JSON.stringify(channel, null, 2)}`);
    // logger.debug(`[${PREFIX}] channel: ${channel.name} ${channel.id}`);

    // Determine what kind of experience to give
    if (channel.parent) {
      // logger.debug(`[${PREFIX}] parent: ${channel.parent.name} ${channel.parent.id}`);

      if (channel.parent.parent) {
        // logger.debug(`[${PREFIX}] parent-parent: ${channel.parent.parent.name} ${channel.parent.parent.id}`);
        if (channel.parent.parent.id === env.CATEGORY_TEAMTRIPSIT) {
          experienceType = 'team';
        } else if (channel.parent.parent.id === env.CATEGORY_DEVELOPMENT) {
          experienceType = 'developer';
        } else if (channel.parent.parent.id === env.CATEGROY_HARMREDUCTIONCENTRE) {
          experienceType = 'tripsitter';
        } else if (channel.parent.parent.id === env.CATEGORY_GATEWAY) {
          experienceType = 'ignored';
        } else {
          experienceType = 'general';
        }
      } else if (channel.parent.id === env.CATEGORY_TEAMTRIPSIT) {
        experienceType = 'team';
      } else if (channel.parent.id === env.CATEGORY_DEVELOPMENT) {
        experienceType = 'developer';
      } else if (channel.parent.id === env.CATEGROY_HARMREDUCTIONCENTRE) {
        experienceType = 'tripsitter';
      } else if (channel.parent.id === env.CATEGORY_GATEWAY) {
        experienceType = 'ignored';
      } else {
        experienceType = 'general';
      }
    } else {
      experienceType = 'ignored';
    }
    messageChannelId = channel.id;
  }

  logger.debug(`[${PREFIX}] Message sent in ${experienceType} channel`);

  // if (!(message instanceof Message)) {
  //   // If the user is not a member of the guild, then this probably came from IRC
  //   // If the user isnt registered then don't give them experience
  //   // if (!message.host.startsWith('tripsit')) { return; }

  //   if (botNicknames.includes(message.nick)) {
  //     // logger.debug(`[${PREFIX}] ${message.nick} is a bot!`);
  //     return;
  //   }

  //   const memberHost = message.host.split('/')[1];
  //   logger.debug(`[${PREFIX}] ${message.nick}${memberHost ?
  //     ` (${memberHost}) ` :
  //     ' '}said ${message.args[1]} in ${message.args[0]}`);
  //   actor = message;

  //   // Determine what kind of experience to give
  //   if (tripsitterIrcChannels.includes(message.args[0])) {
  //     logger.debug(`[${PREFIX}] Message sent in a tripsitter channel from IRC`);
  //     experienceType = 'tripsitter';
  //   } else {
  //     logger.debug(`[${PREFIX}] Message sent in a non-tripsitter channel from IRC`);
  //     experienceType = 'general';
  //   }
  //   messageChannelId = message.args[0].replace(/(\.|\$|#|\[|\]|\/)/g, '');
  // }

  // logger.debug(`[${PREFIX}] messageChannelId: ${messageChannelId} | experienceType: ${experienceType}`);

  // Get random value between 15 and 25
  const expPoints = env.NODE_ENV === 'production' ?
    Math.floor(Math.random() * (25 - 15 + 1)) + 15 :
    100;

  const currMessageDate = new Date();

  let experienceDict = {
    total: {
      level: 0,
      levelExpPoints: expPoints,
      totalExpPoints: expPoints,
      lastMessageDate: currMessageDate.valueOf(),
      lastMessageChannel: messageChannelId,
    },
  } as expDict;

  if (global.db) {
    let userRef = '';

    if (message instanceof Message) {
      userRef = `${env.FIREBASE_DB_USERS}/${actor.id}/experience`;
    } else {
      const accountName = message.host.split('/')[2] ?? message.host.replace(/(\.|\$|#|\[|\]|\/)/g, '-');
      userRef = `${env.FIREBASE_DB_USERS}/${accountName}/experience`;
    }
    logger.debug(`[${PREFIX}] userRef: ${userRef}`);

    const ref = db.ref(userRef);
    await ref.once('value', async (data) => {
      if (data.val() !== null) {
        experienceDict = data.val();

        /**
         * Processes experience points for a user
         * @param {expDict} expDict - all exp data
         * @param {string} expType - the type of exp to process
         * @return {expDict} - the processed exp data
         */
        async function processExp(
            expDict:expDict,
            expType:string,
        ):Promise<expDict> {
          let expData = expDict[expType as keyof typeof expDict];
          if (expData) {
            logger.debug(`[${PREFIX}] ${expType} exp found!`);
            const lastMessageDate = new Date(expData.lastMessageDate);
            const timeDiff = currMessageDate.valueOf() - lastMessageDate.valueOf();
            // logger.debug(`[${PREFIX}] Time difference: ${timeDiff}`);
            if (timeDiff > bufferTime) {
              // If the time diff is over one bufferTime, increase the experience points
              let levelExpPoints = expData.levelExpPoints + expPoints;
              const totalExpPoints = expData.totalExpPoints + expPoints;

              let level = expData.level;
              const expToLevel = 5 * (level ** 2) + (50 * level) + 100;

              // eslint-disable-next-line max-len
              logger.debug(stripIndents`[${PREFIX}] ${actor.username ? actor.username : actor.nick } (lv${level}) +${expPoints} ${expType} exp | TotalExp: ${totalExpPoints}, LevelExp: ${levelExpPoints}, ExpToLevel ${level + 1}: ${expToLevel}`);
              if (expToLevel < levelExpPoints) {
                level += 1;
                logger.debug(stripIndents`[${PREFIX}] ${actor.username ? actor.username : actor.nick } has leveled up to ${expType} level ${level}!`);

                if (level % 5 === 0) {
                  const channelTripbotlogs = global.client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
                  channelTripbotlogs.send(stripIndents`${actor.username ? actor.username : actor.nick } has leveled up to ${expType} level ${level}!`);
                }
                // channelTripbotlogs.send({embeds: [embed]});
                levelExpPoints -= expToLevel;
              }
              expData = {
                level: level,
                levelExpPoints: levelExpPoints,
                totalExpPoints: totalExpPoints,
                lastMessageDate: lastMessageDate.valueOf(),
                lastMessageChannel: messageChannelId,
              };
              // logger.debug(`[${PREFIX}] categoryExperienceData: ${JSON.stringify(expData, null, 2)}`);
              // logger.debug(`[${PREFIX}] experienceType: ${expType}`);

              experienceDict[expType as keyof typeof experienceDict] = expData;
              // logger.debug(`[${PREFIX}] experienceDictA: ${JSON.stringify(experienceDict, null, 2)}`);
              // logger.debug(`[${PREFIX}] experienceDataC: ${JSON.stringify(experienceData, null, 2)}`);
            }
          } else {
            experienceDict[experienceType as keyof typeof experienceDict] = {
              level: 0,
              levelExpPoints: expPoints,
              totalExpPoints: expPoints,
              lastMessageDate: currMessageDate.valueOf(),
              lastMessageChannel: messageChannelId,
            };
          }
          return experienceDict;
        };

        // logger.debug(`[${PREFIX}] experienceDict1: ${JSON.stringify(experienceDict, null, 2)}`);
        await processExp(experienceDict, 'total')
            .then(async (expDictA) => {
              // logger.debug(`[${PREFIX}] experienceDict2: ${JSON.stringify(expDictA, null, 2)}`);
              await processExp(expDictA, experienceType)
                  .then(async (expDictB) => {
                    // logger.debug(`[${PREFIX}] experienceDict3: ${JSON.stringify(expDictB, null, 2)}`);
                    ref.update(expDictB);
                  });
            });
      } else {
        // logger.debug(`[${PREFIX}] experienceDictB: ${JSON.stringify(experienceDict, null, 2)}`);
        experienceDict[experienceType as keyof typeof experienceDict] = {
          level: 0,
          levelExpPoints: expPoints,
          totalExpPoints: expPoints,
          lastMessageDate: currMessageDate.valueOf(),
          lastMessageChannel: messageChannelId,
        };
        ref.set(experienceDict);
      }
    });
  }
};
