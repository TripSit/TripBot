import {
  Message, TextChannel,
} from 'discord.js';

export default youAre;

// const F = f(__filename);

export function valMatch(
  input:string,
  regex:RegExp,
  expLength:number,
) {
  const key = input.match(regex);
  if (key !== null && key.length === expLength) {
    return key;
  }
  return false;
}

/**
 * youAre
 * @param {Message} message The message that was sent
 * @return {Promise<void>}
* */
export async function youAre(message: Message): Promise<void> {
  if (!message.guild) return; // If not in a guild then ignore all messages
  if (message.guild.id !== env.DISCORD_GUILD_ID) return; // If not in tripsit ignore all messages
  const content = message.cleanContent;

  // Determine if the message was sent in a TextChannel
  if (!(message.channel instanceof TextChannel)) return;

  if (message.channel.parentId === env.CATEGORY_HARMREDUCTIONCENTRE) return;

  const key = valMatch(content, /(\bis\b|\bare\b)\s+([\w\s\d]*?)(\s+)?(,|\.|\band\b|$)/, 5);

  // const chance = env.Node_ENV === 'production' ?  : 1;

  // log.debug(F, `Chance: ${chance}`);
  if (key && key[2] !== '' && (((Math.floor(Math.random() * (101)) / 1) === 1))) {
    message.channel.send(`${message.member?.displayName}: You're ${key[2]}.`);
  }
}
