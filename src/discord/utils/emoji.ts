import { Client, Emoji } from 'discord.js';

// const F = f(__filename);

export async function emojiCache(client: Client):Promise<void> {
  global.emojiGuildA = await client.guilds.fetch(env.DISCORD_EMOJI_GUILD_A);
  await emojiGuildA.emojis.fetch();
  global.emoji = get;
}

export function get(name:string):Emoji {
  if (!global.emojiGuildA) {
    throw new Error('Emoji cache not initialized!');
  }
  const test = global.emojiGuildA.emojis.cache.find(emoji => emoji.name === name);

  // Fetch the emoji by the name
  if (!test) {
    throw new Error(`Emoji ${name} not found!`);
  }

  return test;
}
