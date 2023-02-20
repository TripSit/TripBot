import {
  Message,
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
  if (!message.guild) return; // If not in a guild then ignore all messages
  if (message.guild.id !== env.DISCORD_GUILD_ID) return; // If not in tripsit ignore all messages
  if (message.author.bot) return; // If the message was sent by a bot, ignore it

  const match = message.content.match(/^(.+)(\+\+|--)$/);
  if (match && match[1].length < 25) {
    match[1] = match[1].replace(/(\+-)/g, '').replace(/:/g, '').trim();

    const timeout = 5000;
    if (_.has(lastKarma, message.author.id) && lastKarma[message.author.id as keyof typeof lastKarma] + timeout > Date.now()) { // eslint-disable-line max-len
      message.channel.send('Try again in a few seconds : - )');
      return;
    }
    if (message.member?.displayName.toLowerCase() === match[1].toLowerCase()
    || message.author.username.toLowerCase() === match[1].toLowerCase()) {
      message.channel.send('Stop playing with yourself : - )');
    }
    // if (event.channel == event.user) {
    //   return event.reply('Don\'t be a Secretive Sally : - )');
    // }

    // if (match[2] === '++') {
    //   message.channel.send(`I would upvote ${match[1]}`);
    // } else {
    //   message.channel.send(`I would downvote ${match[1]}`);
    // }
  }
}
