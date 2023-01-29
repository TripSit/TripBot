import {
  TextChannel,
  GuildMember,
  Guild,
  PermissionResolvable,
  PublicThreadChannel,
  PrivateThreadChannel,
  NewsChannel,
} from 'discord.js';

const F = 'check'; // eslint-disable-line

/**
 * Template
 * @param {Client} client The Client that manages this interaction
 * @return {Promise<void>}
* */
export async function checkGuildPermissions(
  guild: Guild,
  permissionList:PermissionResolvable[],
): Promise<{
    hasPermission: boolean,
    permission?: PermissionResolvable,
  }> {
  const guildObj = await client.guilds.fetch(guild.id);
  const member = await guildObj.members.fetch(client.user?.id as string);

  // Loop through the permissions and check if the bot has them
  for (const permission of permissionList) { // eslint-disable-line no-restricted-syntax
    if (!member.permissions.has(permission)) {
      return {
        hasPermission: false,
        permission,
      };
    }
  }
  return {
    hasPermission: true,
  };

  // // log.debug(F, `Guild: ${guild.name}`);
  // if (botMember.permissions.has('Administrator' as PermissionResolvable)) {
  //   log.info(F, 'I have the \'Administrator\' permissions!');
  //   return {
  //     hasPermission: true,
  //   };
  // }
  // // General Server Permissions
  // if (!botMember.permissions.has('ViewChannel' as PermissionResolvable)) {
  //   log.warn(F, 'I need the \'ViewChannel\' permissions to view all channels! This may cause problems!');
  // }
  // // if (!botMember.permissions.has('ManageChannels' as PermissionResolvable)) {
  // //   log.silly(F, `I do not support the 'ManageChannels' permissions!`);
  // // }
  // // if (!botMember.permissions.has('ManageRoles' as PermissionResolvable)) {
  // //   log.silly(F, `I do not support the 'ManageRoles' permissions!`);
  // // }
  // // if (!botMember.permissions.has('ManageEmojisAndStickers' as PermissionResolvable)) {
  // //   log.silly(F, `I do not support the 'ManageEmojisAndStickers' permissions!`);
  // // }
  // if (!botMember.permissions.has('ViewAuditLog' as PermissionResolvable)) {
  //   log.warn(F, 'I need the \'ViewAuditLog\' permissions to post the audit log!');
  // }
  // // if (!botMember.permissions.has('ViewGuildInsights' as PermissionResolvable)) {
  // //   log.silly(F, `I do not support the 'ViewGuildInsights' permissions!`);
  // // }
  // // if (!botMember.permissions.has('ManageWebhooks' as PermissionResolvable)) {
  // //   log.silly(F, `I do not support the 'ManageWebhooks' permissions!`);
  // // }
  // if (!botMember.permissions.has('ManageGuild' as PermissionResolvable)) {
  //   log.warn(F, 'I need \'ManageGuild\' permissions to check invites!');
  // }

  // // Membership Permissions
  // // if (!botMember.permissions.has('CreateInstantInvite' as PermissionResolvable)) {
  // //   log.silly(F, `I do not support the 'CreateInstantInvite' permissions!`);
  // // }
  // if (!botMember.permissions.has('ChangeNickname' as PermissionResolvable)) {
  //   log.warn(F, 'I need the \'ChangeNickname\' permission to change my own nickname!');
  // }
  // // if (!botMember.permissions.has('ManageNicknames' as PermissionResolvable)) {
  // //   log.silly(F, `I do not support the 'ManageNicknames' permissions!`);
  // // }
  // if (!botMember.permissions.has('KickMembers' as PermissionResolvable)) {
  //   log.warn(F, 'I need the \'KickMembers\' permissions to Kick members!');
  // }
  // if (!botMember.permissions.has('BanMembers' as PermissionResolvable)) {
  //   log.warn(F, 'I need the \'BanMembers\' permissions to Ban members!');
  // }
  // if (!botMember.permissions.has('ModerateMembers' as PermissionResolvable)) {
  //   log.warn(F, 'I need the \'ModerateMembers\' permissions to Timeout members!');
  // }

  // // Text Channel Permissions
  // if (!botMember.permissions.has('SendMessages' as PermissionResolvable)) {
  //   log.error(F, 'I need the \'SendMessages\' permissions to send messages in chat!');
  // }
  // if (!botMember.permissions.has('SendMessagesInThreads' as PermissionResolvable)) {
  //   log.warn(F, 'I need the \'SendMessagesInThreads\' permissions to !');
  // }
  // if (!botMember.permissions.has('CreatePublicThreads' as PermissionResolvable)) {
  //   log.warn(F, 'I need the \'CreatePublicThreads\' permissions to create threads!');
  // }
  // if (!botMember.permissions.has('CreatePrivateThreads' as PermissionResolvable)) {
  //   log.warn(F, 'I need the \'CreatePrivateThreads\' permissions to create threads!');
  // }
  // if (!botMember.permissions.has('EmbedLinks' as PermissionResolvable)) {
  //   log.warn(F, 'I need the \'EmbedLinks\' permissions to make pretty embeds!');
  // }
  // // if (!botMember.permissions.has('AttachFiles' as PermissionResolvable)) {
  // //   log.silly(F, `I do not support the 'AttachFiles' permissions!`);
  // // }
  // if (!botMember.permissions.has('AddReactions' as PermissionResolvable)) {
  //   log.warn(F, 'I need the \'AddReactions\' permissions to add reactions to messages!');
  // }
  // if (!botMember.permissions.has('UseExternalEmojis' as PermissionResolvable)) {
  //   log.warn(F, 'I need the \'UseExternalEmojis\' permissions to !');
  // }
  // // if (!botMember.permissions.has('UseExternalStickers' as PermissionResolvable)) {
  // //   log.silly(F, `I do not support the 'UseExternalStickers' permissions!`);
  // // }
  // // if (!botMember.permissions.has('MentionEveryone' as PermissionResolvable)) {
  // //   log.silly(F, `I do not support the 'MentionEveryone' permissions!`);
  // // }
  // if (!botMember.permissions.has('ManageMessages' as PermissionResolvable)) {
  //   log.warn(F, 'I need the \'ManageMessages\' permissions to delete msgs when someone is banned, and to pin msgs!');
  // }
  // if (!botMember.permissions.has('ManageThreads' as PermissionResolvable)) {
  //   log.warn(F, 'I need the \'ManageThreads\' permissions to archive/delete threads!');
  // }
  // // if (!botMember.permissions.has('ReadMessageHistory' as PermissionResolvable)) {
  // //   log.silly(F, `I do not support the 'ReadMessageHistory' permissions!`);
  // // }
  // // if (!botMember.permissions.has('SendTTSMessages' as PermissionResolvable)) {
  // //   log.silly(F, `I do not support the 'SendTTSMessages' permissions!`);
  // // }
  // // if (!botMember.permissions.has('UseApplicationCommands' as PermissionResolvable)) {
  // //   log.silly(F, `I do not support the 'UseApplicationCommands' permissions!`);
  // // }

  // // Voice Channel Permissions
  // // if (!botMember.permissions.has('Connect' as PermissionResolvable)) {
  // //   log.silly(F, `I do not support the 'Connect' permissions!`);
  // // }
  // // if (!botMember.permissions.has('Speak' as PermissionResolvable)) {
  // //   log.silly(F, `I do not support the 'Speak' permissions!`);
  // // }
  // // if (!botMember.permissions.has('Stream' as PermissionResolvable)) {
  // //   log.silly(F, `I do not support the 'Stream' permissions!`);
  // // }
  // // if (!botMember.permissions.has('UseEmbeddedActivities' as PermissionResolvable)) {
  // //   log.silly(F, `I do not support the 'UseEmbeddedActivities' permissions!`);
  // // }
  // // if (!botMember.permissions.has('UseVAD' as PermissionResolvable)) {
  // //   log.silly(F, `I do not support the 'UseVAD' permissions!`);
  // // }
  // // if (!botMember.permissions.has('PrioritySpeaker' as PermissionResolvable)) {
  // //   log.silly(F, `I do not support the 'PrioritySpeaker' permissions!`);
  // // }
  // // if (!botMember.permissions.has('MuteMembers' as PermissionResolvable)) {
  // //   log.silly(F, `I do not support the 'MuteMembers' permissions!`);
  // // }
  // // if (!botMember.permissions.has('DeafenMembers' as PermissionResolvable)) {
  // //   log.silly(F, `I do not support the 'DeafenMembers' permissions!`);
  // // }
  // // if (!botMember.permissions.has('MoveMembers' as PermissionResolvable)) {
  // //   log.silly(F, `I do not support the 'MoveMembers' permissions!`);
  // // }

  // // Stage Channels
  // // if (!botMember.permissions.has('RequestToSpeak' as PermissionResolvable)) {
  // //   log.silly(F, `I do not support the 'RequestToSpeak' permissions!`);
  // // }

  // // Events Permissions
  // // if (!botMember.permissions.has('ManageEvents' as PermissionResolvable)) {
  // //   log.silly(F, `I do not support the 'ManageEvents' permissions!`);
  // // }

  // log.info(F, 'Permissions checked!');

  // return {
  //   hasPermission: true,
  // };
}

/**
 * Checks to see if the bot has the right permissions
 * @param {ChatInputCommandInteraction} interaction The guild to check
 * @param {TextChannel} channel
 * @return {Promise<boolean>}
 */
export async function checkChannelPermissions(
  channel: TextChannel | PublicThreadChannel | PrivateThreadChannel | NewsChannel,
  permissionList:PermissionResolvable[],
):Promise<{
    hasPermission: boolean,
    permission?: PermissionResolvable,
  }> {
  const me = channel.guild?.members.me as GuildMember;
  const channelPerms = channel.permissionsFor(me);

  // Loop through the permissions and check if the bot has them
  for (const permission of permissionList) { // eslint-disable-line no-restricted-syntax
    if (!channelPerms.has(permission)) {
      return {
        hasPermission: false,
        permission,
      };
    }
  }
  return {
    hasPermission: true,
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const permsList = `
ADMINISTRATOR
KICK_MEMBERS
BAN_MEMBERS
MODERATE_MEMBERS

MANAGE_NICKNAMES
MANAGE_ROLES
MANAGE_WEBHOOKS
MANAGE_EMOJIS_AND_STICKERS
MANAGE_MESSAGES
MANAGE_CHANNELS
MANAGE_GUILD
MANAGE_EVENTS
MANAGE_THREADS

CREATE_INSTANT_INVITE
CREATE_PUBLIC_THREADS
CREATE_PRIVATE_THREADS

VIEW_AUDIT_LOG
VIEW_CHANNEL
VIEW_GUILD_INSIGHTS

SEND_MESSAGES
SEND_TTS_MESSAGES
SEND_MESSAGES_IN_THREADS

USE_EXTERNAL_EMOJIS
USE_VAD
USE_APPLICATION_COMMANDS
USE_EXTERNAL_STICKERS

READ_MESSAGE_HISTORY
ADD_REACTIONS
EMBED_LINKS
ATTACH_FILES
MENTION_EVERYONE
CHANGE_NICKNAME

CONNECT
SPEAK
STREAM
PRIORITY_SPEAKER
MUTE_MEMBERS
DEAFEN_MEMBERS
MOVE_MEMBERS
REQUEST_TO_SPEAK

START_EMBEDDED_ACTIVITIES
`;
