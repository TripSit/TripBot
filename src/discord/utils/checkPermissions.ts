import {
  TextChannel,
  GuildMember,
  Guild,
  PermissionResolvable,
  PublicThreadChannel,
  PrivateThreadChannel,
  NewsChannel,
  GuildBasedChannel,
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
):Promise<PermissionResolvable[]> {
  const guildObj = await discordClient.guilds.fetch(guild.id);
  const myPerms = await guildObj.members.fetch(discordClient.user?.id as string);

  // Check if the bot has the right permissions
  const missingPermissions = await Promise.all(
    permissionList.map(permission => (!myPerms.permissions.has(permission) ? permission : undefined)),
  );

  // Filter out 'undefined' values
  return missingPermissions.filter((permission): permission is PermissionResolvable => permission !== undefined);
}

export async function checkChannelPermissions(
  channel: TextChannel | PublicThreadChannel | PrivateThreadChannel | NewsChannel | GuildBasedChannel,
  permissionList:PermissionResolvable[],
):Promise<PermissionResolvable[]> {
  const me = channel.guild?.members.me as GuildMember;
  const myPerms = channel.permissionsFor(me);

  // Check if the bot has the right permissions
  const missingPermissions = await Promise.all(
    permissionList.map(permission => (!myPerms.has(permission) ? permission : undefined)),
  );

  // Filter out 'undefined' values
  return missingPermissions.filter((permission): permission is PermissionResolvable => permission !== undefined);
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
