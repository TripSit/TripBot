import { stripIndents } from 'common-tags';
import {
  Guild,
  GuildBasedChannel,
  GuildMember,
  NewsChannel,
  PermissionResolvable,
  PrivateThreadChannel,
  PublicThreadChannel,
  TextChannel,
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
  const guildObj = await discordClient.guilds.fetch(guild.id);
  const member = await guildObj.members.fetch(discordClient.user?.id as string);

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
}

/**
 * Checks to see if the bot has the right permissions
 * @param {ChatInputCommandInteraction} interaction The guild to check
 * @param {TextChannel} channel
 * @return {Promise<boolean>}
 */
export async function checkChannelPermissions(
  channel: TextChannel | PublicThreadChannel | PrivateThreadChannel | NewsChannel | GuildBasedChannel,
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

export type PermissionTarget =
  Guild | TextChannel | PublicThreadChannel | PrivateThreadChannel | NewsChannel | GuildBasedChannel;

/**
 * Returns the first permission the bot is missing on the guild/channel, or null if it has them all.
 */
export async function missingPermission(
  target: PermissionTarget,
  permissions: PermissionResolvable[],
): Promise<PermissionResolvable | null> {
  const result = target instanceof Guild
    ? await checkGuildPermissions(target, permissions)
    : await checkChannelPermissions(target, permissions);
  return result.hasPermission ? null : (result.permission ?? null);
}

export interface EnsurePermissionsOptions {
  /** Finishes "…so I can ___!" in the owner DM. Defaults to `run ${caller}`. */
  reason?: string;
  /** Replaces the whole owner DM, for places with a longer explanation (tripsit setup). */
  ownerMessage?: (missing: PermissionResolvable) => string;
}

/**
 * Checks the bot's permissions; on failure DMs the guild owner, logs, and returns false.
 */
export async function ensurePermissions(
  target: PermissionTarget,
  permissions: PermissionResolvable[],
  caller: string,
  options: EnsurePermissionsOptions = {},
): Promise<boolean> {
  const missing = await missingPermission(target, permissions);
  if (!missing) return true;

  const guild = target instanceof Guild ? target : target.guild;
  log.error(caller, `Missing permission ${missing} in ${target}!`);

  const reason = options.reason ?? `run ${caller}`;
  const content = options.ownerMessage
    ? options.ownerMessage(missing)
    : `Please make sure I can ${missing} in ${target} so I can ${reason}!`;
  try {
    const guildOwner = await guild.fetchOwner();
    await guildOwner.send({ content });
  } catch (err) {
    // Owner has DMs closed or blocked the bot; the log line bellow is all we can do.
    log.error(caller, `Could not DM the owner of ${guild} about missing ${missing}: ${err}`);
  }
  return false;
}

/** Permissions the tripsit flow needs in both the tripsit and meta channels. */
export const TRIPSIT_CHANNEL_PERMS: PermissionResolvable[] = [
  'ViewChannel',
  'SendMessages',
  'SendMessagesInThreads',
  'CreatePrivateThreads',
  'ManageThreads',
];

/** Shared owner-DM copy for a tripsit/meta channel missing its required permissions. */
export function tripsitChannelOwnerMessage(channel: TextChannel, isMeta: boolean): string {
  return stripIndents`Missing permissions in ${channel}!
  In order to setup the tripsitting feature I need:
  View Channel - to see the channel
  Send Messages - to send messages
  Create Private Threads - to create private threads${isMeta ? ', when requested through the bot' : ''}
  Send Messages in Threads - to send messages in threads
  Manage Threads - to delete threads when they're done
  `;
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
