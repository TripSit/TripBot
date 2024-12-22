/* eslint-disable max-len */

import {
  TextChannel,
  Role,
  VoiceChannel,
  GuildMember,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import {
  experience_category, experience_type, user_experience,
} from '@prisma/client';

const F = f(__filename); // eslint-disable-line

export default experience;

// Get random value between 15 and 25
const expPoints = env.NODE_ENV === 'production'
  ? Math.floor(Math.random() * (25 - 15 + 1)) + 15
  : 30;

// Value in milliseconds (1000 * 60 = 1 minute)
const textExpInterval = env.NODE_ENV === 'production' ? 1000 * 60 * 1 : 1000 * 1;
const voiceExpInterval = env.NODE_ENV === 'production' ? 1000 * 60 * 2 : 1000 * 5;

const announcementEmojis = [
  '🎉',
  '🎊',
  '🎈',
  '🎁',
  '🎆',
  '🎇',
];

export async function expForNextLevel(level: number): Promise<number> {
  // This is a simple formula, making sure it's standardized across the system
  return 5 * (level ** 2) + (50 * level) + 100;
}

export async function findXPfromLevel(level: number): Promise<number> {
  let totalXP = 0;

  const xpPromises = [];
  for (let currentLevel = 1; currentLevel < level; currentLevel += 1) {
    xpPromises.push(expForNextLevel(currentLevel));
  }
  const xpResults = await Promise.all(xpPromises);
  totalXP = xpResults.reduce((acc, xp) => acc + xp, 0);

  return totalXP;
}

export async function getTotalLevel(
  totalExp:number,
):Promise<{ level: number, level_points: number }> {
// ):Promise<Omit<UserExperience, 'id' | 'user_id' | 'type' | 'category' | 'total_points' | 'last_message_at' | 'last_message_channel' | 'created_at'>> {
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

export async function giveMilestone(
  member:GuildMember,
) {
  const userData = await db.users.upsert({
    where: {
      discord_id: member.id,
    },
    create: {
      discord_id: member.id,
    },
    update: {},
  });

  const allExpData = await db.user_experience.findMany({
    where: {
      user_id: userData.id,
    },
  });

  // Calculate total experience points
  const totalExp = allExpData
    .filter(exp => exp.category !== 'TOTAL'
      && exp.category !== 'IGNORED')
    .reduce((acc, exp) => acc + exp.total_points, 0);

  // get three random emojis from announcementEmojis
  const emojis = [...announcementEmojis].sort(() => 0.5 - Math.random()).slice(0, 3); // Sort the array

  // Pretend that the total exp would get the same exp as the category
  // Get the total level
  const totalData = await getTotalLevel(totalExp);
  // log.debug(F, `${member.displayName} is total Text level ${totalData.level}`);

  // Determine the first digit of the level
  const levelTier = Math.floor(totalData.level / 10);
  // log.debug(F, `levelTier: ${levelTier}`);

  const roleDefs = {
    0: {
      message: '',
      role: env.ROLE_VIP_0 as string,
    },
    1: {
      message: `${emojis} **${member} has reached level 10!** ${emojis}`,
      role: env.ROLE_VIP_10 as string,
    },
    2: {
      message: `${emojis} **${member} has reached level 20!** ${emojis}`,
      role: env.ROLE_VIP_20 as string,
    },
    3: {
      message: `${emojis} **${member} has reached level 30!** ${emojis}`,
      role: env.ROLE_VIP_30 as string,
    },
    4: {
      message: `${emojis} **${member} has reached level 40!** ${emojis}`,
      role: env.ROLE_VIP_40 as string,
    },
    5: {
      message: `${emojis} **${member} has reached level 50!** ${emojis}`,
      role: env.ROLE_VIP_50 as string,
    },
    6: {
      message: `${emojis} **${member} has reached level 60!** ${emojis}`,
      role: env.ROLE_VIP_60 as string,
    },
    7: {
      message: `${emojis} **${member} has reached level 70!** ${emojis}`,
      role: env.ROLE_VIP_70 as string,
    },
    8: {
      message: `${emojis} **${member} has reached level 80!** ${emojis}`,
      role: env.ROLE_VIP_80 as string,
    },
    9: {
      message: `${emojis} **${member} has reached level 90!** ${emojis}`,
      role: env.ROLE_VIP_90 as string,
    },
    10: {
      message: `${emojis} **${member} has reached level 100!** ${emojis}`,
      role: env.ROLE_VIP_100 as string,
    },
  };

  // log.debug(F, `LevelTier: ${levelTier}`);
  const role = await member.guild?.roles.fetch(roleDefs[levelTier as keyof typeof roleDefs].role) as Role;
  // log.debug(F, `Role: ${role.name} (${role.id})`);

  if (levelTier >= 1) {
    // Get a list of roleDefs below the users current tier
    const previousRoles = Object.keys(roleDefs)
      .filter(key => Number(key) < levelTier)
      .map(key => roleDefs[parseInt(key, 10) as keyof typeof roleDefs].role);

    // Remove all previous roles
    previousRoles.forEach(async previousRole => {
      const removeRole = await member.guild?.roles.fetch(previousRole) as Role;
      if (member.roles.cache.has(removeRole.id)) {
        // log.debug(F, `Removing ${member.displayName} role ${removeRole.name} (${removeRole.id})`);
        member.roles.remove(removeRole);
      }
    });

    // const previousRole = await member.guild?.roles.fetch(
    //   roleDefs[(levelTier - 1) as keyof typeof roleDefs].role,
    // ) as Role;
    // // log.debug(F, `Previous role: ${previousRole.name} (${previousRole.id})`);
    // if (member?.roles.cache.has(previousRole.id)) {
    // log.debug(F, `Removing ${member} role ${previousRole.name} (${previousRole.id})`);
    //   member?.roles.remove(previousRole);
    // }
    // Check if the member already has the resulting role, and if not, add it
  }
  if (!member.roles.cache.has(role.id)) {
    // log.debug(F, `Giving ${member.displayName} role ${role.name} (${role.id})`);
    await member.roles.add(role);
    if (levelTier >= 2) {
      const channel = await member.guild?.channels.fetch(env.CHANNEL_VIPLOUNGE) as TextChannel;
      await channel.send(`${emojis} **${member} has reached Total level ${levelTier}0!** ${emojis}`);
    }
  }
}

/**
 * This takes a message and gives the user experience
 * @param {Message} message The message object to check
 */
export async function experience(
  member:GuildMember,
  category:experience_category,
  type:experience_type,
  channel: TextChannel | VoiceChannel,
) {
  const userData = await db.users.upsert({
    where: {
      discord_id: member.id,
    },
    create: {
      discord_id: member.id,
    },
    update: {},
  });

  // log.debug(F, `userData: ${JSON.stringify(userData, null, 2)}`);

  const experienceData = await db.user_experience.findFirst({
    where: {
      user_id: userData.id,
      category,
      type,
    },
  });

  // If the user has no experience, insert it, and we're done here
  if (!experienceData) {
    // const expToLevel = await expForNextLevel(0);

    // log.debug(F, 'Inserting new experience');
    // log.debug(F, `experienceDataInsert: ${JSON.stringify(experienceData, null, 2)}`);
    const newUser = {
      user_id: userData.id,
      category,
      type,
      level: 0,
      level_points: expPoints,
      total_points: expPoints,
      last_message_at: new Date(),
      last_message_channel: channel.id,
    } as user_experience;
    // log.debug(F, `Adding new user to voice exp table: ${JSON.stringify(newUser)}`);
    // log.debug(
    //   F,
    //   `[${channel.name}] ${member.displayName}: 0 + ${expPoints} = ${expPoints} / ${expToLevel} > 1`, // eslint-disable-line max-len
    // );
    // await experienceUpdate(newUser);
    await db.user_experience.create({
      data: newUser,
    });
    if (type === 'TEXT') {
      // Give the user the VIP 0 role the first time they talk
      const role = await channel.guild?.roles.fetch(env.ROLE_VIP_0) as Role;
      await member.roles.add(role);
    }
    return;
  }

  // Store how many points the user has right now for later use
  // const origPoints = experienceData.level_points;

  const expInterval = type === 'TEXT' ? textExpInterval : voiceExpInterval;

  // Determine how many exp points are needed to level up
  const expToLevel = await expForNextLevel(experienceData.level);

  // If the user has been awarded voice exp in the last 5 minutes, do nothing
  if (experienceData.last_message_at.getTime() + expInterval > new Date().getTime()) {
    // log.debug(F, `[${channel.name}] ${member.displayName} has already been given experience recently!`);
    return;
  }
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase(); // eslint-disable-line max-len
  const typeName = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();

  // If the time diff is over one bufferTime, increase the experience points
  experienceData.level_points += expPoints;
  experienceData.total_points += expPoints;

  // log.debug(F, `${member.displayName} earned ${expPoints} ${experienceData.type} exp, has ${experienceData.level_points} of ${expToLevel} to reach lvl ${experienceData.level + 1}`);

  if (expToLevel <= experienceData.level_points) {
    experienceData.level += 1;
    const channelTripbotLogs = await channel.guild.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
    await channelTripbotLogs.send(stripIndents`${member.displayName} has leveled up to ${categoryName} ${typeName} level ${experienceData.level}!`);
    // log.debug(F, `${member.displayName} has leveled up to ${categoryName} ${typeName} level ${experienceData.level}!`);
    experienceData.level_points -= expToLevel;

    if (experienceData.level % 10 === 0) {
      let id = '' as string;
      // log.debug(F, `category: ${category}`);
      // log.debug(F, `experienceCategory: ${experienceCategory}`);
      if (category === 'GENERAL' as experience_category) {
        id = env.CHANNEL_LOUNGE;
      } else if (category === 'TRIPSITTER' as experience_category) {
        id = env.CHANNEL_TRIPSITMETA;
      } else if (category === 'DEVELOPER' as experience_category) {
        id = env.CHANNEL_DEVELOPMENT;
      } else if (category === 'TEAM' as experience_category) {
        id = env.CHANNEL_TEAMTRIPSIT;
      } else if (category === 'IGNORED' as experience_category) {
        id = env.CHANNEL_BOTSPAM;
      }
      // log.debug(F, `id: ${id}`);
      const announceChannel = await channel.guild.channels.fetch(id) as TextChannel;
      const emojis = [...announcementEmojis].sort(() => 0.5 - Math.random()).slice(0, 3); // Sort the array
      await announceChannel.send(`${emojis} **${member} has reached ${categoryName} ${typeName} level ${experienceData.level}!** ${emojis}`);
    }
  }

  experienceData.last_message_at = new Date();
  experienceData.last_message_channel = channel.id;

  await db.user_experience.update({
    where: {
      id: experienceData.id,
    },
    data: {
      level: experienceData.level,
      level_points: experienceData.level_points,
      total_points: experienceData.total_points,
      last_message_at: experienceData.last_message_at,
      last_message_channel: experienceData.last_message_channel,
    },
  });

  // Try to give the appropriate role
  await giveMilestone(member);
}
