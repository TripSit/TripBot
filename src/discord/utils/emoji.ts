import type { APIMessageComponentEmoji, Client, Guild } from 'discord.js';

import { ButtonBuilder, ButtonStyle } from 'discord.js';

const F = f(__filename);

// export const difficulties = [
//   {
//     label: 'Normal Difficulty',
//     value: 'easy',
//     emoji: 'menuNormal',
//     default: true,
//   },
//   {
//     label: 'Hard Difficulty (50% difficulty bonus)',
//     value: 'medium',
//     emoji: 'menuHard',
//   },
//   {
//     label: 'Expert Difficulty (100% difficulty bonus)',
//     value: 'hard',
//     emoji: 'menuExpert',
//   },
// ];

// export const numberOfQuestions = [
//   {
//     label: '5 Questions (50% perfect bonus)',
//     value: '5',
//     emoji: 'menuShort',
//     default: true,
//   },
//   {
//     label: '10 Questions (100% perfect bonus)',
//     value: '10',
//     emoji: 'menuMedium',
//   },
//   {
//     label: '20 Questions (200% perfect bonus)',
//     value: '20',
//     emoji: 'menuLong',
//   },
// ];

let emojiGuildRPG: Guild;
let emojiGuildMain: Guild;

export function customButton(
  customId: string,
  label: string,
  emojiName: string,
  style?: ButtonStyle,
): ButtonBuilder {
  // log.debug(F, `await customButton(${customId}, ${label}, ${emojiName}, ${style})`);

  // check if name is already an emoji and if so, return that
  if (emojiName.length < 4) {
    return new ButtonBuilder()
      .setEmoji(emojiName)
      .setCustomId(customId)
      .setLabel(label)
      .setStyle(style || ButtonStyle.Success);
  }

  // log.debug(F, `get(${emojiName}) = ${get(emojiName)}`);

  const emoji = get(emojiName);
  // log.debug(F, `emoji: ${JSON.stringify(emoji, null, 2)} (type: ${typeof emoji})`);

  return new ButtonBuilder()
    .setEmoji(emoji.id!)
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(style || ButtonStyle.Success);
}

export async function emojiCache(discordClient: Client): Promise<void> {
  try {
    emojiGuildRPG = await discordClient.guilds.fetch(env.DISCORD_EMOJI_GUILD_RPG);
    await emojiGuildRPG.emojis.fetch();
  } catch (error) {
    log.error(F, `Error fetching RPG Emojis, is the bot in the emoji guild?: ${error}`);
  }

  try {
    emojiGuildMain = await discordClient.guilds.fetch(env.DISCORD_EMOJI_GUILD_MAIN);
    await emojiGuildMain.emojis.fetch();
  } catch (error) {
    log.error(F, `Error fetching Main Emojis, is the bot in the emoji guild?: ${error}`);
  }

  globalThis.emojiGet = get;
}

export function get(name: string): APIMessageComponentEmoji {
  if (name.startsWith('<:')) {
    // log.debug(F, `name.startsWith('<:')`);
    const emoji = /<:(.*):(\d+)>/.exec(name);
    // log.debug(F, `emoji: ${JSON.stringify(emoji, null, 2)}`);
    if (!emoji) {
      throw new Error(`Emoji ${name} not found!`);
    }
    return {
      id: emoji[2],
      name: emoji[1],
    };
  }

  try {
    const emojiName =
      emojiGuildRPG.emojis.cache.find((emoji) => emoji.name === name) ??
      emojiGuildMain.emojis.cache.find((emoji) => emoji.name === name);
    // log.debug(F, `emojiName: ${emojiName}`);
    if (!emojiName) {
      throw new Error(`Emoji ${name} not found!`);
    }
    return emojiName as APIMessageComponentEmoji;
  } catch (error) {
    log.error(F, `Error fetching emoji ${name}: ${error}`);
    return {
      id: '978649029200216085',
      name: 'ts_heart',
    };
  }
}
