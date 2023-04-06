import { stripIndents } from 'common-tags';
import {
  Colors,
  TextChannel,
} from 'discord.js';
import {
  GuildAuditLogEntryCreateEvent,
} from '../@types/eventDef';
import { embedTemplate } from '../utils/embedTemplate';

const F = f(__filename); // eslint-disable-line

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export const channelCreate: GuildAuditLogEntryCreateEvent = {
  name: 'guildAuditLogEntryCreate',
  async execute(auditLogEntry, guild) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (guild.id !== env.DISCORD_GUILD_ID) return;
    // We have other scripts to handle message events
    if (auditLogEntry.targetType === 'Message') {
      return;
    }

    // log.debug(F, `auditLogEntry: ${JSON.stringify(auditLogEntry, null, 2)}`);

    const channelAuditlog = await discordClient.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;

    const changeString = auditLogEntry.changes
      .map(change => `\n${change.key}: ${change.old ?? '<none>'} -> ${change.new ?? '<none>'}`)
      .join('');

    const { executor } = auditLogEntry;
    // log.debug(F, `executor: ${JSON.stringify(executor, null, 2)}`);
    const actionType = `${auditLogEntry.actionType.toLowerCase()}d`;
    // log.debug(F, `actionType: ${JSON.stringify(actionType, null, 2)}`);
    const targetType = auditLogEntry.targetType.toLowerCase();
    // log.debug(F, `targetType: ${JSON.stringify(targetType, null, 2)}`);
    // const target = JSON.stringify(auditLogEntry.target, null, 2);
    // log.debug(F, `target: ${JSON.stringify(target, null, 2)}`);
    // const reason = auditLogEntry.reason ? `\nReason: ${JSON.stringify(auditLogEntry.reason, null, 2)}` : '';
    // log.debug(F, `reason: ${JSON.stringify(reason, null, 2)}`);
    // const extra = auditLogEntry.extra ? `\nExtra: ${JSON.stringify(auditLogEntry.extra, null, 2)}` : '';
    // log.debug(F, `extra: ${JSON.stringify(extra, null, 2)}`);

    const embed = embedTemplate()
      .setAuthor(null)
      .setFooter(null)
      .setTitle(`${auditLogEntry.targetType} ${auditLogEntry.actionType}`)
      .setDescription(stripIndents`
        ${executor} ${actionType} ${targetType} ${actionType !== 'deleted' ? auditLogEntry.target : ''}\
        ${changeString}
      `);
    switch (auditLogEntry.actionType) {
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
        embed.setColor(Colors.Default);
    }

    await channelAuditlog.send({ embeds: [embed] });
  },
};

export default channelCreate;
