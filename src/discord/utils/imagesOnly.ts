import type { Message } from 'discord.js';

export default imagesOnly;

const F = f(__filename);  // eslint-disable-line

export async function imagesOnly(message: Message): Promise<void> {
  if (!message.guild) {
    return;
  } // If not in a guild then ignore all messages
  if (message.guild.id !== env.DISCORD_GUILD_ID) {
    return;
  } // If not in tripsit ignore all messages
  if (message.channel.id !== env.CHANNEL_MEMES) {
    return;
  } // Only do this in the memes channel
  if (message.embeds.length === 0 && message.attachments.size === 0) {
    message.delete();
  }
}
