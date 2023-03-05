import {
  APIMessageComponentEmoji,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Emoji,
  StringSelectMenuBuilder,
} from 'discord.js';
import { Buttons, Menus } from '../../global/@types/global';

const F = f(__filename); // eslint-disable-line

export const difficulties = [
  {
    label: 'Normal Difficulty',
    value: 'easy',
    emoji: 'menuNormal',
    default: true,
  },
  {
    label: 'Hard Difficulty (50% difficulty bonus)',
    value: 'medium',
    emoji: 'menuHard',
  },
  {
    label: 'Expert Difficulty (100% difficulty bonus)',
    value: 'hard',
    emoji: 'menuExpert',
  },
];

export const numberOfQuestions = [
  {
    label: '5 Questions (50% perfect bonus)',
    value: '5',
    emoji: 'menuShort',
    default: true,
  },
  {
    label: '10 Questions (100% perfect bonus)',
    value: '10',
    emoji: 'menuMedium',
  },
  {
    label: '20 Questions (200% perfect bonus)',
    value: '20',
    emoji: 'menuLong',
  },
];

export async function emojiCache(client: Client):Promise<void> {
  global.emojiGuildRPG = await client.guilds.fetch(env.DISCORD_EMOJI_GUILD_RPG);
  global.emojiGuildMain = await client.guilds.fetch(env.DISCORD_EMOJI_GUILD_MAIN);

  await global.emojiGuildRPG.emojis.fetch();
  await global.emojiGuildMain.emojis.fetch();

  global.emojiGet = get;

  global.buttons = {} as Buttons;
  global.buttons.name = customButton('rpgName', 'Name', '📝', ButtonStyle.Primary);
  global.buttons.accept = customButton('rpgAccept', 'Accept', 'buttonAccept', ButtonStyle.Success);
  global.buttons.decline = customButton('rpgDecline', 'Decline', 'buttonQuit', ButtonStyle.Danger);
  global.buttons.start = customButton('rpgStart', 'Start', 'buttonStart', ButtonStyle.Success);
  global.buttons.quit = customButton('rpgQuit', 'Quit', 'buttonQuit', ButtonStyle.Danger);
  global.buttons.town = customButton('rpgTown', 'Town', 'buttonTown', ButtonStyle.Primary);
  global.buttons.bounties = customButton('rpgBounties', 'Bounties', 'buttonBounties', ButtonStyle.Primary);
  global.buttons.market = customButton('rpgMarket', 'Market', 'buttonMarket', ButtonStyle.Primary);
  global.buttons.arcade = customButton('rpgArcade', 'Arcade', 'buttonArcade', ButtonStyle.Primary);
  global.buttons.home = customButton('rpgHome', 'Home', 'buttonHome', ButtonStyle.Primary);
  global.buttons.help = customButton('rpgHelp', 'Help', 'buttonHelp', ButtonStyle.Primary);
  global.buttons.quest = customButton('rpgQuest', 'Quest', 'buttonQuest', ButtonStyle.Secondary);
  global.buttons.dungeon = customButton('rpgDungeon', 'Dungeon', 'buttonDungeon', ButtonStyle.Secondary);
  global.buttons.raid = customButton('rpgRaid', 'Raid', 'buttonRaid', ButtonStyle.Secondary);
  global.buttons.inventory = customButton('rpgInventory', 'Inventory', 'itemInventory', ButtonStyle.Primary);
  global.buttons.stats = customButton('rpgStats', 'Stats', '📊', ButtonStyle.Primary);
  global.buttons.guild = customButton('rpgGuild', 'Guild', '🏰', ButtonStyle.Primary);
  global.buttons.buy = customButton('rpgMarketBuy', 'Buy', 'buttonBuy', ButtonStyle.Success);
  global.buttons.preview = customButton('rpgMarketPreview', 'Preview', 'buttonPreview', ButtonStyle.Secondary);
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

  global.menus = {} as Menus;
  global.menus.item = new StringSelectMenuBuilder()
    .setCustomId('rpgGeneralSelect')
    .setPlaceholder('Select an item to buy');
  global.menus.background = new StringSelectMenuBuilder()
    .setCustomId('rpgBackgroundSelect')
    .setPlaceholder('Select a background to use.');
  global.menus.name = new StringSelectMenuBuilder()
    .setCustomId('rpgNameDisplay')
    .setPlaceholder('No Name!')
    .setOptions([{
      label: 'No Name',
      value: 'nameless',
      emoji: '👤',
      default: true,
    }]);
  global.menus.class = new StringSelectMenuBuilder()
    .setCustomId('rpgClass')
    .setPlaceholder('Select a class');
  global.menus.species = new StringSelectMenuBuilder()
    .setCustomId('rpgSpecies')
    .setPlaceholder('Pick a species');
  global.menus.guild = new StringSelectMenuBuilder()
    .setCustomId('rpgGuild')
    .setPlaceholder('Select a guild');

  // log.debug(F, `difficulties: ${JSON.stringify(difficulties)}`);
  const diff = difficulties.map(d => ({
    label: d.label,
    value: d.value,
    emoji: `<:${(get(d.emoji) as Emoji).identifier}>`,
    default: d.default,
  }));

  // log.debug(F, `diff: ${JSON.stringify(diff, null, 2)}`);

  global.menus.difficulty = new StringSelectMenuBuilder()
    .setCustomId('rpgDifficulty')
    .setPlaceholder('Easy')
    .setOptions(diff);

  // log.debug(F, `numberOfQuestions: ${JSON.stringify(numberOfQuestions)}`);
  const qs = numberOfQuestions.map(q => ({
    label: q.label,
    value: q.value,
    emoji: `<:${(get(q.emoji) as Emoji).identifier}>`,
    default: q.default,
  }));

  // log.debug(F, `qs: ${JSON.stringify(qs, null, 2)}`);

  global.menus.questions = new StringSelectMenuBuilder()
    .setCustomId('rpgQuestionLimit')
    .setPlaceholder('How many questions?')
    .setOptions(qs);
}

function customButton(
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

export function get(name:string):APIMessageComponentEmoji {
  // log.debug(F, `await get(${name})`);
  if (!global.emojiGuildRPG) {
    throw new Error('Emoji cache not initialized!');
  }

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

  const emojiName = global.emojiGuildRPG.emojis.cache.find(emoji => emoji.name === name)
    ?? global.emojiGuildMain.emojis.cache.find(emoji => emoji.name === name);
  // log.debug(F, `emojiName: ${emojiName}`);
  if (!emojiName) {
    throw new Error(`Emoji ${name} not found!`);
  }

  return emojiName as APIMessageComponentEmoji;
}
