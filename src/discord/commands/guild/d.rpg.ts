/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Colors,
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  SelectMenuBuilder,
  StringSelectMenuBuilder,
  ColorResolvable,
  Interaction,
  ButtonInteraction,
  MessageComponentInteraction,
} from 'discord.js';
import {
  ButtonStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
// import { rpg } from '../../../global/commands/g.rpg';
import { startLog } from '../../utils/startLog';

const F = f(__filename);

export default dRpg;

type ShopItem = {
  name: string;
  description: string;
  cost: number;
  effect: string;
  effectAmount: number;
};

const tableShop = [
  {
    name: 'TestKit',
    description: 'This wonderous item keeps you safe and give you 10% more TripTokens in the future from all sources!',
    cost: 100,
    effect: 'tripTokenMultiplier',
    effectAmount: 1.1,
  },
  {
    name: 'TestKit',
    description: 'This incredible item keeps you safe and give you 20% more TripTokens in the future from all sources!',
    cost: 200,
    effect: 'tripTokenMultiplier',
    effectAmount: 1.2,
  },
] as ShopItem[];

type Persona = {
  id: string;
  userId: string;
  discordId: string;
  name: string;
  class: string;
  species: string;
  guild: string;
  coins: number;
  tripTokenMultiplier: number;
  lastWork: number;
  lastQuest: number;
  lastDungeon: number;
};

const tablePersonas = [{}] as Persona[];

const buttonTown = new ButtonBuilder()
  .setCustomId('rpgTown')
  .setLabel('Town')
  .setStyle(ButtonStyle.Success)
  .setEmoji('🏘️');

const buttonWork = new ButtonBuilder()
  .setCustomId('rpgWork')
  .setLabel('Work')
  .setStyle(ButtonStyle.Success)
  .setEmoji('👷');

const buttonShop = new ButtonBuilder()
  .setCustomId('rpgShop')
  .setLabel('Shop')
  .setStyle(ButtonStyle.Success)
  .setEmoji('🛒');

const buttonGames = new ButtonBuilder()
  .setCustomId('rpgGames')
  .setLabel('Games')
  .setStyle(ButtonStyle.Success)
  .setEmoji('🎮');

const buttonProfile = new ButtonBuilder()
  .setCustomId('rpgProfile')
  .setLabel('Profile')
  .setStyle(ButtonStyle.Success)
  .setEmoji('👤');

const rowTown = new ActionRowBuilder<ButtonBuilder>()
  .addComponents(
    buttonWork,
    buttonShop,
    buttonGames,
    buttonProfile,
  );

const buttonQuest = new ButtonBuilder()
  .setCustomId('rpgQuest')
  .setLabel('Quest')
  .setStyle(ButtonStyle.Success)
  .setEmoji('🗺️');

const buttonDungeon = new ButtonBuilder()
  .setCustomId('rpgDungeon')
  .setLabel('Dungeon')
  .setStyle(ButtonStyle.Success)
  .setEmoji('🏰');

const buttonRaid = new ButtonBuilder()
  .setCustomId('rpgRaid')
  .setLabel('Raid')
  .setStyle(ButtonStyle.Success)
  .setEmoji('👹');

const rowWork = new ActionRowBuilder<ButtonBuilder>()
  .addComponents(
    buttonQuest,
    buttonDungeon,
    buttonRaid,
    buttonTown,
  );

const buttonTestKit = new ButtonBuilder()
  .setCustomId('rpgTestKit')
  .setLabel('TestKit')
  .setStyle(ButtonStyle.Success)
  .setEmoji('🧪');

const buttonScale = new ButtonBuilder()
  .setCustomId('rpgScale')
  .setLabel('Scale')
  .setStyle(ButtonStyle.Success)
  .setEmoji('🐉');

const buttonBorder = new ButtonBuilder()
  .setCustomId('rpgBorder')
  .setLabel('Border')
  .setStyle(ButtonStyle.Success)
  .setEmoji('🎨');

const buttonBackground = new ButtonBuilder()
  .setCustomId('rpgBackground')
  .setLabel('Background')
  .setStyle(ButtonStyle.Success)
  .setEmoji('🎨');

const rowShop = new ActionRowBuilder<ButtonBuilder>()
  .addComponents(
    buttonTestKit,
    buttonScale,
    buttonBorder,
    buttonBackground,
    buttonTown,
  );

const buttonDice = new ButtonBuilder()
  .setCustomId('rpgDice')
  .setLabel('Dice')
  .setStyle(ButtonStyle.Success)
  .setEmoji('🎲');

const buttonCoinFlip = new ButtonBuilder()
  .setCustomId('rpgCoinFlip')
  .setLabel('CoinFlip')
  .setStyle(ButtonStyle.Success)
  .setEmoji('🪙');

const buttonRoulette = new ButtonBuilder()
  .setCustomId('rpgRoulette')
  .setLabel('Roulette')
  .setStyle(ButtonStyle.Success)
  .setEmoji('🎰');

const rowGames = new ActionRowBuilder<ButtonBuilder>()
  .addComponents(
    buttonDice,
    buttonCoinFlip,
    buttonRoulette,
    buttonTown,
  );

const buttonInventory = new ButtonBuilder()
  .setCustomId('rpgInventory')
  .setLabel('Inventory')
  .setStyle(ButtonStyle.Success)
  .setEmoji('🎒');

const buttonStats = new ButtonBuilder()
  .setCustomId('rpgStats')
  .setLabel('Stats')
  .setStyle(ButtonStyle.Success)
  .setEmoji('📊');

const buttonGuild = new ButtonBuilder()
  .setCustomId('rpgGuild')
  .setLabel('Guild')
  .setStyle(ButtonStyle.Success)
  .setEmoji('🏰');

const rowProfile = new ActionRowBuilder<ButtonBuilder>()
  .addComponents(
    buttonInventory,
    buttonStats,
    buttonGuild,
    buttonTown,
  );

const selectClass = new StringSelectMenuBuilder()
  .setCustomId('rpgClass')
  .setPlaceholder('Select a class')
  .addOptions([
    {
      label: 'Warrior',
      value: 'warrior',
      description: 'A strong fighter',
      emoji: '⚔️',
    },
    {
      label: 'Mage',
      value: 'mage',
      description: 'A powerful spellcaster',
      emoji: '🧙',
    },
    {
      label: 'Rogue',
      value: 'rogue',
      description: 'A stealthy assassin',
      emoji: '🗡️',
    },
    {
      label: 'Archer',
      value: 'archer',
      description: 'A ranged attacker',
      emoji: '🏹',
    },
  ]);

const rowClass = new ActionRowBuilder<StringSelectMenuBuilder>()
  .addComponents(selectClass);

const selectSpecies = new StringSelectMenuBuilder()
  .setCustomId('rpgSpecies')
  .setPlaceholder('Select a species')
  .addOptions([
    {
      label: 'Human',
      value: 'human',
      description: 'A human',
      emoji: '👨',
    },
    {
      label: 'Elf',
      value: 'elf',
      description: 'An elf',
      emoji: '🧝',
    },
    {
      label: 'Dwarf',
      value: 'dwarf',
      description: 'A dwarf',
      emoji: '🪓',
    },
    {
      label: 'Orc',
      value: 'orc',
      description: 'An orc',
      emoji: '👹',
    },
  ]);

const rowSpecies = new ActionRowBuilder<StringSelectMenuBuilder>()
  .addComponents(selectSpecies);

type RpgStates = {
  [key: string]: {
    title: string;
    description: string;
    components: (ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>)[];
    color: ColorResolvable;
  };
};

const states = {
  setup: {
    title: 'Setup',
    description: stripIndents`
    Welcome to TripSit's RPG bot!

    Please select a class and species to start your adventure.
    
    You can change these later in your profile!
    `,
    components: [rowClass, rowSpecies],
    color: Colors.Green,
  },
  town: {
    title: 'Town',
    description: stripIndents`
    You are in TripTown, the capital of the Tripsit Kingdom.

    You can go to work and get some coins, or go to the shop to buy some items.

    You can also play some games to earn some coins, or go to your profile to see your stats and inventory.
    
    What would you like to do?`,
    components: [rowTown],
    color: Colors.Green,
  },
  work: {
    title: 'Work',
    description: stripIndents`
      You are at work, you can go on a quest, clear a dungeon, or fight a boss.
    `,
    components: [rowWork],
    color: Colors.Green,
  },
  shop: {
    title: 'Shop',
    description: stripIndents`
      You are in the shop, you can buy some items to help you on your journey.
    `,
    components: [rowShop],
    color: Colors.Green,
  },
  games: {
    title: 'Games',
    description: stripIndents`
      You are playing some games, you can play some dice, flip a coin, or play some roulette.
    `,
    components: [rowGames],
    color: Colors.Green,
  },
  profile: {
    title: 'Profile',
    description: stripIndents`
      You are in your profile, you can see your inventory, stats, and guild.
    `,
    components: [rowProfile],
    color: Colors.Green,
  },
  questSuccess: {
    title: 'Quest',
    description: stripIndents`
      You went on a quest and gained .1 TripCoins!
    `,
    components: [rowWork],
    color: Colors.Green,
  },
  questFail: {
    title: 'Quest',
    description: stripIndents`
      It's been less than an hour since you last went on a quest, you can't go on another one yet.
    `,
    components: [rowWork],
    color: '#ff0000',
  },
  dungeonSuccess: {
    title: 'Dungeon',
    description: stripIndents`
      You cleared a dungeon and gained 1 TripCoins!
    `,
    components: [rowWork],
    color: Colors.Green,
  },
  dungeonFail: {
    title: 'Dungeon',
    description: stripIndents`
      It's been less than 24 hours since you last cleared a dungeon, you can't go on another one yet.
    `,
    components: [rowWork],
    color: '#ff0000',
  },
  raidSuccess: {
    title: 'Raid',
    description: stripIndents`
      You fought in a raid and gained 5 TripCoins!
    `,
    components: [rowWork],
    color: Colors.Green,
  },
  raidFail: {
    title: 'Raid',
    description: stripIndents`
      It's been less than 7 days since you last fought in a Raid, you can't go on another one yet.
    `,
    components: [rowWork],
    color: '#ff0000',
  },
  blackjack: {
    title: 'Blackjack',
    description: stripIndents`
      You are playing some blackjack.
    `,
    components: [rowGames],
    color: Colors.Green,
  },
  coinFlip: {
    title: 'Coin Flip',
    description: stripIndents`
      You are flipping a coin, you can flip a coin or flip a coin 10 times.
    `,
    components: [rowGames],
    color: Colors.Green,
  },
  rockPaperScissors: {
    title: 'Rock Paper Scissors',
    description: stripIndents`
      You are playing some rock paper scissors.
    `,
    components: [rowGames],
    color: Colors.Green,
  },
  inventory: {
    title: 'Inventory',
    description: stripIndents`
      You are looking at your inventory, you can equip items or unequip items.
    `,
    components: [rowProfile],
    color: Colors.Green,
  },
  stats: {
    title: 'Stats',
    description: stripIndents`
      You are looking at your stats, you can change your species or class here.
    `,
    components: [rowProfile],
    color: Colors.Green,
  },
  guild: {
    title: 'Guild',
    description: stripIndents`
      You are looking at your guild, you can join a guild or leave your guild.
    `,
    components: [rowProfile],
    color: Colors.Green,
  },
} as RpgStates;

export const dRpg: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('rpg')
    .setDescription('A TripSit RPG!'),
  async execute(interaction) {
    startLog(F, interaction);
    // This command provides a RPG game for the user to play
    // It starts with the setup subcommand which has the user setup their character including:
    // - Name - string
    // - Class - Warrior, Mage, Rogue, Cleric
    // - Species - Human, Elf, Dwarf, Orc, Gnome, Halfling
    //
    // Once setup, the user can generate coins in a few different ways:
    // - Quest - Grants .1 TripToken, can only be used once every hour
    // - Dungeon - Grants 1 TripToken, can only be used once every 24 hours
    // - Raid - Grants 5 TripToken, can only be used once every 7 days
    //
    // The user can also use their coins to buy items from the shop:
    // - Test Kit - 10% more tokens every time you gain tokens, costs 100 TripToken
    // - Scale - 20% more tokens every time you gain tokens, costs 200 TripToken
    // - Profile border - 30% more tokens every time you gain tokens, costs 300 TripToken
    // - Profile background - 40% more tokens every time you gain tokens, costs 400 TripToken
    //
    // The user can also play some games to earn some coins:
    // - Blackjack - Play a game of blackjack
    // - Coin Flip - Flip a coin or flip a coin 10 times
    // - Rock, Paper, Scissors - Play a game of rock, paper, scissors
    //
    // The user can also view their profile:
    // - Inventory - View their inventory and equip/unequip items
    // - Stats - View their stats and level them up
    // - Guild - View their guild and join/leave a guild

    // Check if the user has a persona
    const persona = await personaGet(interaction.user.id);

    if (!persona) {
      const embedStart = embedTemplate()
        .setTitle(states.setup.title)
        .setDescription(states.setup.description)
        .setColor(states.setup.color);
      const message = await interaction.reply({ embeds: [embedStart], components: states.setup.components });

      // Create a collector that will listen for the user to respond to the setup
      const filter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id;
      const collector = message.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async (i: MessageComponentInteraction) => {
        if (i.customId === 'rpgSpecies') {
          // The user has clicked the species button, send them the species embed
          const embed = embedTemplate()
            .setTitle(states.species.title)
            .setDescription(states.species.description)
            .setColor(states.species.color);
          await i.update({ embeds: [embed], components: states.species.components });
        }
        if (i.customId === 'setup') {
          // The user has clicked the setup button, send them the setup embed
          const embed = embedTemplate()
            .setTitle(states.setup.title)
            .setDescription(states.setup.description)
            .setColor(states.setup.color);
          await i.update({ embeds: [embed], components: states.setup.components });
        } else if (i.customId === 'work') {
          // The user has clicked the work button, send them the work embed
          const embed = embedTemplate()
            .setTitle(states.work.title)
            .setDescription(states.work.description)
            .setColor(states.work.color);
          await i.update({ embeds: [embed], components: states.work.components });
        } else if (i.customId === 'games') {
          // The user has clicked the games button, send them the games embed
          const embed = embedTemplate()
            .setTitle(states.games.title)
            .setDescription(states.games.description)
            .setColor(states.games.color);
          await i.update({ embeds: [embed], components: states.games.components });
        } else if (i.customId === 'profile') {
          // The user has clicked the profile button, send them the profile embed
          const embed = embedTemplate()
            .setTitle(states.profile.title)
            .setDescription(states.profile.description)
            .setColor(states.profile.color);
          await i.update({ embeds: [embed], components: states.profile.components });
        } else if (i.customId === 'quest') {
          // The user has clicked the quest button, send them the quest embed
          const embed = embedTemplate()
            .setTitle(states.questSuccess.title)
            .setDescription(states.questSuccess.description)
            .setColor(states.questSuccess.color);
          await i.update({ embeds: [embed], components: states.questSuccess.components });
        } else if (i.customId === 'dungeon') {
          // The user has clicked the dungeon button, send them the dungeon embed
          const embed = embedTemplate()
            .setTitle(states.dungeonSuccess.title)
            .setDescription(states.dungeonSuccess.description)
            .setColor(states.dungeonSuccess.color);
          await i.update({ embeds: [embed], components: states.dungeonSuccess.components });
        } else if (i.customId === 'raid') {
          // The user has clicked the raid button, send them the raid embed
          const embed = embedTemplate()
            .setTitle(states.raidSuccess.title)
            .setDescription(states.raidSuccess.description)
            .setColor(states.raidSuccess.color);
          await i.update({ embeds: [embed], components: states.raidSuccess.components });
        } else if (i.customId === 'inventory') {
          // The user has clicked the inventory button, send them the inventory embed
          const embed = embedTemplate()
            .setTitle(states.inventory.title)
            .setDescription(states.inventory.description)
            .setColor(states.inventory.color);
          await i.update({ embeds: [embed], components: states.inventory.components });
        }
      });
    }

    return true;
  },
};

async function personaGet(
  userId: string,
) {
  return tablePersonas.filter(persona => persona.userId === userId)[0];
}
