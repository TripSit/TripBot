/* eslint-disable max-len */

import {
  experience_category, experience_type, user_experience,
} from '@db/tripbot';
import { stripIndents } from 'common-tags';
import {
  GuildMember,
  Role,
  TextChannel,
  VoiceChannel,
} from 'discord.js';
import { getOrCreateUser } from './dbRecords';

const F = f(__filename); // eslint-disable-line

export default experience;

export const MIN_EXPERIENCE_LEVEL = 0;
export const MAX_EXPERIENCE_LEVEL = 100;

// A random value between 15 and 25 for every award (a fixed 30 outside production), not one value per process
const rollExpPoints = () => (env.NODE_ENV === 'production'
  ? Math.floor(Math.random() * (25 - 15 + 1)) + 15
  : 30);

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
  frozenLevel?: number | null,
):Promise<{ level: number, level_points: number }> {
// ):Promise<Omit<UserExperience, 'id' | 'user_id' | 'type' | 'category' | 'total_points' | 'last_message_at' | 'last_message_channel' | 'created_at'>> {
  // log.debug('totalLevel', `totalExp: ${totalExp}`);

  // Level freeze is display-only: return the pinned level without computing the true one.
  if (frozenLevel !== undefined && frozenLevel !== null) {
    return { level: frozenLevel, level_points: await expForNextLevel(frozenLevel) };
  }

  let level = 0;
  let levelPoints = totalExp;
  let expToLevel = await expForNextLevel(level);
  while (levelPoints >= expToLevel) {
    level += 1;
    const newExpToLevel = await expForNextLevel(level); // eslint-disable-line no-await-in-loop
    levelPoints -= expToLevel;
    expToLevel = newExpToLevel;
  }

  return { level, level_points: levelPoints };
}

export async function getUserTotalLevel(discordId: string): Promise<number> {
  const userData = await db.users.findUnique({
    where: { discord_id: discordId },
    select: { user_experience: { select: { category: true, total_points: true } } },
  });
  if (!userData) {
    return 0;
  }

  const totalExp = userData.user_experience
    .filter(exp => exp.category !== 'TOTAL' && exp.category !== 'IGNORED')
    .reduce((acc, exp) => acc + exp.total_points, 0);

  return (await getTotalLevel(totalExp)).level;
}

export async function giveMilestone(
  member:GuildMember,
) {
  const userData = await getOrCreateUser(member.id);

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
  // Get the total level (always the TRUE level — a level freeze is display-only and must never
  // affect VIP roles, which also gate level-locked tent access).
  const totalData = await getTotalLevel(totalExp);

  // Determine the first digit of the level
  const levelTier = Math.floor(totalData.level / 10);

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

  const role = await member.guild?.roles.fetch(roleDefs[levelTier as keyof typeof roleDefs].role) as Role;

  if (levelTier >= 1) {
    // Get a list of roleDefs below the users current tier
    const previousRoles = Object.keys(roleDefs)
      .filter(key => Number(key) < levelTier)
      .map(key => roleDefs[parseInt(key, 10) as keyof typeof roleDefs].role);

    // Remove all previous roles
    previousRoles.forEach(async previousRole => {
      const removeRole = await member.guild?.roles.fetch(previousRole) as Role;
      if (member.roles.cache.has(removeRole.id)) {
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
    await member.roles.add(role);
    if (levelTier >= 2) {
      const channel = await member.guild?.channels.fetch(env.CHANNEL_VIPLOUNGE) as TextChannel;
      await channel.send(`${emojis} **${member} has reached Total level ${levelTier}0!** ${emojis}`);
    }
  }
}

/**
 * Send milestone announcement for a specific level
 */
async function sendMilestoneAnnouncement(
  member: GuildMember,
  channelId: string,
  level: number,
  categoryName: string,
  typeName: string,
): Promise<void> {
  const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
  const announceChannel = await guild.channels.fetch(channelId) as TextChannel;
  const emojis = [...announcementEmojis].sort(() => 0.5 - Math.random()).slice(0, 3);
  await announceChannel.send(
    `${emojis} **${member} has reached ${categoryName} ${typeName} level ${level}!** ${emojis}`,
  );
}

// Looked up at call time so the environment is read when it is needed
const milestoneChannel = (category: experience_category): string => ({
  GENERAL: env.CHANNEL_LOUNGE,
  TRIPSITTER: env.CHANNEL_TRIPSITMETA,
  DEVELOPER: env.CHANNEL_DEVELOPMENT,
  TEAM: env.CHANNEL_TEAMTRIPSIT,
  IGNORED: env.CHANNEL_BOTSPAM,
} as Partial<Record<experience_category, string>>)[category] ?? '';

/** Tells the bot log about a level-up, and the community on every tenth level. Never throws. */
async function announceLevelUp(
  member: GuildMember,
  channel: TextChannel | VoiceChannel,
  category: experience_category,
  type: experience_type,
  level: number,
) {
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  const typeName = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  try {
    const channelTripbotLogs = await channel.guild.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
    await channelTripbotLogs.send(stripIndents`${member.displayName} has leveled up to ${categoryName} ${typeName} level ${level}!`);
  } catch (err) {
    log.error(F, `Could not announce a level-up: ${err}`);
  }

  if (level % 10 === 0) {
    sendMilestoneAnnouncement(member, milestoneChannel(category), level, categoryName, typeName);
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
  const userData = await getOrCreateUser(member.id);

  const experienceData = await db.user_experience.findFirst({
    where: {
      user_id: userData.id,
      category,
      type,
    },
  });

  // If the user has no experience, insert it, and we're done here
  if (!experienceData) {
    const points = rollExpPoints();
    const newUser = {
      user_id: userData.id,
      category,
      type,
      level: 0,
      level_points: points,
      total_points: points,
      last_message_at: new Date(),
      last_message_channel: channel.id,
    } as user_experience;
    await db.user_experience.create({
      data: newUser,
    });
    return;
  }

  // Store how many points the user has right now for later use
  // const origPoints = experienceData.level_points;

  const expInterval = type === 'TEXT' ? textExpInterval : voiceExpInterval;

  // Determine how many exp points are needed to level up
  const expToLevel = await expForNextLevel(experienceData.level);

  // If the user has been awarded voice exp in the last 5 minutes, do nothing
  if (experienceData.last_message_at.getTime() + expInterval > new Date().getTime()) {
    return;
  }
  // If the time diff is over one bufferTime, increase the experience points
  const points = rollExpPoints();
  experienceData.level_points += points;
  experienceData.total_points += points;

  const leveledUp = expToLevel <= experienceData.level_points;
  if (leveledUp) {
    experienceData.level += 1;
    experienceData.level_points -= expToLevel;
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

  // Saved first: an announcement that cannot be sent must never cost the user their points or level
  if (leveledUp) {
    await announceLevelUp(member, channel, category, type, experienceData.level);
  }

  // Try to give the appropriate role
  await giveMilestone(member);
}

/**
 * Calculate how many levels a user will gain with given XP
 * This pre-calculates everything to avoid async issues
 */
async function calculateLevelUps(
  startLevel: number,
  totalLevelPoints: number,
): Promise<{ finalLevel: number; remainingPoints: number; levelsGained: number }> {
  let currentLevel = startLevel;
  let remainingPoints = totalLevelPoints;
  let levelsGained = 0;

  // Pre-calculate level requirements up to a reasonable limit
  const maxPossibleLevel = Math.min(startLevel + 50, 100); // Limit to prevent infinite loops
  const levelRequirements: number[] = [];

  for (let level = startLevel; level < maxPossibleLevel; level += 1) {
    // eslint-disable-next-line no-await-in-loop
    const requirement = await expForNextLevel(level);
    levelRequirements.push(requirement);
  }

  // Now calculate level ups without async calls
  let requirementIndex = 0;
  while (
    requirementIndex < levelRequirements.length
    && remainingPoints >= levelRequirements[requirementIndex]
    && currentLevel < 100
  ) {
    remainingPoints -= levelRequirements[requirementIndex];
    currentLevel += 1;
    levelsGained += 1;
    requirementIndex += 1;
  }

  return {
    finalLevel: currentLevel,
    remainingPoints,
    levelsGained,
  };
}

/**
 * Send all notifications for GitHub XP awards
 */
async function sendGitHubXPNotifications(
  member: GuildMember,
  channel: TextChannel | VoiceChannel,
  xpAmount: number,
  startLevel: number,
  endLevel: number,
  levelsGained: number,
  issueType?: string,
) {
  const categoryName = 'Developer';
  const typeName = 'Text';

  // Send to bot log channel
  const channelTripbotLogs = await channel.guild.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;

  const issueTypeText = issueType ? ` (${issueType} issue)` : '';

  if (levelsGained === 0) {
    await channelTripbotLogs.send(
      `${member.displayName} earned ${xpAmount.toLocaleString()} GitHub XP${issueTypeText}! Still level ${endLevel}.`,
    );
  } else if (levelsGained === 1) {
    await channelTripbotLogs.send(
      `${member.displayName} earned ${xpAmount.toLocaleString()} GitHub XP${issueTypeText} and leveled up to ${categoryName} ${typeName} level ${endLevel}!`,
    );
  } else {
    await channelTripbotLogs.send(
      `${member.displayName} earned ${xpAmount.toLocaleString()} GitHub XP${issueTypeText} and gained ${levelsGained} levels! Now ${categoryName} ${typeName} level ${endLevel}!`,
    );
  }

  // Check for milestone announcements (every 10 levels)
  const milestoneLevels: number[] = [];

  for (let level = startLevel + 1; level <= endLevel; level += 1) {
    if (level % 10 === 0) {
      milestoneLevels.push(level);
    }
  }

  // Create milestone announcement promises
  const milestonePromises = milestoneLevels.map(level => sendMilestoneAnnouncement(member, channel.id, level, categoryName, typeName));

  // Execute all milestone notifications concurrently
  if (milestonePromises.length > 0) {
    await Promise.all(milestonePromises);
  }
}

/**
 * Award XP specifically for GitHub contributions
 * This is separate from the normal experience system to avoid any conflicts or introduction of bugs
 * @param member The Discord member to award XP to
 * @param xpAmount The amount of XP to award
 * @param channel The channel to use for announcements
 * @param issueType Optional issue type for logging (easy, medium, hard, epic)
 */
export async function awardGitHubXP(
  member: GuildMember,
  xpAmount: number,
  channel: TextChannel,
  issueType?: string,
) {
  const userData = await getOrCreateUser(member.id);

  // Get or create developer experience record
  let experienceData = await db.user_experience.findFirst({
    where: {
      user_id: userData.id,
      category: 'DEVELOPER' as experience_category,
      type: 'TEXT' as experience_type,
    },
  });

  const isNewUser = !experienceData;

  // If user has no developer experience, create it
  experienceData ??= await db.user_experience.create({
    data: {
      user_id: userData.id,
      category: 'DEVELOPER' as experience_category,
      type: 'TEXT' as experience_type,
      level: 0,
      level_points: 0,
      total_points: 0,
      last_message_at: new Date(),
      last_message_channel: channel.id,
    },
  });

  // Calculate new totals
  const newLevelPoints = experienceData.level_points + xpAmount;
  const newTotalPoints = experienceData.total_points + xpAmount;

  // Calculate level ups
  const levelUpResult = await calculateLevelUps(
    experienceData.level,
    newLevelPoints,
  );

  // Update the database
  await db.user_experience.update({
    where: {
      id: experienceData.id,
    },
    data: {
      level: levelUpResult.finalLevel,
      level_points: levelUpResult.remainingPoints,
      total_points: newTotalPoints,
      last_message_at: new Date(),
      last_message_channel: channel.id,
    },
  });

  // Send notifications
  await sendGitHubXPNotifications(
    member,
    channel,
    xpAmount,
    experienceData.level,
    levelUpResult.finalLevel,
    levelUpResult.levelsGained,
    issueType,
  );

  // Give milestone role if applicable
  await giveMilestone(member);

  return {
    startLevel: experienceData.level,
    endLevel: levelUpResult.finalLevel,
    levelsGained: levelUpResult.levelsGained,
    xpAwarded: xpAmount,
    isNewUser,
  };
}
