/* eslint-disable max-len */

import {
  Message,
  TextChannel,
  Role,
} from 'discord.js';
import { DateTime } from 'luxon';
import { stripIndents } from 'common-tags';
import { db, getUser } from './knex';
import { UserExperience, ExperienceType } from '../@types/pgdb';

const F = f(__filename);

// Define the time in between messages where exp will count
const bufferTime = env.NODE_ENV === 'production' ? 60 * 1000 : 1 * 1000;

const ignoredRoles = Object.values({
  needshelp: [env.ROLE_NEEDSHELP],
  newbie: [env.ROLE_NEWBIE],
  underban: [env.ROLE_UNDERBAN],
  muted: [env.ROLE_MUTED],
  tempvoice: [env.ROLE_TEMPVOICE],
}).flat();

export default experience;

async function getType(channel:TextChannel):Promise<ExperienceType> {
  let experienceType = '';
  if (channel.parent) {
    // log.debug(F, `parent: ${channel.parent.name} ${channel.parent.id}`);
    if (channel.parent.parent) {
      // log.debug(F, `parent-parent: ${channel.parent.parent.name} ${channel.parent.parent.id}`);
      if (channel.parent.parent.id === env.CATEGORY_TEAMTRIPSIT) {
        experienceType = 'TEAM' as ExperienceType;
      } else if (channel.parent.parent.id === env.CATEGORY_DEVELOPMENT) {
        experienceType = 'DEVELOPER' as ExperienceType;
      } else if (channel.parent.parent.id === env.CATEGROY_HARMREDUCTIONCENTRE) {
        experienceType = 'TRIPSITTER' as ExperienceType;
      } else if (channel.parent.parent.id === env.CATEGORY_GATEWAY) {
        experienceType = 'IGNORED' as ExperienceType;
      } else {
        experienceType = 'GENERAL' as ExperienceType;
      }
    } else if (channel.parent.id === env.CATEGORY_TEAMTRIPSIT) {
      experienceType = 'TEAM' as ExperienceType;
    } else if (channel.parent.id === env.CATEGORY_DEVELOPMENT) {
      experienceType = 'DEVELOPER' as ExperienceType;
    } else if (channel.parent.id === env.CATEGROY_HARMREDUCTIONCENTRE) {
      experienceType = 'TRIPSITTER' as ExperienceType;
    } else if (channel.parent.id === env.CATEGORY_GATEWAY) {
      experienceType = 'IGNORED' as ExperienceType;
    } else {
      experienceType = 'GENERAL' as ExperienceType;
    }
  } else {
    experienceType = 'IGNORED' as ExperienceType;
  }
  return experienceType as ExperienceType;
}

export async function getTotalLevel(totalExp:number):Promise<{
  level:number,
  levelPoints:number,
  expToLevel:number,
}> {
  // log.debug('totalLevel', `totalExp: ${totalExp}`);
  let level = 0;
  let levelPoints = totalExp;
  let expToLevel = 0;
  while (levelPoints > expToLevel) {
    // log.debug(F, `totalLevel: ${level} | levelPoints: ${levelPoints} | expToLevel: ${expToLevel}`);
    level += 1;
    expToLevel = 5 * (level ** 2) + (50 * level) + 100;
    levelPoints -= expToLevel;
  }
  // log.debug(F, `totalLevel: ${level} | levelPoints: ${levelPoints} | expToLevel: ${expToLevel}`);
  return { level, levelPoints, expToLevel };
}

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

  // Determine what kind of experience to give
  const channel = message.channel as TextChannel;
  const experienceType = await getType(channel);

  const actor = message.member;

  // Check if the user has an ignored role
  if (ignoredRoles.some(role => message.member?.roles.cache.has(role))) {
    // log.debug(F, `Message sent by a user with an ignored role`);
    return;
  }

  // log.debug(stripIndents`[${PREFIX}] Message sent by ${message.author.username} \
  // in ${(message.channel as TextChannel).name} on ${message.guild}`);

  // log.debug(F, `experienceType: ${experienceType}`);

  // Get random value between 15 and 25
  const expPoints = env.NODE_ENV === 'production'
    ? Math.floor(Math.random() * (25 - 15 + 1)) + 15
    : 100;

  const userData = await getUser(message.author.id, null);

  // log.debug(F, `userData: ${JSON.stringify(userData, null, 2)}`);

  const experienceData = await db<UserExperience>('user_experience')
    .select(
      db.ref('id'),
      db.ref('user_id'),
      db.ref('level'),
      db.ref('type'),
      db.ref('level_points'),
      db.ref('total_points'),
      db.ref('last_message_at'),
      db.ref('last_message_channel'),
    )
    .where('user_id', userData.id)
    .andWhere('type', experienceType)
    .first();

  // log.debug(F, `experienceData: ${JSON.stringify(experienceData, null, 2)}`);

  // If the user has no experience, insert it
  if (!experienceData) {
    // log.debug(F, `Inserting new experience`);
    // log.debug(F, `experienceDataInsert: ${JSON.stringify(experienceData, null, 2)}`);
    await db<UserExperience>('user_experience')
      .insert({
        user_id: userData.id,
        type: experienceType,
        level_points: expPoints,
        total_points: expPoints,
        last_message_at: new Date(),
        last_message_channel: message.channel.id,
        level: 0,
      });
    return;
  }
  // If the user has experience, update it
  // log.debug(F, `Updating existing experience`);
  experienceData.level_points += expPoints;
  experienceData.total_points += expPoints;

  // log.debug(F, `experienceDataUpdate: ${JSON.stringify(experienceData, null, 2)}`);

  // Check if the message happened in the last minute
  // log.debug(F, `lastMessageAt: ${experienceData.last_message_at}`);
  const lastMessageDate = DateTime.fromJSDate(experienceData.last_message_at);

  const currentDate = DateTime.now();
  const diff = currentDate.diff(lastMessageDate).toObject();
  // log.debug(F, `diff: ${JSON.stringify(diff)}`);

  // If the message happened in the last minute, ignore it
  if (!diff.milliseconds) {
    log.error(F, `Error converting ${lastMessageDate}`);
    return;
  }
  if (diff.milliseconds < bufferTime) {
    // log.debug(F, `Message sent by a user in the last minute`);
    return;
  }

  // If the time diff is over one bufferTime, increase the experience points
  let levelExpPoints = experienceData.level_points + expPoints;
  const totalExpPoints = experienceData.total_points + expPoints;

  let { level } = experienceData;
  const expToLevel = 5 * (level ** 2) + (50 * level) + 100;

  const guild = await message.client.guilds.fetch(env.DISCORD_GUILD_ID);
  const channelTripbotlogs = await guild.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
  const member = await guild.members.fetch(actor.id);

  // Calculate total experience points
  let allExpPoints = 0;
  const currentExp = await db<UserExperience>('user_experience')
    .select(
      db.ref('total_points'),
      db.ref('type'),
    )
    .where('user_id', userData.id)
    .andWhereNot('type', 'IGNORED')
    .andWhereNot('type', 'TOTAL');

  currentExp.forEach(exp => {
    allExpPoints += exp.total_points;
  });

  const totalData = await getTotalLevel(allExpPoints);

  // Give the proper VIP role
  if (totalData.level >= 5) {
    // Ensure the member has the base VIP role if they're over level 5
    let role = await guild.roles.fetch(env.ROLE_VIP) as Role;
    log.debug(F, `role: ${JSON.stringify(role, null, 2)}`);
    if (!member.roles.cache.has(env.ROLE_VIP)) {
      member.roles.add(role);
      await channelTripbotlogs.send(stripIndents`${actor.displayName} was given ${role.name}`);
    }

    role = await guild.roles.fetch(env.ROLE_VIP_5) as Role;
    if (totalData.level >= 10) {
      // Check if the member already has the previous role, and if so, remove it
      member.roles.remove(role);
      role = await guild.roles.fetch(env.ROLE_VIP_10) as Role;
      if (totalData.level >= 20) {
        member.roles.remove(role);
        role = await guild.roles.fetch(env.ROLE_VIP_20) as Role;
        if (totalData.level >= 30) {
          member.roles.remove(role);
          role = await guild.roles.fetch(env.ROLE_VIP_30) as Role;
          if (totalData.level >= 40) {
            member.roles.remove(role);
            role = await guild.roles.fetch(env.ROLE_VIP_40) as Role;
            if (totalData.level >= 50) {
              member.roles.remove(role);
              role = await guild.roles.fetch(env.ROLE_VIP_50) as Role;
              // if (totalData.level >= 60) {
              //   member.roles.remove(role);
              //   role = await guild.roles.fetch(env.ROLE_VIP_60) as Role;
                // Beyond level 70 is not supported yet
                // if (level >= 70) {
                //   if (!member.roles.cache.has(role.id)) {
                //     member.roles.remove(role);
                //     channelTripbotlogs.send(stripIndents`${actor.username} removed ${role.name}`);
                //   }
                //   role = await guild.roles.fetch(env.ROLE_VIP_70) as Role;
                //   if (level >= 80) {
                //     if (!member.roles.cache.has(role.id)) {
                //       member.roles.remove(role);
                //       channelTripbotlogs.send(stripIndents`${actor.username} removed ${role.name}`);
                //     }
                //     role = await guild.roles.fetch(env.ROLE_VIP_80) as Role;
                //     if (level >= 90) {
                //       if (!member.roles.cache.has(role.id)) {
                //         member.roles.remove(role);
                //         channelTripbotlogs.send(stripIndents`${actor.username} removed ${role.name}`);
                //       }
                //       role = await guild.roles.fetch(env.ROLE_VIP_90) as Role;
                //       if (level >= 100) {
                //         if (!member.roles.cache.has(role.id)) {
                //           member.roles.remove(role);
                //           channelTripbotlogs.send(stripIndents`${actor.username} removed ${role.name}`);
                //         }
                //         role = await guild.roles.fetch(env.ROLE_VIP_100) as Role;
                //       }
                //     }
                //   }
                // }
              }
            }
          }
        }
      }
    }
    // Check if the member already has the resulting role, and if not, add it
    log.debug(F, `Checking if ${member.displayName} has role ${role.name}...`);
    if (!member.roles.cache.has(role.id)) {
      member.roles.add(role);
      await channelTripbotlogs.send(stripIndents`${actor.displayName} was given ${role.name}`);
    }
  }

  // eslint-disable-next-line max-len
  // log.debug(stripIndents`[${PREFIX}] ${message.author.username } (lv${level}) +${expPoints} ${experienceType} exp | Total: ${totalExpPoints}, Level: ${levelExpPoints}, Needed to level up: ${expToLevel-levelExpPoints}`);
  if (expToLevel < levelExpPoints) {
    level += 1;
    // log.debug(stripIndents`[${PREFIX}] ${message.author.username} has leveled up to ${experienceType} level ${level}!`);

    if (level % 5 === 0) {
      await channelTripbotlogs.send(stripIndents`${message.author.username} has leveled up to ${experienceType} level ${level}!`);
    }
    // await channelTripbotlogs.send({embeds: [embed]});
    levelExpPoints -= expToLevel;
    experienceData.level = level;
  }

  experienceData.level_points = levelExpPoints;
  experienceData.total_points = totalExpPoints;
  experienceData.last_message_at = new Date();
  experienceData.last_message_channel = message.channel.id;

  // log.debug(F, `experienceDataMerge: ${JSON.stringify(experienceData, null, 2)}`);

  await db<UserExperience>('user_experience')
    .insert(experienceData)
    .onConflict(['id', 'user_id', 'type'])
    .merge();
}
