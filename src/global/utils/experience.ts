/* eslint-disable max-len */

import {
  Message,
  TextChannel,
  Role,
} from 'discord.js';
import { DateTime } from 'luxon';
import { stripIndents } from 'common-tags';
import {
  experienceGet, experienceUpdate, getUser,
} from './knex';
import { UserExperience, ExperienceType, ExperienceCategory } from '../@types/pgdb';

const F = f(__filename); // eslint-disable-line

export default experience;

// Define the time in between messages where exp will count
const bufferTime = env.NODE_ENV === 'production' ? 60 * 1000 : 1 * 1000;

// Get random value between 15 and 25
const expPoints = env.NODE_ENV === 'production'
  ? Math.floor(Math.random() * (25 - 15 + 1)) + 15
  : 1000;

const ignoredRoles = Object.values({
  needshelp: [env.ROLE_NEEDSHELP],
  newbie: [env.ROLE_NEWBIE],
  underban: [env.ROLE_UNDERBAN],
  muted: [env.ROLE_MUTED],
  tempvoice: [env.ROLE_TEMPVOICE],
}).flat();

/**
 * This takes a messsage and gives the user experience
 * @param {Message} message The message object to check
 */
export async function experience(
  message:Message,
) {
  // Ignore this message if the user...
  if (
    !message.member // Is not a member of a guild
    || !message.channel // Was not sent in a channel
    || !(message.channel instanceof TextChannel) // Was not sent in a text channel
    || !message.guild // Was not sent in a guild
    || message.author.bot // Was sent by a bot
    || ignoredRoles.some(role => message.member?.roles.cache.has(role)) // Has a role that should be ignored
  ) {
    return;
  }

  // Determine what kind of experience to give
  const experienceCategory = await getCategory(message.channel);
  // log.debug(F, `experienceType: ${experienceType}`);

  const userData = await getUser(message.author.id, null);
  // log.debug(F, `userData: ${JSON.stringify(userData, null, 2)}`);

  const [experienceData] = await experienceGet(1, experienceCategory, 'TEXT', userData.id);
  // log.debug(F, `Start type: ${experienceData.type} | level: ${experienceData.level} | level_points: ${experienceData.level_points} | total_points: ${experienceData.total_points}`);

  // If the user has no experience, insert it, and we're done here
  if (!experienceData) {
    // log.debug(F, 'Inserting new experience');
    // log.debug(F, `experienceDataInsert: ${JSON.stringify(experienceData, null, 2)}`);
    await experienceUpdate({
      user_id: userData.id,
      category: experienceCategory,
      type: 'TEXT' as ExperienceCategory,
      level_points: expPoints,
      total_points: expPoints,
      last_message_at: new Date(),
      last_message_channel: message.channel.id,
      level: 0,
    } as UserExperience);
    // Give the user the VIP 0 role the first time they talk
    const role = await message.guild?.roles.fetch(env.ROLE_VIP_0) as Role;
    await message.member?.roles.add(role);
    return;
  }

  // If the user has experience, heck if the message happened in the last minute
  // log.debug(F, `lastMessageAt: ${experienceData.last_message_at}`);
  const lastMessageDate = DateTime.fromJSDate(experienceData.last_message_at);

  const currentDate = DateTime.now();
  const diff = currentDate.diff(lastMessageDate).toObject();
  // log.debug(F, `diff: ${JSON.stringify(diff)}`);

  if (diff.milliseconds && diff.milliseconds < bufferTime) {
    // log.debug(F, `Message sent by a user in the last minute`);
    return;
  }

  // If the time diff is over one bufferTime, increase the experience points
  experienceData.level_points += expPoints;
  experienceData.total_points += expPoints;

  // Determine how many exp points are needed to level up
  const expToLevel = await expForNextLevel(experienceData.level);

  if (expToLevel < experienceData.level_points) {
    experienceData.level += 1;
    const channelTripbotlogs = await message.guild.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
    const categoryName = experienceCategory.charAt(0).toUpperCase() + experienceCategory.slice(1).toLowerCase(); // eslint-disable-line max-len
    await channelTripbotlogs.send(stripIndents`${message.member.displayName} has leveled up to ${categoryName} level ${experienceData.level}!`);
    log.debug(F, `${message.author.username} has leveled up to ${categoryName} level ${experienceData.level}!`);

    if (experienceData.level % 10 === 0) {
      let id = '' as string;
      // log.debug(F, `experienceType: ${experienceType}`);
      if (experienceCategory === 'GENERAL' as ExperienceType) {
        id = env.CHANNEL_LOUNGE;
      } else if (experienceCategory === 'TRIPSITTER' as ExperienceType) {
        id = env.CHANNEL_TRIPSITMETA;
      } else if (experienceCategory === 'DEVELOPER' as ExperienceType) {
        id = env.CHANNEL_DEVELOPMENT;
      } else if (experienceCategory === 'TEAM' as ExperienceType) {
        id = env.CHANNEL_TEAMTRIPSIT;
      }
      const channel = await message.guild.channels.fetch(id) as TextChannel;
      const emojis = [...announcementEmojis].sort(() => 0.5 - Math.random()).slice(0, 3); // Sort the array
      await channel.send(`${emojis} **${message.member} has reached ${experienceCategory} level ${experienceData.level}!** ${emojis}`);
    }

    experienceData.level_points -= expToLevel;
  }

  log.debug(F, `${message.author.username} +${expPoints} (${experienceData.level_points}/${expToLevel}>${experienceData.level}) ${experienceCategory} = ${message.channel.name}`);

  experienceData.last_message_at = new Date();
  experienceData.last_message_channel = message.channel.id;

  // Get the current experience data before updating
  // So we can determine the total exp if if they leveled up
  const allExpData = await experienceGet(1, undefined, undefined, userData.id);
  await experienceUpdate(experienceData);
  // Dont move the above calls out of order!!!

  // Calculate total experience points
  const totalExp = allExpData
    .filter(exp => exp.type !== 'VOICE' && exp.category !== 'TOTAL' && exp.category !== 'IGNORED')
    .reduce((acc, exp) => acc + exp.total_points, 0);

  // Pretend that the total exp would get the same exp as the category
  // Get the total level
  const totalData = await getTotalLevel(totalExp + expPoints);

  // log.debug(F, `totalData: ${JSON.stringify(totalData, null, 2)}`);

  // Determine the first digit of the level
  const levelTier = Math.floor(totalData.level / 10);

  // Try to give the appropriate role
  await giveMilestone(message, levelTier);
}

async function giveMilestone(
  message:Message,
  levelTier:number,
) {
  // get three random emojis from announcementEmojis
  const emojis = [...announcementEmojis].sort(() => 0.5 - Math.random()).slice(0, 3); // Sort the array

  const roleDefs = {
    0: {
      message: '',
      role: env.ROLE_VIP_0 as string,
    },
    1: {
      message: `${emojis} **${message.member} has reached level 10!** ${emojis}`,
      role: env.ROLE_VIP_1 as string,
    },
    2: {
      message: `${emojis} **${message.member} has reached level 20!** ${emojis}`,
      role: env.ROLE_VIP_2 as string,
    },
    3: {
      message: `${emojis} **${message.member} has reached level 30!** ${emojis}`,
      role: env.ROLE_VIP_3 as string,
    },
    4: {
      message: `${emojis} **${message.member} has reached level 40!** ${emojis}`,
      role: env.ROLE_VIP_4 as string,
    },
    5: {
      message: `${emojis} **${message.member} has reached level 50!** ${emojis}`,
      role: env.ROLE_VIP_5 as string,
    },
    6: {
      message: `${emojis} **${message.member} has reached level 60!** ${emojis}`,
      role: env.ROLE_VIP_6 as string,
    },
    7: {
      message: `${emojis} **${message.member} has reached level 70!** ${emojis}`,
      role: env.ROLE_VIP_7 as string,
    },
    8: {
      message: `${emojis} **${message.member} has reached level 80!** ${emojis}`,
      role: env.ROLE_VIP_8 as string,
    },
    9: {
      message: `${emojis} **${message.member} has reached level 90!** ${emojis}`,
      role: env.ROLE_VIP_9 as string,
    },
    10: {
      message: `${emojis} **${message.member} has reached level 100!** ${emojis}`,
      role: env.ROLE_VIP_10 as string,
    },
  };

  // log.debug(F, `LevelTier: ${levelTier}`);

  const role = await message.guild?.roles.fetch(roleDefs[levelTier as keyof typeof roleDefs].role) as Role;

  // log.debug(F, `Role: ${role.name} (${role.id})`);

  if (levelTier >= 1) {
    const previousRole = await message.guild?.roles.fetch(
      roleDefs[(levelTier - 1) as keyof typeof roleDefs].role,
    ) as Role;
    // log.debug(F, `Previous role: ${previousRole.name} (${previousRole.id})`);
    if (message.member?.roles.cache.has(previousRole.id)) {
      log.debug(F, `Removing ${message.member} role ${previousRole.name} (${previousRole.id})`);
      message.member?.roles.remove(previousRole);
    }
  }

  // Check if the member already has the resulting role, and if not, add it
  if (!message.member?.roles.cache.has(role.id)) {
    log.debug(F, `Giving ${message.member} role ${role.name} (${role.id})`);
    await message.member?.roles.add(role);
    if (levelTier >= 2) {
      const channel = await message.guild?.channels.fetch(env.CHANNEL_VIPLOUNGE) as TextChannel;
      await channel.send(`${emojis} **${message.member} has reached TOTAL level ${levelTier}0!** ${emojis}`);
    }
  }
}

async function getCategory(channel:TextChannel):Promise<ExperienceType> {
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

export async function getTotalLevel(
  totalExp:number,
):Promise<Omit<UserExperience, 'id' | 'user_id' | 'type' | 'category' | 'total_points' | 'last_message_at' | 'last_message_channel' | 'created_at'>> {
  // log.debug('totalLevel', `totalExp: ${totalExp}`);
  let level = 0;
  let levelPoints = totalExp;
  let expToLevel = await expForNextLevel(level);
  while (levelPoints >= expToLevel) {
    // log.debug(F, `Level ${level} with ${levelPoints} experience points has ${expToLevel} points to level up`);
    level += 1;
    // log.debug(F, `Incremented level to ${level}`);
    const newExpToLevel = await expForNextLevel(level); // eslint-disable-line no-await-in-loop
    levelPoints -= expToLevel;
    // log.debug(F, `Now needs ${newExpToLevel} to get level ${level} and has ${levelPoints} experience points`);
    expToLevel = newExpToLevel;
  }
  // log.debug(F, `END: totalLevel: ${level} | levelPoints: ${levelPoints} | expToLevel: ${expToLevel}`);
  return { level, level_points: levelPoints };
}

export async function expForNextLevel(
  level:number,
):Promise<number> {
  // This is a simple formula, making sure it's standardized across the system
  return 5 * (level ** 2) + (50 * level) + 100;
}

const announcementEmojis = [
  '🎉',
  '🎊',
  '🎈',
  '🎁',
  '🎆',
  '🎇',
];
