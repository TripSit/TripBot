import {
  ButtonBuilder,
  ButtonStyle,
  Client,
  // ComponentEmojiResolvable,
  // APIMessageComponentEmoji,
} from 'discord.js';
import { Buttons } from '../../global/@types/global';

const F = f(__filename); // eslint-disable-line

export async function emojiCache(client: Client):Promise<void> {
  global.emojiGuildRPG = await client.guilds.fetch(env.DISCORD_EMOJI_GUILD_RPG);
  global.emojiGuildMain = await client.guilds.fetch(env.DISCORD_EMOJI_GUILD_MAIN);

  await global.emojiGuildRPG.emojis.fetch();
  await global.emojiGuildMain.emojis.fetch();

  global.emojiGet = get;

  global.buttons = {} as Buttons;
  global.buttons.name = customButton('rpgName', 'Name', '📝', ButtonStyle.Primary);
  global.buttons.accept = customButton('rpgAccept', 'Accept', '✅', ButtonStyle.Success);
  global.buttons.decline = customButton('rpgDecline', 'Decline', '❌', ButtonStyle.Danger);
  global.buttons.start = customButton('rpgStart', 'Start', 'buttonStart', ButtonStyle.Success);
  global.buttons.quit = customButton('rpgQuit', 'Quit', 'buttonQuit', ButtonStyle.Danger);
  global.buttons.town = customButton('rpgTown', 'Town', 'buttonTown', ButtonStyle.Primary);
  global.buttons.bounties = customButton('rpgBounties', 'Bounties', 'buttonBounties', ButtonStyle.Primary);
  global.buttons.market = customButton('rpgMarket', 'Market', 'buttonMarket', ButtonStyle.Primary);
  global.buttons.arcade = customButton('rpgArcade', 'Arcade', 'buttonArcade', ButtonStyle.Primary);
  global.buttons.home = customButton('rpgHome', 'Home', 'buttonHome', ButtonStyle.Primary);
  global.buttons.quest = customButton('rpgQuest', 'Quest', 'buttonQuest', ButtonStyle.Secondary);
  global.buttons.dungeon = customButton('rpgDungeon', 'Dungeon', 'buttonDungeon', ButtonStyle.Secondary);
  global.buttons.raid = customButton('rpgRaid', 'Raid', 'buttonRaid', ButtonStyle.Secondary);
  global.buttons.inventory = customButton('rpgInventory', 'Inventory', 'itemInventory', ButtonStyle.Primary);
  global.buttons.stats = customButton('rpgStats', 'Stats', '📊', ButtonStyle.Primary);
  global.buttons.guild = customButton('rpgGuild', 'Guild', '🏰', ButtonStyle.Primary);
  global.buttons.buy = customButton('rpgMarketBuy', 'Buy', 'buttonBuy', ButtonStyle.Success);
  global.buttons.slotMachine = customButton('rpgSlots', 'Slots', '🎰', ButtonStyle.Primary);
  global.buttons.coinFlip = customButton('rpgCoinFlip', 'CoinFlip', 'buttonCoinflip', ButtonStyle.Secondary);
  global.buttons.roulette = customButton('rpgRoulette', 'Roulette', 'buttonRoulette', ButtonStyle.Secondary);
  global.buttons.blackjack = customButton('rpgBlackjack', 'Blackjack', '🃏', ButtonStyle.Primary);
  global.buttons.trivia = customButton('rpgTrivia', 'Trivia', 'buttonTrivia', ButtonStyle.Secondary);
  global.buttons.wager1 = customButton('rpgWager1', 'Bet 1', 'buttonBetSmall', ButtonStyle.Success);
  global.buttons.wager10 = customButton('rpgWager10', 'Bet 10', 'buttonBetMedium', ButtonStyle.Success);
  global.buttons.wager100 = customButton('rpgWager100', 'Bet 100', 'buttonBetLarge', ButtonStyle.Success);
  global.buttons.wager1000 = customButton('rpgWager1000', 'Bet 1000', 'buttonBetHuge', ButtonStyle.Success);
  global.buttons.wager10000 = customButton('rpgWager10000', 'Bet 10000', 'buttonBetHuge', ButtonStyle.Success);
  global.buttons.wager100000 = customButton('rpgWager100000', 'Bet 100000', 'buttonBetHuge', ButtonStyle.Success);
  global.buttons.coinflipHeads = customButton('rpgCoinflipHeads', 'Heads', 'buttonHeads', ButtonStyle.Secondary);
  global.buttons.coinflipTails = customButton('rpgCoinflipTails', 'Tails', 'buttonTails', ButtonStyle.Secondary);
  global.buttons.rouletteRed = customButton('rpgRouletteRed', 'Red', 'buttonHalf', ButtonStyle.Secondary);
  global.buttons.rouletteBlack = customButton('rpgRouletteBlack', 'Black', 'buttonHalf', ButtonStyle.Secondary);
  global.buttons.rouletteFirst = customButton('rpgRouletteFirst', 'First Row', 'buttonRows', ButtonStyle.Secondary);
  global.buttons.rouletteSecond = customButton('rpgRouletteSecond', 'Second Row', 'buttonRows', ButtonStyle.Secondary);
  global.buttons.rouletteThird = customButton('rpgRouletteThird', 'Third Row', 'buttonRows', ButtonStyle.Secondary);
  global.buttons.rouletteOdd = customButton('rpgRouletteOdd', 'Odd', 'buttonBoxA', ButtonStyle.Secondary);
  global.buttons.rouletteEven = customButton('rpgRouletteEven', 'Even', 'buttonBoxB', ButtonStyle.Secondary);
  global.buttons.roulette1to12 = customButton('roulette1to12', '1-12', 'menuNormal', ButtonStyle.Secondary);
  global.buttons.roulette13to24 = customButton('roulette13to24', '13-24', 'menuHard', ButtonStyle.Secondary);
  global.buttons.roulette25to36 = customButton('roulette25to36', '25-36', 'menuExpert', ButtonStyle.Secondary);
  global.buttons.rouletteHigh = customButton('rpgRouletteHigh', 'High', 'buttonUpDown', ButtonStyle.Secondary);
  global.buttons.rouletteLow = customButton('rpgRouletteLow', 'Low', 'buttonUpDown', ButtonStyle.Secondary);
  global.buttons.rouletteZero = customButton('rpgRouletteZero', '0', 'menuEasy', ButtonStyle.Secondary);
  global.buttons.blackjackHit = customButton('rpgBlackjackHit', 'Hit', '🃏', ButtonStyle.Primary);
  global.buttons.blackjackStand = customButton('rpgBlackjackStand', 'Stand', '🃏', ButtonStyle.Primary);
  global.buttons.blackjackDouble = customButton('rpgBlackjackDouble', 'Double', '🃏', ButtonStyle.Primary);
  global.buttons.blackjackSplit = customButton('rpgBlackjackSplit', 'Split', '🃏', ButtonStyle.Primary);
  global.buttons.blackjackSurrender = customButton('rpgBlackjackSurrender', 'Surrender', '🃏', ButtonStyle.Primary);
}

function customButton(
  customId: string,
  label: string,
  emojiName: string,
  style?: ButtonStyle,
):ButtonBuilder {
  // log.debug(F, `await customButton(${customId}, ${label}, ${emojiName}, ${style})`);
  const button = new ButtonBuilder();

  button.setCustomId(customId);
  button.setLabel(label);
  button.setStyle(style || ButtonStyle.Success);

  // check if name is already an emoji and if so, return that
  if (emojiName.length < 4) {
    button.setEmoji(emojiName);
    return button;
  }

  button.setEmoji(get(emojiName));

  return new ButtonBuilder();
}

export function get(name:string):string {
  if (!global.emojiGuildRPG) {
    throw new Error('Emoji cache not initialized!');
  }

  const emojiName = global.emojiGuildRPG.emojis.cache.find(emoji => emoji.name === name)
    ?? global.emojiGuildRPG.emojis.cache.find(emoji => emoji.name === name);
  if (!emojiName) {
    throw new Error(`Emoji ${name} not found!`);
  }

  return emojiName.name as string;
}
