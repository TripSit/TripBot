import {
  // Colors,
  Role,
  TextChannel,
  // Message,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import {
  GuildMemberUpdateEvent,
} from '../@types/eventDef';
// import embedTemplate from '../utils/embedTemplate';
// import {
//   ReactionRoleList,
// } from '../../global/@types/database';

const mindsetRoles = [
  env.ROLE_DRUNK,
  env.ROLE_HIGH,
  env.ROLE_ROLLING,
  env.ROLE_TRIPPING,
  env.ROLE_DISSOCIATING,
  env.ROLE_STIMMING,
  env.ROLE_SEDATED,
  env.ROLE_SOBER,
];

const TTSmindsetRoles = [
  env.ROLE_TTS_DRUNK,
  env.ROLE_TTS_HIGH,
  env.ROLE_TTS_ROLLING,
  env.ROLE_TTS_TRIPPING,
  env.ROLE_TTS_DISSOCIATING,
  env.ROLE_TTS_STIMMING,
  env.ROLE_TTS_SEDATED,
  env.ROLE_TTS_SOBER,
];

const colorRoles = [
  env.ROLE_RED,
  env.ROLE_ORANGE,
  env.ROLE_YELLOW,
  env.ROLE_GREEN,
  env.ROLE_BLUE,
  env.ROLE_PURPLE,
  env.ROLE_PINK,
  env.ROLE_WHITE,
];

const donorColorRoles = [
  env.ROLE_DONOR_RED,
  env.ROLE_DONOR_ORANGE,
  env.ROLE_DONOR_YELLOW,
  env.ROLE_DONOR_GREEN,
  env.ROLE_DONOR_BLUE,
  env.ROLE_DONOR_PURPLE,
  env.ROLE_DONOR_BLACK,
  env.ROLE_DONOR_PINK,
];

const donorRoles = [
  env.ROLE_BOOSTER,
  env.ROLE_PATRON,
];

const F = f(__filename);

export const guildMemberUpdate: GuildMemberUpdateEvent = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    // log.info(F, `${newMember} was updated`);
    const oldRoles = oldMember.roles.cache.map(role => role.id);
    const newRoles = newMember.roles.cache.map(role => role.id);

    // If the oldRoles don't match the new roles
    if (oldRoles.toString() !== newRoles.toString()) {
      // log.debug(F, `roles changed on ${newMember.displayName}!`);
      // log.debug(F, `oldRoles: ${oldRoles}`);
      // log.debug(F, `newRoles: ${newRoles}`);

      // Find the difference between the two arrays
      const rolesAdded = newRoles.filter(x => !oldRoles.includes(x));
      const rolesRemoved = oldRoles.filter(x => !newRoles.includes(x));
      if (rolesAdded.length > 0) {
        if (newMember.guild.id !== env.DISCORD_GUILD_ID) return;
        // log.debug(F, `roles added: ${rolesAdded}`);

        // Go through each role added
        rolesAdded.forEach(async roleId => {
          
          // Check if the id matches a colorRole
          if (donorColorRoles.includes(roleId)) {
            // log.debug(F, `donor color role added: ${roleId}`);
            // If it does, check if the user also has a donor role
            if (oldMember.roles.cache.has(env.ROLE_BOOSTER) || oldMember.roles.cache.has(env.ROLE_PATRON)) {
              log.debug(F, `Donor added a color role!`);
            }
            else {
              // If they don't, remove the color role
              log.debug(F, `User added a color role without being a donor!`);
              const role = newMember.guild.roles.cache.get(roleId);
              if (role) {
                await newMember.roles.remove(role);
              }
            }
          }
          // Check if the id matches a mindsetRole
          if (mindsetRoles.includes(roleId)) {
            // log.debug(F, `mindset role added: ${roleId}`);
            // If it does, check if the user also has team tripsit role
            if (oldMember.roles.cache.has(env.ROLE_TEAMTRIPSIT))
              // If so, replace the mindset role with the TTS equivalent
              log.debug(F, `User added a mindset role while being a TTS!`);

              // Find .env name of role using the mindsetRole table
              // Iterate through the mindsetRoles array
              for (const mindsetRole of mindsetRoles) {
                // Check if the current mindsetRole matches the target ID
                const userMindsetEnv = Object.keys(env).find((key) => env[key] === mindsetRole);
                if (mindsetRole === roleId) {
                  // The target ID matches the current mindsetRole object
                  log.debug(F, `User Mindset role: ${userMindsetEnv}`)
                  // Change "ROLE_" to "ROLE_TTS" in the .env name
                  let ttsMindsetEnv = userMindsetEnv!.replace("ROLE_", "ROLE_TTS_");
                  log.debug(F, `TTS mindset role: ${ttsMindsetEnv}`)
                  // Find the role in the guild
                  const ttsMindsetRole = oldMember.guild.roles.cache.get(env[ttsMindsetEnv]);
                  log.debug(F, `TTS mindset role load: ${ttsMindsetRole}`)
                  // If the role exists, add it to the user
                  if (ttsMindsetRole) {
                    await newMember.roles.add(ttsMindsetRole);
                  break; // Exit the loop since we found the desired object
                }
              }
            }
          }
        });
      }
      if (rolesRemoved.length > 0) {
        if (newMember.guild.id !== env.DISCORD_GUILD_ID) return;
        // log.debug(F, `roles removed: ${rolesRemoved}`);
        // Go through each role removed
        rolesRemoved.forEach(async roleId => {
          // Check if it's a mindsetRole
          if (mindsetRoles.includes(roleId) && newMember.roles.cache.has(env.ROLE_TEAMTRIPSIT)) {
            // Remove all TTS mindsets
            // Check if the member has any of the TTSmindsetRoles
            for (const mindsetRole of mindsetRoles) {
              // Check if the current mindsetRole matches the target ID
              const userMindsetEnv = Object.keys(env).find((key) => env[key] === mindsetRole);
              if (mindsetRole === roleId) {
                // The target ID matches the current mindsetRole object
                log.debug(F, `User Mindset role: ${userMindsetEnv}`)
                // Change "ROLE_" to "ROLE_TTS" in the .env name
                let ttsMindsetEnv = userMindsetEnv!.replace("ROLE_", "ROLE_TTS_");
                log.debug(F, `TTS mindset role: ${ttsMindsetEnv}`)
                // Find the role in the guild
                const ttsMindsetRole = oldMember.guild.roles.cache.get(env[ttsMindsetEnv]);
                log.debug(F, `TTS mindset role load: ${ttsMindsetRole}`)
                // If the role exists, add it to the user
                if (ttsMindsetRole) {
                  await newMember.roles.remove(ttsMindsetRole);
                break; // Exit the loop since we found the desired object
              }
            }
          }
          }

          // Check if it's a donor role
          if (donorRoles.includes(roleId)) {
            // log.debug(F, `donor role removed: ${roleId}`);
            // If it does, check if the user also has a role id matching a donorColorRole and if so, remove it
            const donorColorRole = donorColorRoles.find(role => newRoles.includes(role));
            if (donorColorRole) {
              log.debug(F, `Color role removed from ex-donor!`);
              const role = newMember.guild.roles.cache.get(donorColorRole);
              if (role) {
                await newMember.roles.remove(role);
              }
            }
          }
        });
      }

    }
  },
};
