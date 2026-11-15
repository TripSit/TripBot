import {
  APIMessageComponentEmoji,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Guild,
} from 'discord.js';

const F = f(__filename); // eslint-disable-line

let emojiGuildRPG:Guild;
let emojiGuildMain:Guild;

export function get(name:string):APIMessageComponentEmoji {
  if (name.startsWith('<:')) {
    const emoji = /<:(.*):(\d+)>/.exec(name);
    if (!emoji) {
      throw new Error(`Emoji ${name} not found!`);
    }
    return {
      name: emoji[1],
      id: emoji[2],
    };
  }

  try {
    const emojiName = emojiGuildRPG.emojis.cache.find(emoji => emoji.name === name)
    ?? emojiGuildMain.emojis.cache.find(emoji => emoji.name === name);
    if (!emojiName) {
      throw new Error(`Emoji ${name} not found!`);
    }
    return emojiName as APIMessageComponentEmoji;
  } catch (err) {
    log.error(F, `Error fetching emoji ${name}: ${err}`);
    return {
      name: 'ts_heart',
      id: '978649029200216085',
    };
  }
}

export function customButton(
  customId: string,
  label: string,
  emojiName: string,
  style?: ButtonStyle,
):ButtonBuilder {
  // check if name is already an emoji and if so, return that
  if (emojiName.length < 4) {
    return new ButtonBuilder()
      .setEmoji(emojiName)
      .setCustomId(customId)
      .setLabel(label)
      .setStyle(style ?? ButtonStyle.Success);
  }

  const emoji = get(emojiName);

  return new ButtonBuilder()
    .setEmoji(emoji.id as string)
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(style ?? ButtonStyle.Success);
}

export async function emojiCache(discordClient: Client):Promise<void> {
  try {
    emojiGuildRPG = await discordClient.guilds.fetch(env.DISCORD_EMOJI_GUILD_RPG);
    await emojiGuildRPG.emojis.fetch();
  } catch (err) {
    log.error(F, `Error fetching RPG Emojis, is the bot in the emoji guild?: ${err}`);
  }

  try {
    emojiGuildMain = await discordClient.guilds.fetch(env.DISCORD_EMOJI_GUILD_MAIN);
    await emojiGuildMain.emojis.fetch();
  } catch (err) {
    log.error(F, `Error fetching Main Emojis, is the bot in the emoji guild?: ${err}`);
  }

  global.emojiGet = get;
}
