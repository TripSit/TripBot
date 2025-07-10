import {
  Colors,
  TextChannel,
  PermissionsBitField,
} from 'discord.js';
import {
  GuildAuditLogEntryCreateEvent,
} from '../@types/eventDef';
import { embedTemplate } from '../utils/embedTemplate';

const F = f(__filename);

function formatValue(value: any, key?: string): string {
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

  if (typeof value === 'object') {
    try {
      if (Array.isArray(value)) {
        if (value.length === 0) return 'None';
        return value.map(v => formatValue(v, key)).join(', ');
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

  if (typeof value === 'string') {
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
  }

  return value.toString();
}

// Get appropriate emoji for different actions
function getActionEmoji(actionType: string, targetType: string): string {
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

// Format specific change types with human-readable descriptions
function formatChange(change: any, targetType: string): string {
  const { key, old: oldValue, new: newValue } = change;
  const formattedOld = formatValue(oldValue, key);
  const formattedNew = formatValue(newValue, key);

  // Handle specific change types
  switch (key) {
    case 'nick':
    case 'nickname':
      return `**Nickname:** ${formattedOld} → ${formattedNew}`;

    case 'avatar':
      return '**Avatar:** Changed';

    case 'communication_disabled_until':
      if (newValue) {
        return `**Timeout:** ${formattedNew}`;
      }
      return '**Timeout:** Removed';

    case 'deaf':
      return `**Server Deafened:** ${formattedOld} → ${formattedNew}`;

    case 'mute':
      return `**Server Muted:** ${formattedOld} → ${formattedNew}`;

    case '$add':
      if (targetType.toLowerCase().includes('member')) {
        return `**Roles Added:** ${formattedNew}`;
      }
      return `**Added:** ${formattedNew}`;

    case '$remove':
      if (targetType.toLowerCase().includes('member')) {
        return `**Roles Removed:** ${formattedNew}`;
      }
      return `**Removed:** ${formattedNew}`;

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
      return '**Permissions:** Updated';

    case 'allow':
      return `**Permissions Allowed:** ${formattedNew}`;

    case 'deny':
      return `**Permissions Denied:** ${formattedNew}`;

    case 'nsfw':
      return `**NSFW:** ${formattedOld} → ${formattedNew}`;

    case 'slowmode':
    case 'rate_limit_per_user': {
      const oldSeconds = oldValue ? `${oldValue}s` : 'Off';
      const newSeconds = newValue ? `${newValue}s` : 'Off';
      return `**Slowmode:** ${oldSeconds} → ${newSeconds}`;
    }

    case 'bitrate': {
      const oldBitrate = oldValue ? `${oldValue}kbps` : 'Default';
      const newBitrate = newValue ? `${newValue}kbps` : 'Default';
      return `**Bitrate:** ${oldBitrate} → ${newBitrate}`;
    }

    case 'user_limit': {
      return `**User Limit:** ${oldValue || 'Unlimited'} → ${newValue || 'Unlimited'}`;
    }

    default:
      return `**${key.charAt(0).toUpperCase() + key.slice(1)}:** ${formattedOld} → ${formattedNew}`;
  }
}

// Create human-readable action description
function createActionDescription(auditLogEntry: any): string {
  const {
    executor, target, targetType, actionType,
  } = auditLogEntry;
  const action = actionType.toLowerCase();
  const type = targetType.toLowerCase();

  // Get safe display names (no pings)
  const executorName = executor?.tag || executor?.username || 'System';
  const targetName = target?.tag || target?.username || target?.name || 'Unknown Target';

  // Handle different target types with appropriate descriptions
  switch (type) {
    case 'user':
    case 'member':
      if (action === 'update') {
        return `**${executorName}** updated member **${targetName}**`;
      }
      if (action === 'create') {
        return `**${targetName}** was unbanned`;
      }
      if (action === 'delete') {
        return `**${targetName}** was banned`;
      }
      break;

    case 'role':
      if (action === 'create') {
        return `**${executorName}** created role **${targetName}**`;
      }
      if (action === 'update') {
        return `**${executorName}** updated role **${targetName}**`;
      }
      if (action === 'delete') {
        return `**${executorName}** deleted role **${target?.name || 'a role'}**`;
      }
      break;

    case 'channel':
      if (action === 'create') {
        return `**${executorName}** created channel **#${targetName}**`;
      }
      if (action === 'update') {
        return `**${executorName}** updated channel **#${targetName}**`;
      }
      if (action === 'delete') {
        return `**${executorName}** deleted channel **#${target?.name || 'a channel'}**`;
      }
      break;

    case 'guild':
      return `**${executorName}** updated server settings`;

    case 'emoji':
      if (action === 'create') {
        return `**${executorName}** added emoji **:${target?.name || 'unknown'}:**`;
      }
      if (action === 'update') {
        return `**${executorName}** updated emoji **:${target?.name || 'unknown'}:**`;
      }
      if (action === 'delete') {
        return `**${executorName}** deleted emoji **:${target?.name || 'unknown'}:**`;
      }
      break;

    case 'webhook':
      if (action === 'create') {
        return `**${executorName}** created webhook **${target?.name || 'a webhook'}**`;
      }
      if (action === 'update') {
        return `**${executorName}** updated webhook **${target?.name || 'a webhook'}**`;
      }
      if (action === 'delete') {
        return `**${executorName}** deleted webhook **${target?.name || 'a webhook'}**`;
      }
      break;

    case 'automoderation':
    case 'auto_moderation':
    case 'automod':
      if (action === 'create') {
        return 'AutoMod took action';
      }
      if (action === 'update') {
        return `**${executorName}** updated AutoMod rule **${target?.name || 'a rule'}**`;
      }
      if (action === 'delete') {
        return `**${executorName}** deleted AutoMod rule **${target?.name || 'a rule'}**`;
      }
      return 'AutoMod action triggered';

    case 'invite':
      if (action === 'create') {
        return `**${executorName}** created invite`;
      }
      if (action === 'delete') {
        return `**${executorName}** deleted invite`;
      }
      break;

    default: {
      const actionSuffix = action.endsWith('e') ? 'd' : 'ed';
      const targetDisplay = action !== 'delete' ? `**${targetName}**` : '';
      return `**${executorName}** ${action}${actionSuffix} ${type} ${targetDisplay}`;
    }
  }

  // Fallback for any unhandled cases
  const actionSuffix = action.endsWith('e') ? 'd' : 'ed';
  const targetDisplay = action !== 'delete' ? `**${targetName}**` : '';
  return `**${executorName}** ${action}${actionSuffix} ${type} ${targetDisplay}`;
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

      const mainDescription = createActionDescription(auditLogEntry);

      let description = mainDescription;
      if (changesText) {
        description += `\n\n${changesText}`;
      }

      // Handle reason with special formatting for AutoMod
      if (reason) {
        if (targetType.toLowerCase().includes('automod') || targetType.toLowerCase().includes('auto_mod')) {
          // Try to extract keyword from extra data
          const extra = auditLogEntry.extra as any;
          const keyword = extra.keyword || extra.content;
          if (keyword) {
            description += `\n\n**Triggered by:** \`${keyword}\``;
          } else {
            description += `\n\n**Reason:** ${reason}`;
          }
        } else {
          description += `\n\n**Reason:** ${reason}`;
        }
      }

      // Get appropriate emoji and title
      const emoji = getActionEmoji(actionType, targetType);

      const embed = embedTemplate()
        .setAuthor(null)
        .setFooter(null)
        .setTitle(`${emoji} ${targetType} ${actionType}`)
        .setDescription(description)
        .setTimestamp();

      // Set color based on action type
      switch (actionType) {
        case 'Create':
          embed.setColor(Colors.Green);
          break;
        case 'Update':
          embed.setColor(Colors.Yellow);
          break;
        case 'Delete':
          embed.setColor(Colors.Red);
          break;
        default:
          embed.setColor(Colors.Blue);
      }

      // Add executor info if available
      if (executor && executor.tag && executor.id !== guild.client.user?.id) {
        embed.setFooter({
          text: `Action by ${executor.tag}`,
          iconURL: executor.displayAvatarURL({ size: 32 }),
        });
      } else if (targetType.toLowerCase().includes('automod') || targetType.toLowerCase().includes('auto_mod')) {
        // For AutoMod, try to get the user who triggered it
        if (auditLogEntry.executorId && auditLogEntry.executorId !== guild.client.user?.id) {
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
        } else {
          embed.setFooter({
            text: 'Automated action',
          });
        }
      }

      await channelAuditlog.send({ embeds: [embed] });
    } catch (error) {
      log.error(F, `Error sending audit log message: ${error}`);
    }
  },
};

export default guildAuditLogEntryCreate;
