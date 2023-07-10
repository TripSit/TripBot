import {
  TextChannel,
  Colors,
  PermissionResolvable,
  User,
  GuildAuditLogsEntry,
} from 'discord.js';
import {
// ChannelType,
  AuditLogEvent, ChannelType,
} from 'discord-api-types/v10';
import {
  MessageDeleteEvent,
} from '../@types/eventDef';
import { embedTemplate } from '../utils/embedTemplate';
import { checkChannelPermissions, checkGuildPermissions } from '../utils/checkPermissions'; // eslint-disable-line
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
    const startTime = Date.now();
    log.info(F, `Message in ${message.channel.name} was deleted.`);
    // log.debug(F, `message: ${JSON.stringify(message, null, 2)}`);

    // Get the channel this will be posted in
    const msglogChannel = await message.client.channels.fetch(env.CHANNEL_MSGLOG) as TextChannel;
    const channelPerms = await checkChannelPermissions(msglogChannel, [
      'ViewChannel' as PermissionResolvable,
      'SendMessages' as PermissionResolvable,
    ]);
    if (!channelPerms.hasPermission) {
      const guildOwner = await msglogChannel.guild.fetchOwner();
      await guildOwner.send({ content: `Please make sure I can ${channelPerms.permission} in ${msglogChannel.name} so I can run ${F}!` }); // eslint-disable-line
      log.error(F, `Missing permission ${channelPerms.permission} in ${msglogChannel.name}!`);
      return;
    }

    const perms = await checkGuildPermissions(message.guild, [
      'ViewAuditLog' as PermissionResolvable,
    ]);
    if (!perms.hasPermission) {
      const guildOwner = await message.guild.fetchOwner();
      await guildOwner.send({ content: `Please make sure I can ${perms.permission} in ${message.guild} so I can show to message delete logs!` }); // eslint-disable-line
      log.error(F, `Missing permission ${perms.permission} in ${message.guild}!`);
      return;
    }

    // log.debug(F, `Message Author: ${message.author}`);

    const deletionLog = (await message.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MessageDelete,
    })).entries.last() as GuildAuditLogsEntry<AuditLogEvent.MessageDelete, 'Delete', 'Message', AuditLogEvent.MessageDelete>; // eslint-disable-line

    log.debug(F, `Deletion Log: ${JSON.stringify(deletionLog, null, 2)}`);

    // Perform a coherence check to make sure that there's *something*
    let executorUser = {} as User;
    let content = 'No content'; // eslint-disable-line
    let { author } = message;
    // log.debug(F, `Author: ${JSON.stringify(author, null, 2)}`);
    // log.debug(F, `Target: ${JSON.stringify(deletionLog?.target, null, 2)}`);
    if (deletionLog
      && author
      && deletionLog.target.id === author.id
      && deletionLog.createdTimestamp > (startTime - 1)) {
      // log.debug(F, `Found relevant audit log: ${JSON.stringify(deletionLog, null, 2)}`);
      if (deletionLog.executor) {
        executorUser = deletionLog.executor;
        if (message.content) {
          content = message.content;
        }
      }
    } else {
      log.debug(F, 'No relevant audit logs were found. This usually means the user deleted the message themselves');
      if (message.author) {
        executorUser = message.author;
        content = message.content;
      } else {
        const messageRecord = message.channel.messages.cache.find(m => m.id === message.id);
        if (messageRecord) {
          executorUser = messageRecord.author;
          content = messageRecord.content;
          author = messageRecord.author;
        } else {
          log.debug(F, 'Message not found in cache');
        }
      }
    }

    log.debug(F, `Executor: ${JSON.stringify(executorUser, null, 2)}, Content: ${content}`);

    const executorMember = await message.guild.members.fetch(executorUser.id);
    log.debug(F, `Executor Member: ${JSON.stringify(executorMember, null, 2)}, Content: ${content}`);

    const authorName = author ? author.username : 'Unknown Author';
    // log.debug(F, `Author Name: ${authorName}`);
    // const channelName = message.channel ? (message.channel as TextChannel).name : 'Unknown';

    const embed = embedTemplate()
      .setDescription(`**${executorMember ?? 'Someone'} deleted message in ${message.channel.name}**`)
      .setAuthor(null)
      .setFooter(null)
      .setColor(Colors.Red);

    // log.debug(F, `Author Name: ${authorName}, Content: ${content}`);

    if (authorName === 'Unknown Author' && content === 'No content') {
      embed.addFields([
        { name: authorName, value: 'Message not found in cache', inline: true },
      ]);
    }

    log.debug(F, `content.length: ${content.length}`);
    if (content.length > 0 && content !== 'No content') {
      embed.addFields([
        { name: authorName, value: content.slice(0, 1023), inline: true },
      ]);
    }

    if (message.attachments.size > 0) {
      message.attachments.forEach(async attachment => {
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
