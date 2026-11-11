import {
  DMChannel,
  Message,
  TextChannel,
} from 'discord.js';

export default karma;

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
