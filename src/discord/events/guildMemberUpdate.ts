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
import { database } from '../../global/utils/knex';
import { topic } from '../../global/commands/g.topic';
// import {
//   ReactionRoleList,
// } from '../../global/@types/database';

// const mindsetRoles = [
//   env.ROLE_DRUNK,
//   env.ROLE_HIGH,
//   env.ROLE_ROLLING,
//   env.ROLE_TRIPPING,
//   env.ROLE_DISSOCIATING,
//   env.ROLE_STIMMING,
//   env.ROLE_SEDATED,
//   env.ROLE_SOBER,
// ];

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
        const auditlog = await discordClient.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;
        // log.debug(F, `roles added: ${rolesAdded}`);
        // Go through each role added, and check if it's a mindset role
        rolesAdded.forEach(async roleId => {
          // If the role added is a mindset role
          // if (env.MINDSET_ROLES.includes(roleId)) {

          //   const roleDrunk = await interaction.guild.roles.fetch(
          //     (reactionroleData.find(roleData => roleData.name === 'Drunk') as ReactionRoles).role_id,
          //   ) as Role;
          //   const roleHigh = await interaction.guild.roles.fetch(
          //     (reactionroleData.find(roleData => roleData.name === 'High') as ReactionRoles).role_id,
          //   ) as Role;
          //   const roleRolling = await interaction.guild.roles.fetch(
          //     (reactionroleData.find(roleData => roleData.name === 'Rolling') as ReactionRoles).role_id,
          //   ) as Role;
          //   const roleTripping = await interaction.guild.roles.fetch(
          //     (reactionroleData.find(roleData => roleData.name === 'Tripping') as ReactionRoles).role_id,
          //   ) as Role;
          //   const roleDissociating = await interaction.guild.roles.fetch(
          //     (reactionroleData.find(roleData => roleData.name === 'Dissociated') as ReactionRoles).role_id,
          //   ) as Role;
          //   const roleStimming = await interaction.guild.roles.fetch(
          //     (reactionroleData.find(roleData => roleData.name === 'Stimming') as ReactionRoles).role_id,
          //   ) as Role;
          //   const roleSedated = await interaction.guild.roles.fetch(
          //     (reactionroleData.find(roleData => roleData.name === 'Sedated') as ReactionRoles).role_id,
          //   ) as Role;
          //   const roleTalkative = await interaction.guild.roles.fetch(
          //     (reactionroleData.find(roleData => roleData.name === 'Talkative') as ReactionRoles).role_id,
          //   ) as Role;
          //   const roleWorking = await interaction.guild.roles.fetch(
          //     (reactionroleData.find(roleData => roleData.name === 'Working') as ReactionRoles).role_id,
          //   ) as Role;

          //   const mindsetRoles = [
          //     { name: roleDrunk.name, value: roleDrunk.id },
          //     { name: roleHigh.name, value: roleHigh.id },
          //     { name: roleRolling.name, value: roleRolling.id },
          //     { name: roleTripping.name, value: roleTripping.id },
          //     { name: roleDissociating.name, value: roleDissociating.id },
          //     { name: roleStimming.name, value: roleStimming.id },
          //     { name: roleSedated.name, value: roleSedated.id },
          //     { name: roleTalkative.name, value: roleTalkative.id },
          //     { name: roleWorking.name, value: roleWorking.id },
          //   ] as RoleDef[];

          //   // log.debug(F, `${newMember.displayName} ${action} ${roleName}`);
          //   const mindsetRole = await newMember.guild.roles.fetch(roleId) as Role;
          //   const channelMindset = await discordClient.channels.fetch(env.CHANNEL_MINDSET) as TextChannel;
          //   await channelMindset.send(`Hey @here, ${newMember} is ${mindsetRole.name}!`);

          //   log.debug(F, `Mindset roles: ${JSON.stringify(mindsetRoles, null, 2)}`);
          //   // const mindsetNames = mindsetRoles.map(role => role.name);
          //   const mindsetIds = mindsetRoles.map(roleData => roleData.value);

          //   // Remove the other mindset roles if you're adding a mindset role
          //   if (mindsetIds.includes(role.id)) {
          //     // log.debug(F, 'Removing other mindset roles');
          //     const otherMindsetRoles = mindsetIds.filter(r => r !== role.id);
          //     await target.roles.remove([...otherMindsetRoles]);
          //   }
          // }

          // Check if the role added was a donator role
          if (roleId === env.ROLE_BOOSTER) {
            // log.debug(F, `${newMember.displayName} boosted the server!`);
            const channelGoldlounge = await discordClient.channels.fetch(env.CHANNEL_GOLDLOUNGE) as TextChannel;
            await channelGoldlounge.send(`Hey @here, ${newMember} just boosted the server, give them a big thank you for helping to keep this place awesome!`); // eslint-disable-line max-len
          }

          // Check if the role added was a donator role
          if (roleId === env.ROLE_PATRON) {
            // log.debug(F, `${newMember.displayName} became a patron!`);
            const channelGoldlounge = await discordClient.channels.fetch(env.CHANNEL_GOLDLOUNGE) as TextChannel;
            await channelGoldlounge.send(`Hey @here, ${newMember} just became a patron, give them a big thank you for helping us keep the lights on and expand!`); // eslint-disable-line max-len
          }

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

          const role = await newMember.guild.roles.fetch(roleId) as Role;
          await auditlog.send(`${newMember.displayName} added ${role.name}`);
        });
      } else if (rolesRemoved.length > 0) {
        // log.debug(F, `roles removed: ${rolesRemoved}`);
        const guildData = await database.guilds.get(newMember.guild.id);

        rolesRemoved.forEach(async roleId => {
          const role = await newMember.guild.roles.fetch(roleId) as Role;

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

          if (newMember.guild.id !== env.DISCORD_GUILD_ID) return;
          const auditlog = await discordClient.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;
          await auditlog.send(`${newMember.displayName} removed ${role.name}`);
        });
      }
    }
  },
};

export default guildMemberUpdate;
