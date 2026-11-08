import {
  Colors,
  TextChannel,
  escapeMarkdown,
} from 'discord.js';
import {
  GuildAuditLogEntryCreateEvent,
} from '../@types/eventDef';
import { embedTemplate } from '../utils/embedTemplate';
import {
  AuditChange,
  EMBED_DESCRIPTION_LIMIT,
  createActionDescription,
  formatChange,
  getActionEmoji,
  truncate,
} from '../utils/auditLogFormat';

const F = f(__filename);

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
          .map(change => formatChange(change as AuditChange, targetType))
          .join('\n')
        : '';

      const mainDescription = createActionDescription(auditLogEntry);
      const isAutoMod = /auto_?mod/i.test(targetType);

      let description = mainDescription;
      if (changesText) {
        description += `\n\n${changesText}`;
      }

      // Handle reason with special formatting for AutoMod
      if (reason) {
        // `extra` is null for most entry types, so it must be guarded
        const extra = auditLogEntry.extra as { keyword?: string, content?: string } | null | undefined;
        const keyword = isAutoMod ? (extra?.keyword || extra?.content) : undefined;
        if (keyword) {
          description += `\n\n**Triggered by:** \`${keyword.replace(/`/g, "'")}\``;
        } else {
          description += `\n\n**Reason:** ${escapeMarkdown(reason)}`;
        }
      }

      // Get appropriate emoji and title
      const emoji = getActionEmoji(actionType, targetType);

      const embed = embedTemplate()
        .setAuthor(null)
        .setFooter(null)
        .setTitle(`${emoji} ${targetType} ${actionType}`)
        .setDescription(truncate(description, EMBED_DESCRIPTION_LIMIT))
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
      } else if (isAutoMod) {
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
