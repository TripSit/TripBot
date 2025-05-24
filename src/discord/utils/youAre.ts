import {
  Message, TextChannel,
} from 'discord.js';
import { isToxic } from './moderateHatespeech';

export default youAre;

const F = f(__filename);

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
  if (!key || !key[2]) return;

  const chance = env.NODE_ENV === 'production' ? 1 : 100;

  // 1% chance to trigger on prod otherwise 100% chance to trigger on dev
  if (Math.floor(Math.random() * 101) >= chance) return;
  const phrase = key[2];
  // log.info(F, `Phrase: ${phrase}`);
  const response = await isToxic(`You're ${phrase}`);
  if (response.isFlaggedOrLowConfidence) {
    // eslint-disable-next-line max-len
    log.info(F, `Message flagged by ModerateHatespeech API: "You're ${phrase}\n ${response.class} (${response.confidence})"`);
    return;
  }

  await message.channel.send({
    content: `${message.member?.displayName}: You're ${key[2]}.`,
    allowedMentions: {
      parse: [], // disables all mentions (users, roles, everyone)
    },
  });
}
