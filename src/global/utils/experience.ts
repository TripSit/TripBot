/* eslint-disable max-len*/

import {
  Message,
  TextChannel,
} from 'discord.js';
import {DateTime} from 'luxon';
import {db} from '../utils/knex';
import {Users, UserExperience} from '../@types/pgdb';
import env from './env.config';
import log from './log';
import {stripIndents} from 'common-tags';

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

  // Check if the user has an ignored role
  if (ignoredRoles.some((role) => message.member?.roles.cache.has(role))) {
    // log.debug(`[${PREFIX}] Message sent by a user with an ignored role`);
    return;
  }

  log.debug(stripIndents`[${PREFIX}] Message sent by ${message.author.username} \
  in ${(message.channel as TextChannel).name} on ${message.guild}`);

  // Determine what kind of experience to give
  const channel = message.channel as TextChannel;
  let experienceType = 'GENERAL';
  if ((channel).parent) {
    // log.debug(`[${PREFIX}] parent: ${channel.parent.name} ${channel.parent.id}`);
    if (channel.parent.parent) {
      // log.debug(`[${PREFIX}] parent-parent: ${channel.parent.parent.name} ${channel.parent.parent.id}`);
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
  // log.debug(`[${PREFIX}] experienceType: ${experienceType}`);

  // Get random value between 15 and 25
  const expPoints = env.NODE_ENV === 'production' ?
    Math.floor(Math.random() * (25 - 15 + 1)) + 15 :
    100;

  const userId = message.author.id;
  let userUniqueId = await db
    .select(db.ref('id'))
    .from<Users>('users')
    .where('discord_id', userId);

  if (userUniqueId.length === 0) {
    userUniqueId = await db
      .insert({discord_id: userId})
      .into('users')
      .returning('id');
  }

  // log.debug(`[${PREFIX}] userUniqueId: ${userUniqueId[0].id}`);

  let experienceData = {
    user_id: userUniqueId[0].id as string,
    type: experienceType as string | null,
    level: 0 as number,
    level_points: 0 as number,
    total_points: 0 as number,
    last_message_at: new Date() as Date,
    last_message_channel: message.channel.id as string,
    created_at: new Date() as Date,
  };

  const currentExp = await db
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
    .where('user_id', userUniqueId[0].id)
    .andWhere('type', experienceType);
  // log.debug(`[${PREFIX}] currentExp: ${JSON.stringify(currentExp, null, 2)}`);

  // If the user has no experience, insert it
  if (!currentExp[0]) {
    log.debug(`[${PREFIX}] Inserting new experience`);
    experienceData.level_points = expPoints;
    experienceData.total_points = expPoints;
    // log.debug(`[${PREFIX}] experienceDataInsert: ${JSON.stringify(experienceData, null, 2)}`);
    await db('user_experience')
      .insert(experienceData);
    return;
  } else {
    // If the user has experience, update it
    log.debug(`[${PREFIX}] Updating existing experience`);
    experienceData = currentExp[0];
  }

  // log.debug(`[${PREFIX}] experienceDataUpdate: ${JSON.stringify(experienceData, null, 2)}`);

  // Check if the message happened in the last minute
  // log.debug(`[${PREFIX}] lastMessageAt: ${experienceData.last_message_at}`);
  const lastMessageDate = DateTime.fromJSDate(experienceData.last_message_at);

  const currentDate = DateTime.now();
  const diff = currentDate.diff(lastMessageDate).toObject();
  // log.debug(`[${PREFIX}] diff: ${JSON.stringify(diff)}`);

  // If the message happened in the last minute, ignore it
  if (!diff.milliseconds) {
    log.error(`[${PREFIX}] Error converting ${lastMessageDate}`);
    return;
  }
  if (diff.milliseconds < bufferTime) {
    log.debug(`[${PREFIX}] Message sent by a user in the last minute`);
    return;
  }

  // If the time diff is over one bufferTime, increase the experience points
  let levelExpPoints = experienceData.level_points + expPoints;
  const totalExpPoints = experienceData.total_points + expPoints;

  let level = experienceData.level;
  const expToLevel = 5 * (level ** 2) + (50 * level) + 100;

  // eslint-disable-next-line max-len
  log.debug(stripIndents`[${PREFIX}] ${message.author.username } (lv${level}) +${expPoints} ${experienceType} exp | Total: ${totalExpPoints}, Level: ${levelExpPoints}, Needed to level up: ${expToLevel-levelExpPoints}`);
  if (expToLevel < levelExpPoints) {
    level += 1;
    log.debug(stripIndents`[${PREFIX}] ${message.author.username} has leveled up to ${experienceType} level ${level}!`);

    if (level % 5 === 0) {
      const channelTripbotlogs = global.client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
      channelTripbotlogs.send(stripIndents`${message.author.username} has leveled up to ${experienceType} level ${level}!`);
    }
    // channelTripbotlogs.send({embeds: [embed]});
    levelExpPoints -= expToLevel;
    experienceData.level = level;
  }

  experienceData.level_points = levelExpPoints;
  experienceData.total_points = totalExpPoints;
  experienceData.last_message_at = new Date();
  experienceData.last_message_channel = message.channel.id;

  // log.debug(`[${PREFIX}] experienceDataMerge: ${JSON.stringify(experienceData, null, 2)}`);

  await db('user_experience')
    .insert(experienceData)
    .onConflict(['id', 'user_id', 'type'])
    .merge();
};
