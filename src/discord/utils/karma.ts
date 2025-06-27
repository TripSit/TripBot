import {
  DMChannel,
  Message,
  TextChannel,
} from 'discord.js';
import _ from 'underscore';

export default karma;

const lastKarma = {};

/**
 * karma
 * @param {Message} message The message that was sent
 * @return {Promise<void>}
* */
export async function karma(message: Message): Promise<void> {
  if (!message.guild || message.guild.id !== env.DISCORD_GUILD_ID || message.author.bot) return; // If not in tripsit or a bot message, ignore

  const match = message.content.match(/^(.+)(\+\+|--)$/);
  if (match && match[1].length < 25) {
    match[1] = match[1].replace(/(\+-)/g, '').replace(/:/g, '').trim();

    const timeout = 5000;
    if (_.has(lastKarma, message.author.id) && lastKarma[message.author.id as keyof typeof lastKarma] + timeout > Date.now()) {
      if (message.channel instanceof TextChannel || message.channel instanceof DMChannel) {
        message.channel.send('Try again in a few seconds : - )');
      }
      return;
    }

    if (message.channel instanceof TextChannel || message.channel instanceof DMChannel) {
      const lowerCaseMatch = match[1].toLowerCase();
      const memberName = message.member?.displayName.toLowerCase();
      const username = message.author.username.toLowerCase();

      if (memberName === lowerCaseMatch || username === lowerCaseMatch) {
        message.channel.send('Stop playing with yourself : - )');
      }
    }
  }
}
