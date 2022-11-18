/* eslint-disable max-len */
import {
  GuildMember,
  time,
  Guild,
} from 'discord.js';
import {
  ChannelType,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
// import env from '../utils/env.config';
import * as path from 'path';
import log from '../utils/log';

const PREFIX = path.parse(__filename).name;

export default last;

/**
 * {interaction} interaction
 * @param {GuildMember} target
 */
export async function last(
  target:GuildMember,
):Promise<{
    lastMessage: string;
    messageList: string;
    messageCount: number;
    totalMessages: number;
  }> {
  // log.debug(`[${PREFIX}] started!`);
  // This function will find all messages sent by the user in all channels
  // and return an array of messages
  const guild = target.guild as Guild;
  let totalMessages = 0;
  const messageInfo = [] as any[];

  return new Promise(async (resolve) => { // eslint-disable-line
    await guild.channels.fetch()
      .then(async (channels) => {
        await Promise.all(
          channels.map(async (channel) => {
            if (!channel) return;
            if (channel.type === ChannelType.GuildText) {
              await channel.messages.fetch()
                .then(async (messages) => {
                  const memberMessages = messages.filter((message) => message.author.id === target.id);
                  totalMessages += memberMessages.size;
                  // Get the info for each message and append it to messageInfo
                  memberMessages.forEach((message) => {
                  // log.debug(`[${PREFIX}] message: ${JSON.stringify(message, null, 2)}`);
                    messageInfo.push({
                      channel: `<#${message.channelId}>`,
                      content: message.content,
                      timestamp: message.createdAt,
                    });
                  });
                });
            }
          }),
        )
          .then(async () => {
            log.debug(`[${PREFIX}] messageInfo: ${JSON.stringify(messageInfo, null, 2)}`);
            if (messageInfo.length === 0) {
              resolve({
                lastMessage: 'No messages found',
                messageList: 'No messages found',
                messageCount: 0,
                totalMessages: 0,
              });
              return;
            }

            // Sort the messages by timestamp
            messageInfo.sort((a, b) => a.timestamp - b.timestamp);

            // Get the most recent message
            const lastMessage = messageInfo[messageInfo.length - 1];
            const lastMessageText = stripIndents`
          **${target.displayName}'s** last message was:
           ${time(lastMessage.timestamp, 'd')} ${lastMessage.channel}: ${lastMessage.content}`;

            // Reverse the order: Display most recent messages first
            messageInfo.reverse();
            let messageString = '';
            let messageStringIndex = 0;
            messageInfo.forEach((message) => {
              const messageStringTemp = `${time(message.timestamp, 'd')} ${message.channel}: ${message.content}\n`;
              // const messageUrl = `https://discord.com/channels/${guild.id}/${message.channel.id}/${message.id}`;
              // log.debug(`[${PREFIX}] messageStringTemp: ${messageStringTemp}`);
              // log.debug(`[${PREFIX}] size: ${messageString.length + messageStringTemp.length}`);
              if (messageString.length + messageStringTemp.length < 1950) {
                messageStringIndex += 1;
                messageString += messageStringTemp;
              }
            });

            // log.debug(`[${PREFIX}] messageString: ${messageString}`);
            // log.debug(`[${PREFIX}] messageStringIndex: ${messageStringIndex}`);

            // log.debug(`[${PREFIX}] messageString: ${JSON.stringify(messageString, null, 2)}`);
            resolve({
              lastMessage: lastMessageText,
              messageList: messageString,
              messageCount: messageStringIndex,
              totalMessages,
            });
          });
      });
  });
}
