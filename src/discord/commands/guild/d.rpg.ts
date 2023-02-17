/* eslint-disable max-len */
import {
  Colors,
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  // ColorResolvable,
  MessageComponentInteraction,
  time,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  ModalSubmitInteraction,
  StringSelectMenuComponent,
  // StringSelectMenuInteraction,
  InteractionEditReplyOptions,
  InteractionUpdateOptions,
  SelectMenuComponentOptionData,
  AttachmentBuilder,
  GuildMember,
  TextChannel,
} from 'discord.js';
import {
  APIEmbed,
  APISelectMenuOption,
  ButtonStyle, TextInputStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { getPersonaInfo, setPersonaInfo } from '../../../global/commands/g.rpg';
import { startLog } from '../../utils/startLog';
import {
  getUser, inventoryGet, inventorySet, personaSet,
} from '../../../global/utils/knex';
import { Personas, RpgInventory } from '../../../global/@types/database';
import { imageGet } from '../../utils/imageGet';

const F = f(__filename);

export default dRpg;

// Value in milliseconds (1000 * 60 * 1 = 1 minute)
// const intervals = {
//   quest: env.NODE_ENV === 'production' ? 1000 * 60 * 60 : 1000 * 1,
//   dungeon: env.NODE_ENV === 'production' ? 1000 * 60 * 60 * 24 : 1000 * 1,
//   raid: env.NODE_ENV === 'production' ? 1000 * 60 * 60 * 24 * 7 : 1000 * 1,
// };

function customButton(
  customId: string,
  label: string,
  emoji: string,
  style?: ButtonStyle,
):ButtonBuilder {
  return new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setEmoji(emoji)
    .setStyle(style || ButtonStyle.Success);
}

const buttons = {
  name: customButton('rpgName', 'Name', '📝'),
  accept: customButton('rpgAccept', 'Accept', '✅'),
  decline: customButton('rpgDecline', 'Decline', '❌'),
  town: customButton('rpgTown', 'Town', '🏘️'),
  work: customButton('rpgWork', 'Work', '👷'),
  shop: customButton('rpgShop', 'Shop', '🛒'),
  arcade: customButton('rpgArcade', 'Arcade', '🎮'),
  home: customButton('rpgHome', 'Home', '🛖'),
  quest: customButton('rpgQuest', 'Quest', '🗺️'),
  dungeon: customButton('rpgDungeon', 'Dungeon', '🏰'),
  raid: customButton('rpgRaid', 'Raid', '👹'),
  inventory: customButton('rpgInventory', 'Inventory', '🎒'),
  stats: customButton('rpgStats', 'Stats', '📊'),
  guild: customButton('rpgGuild', 'Guild', '🏰'),
  buy: customButton('rpgShopBuy', 'Buy', '🛒'),
  slotMachine: customButton('rpgSlots', 'Slots', '🎰'),
  coinFlip: customButton('rpgCoinFlip', 'CoinFlip', '🪙'),
  roulette: customButton('rpgRoulette', 'Roulette', '🎲'),
  blackjack: customButton('rpgBlackjack', 'Blackjack', '🃏'),
  wager1: customButton('rpgWager1', 'Bet 1', '🪙'),
  wager10: customButton('rpgWager10', 'Bet 10', '🪙'),
  wager100: customButton('rpgWager100', 'Bet 100', '🪙'),
  wager1000: customButton('rpgWager1000', 'Bet 1000', '🪙'),
  wager10000: customButton('rpgWager10000', 'Bet 10000', '🪙'),
  wager100000: customButton('rpgWager100000', 'Bet 100000', '🪙'),
  coinflipHeads: customButton('rpgCoinflipHeads', 'Heads', '🗿'),
  coinflipTails: customButton('rpgCoinflipTails', 'Tails', '🐍'),

  rouletteRed: customButton('rpgRouletteRed', 'Red', '🟥'),
  rouletteBlack: customButton('rpgRouletteBlack', 'Black', '⬛'),
  rouletteFirst: customButton('rpgRouletteFirst', 'First Row', '🥇'),
  rouletteSecond: customButton('rpgRouletteSecond', 'Second Row', '🥈'),
  rouletteThird: customButton('rpgRouletteThird', 'Third Row', '🥉'),

  rouletteOdd: customButton('rpgRouletteOdd', 'Odd', '🅰'),
  rouletteEven: customButton('rpgRouletteEven', 'Even', '🅱'),
  roulette1to12: customButton('roulette1to12', '1-12', '1️⃣'),
  roulette13to24: customButton('roulette13to24', '13-24', '3️⃣'),
  roulette25to36: customButton('roulette25to36', '25-36', '5️⃣'),

  rouletteHigh: customButton('rpgRouletteHigh', 'High', '🔼'),
  rouletteLow: customButton('rpgRouletteLow', 'Low', '🔽'),
  rouletteZero: customButton('rpgRouletteZero', '0', '0️⃣'),

  blackjackHit: customButton('rpgBlackjackHit', 'Hit', '🃏'),
  blackjackStand: customButton('rpgBlackjackStand', 'Stand', '🃏'),
  blackjackDouble: customButton('rpgBlackjackDouble', 'Double', '🃏'),
  blackjackSplit: customButton('rpgBlackjackSplit', 'Split', '🃏'),
  blackjackSurrender: customButton('rpgBlackjackSurrender', 'Surrender', '🃏'),
} as {
  [key: string]: ButtonBuilder;
};

const menus = {
  item: new StringSelectMenuBuilder()
    .setCustomId('rpgGeneralSelect')
    .setPlaceholder('Select an item to buy'),
  background: new StringSelectMenuBuilder()
    .setCustomId('rpgBackgroundSelect')
    .setPlaceholder('Select a background to use.'),
  name: new StringSelectMenuBuilder()
    .setCustomId('rpgNameDisplay')
    .setPlaceholder('No Name!')
    .setOptions([{
      label: 'No Name',
      value: 'nameless',
      emoji: '👤',
      default: true,
    }]),
  class: new StringSelectMenuBuilder()
    .setCustomId('rpgClass')
    .setPlaceholder('Select a class'),
  species: new StringSelectMenuBuilder()
    .setCustomId('rpgSpecies')
    .setPlaceholder('Pick a species'),
  guild: new StringSelectMenuBuilder()
    .setCustomId('rpgGuild')
    .setPlaceholder('Select a guild'),
} as {
  [key: string]: StringSelectMenuBuilder;
};

const items = {
  general: {
    testkit: {
      label: 'TestKit',
      value: 'testkit',
      description: '10% more TripTokens from all sources!',
      quantity: 1,
      weight: 0,
      cost: 2000,
      equipped: true,
      consumable: false,
      effect: 'tokenMultiplier',
      effect_value: '0.1',
      emoji: '🧪',
    },
    scale: {
      label: 'Scale',
      value: 'scale',
      description: '20% more TripTokens from all sources!',
      quantity: 1,
      weight: 0,
      cost: 3000,
      equipped: true,
      consumable: false,
      effect: 'tokenMultiplier',
      effect_value: '0.2',
      emoji: '⚖',
    },
  },
  backgrounds: {
    // Geolines: {
    //   label: 'Geolines',
    //   value: 'Geolines',
    //   description: 'Geolines',
    //   quantity: 1,
    //   weight: 0,
    //   cost: 1000,
    //   equipped: false,
    //   consumable: false,
    //   effect: 'background',
    //   effect_value: 'Geolines',
    //   emoji: '🖼',
    // },
    // Waves: {
    //   label: 'Waves',
    //   value: 'Waves',
    //   description: 'Waves',
    //   quantity: 1,
    //   weight: 0,
    //   cost: 1000,
    //   equipped: false,
    //   consumable: false,
    //   effect: 'background',
    //   effect_value: 'Waves',
    //   emoji: '🖼',
    // },
    // LiquidMaze: {
    //   label: 'LiquidMaze',
    //   value: 'LiquidMaze',
    //   description: 'LiquidMaze',
    //   quantity: 1,
    //   weight: 0,
    //   cost: 1000,
    //   equipped: false,
    //   consumable: false,
    //   effect: 'background',
    //   effect_value: 'LiquidMaze',
    //   emoji: '🖼',
    // },
    // Flow: {
    //   label: 'Flow',
    //   value: 'Flow',
    //   description: 'Flow',
    //   quantity: 1,
    //   weight: 0,
    //   cost: 1000,
    //   equipped: false,
    //   consumable: false,
    //   effect: 'background',
    //   effect_value: 'Flow',
    //   emoji: '🖼',
    // },
    DiamondChevron: {
      label: 'DiamondChevron',
      value: 'DiamondChevron',
      description: 'DiamondChevron',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'DiamondChevron',
      emoji: '🖼',
    },
    Chevron: {
      label: 'Chevron',
      value: 'Chevron',
      description: 'Chevron',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Chevron',
      emoji: '🖼',
    },
    Concentric: {
      label: 'Concentric',
      value: 'Concentric',
      description: 'Concentric',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Concentric',
      emoji: '🖼',
    },
    CubeTunnels: {
      label: 'CubeTunnels',
      value: 'CubeTunnels',
      description: 'CubeTunnels',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'CubeTunnels',
      emoji: '🖼',
    },
    Leaves: {
      label: 'Leaves',
      value: 'Leaves',
      description: 'Leaves',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Leaves',
      emoji: '🖼',
    },
    SquareTwist: {
      label: 'SquareTwist',
      value: 'SquareTwist',
      description: 'SquareTwist',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'SquareTwist',
      emoji: '🖼',
    },
    SquareSpiral: {
      label: 'SquareSpiral',
      value: 'SquareSpiral',
      description: 'SquareSpiral',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'SquareSpiral',
      emoji: '🖼',
    },
    Noise: {
      label: 'Noise',
      value: 'Noise',
      description: 'Noise',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Noise',
      emoji: '🖼',
    },
    Squiggles: {
      label: 'Squiggles',
      value: 'Squiggles',
      description: 'Squiggles',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Squiggles',
      emoji: '🖼',
    },
    TriangleOverlap: {
      label: 'TriangleOverlap',
      value: 'TriangleOverlap',
      description: 'TriangleOverlap',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'TriangleOverlap',
      emoji: '🖼',
    },
    XandO: {
      label: 'XandO',
      value: 'XandO',
      description: 'XandO',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'XandO',
      emoji: '🖼',
    },
    Safari: {
      label: 'Safari',
      value: 'Safari',
      description: 'Safari',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Safari',
      emoji: '🖼',
    },
    LineLeaves: {
      label: 'LineLeaves',
      value: 'LineLeaves',
      description: 'LineLeaves',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'LineLeaves',
      emoji: '🖼',
    },
    ArcadeCarpet: {
      label: 'ArcadeCarpet',
      value: 'ArcadeCarpet',
      description: 'ArcadeCarpet',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'ArcadeCarpet',
      emoji: '🖼',
    },
    Topography: {
      label: 'Topography',
      value: 'Topography',
      description: 'Topography',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Topography',
      emoji: '🖼',
    },
    CoffeeSwirl: {
      label: 'CoffeeSwirl',
      value: 'CoffeeSwirl',
      description: 'CoffeeSwirl',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'CoffeeSwirl',
      emoji: '🖼',
    },
    SpaceIcons: {
      label: 'SpaceIcons',
      value: 'SpaceIcons',
      description: 'SpaceIcons',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'SpaceIcons',
      emoji: '🖼',
    },
    Plaid: {
      label: 'Plaid',
      value: 'Plaid',
      description: 'Plaid',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Plaid',
      emoji: '🖼',
    },
    Paisley: {
      label: 'Paisley',
      value: 'Paisley',
      description: 'Paisley',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Paisley',
      emoji: '🖼',
    },
    AbstractTriangles: {
      label: 'AbstractTriangles',
      value: 'AbstractTriangles',
      description: 'AbstractTriangles',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'AbstractTriangles',
      emoji: '🖼',
    },
    Memphis: {
      label: 'Memphis',
      value: 'Memphis',
      description: 'Memphis',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Memphis',
      emoji: '🖼',
    },
    Connected: {
      label: 'Connected',
      value: 'Connected',
      description: 'Connected',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Connected',
      emoji: '🖼',
    },
    Binary: {
      label: 'Binary',
      value: 'Binary',
      description: 'Binary',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Binary',
      emoji: '🖼',
    },
  },
} as {
  [key: string]: {
    [key: string]: {
      label: string;
      value: string;
      description: string;
      quantity: number;
      weight: number;
      cost: number;
      equipped: boolean;
      consumable: boolean;
      effect: string;
      effect_value: string;
      emoji: string;
    };
  }
};

const genome = {
  classes: {
    jobless: {
      label: 'No Job',
      value: 'jobless',
      description: 'A jobless person',
      emoji: '👨‍🌾',
    },
    warrior: {
      label: 'Warrior',
      value: 'warrior',
      description: 'A strong fighter',
      emoji: '⚔️',
    },
    mage: {
      label: 'Mage',
      value: 'mage',
      description: 'A powerful spell caster',
      emoji: '🧙',
    },
    rogue: {
      label: 'Rogue',
      value: 'rogue',
      description: 'A stealthy assassin',
      emoji: '🗡️',
    },
    archer: {
      label: 'Archer',
      value: 'archer',
      description: 'A ranged attacker',
      emoji: '🏹',
    },
  },
  species: {
    formless: {
      label: 'No Form',
      value: 'formless',
      description: 'A formless being',
      emoji: '👻',
    },
    human: {
      label: 'Human',
      value: 'human',
      description: 'A human',
      emoji: '👨',
    },
    elf: {
      label: 'Elf',
      value: 'elf',
      description: 'An elf',
      emoji: '🧝',
    },
    dwarf: {
      label: 'Dwarf',
      value: 'dwarf',
      description: 'A dwarf',
      emoji: '🪓',
    },
    orc: {
      label: 'Orc',
      value: 'orc',
      description: 'An orc',
      emoji: '👹',
    },
  },
  guilds: {
    guildless: {
      label: 'No Guild',
      value: 'guildless',
      description: 'No guild',
      emoji: '🏳️',
    },
    gryffindor: {
      label: 'Gryffindor',
      value: 'gryffindor',
      description: 'Gryffindor guild',
      emoji: '🦁',
    },
    hufflepuff: {
      label: 'Hufflepuff',
      value: 'hufflepuff',
      description: 'Hufflepuff guild',
      emoji: '🦡',
    },
    ravenclaw: {
      label: 'Ravenclaw',
      value: 'ravenclaw',
      description: 'Ravenclaw guild',
      emoji: '🦅',
    },
    slytherin: {
      label: 'Slytherin',
      value: 'slytherin',
      description: 'Slytherin guild',
      emoji: '🐍',
    },
  },
} as {
  [key: string]: {
    [key: string]: {
      label: string;
      value: string;
      description: string;
      emoji: string;
      default?: boolean;
    }
  }
};

const text = {
  enter: [
    'take a bus to',
    'walk to',
    'ride a bike to',
    'drive to',
    'somehow wind up in',
    'teleport to',
    'fly to',
    'take a taxi to',
    'take a train to',
    'take a boat to',
    'take a plane to',
    'take a helicopter to',
    'ride by eagle to',
    'trek through the lands of middle earth to get to ',
  ],
  quest: [
    'You find some missing children and return them to their parents.\nThe children give you the {tokens} tokens they found on their adventure.',
    'You find a lost puppy and return it to its owner.\nAs you were chasing the puppy you found {tokens} tokens on the ground, nice!',
    'You find a lost cat and return it to its owner.\nThe cat coughs up a hairball.\nOh, that\'s actually {tokens} tokens!\nYou wipe them off and pocket them.',
    'You find a lost dog and return it to its owner.\nThe dog looks into your eyes and you feel a connection to their soul.\nYour pocket feels {tokens} tokens heavier.',
    'You find a lost bird and return it to its owner.\nThe bird gives you a really cool feather.\nYou trade the feather to some kid for {tokens} tokens.',
    'You find a lost fish and return it to its owner.\nHow do you lose a fish?\nYou decide not to ask and leave with your {tokens} tokens as soon as you can.',
    'You borrow a metal detector and find a lost ring.\nYou return the ring to its owner and they are so grateful they give you {tokens} tokens.',
    'You find someone worried that their pill could be dangerous.\nYou use one of your fentanyl strips to make sure they can rule that out!\nThey\'re so grateful they give you {tokens} tokens.',
    'Someone asks if you can help make sure their bag of powder is what they think it is.\nYou use your test kit to help identify for them and they give you {tokens} tokens for keeping them safe.',
    'You happen upon along with wide pupils and sweating in a t-shirt.\nAfter an enthusiastic conversation that has no point you give them some gatorade that they down almost instantly.\nThey hug you and slip {tokens} tokens into your pocket.',
    'You do some hunting and bring back some food for the town.\nThe town gives you {tokens} tokens for your troubles.',
    'You go fishing and bring back some food for the town.\nThe town gives you {tokens} tokens for your troubles.',
    'You go mining and bring back some ore for the town.\nThe town gives you {tokens} tokens for your troubles.',
    'You help build a new house in the town.\nThe town gives you {tokens} tokens for your troubles.',
  ],
  dungeon: [
    'You voyaged to fight the evil wizard in the dark tower!\nBut they\'re just misunderstood and enjoy earth tones.\nThey appreciate the visit and gave you {tokens} tokens for your troubles.',
    'You were tasked with killing a dragon that has looted the countryside!\nBut it was only feeding its baby dragon.\nYou taught the dragon how to farm and it gave you {tokens} Tokens.',
    'You attempted to subdue the ogre known for assaulting people!\nBut it turns out they just hug too hard.\nYou taught them about personal boundaries and they gave you {tokens} Tokens.',
    'You went to the local cave to fight the goblin king!\nBut it turns out he was just a goblin who wanted to be king.\nYou taught him about democracy and he gave you {tokens} Tokens.',
    'You journey to the dark forest to fight the evil witch!\nBut they turn out to be a gardner with too much property.\nYou taught her about landscapers and she gave you {tokens} Tokens.',
  ],
};

const wagers = {} as {
  [key: string]: {
    gameName: GameName,
    tokens: number,
  },
};

function rand(array:string[]):string {
  return array[Math.floor(Math.random() * array.length)];
}

export const dRpg: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('rpg')
    .setDescription('A TripSit RPG!')
    .addSubcommand(subcommand => subcommand
      .setName('town')
      .setDescription('Go to TripTown!'))
    .addSubcommand(subcommand => subcommand
      .setName('shop')
      .setDescription('Go to the Shop!'))
    .addSubcommand(subcommand => subcommand
      .setName('home')
      .setDescription('Go to your Home!'))
    .addSubcommand(subcommand => subcommand
      .setName('work')
      .setDescription('Go to the work center!'))
    .addSubcommand(subcommand => subcommand
      .setName('quest')
      .setDescription('Quest and earn a token!'))
    .addSubcommand(subcommand => subcommand
      .setName('dungeon')
      .setDescription('Clear a dungeon and earn 10 tokens!'))
    .addSubcommand(subcommand => subcommand
      .setName('raid')
      .setDescription('Raid a boss and earn 50 tokens!'))
    .addSubcommand(subcommand => subcommand
      .setName('arcade')
      .setDescription('Go to the arcade'))
    .addSubcommand(subcommand => subcommand
      .setName('coinflip')
      .setDescription('Go to the coinflip game'))
    .addSubcommand(subcommand => subcommand
      .setName('roulette')
      .setDescription('Go to the roulette game')),
  async execute(interaction) {
    startLog(F, interaction);
    // This command provides a RPG game for the user to play
    // It starts with the setup subcommand which has the user setup their character including:
    // - Name - string
    // - Class - Warrior, Mage, Rogue, Cleric
    // - Species - Human, Elf, Dwarf, Orc, Gnome, Halfling
    //
    // Once setup, the user can generate tokens in a few different ways:
    // - Quest - Grants .1 TripToken, can only be used once every hour
    // - Dungeon - Grants 1 TripToken, can only be used once every 24 hours
    // - Raid - Grants 5 TripToken, can only be used once every 7 days
    //
    // The user can also use their tokens to buy items from the shop:
    // - Test Kit - 10% more tokens every time you gain tokens, costs 100 TripToken
    // - Scale - 20% more tokens every time you gain tokens, costs 200 TripToken
    // - Profile border - 30% more tokens every time you gain tokens, costs 300 TripToken
    // - Profile background - 40% more tokens every time you gain tokens, costs 400 TripToken
    //
    // The user can also play some games to earn some tokens:
    // - Blackjack - Play a game of blackjack
    // - Coin Flip - Flip a coin or flip a coin 10 times
    // - Rock, Paper, Scissors - Play a game of rock, paper, scissors
    //
    // The user can also view their persona stats:
    // - Inventory - View their inventory and equip/un-equip items
    // - Stats - View their stats and level them up
    // - Guild - View their guild and join/leave a guild
    const subcommand = interaction.options.getSubcommand();

    const quietCommands = [
      'quest',
      'dungeon',
      'raid',
      'coinflip',
      'roulette',
    ];

    const channelRpg = await interaction.guild?.channels.fetch(process.env.CHANNEL_RPG as string) as TextChannel;

    const message = quietCommands.includes(subcommand) || channelRpg.id !== interaction.channelId
      ? await interaction.reply({ embeds: [embedTemplate().setTitle('Loading...')], ephemeral: true })
      : await interaction.reply({ embeds: [embedTemplate().setTitle('Loading...')] });

    // Create a collector that will listen to buttons clicked by the user
    const filter = (i: MessageComponentInteraction) => {
      log.debug(F, `i.user.id: ${i.user.id}, interaction.user.id: ${interaction.user.id}`);
      return i.user.id === interaction.user.id;
    };
    const collector = message.createMessageComponentCollector({ filter, time: 0 });

    // Get the user's persona data
    let [personaData] = await getPersonaInfo(interaction.user.id);
    // log.debug(F, `Initial Persona data: ${JSON.stringify(personaData, null, 2)}`);

    // If the user doesn't have persona data, create it
    if (!personaData) {
      const userData = await getUser(interaction.user.id, null);
      personaData = {
        user_id: userData.id,
        tokens: 0,
      } as Personas;

      log.debug(F, `Setting Persona data: ${JSON.stringify(personaData, null, 2)}`);

      await setPersonaInfo(personaData);
      // await interaction.editReply({ embeds: [embedStart], components: states.setup.components });
    }
    if (subcommand === 'town') {
      await interaction.editReply(await rpgTown(interaction));
    }
    if (subcommand === 'work') {
      await interaction.editReply(await rpgWork(interaction, null));
    }
    if (subcommand === 'quest' || subcommand === 'dungeon' || subcommand === 'raid') {
      await interaction.editReply(await rpgWork(interaction, subcommand));
    }
    if (subcommand === 'shop') {
      await interaction.editReply(await rpgShop(interaction));
    }
    if (subcommand === 'home') {
      await interaction.editReply(await rpgHome(interaction, ''));
    }
    if (subcommand === 'arcade') {
      await interaction.editReply(await rpgArcade(interaction));
    }
    if (subcommand === 'coinflip') {
      await interaction.editReply(await rpgArcadeGame(interaction, 'Coinflip'));
    }
    if (subcommand === 'roulette') {
      await interaction.editReply(await rpgArcadeGame(interaction, 'Roulette'));
    }
    // if (subcommand === 'blackjack') {
    //   await interaction.editReply(await rpgArcade(interaction));
    // }
    // if (subcommand === 'slots') {
    //   await interaction.editReply(await rpgArcade(interaction));
    // }

    // Button collector
    collector.on('collect', async (i: MessageComponentInteraction) => {
      log.debug(F, `Interaction: ${JSON.stringify(i.customId, null, 2)}`);
      if (i.customId === 'rpgTown') await i.update(await rpgTown(i));
      else if (i.customId === 'rpgWork') await i.update(await rpgWork(i, null));
      else if (i.customId === 'rpgShop') await i.update(await rpgShop(i));
      else if (i.customId === 'rpgArcade') await i.update(await rpgArcade(i));
      else if (i.customId === 'rpgWager1') await i.update(await rpgArcadeWager(i));
      else if (i.customId === 'rpgWager10') await i.update(await rpgArcadeWager(i));
      else if (i.customId === 'rpgWager100') await i.update(await rpgArcadeWager(i));
      else if (i.customId === 'rpgWager1000') await i.update(await rpgArcadeWager(i));
      else if (i.customId === 'rpgWager10000') await i.update(await rpgArcadeWager(i));
      else if (i.customId === 'rpgCoinFlip') await i.update(await rpgArcadeGame(i, 'Coinflip'));
      else if (i.customId === 'rpgRoulette') await i.update(await rpgArcadeGame(i, 'Roulette'));
      else if (i.customId === 'rpgRouletteRed') await i.editReply(await rpgArcadeGame(i, 'Roulette', 'red'));
      else if (i.customId === 'rpgRouletteBlack') await i.editReply(await rpgArcadeGame(i, 'Roulette', 'black'));
      else if (i.customId === 'rpgRouletteFirst') await i.editReply(await rpgArcadeGame(i, 'Roulette', 'first'));
      else if (i.customId === 'rpgRouletteSecond') await i.editReply(await rpgArcadeGame(i, 'Roulette', 'second'));
      else if (i.customId === 'rpgRouletteThird') await i.editReply(await rpgArcadeGame(i, 'Roulette', 'third'));

      else if (i.customId === 'rpgRouletteOdd') await i.editReply(await rpgArcadeGame(i, 'Roulette', 'odds'));
      else if (i.customId === 'rpgRouletteEven') await i.editReply(await rpgArcadeGame(i, 'Roulette', 'evens'));
      else if (i.customId === 'roulette1to12') await i.editReply(await rpgArcadeGame(i, 'Roulette', '1-12'));
      else if (i.customId === 'roulette13to24') await i.editReply(await rpgArcadeGame(i, 'Roulette', '13-24'));
      else if (i.customId === 'roulette25to36') await i.editReply(await rpgArcadeGame(i, 'Roulette', '25-36'));

      else if (i.customId === 'rpgRouletteHigh') await i.editReply(await rpgArcadeGame(i, 'Roulette', 'high'));
      else if (i.customId === 'rpgRouletteLow') await i.editReply(await rpgArcadeGame(i, 'Roulette', 'low'));
      else if (i.customId === 'rpgRouletteZero') await i.editReply(await rpgArcadeGame(i, 'Roulette', '0'));

      else if (i.customId === 'rpgCoinflipHeads') await i.editReply(await rpgArcadeGame(i, 'Coinflip', 'heads'));
      else if (i.customId === 'rpgCoinflipTails') await i.editReply(await rpgArcadeGame(i, 'Coinflip', 'tails'));
      else if (i.customId === 'rpgHome') await i.update(await rpgHome(i, ''));
      else if (i.customId === 'rpgSpecies') await i.update(await rpgHome(i, ''));
      else if (i.customId === 'rpgClass') await i.update(await rpgHome(i, ''));
      else if (i.customId === 'rpgGuild') await i.update(await rpgHome(i, ''));
      else if (i.customId === 'rpgName') await rpgHomeNameChange(i);
      else if (i.customId === 'rpgAccept') await i.update(await rpgHomeAccept(i));
      else if (i.customId === 'rpgGeneralSelect') await i.update(await rpgShopChange(i));
      else if (i.customId === 'rpgShopBuy') await i.update(await rpgShopAccept(i));
      else if (i.customId === 'rpgBackgroundSelect') await i.update(await rpgHome(i, ''));
      else if (i.customId === 'rpgQuest' || i.customId === 'rpgDungeon' || i.customId === 'rpgRaid') {
        await i.update(await rpgWork(i, i.customId.replace('rpg', '').toLowerCase() as 'quest' | 'dungeon' | 'raid'));
      }
    });

    return true;
  },
};

export async function rpgTown(
  interaction:MessageComponentInteraction | ChatInputCommandInteraction,
):Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  // Check if the user has a persona
  // const [personaData] = await getPersonaInfo(interaction.user.id);

  const rowTown = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      buttons.work,
      buttons.shop,
      buttons.arcade,
      buttons.home,
    );

  return {
    embeds: [embedTemplate()
      .setAuthor(null)
      .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL })
      .setTitle('Town')
      .setDescription(stripIndents`
      You ${rand(text.enter)} TripTown, a new settlement on the edge of Triptopia, the TripSit Kingdom.

      The town is still under construction with only a few buildings.
      
      *You get the impression that you're one of the first people to visit.*
      
      A recruitment center to take on jobs, and a small shop.
  
      What would you like to do?`)
      .setColor(Colors.Green)],
    components: [rowTown],
    files: [],
  };
}

function getLastMonday(d:Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return new Date(d);
}

export async function rpgWork(
  interaction: MessageComponentInteraction | ChatInputCommandInteraction,
  command: 'quest' | 'dungeon' | 'raid' | null,
):Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  // Check if the user has a persona
  const [personaData] = await getPersonaInfo(interaction.user.id);

  // Get the existing inventory data
  const inventoryData = await inventoryGet(personaData.id);
  // log.debug(F, `Persona inventory: ${JSON.stringify(inventoryData, null, 2)}`);

  const rowWork = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      buttons.quest,
      buttons.dungeon,
      buttons.raid,
      buttons.town,
    );

  const contracts = {
    quest: {
      success: {
        title: 'Quest Success',
        description: stripIndents`${rand(text.quest)}`,
        color: Colors.Green,
      },
      fail: {
        title: 'Quest Fail',
        description: stripIndents`
          There are no more quests available at the moment. New quests are posted every hour!
        `,
        color: Colors.Red,
      },
    },
    dungeon: {
      success: {
        title: 'Dungeon Success',
        description: stripIndents`${rand(text.dungeon)}`,
        color: Colors.Green,
      },
      fail: {
        title: 'Dungeon Fail',
        description: stripIndents`
          You already cleared a dungeon today, you're still tired and need to prepare.
        `,
        color: Colors.Red,
      },
    },
    raid: {
      success: {
        title: 'Raid Success',
        description: stripIndents`
          You stormed into Moonbear's office, rustle their jimmies and stole {tokens} TripTokens!
        `,
        color: Colors.Green,
      },
      fail: {
        title: 'Raid Fail',
        description: stripIndents`
          You've already raided Moonbear's office this week, give them a break!
        `,
        color: Colors.Red,
      },
    },
  };

  if (command !== null) {
    const dbKey = `last_${command}`;
    const lastWork = personaData[dbKey as 'last_quest' | 'last_dungeon' | 'last_raid'] as Date;
    log.debug(F, `lastWork: ${lastWork}`);

    let resetTime = {} as Date;
    let timeout = false;
    if (command === 'quest') {
      const currentHour = new Date().getHours();
      log.debug(F, `currentHour: ${currentHour}`);

      resetTime = new Date(new Date().setHours(currentHour + 1, 0, 0, 0));

      if (lastWork) {
        const lastWorkHour = lastWork ? lastWork.getHours() : 0;
        log.debug(F, `lastWorkHour: ${lastWorkHour}`);
        if (lastWorkHour === currentHour) {
          timeout = true;
        }
      }
    } else if (command === 'dungeon') {
      const currentDay = new Date().getDate();
      log.debug(F, `currentDay: ${currentDay}`);
      resetTime = new Date(new Date(new Date().setDate(currentDay + 1)).setHours(0, 0, 0, 0));

      if (lastWork) {
        const lastWorkDay = lastWork ? lastWork.getDate() : 0;
        log.debug(F, `lastWorkDay: ${lastWorkDay}`);

        // log.debug(F, `personaData1: ${JSON.stringify(personaData, null, 2)}`);
        // if (lastWork && (lastWork.getTime() + interval > new Date().getTime())) {
        if (lastWorkDay === currentDay) {
          timeout = true;
        }
      }
    } else if (command === 'raid') {
      const lastMonday = getLastMonday(new Date());
      log.debug(F, `lastMonday: ${lastMonday}`);
      resetTime = new Date(new Date(lastMonday.getTime() + 7 * 24 * 60 * 60 * 1000).setHours(0, 0, 0, 0));

      // Check if the last work was done after the last monday
      if (lastWork && lastWork.getTime() > lastMonday.getTime()) {
        timeout = true;
      }
    }

    log.debug(F, `resetTime: ${resetTime}`);
    log.debug(F, `timeout: ${timeout}`);

    if (timeout) {
      return {
        embeds: [embedTemplate()
          .setAuthor(null)
          .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL })
          .setTitle(contracts[command].fail.title)
          .setDescription(stripIndents`${contracts[command].fail.description}
      You still have ${personaData.tokens} TT$!
      You can try again ${time(resetTime, 'R')}`)
          .setColor(contracts[command].fail.color)],
        components: [rowWork],
      };
    }

    let tokens = 10;
    if (command === 'dungeon') { tokens = 50; } else if (command === 'raid') { tokens = 100; }

    let tokenMultiplier = inventoryData
      .filter(item => item.effect === 'tokenMultiplier')
      .reduce((acc, item) => acc + parseFloat(item.effect_value), 1);
    log.debug(F, `tokenMultiplier (before donor): ${tokenMultiplier}`);

    // CHeck if the user who started this interaction has the patreon or booster roles
    const member = await interaction.guild?.members.fetch(interaction.user.id);
    if (member?.roles.cache.has(env.ROLE_BOOSTER) || member?.roles.cache.has(env.ROLE_PATRON)) {
      tokenMultiplier += 0.1;
    }

    // Round token multiplier to 1 decimal place
    tokenMultiplier = Math.round(tokenMultiplier * 10) / 10;
    log.debug(F, `tokenMultiplier: ${tokenMultiplier}`);

    tokens *= tokenMultiplier;

    if (env.NODE_ENV === 'development') { tokens *= 10; }

    tokens = Math.round(tokens);

    // Award the user tokens
    personaData.tokens += tokens;
    personaData[dbKey as 'last_quest' | 'last_dungeon' | 'last_raid'] = new Date();

    // log.debug(F, `personaData2: ${JSON.stringify(personaData, null, 2)}`);
    await setPersonaInfo(personaData);

    return {
      embeds: [embedTemplate()
        .setAuthor(null)
        .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL })
        .setTitle(contracts[command].success.title)
        .setDescription(stripIndents`${contracts[command].success.description.replace('{tokens}', tokens.toString())}
    You now have ${personaData.tokens} TT$!
    You can try again ${time(resetTime, 'R')}`)
        .setColor(contracts[command].success.color)],
      components: [rowWork],
    };
  }

  return {
    embeds: [embedTemplate()
      .setAuthor(null)
      .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL })
      .setTitle('Work')
      .setDescription(stripIndents`
      You are at work, you can go on a quest, clear a dungeon, or go on a raid.
    `)
      .setColor(Colors.Green)],
    components: [rowWork],
  };
}

export async function rpgShop(
  interaction: MessageComponentInteraction | ChatInputCommandInteraction,
):Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  // Get the info used in the shop
  const {
    shopInventory,
    personaTokens,
    personaInventory,
  } = await rpgShopInventory(interaction);

  // Create the shop buttons - This is a select menu
  const rowItems = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(menus.item.setOptions(shopInventory));
  // This is the row of nav buttons. It starts with the town button.
  const rowShop = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(buttons.town);

  // Everyone gets the town button, but only people with purchased items get the items select menu
  const componentList = [rowShop] as ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[];
  if (shopInventory.length > 0) { componentList.unshift(rowItems); }

  // The user has clicked the shop button, send them the shop embed
  return {
    embeds: [embedTemplate()
      .setAuthor(null)
      .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL })
      .setTitle('Shop')
      .setDescription(stripIndents`
      You are in the shop, you can buy some items to help you on your journey.

      You currently have **${personaTokens}** TripTokens.

    ${personaInventory}`)
      .setColor(Colors.Gold)],
    components: componentList,
  };
}

export async function rpgShopChange(
  interaction:MessageComponentInteraction,
):Promise<InteractionUpdateOptions> {
  // Get the info used in the shop
  const {
    shopInventory,
    personaTokens,
    personaInventory,
  } = await rpgShopInventory(interaction);

  // Get the item the user selected
  let choice = '' as string;
  if (interaction.isButton()) {
    const itemComponent = interaction.message.components[0].components[0];
    const selectedItem = (itemComponent as StringSelectMenuComponent).options.find(
      (o:APISelectMenuOption) => o.default === true,
    );
    choice = selectedItem?.value ?? '';
  } else if (interaction.isStringSelectMenu()) {
    [choice] = interaction.values;
  }

  log.debug(F, `choice: ${choice}`);

  // Get a list of shopInventory where the value does not equal the choice
  const filteredItems = Object.values(shopInventory).filter(item => item.value !== choice);

  // Reset the options menu to be empty
  menus.item.setOptions();

  menus.item.addOptions(filteredItems);

  // Use shopInventory and find the item that matches the choice, make it default
  let itemData = {} as {
    label: string;
    value: string;
    description: string;
    quantity: number;
    weight: number;
    cost: number;
    equipped: boolean;
    consumable: boolean;
    effect: string;
    effect_value: string;
    emoji: string;
  };
  const chosenItem = shopInventory.find(shopItem => shopItem.value === choice);
  if (chosenItem) {
    chosenItem.default = true;
    menus.item.addOptions(chosenItem);
    const allItems = [...Object.values(items.general), ...Object.values(items.backgrounds)];
    itemData = allItems.find(item => item.value === chosenItem?.value) as {
      label: string;
      value: string;
      description: string;
      quantity: number;
      weight: number;
      cost: number;
      equipped: boolean;
      consumable: boolean;
      effect: string;
      effect_value: string;
      emoji: string;
    };
    log.debug(F, `itemData (change): ${JSON.stringify(itemData, null, 2)}`);
  }

  const rowItems = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(menus.item);

  const rowShop = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      buttons.town,
    );

  if (chosenItem) {
    rowShop.addComponents(
      buttons.buy.setLabel(`Buy ${chosenItem?.label}`),
    );
  }

  const components = menus.item.options.length === 0
    ? [rowShop]
    : [rowItems, rowShop];

  const embed = embedTemplate()
    .setAuthor(null)
    .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL })
    .setTitle('Shop')
    .setDescription(stripIndents`
      You are in the shop, you can buy some items to help you on your journey.

      You currently have **${personaTokens}** TripTokens.

      ${personaInventory}`)
    .setColor(Colors.Gold);

  const imageFiles = [] as AttachmentBuilder[];
  if (itemData && itemData.effect === 'background') {
    const imagePath = await imageGet(itemData.effect_value);
    log.debug(F, `imagePath: ${imagePath}`);
    imageFiles.push(new AttachmentBuilder(imagePath));
    embed.setImage(`attachment://${itemData.effect_value}.png`);
  }

  return {
    embeds: [embed],
    components,
    files: imageFiles,
  };
}

export async function rpgShopInventory(
  interaction:MessageComponentInteraction | ChatInputCommandInteraction,
):Promise<{
    shopInventory:SelectMenuComponentOptionData[];
    personaTokens:number;
    personaInventory:string;
  }> {
  // Check get fresh persona data
  const [personaData] = await getPersonaInfo(interaction.user.id);

  // Get the existing inventory data
  const inventoryData = await inventoryGet(personaData.id);
  log.debug(F, `Persona inventory: ${JSON.stringify(inventoryData, null, 2)}`);

  // Get a string display of the user's inventory
  const inventoryList = inventoryData.map(item => `**${item.label}** - ${item.description}`).join('\n');
  const inventoryString = inventoryData.length > 0
    ? stripIndents`
      **Inventory**
      ${inventoryList}
      `
    : '';

  // Go through items.general and create a new object of items that the user doesn't have yet
  const shopInventory = [...Object.values(items.general), ...Object.values(items.backgrounds)]
    .map(item => {
      if (!inventoryData.find(i => i.value === item.value)) {
        return {
          label: `${item.label} - ${item.cost} TT$`,
          value: item.value,
          description: `${item.description} - ${item.cost} TT$`,
          emoji: item.emoji,
        };
      }
      return null;
    })
    .filter(item => item !== null) as SelectMenuComponentOptionData[];
  log.debug(F, `generalOptions: ${JSON.stringify(shopInventory, null, 2)}`);
  return {
    shopInventory,
    personaTokens: personaData.tokens,
    personaInventory: inventoryString,
  };
}

export async function rpgShopAccept(
  interaction:MessageComponentInteraction,
):Promise<InteractionUpdateOptions> {
  // Get the info used in the shop
  // const {
  //   shopInventory,
  //   personaTokens,
  //   personaInventory,
  // } = await rpgShopInventory(interaction);

  // Check get fresh persona data
  const [personaData] = await getPersonaInfo(interaction.user.id);
  log.debug(F, `personaData (Accept): ${JSON.stringify(personaData, null, 2)}`);

  // If the user confirms the information, save the persona information
  const itemComponent = interaction.message.components[0].components[0];
  const selectedItem = (itemComponent as StringSelectMenuComponent).options.find(
    (o:APISelectMenuOption) => o.default === true,
  );
  log.debug(F, `selectedItem (accept): ${JSON.stringify(selectedItem, null, 2)}`);

  const allItems = [...Object.values(items.general), ...Object.values(items.backgrounds)];
  const itemData = allItems.find(item => item.value === selectedItem?.value) as {
    label: string;
    value: string;
    description: string;
    quantity: number;
    weight: number;
    cost: number;
    equipped: boolean;
    consumable: boolean;
    effect: string;
    effect_value: string;
    emoji: string;
  };
  log.debug(F, `itemData (accept): ${JSON.stringify(itemData, null, 2)}`);

  // Check if the user has enough tokens to buy the item
  if (personaData.tokens < itemData.cost) {
    log.debug(F, 'Not enough tokens to buy item');

    const { embeds, components } = await rpgShopChange(interaction);

    // This grossness takes the APIEmbed object, turns it into a JSON object, and pulls the description
    const { description } = JSON.parse(JSON.stringify((embeds as APIEmbed[])[0]));

    const embed = embedTemplate()
      .setAuthor(null)
      .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL })
      .setTitle('Shop')
      .setDescription(stripIndents`**You do not have enough tokens to buy this item.**
    
    ${description}`)
      .setColor(Colors.Red);
    const imageFiles = [] as AttachmentBuilder[];
    if (itemData && itemData.effect === 'background') {
      const imagePath = await imageGet(itemData.effect_value);
      log.debug(F, `imagePath: ${imagePath}`);
      imageFiles.push(new AttachmentBuilder(imagePath));
      embed.setImage(`attachment://${itemData.effect_value}.png`);
    }

    return {
      embeds: [embed],
      components,
      files: imageFiles,
    };
  }

  personaData.tokens -= itemData.cost;
  await personaSet(personaData);

  // Add the item to the user's inventory
  const newItem = {
    persona_id: personaData.id,
    label: itemData.label,
    value: itemData.value,
    description: itemData.description,
    quantity: itemData.quantity,
    weight: itemData.weight,
    cost: itemData.cost,
    equipped: itemData.equipped,
    consumable: itemData.consumable,
    effect: itemData.effect,
    effect_value: itemData.effect_value,
    emoji: itemData.emoji,
  } as RpgInventory;
  log.debug(F, `personaInventory: ${JSON.stringify(newItem, null, 2)}`);

  await inventorySet(newItem);

  const { embeds, components } = await rpgShopChange(interaction);

  // This grossness takes the APIEmbed object, turns it into a JSON object, and pulls the description
  const { description } = JSON.parse(JSON.stringify((embeds as APIEmbed[])[0]));

  return {
    embeds: [embedTemplate()
      .setAuthor(null)
      .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL })
      .setTitle('Shop')
      .setDescription(stripIndents`**You have purchased ${itemData.label} for ${itemData.cost} TripTokens.**
      
      ${description}`)
      .setColor(Colors.Green)],
    components,
  };
}

export async function rpgHome(
  interaction: MessageComponentInteraction | ChatInputCommandInteraction,
  message: string,
):Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  const {
    homeInventory,
    personaTokens,
    personaInventory,
  } = await rpgHomeInventory(interaction);

  // Check get fresh persona data
  const [personaData] = await getPersonaInfo(interaction.user.id);
  // log.debug(F, `personaData home (Change) ${JSON.stringify(personaData, null, 2)}`);

  // Get the existing inventory data
  const inventoryData = await inventoryGet(personaData.id);
  // log.debug(F, `Persona home inventory (change): ${JSON.stringify(inventoryData, null, 2)}`);

  let defaultOption = '' as string;
  // Get the equipped background
  const equippedBackground = inventoryData.find(item => item.equipped === true);
  log.debug(F, `equippedBackground: ${JSON.stringify(equippedBackground, null, 2)} `);
  if (equippedBackground) {
    defaultOption = equippedBackground.value;
  }
  log.debug(F, `defaultOption1: ${defaultOption} `);

  // Get the item the user selected
  if (interaction.isButton()) {
    const backgroundComponent = interaction.message.components[0].components[0];
    if ((backgroundComponent as StringSelectMenuComponent).options) {
      const selectedItem = (backgroundComponent as StringSelectMenuComponent).options.find(
        (o:APISelectMenuOption) => o.default === true,
      );
      if (selectedItem) {
        defaultOption = selectedItem.value;
      }
    }
  } else if (interaction.isStringSelectMenu() && interaction.values) {
    [defaultOption] = interaction.values;
  }

  log.debug(F, `defaultOption2: ${defaultOption}`);

  // Get a list of shopInventory where the value does not equal the choice
  // If there is no choice, it will return all items the user has
  const filteredItems = Object.values(homeInventory).filter(item => item.value !== defaultOption);

  // Reset the options menu to be empty
  menus.background.setOptions();
  menus.background.addOptions(filteredItems);

  // Get the item the user chose and display that as the default option
  let backgroundData = {} as {
    label: string;
    value: string;
    description: string;
    quantity: number;
    weight: number;
    cost: number;
    equipped: boolean;
    consumable: boolean;
    effect: string;
    effect_value: string;
    emoji: string;
  };
  const chosenItem = homeInventory.find(item => item.value === defaultOption);
  if (chosenItem) {
    chosenItem.default = true;
    menus.background.addOptions(chosenItem);
    const allItems = [...Object.values(items.backgrounds)];
    backgroundData = allItems.find(item => item.value === chosenItem?.value) as {
      label: string;
      value: string;
      description: string;
      quantity: number;
      weight: number;
      cost: number;
      equipped: boolean;
      consumable: boolean;
      effect: string;
      effect_value: string;
      emoji: string;
    };
    log.debug(F, `backgroundData (home change): ${JSON.stringify(backgroundData, null, 2)}`);
  }

  // Set the item row
  const rowBackgrounds = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(menus.background);

  // Build the embed
  const embed = embedTemplate()
    .setAuthor(null)
    .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL })
    .setTitle('Home')
    .setDescription(stripIndents`${message !== null ? message : ''}

      You ${rand(text.enter)} your home.
      
      You can change your banner here, which impacts your /profile background.

      You currently have **${personaTokens}** TripTokens.

      ${personaInventory}
    `)
    .setColor(Colors.Purple);

  // If the select item has the 'background' effect, add the image to the embed
  const files = [] as AttachmentBuilder[];
  if (equippedBackground) {
    const imagePath = await imageGet(equippedBackground.value);
    log.debug(F, `Equipped background imagePath: ${imagePath}`);
    files.push(new AttachmentBuilder(imagePath));
    embed.setThumbnail(`attachment://${equippedBackground.value}.png`);
    log.debug(F, 'Set thumbnail!');
  }

  if (interaction.isStringSelectMenu() && backgroundData && backgroundData.effect === 'background') {
    const imagePath = await imageGet(backgroundData.effect_value);
    log.debug(F, `imagePath: ${imagePath}`);
    files.push(new AttachmentBuilder(imagePath));
    embed.setImage(`attachment://${backgroundData.effect_value}.png`);
    log.debug(F, 'Set image!');
  }

  // Build out the home navigation buttons
  const rowHome = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
    // buttons.name,
    // buttons.accept,
    // buttons.decline,
      buttons.town,
    );

  if (chosenItem && interaction.isStringSelectMenu()) {
    rowHome.addComponents(
      buttons.accept,
    );
  }

  // If the user has backgrounds, add the backgrounds row
  const components = menus.background.options.length === 0
    ? [rowHome]
    : [rowBackgrounds, rowHome];

  return {
    embeds: [embed],
    components,
    files,
  };
  // const filteredItems = Object.values(genome.species).filter(item => item.value !== choice);

  // // Reset the options menu to be empty
  // menus.species.setOptions();

  // menus.species.addOptions(filteredItems);

  // menus.species.addOptions([
  //   {
  //     label: { ...genome.species }[choice as keyof typeof genome.species].label,
  //     value: { ...genome.species }[choice as keyof typeof genome.species].value,
  //     description: { ...genome.species }[choice as keyof typeof genome.species].description,
  //     emoji: { ...genome.species }[choice as keyof typeof genome.species].emoji,
  //     default: true,
  //   },
  // ]);

  // selectSpecies.addOptions(Object.values(speciesDef).filter(s => s.value !== choice));

  // menus.name.setOptions([{
  //   label: personaData.name,
  //   value: personaData.name,
  //   emoji: '👤',
  //   default: true,
  // }]);

  // const rowNameDisplay = new ActionRowBuilder<StringSelectMenuBuilder>()
  //   .setComponents(menus.name);

  // log.debug(F, `classDef: ${JSON.stringify(classDef, null, 2)}`);
  // const selectedClassList = { ...genome.classes };
  // log.debug(F, `selectedClassList1: ${JSON.stringify(selectedClassList, null, 2)}`);
  // selectedClassList[personaData.class as keyof typeof selectedClassList].default = true;
  // log.debug(F, `selectedClassList2: ${JSON.stringify(selectedClassList, null, 2)}`);

  // menus.class.setOptions(Object.values({ ...selectedClassList }));

  // const rowChangeClass = new ActionRowBuilder<StringSelectMenuBuilder>()
  // //   .setComponents(menus.class);

  // log.debug(F, `speciesDef: ${JSON.stringify(genome.species, null, 2)}`);
  // const selectedSpeciesList = { ...genome.species };
  // log.debug(F, `selectedSpeciesList1: ${JSON.stringify(selectedSpeciesList, null, 2)}`);
  // selectedSpeciesList[personaData.species as keyof typeof selectedSpeciesList].default = true;
  // log.debug(F, `selectedSpeciesList2: ${JSON.stringify(selectedSpeciesList, null, 2)}`);
  // log.debug(F, `speciesDef2: ${JSON.stringify(genome.species, null, 2)}`);

  // menus.species.setOptions(Object.values({ ...selectedSpeciesList }));
  // const rowChangeSpecies = new ActionRowBuilder<StringSelectMenuBuilder>()
  //   .addComponents(menus.species);

  // const selectedGuildList = { ...genome.guilds };
  // selectedGuildList[personaData.guild as keyof typeof selectedGuildList].default = true;
  // log.debug(F, `Selected guild list: ${JSON.stringify(selectedGuildList, null, 2)}`);

  // menus.guild.setOptions(Object.values(selectedGuildList));
  // const rowChangeGuild = new ActionRowBuilder<StringSelectMenuBuilder>()
  //   .addComponents(menus.guild);

  // const { embeds, components } = await rpgHomeChange(interaction);

  // // The user has clicked the home button, send them the home embed
  // return {
  //   embeds,
  //   components,
  // };
}

export async function rpgHomeAccept(
  interaction: MessageComponentInteraction,
):Promise<InteractionUpdateOptions> {
  // Check get fresh persona data
  const [personaData] = await getPersonaInfo(interaction.user.id);

  // If the user confirms the information, save the persona information
  const backgroundComponent = interaction.message.components[0].components[0];
  const selectedItem = (backgroundComponent as StringSelectMenuComponent).options.find(
    (o:APISelectMenuOption) => o.default === true,
  );

  // // If the user confirms the information, save the persona information
  // const nameComponent = interaction.message.components[0].components[0];
  // const selectedName = (nameComponent as StringSelectMenuComponent).options.find(
  //   (o:APISelectMenuOption) => o.default === true,
  // );
  // const speciesComponent = interaction.message.components[1].components[0];
  // const selectedSpecies = (speciesComponent as StringSelectMenuComponent).options.find(
  //   (o:APISelectMenuOption) => o.default === true,
  // );
  // const classComponent = interaction.message.components[2].components[0];
  // const selectedClass = (classComponent as StringSelectMenuComponent).options.find(
  //   (o:APISelectMenuOption) => o.default === true,
  // );
  // const guildComponent = interaction.message.components[3].components[0];
  // const selectedGuild = (guildComponent as StringSelectMenuComponent).options.find(
  //   (o:APISelectMenuOption) => o.default === true,
  // );

  log.debug(F, `selectedItem (accept home): ${JSON.stringify(selectedItem, null, 2)}`);
  // log.debug(F, `selectedName: ${JSON.stringify(selectedName, null, 2)}`);
  // log.debug(F, `selectedSpecies: ${JSON.stringify(selectedSpecies, null, 2)}`);
  // log.debug(F, `selectedClass: ${JSON.stringify(selectedClass, null, 2)}`);
  // log.debug(F, `selectedGuild: ${JSON.stringify(selectedGuild, null, 2)}`);

  // Get the existing inventory data
  const inventoryData = await inventoryGet(personaData.id);
  log.debug(F, `Persona home inventory (accept): ${JSON.stringify(inventoryData, null, 2)}`);

  // Find the selectedItem in the inventoryData
  const chosenItem = inventoryData.find(item => item.value === selectedItem?.value);

  // Equip the item
  if (chosenItem) {
    chosenItem.equipped = true;
    await inventorySet(chosenItem);
  } else {
    log.error(F, `Item not found in inventory: ${JSON.stringify(chosenItem, null, 2)}`);
  }

  // Un-equip all other items
  const otherItems = inventoryData.filter(item => item.value !== selectedItem?.value);
  otherItems.forEach(item => {
    const newItem = item;
    newItem.equipped = false;
    inventorySet(newItem);
  });

  // Set persona data
  // personaData.name = selectedName?.label ?? 'No Name';
  // personaData.species = selectedSpecies?.value ?? 'formless';
  // personaData.class = selectedClass?.value ?? 'jobless';
  // personaData.guild = selectedGuild?.value ?? 'guildless';
  // personaData.tokens = 0;

  // log.debug(F, `Setting Persona data: ${JSON.stringify(personaData, null, 2)}`);

  // await personaSet(personaData);
  const { embeds, components, files } = await rpgHome(interaction, `**You have equipped ${chosenItem?.label}!**\n`);
  return {
    embeds,
    components,
    files,
  };
}

export async function rpgHomeInventory(
  interaction:MessageComponentInteraction | ChatInputCommandInteraction,
):Promise<{
    homeInventory:SelectMenuComponentOptionData[];
    personaTokens:number;
    personaInventory:string;
  }> {
  // Check get fresh persona data
  const [personaData] = await getPersonaInfo(interaction.user.id);

  // Get the existing inventory data
  const inventoryData = await inventoryGet(personaData.id);
  // log.debug(F, `Persona home inventory: ${JSON.stringify(inventoryData, null, 2)}`);

  // Get a string display of the user's inventory
  const inventoryList = inventoryData.map(item => `**${item.label}** - ${item.description}`).join('\n');
  const inventoryString = inventoryData.length > 0
    ? stripIndents`
      **Inventory**
      ${inventoryList}
      `
    : '';

  // Go through items.general and create a new object of items that the user doesn't have yet
  const homeInventory = [...Object.values(items.backgrounds)]
    .map(item => {
      if (inventoryData.find(i => i.value === item.value)) {
        return {
          label: `${item.label} - ${item.cost} TT$`,
          value: item.value,
          description: `${item.description} - ${item.cost} TT$`,
          emoji: item.emoji,
        };
      }
      return null;
    })
    .filter(item => item !== null) as SelectMenuComponentOptionData[];
  // log.debug(F, `generalOptions: ${JSON.stringify(homeInventory, null, 2)}`);
  return {
    homeInventory,
    personaTokens: personaData.tokens,
    personaInventory: inventoryString,
  };
}

export async function rpgHomeNameChange(
  interaction: MessageComponentInteraction,
):Promise<void> {
  // Check get fresh persona data
  const [personaData] = await getPersonaInfo(interaction.user.id);

  // When this button is clicked, a modal appears where the user can enter their name
  // Create the modal
  const modal = new ModalBuilder()
    .setCustomId(`rpgNameModal~${interaction.id}`)
    .setTitle('Setup your TripSit room!');

  const body = new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
    .setLabel('What do you want to name your persona?')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setCustomId('rpgNewName'));
  modal.addComponents([body]);
  await interaction.showModal(modal);

  // Collect a modal submit interaction
  const modalFilter = (i:ModalSubmitInteraction) => (i.customId.startsWith('rpgNameModal')
    && i.customId.split('~')[1] === interaction.id
    && i.guild !== null);
  await interaction.awaitModalSubmit({ filter: modalFilter, time: 0 })
    .then(async (i):Promise<{
      embed: EmbedBuilder,
      components: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[],
    }> => {
      const choice = i.fields.getTextInputValue('rpgNewName');

      log.debug(F, `name: ${choice}`);

      menus.name.setOptions([{
        label: choice,
        value: choice,
        emoji: '👤',
        default: true,
      }]);

      await i.reply({ content: `Your name has been set to ${choice}`, ephemeral: true });

      const rowHome = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          buttons.name,
          buttons.accept,
          buttons.decline,
          buttons.town,
        );

      if (!personaData) {
        return {
          embed: embedTemplate()
            .setAuthor(null)
            .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL })
            .setTitle('Home')
            .setDescription(stripIndents`
            You are in your home, you can change your name, species, class and here.
          `)
            .setColor(Colors.Green),
          components: [rowHome],
        };
      }
      const rowChangeNameDisplay = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(menus.name);

      const selectedClassList = { ...genome.classes };
      selectedClassList[personaData.class as keyof typeof selectedClassList].default = true;

      const selectedSpeciesList = { ...genome.species };
      selectedSpeciesList[personaData.species as keyof typeof selectedSpeciesList].default = true;

      const selectedGuildList = { ...genome.guild };
      selectedGuildList[personaData.guild as keyof typeof selectedGuildList].default = true;

      menus.class.setOptions(Object.values(selectedClassList));
      const rowChangeClass = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(menus.class);

      menus.species.setOptions(Object.values(selectedSpeciesList));
      const rowChangeSpecies = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(menus.species);

      menus.guild.setOptions(Object.values(selectedGuildList));
      const rowChangeGuild = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(menus.guild);

      return {
        embed: embedTemplate()
          .setAuthor(null)
          .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL })
          .setTitle('Home')
          .setDescription(stripIndents`
            You are in your home, you can change your name, species, class and here.
          `)
          .setColor(Colors.Green),
        components: [rowChangeNameDisplay, rowChangeSpecies, rowChangeClass, rowChangeGuild, rowHome],
      };
    });
}

export async function rpgArcade(
  interaction: MessageComponentInteraction | ChatInputCommandInteraction,
):Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  // Check get fresh persona data
  const [personaData] = await getPersonaInfo(interaction.user.id);
  log.debug(F, `personaData (Arcade): ${JSON.stringify(personaData, null, 2)}`);

  const rowArcade = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      buttons.coinFlip,
      buttons.roulette,
      // buttons.blackjack,
      // buttons.slotMachine,
      buttons.town,
    );

  // The user has clicked the shop button, send them the shop embed
  return {
    embeds: [embedTemplate()
      .setAuthor(null)
      .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL })
      .setTitle('Games')
      .setDescription(stripIndents`
        You ${rand(text.enter)} the arcade and see a variety of games.
      `)
      .setColor(Colors.Green)],
    components: [rowArcade],
  };
}

type GameName = 'Coinflip' | 'Roulette' | 'Blackjack' | 'Slots';
const gameData = {
  Coinflip: {
    gameName: 'Coinflip' as GameName,
    instructions: stripIndents`Click the buttons below to set how many of your tokens you want to bet.
    Click the heads or tails button to flip the coin, or you can go back to the arcade.
    If you win, you get the amount you bet.
    If you lose, you lose the amount you bet.`,
    object: 'coin',
    bets: [
      buttons.coinflipHeads,
      buttons.coinflipTails,
    ],
    options: [
      'heads',
      'tails',
    ],
  },
  Roulette: {
    gameName: 'Roulette' as GameName,
    instructions: stripIndents`Click the buttons below to set how many of your tokens you want to bet.
    Click a bet button to place a bet on that outcome, or you can go back to the arcade.
    
    Depending on what you picked and where the ball lands, you will win or lose your bet.

    **Odds**
    "X:1" means you get X coins for every 1 you bet
    > Red/Black/Even/Odd/High/Low: 1:1
    > First/Second/Third: 2:1
    > 1-2/3-4/5-6/7-8: 3:1
    > 0: 8:1
    `,
    object: 'wheel',
    bets: [
      buttons.rouletteRed, //
      buttons.rouletteBlack, //
      buttons.rouletteFirst, //
      buttons.rouletteSecond, //
      buttons.rouletteThird, //

      buttons.rouletteEven, //
      buttons.rouletteOdd, //
      buttons.roulette1to12, //
      buttons.roulette13to24, //
      buttons.roulette25to36, //

      buttons.rouletteZero, //
      buttons.rouletteHigh, //
      buttons.rouletteLow, //
    ],
    options: ['00', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36'],
  },
};

export async function rpgArcadeGame(
  interaction: MessageComponentInteraction | ChatInputCommandInteraction,
  gameName: GameName,
  choice?: 'heads' | 'tails' | '0'
  | 'evens' | 'odds' | 'red' | 'black'
  | 'high' | 'low' | 'first' | 'second' | 'third'
  | '1-12' | '13-24' | '25-36',
  message?: string,
):Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  const { instructions } = gameData[gameName as keyof typeof gameData];

  const rowWagers = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      buttons.wager1,
      buttons.wager10,
      buttons.wager100,
      buttons.wager1000,
      buttons.arcade,
    );

  const { bets } = gameData[gameName as keyof typeof gameData];

  const rowBetsA = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(...bets.slice(0, 5));

  const rowBetsB = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(...bets.slice(5, 10));

  const rowBetsC = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(...bets.slice(10, 15));

  const rowBetsD = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(...bets.slice(15, 20));

  log.debug(F, `rowWagers: ${JSON.stringify(rowWagers, null, 2)}`);
  log.debug(F, `rowBetsA: ${JSON.stringify(rowBetsA, null, 2)}`);

  const components = [rowWagers, rowBetsA];
  if (rowBetsB.components.length > 0) components.push(rowBetsB);
  if (rowBetsC.components.length > 0) components.push(rowBetsC);
  if (rowBetsD.components.length > 0) components.push(rowBetsD);

  log.debug(F, `components: ${JSON.stringify(components, null, 2)}`);

  if (!wagers[interaction.user.id]) {
    wagers[interaction.user.id] = {
      tokens: 0,
      gameName,
    };
  }

  if (wagers[interaction.user.id].gameName !== gameName) {
    wagers[interaction.user.id] = {
      tokens: 0,
      gameName,
    };
  }

  // Check get fresh persona data
  const [personaData] = await getPersonaInfo(interaction.user.id);
  log.debug(F, `personaData (Coinflip): ${JSON.stringify(personaData, null, 2)}`);

  const currentBet = wagers[interaction.user.id].tokens;
  log.debug(F, `currentBet: ${currentBet}`);

  log.debug(F, `choice: ${choice}`);
  if (choice && currentBet === 0) {
    const noBetError = {
      embeds: [embedTemplate()
        .setAuthor(null)
        .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL })
        .setTitle(gameName)
        .setDescription(stripIndents`
          **You can't start a game without first placing a bet!**

          You can bet ${personaData.tokens} tokens.
        `)
        .setColor(Colors.Gold)],
      components,
    };
    await (interaction as MessageComponentInteraction).update(noBetError);
    return noBetError;
  }

  if (choice) {
    await rpgArcadeAnimate(interaction, gameName);
    const { object } = gameData[gameName as keyof typeof gameData];

    const { options } = gameData[gameName as keyof typeof gameData];
    const result = rand(options);
    log.debug(F, `result: ${result}`);

    let payout = 0;
    if (gameName === 'Coinflip') {
      if (result === choice) payout = currentBet;
    } else if (gameName === 'Roulette') {
      const number = parseInt(result, 10);
      if (choice === '0' && number === 0) payout = currentBet * 17;
      else if ((choice === 'red' || choice === 'evens') && (number % 2 === 0)) payout = currentBet;
      else if ((choice === 'black' || choice === 'odds') && (number % 2 !== 0)) payout = currentBet;
      else if ((choice === 'high') && (number > 18)) payout = currentBet;
      else if ((choice === 'low') && (number < 18)) payout = currentBet;
      else if ((choice === '1-12') && (number < 13)) payout = currentBet * 2;
      else if ((choice === '13-24') && (number > 12 && number < 25)) payout = currentBet * 2;
      else if ((choice === '25-36') && (number > 24)) payout = currentBet * 2;
      else if ((choice === 'first') && ([1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].includes(number))) payout = currentBet * 2;
      else if ((choice === 'second') && ([2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].includes(number))) payout = currentBet * 2;
      else if ((choice === 'third') && ([3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].includes(number))) payout = currentBet * 2;
    }

    log.debug(F, `result: ${result}`);
    if (payout !== 0) {
      // The user won
      personaData.tokens += payout;
      await personaSet(personaData);
      wagers[interaction.user.id] = {
        tokens: 0,
        gameName,
      };
      return {
        embeds: [embedTemplate()
          .setAuthor(null)
          .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL })
          .setTitle(gameName)
          .setDescription(stripIndents`
            The ${object} came up **${result}** and you chose **${choice}**!

            **You won ${payout} tokens!**

            You can bet ${personaData.tokens} tokens.
          `)
          .setColor(Colors.Gold)],
        components,
      };
    }
    // The user lost
    personaData.tokens -= currentBet;
    await personaSet(personaData);
    wagers[interaction.user.id] = {
      tokens: 0,
      gameName,
    };
    return {
      embeds: [embedTemplate()
        .setAuthor(null)
        .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL })
        .setTitle(gameName)
        .setDescription(stripIndents`
            The ${object} came up **${result}** and you chose **${choice}**!

            **You lost ${currentBet} tokens!**

            You can bet ${personaData.tokens} tokens.
          `)
        .setColor(Colors.Grey)],
      components,
    };
  }

  // The user has clicked the shop button, send them the shop embed
  if (currentBet !== 0) {
    log.debug(F, 'No choice made, but a bet was made, return the bet screen');
    return {
      embeds: [embedTemplate()
        .setAuthor(null)
        .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL })
        .setTitle(gameName)
        .setDescription(stripIndents`${message ?? ''}
          You are betting ${currentBet} tokens.

          You can bet ${personaData.tokens} tokens.
        `)
        .setColor(Colors.Green)],
      components,
    };
  }

  return {
    embeds: [embedTemplate()
      .setAuthor(null)
      .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL })
      .setTitle(gameName)
      .setDescription(stripIndents`You start a game of ${gameName}.

        ${instructions}

        You can bet ${personaData.tokens} tokens.
      `)
      .setColor(Colors.Green)],
    components,
  };
}

export async function rpgArcadeAnimate(
  interaction: MessageComponentInteraction | ChatInputCommandInteraction,
  gameName: GameName,
) {
  // if (env.NODE_ENV === 'development') {
  //   await (interaction as MessageComponentInteraction).update({
  //     embeds: [embedTemplate()
  //       .setAuthor(null)
  //       .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG`, iconURL: env.TS_ICON_URL })
  //       .setTitle(gameName),
  //     ],
  //   });
  //   return;
  // }

  if (gameName === 'Coinflip') {
    const spaceField = { name: '\u200B', value: '\u200B' };
    const embed = embedTemplate()
      .setAuthor(null)
      .setFooter(null)
      .setFields([
        { name: '🪙', value: '🫱' },
      ]);

    await (interaction as MessageComponentInteraction).update({ // eslint-disable-line no-await-in-loop
      embeds: [embed],
    });

    await sleep(1 * 1000);

    await (interaction as MessageComponentInteraction).editReply({ // eslint-disable-line no-await-in-loop
      embeds: [embed.setFields([
        { name: '🪙', value: '👍' },
      ])],
    });

    await sleep(0.5 * 1000);

    let height = 1;
    const ceiling = 3;
    while (height < ceiling) {
      await sleep(0.25 * 1000); // eslint-disable-line no-await-in-loop
      embed.setFields([{ name: '\u200B', value: '🪙' }]);
      const spaceArray = Array(height).fill(spaceField);
      if (spaceArray && spaceArray.length > 0) {
        embed.addFields(spaceArray);
      }
      embed.addFields([{ name: '\u200B', value: '🫴' }]);

      await (interaction as MessageComponentInteraction).editReply({ // eslint-disable-line no-await-in-loop
        embeds: [embed],
      });
      height += 1;
      // log.debug(F, `height up: ${height}`);
    }
    while (height > 0) {
      await sleep(0.25 * 1000); // eslint-disable-line no-await-in-loop
      embed.setFields([{ name: '\u200B', value: '🪙' }]);
      const spaceArray = Array(height).fill({ name: '\u200B', value: '\u200B' });
      if (spaceArray && spaceArray.length > 0) {
        embed.addFields(spaceArray);
      }
      embed.addFields([{ name: '\u200B', value: '🫴' }]);

      await (interaction as MessageComponentInteraction).editReply({ // eslint-disable-line no-await-in-loop
        embeds: [embed],
      });
      height -= 1;
      // log.debug(F, `height down: ${height}`);
    }

    await (interaction as MessageComponentInteraction).editReply({ // eslint-disable-line no-await-in-loop
      embeds: [embed.setFields([
        { name: '🪙', value: '🫴' },
      ])],
    });
    await sleep(0.5 * 1000);

    await (interaction as MessageComponentInteraction).editReply({ // eslint-disable-line no-await-in-loop
      embeds: [embed.setFields([
        { name: '🪙', value: '🫴', inline: true },
      ])],
    });
    await sleep(1 * 1000);
  }

  if (gameName === 'Roulette') {
    // Make an animation out of embeds that shows an arrow spinning

    const wheelTop = [
      { name: '\u200B', value: '⬛', inline: true },
      { name: '\u200B', value: '🟥', inline: true },
      { name: '\u200B', value: '⬛', inline: true },
      { name: '🟥', value: '⬛', inline: true },
    ];
    const wheelBottom = [
      { name: '🟥', value: '⬛', inline: true },
      // { name: '🟥', value: '\u200B', inline: true },
      // { name: '⬛', value: '\u200B', inline: true },
      // { name: '🟥', value: '\u200B', inline: true },
    ];

    const embed = embedTemplate()
      .setAuthor(null)
      .setFooter(null)
      .setFields(
        ...wheelTop,
        { name: '⬆️', value: '🟥', inline: true },
        ...wheelBottom,
      );
    await (interaction as MessageComponentInteraction).update({ embeds: [embed] }); // eslint-disable-line no-await-in-loop
    await sleep(0.5 * 1000); // eslint-disable-line no-await-in-loop

    const arrows = ['↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️', '⬆️', '↗️', '➡️', '↘️'];
    for (const arrow of arrows) { // eslint-disable-line no-restricted-syntax
      embed.setFields(
        ...wheelTop,
        { name: arrow, value: '🟥', inline: true },
        ...wheelBottom,
      );
      await (interaction as MessageComponentInteraction).editReply({ embeds: [embed] }); // eslint-disable-line no-await-in-loop
      // await sleep(0.1 * 1000); // eslint-disable-line no-await-in-loop
    }

    await sleep(2 * 1000);
  }
}

export async function rpgArcadeWager(
  interaction: MessageComponentInteraction,
):Promise<InteractionUpdateOptions> {
  let newBet = wagers[interaction.user.id].tokens;
  const bet = parseInt(interaction.customId.slice(8), 10);
  newBet += bet || 0;

  const [personaData] = await getPersonaInfo(interaction.user.id);
  if (personaData.tokens < newBet) {
    const notEnough = '**You don\'t have enough to bet that much**\n';
    return rpgArcadeGame(interaction, wagers[interaction.user.id].gameName, undefined, notEnough);
  }

  wagers[interaction.user.id].tokens = newBet;

  return rpgArcadeGame(interaction, wagers[interaction.user.id].gameName);
}

function sleep(ms:number):Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
