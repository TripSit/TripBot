import {
  Guild,
  User,
  time,
} from 'discord.js';
import {
  ChannelType,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';

const F = f(__filename);

type MessageInfo = {
  channel: string;
  content: string;
  timestamp: Date;
};

export default last;

/**
 * {interaction} interaction
 * @param {GuildMember} target
 */
export async function last(
  target:User,
  guild: Guild,
):Promise<{
    lastMessage: string;
    messageList: string;
    messageCount: number;
    totalMessages: number;
  }> {
  // This function will find all messages sent by the user in all channels
  // and return an array of messages
  let totalMessages = 0;
  const messageInfo = [] as MessageInfo[];

  const channels = await guild.channels.fetch();
  await Promise.all(channels.map(async channel => {
    if (!channel) return;
    if (channel.parentId === env.CATEGORY_TEAMTRIPSIT) return;
    if (channel.parentId === env.CATEGORY_DEVELOPMENT) return;
    if (channel.type !== ChannelType.GuildText) return;
    try {
      const messages = await channel.messages.fetch();
      const memberMessages = messages.filter(message => message.author.id === target.id);
      totalMessages += memberMessages.size;
      // Get the info for each message and append it to messageInfo
      memberMessages.forEach(message => {
        messageInfo.push({
          channel: `<#${message.channelId}>`,
          content: message.content,
          timestamp: message.createdAt,
        });
      });
    } catch (error) {
      log.error(F, `error: ${error}`);
    }
  }));

  if (messageInfo.length === 0) {
    return {
      lastMessage: 'No messages found',
      messageList: 'No messages found',
      messageCount: 0,
      totalMessages: 0,
    };
  }

  // Sort the messages by timestamp
  messageInfo.sort((a, b) => a.timestamp.valueOf() - b.timestamp.valueOf());

  // Get the most recent message
  const lastMessage = messageInfo[messageInfo.length - 1];
  const lastMessageText = stripIndents`
          **${target.username}'s** last message was:
           ${time(lastMessage.timestamp, 'd')} ${lastMessage.channel}: ${lastMessage.content}`;

  // Reverse the order: Display most recent messages first
  messageInfo.reverse();
  let messageString = '';
  let messageStringIndex = 0;
  messageInfo.forEach(message => {
    const messageStringTemp = `${time(message.timestamp, 'd')} ${message.channel}: ${message.content}\n`;
    if (messageString.length + messageStringTemp.length < 1950) {
      messageStringIndex += 1;
      messageString += messageStringTemp;
    }
  });

  return {
    lastMessage: lastMessageText,
    messageList: messageString,
    messageCount: messageStringIndex,
    totalMessages,
  };
}
