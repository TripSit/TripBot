import { stripIndents } from 'common-tags';
import {
  Colors,
  TextChannel,
} from 'discord.js';
import {
  GuildAuditLogEntryCreateEvent,
} from '../@types/eventDef';
import embedTemplate from '../utils/embedTemplate'; // eslint-disable-line

const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default channelCreate;

export const channelCreate: GuildAuditLogEntryCreateEvent = {
  name: 'guildAuditLogEntryCreate',
  async execute(auditLogEntry, guild) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (guild.id !== env.DISCORD_GUILD_ID) return;

    log.debug(F, `auditLogEntry: ${JSON.stringify(auditLogEntry, null, 2)}`);

    const channelAuditlog = await client.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;

    const changeString = auditLogEntry.changes
      .map(change => `\n${change.key}: ${change.old ?? '<none>'} -> ${change.new ?? '<none>'}`)
      .join('');

    const embed = embedTemplate()
      .setAuthor(null)
      .setFooter(null)
      .setTitle(`${auditLogEntry.targetType} ${auditLogEntry.actionType}`)
      .setDescription(stripIndents`
      ${auditLogEntry.executor} ${auditLogEntry.actionType.toLowerCase()}ed ${auditLogEntry.target}\
      ${auditLogEntry.reason ? `\nReason: ${JSON.stringify(auditLogEntry.reason, null, 2)}` : ''}\
      ${auditLogEntry.extra ? `\nExtra: ${JSON.stringify(auditLogEntry.extra, null, 2)}` : ''} \
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
