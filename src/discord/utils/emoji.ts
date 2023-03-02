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
  global.emojiGuildA = await client.guilds.fetch(env.DISCORD_EMOJI_GUILD_A);
  await global.emojiGuildA.emojis.fetch();
  global.emoji = get;
  global.buttons = {} as Buttons;
  global.buttons.name = await customButton('rpgName', 'Name', '📝', ButtonStyle.Primary);
  global.buttons.accept = await customButton('rpgAccept', 'Accept', '✅', ButtonStyle.Success);
  global.buttons.decline = await customButton('rpgDecline', 'Decline', '❌', ButtonStyle.Danger);
  global.buttons.start = await customButton('rpgStart', 'Start', 'buttonStart', ButtonStyle.Success);
  global.buttons.quit = await customButton('rpgQuit', 'Quit', 'buttonQuit', ButtonStyle.Danger);
  global.buttons.town = await customButton('rpgTown', 'Town', 'buttonTown', ButtonStyle.Primary);
  global.buttons.bounties = await customButton('rpgBounties', 'Bounties', 'buttonBounties', ButtonStyle.Primary);
  global.buttons.market = await customButton('rpgMarket', 'Market', 'buttonMarket', ButtonStyle.Primary);
  global.buttons.arcade = await customButton('rpgArcade', 'Arcade', 'buttonArcade', ButtonStyle.Primary);
  global.buttons.home = await customButton('rpgHome', 'Home', 'buttonHome', ButtonStyle.Primary);
  global.buttons.quest = await customButton('rpgQuest', 'Quest', 'buttonQuest', ButtonStyle.Secondary);
  global.buttons.dungeon = await customButton('rpgDungeon', 'Dungeon', 'buttonDungeon', ButtonStyle.Secondary);
  global.buttons.raid = await customButton('rpgRaid', 'Raid', 'buttonRaid', ButtonStyle.Secondary);
  global.buttons.inventory = await customButton('rpgInventory', 'Inventory', 'itemInventory', ButtonStyle.Primary);
  global.buttons.stats = await customButton('rpgStats', 'Stats', '📊', ButtonStyle.Primary);
  global.buttons.guild = await customButton('rpgGuild', 'Guild', '🏰', ButtonStyle.Primary);
  global.buttons.buy = await customButton('rpgMarketBuy', 'Buy', 'buttonBuy', ButtonStyle.Success);
  global.buttons.slotMachine = await customButton('rpgSlots', 'Slots', '🎰', ButtonStyle.Primary);
  global.buttons.coinFlip = await customButton('rpgCoinFlip', 'CoinFlip', 'buttonCoinflip', ButtonStyle.Secondary);
  global.buttons.roulette = await customButton('rpgRoulette', 'Roulette', 'buttonRoulette', ButtonStyle.Secondary);
  global.buttons.blackjack = await customButton('rpgBlackjack', 'Blackjack', '🃏', ButtonStyle.Primary);
  global.buttons.trivia = await customButton('rpgTrivia', 'Trivia', 'buttonTrivia', ButtonStyle.Secondary);
  global.buttons.wager1 = await customButton('rpgWager1', 'Bet 1', 'buttonBetSmall', ButtonStyle.Success);
  global.buttons.wager10 = await customButton('rpgWager10', 'Bet 10', 'buttonBetMedium', ButtonStyle.Success);
  global.buttons.wager100 = await customButton('rpgWager100', 'Bet 100', 'buttonBetLarge', ButtonStyle.Success);
  global.buttons.wager1000 = await customButton('rpgWager1000', 'Bet 1000', 'buttonBetHuge', ButtonStyle.Success);
  global.buttons.wager10000 = await customButton('rpgWager10000', 'Bet 10000', 'buttonBetHuge', ButtonStyle.Success);
  global.buttons.wager100000 = await customButton('rpgWager100000', 'Bet 100000', 'buttonBetHuge', ButtonStyle.Success);
  global.buttons.coinflipHeads = await customButton('rpgCoinflipHeads', 'Heads', 'buttonHeads', ButtonStyle.Secondary);
  global.buttons.coinflipTails = await customButton('rpgCoinflipTails', 'Tails', 'buttonTails', ButtonStyle.Secondary);
  global.buttons.rouletteRed = await customButton('rpgRouletteRed', 'Red', 'buttonHalf', ButtonStyle.Secondary);
  global.buttons.rouletteBlack = await customButton('rpgRouletteBlack', 'Black', 'buttonHalf', ButtonStyle.Secondary);
  global.buttons.rouletteFirst = await customButton('rpgRouletteFirst', 'First Row', 'buttonRows', ButtonStyle.Secondary);
  global.buttons.rouletteSecond = await customButton('rpgRouletteSecond', 'Second Row', 'buttonRows', ButtonStyle.Secondary);
  global.buttons.rouletteThird = await customButton('rpgRouletteThird', 'Third Row', 'buttonRows', ButtonStyle.Secondary);
  global.buttons.rouletteOdd = await customButton('rpgRouletteOdd', 'Odd', 'buttonBoxA', ButtonStyle.Secondary);
  global.buttons.rouletteEven = await customButton('rpgRouletteEven', 'Even', 'buttonBoxB', ButtonStyle.Secondary);
  global.buttons.roulette1to12 = await customButton('roulette1to12', '1-12', 'menuNormal', ButtonStyle.Secondary);
  global.buttons.roulette13to24 = await customButton('roulette13to24', '13-24', 'menuHard', ButtonStyle.Secondary);
  global.buttons.roulette25to36 = await customButton('roulette25to36', '25-36', 'menuExpert', ButtonStyle.Secondary);
  global.buttons.rouletteHigh = await customButton('rpgRouletteHigh', 'High', 'buttonUpDown', ButtonStyle.Secondary);
  global.buttons.rouletteLow = await customButton('rpgRouletteLow', 'Low', 'buttonUpDown', ButtonStyle.Secondary);
  global.buttons.rouletteZero = await customButton('rpgRouletteZero', '0', 'menuEasy', ButtonStyle.Secondary);
  global.buttons.blackjackHit = await customButton('rpgBlackjackHit', 'Hit', '🃏', ButtonStyle.Primary);
  global.buttons.blackjackStand = await customButton('rpgBlackjackStand', 'Stand', '🃏', ButtonStyle.Primary);
  global.buttons.blackjackDouble = await customButton('rpgBlackjackDouble', 'Double', '🃏', ButtonStyle.Primary);
  global.buttons.blackjackSplit = await customButton('rpgBlackjackSplit', 'Split', '🃏', ButtonStyle.Primary);
  global.buttons.blackjackSurrender = await customButton('rpgBlackjackSurrender', 'Surrender', '🃏', ButtonStyle.Primary);
}

async function customButton(
  customId: string,
  label: string,
  emojiName: string,
  style?: ButtonStyle,
):Promise<ButtonBuilder> {
  log.debug(F, `await customButton(${customId}, ${label}, ${emojiName}, ${style})`);
  const button = new ButtonBuilder();

  button.setCustomId(customId);
  button.setLabel(label);
  button.setStyle(style || ButtonStyle.Success);

  // check if name is already an emoji and if so, return that
  if (emojiName.length < 4) {
    button.setEmoji(emojiName);
    return button;
  }

  button.setEmoji(await get(emojiName));

  return new ButtonBuilder();
}

export async function get(name:string):Promise<string> {
  if (!global.emojiGuildA) {
    throw new Error('Emoji cache not initialized!');
  }
  let emojiName = global.emojiGuildA.emojis.cache.find(emoji => emoji.name === name);

  // Fetch the emoji by the name
  if (!emojiName) {
    log.error(F, `Emoji ${name} not found!`);
    const devGuild = global.client.guilds.cache.get('960606557622657026');
    const devEmoji = devGuild?.emojis.cache.find(emoji => emoji.name === name);
    if (devEmoji) {
      log.debug(F, `Emoji ${name} found in dev guild!`);
      // upload emoji to emoji guild
      emojiName = await global.emojiGuildA.emojis.create({ attachment: devEmoji.url, name });
    } else {
      log.error(F, `Emoji ${name} not found in dev guild!`);
      const prodGuild = global.client.guilds.cache.get('179641883222474752');
      const prodEmoji = prodGuild?.emojis.cache.find(emoji => emoji.name === name);
      if (prodEmoji) {
        log.debug(F, `Emoji ${name} found in prod guild!`);
        // upload emoji to emoji guild
        emojiName = await global.emojiGuildA.emojis.create({ attachment: prodEmoji.url, name });
      } else {
        throw new Error(`Emoji ${name} not found in prod guild!`);
      }
    }
  }

  return emojiName.name as string;
}
