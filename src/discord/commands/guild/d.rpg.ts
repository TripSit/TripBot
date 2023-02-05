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
  StringSelectMenuInteraction,
  InteractionEditReplyOptions,
  InteractionUpdateOptions,
  SelectMenuComponentOptionData,
  AttachmentBuilder,
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
import { Personas, RpgInventory } from '../../../global/@types/pgdb';
import { imageGet } from '../../utils/imageGet';

const F = f(__filename);

export default dRpg;

// Value in miliseconds (1000 * 60 * 1 = 1 minute)
const intervals = {
  quest: env.NODE_ENV === 'production' ? 1000 * 60 * 60 : 1000 * 1,
  dungeon: env.NODE_ENV === 'production' ? 1000 * 60 * 60 * 24 : 1000 * 1,
  raid: env.NODE_ENV === 'production' ? 1000 * 60 * 60 * 24 * 7 : 1000 * 1,
};

const buttons = {
  name: new ButtonBuilder()
    .setCustomId('rpgName')
    .setLabel('Name')
    .setStyle(ButtonStyle.Success)
    .setEmoji('📝'),
  accept: new ButtonBuilder()
    .setCustomId('rpgAccept')
    .setLabel('Accept')
    .setStyle(ButtonStyle.Success)
    .setEmoji('✅'),
  decline: new ButtonBuilder()
    .setCustomId('rpgTown')
    .setLabel('Decline')
    .setStyle(ButtonStyle.Danger)
    .setEmoji('❌'),
  town: new ButtonBuilder()
    .setCustomId('rpgTown')
    .setLabel('Town')
    .setStyle(ButtonStyle.Success)
    .setEmoji('🏘️'),
  work: new ButtonBuilder()
    .setCustomId('rpgWork')
    .setLabel('Work')
    .setStyle(ButtonStyle.Success)
    .setEmoji('👷'),
  shop: new ButtonBuilder()
    .setCustomId('rpgShop')
    .setLabel('Shop')
    .setStyle(ButtonStyle.Success)
    .setEmoji('🛒'),
  games: new ButtonBuilder()
    .setCustomId('rpgGames')
    .setLabel('Games')
    .setStyle(ButtonStyle.Success)
    .setEmoji('🎮'),
  profile: new ButtonBuilder()
    .setCustomId('rpgProfile')
    .setLabel('Profile')
    .setStyle(ButtonStyle.Success)
    .setEmoji('👤'),
  quest: new ButtonBuilder()
    .setCustomId('rpgQuest')
    .setLabel('Quest')
    .setStyle(ButtonStyle.Success)
    .setEmoji('🗺️'),
  dungeon: new ButtonBuilder()
    .setCustomId('rpgDungeon')
    .setLabel('Dungeon')
    .setStyle(ButtonStyle.Success)
    .setEmoji('🏰'),
  raid: new ButtonBuilder()
    .setCustomId('rpgRaid')
    .setLabel('Raid')
    .setStyle(ButtonStyle.Success)
    .setEmoji('👹'),
  inventory: new ButtonBuilder()
    .setCustomId('rpgInventory')
    .setLabel('Inventory')
    .setStyle(ButtonStyle.Success)
    .setEmoji('🎒'),
  stats: new ButtonBuilder()
    .setCustomId('rpgStats')
    .setLabel('Stats')
    .setStyle(ButtonStyle.Success)
    .setEmoji('📊'),
  guild: new ButtonBuilder()
    .setCustomId('rpgGuild')
    .setLabel('Guild')
    .setStyle(ButtonStyle.Success)
    .setEmoji('🏰'),
  buy: new ButtonBuilder()
    .setCustomId('rpgShopBuy')
    .setLabel('Buy')
    .setStyle(ButtonStyle.Success)
    .setEmoji('🛒'),
  dice: new ButtonBuilder()
    .setCustomId('rpgDice')
    .setLabel('Dice')
    .setStyle(ButtonStyle.Success)
    .setEmoji('🎲'),
  coinFlip: new ButtonBuilder()
    .setCustomId('rpgCoinFlip')
    .setLabel('CoinFlip')
    .setStyle(ButtonStyle.Success)
    .setEmoji('🪙'),
  roulette: new ButtonBuilder()
    .setCustomId('rpgRoulette')
    .setLabel('Roulette')
    .setStyle(ButtonStyle.Success)
    .setEmoji('🎰'),
} as {
  [key: string]: ButtonBuilder;
};

const menus = {
  item: new StringSelectMenuBuilder()
    .setCustomId('rpgGeneralSelect')
    .setPlaceholder('Select an item to buy'),
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
    //   equipped: true,
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
    //   equipped: true,
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
    //   equipped: true,
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
    //   equipped: true,
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
      equipped: true,
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
      equipped: true,
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
      equipped: true,
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
      equipped: true,
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
      equipped: true,
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
      equipped: true,
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
      equipped: true,
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
      equipped: true,
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
      equipped: true,
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
      equipped: true,
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
      equipped: true,
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
      equipped: true,
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
      equipped: true,
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
      equipped: true,
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
      equipped: true,
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
      equipped: true,
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
      equipped: true,
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
      equipped: true,
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
      equipped: true,
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
      equipped: true,
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
      equipped: true,
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
      equipped: true,
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
      equipped: true,
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
      description: 'A powerful spellcaster',
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

export const dRpg: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('rpg')
    .setDescription('A TripSit RPG!')
    .addSubcommand(subcommand => subcommand
      .setName('town')
      .setDescription('Go to TripTown!'))
    // .addSubcommand(subcommand => subcommand
    //   .setName('shop')
    //   .setDescription('Go to the Shop!'))
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
      .setDescription('Raid a boss and earn 50 tokens!')),
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
    // The user can also view their profile:
    // - Inventory - View their inventory and equip/unequip items
    // - Stats - View their stats and level them up
    // - Guild - View their guild and join/leave a guild
    const subcommand = interaction.options.getSubcommand();

    const message = subcommand === 'quest' || subcommand === 'dungeon' || subcommand === 'raid'
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
    log.debug(F, `Persona data: ${JSON.stringify(personaData, null, 2)}`);

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

    if (subcommand === 'quest' || subcommand === 'dungeon' || subcommand === 'raid') {
      await interaction.editReply(await rpgWork(interaction, subcommand));
    }
    if (subcommand === 'shop') {
      await interaction.editReply(await rpgShop(interaction));
    }
    if (subcommand === 'town') {
      await interaction.editReply(await rpgTown());
    }
    if (subcommand === 'work') {
      await interaction.editReply(await rpgWork(interaction, null));
    }

    // Button collector
    collector.on('collect', async (i: MessageComponentInteraction) => {
      log.debug(F, `Interaction: ${JSON.stringify(i.customId, null, 2)}`);
      if (i.customId === 'rpgTown') {
        await i.update(await rpgTown());
      } else if (i.customId === 'rpgWork') {
        // The user has clicked the work button, send them the work embed
        await i.update(await rpgWork(i, null));
      } else if (i.customId === 'rpgQuest'
      || i.customId === 'rpgDungeon'
      || i.customId === 'rpgRaid') {
        const command = i.customId.replace('rpg', '').toLowerCase() as 'quest' | 'dungeon' | 'raid';
        await i.update(await rpgWork(i, command));
      } else if (i.customId === 'rpgShop') {
        await i.update(await rpgShop(i));
      } else if (i.customId === 'rpgGames') {
        // The user has clicked the games button, send them the games embed
        await i.update(await rpgGames(i));
      } else if (i.customId === 'rpgProfile') {
        // The user has clicked the games button, send them the games embed
        await i.update(await rpgProfile(i));
      } else if (i.customId === 'rpgSpecies') {
        await i.update(await rpgProfileChange(i, 'species'));
      } else if (i.customId === 'rpgClass') {
        await i.update(await rpgProfileChange(i, 'class'));
      } else if (i.customId === 'rpgGuild') {
        await i.update(await rpgProfileChange(i, 'guild'));
      } else if (i.customId === 'rpgName') {
        await rpgName(i);
      } else if (i.customId === 'rpgAccept') {
        await i.update(await rpgProfileAccept(i));
      } else if (i.customId === 'rpgGeneralSelect') {
        await i.update(await rpgShopChange(i));
      } else if (i.customId === 'rpgShopBuy') {
        await i.update(await rpgShopAccept(i));
      }
    });

    return true;
  },
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
    'You find a lost cat and return it to its owner.\nThe cat caughs up a hairball.\nOh, that\'s actually {tokens} tokens!\nYou wipe them off and pocket them.',
    'You find a lost dog and return it to its owner.\nThe dog looks into your eyes and you feel a connection to their soul.\nYour pocket feels {tokens} tokens heavier.',
    'You find a lost bird and return it to its owner.\nThe bird gives you a really cool feather.\nYou trade the feather to some kid for {tokens} tokens.',
    'You find a lost fish and return it to its owner.\nHow do you lose a fish?\nYou decide not to ask and leave with your {tokens} tokens as soon as you can.',
    'You do some hunting and bring back some food for the town.\nThe town gives you {tokens} tokens for your troubles.',
    'You go fishing and bring back some food for the town.\nThe town gives you {tokens} tokens for your troubles.',
    'You go mining and bring back some ore for the town.\nThe town gives you {tokens} tokens for your troubles.',
    'You help build a new house in the town.\nThe town gives you {tokens} tokens for your troubles.',
  ],
  dungeon: [
    'You voyaged to fight the evil wizard in the dark towner!\nBut they\'re just misunderstood and enjoy earth tones.\nThey appreciate the visit and gave you {tokens} tokens for your troubles.',
    'You were tasked with killing a dragon that has looted the countryside!\nBut it was only feeding its baby dragon.\nYou taught the dragon how to farm and it gave you {tokens} Tokens.',
    'You attempted to subdue the ogre known for assaulting people!\nBut it turns out they just hug too hard.\nYou taught them about personal boundries and they gave you {tokens} Tokens.',
    'You went to the local cave to fight the goblin king!\nBut it turns out he was just a goblin who wanted to be king.\nYou taught him about democracy and he gave you {tokens} Tokens.',
    'You journey to the dark forest to fight the evil witch!\nBut they turn out to be a gardner with too much property.\nYou taught her about landscapers and she gave you {tokens} Tokens.',
  ],
};

function rand(array:string[]):string {
  return array[Math.floor(Math.random() * array.length)];
}

export async function rpgTown():Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  // Check if the user has a persona
  // const [personaData] = await getPersonaInfo(interaction.user.id);

  const rowTown = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      buttons.work,
      buttons.shop,
    // buttonGames,
    // buttonProfile,
    );

  return {
    embeds: [embedTemplate()
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

export async function rpgWork(
  interaction: MessageComponentInteraction | ChatInputCommandInteraction,
  command: 'quest' | 'dungeon' | 'raid' | null,
):Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  // Check if the user has a persona
  const [personaData] = await getPersonaInfo(interaction.user.id);

  // Get the existing inventory data
  const inventoryData = await inventoryGet(personaData.id);
  log.debug(F, `Persona inventory: ${JSON.stringify(inventoryData, null, 2)}`);

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
          It's been less than an hour since you last went on a quest, you're too tired to work.
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
          It's been less than 24 hours since you last cleared a dungeon, you still need to prepare.
        `,
        color: Colors.Red,
      },
    },
    raid: {
      success: {
        title: 'Raid Success',
        description: stripIndents`
        You stormed into Moonbear's office, russled their jimmies and stole {tokens} TripTokens!
      `,
        color: Colors.Green,
      },
      fail: {
        title: 'Raid Fail',
        description: stripIndents`
        It's been less than 7 days since you last raided Moonbear's office, give them a break!
      `,
        color: Colors.Red,
      },
    },
  };

  if (command !== null) {
    const dbKey = `last_${command}`;
    const lastWork = personaData[dbKey as 'last_quest' | 'last_dungeon' | 'last_raid'] as Date;
    log.debug(F, `lastWork: ${lastWork}`);

    const interval = intervals[command] ?? 0;
    log.debug(F, `interval: ${interval}`);
    log.debug(F, `intervalMins: ${interval / 1000 / 60}}`);

    // log.debug(F, `personaData1: ${JSON.stringify(personaData, null, 2)}`);
    if (lastWork && (lastWork.getTime() + interval > new Date().getTime())) {
      return {
        embeds: [embedTemplate()
          .setTitle(contracts[command].fail.title)
          .setDescription(stripIndents`${contracts[command].fail.description}
      You still have ${personaData.tokens} TT$!
      You can try again ${time(new Date(lastWork.getTime() + interval), 'R')}`)
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
        .setTitle(contracts[command].success.title)
        .setDescription(stripIndents`${contracts[command].success.description.replace('{tokens}', tokens.toString())}
    You now have ${personaData.tokens} TT$!
    You can try again ${time(new Date(new Date().getTime() + interval), 'R')}`)
        .setColor(contracts[command].success.color)],
      components: [rowWork],
    };
  }

  return {
    embeds: [embedTemplate()
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

  // Everyone gets the town button, but only people with unpurchased items get the items select menu
  const componentList = [rowShop] as ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[];
  if (shopInventory.length > 0) { componentList.unshift(rowItems); }

  // The user has clicked the shop button, send them the shop embed
  return {
    embeds: [embedTemplate()
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

  // Go through items.general and create a new object of items that the user doesnt have yet
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

  // // Get the existing inventory data
  // const personaInventory = await inventoryGet(personaData.id);
  // log.debug(F, `Persona inventory: ${JSON.stringify(personaInventory, null, 2)}`);

  // // Get a string display of the user's inventory
  // let inventoryList = personaInventory.map(item => `**${item.label}** - ${item.description}`).join('\n');
  // let inventoryString = stripIndents`
  //     **Inventory**
  //     ${inventoryList}
  //     `;

  // // Message
  // // row 1: select menu
  // // row 2: buy button, town button

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
      .setTitle('Shop')
      .setDescription(stripIndents`**You have purchased ${itemData.label} for ${itemData.cost} TripTokens.**
      
      ${description}`)
      .setColor(Colors.Green)],
    components,
  };
}

export async function rpgGames(
  interaction: MessageComponentInteraction | ChatInputCommandInteraction,
):Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  // Check get fresh persona data
  const [personaData] = await getPersonaInfo(interaction.user.id);
  log.debug(F, `personaData (Games): ${JSON.stringify(personaData, null, 2)}`);

  const rowGames = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      buttons.dice,
      buttons.coinFlip,
      buttons.roulette,
      buttons.town,
    );

  // The user has clicked the shop button, send them the shop embed
  return {
    embeds: [embedTemplate()
      .setTitle('Games')
      .setDescription(stripIndents`
      You are playing some games, you can play some dice, flip a coin, or play some roulette.
    `)
      .setColor(Colors.Green)],
    components: [rowGames],
  };
}

export async function rpgProfile(
  interaction: MessageComponentInteraction | ChatInputCommandInteraction,
):Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  // Check get fresh persona data
  const [personaData] = await getPersonaInfo(interaction.user.id);
  log.debug(F, `personaData (Profile): ${JSON.stringify(personaData, null, 2)}`);

  menus.name.setOptions([{
    label: personaData.name,
    value: personaData.name,
    emoji: '👤',
    default: true,
  }]);
  // log.debug(F, `displayName: ${JSON.stringify(displayName, null, 2)}`);

  const rowChangeNameDisplay = new ActionRowBuilder<StringSelectMenuBuilder>()
    .setComponents(menus.name);

  // log.debug(F, `classDef: ${JSON.stringify(classDef, null, 2)}`);
  const selectedClassList = { ...genome.classes };
  // log.debug(F, `selectedClassList1: ${JSON.stringify(selectedClassList, null, 2)}`);
  selectedClassList[personaData.class as keyof typeof selectedClassList].default = true;
  // log.debug(F, `selectedClassList2: ${JSON.stringify(selectedClassList, null, 2)}`);

  menus.class.setOptions(Object.values({ ...selectedClassList }));

  const rowChangeClass = new ActionRowBuilder<StringSelectMenuBuilder>()
    .setComponents(menus.class);

  log.debug(F, `speciesDef: ${JSON.stringify(genome.species, null, 2)}`);
  const selectedSpeciesList = { ...genome.species };
  log.debug(F, `selectedSpeciesList1: ${JSON.stringify(selectedSpeciesList, null, 2)}`);
  selectedSpeciesList[personaData.species as keyof typeof selectedSpeciesList].default = true;
  log.debug(F, `selectedSpeciesList2: ${JSON.stringify(selectedSpeciesList, null, 2)}`);
  log.debug(F, `speciesDef2: ${JSON.stringify(genome.species, null, 2)}`);

  menus.species.setOptions(Object.values({ ...selectedSpeciesList }));
  const rowChangeSpecies = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(menus.species);

  const selectedGuildList = { ...genome.guilds };
  selectedGuildList[personaData.guild as keyof typeof selectedGuildList].default = true;
  // log.debug(F, `Selected guild list: ${JSON.stringify(selectedGuildList, null, 2)}`);

  menus.guild.setOptions(Object.values(selectedGuildList));
  const rowChangeGuild = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(menus.guild);

  const rowProfile = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      buttons.name,
      buttons.accept,
      buttons.decline,
      buttons.town,
    );

  // The user has clicked the profile button, send them the profile embed
  return {
    embeds: [embedTemplate()
      .setTitle('Profile')
      .setDescription(stripIndents`
      You are in your profile, you can change your name, species, class and here.
    `)
      .setColor(Colors.Green)],
    components: [rowChangeNameDisplay, rowChangeClass, rowChangeSpecies, rowChangeGuild, rowProfile],
  };
}

export async function rpgName(
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

      const rowProfile = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          buttons.name,
          buttons.accept,
          buttons.decline,
          buttons.town,
        );

      if (!personaData) {
        return {
          embed: embedTemplate()
            .setTitle('Profile')
            .setDescription(stripIndents`
            You are in your profile, you can change your name, species, class and here.
          `)
            .setColor(Colors.Green),
          components: [rowProfile],
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
          .setTitle('Profile')
          .setDescription(stripIndents`
            You are in your profile, you can change your name, species, class and here.
          `)
          .setColor(Colors.Green),
        components: [rowChangeNameDisplay, rowChangeSpecies, rowChangeClass, rowChangeGuild, rowProfile],
      };
    });
}

export async function rpgProfileChange(
  interaction:MessageComponentInteraction,
  type: 'species' | 'class' | 'guild',
):Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  // Check get fresh persona data
  const [personaData] = await getPersonaInfo(interaction.user.id);
  log.debug(F, `personaData (Change) ${JSON.stringify(personaData, null, 2)}`);
  log.debug(F, `type: ${type}`);

  const [choice] = (interaction as StringSelectMenuInteraction).values;

  const filteredItems = Object.values(genome.species).filter(item => item.value !== choice);

  menus.species.setOptions(filteredItems);

  menus.species.addOptions([
    {
      label: { ...genome.species }[choice as keyof typeof genome.species].label,
      value: { ...genome.species }[choice as keyof typeof genome.species].value,
      description: { ...genome.species }[choice as keyof typeof genome.species].description,
      emoji: { ...genome.species }[choice as keyof typeof genome.species].emoji,
      default: true,
    },
  ]);

  // selectSpecies.addOptions(Object.values(speciesDef).filter(s => s.value !== choice));

  return rpgTown();
}

export async function rpgProfileAccept(
  interaction: MessageComponentInteraction,
):Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  // Check get fresh persona data
  const [personaData] = await getPersonaInfo(interaction.user.id);

  // If the user confirms the information, save the persona information
  const nameComponent = interaction.message.components[0].components[0];
  const selectedName = (nameComponent as StringSelectMenuComponent).options.find(
    (o:APISelectMenuOption) => o.default === true,
  );
  const speciesComponent = interaction.message.components[1].components[0];
  const selectedSpecies = (speciesComponent as StringSelectMenuComponent).options.find(
    (o:APISelectMenuOption) => o.default === true,
  );
  const classComponent = interaction.message.components[2].components[0];
  const selectedClass = (classComponent as StringSelectMenuComponent).options.find(
    (o:APISelectMenuOption) => o.default === true,
  );
  const guildComponent = interaction.message.components[3].components[0];
  const selectedGuild = (guildComponent as StringSelectMenuComponent).options.find(
    (o:APISelectMenuOption) => o.default === true,
  );

  log.debug(F, `selectedName: ${JSON.stringify(selectedName, null, 2)}`);
  log.debug(F, `selectedSpecies: ${JSON.stringify(selectedSpecies, null, 2)}`);
  log.debug(F, `selectedClass: ${JSON.stringify(selectedClass, null, 2)}`);
  log.debug(F, `selectedGuild: ${JSON.stringify(selectedGuild, null, 2)}`);

  personaData.name = selectedName?.label ?? 'No Name';
  personaData.species = selectedSpecies?.value ?? 'formless';
  personaData.class = selectedClass?.value ?? 'jobless';
  personaData.guild = selectedGuild?.value ?? 'guildless';
  personaData.tokens = 0;

  log.debug(F, `Setting Persona data: ${JSON.stringify(personaData, null, 2)}`);

  await personaSet(personaData);

  return rpgTown();
}
