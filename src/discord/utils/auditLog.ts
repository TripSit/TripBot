/* eslint-disable no-unused-vars */

import {
  AuditLogEvent, Guild, GuildAuditLogsEntry, TextChannel,
} from 'discord.js';
import { ensurePermissions } from './checkPermissions';

export interface AuditLogOptions {
  /** Guild the event happened in; anything outside TripSit is ignored. */
  guild: Guild;
  /** Audit log entry type to look up. */
  type: AuditLogEvent;
  /** What changed, e.g. `Thread ${thread.name}` */
  subject: string;
  /** e.g. 'created', 'updated'. */
  action: string;
  /** Append the entry's key/old/new change list. */
  showChanges?: boolean;
  /** The calling file's `F`, used for logging. */
  caller: string;
}

/** Audit-log change values can be any JSON value; objects are serialized instead of printing [object Object]. */
const describeValue = (value: unknown): string => (typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value));

function formatAuditMessage(
  subject: string,
  action: string,
  entry: GuildAuditLogsEntry | undefined,
  showChanges: boolean,
): string {
  if (!entry) return `${subject} was ${action}, but no relevant audit logs were found.`;

  const punctuation = showChanges ? ':' : '.';
  const headline = entry.executor
    ? `${subject} was ${action} by ${entry.executor.tag}${punctuation}`
    : `${subject} was ${action}, but the audit log was inconclusive.`;
  if (!showChanges) return headline;

  const changes = entry.changes.map(change => `**[${change.key}]** '**${describeValue(change.old)}**' > '**${describeValue(change.new)}**'`);
  return [headline, ...changes].join('\n');
}

export async function postAuditLog({
  guild,
  type,
  subject,
  action,
  showChanges = false,
  caller,
}: AuditLogOptions): Promise<void> {
  if (!guild) return;
  // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
  if (guild.id !== env.DISCORD_GUILD_ID) return;
  log.info(caller, `${subject} was ${action}.`);

  if (!await ensurePermissions(guild, ['ViewAuditLog'], caller)) return;

  const channel = await discordClient.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;
  if (!await ensurePermissions(channel, ['ViewChannel', 'SendMessages'], caller)) return;

  const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type });
  await channel.send(formatAuditMessage(subject, action, fetchedLogs.entries.first(), showChanges));
}

export default postAuditLog;
