import {
  APIMessageComponentEmoji,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Guild,
} from 'discord.js';

const F = f(__filename); // eslint-disable-line

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

let emojiGuildRPG:Guild;
let emojiGuildMain:Guild;

export function get(name:string):APIMessageComponentEmoji {
  if (name.startsWith('<:')) {
    // log.debug(F, `name.startsWith('<:')`);
    const emoji = name.match(/<:(.*):(\d+)>/);
    // log.debug(F, `emoji: ${JSON.stringify(emoji, null, 2)}`);
    if (!emoji) {
      throw new Error(`Emoji ${name} not found!`);
    }
    return {
      name: emoji[1],
      id: emoji[2],
    };
  }

  const emojiName = emojiGuildRPG.emojis.cache.find(emoji => emoji.name === name)
    ?? emojiGuildMain.emojis.cache.find(emoji => emoji.name === name);
  // log.debug(F, `emojiName: ${emojiName}`);
  if (!emojiName) {
    throw new Error(`Emoji ${name} not found!`);
  }

  return emojiName as APIMessageComponentEmoji;
}

export function customButton(
  customId: string,
  label: string,
  emojiName: string,
  style?: ButtonStyle,
):ButtonBuilder {
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
    .setEmoji(emoji.id as string)
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(style || ButtonStyle.Success);
}

export async function emojiCache(client: Client):Promise<void> {
  emojiGuildRPG = await client.guilds.fetch(env.DISCORD_EMOJI_GUILD_RPG);
  emojiGuildMain = await client.guilds.fetch(env.DISCORD_EMOJI_GUILD_MAIN);

  await emojiGuildRPG.emojis.fetch();
  await emojiGuildMain.emojis.fetch();

  global.emojiGet = get;
}
