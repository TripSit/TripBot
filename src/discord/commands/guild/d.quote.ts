import {
  ChatInputCommandInteraction,
  Colors,
  GuildMember,
  MessageContextMenuCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { Prisma } from '@db/tripbot';

import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';

const F = f(__filename);

const flavorText = [
  'once famously declared,',
  'is forever known for saying,',
  'left us with the immortal words,',
  'proudly proclaimed,',
  'eternally etched these words into history,',
  'once articulated the thought,',
  'gave us the timeless utterance,',
  'voiced the memorable line,',
  'shared this nugget of wisdom,',
  'will always be remembered for stating,',
  'enlightened us with the words,',
  'left an indelible mark with the saying,',
  'immortalized in their words,',
  'spoke the now legendary phrase,',
  'echoed through time with the words,',
  'bequeathed us this piece of wisdom,',
  'cast these words into the annals of history,',
  'brought forth the insightful saying,',
  'cherished for their words,',
  'gifted us with the profound utterance,',
];

const successResponses = [
  "Quote saved! It's now etched in the annals of history.",
  'Let it be known that {target.displayName} said this. Witnessed and recorded!',
  "Captured for posterity! This quote won't be forgotten.",
  'Engraved in the digital stone. Another {target.displayName} classic.',
  'Added to the vault of wisdom. Future generations will thank you.',
  "Stamped and stored. The archives grow wiser with {target.displayName}'s words.",
  'This gem has been safely tucked away in the quote treasury.',
  'Quote logged. The sages of the future will ponder this one.',
  'Sealed into the annals of our digital history. Well said, {target.displayName}!',
  "Quote recorded! It's now part of the collective digital consciousness.",
  'Preserved for eternity. Or at least until the next database purge.',
  'This quote is now part of the echo chamber of history.',
  'Safeguarded in the vault of virtual lore. Well articulated, {target.displayName}!',
  "Cataloged under 'Brilliant Utterances by {target.displayName}'.",
  'Locked and loaded into the quote compendium. Future scholars, take note!',
  "Quote snagged! It's now shimmering in the digital constellation of wisdom.",
  "Ink's still wet, but it's official. {target.displayName}'s words are immortalized!",
  'Snatched from the ether and saved for all time. Well quipped, {target.displayName}!',
  'Et voilà! Another verbal masterpiece saved in the gallery of eloquence.',
  "This quote's now riding the eternal waves of the data stream. Surf's up!",
  'Bottled and shelved in the library of digital musings. Cheers, {target.displayName}!',
  "Zapped into the cybernetic memory banks. This one's a keeper!",
  "Stamped with the seal of 'Absolutely Noteworthy'. The archives grow richer.",
  'Scribed onto the virtual parchment. The future thanks you for this wisdom, {target.displayName}.',
  "Beam me up, Scotty! This quote's now aboard the starship of perpetuity.",
  'Nailed it! This quote has been hammered into the beams of digital history.',
  'Whisked away into the cloud of legendary utterances. Float on, wise words!',
  'And... snap! Captured this quote like a rare digital butterfly.',
  'Duly noted and saved. The oracle will be pleased with this one, {target.displayName}.',
  'Encased in the digital amber of time. This quote is now a relic of wisdom!',
];

const failResponses = [
  "Oops! This quote's already in the digital echo chamber.",
  'Too slow! Someone captured this wisdom before you.',
  "Deja vu! Looks like this quote's already been snagged.",
  "This gem's already been mined and stored in our vault.",
  'Hold up! This pearl of wisdom is already shining in our collection.',
  "Echo! Echo! We've heard (and saved) this one before.",
  "Looks like you're in a time loop. This quote's already here!",
  "The early bird gets the worm, and this quote's already been gobbled up.",
  "Duplicate detected! This one's a repeat performance.",
  "Already on record! This quote's been around the block.",
  "Rewind! We've seen this scene before in our quote archives.",
  "Copy-paste error: This quote's a clone already living in our database.",
  "Someone beat you to the punch. This quote's already in the ring.",
  "History repeats itself, but this quote's repetition is a bit too soon.",
  "This quote's a boomerang, already come back to us before.",
  "Been there, saved that! This one's a déjà-quote.",
  "It's a twin! We've already adopted this quote into our family.",
  "The ink's barely dry, but this quote's already been written in our books.",
  "Telepathy or coincidence? This quote's already been teleported to our servers.",
  "Quote déjà-saved! This one's already in the digital vault.",
  "Strike two! This quote's already hit a home run into our database.",
  "This quote's echo is still bouncing in our halls. Already recorded!",
  "A quote so nice, we saved it... oh wait, just once. It's already here.",
  "Great minds think alike, and someone's already thought of saving this.",
  "Your timing's like a rerun, we've seen this quote already.",
  "This quote's like a favorite song on repeat, already played in our system.",
  "Whoops, déjà-quoted! This one's already gracing our archives.",
  'Your quote submission is experiencing a case of double vision.',
  "Blink twice if you've seen this. Yep, this quote's already in our sights.",
  "Quote redundancy alert! This one's already living a cozy life in our database.",
];

async function get(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return;
  const quote = interaction.options.getString('quote', false);
  const user = interaction.options.getUser('user', false);

  if (!quote && !user) {
    await interaction.reply({
      content: 'You must provide either a quote or a user to search for quotes.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  log.debug(F, `Searching for quote: ${quote}, user: ${user?.username}`);

  let quoteData;

  // Build the search conditions
  const whereCondition: Prisma.quotesWhereInput = {};

  if (quote) {
    whereCondition.quote = {
      contains: quote,
    };
  }

  if (user) {
    whereCondition.user = {
      discord_id: user.id,
    };
  }

  // Search for quotes based on conditions
  if (quote) {
    // Quote provided (with or without user) - find first matching quote
    quoteData = await db.quotes.findFirst({
      where: whereCondition,
    });
  } else {
    // Only user provided - find all quotes by user and pick one randomly
    const quotes = await db.quotes.findMany({
      where: whereCondition,
    });

    if (quotes.length === 0) {
      await interaction.reply({
        content: `No quotes found for ${user?.username}.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Pick a random quote from the user's quotes
    quoteData = quotes[Math.floor(Math.random() * quotes.length)];
  }

  if (!quoteData) {
    let searchType;
    if (quote && user) {
      searchType = `quote containing "${quote}" by ${user?.username}`;
    } else if (quote) {
      searchType = `quote containing "${quote}"`;
    } else {
      searchType = `quotes by ${user?.username}`;
    }

    await interaction.reply({
      content: `No ${searchType} found.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  log.debug(F, 'Quote found!');

  // Get author data
  const authorData = await db.users.findFirstOrThrow({
    where: {
      id: quoteData.user_id,
    },
  });

  if (!authorData.discord_id) return; // Type safety

  // Try to fetch the Discord member
  let target = null;
  try {
    target = await interaction.guild.members.fetch(authorData.discord_id);
  } catch (err) {
    log.error(F, `Failed to fetch author: ${authorData.discord_id}`);
    target = null;
  }

  // Reply with the quote embed
  await interaction.reply({
    embeds: [{
      ...(target && {
        thumbnail: {
          url: target.user.displayAvatarURL(),
        },
      }),
      // eslint-disable-next-line max-len
      description: stripIndents`${target?.displayName || target?.user.username || 'Unknown User'} ${flavorText[Math.floor(Math.random() * flavorText.length)]}
    
      > **${quoteData.quote}**
      
      - ${quoteData.url || 'No source URL'}
      `,
      ...(target && { color: target.displayColor }),
      timestamp: quoteData.date.toISOString(),
    }],
  });
}

async function random(interaction:ChatInputCommandInteraction) {
  if (!interaction.guild) return;
  await interaction.deferReply({ });

  // Get total count first
  const count = await db.quotes.count();

  if (count === 0) {
    await interaction.editReply({
      content: 'No quotes found!',
    });
    return;
  }

  // Get one random quote using skip
  const quote = await db.quotes.findFirst({
    skip: Math.floor(Math.random() * count),
  });

  if (!quote) return; // TypeScript safety

  const authorData = await db.users.findFirstOrThrow({
    where: {
      id: quote.user_id,
    },
  });

  let author = null;
  try {
    author = await interaction.guild.members.fetch(authorData.discord_id as string);
  } catch (err) {
    log.error(F, `Failed to fetch author: ${authorData.discord_id}`);
    author = null;
  }

  await interaction.editReply({
    embeds: [
      {
        author: {
          name: `${author ? author.displayName : 'Unknown User'} ${
            flavorText[Math.floor(Math.random() * flavorText.length)]
          }`,
          icon_url: author ? author.user.displayAvatarURL() : undefined,
          url: quote.url,
        },
        description: `**${quote.quote}**`,
        timestamp: `${quote.date.toISOString()}`,
      },
    ],
  });
}

async function del(interaction:ChatInputCommandInteraction) {
  if (!interaction.guild) return;
  if (!interaction.member) return;
  const quote = interaction.options.getString('quote', true);

  log.debug(F, `Searching for quote: ${quote}`);

  const quoteData = await db.quotes.findFirst({
    where: {
      quote: {
        contains: quote,
      },
    },
  });

  if (!quoteData) {
    log.debug(F, 'Quote not found');
    await interaction.reply({
      content: 'Quote not found!',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  log.debug(F, 'Quote found!');

  const targetData = await db.users.findFirstOrThrow({
    where: {
      id: quoteData.user_id,
    },
  });

  if (!targetData.discord_id) return; // Just to type safe

  const target = await interaction.guild.members.fetch(targetData.discord_id);

  const guildData = await db.discord_guilds.findFirstOrThrow({
    where: {
      id: interaction.guild.id,
    },
  });

  const actor = interaction.member as GuildMember;

  const isOwner = target.id === interaction.user.id;
  const isModerator = guildData.role_moderator && actor.roles.cache.has(guildData.role_moderator);

  if (!isOwner && !isModerator) {
    log.debug(F, 'User does not own quote and is not a moderator');
    await interaction.reply({
      content: 'You do not own this quote! You can only delete your own quotes.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await db.quotes.delete({
    where: {
      id: quoteData.id,
    },
  });

  const quoteLog = await discordClient.channels.fetch(env.CHANNEL_QUOTE_LOG) as TextChannel;
  quoteLog.send({
    embeds: [
      {
        thumbnail: {
          url: target.user.displayAvatarURL(),
        },
        description: stripIndents`${target}
      
        > **${quoteData.quote}**
        
        - ${quoteData.url}
        `,
        footer: {
          text: `Deleted by ${actor.displayName} (${actor.id})`,
          icon_url: interaction.user.displayAvatarURL(),
        },
        color: Colors.Red,
      },
    ],
  });

  await interaction.reply({
    embeds: [{
      thumbnail: {
        url: target.user.displayAvatarURL(),
      },
      description: stripIndents`${target}
    
      > **${quoteData.quote}**
      
      - ${quoteData.url}
      `,
      footer: {
        text: 'Deleted from the /quote database!',
      },
      color: Colors.Red,
    }],
    flags: MessageFlags.Ephemeral,
  });
}

export async function quoteAdd(interaction:MessageContextMenuCommandInteraction) {
  log.info(F, await commandContext(interaction));
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  if (!interaction.guild) return false;
  if (interaction.guild.id !== env.DISCORD_GUILD_ID) return false;
  await interaction.targetMessage.fetch(); // Fetch the message, just in case

  // Get the actor
  const actor = interaction.member as GuildMember;

  // Get the target
  const target = interaction.targetMessage.member;

  // IDK how this happens but making it type-safe
  if (!target) {
    log.debug(F, 'No target member found');
    await interaction.editReply({
      content: 'You can only save messages that have an author, or from the last 2 weeks!',
    });
    return true;
  }

  // Don't allow saving bot messages
  if (target.user.bot) {
    log.debug(F, 'Target is a bot');
    await interaction.editReply({
      content: 'You can only save messages from humans!',
    });
    return true;
  }

  // Don't allow saving your own messages
  if (target.id === actor.id && !actor.id === env.DISCORD_OWNER_ID) {
    log.debug(F, 'Target is the actor');
    await interaction.editReply({
      content: 'You can\'t save your own messages!',
    });
    return true;
  }

  // Don't allow people under level 10 to save quotes
  const vipRoles = [
    env.ROLE_VIP_10,
    env.ROLE_VIP_20,
    env.ROLE_VIP_30,
    env.ROLE_VIP_40,
    env.ROLE_VIP_50,
    env.ROLE_VIP_60,
    env.ROLE_VIP_70,
    env.ROLE_VIP_80,
    env.ROLE_VIP_90,
    env.ROLE_VIP_100,
  ]
    .map(role => actor.roles.cache.has(role)) // Check if the actor has any of these roles
    .filter(role => role); // Filter out any non-truthy values

  // log.debug(F, `VIP Roles: ${vipRoles}`);

  if (vipRoles.length === 0) {
    log.debug(F, 'Actor has no VIP roles');
    await interaction.editReply({
      content: 'You need to be at least level 10 to save quotes!',
    });
    return true;
  }

  // Check if the URL already exists in the database
  const quoteExists = await db.quotes.findFirst({
    where: {
      url: interaction.targetMessage.url,
    },
  });
  if (quoteExists) {
    log.debug(F, 'Quote already exists');
    await interaction.editReply({
      content: failResponses[Math.floor(Math.random() * failResponses.length)],
    });
    return true;
  }

  log.debug(F, `All checks passed, saving quote from ${target.displayName} (${target.id})`);

  const actorData = await db.users.upsert({
    where: { discord_id: actor.id },
    create: { discord_id: actor.id },
    update: {},
  });

  const targetData = await db.users.upsert({
    where: { discord_id: target.id },
    create: { discord_id: target.id },
    update: {},
  });

  // If empty string or just whitespace, replace it.
  const fixedQuote = interaction.targetMessage.content.trim() || 'No text (Image)';
  const quoteData = await db.quotes.create({
    data: {
      user_id: targetData.id,
      quote: fixedQuote,
      url: interaction.targetMessage.url,
      date: interaction.targetMessage.createdAt,
      created_by: actorData.id,
    },
  });

  await interaction.targetMessage.reply({
    embeds: [{
      description: stripIndents`${successResponses[Math.floor(Math.random() * successResponses.length)]
        .replace('{target.displayName}', target.displayName)}
      `,
      // footer: {
      //   text: 'Saved to the /quote database!',
      // },
      color: Colors.Green,
    }],
  });

  const quoteLog = await discordClient.channels.fetch(env.CHANNEL_QUOTE_LOG) as TextChannel;
  quoteLog.send({
    embeds: [
      {
        thumbnail: {
          url: target.user.displayAvatarURL(),
        },
        description: stripIndents`${target}
      
        > **${quoteData.quote}**
        
        - ${quoteData.url}
        `,
        footer: {
          text: `Saved by ${actor.displayName} (${actor.id})`,
          icon_url: interaction.user.displayAvatarURL(),
        },
        color: Colors.Green,
      },
    ],
  });

  await interaction.editReply({
    embeds: [{
      thumbnail: {
        url: target.user.displayAvatarURL(),
      },
      description: stripIndents`${target}
    
      > **${quoteData.quote}**
      
      - ${quoteData.url}
      `,
      footer: {
        text: 'Saved to the /quote database!',
      },
      color: Colors.Green,
    }],
  });

  return true;
}

export const dQuote: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('quote')
    .setDescription('Manage quotes')
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setDescription('Search quotes!')
      .addStringOption(option => option.setName('quote')
        .setDescription('Which quote? Type to search!')
        .setAutocomplete(true))
      .addUserOption(option => option.setName('user')
        .setDescription('Which user?'))
      .setName('get'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Get a random quote!')
      .setName('random'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Delete your own quote records!')
      .addStringOption(option => option.setName('quote')
        .setDescription('Which quote? Type to search!')
        .setAutocomplete(true)
        .setRequired(true))
      .setName('delete')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    switch (interaction.options.getSubcommand()) {
      case 'get':
        await get(interaction);
        break;
      case 'random':
        await random(interaction);
        break;
      case 'delete':
        await del(interaction);
        break;
      default:
        await interaction.reply({
          content: 'Unknown subcommand!',
          flags: MessageFlags.Ephemeral,
        });
        break;
    }
    return true;
  },
};

export default dQuote;
