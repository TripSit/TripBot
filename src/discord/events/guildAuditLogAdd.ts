import {
  AuditLogEvent,
  Colors,
  EmbedBuilder,
  Guild,
  TextChannel,
  PermissionsBitField,
} from 'discord.js';
import {
  GuildAuditLogEntryCreateEvent,
} from '../@types/eventDef';
import { embedTemplate } from '../utils/embedTemplate';

const F = f(__filename);

const NULL_LABELS: Record<string, string> = {
  nick: 'No nickname',
  nickname: 'No nickname',
  avatar: 'No avatar',
  banner: 'No banner',
  timeout: 'No timeout',
  communication_disabled_until: 'Not timed out',
};

function formatObjectValue(value: any, key?: string): string {
  try {
    if (Array.isArray(value)) {
      if (value.length === 0) return 'None';
      return value.map(v => formatValue(v, key)).join(', '); // eslint-disable-line @typescript-eslint/no-use-before-define
    }

    // Handle specific Discord objects
    if (value.id && value.username) {
      return `@${value.username}`;
    }
    if (value.id && value.name && value.color !== undefined) {
      return `@${value.name}`;
    }
    if (value.id && value.name) {
      return `#${value.name}`;
    }

    return JSON.stringify(value, null, 2);
  } catch {
    return '[Complex object]';
  }
}

/** Returns the special formatting for a string value, or undefined when it should be printed as-is. */
function formatStringValue(value: string, key?: string): string | undefined {
  // Handle timestamps
  if (key === 'communication_disabled_until' && value) {
    const date = new Date(value);
    return `Until ${date.toLocaleString()}`;
  }

  // Handle permission bitfields
  if (key?.includes('permission') && !Number.isNaN(Number(value))) {
    try {
      const perms = new PermissionsBitField(BigInt(value));
      const permArray = perms.toArray();
      return permArray.length > 0 ? permArray.join(', ') : 'No permissions';
    } catch {
      return value;
    }
  }
  return undefined;
}

function formatValue(value: any, key?: string): string {
  if (value === null || value === undefined) {
    return (key !== undefined && Object.hasOwn(NULL_LABELS, key)) ? NULL_LABELS[key] : 'None';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'object') {
    return formatObjectValue(value, key);
  }

  if (typeof value === 'string') {
    const special = formatStringValue(value, key);
    if (special !== undefined) return special;
  }

  return value.toString();
}

// Describe exactly which permissions were added/removed between two bitfields
export function formatPermissionDiff(oldValue: unknown, newValue: unknown): string {
  const toSet = (v: unknown) => {
    try {
      return new Set(new PermissionsBitField(BigInt((v ?? 0) as string)).toArray());
    } catch {
      return new Set<string>();
    }
  };

  const before = toSet(oldValue);
  const after = toSet(newValue);

  const added = [...after].filter(p => !before.has(p));
  const removed = [...before].filter(p => !after.has(p));

  const parts: string[] = [];
  if (added.length) parts.push(`+ ${added.join(', ')}`);
  if (removed.length) parts.push(`- ${removed.join(', ')}`);

  return parts.length ? parts.join('\n') : 'No effective change';
}

// AutoMod action entries are reported by discord.js with a 'User' target type, so match on the event instead
const AUTOMOD_ACTIONS: AuditLogEvent[] = [
  AuditLogEvent.AutoModerationBlockMessage,
  AuditLogEvent.AutoModerationFlagToChannel,
  AuditLogEvent.AutoModerationUserCommunicationDisabled,
];

export function isAutoModAction(action: AuditLogEvent): boolean {
  return AUTOMOD_ACTIONS.includes(action);
}

// Get appropriate emoji for different actions
export function getActionEmoji(actionType: string, targetType: string): string {
  const action = actionType.toLowerCase();
  const target = targetType.toLowerCase();

  if (action === 'create') return '✅';
  if (action === 'delete') return '❌';
  if (action === 'update') {
    if (target.includes('user')) return '👤';
    if (target.includes('role')) return '🏷️';
    if (target.includes('channel')) return '📝';
    if (target.includes('guild')) return '🏠';
    return '📝';
  }
  return '📋';
}

// Changes shown as "Label: old → new"
const CHANGE_LABELS: Record<string, string> = {
  nick: 'Nickname',
  nickname: 'Nickname',
  deaf: 'Server Deafened',
  mute: 'Server Muted',
  name: 'Name',
  topic: 'Topic',
  position: 'Position',
  color: 'Color',
  hoist: 'Display Separately',
  mentionable: 'Mentionable',
  nsfw: 'NSFW',
};

// Changes that are bitfields of permissions
const PERMISSION_CHANGE_LABELS: Record<string, string> = {
  permissions: 'Permissions',
  allow: 'Permissions Allowed',
  deny: 'Permissions Denied',
};

// Numeric changes shown with a unit; a falsy value (0 or unset) is described by `empty` instead
const NUMERIC_CHANGES: Record<string, { label: string; unit: string; empty: string }> = {
  slowmode: { label: 'Slowmode', unit: 's', empty: 'Off' },
  rate_limit_per_user: { label: 'Slowmode', unit: 's', empty: 'Off' },
  bitrate: { label: 'Bitrate', unit: 'kbps', empty: 'Default' },
  // A limit of 0 (or no limit) means unlimited, so falsy values must not be shown as-is
  user_limit: { label: 'User Limit', unit: '', empty: 'Unlimited' },
};

const withUnit = (value: string | number | null | undefined, unit: string, empty: string): string => (value ? `${value}${unit}` : empty);

function formatSpecialChange(
  key: string,
  oldValue: any,
  newValue: any,
  formattedNew: string,
  targetType: string,
): string | undefined {
  if (Object.hasOwn(NUMERIC_CHANGES, key)) {
    const { label, unit, empty } = NUMERIC_CHANGES[key];
    return `**${label}:** ${withUnit(oldValue, unit, empty)} → ${withUnit(newValue, unit, empty)}`;
  }
  const isUser = targetType.toLowerCase().includes('user');
  switch (key) {
    case 'avatar':
      return '**Avatar:** Changed';
    case 'communication_disabled_until':
      return newValue ? `**Timeout:** ${formattedNew}` : '**Timeout:** Removed';
    case '$add':
      return isUser ? `**Roles Added:** ${formattedNew}` : `**Added:** ${formattedNew}`;
    case '$remove':
      return isUser ? `**Roles Removed:** ${formattedNew}` : `**Removed:** ${formattedNew}`;
    default:
      return undefined;
  }
}

// Format specific change types with human-readable descriptions
export function formatChange(change: any, targetType: string): string {
  const { key, old: oldValue, new: newValue } = change;
  const formattedOld = formatValue(oldValue, key);
  const formattedNew = formatValue(newValue, key);

  if (Object.hasOwn(CHANGE_LABELS, key)) {
    return `**${CHANGE_LABELS[key]}:** ${formattedOld} → ${formattedNew}`;
  }
  if (Object.hasOwn(PERMISSION_CHANGE_LABELS, key)) {
    return `**${PERMISSION_CHANGE_LABELS[key]}:**\n${formatPermissionDiff(oldValue, newValue)}`;
  }

  return formatSpecialChange(key, oldValue, newValue, formattedNew, targetType)
    ?? `**${key.charAt(0).toUpperCase() + key.slice(1)}:** ${formattedOld} → ${formattedNew}`;
}

// discord.js reports bans, kicks, etc. all as a 'User' target with Create/Update/Delete, so use the event
function describeUserAction(
  action: AuditLogEvent,
  executorName: string,
  targetName: string,
): string | undefined {
  switch (action) {
    case AuditLogEvent.MemberBanAdd:
      return `**${targetName}** was banned`;
    case AuditLogEvent.MemberBanRemove:
      return `**${targetName}** was unbanned`;
    case AuditLogEvent.MemberKick:
      return `**${executorName}** kicked **${targetName}**`;
    case AuditLogEvent.MemberPrune:
      return `**${executorName}** pruned inactive members`;
    case AuditLogEvent.MemberUpdate:
    case AuditLogEvent.MemberRoleUpdate:
      return `**${executorName}** updated member **${targetName}**`;
    case AuditLogEvent.MemberMove:
      return `**${executorName}** moved **${targetName}** to another voice channel`;
    case AuditLogEvent.MemberDisconnect:
      return `**${executorName}** disconnected **${targetName}** from voice`;
    case AuditLogEvent.BotAdd:
      return `**${executorName}** added bot **${targetName}**`;
    case AuditLogEvent.AutoModerationBlockMessage:
      return `AutoMod blocked a message from **${targetName}**`;
    case AuditLogEvent.AutoModerationFlagToChannel:
      return `AutoMod flagged a message from **${targetName}**`;
    case AuditLogEvent.AutoModerationUserCommunicationDisabled:
      return `AutoMod timed out **${targetName}**`;
    default:
      return undefined;
  }
}

type EntityDescriber = (executor: string, targetName: string, rawName: string | undefined) => string;

// Descriptions for entities that have create/update/delete audit entries, keyed by target type then action
const ENTITY_DESCRIPTIONS: Record<string, Record<string, EntityDescriber>> = {
  role: {
    create: (executor, targetName) => `**${executor}** created role **${targetName}**`,
    update: (executor, targetName) => `**${executor}** updated role **${targetName}**`,
    delete: (executor, _targetName, rawName) => `**${executor}** deleted role **${rawName ?? 'a role'}**`,
  },
  channel: {
    create: (executor, targetName) => `**${executor}** created channel **#${targetName}**`,
    update: (executor, targetName) => `**${executor}** updated channel **#${targetName}**`,
    delete: (executor, _targetName, rawName) => `**${executor}** deleted channel **#${rawName ?? 'a channel'}**`,
  },
  emoji: {
    create: (executor, _targetName, rawName) => `**${executor}** added emoji **:${rawName ?? 'unknown'}:**`,
    update: (executor, _targetName, rawName) => `**${executor}** updated emoji **:${rawName ?? 'unknown'}:**`,
    delete: (executor, _targetName, rawName) => `**${executor}** deleted emoji **:${rawName ?? 'unknown'}:**`,
  },
  webhook: {
    create: (executor, _targetName, rawName) => `**${executor}** created webhook **${rawName ?? 'a webhook'}**`,
    update: (executor, _targetName, rawName) => `**${executor}** updated webhook **${rawName ?? 'a webhook'}**`,
    delete: (executor, _targetName, rawName) => `**${executor}** deleted webhook **${rawName ?? 'a webhook'}**`,
  },
  automod: {
    create: () => 'AutoMod took action',
    update: (executor, _targetName, rawName) => `**${executor}** updated AutoMod rule **${rawName ?? 'a rule'}**`,
    delete: (executor, _targetName, rawName) => `**${executor}** deleted AutoMod rule **${rawName ?? 'a rule'}**`,
  },
  invite: {
    create: executor => `**${executor}** created invite`,
    delete: executor => `**${executor}** deleted invite`,
  },
};

const AUTOMOD_TYPES = ['automoderation', 'auto_moderation', 'automod'];

// Create human-readable action description
export function createActionDescription(auditLogEntry: any): string {
  const {
    executor, target, targetType, actionType,
  } = auditLogEntry;
  const action = actionType.toLowerCase();
  const type = targetType.toLowerCase();

  // Get safe display names (no pings)
  const executorName = executor?.tag ?? executor?.username ?? 'System';
  const targetName = target?.tag ?? target?.username ?? target?.name ?? 'Unknown Target';

  // Handle different target types with appropriate descriptions
  if (type === 'user') {
    const userDescription = describeUserAction(auditLogEntry.action, executorName, targetName);
    if (userDescription) return userDescription;
  } else if (type === 'guild') {
    return `**${executorName}** updated server settings`;
  } else {
    const entityType = AUTOMOD_TYPES.includes(type) ? 'automod' : type;
    const describe = Object.hasOwn(ENTITY_DESCRIPTIONS, entityType)
      ? ENTITY_DESCRIPTIONS[entityType][action]
      : undefined;
    if (describe) return describe(executorName, targetName, target?.name);
    if (entityType === 'automod') return 'AutoMod action triggered';
  }

  // Fallback for any unhandled cases
  const actionSuffix = action.endsWith('e') ? 'd' : 'ed';
  const targetDisplay = action !== 'delete' ? `**${targetName}**` : '';
  return `**${executorName}** ${action}${actionSuffix} ${type} ${targetDisplay}`;
}

const ACTION_COLORS: Record<string, number> = {
  Create: Colors.Green,
  Update: Colors.Yellow,
  Delete: Colors.Red,
};

// Handle reason with special formatting for AutoMod
function describeReason(auditLogEntry: any, reason: string): string {
  if (isAutoModAction(auditLogEntry.action)) {
    // `extra` is null for some entries and carries the rule name, not the matched keyword
    const extra = auditLogEntry.extra as Record<string, unknown> | null | undefined;
    const ruleName = extra?.autoModerationRuleName;
    if (typeof ruleName === 'string' && ruleName) {
      return `\n\n**Rule:** ${ruleName}\n**Reason:** ${reason}`;
    }
  }
  return `\n\n**Reason:** ${reason}`;
}

// For AutoMod, try to get the user who triggered it
async function setAutoModFooter(embed: EmbedBuilder, auditLogEntry: any, guild: Guild): Promise<void> {
  if (!auditLogEntry.executorId || auditLogEntry.executorId === guild.client.user?.id) {
    embed.setFooter({
      text: 'Automated action',
    });
    return;
  }
  try {
    const triggerUser = await guild.members.fetch(auditLogEntry.executorId);
    embed.setFooter({
      text: `Triggered by ${triggerUser.user.tag}`,
      iconURL: triggerUser.user.displayAvatarURL({ size: 32 }),
    });
  } catch {
    embed.setFooter({
      text: `Triggered by user ${auditLogEntry.executorId}`,
    });
  }
}

export const guildAuditLogEntryCreate: GuildAuditLogEntryCreateEvent = {
  name: 'guildAuditLogEntryCreate',
  async execute(auditLogEntry, guild) {
    // Only run on specified guild
    if (guild.id !== env.DISCORD_GUILD_ID) return;

    // Skip message events as they're handled elsewhere
    if (auditLogEntry.targetType === 'Message') {
      return;
    }

    try {
      const channelAuditlog = await discordClient.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;

      if (!channelAuditlog) {
        log.error(F, 'Audit log channel not found');
        return;
      }

      const {
        executor, targetType, actionType, reason,
      } = auditLogEntry;

      // Create formatted changes list
      const changesText = auditLogEntry.changes && auditLogEntry.changes.length > 0
        ? auditLogEntry.changes
          .map(change => formatChange(change, targetType))
          .join('\n')
        : '';

      let description = createActionDescription(auditLogEntry);
      if (changesText) {
        description += `\n\n${changesText}`;
      }
      if (reason) {
        description += describeReason(auditLogEntry, reason);
      }

      // Get appropriate emoji and title
      const emoji = getActionEmoji(actionType, targetType);

      const embed = embedTemplate()
        .setAuthor(null)
        .setFooter(null)
        .setTitle(`${emoji} ${targetType} ${actionType}`)
        .setDescription(description)
        .setTimestamp()
        // Set color based on action type
        .setColor(ACTION_COLORS[actionType] ?? Colors.Blue);

      // Add executor info if available
      if (executor?.tag && executor.id !== guild.client.user?.id) {
        embed.setFooter({
          text: `Action by ${executor.tag}`,
          iconURL: executor.displayAvatarURL({ size: 32 }),
        });
      } else if (isAutoModAction(auditLogEntry.action)) {
        await setAutoModFooter(embed, auditLogEntry, guild);
      }

      await channelAuditlog.send({ embeds: [embed] });
    } catch (error) {
      log.error(F, `Error sending audit log message: ${error}`);
    }
  },
};

export default guildAuditLogEntryCreate;
