import {
  AuditLogEvent,
  ButtonInteraction,
  GuildMember,
  PermissionsBitField,
  time,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { appeal_status, user_action_type, user_actions } from '@prisma/client';
import db from '../../global/utils/db';

const F = f(__filename);

export async function appealAccept(
  interaction:ButtonInteraction,
) {
  if (!interaction.guild) return;
  await interaction.deferReply();
  const [customId, userId] = interaction.customId.split('~');
  log.debug(`${F} - appealAccept`, `customId: ${customId}`);
  log.debug(`${F} - appealAccept`, `userId: ${userId}`);
  // log.debug(`${F} - appealAccept`, `email: ${email}`);

  // Check if the message was created in the last 24 users, and the user who clicked does not have admin permissions
  if (interaction.createdTimestamp > Date.now() - 86400000
  && !(interaction.member as GuildMember).permissions.has(PermissionsBitField.Flags.Administrator)) {
    await interaction.editReply({
      content: stripIndents`This appeal is too new to accept, \
      it will unlock in ${time(new Date(interaction.createdTimestamp + 86400000), 'R')}.

      If you believe this is an error, please contact an administrator.`,
    });
    return;
  }

  // Modify the user in the database
  const userData = await db.users.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });
  // log.debug(`${F} - appealAccept`, `userData: ${JSON.stringify(userData, null, 2)}`);
  userData.removed_at = null;
  await db.users.update({
    where: {
      id: userId,
    },
    data: userData,
  });

  // Get the ban info from discord
  // let banInfo = {} as GuildBan;
  // try {
  //   banInfo = await interaction.guild.bans.fetch(userId);
  // } catch (err) {
  //   await interaction.editReply({
  //     content: `This user is no longer banned from ${interaction.guild.name}. Did someone undo it manually?`,
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
  let actionData = {} as user_actions;
  // Check if the user already has a FULL_BAN action in the dictionary
  const banRecords = await db.user_actions.findFirst({
    where: {
      user_id: userId,
      type: user_action_type.FULL_BAN,
      repealed_at: null,
    },
  });
  // If so, then use that action
  if (banRecords) {
    actionData = banRecords;
    // Ensure that these fields are updated to unban
    actionData.repealed_at = new Date();
    actionData.repealed_by = (await db.users.findFirstOrThrow({
      where: {
        discord_id: interaction.user.id,
      },
    })).id;
    actionData.expires_at = null;
    log.debug(F, `actionData: ${JSON.stringify(actionData, null, 2)}`);
    // Set those fields in the database
    await db.user_actions.update({
      where: {
        id: actionData.id,
      },
      data: actionData,
    });
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

  // Get and modify the appeal record
  const appealRecord = await db.appeals.findFirstOrThrow({
    where: {
      user_id: userData.id,
      guild_id: interaction.guild.id,
      status: appeal_status.OPEN,
    },
  });
  log.debug(F, `appealRecord: ${JSON.stringify(appealRecord, null, 2)}`);
  appealRecord.status = appeal_status.ACCEPTED;
  appealRecord.decided_at = new Date();
  await db.appeals.update({
    where: {
      id: appealRecord.id,
    },
    data: appealRecord,
  });

  await interaction.editReply({
    content: stripIndents`User <@${userId}> has been unbanned from ${interaction.guild.name}.
    ${contactString}`,
  });
}

export async function appealReject(
  interaction:ButtonInteraction,
) {
  if (!interaction.guild) return;
  await interaction.deferReply();
  const [customId, userId, email] = interaction.customId.split('~');
  log.debug(`${F} - appealReject`, `customId: ${customId}`);
  log.debug(`${F} - appealReject`, `userId: ${userId}`);
  log.debug(`${F} - appealReject`, `email: ${email}`);

  // Check if the message was created in the last 24 users, and the user who clicked does not have admin permissions
  if (interaction.createdTimestamp > Date.now() - 86400000
  && !(interaction.member as GuildMember).permissions.has(PermissionsBitField.Flags.Administrator)) {
    await interaction.editReply({
      content: stripIndents`This appeal is too new to accept, \
      it will unlock in ${time(new Date(interaction.createdTimestamp + 86400000), 'R')}.

      If you believe this is an error, please contact an administrator.`,
    });
    return;
  }

  // Get and modify the appeal record
  const userData = await db.users.findFirstOrThrow({
    where: {
      id: userId,
    },
  });
  const openAppealRecord = await db.appeals.findFirstOrThrow({
    where: {
      user_id: userData.id,
      guild_id: interaction.guild.id,
      status: appeal_status.OPEN,
    },
  });
  log.debug(F, `openAppealRecord: ${JSON.stringify(openAppealRecord, null, 2)}`);

  if (!openAppealRecord) {
    const closedAppealRecord = await db.appeals.findFirstOrThrow({
      where: {
        user_id: userData.id,
        guild_id: interaction.guild.id,
      },
    });

    if (!closedAppealRecord.decided_at) {
      await interaction.editReply({
        content: stripIndents`Hey <@${env.DISCORD_OWNER_ID}>, this user doesn't have an active appeal, \
        but also doesn't have any closed appeals, what gives?`,
      });
      return;
    }

    await interaction.editReply({
      content: stripIndents`This appeal was already decided ${time(closedAppealRecord.decided_at, 'R')}.
      If you believe this is an error, please contact an administrator.`,
    });
    return;
  }

  openAppealRecord.status = appeal_status.DENIED;
  openAppealRecord.decided_at = new Date();
  await db.appeals.update({
    where: {
      id: openAppealRecord.id,
    },
    data: openAppealRecord,
  });

  // Try to find the user in the bot's cache - this can only happen if the user still shares a guild with the bot
  const user = await discordClient.users.fetch(userId);
  let contactMethod = '' as 'DM' | 'email' | '';
  if (user) {
    // Send them a DM letting them know they've been unbanned
    try {
      await user.send(stripIndents`I'm sorry to inform you that your appeal to ${interaction.guild.name} \
      has been rejected.`);
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
    ? `I let them know via ${contactMethod}!`
    : 'I was unable to contact them, please do so manually.';

  await interaction.editReply({
    content: stripIndents`User <@${userId}> was not unbanned from ${interaction.guild.name}.
    ${contactString}`,
  });
}
