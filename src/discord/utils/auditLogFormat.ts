import {
  AuditLogEvent,
  PermissionsBitField,
  escapeMarkdown,
} from 'discord.js';

export const EMBED_DESCRIPTION_LIMIT = 4096;

type Loose = Record<string, unknown>;

export type AuditChange = { key: string, old?: unknown, new?: unknown };

export type AuditEntryLike = {
  executor?: { tag?: string | null, username?: string | null } | null,
  target?: unknown,
  targetType: string,
  actionType: string,
  action?: number,
};

/** Cut text to `max` characters, ending with an ellipsis when something was removed. */
export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function toBigInt(value: unknown): bigint | null {
  if (typeof value === 'bigint') return value;
  if ((typeof value === 'string' && value.trim() !== '') || typeof value === 'number') {
    try {
      return BigInt(value);
    } catch {
      return null;
    }
  }
  return null;
}

function permissionNames(value: unknown): string[] | null {
  const bits = toBigInt(value);
  if (bits === null) return null;
  return new PermissionsBitField(bits).toArray();
}

const PERMISSION_KEYS = new Set(['permissions', 'allow', 'deny']);

export function formatValue(value: unknown, key?: string): string {
  if (value === null || value === undefined) {
    switch (key) {
      case 'nick':
      case 'nickname':
        return 'No nickname';
      case 'avatar':
        return 'No avatar';
      case 'banner':
        return 'No banner';
      case 'timeout':
        return 'No timeout';
      case 'communication_disabled_until':
        return 'Not timed out';
      default:
        return 'None';
    }
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return 'None';
    return value.map(v => formatValue(v, key)).join(', ');
  }

  if (typeof value === 'object') {
    const obj = value as Loose;
    try {
      if (obj.id && obj.username) return `@${escapeMarkdown(String(obj.username))}`;
      if (obj.id && obj.name && obj.color !== undefined) return `@${escapeMarkdown(String(obj.name))}`;
      if (obj.id && obj.name) return `#${escapeMarkdown(String(obj.name))}`;
      return JSON.stringify(value, (_k, v) => (typeof v === 'bigint' ? v.toString() : v), 2);
    } catch {
      return '[Complex object]';
    }
  }

  if (key === 'communication_disabled_until' && typeof value === 'string') {
    const ms = new Date(value).getTime();
    // Discord timestamps render in each viewer's own timezone
    return Number.isNaN(ms) ? value : `Until <t:${Math.floor(ms / 1000)}:f>`;
  }

  if (key && PERMISSION_KEYS.has(key)) {
    const names = permissionNames(value);
    if (names) return names.length > 0 ? names.join(', ') : 'No permissions';
  }

  return escapeMarkdown(String(value));
}

/** Summarise a `permissions` change as added/removed permissions instead of raw bitfields. */
function formatPermissionDiff(oldValue: unknown, newValue: unknown): string {
  const oldBits = toBigInt(oldValue) ?? 0n;
  const newBits = toBigInt(newValue) ?? 0n;
  const added = new PermissionsBitField(oldBits).missing(new PermissionsBitField(newBits));
  const removed = new PermissionsBitField(newBits).missing(new PermissionsBitField(oldBits));
  const parts: string[] = [];
  if (added.length > 0) parts.push(`➕ ${added.join(', ')}`);
  if (removed.length > 0) parts.push(`➖ ${removed.join(', ')}`);
  return parts.length > 0 ? parts.join('\n') : 'No effective change';
}

function withUnit(value: unknown, unit: string, empty: string): string {
  return value ? `${value}${unit}` : empty;
}

function scaled(value: unknown, divisor: number): number | undefined {
  return typeof value === 'number' ? Math.round(value / divisor) : undefined;
}

export function formatChange(change: AuditChange, targetType: string): string {
  const { key, old: oldValue, new: newValue } = change;
  const formattedOld = formatValue(oldValue, key);
  const formattedNew = formatValue(newValue, key);
  // discord.js reports member events (including role changes) with targetType 'User'
  const isMember = /member|user/i.test(targetType);

  switch (key) {
    case 'nick':
    case 'nickname':
      return `**Nickname:** ${formattedOld} → ${formattedNew}`;
    case 'avatar':
      return '**Avatar:** Changed';
    case 'communication_disabled_until':
      return newValue ? `**Timeout:** ${formattedNew}` : '**Timeout:** Removed';
    case 'deaf':
      return `**Server Deafened:** ${formattedOld} → ${formattedNew}`;
    case 'mute':
      return `**Server Muted:** ${formattedOld} → ${formattedNew}`;
    case '$add':
      return isMember ? `**Roles Added:** ${formattedNew}` : `**Added:** ${formattedNew}`;
    case '$remove':
      return isMember ? `**Roles Removed:** ${formattedNew}` : `**Removed:** ${formattedNew}`;
    case 'name':
      return `**Name:** ${formattedOld} → ${formattedNew}`;
    case 'topic':
      return `**Topic:** ${formattedOld} → ${formattedNew}`;
    case 'position':
      return `**Position:** ${formattedOld} → ${formattedNew}`;
    case 'color':
      return `**Color:** ${formattedOld} → ${formattedNew}`;
    case 'hoist':
      return `**Display Separately:** ${formattedOld} → ${formattedNew}`;
    case 'mentionable':
      return `**Mentionable:** ${formattedOld} → ${formattedNew}`;
    case 'permissions':
      return `**Permissions:**\n${formatPermissionDiff(oldValue, newValue)}`;
    case 'allow':
      return `**Permissions Allowed:** ${formattedNew}`;
    case 'deny':
      return `**Permissions Denied:** ${formattedNew}`;
    case 'nsfw':
      return `**NSFW:** ${formattedOld} → ${formattedNew}`;
    case 'slowmode':
    case 'rate_limit_per_user':
      return `**Slowmode:** ${withUnit(oldValue, 's', 'Off')} → ${withUnit(newValue, 's', 'Off')}`;
    case 'bitrate':
      // Discord reports bitrate in bits per second
      return `**Bitrate:** ${withUnit(scaled(oldValue, 1000), 'kbps', 'Default')}`
        + ` → ${withUnit(scaled(newValue, 1000), 'kbps', 'Default')}`;
    case 'user_limit':
      return `**User Limit:** ${oldValue || 'Unlimited'} → ${newValue || 'Unlimited'}`;
    default:
      return `**${key.charAt(0).toUpperCase() + key.slice(1)}:** ${formattedOld} → ${formattedNew}`;
  }
}

export function getActionEmoji(actionType: string, targetType: string): string {
  const action = actionType.toLowerCase();
  const target = targetType.toLowerCase();

  if (action === 'create') return '✅';
  if (action === 'delete') return '❌';
  if (action === 'update') {
    if (target.includes('member')) return '👤';
    if (target.includes('role')) return '🏷️';
    if (target.includes('channel')) return '📝';
    if (target.includes('guild')) return '🏠';
    return '📝';
  }
  return '📋';
}

function genericDescription(
  executorName: string,
  action: string,
  type: string,
  targetName: string,
): string {
  const actionSuffix = action.endsWith('e') ? 'd' : 'ed';
  const targetDisplay = action !== 'delete' ? ` **${targetName}**` : '';
  return `**${executorName}** ${action}${actionSuffix} ${type}${targetDisplay}`;
}

// Create/Delete on a user covers more than bans, so key off the exact audit log event
function memberEventDescription(eventType: number | undefined, executorName: string, targetName: string) {
  switch (eventType) {
    case AuditLogEvent.MemberBanAdd:
      return `**${targetName}** was banned`;
    case AuditLogEvent.MemberBanRemove:
      return `**${targetName}** was unbanned`;
    case AuditLogEvent.MemberKick:
      return `**${targetName}** was kicked`;
    case AuditLogEvent.MemberPrune:
      return `**${executorName}** pruned inactive members`;
    default:
      return undefined;
  }
}

export function createActionDescription(entry: AuditEntryLike): string {
  const {
    executor, target, targetType, actionType, action: eventType,
  } = entry;
  const action = actionType.toLowerCase();
  const type = targetType.toLowerCase();
  const t = (target ?? {}) as Loose;
  const targetObjName = typeof t.name === 'string' ? t.name : undefined;

  // Names are escaped so they cannot inject markdown or mention-looking text
  const executorName = escapeMarkdown(executor?.tag || executor?.username || 'System');
  const targetName = escapeMarkdown(
    (t.tag as string | undefined) || (t.username as string | undefined) || targetObjName || 'Unknown Target',
  );
  const named = (fallback: string) => escapeMarkdown(targetObjName || fallback);

  switch (type) {
    case 'user':
    case 'member':
      if (action === 'update') return `**${executorName}** updated member **${targetName}**`;
      return memberEventDescription(eventType, executorName, targetName)
        ?? genericDescription(executorName, action, type, targetName);

    case 'role':
      if (action === 'create') return `**${executorName}** created role **${targetName}**`;
      if (action === 'update') return `**${executorName}** updated role **${targetName}**`;
      if (action === 'delete') return `**${executorName}** deleted role **${named('a role')}**`;
      break;

    case 'channel':
      if (action === 'create') return `**${executorName}** created channel **#${targetName}**`;
      if (action === 'update') return `**${executorName}** updated channel **#${targetName}**`;
      if (action === 'delete') return `**${executorName}** deleted channel **#${named('a channel')}**`;
      break;

    case 'guild':
      return `**${executorName}** updated server settings`;

    case 'emoji':
      if (['create', 'update', 'delete'].includes(action)) {
        const verb = { create: 'added', update: 'updated', delete: 'deleted' }[action];
        return `**${executorName}** ${verb} emoji **:${named('unknown')}:**`;
      }
      break;

    case 'webhook':
      if (['create', 'update', 'delete'].includes(action)) {
        const verb = { create: 'created', update: 'updated', delete: 'deleted' }[action];
        return `**${executorName}** ${verb} webhook **${named('a webhook')}**`;
      }
      break;

    case 'automoderation':
    case 'auto_moderation':
    case 'automod':
      if (action === 'create') return 'AutoMod took action';
      if (action === 'update') return `**${executorName}** updated AutoMod rule **${named('a rule')}**`;
      if (action === 'delete') return `**${executorName}** deleted AutoMod rule **${named('a rule')}**`;
      return 'AutoMod action triggered';

    case 'invite':
      if (action === 'create') return `**${executorName}** created invite`;
      if (action === 'delete') return `**${executorName}** deleted invite`;
      break;

    default:
      break;
  }

  return genericDescription(executorName, action, type, targetName);
}
