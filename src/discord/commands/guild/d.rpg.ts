import {
  Colors,
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ColorResolvable,
  MessageComponentInteraction,
  time,
  ChatInputCommandInteraction,
} from 'discord.js';
import {
  ButtonStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { getPersonaInfo, setPersonaInfo } from '../../../global/commands/g.rpg';
import { startLog } from '../../utils/startLog';
import { getUser } from '../../../global/utils/knex';
import { Personas } from '../../../global/@types/pgdb';

const F = f(__filename);

export default dRpg;

// Value in miliseconds (1000 * 60 = 1 minute)
const intervalQuest = env.NODE_ENV === 'production' ? 1000 * 60 * 60 : 1000 * 5;
const intervalDungeon = env.NODE_ENV === 'production' ? 1000 * 60 * 60 * 24 : 1000 * 10;
const intervalRaid = env.NODE_ENV === 'production' ? 1000 * 60 * 60 * 24 * 7 : 1000 * 15;

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

// const buttonShop = new ButtonBuilder()
//   .setCustomId('rpgShop')
//   .setLabel('Shop')
//   .setStyle(ButtonStyle.Success)
//   .setEmoji('🛒');

// const buttonGames = new ButtonBuilder()
//   .setCustomId('rpgGames')
//   .setLabel('Games')
//   .setStyle(ButtonStyle.Success)
//   .setEmoji('🎮');

// const buttonProfile = new ButtonBuilder()
//   .setCustomId('rpgProfile')
//   .setLabel('Profile')
//   .setStyle(ButtonStyle.Success)
//   .setEmoji('👤');

const rowTown = new ActionRowBuilder<ButtonBuilder>()
  .addComponents(
    buttonWork,
    // buttonShop,
    // buttonGames,
    // buttonProfile,
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

// type ShopItem = {
//   name: string;
//   description: string;
//   cost: number;
//   effect: string;
//   effectAmount: number;
// };

// const itemDef = {
//   testKit: {
//     label: 'TestKit',
//     value: 'testkit',
//     description: '100 Tokens - 10% more TripTokens from all sources!',
//     emoji: '🧪',
//   },
//   scale: {
//     label: 'Scale',
//     value: 'scale',
//     description: '200 Tokens - 20% more TripTokens from all sources!',
//     emoji: '⚖',
//   },
// };

// const selectItem = new StringSelectMenuBuilder()
//   .setCustomId('rpgPurchase')
//   .setPlaceholder('Select a item to buy')
//   .addOptions(Object.values(itemDef))
//   .setMinValues(1)
//   .setMaxValues(Object.keys(itemDef).length);

// const rowItems = new ActionRowBuilder<StringSelectMenuBuilder>()
//   .addComponents(selectItem);

// const backgroundDef = {
//   backgroundA: {
//     label: 'PatternA',
//     value: 'patternA',
//     description: '100 Tokens - Cool new pattern!',
//     emoji: '🧪',
//   },
//   backgroundB: {
//     label: 'PatternB',
//     value: 'patternB',
//     description: '100 Tokens - Cool new pattern!',
//     emoji: '🧪',
//   },
// };

// const selectBackground = new StringSelectMenuBuilder()
//   .setCustomId('rpgBackground')
//   .setPlaceholder('Select a background to buy')
//   .addOptions(Object.values(backgroundDef));

// const rowBackground = new ActionRowBuilder<StringSelectMenuBuilder>()
//   .addComponents(selectBackground);

// const borderDef = {
//   borderA: {
//     label: 'BorderA',
//     value: 'borderA',
//     description: '100 Tokens - Cool new border!',
//     emoji: '🧪',
//   },
//   borderB: {
//     label: 'BorderB',
//     value: 'borderB',
//     description: '100 Tokens - Cool new border!',
//     emoji: '🧪',
//   },
// };

// const selectBorder = new StringSelectMenuBuilder()
//   .setCustomId('rpgBorder')
//   .setPlaceholder('Select a border to buy')
//   .addOptions(Object.values(borderDef));

// const rowBorder = new ActionRowBuilder<StringSelectMenuBuilder>()
//   .addComponents(selectBorder);

// const rowShop = new ActionRowBuilder<ButtonBuilder>()
//   .addComponents(
//     buttonWork,
//     buttonGames,
//     // buttonProfile,
//     buttonTown,
//   );

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

// const buttonInventory = new ButtonBuilder()
//   .setCustomId('rpgInventory')
//   .setLabel('Inventory')
//   .setStyle(ButtonStyle.Success)
//   .setEmoji('🎒');

// const buttonStats = new ButtonBuilder()
//   .setCustomId('rpgStats')
//   .setLabel('Stats')
//   .setStyle(ButtonStyle.Success)
//   .setEmoji('📊');

// const buttonGuild = new ButtonBuilder()
//   .setCustomId('rpgGuild')
//   .setLabel('Guild')
//   .setStyle(ButtonStyle.Success)
//   .setEmoji('🏰');

// type RpgClasses = {
//   [key: string]: {
//     label: string;
//     value: string;
//     description: string;
//     emoji: string;
//     default?: boolean;
//   };
// };

// const classDef = {
//   jobless: {
//     label: 'No Job',
//     value: 'jobless',
//     description: 'A jobless person',
//     emoji: '👨‍🌾',
//   },
//   warrior: {
//     label: 'Warrior',
//     value: 'warrior',
//     description: 'A strong fighter',
//     emoji: '⚔️',
//   },
//   mage: {
//     label: 'Mage',
//     value: 'mage',
//     description: 'A powerful spellcaster',
//     emoji: '🧙',
//   },
//   rogue: {
//     label: 'Rogue',
//     value: 'rogue',
//     description: 'A stealthy assassin',
//     emoji: '🗡️',
//   },
//   archer: {
//     label: 'Archer',
//     value: 'archer',
//     description: 'A ranged attacker',
//     emoji: '🏹',
//   },
// } as RpgClasses;

// type RpgSpecies = {
//   [key: string]: {
//     label: string;
//     value: string;
//     description: string;
//     emoji: string;
//     default?: boolean;
//   };
// };

// const speciesDef = {
//   formless: {
//     label: 'No Form',
//     value: 'formless',
//     description: 'A formless being',
//     emoji: '👻',
//   },
//   human: {
//     label: 'Human',
//     value: 'human',
//     description: 'A human',
//     emoji: '👨',
//   },
//   elf: {
//     label: 'Elf',
//     value: 'elf',
//     description: 'An elf',
//     emoji: '🧝',
//   },
//   dwarf: {
//     label: 'Dwarf',
//     value: 'dwarf',
//     description: 'A dwarf',
//     emoji: '🪓',
//   },
//   orc: {
//     label: 'Orc',
//     value: 'orc',
//     description: 'An orc',
//     emoji: '👹',
//   },
// } as RpgSpecies;

// type RpgGuilds = {
//   [key: string]: {
//     label: string;
//     value: string;
//     description: string;
//     emoji: string;
//     default?: boolean;
//   };
// };

// const guildDef = {
//   guildless: {
//     label: 'No Guild',
//     value: 'guildless',
//     description: 'No guild',
//     emoji: '🏳️',
//   },
//   gryffindor: {
//     label: 'Gryffindor',
//     value: 'gryffindor',
//     description: 'Gryffindor guild',
//     emoji: '🦁',
//   },
//   hufflepuff: {
//     label: 'Hufflepuff',
//     value: 'hufflepuff',
//     description: 'Hufflepuff guild',
//     emoji: '🦡',
//   },
//   ravenclaw: {
//     label: 'Ravenclaw',
//     value: 'ravenclaw',
//     description: 'Ravenclaw guild',
//     emoji: '🦅',
//   },
//   slytherin: {
//     label: 'Slytherin',
//     value: 'slytherin',
//     description: 'Slytherin guild',
//     emoji: '🐍',
//   },
// } as RpgGuilds;

// const buttonName = new ButtonBuilder()
//   .setCustomId('rpgName')
//   .setLabel('Name')
//   .setStyle(ButtonStyle.Success)
//   .setEmoji('📝');

// const buttonAccept = new ButtonBuilder()
//   .setCustomId('rpgAccept')
//   .setLabel('Accept')
//   .setStyle(ButtonStyle.Success)
//   .setEmoji('✅');

// const buttonDecline = new ButtonBuilder()
//   .setCustomId('rpgTown')
//   .setLabel('Decline')
//   .setStyle(ButtonStyle.Danger)
//   .setEmoji('❌');

// const rowProfile = new ActionRowBuilder<ButtonBuilder>()
//   .addComponents(
//     buttonName,
//     buttonAccept,
//     buttonDecline,
//   );

// const rowStartProfile = new ActionRowBuilder<ButtonBuilder>()
//   .addComponents(
//     buttonName,
//     buttonAccept,
//   );

type RpgStates = {
  [key: string]: {
    title: string;
    description: string;
    components: (ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>)[];
    color: ColorResolvable;
  };
};

export const dRpg: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('rpg')
    .setDescription('A TripSit RPG!')
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

    const states = {
      // setup: {
      //   title: 'Setup',
      //   description: stripIndents`
      //   Welcome to TripSit's RPG bot!

      //   Please select a class and species to start your adventure.

      //   You can change these later in your profile!
      //   `,
      //   components: [rowNameDisplay, rowSpecies, rowClass, rowGuild, rowStartProfile],
      //   color: Colors.Green,
      // },
      town: {
        title: 'Town',
        description: stripIndents`
        You are in TripTown, a new town on the edge of Triptopia, the TripSit Kingdom.

        Besides for a few buildings, the town is still under construction.

        You can help rebuild the town by doing a quest, clearing a dungeon, or going on a raid.

        What would you like to do?`,
        components: [rowTown],
        color: Colors.Green,
      },
      work: {
        title: 'Work',
        description: stripIndents`
          You are at work, you can go on a quest, clear a dungeon, or go on a raid.
        `,
        components: [rowWork],
        color: Colors.Green,
      },
      // shop: {
      //   title: 'Shop',
      //   description: stripIndents`
      //     You are in the shop, you can buy some items to help you on your journey.
      //   `,
      //   components: [rowItems, rowBackground, rowBorder, rowShop],
      //   color: Colors.Green,
      // },
      // games: {
      //   title: 'Games',
      //   description: stripIndents`
      //     You are playing some games, you can play some dice, flip a coin, or play some roulette.
      //   `,
      //   components: [rowGames],
      //   color: Colors.Green,
      // },
      // profile: {
      //   title: 'Profile',
      //   description: stripIndents`
      //     You are in your profile, you can change your name, species, class and here.
      //   `,
      //   components: [rowProfile],
      //   color: Colors.Green,
      // },
      questSuccess: {
        title: 'Quest',
        description: stripIndents`
          You went on a quest to clean up TripTown and gained 1 TripCoin!
        `,
        components: [rowWork],
        color: Colors.Green,
      },
      questFail: {
        title: 'Quest',
        description: stripIndents`
          It's been less than an hour since you last went on a quest, you're too tired to work.
        `,
        components: [rowWork],
        color: '#ff0000',
      },
      dungeonSuccess: {
        title: 'Dungeon',
        description: stripIndents`
          You cleared a dungeon and gained 10 TripCoins!
        `,
        components: [rowWork],
        color: Colors.Green,
      },
      dungeonFail: {
        title: 'Dungeon',
        description: stripIndents`
          It's been less than 24 hours since you last cleared a dungeon, you still need to prepare.
        `,
        components: [rowWork],
        color: '#ff0000',
      },
      raidSuccess: {
        title: 'Raid',
        description: stripIndents`
          You stormed into Moonbear's office, russled their jimmies and stole 50 TripCoins!
        `,
        components: [rowWork],
        color: Colors.Green,
      },
      raidFail: {
        title: 'Raid',
        description: stripIndents`
          It's been less than 7 days since you last raided Moonbear's office, give them a break!
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
      // inventory: {
      //   title: 'Inventory',
      //   description: stripIndents`
      //     You are looking at your inventory, you can equip items or unequip items.
      //   `,
      //   components: [rowProfile],
      //   color: Colors.Green,
      // },
      // stats: {
      //   title: 'Stats',
      //   description: stripIndents`
      //     You are looking at your stats, you can change your species or class here.
      //   `,
      //   components: [rowProfile],
      //   color: Colors.Green,
      // },
      // guild: {
      //   title: 'Guild',
      //   description: stripIndents`
      //     You are looking at your guild, you can join a guild or leave your guild.
      //   `,
      //   components: [rowProfile],
      //   color: Colors.Green,
      // },
    } as RpgStates;

    let [personaData] = await getPersonaInfo(interaction.user.id);

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'quest') {
      const result = await rpgQuest(interaction);
      const unlockTime = new Date(personaData.last_quest
        ? personaData.last_quest.getTime() + intervalQuest
        : new Date().getTime() + intervalQuest);
      if (result.success) {
        const embed = embedTemplate()
          .setTitle(states.questSuccess.title)
          .setDescription(stripIndents`${states.questSuccess.description}
        You now have ${result.total} TT$
        You can try again ${time(unlockTime, 'R')}`)
          .setColor(states.questSuccess.color);
        await interaction.reply({ embeds: [embed], ephemeral: true });
      } else {
        const embed = embedTemplate()
          .setTitle(states.questFail.title)
          .setDescription(stripIndents`${states.questFail.description}
          You can try again ${time(unlockTime, 'R')}`)
          .setColor(states.questFail.color);
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
      return true;
    }
    if (subcommand === 'dungeon') {
      const result = await rpgDungeon(interaction);
      const unlockTime = new Date(personaData.last_quest
        ? personaData.last_quest.getTime() + intervalQuest
        : new Date().getTime() + intervalQuest);
      if (result.success) {
        const embed = embedTemplate()
          .setTitle(states.questSuccess.title)
          .setDescription(stripIndents`${states.questSuccess.description}
        You now have ${result.total} TT$
        You can try again ${time(unlockTime, 'R')}`)
          .setColor(states.questSuccess.color);
        await interaction.reply({ embeds: [embed], ephemeral: true });
      } else {
        const embed = embedTemplate()
          .setTitle(states.questFail.title)
          .setDescription(stripIndents`${states.questFail.description}
          You can try again ${time(unlockTime, 'R')}`)
          .setColor(states.questFail.color);
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
      return true;
    }
    if (subcommand === 'raid') {
      const result = await rpgRaid(interaction);
      const unlockTime = new Date(personaData.last_quest
        ? personaData.last_quest.getTime() + intervalQuest
        : new Date().getTime() + intervalQuest);
      if (result.success) {
        const embed = embedTemplate()
          .setTitle(states.questSuccess.title)
          .setDescription(stripIndents`${states.questSuccess.description}
        You now have ${result.total} TT$
        You can try again ${time(unlockTime, 'R')}
        `)
          .setColor(states.questSuccess.color);
        await interaction.reply({ embeds: [embed], ephemeral: true });
      } else {
        const embed = embedTemplate()
          .setTitle(states.questFail.title)
          .setDescription(stripIndents`${states.questFail.description}
          You can try again ${time(unlockTime, 'R')}`)
          .setColor(states.questFail.color);
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
      return true;
    }

    // const selectClass = new StringSelectMenuBuilder()
    //   .setCustomId('rpgClass')
    //   .setPlaceholder('Select a class')
    //   .addOptions(Object.values({ ...classDef }));

    // const rowClass = new ActionRowBuilder<StringSelectMenuBuilder>()
    //   .addComponents(selectClass);

    // const displayName = new StringSelectMenuBuilder()
    //   .setCustomId('rpgNameDisplay')
    //   .setPlaceholder('No Name!')
    //   .setOptions([{
    //     label: 'No Name',
    //     value: 'nameless',
    //     emoji: '👤',
    //     default: true,
    //   }]);

    // const rowNameDisplay = new ActionRowBuilder<StringSelectMenuBuilder>()
    //   .addComponents(displayName);

    // const selectSpecies = new StringSelectMenuBuilder()
    //   .setCustomId('rpgSpecies')
    //   .setPlaceholder('Select a species')
    //   .addOptions(Object.values({ ...speciesDef }));

    // const rowSpecies = new ActionRowBuilder<StringSelectMenuBuilder>()
    //   .addComponents(selectSpecies);

    // const selectGuild = new StringSelectMenuBuilder()
    //   .setCustomId('rpgGuild')
    //   .setPlaceholder('Select a guild')
    //   .addOptions(Object.values({ ...guildDef }));

    // const rowGuild = new ActionRowBuilder<StringSelectMenuBuilder>()
    //   .addComponents(selectGuild);

    log.debug(F, `Persona data: ${JSON.stringify(personaData, null, 2)}`);

    const message = await interaction.reply({ embeds: [embedTemplate().setTitle('Loading...')] });

    // const embedStart = embedTemplate()
    //   .setTitle(states.setup.title)
    //   .setDescription(states.setup.description)
    //   .setColor(states.setup.color);

    const embedTown = embedTemplate()
      .setTitle(states.town.title)
      .setDescription(states.town.description)
      .setColor(states.town.color);

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

    await interaction.editReply({ embeds: [embedTown], components: states.town.components });

    // Create a collector that will listen for the user to respond to the setup
    const filter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id;
    const collector = message.createMessageComponentCollector({ filter, time: 0 });

    collector.on('collect', async (i: MessageComponentInteraction) => {
      if (i.customId === 'rpgTown') {
        // The user has clicked the town button, send them the town embed
        const embed = embedTemplate()
          .setTitle(states.town.title)
          .setDescription(states.town.description)
          .setColor(states.town.color);
        await i.update({ embeds: [embed], components: states.town.components });
      } else if (i.customId === 'rpgWork') {
        // The user has clicked the work button, send them the work embed
        const embed = embedTemplate()
          .setTitle(states.work.title)
          .setDescription(states.work.description)
          .setColor(states.work.color);
        await i.update({ embeds: [embed], components: states.work.components });
      } else if (i.customId === 'rpgQuest') {
        const result = await rpgQuest(i);
        if (result) {
          const embed = embedTemplate()
            .setTitle(states.questSuccess.title)
            .setDescription(stripIndents`${states.questSuccess.description}
          You now have ${personaData.tokens} TT$`)
            .setColor(states.questSuccess.color);
          await i.update({ embeds: [embed], components: states.questSuccess.components });
        } else {
          const unlockTime = new Date(personaData.last_quest
            ? personaData.last_quest.getTime() + intervalQuest
            : new Date().getTime() + intervalQuest);
          const embed = embedTemplate()
            .setTitle(states.questFail.title)
            .setDescription(stripIndents`${states.questFail.description}
            You can try again ${time(unlockTime, 'R')}`)
            .setColor(states.questFail.color);
          await i.update({ embeds: [embed], components: states.questFail.components });
        }
      } else if (i.customId === 'rpgDungeon') {
        const result = await rpgDungeon(i);
        if (result) {
          const embed = embedTemplate()
            .setTitle(states.dungeonSuccess.title)
            .setDescription(stripIndents`${states.dungeonSuccess.description}
          You now have ${result.total} TT$`)
            .setColor(states.dungeonSuccess.color);
          await i.update({ embeds: [embed], components: states.dungeonSuccess.components });
        } else {
          const unlockTime = new Date(personaData.last_dungeon
            ? personaData.last_dungeon.getTime() + intervalQuest
            : new Date().getTime() + intervalDungeon);
          const embed = embedTemplate()
            .setTitle(states.dungeonFail.title)
            .setDescription(stripIndents`${states.dungeonFail.description}
            You can try again ${time(unlockTime, 'R')}`)
            .setColor(states.dungeonFail.color);
          await i.update({ embeds: [embed], components: states.dungeonFail.components });
        }
      } else if (i.customId === 'rpgRaid') {
        const result = await rpgDungeon(i);
        if (result) {
          const embed = embedTemplate()
            .setTitle(states.raidSuccess.title)
            .setDescription(stripIndents`${states.raidSuccess.description}
          You now have ${personaData.tokens} TT$`)
            .setColor(states.raidSuccess.color);
          await i.update({ embeds: [embed], components: states.raidSuccess.components });
        } else {
          const unlockTime = new Date(personaData.last_raid
            ? personaData.last_raid.getTime() + intervalQuest
            : new Date().getTime() + intervalDungeon);
          const embed = embedTemplate()
            .setTitle(states.raidFail.title)
            .setDescription(stripIndents`${states.raidFail.description}
            You can try again ${time(unlockTime, 'R')}`)
            .setColor(states.raidFail.color);
          await i.update({ embeds: [embed], components: states.raidFail.components });
        }
      }
      //  else if (i.customId === 'rpgGames') {
      //   // The user has clicked the games button, send them the games embed
      //   const embed = embedTemplate()
      //     .setTitle(states.games.title)
      //     .setDescription(states.games.description)
      //     .setColor(states.games.color);
      //   await i.update({ embeds: [embed], components: states.games.components });
      // }
      //  else if (i.customId === 'rpgShop') {
      //   // The user has clicked the shop button, send them the shop embed
      //   const embed = embedTemplate()
      //     .setTitle(states.shop.title)
      //     .setDescription(states.shop.description)
      //     .setColor(states.shop.color);
      //   await i.update({ embeds: [embed], components: states.shop.components });
      // }
      //  else if (i.customId === 'rpgProfile') {
      //   log.debug(F, `Persona data: ${JSON.stringify(personaData, null, 2)}`);
      //   log.debug(F, `speciesDef: ${JSON.stringify(speciesDef, null, 2)}`);

      //   displayName.setOptions([{
      //     label: personaData.name,
      //     value: personaData.name,
      //     emoji: '👤',
      //     default: true,
      //   }]);
      //   // log.debug(F, `displayName: ${JSON.stringify(displayName, null, 2)}`);

      //   const rowChangeNameDisplay = new ActionRowBuilder<StringSelectMenuBuilder>()
      //     .setComponents(displayName);

      //   // log.debug(F, `classDef: ${JSON.stringify(classDef, null, 2)}`);
      //   const selectedClassList = { ...classDef };
      //   // log.debug(F, `selectedClassList1: ${JSON.stringify(selectedClassList, null, 2)}`);
      //   selectedClassList[personaData.class as keyof typeof selectedClassList].default = true;
      //   // log.debug(F, `selectedClassList2: ${JSON.stringify(selectedClassList, null, 2)}`);

      //   const rowChangeClass = new ActionRowBuilder<StringSelectMenuBuilder>()
      //     .addComponents(new StringSelectMenuBuilder()
      //       .setCustomId('rpgClass')
      //       .setPlaceholder('Select a class')
      //       .setOptions(Object.values({ ...selectedClassList })));

      //   log.debug(F, `speciesDef: ${JSON.stringify(speciesDef, null, 2)}`);
      //   const selectedSpeciesList = { ...speciesDef };
      //   log.debug(F, `selectedSpeciesList1: ${JSON.stringify(selectedSpeciesList, null, 2)}`);
      //   selectedSpeciesList[personaData.species as keyof typeof selectedSpeciesList].default = true;
      //   log.debug(F, `selectedSpeciesList2: ${JSON.stringify(selectedSpeciesList, null, 2)}`);
      //   log.debug(F, `speciesDef2: ${JSON.stringify(speciesDef, null, 2)}`);

      //   const rowChangeSpecies = new ActionRowBuilder<StringSelectMenuBuilder>()
      //     .addComponents(new StringSelectMenuBuilder()
      //       .setCustomId('rpgSpecies')
      //       .setPlaceholder('Select a species')
      //       .setOptions(Object.values({ ...selectedSpeciesList })));

      //   const selectedGuildList = { ...guildDef };
      //   selectedGuildList[personaData.guild as keyof typeof selectedGuildList].default = true;
      //   // log.debug(F, `Selected guild list: ${JSON.stringify(selectedGuildList, null, 2)}`);

      //   const rowChangeGuild = new ActionRowBuilder<StringSelectMenuBuilder>()
      //     .addComponents(new StringSelectMenuBuilder()
      //       .setCustomId('rpgGuild')
      //       .setPlaceholder('Select a guild')
      //       .setOptions(Object.values(selectedGuildList)));

      //   // The user has clicked the profile button, send them the profile embed
      //   const embed = embedTemplate()
      //     .setTitle(states.profile.title)
      //     .setDescription(states.profile.description)
      //     .setColor(states.profile.color);
      //   await i.update({ embeds: [embed],
      // components: [rowChangeNameDisplay, rowChangeSpecies, rowChangeClass, rowChangeGuild, rowProfile] });
      // } else if (i.customId === 'rpgSpecies') {
      //   const [choice] = (i as StringSelectMenuInteraction).values;
      //   log.debug(F, `species choice: ${choice}`);

      //   selectSpecies.setOptions([
      //     {
      //       label: { ...speciesDef }[choice as keyof typeof speciesDef].label,
      //       value: { ...speciesDef }[choice as keyof typeof speciesDef].value,
      //       description: { ...speciesDef }[choice as keyof typeof speciesDef].description,
      //       emoji: { ...speciesDef }[choice as keyof typeof speciesDef].emoji,
      //       default: true,
      //     },
      //   ]);

      //   // selectSpecies.addOptions(Object.values(speciesDef).filter(s => s.value !== choice));

      //   if (!personaData) {
      //     i.update({
      //       embeds: [embedStart],
      //       components: [rowNameDisplay, rowSpecies, rowClass, rowGuild, rowStartProfile],
      //     });
      //   } else {
      //     i.update({
      //       embeds: [embedTown],
      //       components: [rowNameDisplay, rowSpecies, rowClass, rowGuild, rowProfile],
      //     });
      //   }
      // } else if (i.customId === 'rpgClass') {
      //   const [choice] = (i as StringSelectMenuInteraction).values;
      //   log.debug(F, `class: ${choice}`);
      //   selectClass.setOptions([
      //     {
      //       label: classDef[choice as keyof typeof classDef].label,
      //       value: classDef[choice as keyof typeof classDef].value,
      //       description: classDef[choice as keyof typeof classDef].description,
      //       emoji: classDef[choice as keyof typeof classDef].emoji,
      //       default: true,
      //     },
      //   ]);

      //   selectSpecies.addOptions(Object.values(classDef).filter(s => s.value !== choice));

      //   if (!personaData) {
      //     i.update({
      //       embeds: [embedStart],
      //       components: [rowNameDisplay, rowSpecies, rowClass, rowGuild, rowStartProfile],
      //     });
      //   } else {
      //     i.update({
      //       embeds: [embedTown],
      //       components: [rowNameDisplay, rowSpecies, rowClass, rowGuild, rowProfile],
      //     });
      //   }
      // } else if (i.customId === 'rpgGuild') {
      //   const [choice] = (i as StringSelectMenuInteraction).values;
      //   log.debug(F, `guild: ${choice}`);
      //   selectGuild.setOptions([
      //     {
      //       label: guildDef[choice as keyof typeof guildDef].label,
      //       value: guildDef[choice as keyof typeof guildDef].value,
      //       description: guildDef[choice as keyof typeof guildDef].description,
      //       emoji: guildDef[choice as keyof typeof guildDef].emoji,
      //       default: true,
      //     },
      //   ]);

      //   // selectSpecies.addOptions(Object.values(guildDef).filter(s => s.value !== choice));

      //   if (!personaData) {
      //     i.update({
      //       embeds: [embedStart],
      //       components: [rowNameDisplay, rowSpecies, rowClass, rowGuild, rowStartProfile],
      //     });
      //   } else {
      //     i.update({
      //       embeds: [embedTown],
      //       components: [rowNameDisplay, rowSpecies, rowClass, rowGuild, rowProfile],
      //     });
      //   }
      // } else if (i.customId === 'rpgName') {
      //   // When this button is clicked, a modal appears where the user can enter their name
      //   // Create the modal
      //   const modal = new ModalBuilder()
      //     .setCustomId(`rpgNameModal~${i.id}`)
      //     .setTitle('Setup your TripSit room!');

      //   const body = new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
      //     .setLabel('What do you want to name your persona?')
      //     .setStyle(TextInputStyle.Short)
      //     .setRequired(true)
      //     .setCustomId('rpgNewName'));
      //   modal.addComponents([body]);
      //   await i.showModal(modal);

      //   // Collect a modal submit interaction
      //   const modalFilter = (mi:ModalSubmitInteraction) => mi.customId.startsWith('rpgNameModal');
      //   await i.awaitModalSubmit({ filter: modalFilter, time: 0 })
      //     .then(async mi => {
      //       if (mi.customId.split('~')[1] !== i.id) return;
      //       if (!mi.guild) return;

      //       const choice = mi.fields.getTextInputValue('rpgNewName');

      //       log.debug(F, `name: ${choice}`);

      //       displayName.setOptions([{
      //         label: choice,
      //         value: choice,
      //         emoji: '👤',
      //         default: true,
      //       }]);

      //       await mi.reply({ content: `Your name has been set to ${choice}`, ephemeral: true });

      //       if (!personaData) {
      //         i.editReply({
      //           embeds: [embedStart],
      //           components: [rowNameDisplay, rowSpecies, rowClass, rowGuild, rowStartProfile],
      //         });
      //       } else {
      //         const rowChangeNameDisplay = new ActionRowBuilder<StringSelectMenuBuilder>()
      //           .addComponents(displayName);

      //         const selectedClassList = { ...classDef };
      //         selectedClassList[personaData.class as keyof typeof selectedClassList].default = true;

      //         const selectedSpeciesList = { ...speciesDef };
      //         selectedSpeciesList[personaData.species as keyof typeof selectedSpeciesList].default = true;

      //         const selectedGuildList = { ...guildDef };
      //         selectedGuildList[personaData.guild as keyof typeof selectedGuildList].default = true;

      //         const rowChangeClass = new ActionRowBuilder<StringSelectMenuBuilder>()
      //           .addComponents(new StringSelectMenuBuilder()
      //             .setCustomId('rpgClass')
      //             .setPlaceholder('Select a class')
      //             .addOptions(Object.values(selectedClassList)));

      //         const rowChangeSpecies = new ActionRowBuilder<StringSelectMenuBuilder>()
      //           .addComponents(new StringSelectMenuBuilder()
      //             .setCustomId('rpgSpecies')
      //             .setPlaceholder('Select a species')
      //             .addOptions(Object.values(selectedSpeciesList)));

      //         const rowChangeGuild = new ActionRowBuilder<StringSelectMenuBuilder>()
      //           .addComponents(new StringSelectMenuBuilder()
      //             .setCustomId('rpgGuild')
      //             .setPlaceholder('Select a guild')
      //             .addOptions(Object.values(selectedGuildList)));

      //         // The user has clicked the profile button, send them the profile embed
      //         const embed = embedTemplate()
      //           .setTitle(states.profile.title)
      //           .setDescription(states.profile.description)
      //           .setColor(states.profile.color);

      //         i.editReply({
      //           embeds: [embed],
      //           components: [rowChangeNameDisplay, rowChangeSpecies, rowChangeClass, rowChangeGuild, rowProfile],
      //         });
      //       }
      //     });
      // } else if (i.customId === 'rpgAccept') {
      //   // If the user confirms the information, save the persona information

      //   const nameComponent = i.message.components[0].components[0];
      //   const selectedName = (nameComponent as StringSelectMenuComponent).options.find(
      //  (o:APISelectMenuOption) => o.default === true);
      //   const speciesComponent = i.message.components[1].components[0];
      //   const selectedSpecies = (speciesComponent as StringSelectMenuComponent).options.find(
      // (o:APISelectMenuOption) => o.default === true);
      //   const classComponent = i.message.components[2].components[0];
      //   const selectedClass = (classComponent as StringSelectMenuComponent).options.find(
      // (o:APISelectMenuOption) => o.default === true);
      //   const guildComponent = i.message.components[3].components[0];
      //   const selectedGuild = (guildComponent as StringSelectMenuComponent).options.find(
      // (o:APISelectMenuOption) => o.default === true);

      //   log.debug(F, `selectedName: ${JSON.stringify(selectedName, null, 2)}`);
      //   log.debug(F, `selectedSpecies: ${JSON.stringify(selectedSpecies, null, 2)}`);
      //   log.debug(F, `selectedClass: ${JSON.stringify(selectedClass, null, 2)}`);
      //   log.debug(F, `selectedGuild: ${JSON.stringify(selectedGuild, null, 2)}`);

      //   personaData = {
      //     discordId: i.user.id,
      //     name: selectedName?.label ?? 'No Name',
      //     species: selectedSpecies?.value ?? 'formless',
      //     class: selectedClass?.value ?? 'jobless',
      //     guild: selectedGuild?.value ?? 'guildless',
      //     tokens: 0,
      //   } as Persona;

      //   log.debug(F, `Setting Persona data: ${JSON.stringify(personaData, null, 2)}`);

      //   await personaSet(personaData);

      //   await i.update({ embeds: [embedTown], components: states.town.components });
      //   log.debug(F, `spciesDef: ${JSON.stringify(speciesDef, null, 2)}`);
      // }
    });

    return true;
  },
};

export async function rpgQuest(
  interaction: MessageComponentInteraction | ChatInputCommandInteraction,
):Promise<{
    success: boolean,
    total: number,
  }> {
  // Check if the user has a persona
  const [personaData] = await getPersonaInfo(interaction.user.id);

  if (personaData.last_quest
    && personaData.last_quest.getTime() + intervalQuest > new Date().getTime()) {
    return {
      success: false,
      total: personaData.tokens,
    };
  }

  // Award the user coins
  personaData.tokens += 1;
  personaData.last_quest = new Date();
  await setPersonaInfo(personaData);

  return {
    success: true,
    total: personaData.tokens,
  };
}

export async function rpgDungeon(
  interaction: MessageComponentInteraction | ChatInputCommandInteraction,
):Promise<{
    success: boolean,
    total: number,
  }> {
  // Check if the user has a persona
  const [personaData] = await getPersonaInfo(interaction.user.id);

  if (personaData.last_dungeon
    && personaData.last_dungeon.getTime() + intervalDungeon > new Date().getTime()) {
    return {
      success: false,
      total: personaData.tokens,
    };
  }

  // Award the user coins
  personaData.tokens += 10;
  personaData.last_dungeon = new Date();
  await setPersonaInfo(personaData);

  return {
    success: true,
    total: personaData.tokens,
  };
}

export async function rpgRaid(
  interaction: MessageComponentInteraction | ChatInputCommandInteraction,
):Promise<{
    success: boolean,
    total: number,
  }> {
  // Check if the user has a persona
  const [personaData] = await getPersonaInfo(interaction.user.id);

  if (personaData.last_raid
    && personaData.last_raid.getTime() + intervalRaid > new Date().getTime()) {
    return {
      success: false,
      total: personaData.tokens,
    };
  }

  // Award the user coins
  personaData.tokens += 50;
  personaData.last_raid = new Date();
  await setPersonaInfo(personaData);

  return {
    success: true,
    total: personaData.tokens,
  };
}
