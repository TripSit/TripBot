import type { Message } from 'discord.js';

import { stripIndents } from 'common-tags';
import { DMChannel, TextChannel } from 'discord.js';

import { sleep } from './sleep';

const F = f(__filename);

export default awayMessage;

export async function awayMessage(message: Message): Promise<void> {
  // Check if the message mentions the bot owner
  if (!message.mentions.users.has(env.DISCORD_OWNER_ID)) {
    return;
  }

  const userData = await db.users.upsert({
    create: {
      discord_id: message.author.id,
    },
    update: {},
    where: {
      discord_id: message.author.id,
    },
  });
  if (userData.timezone) {
    // Check if it is after 8pm, or before 7am
    const userTime = new Date().toLocaleString('en-US', { timeZone: userData.timezone });
    const userHour = new Date(userTime).getHours();
    // log.debug(F, `userHour: ${userHour}`);
    if (userHour >= 21 || userHour <= 7) {
      const channelMessages = await (message.channel as TextChannel).messages.fetch();
      const moonbearMessages = channelMessages.filter(
        (message_) => message_.author.id === env.DISCORD_OWNER_ID,
      );
      const lastMessage = moonbearMessages
        .sort((a, b) => b.createdTimestamp - a.createdTimestamp)
        .first();
      if (lastMessage && lastMessage.createdTimestamp > Date.now() - 30 * 60 * 1000) {
        return;
      }

      if (message.channel instanceof TextChannel || message.channel instanceof DMChannel) {
        await message.channel.sendTyping();
        await sleep(1000);
        await message.channel.send(
          stripIndents`Hey ${message.member?.displayName}, Moonbear is probably sleeping, \
          but they will get back to you when they can!`,
        );
      } else {
        log.error(F, 'Cannot send typing in this channel type.');
      }
    }
  }
}
