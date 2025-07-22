import type { Guild, User } from 'discord.js';

import { stripIndents } from 'common-tags';
import { ChannelType } from 'discord-api-types/v10';
import { time } from 'discord.js';

const F = f(__filename);

export default last;

/**
 * {interaction} interaction
 * @param {GuildMember} target
 */
export async function last(
  target: User,
  guild: Guild,
): Promise<{
  lastMessage: string;
  messageCount: number;
  messageList: string;
  totalMessages: number;
}> {
  // log.debug(F, `started!`);
  // This function will find all messages sent by the user in all channels
  // and return an array of messages
  let totalMessages = 0;
  const messageInfo = [] as {
    channel: string;
    content: string;
    timestamp: Date;
  }[];

  return new Promise(async (resolve) => { // eslint-disable-line
    await guild.channels.fetch().then(async (channels) => {
      await Promise.all(
        channels.map(async (channel) => {
          if (!channel) {
            return;
          }
          if (channel.parentId === env.CATEGORY_TEAMTRIPSIT) {
            return;
          }
          if (channel.parentId === env.CATEGORY_DEVELOPMENT) {
            return;
          }
          if (channel.type === ChannelType.GuildText) {
            try {
              await channel.messages.fetch().then(async (messages) => {
                const memberMessages = messages.filter(
                  (message) => message.author.id === target.id,
                );
                totalMessages += memberMessages.size;
                // Get the info for each message and append it to messageInfo
                for (const [, message] of memberMessages) {
                  // log.debug(F, `message: ${JSON.stringify(message, null, 2)}`);
                  messageInfo.push({
                    channel: `<#${message.channelId}>`,
                    content: message.content,
                    timestamp: message.createdAt,
                  });
                }
              });
            } catch (error) {
              log.error(F, `error: ${error}`);
            }
          }
        }),
      ).then(async () => {
        // logger.debug(F, `messageInfo: ${JSON.stringify(messageInfo, null, 2)}`);
        if (messageInfo.length === 0) {
          resolve({
            lastMessage: 'No messages found',
            messageCount: 0,
            messageList: 'No messages found',
            totalMessages: 0,
          });
          return;
        }

        // Sort the messages by timestamp
        messageInfo.sort((a, b) => a.timestamp.valueOf() - b.timestamp.valueOf());

        // Get the most recent message
        const lastMessage = messageInfo.at(-1);
        if (!lastMessage) {
          resolve({
            lastMessage: 'No messages found',
            messageCount: 0,
            messageList: 'No messages found',
            totalMessages: 0,
          });
          return;
        }

        const lastMessageText = stripIndents`
          **${target.username}'s** last message was:
           ${time(lastMessage.timestamp, 'd')} ${lastMessage.channel}: ${lastMessage.content}`;

        // Reverse the order: Display most recent messages first
        messageInfo.reverse();
        let messageString = '';
        let messageStringIndex = 0;
        for (const message of messageInfo) {
          const messageStringTemporary = `${time(message.timestamp, 'd')} ${message.channel}: ${message.content}\n`;
          // const messageUrl = `https://discord.com/channels/${guild.id}/${message.channel.id}/${message.id}`;
          // log.debug(F, `messageStringTemp: ${messageStringTemp}`);
          // log.debug(F, `size: ${messageString.length + messageStringTemp.length}`);
          if (messageString.length + messageStringTemporary.length < 1950) {
            messageStringIndex += 1;
            messageString += messageStringTemporary;
          }
        }

        // log.debug(F, `messageString: ${messageString}`);
        // log.debug(F, `messageStringIndex: ${messageStringIndex}`);

        // log.debug(F, `messageString: ${JSON.stringify(messageString, null, 2)}`);
        resolve({
          lastMessage: lastMessageText,
          messageCount: messageStringIndex,
          messageList: messageString,
          totalMessages,
        });
      });
    });
  });
}
