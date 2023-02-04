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
} from 'discord.js';
import {
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
    backgroundA: {
      label: 'BackgroundA',
      value: 'backgrounda',
      description: 'Cool new pattern!',
      quantity: 1,
      weight: 0,
      cost: 100,
      equipped: true,
      consumable: false,
      effect: 'background',
      effect_value: 'patternA',
      emoji: '🧪',
    },
    backgroundB: {
      label: 'BackgroundB',
      value: 'backgroundb',
      description: 'Cool new pattern!',
      quantity: 1,
      weight: 0,
      cost: 100,
      equipped: true,
      consumable: false,
      effect: 'background',
      effect_value: 'patternB',
      emoji: '🧪',
    },
  },
  borders: {
    borderA: {
      label: 'BorderA',
      value: 'bordera',
      description: 'Cool new border!',
      quantity: 1,
      weight: 0,
      cost: 100,
      equipped: true,
      consumable: false,
      effect: 'border',
      effect_value: 'borderA',
      emoji: '🧪',
    },
    borderB: {
      label: 'BorderB',
      value: 'borderb',
      description: 'Cool new border!',
      quantity: 1,
      weight: 0,
      cost: 100,
      equipped: true,
      consumable: false,
      effect: 'border',
      effect_value: 'borderB',
      emoji: '🧪',
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
    .addSubcommand(subcommand => subcommand
      .setName('shop')
      .setDescription('Go to the Shop!'))
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
      You are in TripTown, a new town on the edge of Triptopia, the TripSit Kingdom.
  
      Besides for a few buildings, the town is still under construction.
  
      You can help rebuild the town by doing a quest, clearing a dungeon, or going on a raid.
  
      What would you like to do?`)
      .setColor(Colors.Green)],
    components: [rowTown],
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

  // Filter inventoryData to find items with the 'tokenMultiplier' effect
  const tokenMultipliers = inventoryData.filter(item => item.effect === 'tokenMultiplier');
  log.debug(F, `tokenMultipliers: ${JSON.stringify(tokenMultipliers, null, 2)}`);

  // Calculate the total multiplier
  const tokenMultiplier = tokenMultipliers.reduce((acc, item) => acc + parseFloat(item.effect_value), 0);
  log.debug(F, `tokenMultiplier: ${tokenMultiplier}`);

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
        description: stripIndents`You went on a quest to clean up TripTown and gained {tokens} TripTokens!`,
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
        description: stripIndents`
          You cleared a dungeon and gained {tokens} TripTokens!
        `,
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
    if (command === 'dungeon') {
      tokens = 50;
    } else if (command === 'raid') {
      tokens = 100;
    }

    tokens *= 1 + tokenMultiplier;

    if (env.NODE_ENV === 'development') {
      tokens *= 10;
    }

    // Round tokens to the nearest integer
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
  // Check get fresh persona data
  const [personaData] = await getPersonaInfo(interaction.user.id);

  // Get the existing inventory data
  const inventoryData = await inventoryGet(personaData.id);
  log.debug(F, `Persona inventory: ${JSON.stringify(inventoryData, null, 2)}`);

  // Get a string display of the user's inventory
  const inventoryList = inventoryData.map(item => `**${item.label}** - ${item.description}`).join('\n');
  const inventoryString = stripIndents`
  **Inventory**
  ${inventoryList}
  `;

  // Go through items.general and create a new object of items that the user doesnt have yet
  let generalOptions = Object.values(items.general)
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
    }) as SelectMenuComponentOptionData[];
  generalOptions = generalOptions.filter(item => item !== null);
  log.debug(F, `generalOptions: ${JSON.stringify(generalOptions, null, 2)}`);

  if (generalOptions.length === 0) {
    const rowShop = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        buttons.town,
      );
    return {
      embeds: [embedTemplate()
        .setTitle('Shop')
        .setDescription(stripIndents`
        You are in the shop, you can buy some items to help you on your journey.

        You currently have **${personaData.tokens}** TripTokens.
      ${inventoryData.length > 0 ? inventoryString : ''}`)
        .setColor(Colors.Green)],
      components: [rowShop],
    };
  }

  menus.item.setOptions(generalOptions);
  const rowItems = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(menus.item);

  const rowShop = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      buttons.town,
    );

  // The user has clicked the shop button, send them the shop embed
  return {
    embeds: [embedTemplate()
      .setTitle('Shop')
      .setDescription(stripIndents`
      You are in the shop, you can buy some items to help you on your journey.

      You currently have **${personaData.tokens}** TripTokens.
    ${inventoryData.length > 0 ? inventoryString : ''}`)
      .setColor(Colors.Green)],
    components: [rowItems, rowShop],
  };
}

export async function rpgShopChange(
  interaction:MessageComponentInteraction,
):Promise<InteractionUpdateOptions> {
  // Check get fresh persona data
  const [personaData] = await getPersonaInfo(interaction.user.id);
  log.debug(F, `personaData: ${JSON.stringify(personaData, null, 2)}`);

  // Get the existing inventory data
  const personaInventory = await inventoryGet(personaData.id);
  log.debug(F, `Persona inventory: ${JSON.stringify(personaInventory, null, 2)}`);

  const [choice] = (interaction as StringSelectMenuInteraction).values;
  log.debug(F, `choice: ${choice}`);

  // Get a string display of the user's inventory
  const inventoryList = personaInventory.map(item => `**${item.label}** - ${item.description}`).join('\n');
  const inventoryString = stripIndents`
    **Inventory**
    ${inventoryList}
    `;

  // Get a list of items.general where the value does not equal the choice
  const filteredItems = Object.values(items.general).filter(item => item.value !== choice);

  const generalOptions = Object.values(filteredItems).map(item => {
    if (item.value !== choice) {
      return {
        label: `${item.label} - ${item.cost} TT$`,
        value: item.value,
        description: `${item.description} - ${item.cost} TT$`,
        emoji: item.emoji,
      };
    }
    return null;
  }) as SelectMenuComponentOptionData[];

  menus.item.setOptions(generalOptions);
  menus.item.addOptions([
    {
      label: `${{ ...items.general }[choice as keyof typeof items.general].label} - ${items.general[choice as keyof typeof items.general].cost} TT$`,
      value: { ...items.general }[choice as keyof typeof items.general].value,
      description: `${{ ...items.general }[choice as keyof typeof items.general].description} - ${items.general[choice as keyof typeof items.general].cost} TT$`,
      emoji: { ...items.general }[choice as keyof typeof items.general].emoji,
      default: true,
    },
  ]);

  const rowItems = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(menus.item);

  buttons.buy.setLabel(`Buy ${items.general[choice as keyof typeof items.general].label} for ${items.general[choice as keyof typeof items.general].cost} TT$`);
  const rowShop = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      buttons.town,
      buttons.buy,
    );

  // selectSpecies.addOptions(Object.values(speciesDef).filter(s => s.value !== choice));

  return {
    embeds: [embedTemplate()
      .setTitle('Shop')
      .setDescription(stripIndents`
      You are in the shop, you can buy some items to help you on your journey.

      You currently have **${personaData.tokens}** TripTokens.
    ${personaInventory.length > 0 ? inventoryString : ''}`)
      .setColor(Colors.Green)],
    components: [rowItems, rowShop],
  };
}

export async function rpgShopAccept(
  interaction:MessageComponentInteraction,
):Promise<InteractionUpdateOptions> {
  // Check get fresh persona data
  const [personaData] = await getPersonaInfo(interaction.user.id);
  log.debug(F, `personaData: ${JSON.stringify(personaData, null, 2)}`);

  // Get the existing inventory data
  const personaInventory = await inventoryGet(personaData.id);
  log.debug(F, `Persona inventory: ${JSON.stringify(personaInventory, null, 2)}`);

  // Get a string display of the user's inventory
  let inventoryList = personaInventory.map(item => `**${item.label}** - ${item.description}`).join('\n');
  let inventoryString = stripIndents`
      **Inventory**
      ${inventoryList}
      `;

  // Message
  // row 1: select menu
  // row 2: buy button, town button

  // If the user confirms the information, save the persona information
  const itemComponent = interaction.message.components[0].components[0];
  const selectedItem = (itemComponent as StringSelectMenuComponent).options.find(
    (o:APISelectMenuOption) => o.default === true,
  );
  log.debug(F, `selectedItem: ${JSON.stringify(selectedItem, null, 2)}`);

  const itemData = items.general[selectedItem?.value as keyof typeof items.general];
  log.debug(F, `itemData: ${JSON.stringify(itemData, null, 2)}`);

  // Check if the user already has this item
  const existingItem = personaInventory.find(item => item.label === itemData.label);
  if (existingItem) {
  // Go through items.general and create a new object of items that the user doesnt have yet
    // Get a list of items.general where the value does not equal the choice
    const filteredItems = Object.values(items.general).filter(item => item.value !== selectedItem?.value);

    let generalOptions = Object.values(filteredItems)
      .map(item => {
        if (!personaInventory.find(i => i.value === item.value)) {
          return {
            label: `${item.label} - ${item.cost} TT$`,
            value: item.value,
            description: `${item.description} - ${item.cost} TT$`,
            emoji: item.emoji,
          };
        }
        return null;
      }) as SelectMenuComponentOptionData[];
    generalOptions = generalOptions.filter(item => item !== null);
    log.debug(F, `generalOptions: ${JSON.stringify(generalOptions, null, 2)}`);

    if (generalOptions.length === 0) {
      const rowShop = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          buttons.town,
        );
      return {
        embeds: [embedTemplate()
          .setTitle('Shop')
          .setDescription(stripIndents`
          You are in the shop, you can buy some items to help you on your journey.

          You currently have **${personaData.tokens}** TripTokens.
        ${personaInventory.length > 0 ? inventoryString : ''}`)
          .setColor(Colors.Green)],
        components: [rowShop],
      };
    }

    menus.item.setOptions(generalOptions);
    const choice = selectedItem?.value;
    menus.item.addOptions([
      {
        label: `${{ ...items.general }[choice as keyof typeof items.general].label} - ${items.general[choice as keyof typeof items.general].cost} TT$`,
        value: { ...items.general }[choice as keyof typeof items.general].value,
        description: `${{ ...items.general }[choice as keyof typeof items.general].description} - ${items.general[choice as keyof typeof items.general].cost} TT$`,
        emoji: { ...items.general }[choice as keyof typeof items.general].emoji,
        default: true,
      },
    ]);

    const rowItems = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(menus.item);

    buttons.buy.setLabel(`Buy ${items.general[selectedItem?.value as keyof typeof items.general].label} for ${items.general[selectedItem?.value as keyof typeof items.general].cost} TT$`);

    const rowShop = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        buttons.town,
        buttons.buy,
      );

    return {
      embeds: [embedTemplate()
        .setTitle('Shop')
        .setDescription(stripIndents`
        **You already have this item!**
  
        You are in the shop, you can buy some items to help you on your journey.
  
        You currently have **${personaData.tokens}** TripTokens.
      ${personaInventory.length > 0 ? inventoryString : ''}`)
        .setColor(Colors.Red)],
      components: [rowItems, rowShop],
    };
  }

  // Check if the user has enough tokens to buy the item
  if (personaData.tokens < itemData.cost) {
    log.debug(F, 'Not enough tokens to buy item');
    // Get a list of items.general where the value does not equal the choice
    // const filteredItems = Object.values(items.general).filter(item => item.value !== selectedItem?.value);

    let generalOptions = Object.values(items.general)
      .map(item => {
        if (!personaInventory.find(i => i.value === item.value)) {
          return {
            label: `${item.label} - ${item.cost} TT$`,
            value: item.value,
            description: `${item.description} - ${item.cost} TT$`,
            emoji: item.emoji,
          };
        }
        return null;
      }) as SelectMenuComponentOptionData[];
    generalOptions = generalOptions.filter(item => item !== null);
    log.debug(F, `generalOptions (not enough tokens): ${JSON.stringify(generalOptions, null, 2)}`);

    if (generalOptions.length === 0) {
      const rowShop = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          buttons.town,
        );
      return {
        embeds: [embedTemplate()
          .setTitle('Shop')
          .setDescription(stripIndents`
          **You do not have enough TripTokens to buy this item.**

          You currently have **${personaData.tokens}** TripTokens.
        ${personaInventory.length > 0 ? inventoryString : ''}`)
          .setColor(Colors.Red)],
        components: [rowShop],
      };
    }

    if (generalOptions.length > 1) {
      const choice = selectedItem?.value;
      const filteredItems = Object.values(items.general).filter(item => item.value !== choice);
      menus.item.setOptions(filteredItems);
      menus.item.addOptions([
        {
          label: `${{ ...items.general }[choice as keyof typeof items.general].label} - ${items.general[choice as keyof typeof items.general].cost} TT$`,
          value: { ...items.general }[choice as keyof typeof items.general].value,
          description: `${{ ...items.general }[choice as keyof typeof items.general].description} - ${items.general[choice as keyof typeof items.general].cost} TT$`,
          emoji: { ...items.general }[choice as keyof typeof items.general].emoji,
          default: true,
        },
      ]);
    } else {
      const choice = selectedItem?.value;
      menus.item.setOptions([
        {
          label: `${{ ...items.general }[choice as keyof typeof items.general].label} - ${items.general[choice as keyof typeof items.general].cost} TT$`,
          value: { ...items.general }[choice as keyof typeof items.general].value,
          description: `${{ ...items.general }[choice as keyof typeof items.general].description} - ${items.general[choice as keyof typeof items.general].cost} TT$`,
          emoji: { ...items.general }[choice as keyof typeof items.general].emoji,
          default: true,
        },
      ]);
    }

    const rowItems = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(menus.item);

    buttons.buy.setLabel(`Buy ${items.general[selectedItem?.value as keyof typeof items.general].label} for ${items.general[selectedItem?.value as keyof typeof items.general].cost} TT$`);

    const rowShop = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        buttons.town,
        buttons.buy,
      );

    return {
      embeds: [embedTemplate()
        .setTitle('Shop')
        .setDescription(stripIndents`
      **You do not have enough TripTokens to buy this item.**

      You are in the shop, you can buy some items to help you on your journey.

      You currently have **${personaData.tokens}** TripTokens.
    ${personaInventory.length > 0 ? inventoryString : ''}`)
        .setColor(Colors.Red)],
      components: [rowItems, rowShop],
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

  personaInventory.push(newItem);
  await inventorySet(newItem);

  // Get a string display of the user's inventory
  inventoryList = personaInventory.map(item => `**${item.label}** - ${item.description}`).join('\n');
  inventoryString = stripIndents`
    **Inventory**
    ${inventoryList}
    `;

  // Go through items.general and create a new object of items that the user doesnt have yet
  let generalOptions = Object.values(items.general)
    .map(item => {
      if (!personaInventory.find(i => i.value === item.value)) {
        return {
          label: `${item.label} - ${item.cost} TT$`,
          value: item.value,
          description: `${item.description} - ${item.cost} TT$`,
          emoji: item.emoji,
        };
      }
      return null;
    }) as SelectMenuComponentOptionData[];
  generalOptions = generalOptions.filter(item => item !== null);
  log.debug(F, `generalOptions: ${JSON.stringify(generalOptions, null, 2)}`);

  if (generalOptions.length === 0) {
    const rowShop = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        buttons.town,
      );
    return {
      embeds: [embedTemplate()
        .setTitle('Shop')
        .setDescription(stripIndents`
        You are in the shop, you can buy some items to help you on your journey.

        You currently have **${personaData.tokens}** TripTokens.
      ${personaInventory.length > 0 ? inventoryString : ''}`)
        .setColor(Colors.Green)],
      components: [rowShop],
    };
  }

  menus.item.setOptions(generalOptions);

  const rowItems = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(menus.item);

  const rowShop = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      buttons.town,
    );

  // The user has clicked the shop button, send them the shop embed
  return {
    embeds: [embedTemplate()
      .setTitle('Shop')
      .setDescription(stripIndents`
      **You have purchased ${itemData.label} for ${itemData.cost} TripTokens.**

      You are in the shop, you can buy some items to help you on your journey.

      You currently have **${personaData.tokens}** TripTokens.
    ${personaInventory.length > 0 ? inventoryString : ''}`)
      .setColor(Colors.Green)],
    components: [rowItems, rowShop],
  };
}

export async function rpgGames(
  interaction: MessageComponentInteraction | ChatInputCommandInteraction,
):Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  // Check get fresh persona data
  const [personaData] = await getPersonaInfo(interaction.user.id);
  log.debug(F, `personaData: ${JSON.stringify(personaData, null, 2)}`);

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
  log.debug(F, `personaData: ${JSON.stringify(personaData, null, 2)}`);

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
  log.debug(F, `personaData: ${JSON.stringify(personaData, null, 2)}`);
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
