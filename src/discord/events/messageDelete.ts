import {
  // ChannelType,
  AuditLogEvent, ChannelType,
} from 'discord-api-types/v10';
import {
  Colors,
  GuildAuditLogsEntry,
  GuildMember,
  PartialGuildMember,
  PartialUser,
  TextChannel,
  User,
} from 'discord.js';
import {
  MessageDeleteEvent,
} from '../@types/eventDef';
import { ensurePermissions } from '../utils/checkPermissions';
import { embedTemplate } from '../utils/embedTemplate';
// eslint-disable-line @typescript-eslint/no-unused-vars
const F = f(__filename); // eslint-disable-line @typescript-eslint/no-unused-vars

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export const messageDelete: MessageDeleteEvent = {
  name: 'messageDelete',
  async execute(message) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (!message.guild) return;
    if (message.guild.id !== env.DISCORD_GUILD_ID) return;
    if (message.channel.type !== ChannelType.GuildText) return;

    // If a message has been saved as a partial, grab it from the cache.
    const deletedMessage = message.author
      ? message
      : message.channel.messages.cache.get(message.id);
    if (!deletedMessage) {
      return;
    }

    const startTime = Date.now();

    // Get the channel this will be posted in
    const msglogChannel = await message.client.channels.fetch(env.CHANNEL_MSGLOG) as TextChannel;
    if (!await ensurePermissions(msglogChannel, ['ViewChannel', 'SendMessages'], F)) return;

    if (!await ensurePermissions(message.guild, ['ViewAuditLog'], F, { reason: 'show message delete logs' })) return;

    const deletionLog = (await message.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MessageDelete,
    })).entries.last() as GuildAuditLogsEntry<AuditLogEvent.MessageDelete, 'Delete', 'Message'>;

    const { author } = deletedMessage;
    const content = deletedMessage.content || 'No content';

    // A matching audit log entry means someone other than the author removed the message. Discord
    // batches these entries, so a missing match usually just means the author deleted it themselves.
    let executorUser: User | PartialUser = author;
    if (deletionLog
      && deletionLog.target
      && deletionLog.target.id === author.id
      && deletionLog.createdTimestamp > (startTime - 1)
      && deletionLog.executor) {
      executorUser = deletionLog.executor;
    }

    let executorMember: GuildMember | PartialGuildMember;
    try {
      executorMember = await message.guild.members.fetch(executorUser.id);
    } catch (err) {
      // log.error(F, `Error fetching executor member: ${err}`);
      return;
    }

    const embed = embedTemplate()
      .setDescription(`**${executorMember ?? 'Someone'} deleted message in ${message.channel.name}**`)
      .setAuthor(null)
      .setFooter(null)
      .setColor(Colors.Red);

    if (content !== 'No content') {
      embed.addFields([
        { name: author.username, value: content.slice(0, 1023), inline: true },
      ]);
    }

    if (deletedMessage.attachments.size > 0) {
      deletedMessage.attachments.forEach(async attachment => {
        embed.setThumbnail(`${attachment.proxyURL}`);
        // const file = new AttachmentBuilder(attachment.proxyURL);
        await msglogChannel.send({ embeds: [embed] });
      });
      return;
    }

    await msglogChannel.send({ embeds: [embed] });
  },
};

export default messageDelete;
