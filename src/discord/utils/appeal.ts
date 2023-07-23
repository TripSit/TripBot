import {
  AuditLogEvent,
  ButtonInteraction,
  GuildMember,
  PermissionsBitField,
  time,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { database } from '../../global/utils/knex';
import { UserActions } from '../../global/@types/database';

const F = f(__filename);

export async function appealAccept(
  interaction:ButtonInteraction,
) {
  if (!interaction.guild) return;
  await interaction.deferReply();
  const [customId, userId, email] = interaction.customId.split('~');
  log.debug(`${F} - appealAccept`, `customId: ${customId}`);
  log.debug(`${F} - appealAccept`, `userId: ${userId}`);
  log.debug(`${F} - appealAccept`, `email: ${email}`);

  // Check if the message was created in the last 24 users, and the user who clicked does not have admin permissions
  if (interaction.createdTimestamp > Date.now() - 86400000
  && !(interaction.member as GuildMember).permissions.has(PermissionsBitField.Flags.Administrator)) {
    await interaction.reply({
      content: `This appeal is too new to accept, it will unlock in ${time(new Date(interaction.createdTimestamp + 86400000), 'R')}.

      If you believe this is an error, please contact an administrator.`,
      ephemeral: true,
    });
    return;
  }

  // Modify the user the database
  const userData = await database.users.get(userId, null, null);
  log.debug(`${F} - appealAccept`, `userData: ${JSON.stringify(userData, null, 2)}`);
  userData.removed_at = null;
  await database.users.set(userData);

  // let banInfo = {} as GuildBan;
  // try {
  //   banInfo = await interaction.guild.bans.fetch(userId);
  // } catch (err) {
  //   await interaction.reply({
  //     content: `This user is no longer banned from ${interaction.guild.name}. Did someone undo it manually?`,
  //     ephemeral: true,
  //   });
  //   return;
  // }

  // Look up the audit logs to see when this user was banned
  const banLogs = await interaction.guild.fetchAuditLogs({
    type: AuditLogEvent.MemberBanAdd,
  });

  // Find the ban log that matches the user id
  const banLog = banLogs.entries.find(entry => entry.target && entry.target.id === userId);
  log.debug(F, `banLog: ${JSON.stringify(banLog, null, 2)}`);

  // Construct an action in case this doesn't exist
  let actionData = {} as UserActions;
  // Check if the user already has a FULL_BAN action in the dictionary
  const banRecords = await database.actions.get(userData.id, 'FULL_BAN');
  // If so, then use that action
  if (banRecords.length > 0) {
    [actionData] = banRecords;
    // Ensure that these fields are updated to unban
    actionData.repealed_at = new Date();
    actionData.repealed_by = interaction.user.id;
    actionData.expires_at = null;
    log.debug(F, `actionData: ${JSON.stringify(actionData, null, 2)}`);
    // Set those fields in the database
    await database.actions.set(actionData);
  }

  // Actually unban the user from the discord
  try {
    await interaction.guild.bans.fetch();
    await interaction.guild.bans.remove(userId, 'Appeal accepted');
  } catch (err) {
    log.error(F, `Error: ${err}`);
  }

  const inviteDict = {
    '960606557622657026': 'https://discord.gg/tripsit',
    '1009038673284714526': 'https://discord.gg/rdrugs-official',
    '867876356304666635': 'https://discord.gg/bluelight',
  };

  // Try to find the user in the bot's cache - this can only happen if the user still shares a guild with the bot
  const user = await discordClient.users.fetch(userId);
  let contactMethod = '' as 'DM' | 'email' | '';
  if (user) {
    // Send them a DM letting them know they've been unbanned
    try {
      await user.send(stripIndents`Congratulations, you've been unbanned from ${interaction.guild.name}!
    
      Be safe, have fun, and please follow the rules!
      
      ${inviteDict[interaction.guild.id as keyof typeof inviteDict]}
      `);
      contactMethod = 'DM';
    } catch (err) {
      // log.error(F, `Error: ${err}`);
    }
  } else {
    // Send them an email letting them know they've been unbanned
    // No idea how to do this yet
    contactMethod = 'email';
  }

  // Send a message to the mod thread letting them know the appeal was accepted
  const contactString = contactMethod !== ''
    ? `I let them know the good news via ${contactMethod}!`
    : 'I was unable to contact them, please do so manually.';

  await interaction.editReply({
    content: stripIndents`User <@${userId}> has been unbanned from ${interaction.guild.name}.
    ${contactString}`,
  });
}

export async function appealReject(
  interaction:ButtonInteraction,
) {
  if (!interaction.guild) return;
  const [customId, userId, email] = interaction.customId.split('~');
  log.debug(`${F} - appealReject`, `customId: ${customId}`);
  log.debug(`${F} - appealReject`, `userId: ${userId}`);
  log.debug(`${F} - appealReject`, `email: ${email}`);

  // Check if the message was created in the last 24 users, and the user who clicked does not have admin permissions
  if (interaction.createdTimestamp > Date.now() - 86400000) {
    await interaction.reply({
      content: `This appeal is too new to accept, it will unlock ${time(new Date(interaction.createdTimestamp + 86400000), 'R')}.
  
        If you believe this is an error, please contact an administrator.`,
      ephemeral: true,
    });
    return;
  }

  // Try to find the user in the bot's cache - this can only happen if the user still shares a guild with the bot
  const user = await discordClient.users.fetch(userId);
  if (user) {
    // Send them a DM letting them know they've been unbanned
    await user.send(stripIndents`I'm sorry to inform you that your appeal to ${interaction.guild.name} has been rejected.`);
  } else {
    // Send them an email letting them know they've been unbanned
    // No idea how to do this yet
  }
}