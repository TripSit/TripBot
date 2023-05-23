import { GuildMember, Role, TextChannel } from 'discord.js';
import { stripIndents } from 'common-tags';
import {
  GuildMemberUpdateEvent,
} from '../@types/eventDef';
import { database } from '../../global/utils/knex';
import { topic } from '../../global/commands/g.topic';

type MindsetNames =
| 'ROLE_DRUNK'
| 'ROLE_HIGH'
| 'ROLE_ROLLING'
| 'ROLE_TRIPPING'
| 'ROLE_DISSOCIATING'
| 'ROLE_STIMMING'
| 'ROLE_SEDATED'
| 'ROLE_TALKATIVE'
| 'ROLE_VOICECHATTY';

const mindsetRoles = {
  ROLE_DRUNK: env.ROLE_DRUNK,
  ROLE_HIGH: env.ROLE_HIGH,
  ROLE_ROLLING: env.ROLE_ROLLING,
  ROLE_TRIPPING: env.ROLE_TRIPPING,
  ROLE_DISSOCIATING: env.ROLE_DISSOCIATING,
  ROLE_STIMMING: env.ROLE_STIMMING,
  ROLE_SEDATED: env.ROLE_SEDATED,
  ROLE_TALKATIVE: env.ROLE_TALKATIVE,
  ROLE_VOICECHATTY: env.ROLE_VOICECHATTY,
} as {
  [key in MindsetNames]: string;
};

type TeamMindsetNames =
| 'ROLE_TTS_DRUNK'
| 'ROLE_TTS_HIGH'
| 'ROLE_TTS_ROLLING'
| 'ROLE_TTS_TRIPPING'
| 'ROLE_TTS_DISSOCIATING'
| 'ROLE_TTS_STIMMING'
| 'ROLE_TTS_SEDATED'
| 'ROLE_TTS_TALKATIVE'
| 'ROLE_TTS_VOICECHATTY';

const TTSMindsetRoles = {
  ROLE_TTS_DRUNK: env.ROLE_TTS_DRUNK,
  ROLE_TTS_HIGH: env.ROLE_TTS_HIGH,
  ROLE_TTS_ROLLING: env.ROLE_TTS_ROLLING,
  ROLE_TTS_TRIPPING: env.ROLE_TTS_TRIPPING,
  ROLE_TTS_DISSOCIATING: env.ROLE_TTS_DISSOCIATING,
  ROLE_TTS_STIMMING: env.ROLE_TTS_STIMMING,
  ROLE_TTS_SEDATED: env.ROLE_TTS_SEDATED,
  ROLE_TTS_TALKATIVE: env.ROLE_TTS_TALKATIVE,
  ROLE_TTS_VOICECHATTY: env.ROLE_TTS_VOICECHATTY,
} as {
  [key in TeamMindsetNames]: string;
};

// type ColorNames =
// | 'ROLE_RED'
// | 'ROLE_ORANGE'
// | 'ROLE_YELLOW'
// | 'ROLE_GREEN'
// | 'ROLE_BLUE'
// | 'ROLE_PURPLE'
// | 'ROLE_PINK'
// | 'ROLE_WHITE';

// const colorRoles = {
//   ROLE_RED: env.ROLE_RED,
//   ROLE_ORANGE: env.ROLE_ORANGE,
//   ROLE_YELLOW: env.ROLE_YELLOW,
//   ROLE_GREEN: env.ROLE_GREEN,
//   ROLE_BLUE: env.ROLE_BLUE,
//   ROLE_PURPLE: env.ROLE_PURPLE,
//   ROLE_PINK: env.ROLE_PINK,
//   ROLE_WHITE: env.ROLE_WHITE,
// } as {
//   [key in ColorNames]: string;
// };

type DonorColorNames =
| 'ROLE_DONOR_RED'
| 'ROLE_DONOR_ORANGE'
| 'ROLE_DONOR_YELLOW'
| 'ROLE_DONOR_GREEN'
| 'ROLE_DONOR_BLUE'
| 'ROLE_DONOR_PURPLE'
| 'ROLE_DONOR_BLACK'
| 'ROLE_DONOR_PINK';

const donorColorRoles = {
  ROLE_DONOR_RED: env.ROLE_DONOR_RED,
  ROLE_DONOR_ORANGE: env.ROLE_DONOR_ORANGE,
  ROLE_DONOR_YELLOW: env.ROLE_DONOR_YELLOW,
  ROLE_DONOR_GREEN: env.ROLE_DONOR_GREEN,
  ROLE_DONOR_BLUE: env.ROLE_DONOR_BLUE,
  ROLE_DONOR_PURPLE: env.ROLE_DONOR_PURPLE,
  ROLE_DONOR_BLACK: env.ROLE_DONOR_BLACK,
  ROLE_DONOR_PINK: env.ROLE_DONOR_PINK,
} as {
  [key in DonorColorNames]: string;
};

type DonorNames =
| 'ROLE_BOOSTER'
| 'ROLE_PATRON';

const donorRoles = {
  ROLE_BOOSTER: env.ROLE_BOOSTER,
  ROLE_PATRON: env.ROLE_PATRON,
} as {
  [key in DonorNames]: string;
};

const F = f(__filename);

async function donorColorCheck(
  newMember: GuildMember,
  oldMember: GuildMember,
  roleId: string,
) {
  // Check if the id matches a colorRole
  if (Object.values(donorColorRoles).includes(roleId)) {
    // log.debug(F, `donor color role added: ${roleId}`);
    // If it does, check if the user also has a donor role
    if (oldMember.roles.cache.has(env.ROLE_BOOSTER) || oldMember.roles.cache.has(env.ROLE_PATRON)) {
      log.debug(F, 'Donor added a color role!');
    } else {
      // If they don't, remove the color role
      log.debug(F, 'User added a color role without being a donor!');
      const role = await newMember.guild.roles.fetch(roleId);
      if (role) {
        log.debug(F, `Removing ${role.name} from ${newMember.displayName}`);
        await newMember.roles.remove(role);
        log.debug(F, `Removed ${role.name} from ${newMember.displayName}`);
      }
    }
  }
}

async function donorColorRemove(
  newMember: GuildMember,
  roleId: string,
) {
  // log.debug(F, `donor color role removed: ${roleId}`);
  // log.debug(F, `${Object.keys(donorRoles)}`);
  // Check if it's a donor role
  if (Object.values(donorRoles).includes(roleId)) {
    // log.debug(F, `donor role removed: ${roleId}`);
    // If it does, check if the user also has a role id matching a donorColorRole and if so, remove it
    const donorColorRole = newMember.roles.cache.find(role => Object.values(donorColorRoles).includes(role.id));
    if (donorColorRole) {
      await newMember.roles.remove(donorColorRole);
    }
  }
}

async function teamMindsetCheck(
  newMember: GuildMember,
  roleId: string,
) {
  // Check if the id matches a mindsetRole
  if (Object.values(mindsetRoles).includes(roleId)
      && newMember.roles.cache.has(env.ROLE_TEAMTRIPSIT)) {
    // log.debug(F, `mindset role added: ${roleId}`);
    // If it does, check if the user also has team tripsit role
    // If so, replace the mindset role with the TTS equivalent
    log.debug(F, 'User added a mindset role while being a TTS!');

    // Go through the mindsetRoles and find the object matching roleId
    const mindsetData = Object.entries(mindsetRoles).find(async ([, value]) => {
      log.debug(F, `value: ${value}`);
      log.debug(F, `roleId: ${roleId}`);
      return value === roleId;
    });

    if (mindsetData) {
      const [key] = mindsetData;
      // The target ID matches the current mindsetRole object
      log.debug(F, `User Mindset role: ${key}`);
      // Change "ROLE_" to "ROLE_TTS" in the .env name
      const ttsMindsetName = key.replace('ROLE_', 'ROLE_TTS_') as TeamMindsetNames;
      log.debug(F, `TTS mindset name: ${ttsMindsetName}`);
      // Find the role in the TTSMindsetRoles object
      const ttsMindsetRoleId = TTSMindsetRoles[ttsMindsetName];
      log.debug(F, `TTS mindset role: ${ttsMindsetRoleId}`);
      // Get the role from the guild
      const role = await newMember.guild.roles.fetch(ttsMindsetRoleId) as Role;
      // Add the role to the user
      newMember.roles.add(role);
    }
  }
}

async function teamMindsetRemove(
  newMember: GuildMember,
  roleId: string,
) {
  // Check if it's a mindsetRole
  if (Object.values(mindsetRoles).includes(roleId)
    && newMember.roles.cache.has(env.ROLE_TEAMTRIPSIT)) {
    // Remove all TTS mindsets
    // Check if the member has any of the TTSmindsetRoles
    const mindsetData = Object.entries(mindsetRoles).find(async ([, value]) => value === roleId);

    if (mindsetData) {
      const [key] = mindsetData;
      // The target ID matches the current mindsetRole object
      log.debug(F, `User Mindset role: ${key}`);
      // Change "ROLE_" to "ROLE_TTS" in the .env name
      const ttsMindsetName = key.replace('ROLE_', 'ROLE_TTS_') as TeamMindsetNames;
      log.debug(F, `TTS mindset name: ${ttsMindsetName}`);
      // Find the role in the TTSMindsetRoles object
      const ttsMindsetRoleId = TTSMindsetRoles[ttsMindsetName];
      log.debug(F, `TTS mindset role: ${ttsMindsetRoleId}`);
      // Get the role from the guild
      const role = await newMember.guild.roles.fetch(ttsMindsetRoleId) as Role;
      // Add the role to the user
      newMember.roles.remove(role);
    }
  }
}

async function removeExTeamFromThreads(
  newMember: GuildMember,
  roleId: string,
) {
  const guildData = await database.guilds.get(newMember.guild.id);
  // If the role removed was a helper/tripsitter role, we need to remove them from threads they are in
  if (guildData.channel_tripsit
      && (roleId === guildData.role_helper
          || roleId === guildData.role_tripsitter
      )
  ) {
    log.debug(F, `${newMember.displayName} was a helper/tripsitter!`);
    const channelTripsit = await discordClient.channels.fetch(guildData.channel_tripsit) as TextChannel;

    const fetchedThreads = await channelTripsit.threads.fetch();
    fetchedThreads.threads.forEach(async thread => {
      if (thread
                && thread.parentId === guildData.channel_tripsit) {
        log.debug(F, `Removing ${newMember.displayName} from ${thread.name}`);
        await thread.members.remove(newMember.id, 'Helper/Tripsitter role removed');
      }
    });
  }
}

async function addedVerified(
  newMember: GuildMember,
  roleId: string,
) {
  // Check if this was the verified role
  if (roleId === env.ROLE_VERIFIED) {
    // log.debug(F, `${newMember.displayName} verified!`);
    // let colorValue = 1;

    // log.debug(F, `member: ${member.roles.cache}`);

    // log.debug(`Verified button clicked by ${interaction.user.username}#${interaction.user.discriminator}`);
    const channelTripbotLogs = await global.discordClient.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
    await channelTripbotLogs.send({
      content: `Verified button clicked by ${newMember.user.username}#${newMember.user.discriminator}`,
    });

    // NOTE: Can be simplified with luxon
    // const diff = Math.abs(Date.now() - Date.parse(newMember.user.createdAt.toString()));
    // const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    // const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
    // const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
    // const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    // const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    // const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    // const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // if (years > 0) {
    //   colorValue = Colors.White;
    // } else if (years === 0 && months > 0) {
    //   colorValue = Colors.Purple;
    // } else if (months === 0 && weeks > 0) {
    //   colorValue = Colors.Blue;
    // } else if (weeks === 0 && days > 0) {
    //   colorValue = Colors.Green;
    // } else if (days === 0 && hours > 0) {
    //   colorValue = Colors.Yellow;
    // } else if (hours === 0 && minutes > 0) {
    //   colorValue = Colors.Orange;
    // } else if (minutes === 0 && seconds > 0) {
    //   colorValue = Colors.Red;
    // }
    // log.debug(F, `coloValue: ${colorValue}`);
    // const channelStart = await newMember.client.channels.fetch(env.CHANNEL_START);
    // const channelTechhelp = await newMember.client.channels.fetch(env.CHANNEL_HELPDESK);
    // const channelBotspam = await newMember.client.channels.fetch(env.CHANNEL_BOTSPAM);
    // const channelRules = await newMember.client.channels.fetch(env.CHANNEL_RULES);
    // const channelTripsit = await member.client.channels.fetch(CHANNEL_TRIPSIT);
    // const embed = embedTemplate()
    //   .setAuthor(null)
    //   .setColor(colorValue)
    //   .setThumbnail(newMember.user.displayAvatarURL())
    //   .setFooter(null)
    //   .setDescription(stripIndents`
    //             **Please welcome ${newMember.toString()} to the guild!**
    //             Be safe, have fun, /report any issues!`);

    const greetingList = [
      `Welcome to the guild, ${newMember}!`,
      `I'm proud to announce that ${newMember} has joined our guild!`,
      `Please welcome ${newMember} to our guild!`,
      `Hello, ${newMember}! Welcome to our guild!`,
      `Welcome to the family, ${newMember}! We're so glad you're here.`,
      `Welcome to the guild, ${newMember}!`,
      `We're excited to have ${newMember} as part of our guild!`,
      `Say hello to our newest member, ${newMember}!`,
      `Let's give a warm welcome to ${newMember}!`,
      `It's great to see you here, ${newMember}!`,
      `Welcome aboard, ${newMember}!`,
      `We're happy to have ${newMember} join us!`,
      `Say hi to ${newMember}, our newest member!`,
      `Join us in welcoming ${newMember} to our guild!`,
      `A big welcome to ${newMember}!`,
    ];

    const greeting = greetingList[Math.floor(Math.random() * greetingList.length)];

    const channelLounge = await newMember.client.channels.fetch(env.CHANNEL_LOUNGE) as TextChannel;
    await channelLounge.send({
      content: stripIndents`**${greeting}**
  
      Be safe, have fun, /report any issues!
      
      *${await topic()}*`,
    });
  }
}

async function addedBooster(
  newMember: GuildMember,
  roleId: string,
) {
  // Check if the role added was a donator role
  if (roleId === env.ROLE_BOOSTER) {
    // log.debug(F, `${newMember.displayName} boosted the server!`);
    const channelGoldlounge = await discordClient.channels.fetch(env.CHANNEL_GOLDLOUNGE) as TextChannel;
    await channelGoldlounge.send(`Hey @here, ${newMember} just boosted the server, give them a big thank you for helping to keep this place awesome!`); // eslint-disable-line max-len
  }
}

async function addedPatreon(
  newMember: GuildMember,
  roleId: string,
) {
  // Check if the role added was a donator role
  if (roleId === env.ROLE_PATRON) {
    // log.debug(F, `${newMember.displayName} became a patron!`);
    const channelGoldlounge = await discordClient.channels.fetch(env.CHANNEL_GOLDLOUNGE) as TextChannel;
    const isProd = env.NODE_ENV === 'production';
    await channelGoldlounge.send(`Hey ${isProd ? '@here' : 'here'}, ${newMember} just became a patron, give them a big thank you for helping us keep the lights on and expand!`); // eslint-disable-line max-len
  }
}

async function roleAddProcess(
  newMember: GuildMember,
  oldMember: GuildMember,
  rolesAdded: string[],
) {
  // This goes here because we don't really care when other guilds add roles
  if (newMember.guild.id !== env.DISCORD_GUILD_ID) return;
  // log.debug(F, `roles added: ${rolesAdded}`);

  const auditlog = await discordClient.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;

  // Go through each role added
  rolesAdded.forEach(async roleId => {
    await donorColorCheck(newMember, oldMember, roleId);
    await teamMindsetCheck(newMember, roleId);
    await addedVerified(newMember, roleId);
    await addedBooster(newMember, roleId);
    await addedPatreon(newMember, roleId);

    const role = await newMember.guild.roles.fetch(roleId) as Role;
    await auditlog.send(`${newMember.displayName} added ${role.name}`);
  });
}

async function roleRemProcess(
  newMember: GuildMember,
  rolesRemoved: string[],
) {
  // This is commented out because we need to remove people from threads when they remove the tripsitter/helper roles
  // if (newMember.guild.id !== env.DISCORD_GUILD_ID) return;
  // log.debug(F, `roles removed: ${rolesRemoved}`);
  // Go through each role removed
  const auditlog = await discordClient.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;
  rolesRemoved.forEach(async roleId => {
    await removeExTeamFromThreads(newMember, roleId);
    // We don't want to run the rest of this on any other guild
    if (newMember.guild.id !== env.DISCORD_GUILD_ID) return;
    await teamMindsetRemove(newMember, roleId);
    await donorColorRemove(newMember, roleId);

    const role = await newMember.guild.roles.fetch(roleId) as Role;
    await auditlog.send(`${newMember.displayName} removed ${role.name}`);
  });
}

export const guildMemberUpdate: GuildMemberUpdateEvent = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    // log.info(F, `${oldMember} was updated`);
    // log.info(F, `${newMember} was created`);
    const oldRoles = oldMember.roles.cache.map(role => role.id);
    const newRoles = newMember.roles.cache.map(role => role.id);
    // log.debug(F, `oldRoles: ${oldRoles}`);
    // log.debug(F, `newRoles: ${newRoles}`);

    // If the oldRoles don't match the new roles
    if (oldRoles.toString() !== newRoles.toString()) {
      // log.debug(F, `roles changed on ${newMember.displayName}!`);

      // Find the difference between the two arrays
      const rolesAdded = newRoles.filter(x => !oldRoles.includes(x));
      if (rolesAdded.length > 0) {
        await roleAddProcess(newMember, oldMember, rolesAdded);
      }
      const rolesRemoved = oldRoles.filter(x => !newRoles.includes(x));
      if (rolesRemoved.length > 0) {
        log.debug(F, `${rolesRemoved.length} roles removed`);
        await roleRemProcess(newMember, rolesRemoved);
      }
    }
  },
};

export default guildMemberUpdate;
