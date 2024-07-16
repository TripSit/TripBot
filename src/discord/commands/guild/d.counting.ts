/* eslint-disable max-len */
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  TextChannel,
  InteractionEditReplyOptions,
  time,
  Colors,
  PermissionResolvable,
  Collection,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommandBeta } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';
import { checkChannelPermissions } from '../../utils/checkPermissions';
import { sleep } from './d.bottest';

const F = f(__filename);

interface ComboHistoryObj {
  user_id: string | null;
  game_id: string;
  count: Number;
  last_broken_at: number;
}

function calcTotalPot(
  number:number,
  users:number,
):number {
  log.debug(F, `number: ${number}, users: ${users}`);
  return Math.floor((number * 10));
}

const warnedUsers = [] as string[];

export async function countingSetup(
  channel:TextChannel,
  type: 'HARDCORE' | 'TOKEN' | 'NORMAL',
  startingNumber:number,
  override:boolean,
  purge:boolean,
):Promise<InteractionEditReplyOptions> {
  const countingData = await db.counting.findFirst({
    where: {
      channel_id: channel.id,
    },
  });
  log.debug(F, `data: ${JSON.stringify(countingData)}`);

  const embed = embedTemplate();

  if (countingData && !override) {
    return {
      embeds: [embed.setTitle('This channel is already set up for counting! Mods can /reset or /end it!')],
    };
  }

  let description = `

  The rules are simple:
  1. You must post a number in chat that is 1 higher than the last number.
  2. You must use numbers, I'm not smart enough to understand words can be numbers.
  3. You can't count twice in a row.`;

  if (type === 'HARDCORE') {
    description += `
    This is a HARDCORE game which means:
    4. If you say the wrong number the count resets and **you will be timed out for 24!**`;
  }

  if (type === 'TOKEN') {
    description += `${description.slice(-1)}, **and you can only count once every hour!**
    This is a TOKEN game which means:
    4. Every time someone counts, tokens are added to the pot
    5. At every multiple of 10 (10, 20, 30, etc) everyone who contributed gets a share from the pot
    6. At any point someone can break the combo and take the pot for themselves!`;
  }

  if (type === 'NORMAL') {
    description += `
    4. If you say the wrong number the count resets and everyone will be disappointed`;
  }

  description += `

  Use /counting scores to see the scores for this channel

  Mods can /counting reset to reset the channel if needed

  I'll start us off in the next message!`;

  embed
    .setTitle(`Let's play a ${type.toLowerCase()} counting game!`)
    .setDescription(stripIndents`${description}`);

  const countingMessage = await channel.send({ embeds: [embed] });

  const firstNumber = await channel.send({ content: `${startingNumber}` });
  await firstNumber.react('👍');

  // await countingSetG({
  //   guild_id: channel.guild.id,
  //   channel_id: channel.id,
  //   type,

  //   current_number: startingNumber,
  //   current_number_message_id: countingMessage.id,
  //   current_number_message_date: new Date(),
  //   current_number_message_author: countingMessage.author.id,
  //   current_stakeholders: purge ? [] : data?.current_stakeholders ?? [],

  //   last_number: data?.last_number ?? null,
  //   last_number_message_id: data?.last_number_message_id ?? null,
  //   last_number_message_date: data?.last_number_broken_date ?? null,
  //   last_number_message_author: data?.last_number_message_author ?? null,
  //   last_number_broken_by: data?.last_number_broken_by ?? null,
  //   last_number_broken_date: data?.last_number_broken_date ?? null,

  //   record_number: data?.record_number ?? 0,
  //   record_number_message_id: data?.record_number_message_id ?? null,
  //   record_number_message_date: data?.record_number_message_date ?? null,
  //   record_number_message_author: data?.record_number_message_author ?? null,
  //   record_number_broken_by: data?.record_number_broken_by ?? null,
  //   record_number_broken_date: data?.record_number_broken_date ?? null,
  // } as counting);

  let currentStakeholders = '';

  if (!purge && countingData?.current_stakeholders) {
    currentStakeholders = countingData.current_stakeholders;
  }

  await db.counting.upsert({
    where: {
      guild_id_channel_id: {
        channel_id: channel.id,
        guild_id: channel.guild.id,
      },
    },
    create: {
      guild_id: channel.guild.id,
      channel_id: channel.id,
      type,

      current_number: startingNumber,
      current_number_message_id: countingMessage.id,
      current_number_message_date: new Date(),
      current_number_message_author: countingMessage.author.id,
      current_stakeholders: currentStakeholders,

      last_number: countingData?.last_number ?? null,
      last_number_message_id: countingData?.last_number_message_id ?? null,
      last_number_message_date: countingData?.last_number_broken_date ?? null,
      last_number_message_author: countingData?.last_number_message_author ?? null,
      last_number_broken_by: countingData?.last_number_broken_by ?? null,
      last_number_broken_date: countingData?.last_number_broken_date ?? null,

      record_number: countingData?.record_number ?? 0,
      record_number_message_id: countingData?.record_number_message_id ?? null,
      record_number_message_date: countingData?.record_number_message_date ?? null,
      record_number_message_author: countingData?.record_number_message_author ?? null,
      record_number_broken_by: countingData?.record_number_broken_by ?? null,
      record_number_broken_date: countingData?.record_number_broken_date ?? null,
    },
    update: {
      type,

      current_number: startingNumber,
      current_number_message_id: countingMessage.id,
      current_number_message_date: new Date(),
      current_number_message_author: countingMessage.author.id,
      current_stakeholders: currentStakeholders,

      last_number: countingData?.last_number
        ? countingData.last_number
        : null,
      last_number_message_id: countingData?.last_number_message_id
        ? countingData.last_number_message_id
        : null,
      last_number_message_date: countingData?.last_number_broken_date
        ? countingData.last_number_broken_date
        : null,
      last_number_message_author: countingData?.last_number_message_author
        ? countingData.last_number_message_author
        : null,
      last_number_broken_by: countingData?.last_number_broken_by
        ? countingData.last_number_broken_by
        : null,
      last_number_broken_date: countingData?.last_number_broken_date
        ? countingData.last_number_broken_date
        : null,
    },
  });

  return { content: 'Counting channel set up!' };
}

export async function countingScores(
  interaction:ChatInputCommandInteraction,
):Promise<InteractionEditReplyOptions> {
  // This function gets the scores for the counting channel
  const channel = interaction.channel as TextChannel;
  const countingData = await db.counting.findFirst({
    where: {
      channel_id: channel.id,
    },
  });
  log.debug(F, `Data: ${JSON.stringify(countingData, null, 2)}`);
  if (!countingData) return { content: 'This channel is not set up for counting!' };

  const currentLink = `[${countingData.current_number}](https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${countingData.current_number_message_id})`; // eslint-disable-line max-len
  const currentMember = await interaction.guild?.members.fetch(countingData.current_number_message_author as string);
  let description = `
  **Current Combo**
  ${currentLink} - ${currentMember} ${time(countingData.current_number_message_date, 'R')}`;

  if (countingData.last_number) {
    const lastLink = `[${countingData.last_number}](https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${countingData.last_number_message_id})`; // eslint-disable-line max-len
    const lastMember = await interaction.guild?.members.fetch(countingData.last_number_message_author as string);
    const lastBreaker = await interaction.guild?.members.fetch(countingData.last_number_broken_by as string);
    description += `

    **Last Combo**
    ${lastLink} - ${lastMember ?? 'unknown'} ${time(countingData.last_number_message_date as Date, 'R')}
    Broken by ${lastBreaker ?? 'unknown'} ${time(countingData.last_number_broken_date as Date, 'R')}`;
  }

  if (countingData.record_number) {
    const recordLink = `[${countingData.record_number}](https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${countingData.record_number_message_id})`; // eslint-disable-line max-len
    const recordMember = await interaction.guild?.members.fetch(countingData.record_number_message_author as string);
    const recordBreaker = await interaction.guild?.members.fetch(countingData.record_number_broken_by as string);
    description += `

    **Record Combo**
    ${recordLink} - ${recordMember ?? 'unknown'} ${time(countingData.record_number_message_date as Date, 'R')}
    Broken by ${recordBreaker ?? 'unknown'} ${time(countingData.record_number_broken_date as Date, 'R')}`;
  }

  const embed = embedTemplate()
    .setTitle('Counting Scores')
    .setDescription(stripIndents`${description}`);
  return { embeds: [embed] };
}

export async function countingReset(
  interaction:ChatInputCommandInteraction,
):Promise<InteractionEditReplyOptions> {
  // This function resets the counting channel
  const channel = interaction.channel as TextChannel;
  const countingData = await db.counting.findFirst({
    where: {
      channel_id: channel.id,
    },
  });
  if (!countingData) return { content: 'This channel is not set up for counting!' };
  const number = interaction.options.getInteger('number') ?? 0;
  await countingSetup(
    channel,
    (interaction.options.getString('type') ?? 'NORMAL') as 'HARDCORE' | 'TOKEN' | 'NORMAL',
    number,
    true,
    interaction.options.getBoolean('purge') ?? false,
  );
  return { embeds: [embedTemplate().setTitle(`Counting channel reset to ${number}!`)] };
}

export async function countMessage(message: Message): Promise<void> {
  if (!message.guild) return; // If not in a guild then ignore all messages
  if (message.guild.id !== env.DISCORD_GUILD_ID) return; // If not in tripsit ignore all messages

  const countingData = await db.counting.findFirst({
    where: {
      channel_id: message.channel.id,
    },
  });
  if (!countingData) return; // If not a counting channel then ignore all messages
  log.debug(F, `countingData: ${JSON.stringify(countingData, null, 2)} `);

  // Get recent combo breakers
  const recentComboBreakers = await db.counting_breaks.findMany({
    where: {
      game_id: countingData.type,
    },
    orderBy: {
      last_broken_at: 'desc'
    },
    take: 4,
  });

  // Process the new message. If it's the next number after current_number, then update the DB
  // If it's not the next number, then still update the db with the user who broke the combo

  // log.debug(F, `Message: ${message.cleanContent}`);
  const number = parseInt(message.cleanContent, 10);
  // log.debug(F, `number: ${number}`);

  // log.debug(F, `isnan: ${Number.isNaN(number)}`);

  if (Number.isNaN(number)) {
    // await message.delete();
    return;
  }

  if (countingData.current_number === -1) {
    await message.reply('Please wait for the new game to start');
    return;
  }

  // log.debug(F, `Message.author.id: ${message.author.id}`);
  // log.debug(F, `countingData.current_number_message_author: ${countingData.current_number_message_author}`);
  // log.debug(F, `env.DISCORD_OWNER_ID: ${env.DISCORD_OWNER_ID}`);
  if (countingData.current_number_message_author === message.author.id
    && message.author.id.toString() !== env.DISCORD_OWNER_ID.toString()) { // Allow the owner to spam (for testing)
    log.debug(F, 'Deleting message because the author is the same as the current number message author');
    await message.reply('Stop playing with yourself 😉');
    return;
  }

  // Determine if the user has said a number in the last {timeout} period
  const channelMessages = await message.channel.messages.fetch(
    { before: message.id },
  ) as Collection<string, Message<true>>;
  const lastMessage = channelMessages
    .filter((m: { author: { id: any; }; }) => m.author.id === message.author.id) // Messages sent by the user
    .filter((m: { cleanContent: string; }) => !Number.isNaN(parseInt(m.cleanContent, 10))) // That are numbers
    .filter((m: { createdTimestamp: number; }) => m.createdTimestamp > Date.now() - (1000 * 60 * 60)) // That are within one hour
    .sort((a: { createdTimestamp: number; }, b: { createdTimestamp: number; }) => b.createdTimestamp - a.createdTimestamp) // Sorted by most recent
    .first(); // Get the first one

  if (lastMessage && countingData.type === 'TOKEN'
    && message.author.id.toString() !== env.DISCORD_OWNER_ID.toString()) {
    await message.reply('You can only count once every hour in the Token game!');
    return;
  }

  if (number !== countingData.current_number + 1) {
    await message.channel.messages.fetch(countingData.current_number_message_id);

    //const comboBreakingHistory: ComboHistoryObj[] = countingData.combo_breaking_history;

    // if (comboBreakingHistory.length > 4) {
    //   comboBreakingHistory.shift();
    // }
    
    if (recentComboBreakers) {
      // Check if the user has broken the combo recently, and if so, flag them and prevent the break.
      // REMOVE THIS COMMENT AFTER READING - THIS SHOULD BE FINE.
      let userCanBreakCombo = true;
      recentComboBreakers.forEach((comboBreak: { user_id: string; }) => {
        if (message.author.id === comboBreak.user_id) {
          userCanBreakCombo = false;
        }
      });
      if (!userCanBreakCombo) {
        await message.reply('You cannot break the combo if you are one of the last 4 people to have broken it recently.');
        // await message.reply(`You cannot break the combo if you are one of the last 4 people to break it: ${JSON.stringify(comboBreakingHistory)}`);
        return;
      }
    }

    const stakeholderNumber = countingData.current_stakeholders
      ? countingData.current_stakeholders.split(',').length
      : 1;
    const totalPot = calcTotalPot(countingData.current_number, stakeholderNumber);

    // If the user does not exist in the stakeholders and has not been warned before
    // warn them that they're breaking the combo and add them to the warned users list
    if (countingData.current_stakeholders
      && !countingData.current_stakeholders.split(',').includes(message.author.id)
      && !warnedUsers.includes(message.author.id)) {
      let messageReply = stripIndents`Hey ${message.member?.displayName}, welcome to the counting game!
      
      You may not know, but you're breaking the combo!

      The current number is ${countingData.current_number}, if you want to join the game, type the next number in the series! 
      `;
      if (countingData.type === 'HARDCORE') {
        messageReply += 'If you break the combo again, you\'ll be timed out for 24 hours!';
      } else if (countingData.type === 'TOKEN') {
        messageReply += `If you break the combo again, you'll steal ${totalPot} tokens and reset the counter for everyone else!`; // eslint-disable-line max-len
      } else {
        messageReply += 'If you break the combo again, you\'ll reset the combo!';
      }

      // add the user to the stakeholders to prevent them from being warned again
      countingData.current_stakeholders = countingData.current_stakeholders
        .split(',')
        .concat(message.author.id)
        .join(',');
      // await countingSetG(countingData);
      await db.counting.upsert({
        where: {
          guild_id_channel_id: {
            guild_id: message.guild.id,
            channel_id: message.channel.id,
          },
        },
        create: countingData,
        update: countingData,
      });

      warnedUsers.push(message.author.id);

      await message.channel.send(messageReply);
      return;
    }

    countingData.last_number = countingData.current_number;
    countingData.last_number_message_id = countingData.current_number_message_id;
    countingData.last_number_message_date = countingData.current_number_message_date;
    countingData.last_number_message_author = countingData.current_number_message_author;
    countingData.last_number_broken_by = message.author.id;
    countingData.last_number_broken_date = new Date();
    // countingData.combo_breaking_history = JSON.stringify(comboBreakingHistory);

    // If the number is not the next number in the sequence...
    let recordMessage = '';
    // Check if a new record was set
    if (countingData.current_number > countingData.record_number) {
      // If a new record was set then update the DB
      countingData.record_number = countingData.current_number;
      countingData.record_number_message_id = countingData.current_number_message_id;
      countingData.record_number_message_date = countingData.current_number_message_date;
      countingData.record_number_message_author = countingData.current_number_message_author;
      countingData.record_number_broken_by = message.author.id;
      countingData.record_number_broken_date = new Date();

      const recordUser = await message.guild.members.fetch(countingData.record_number_message_author);
      // Send a message to the channel
      recordMessage = `\n\n**A new record of ${countingData.current_number} was set by ${recordUser}**!
      ${message.author} will go down in history as the one who broke the streak...`;
    }

    if (countingData.type === 'HARDCORE') {
      // If the channel is hardcore then timeout the user
      const member = await message.guild.members.fetch(message.author.id);
      // TImeout the user for 24 hours
      await member.timeout(24 * 60 * 60 * 1000, 'Counting channel timeout');
    }

    // If it's token, take tokens from the pot
    if (countingData.type === 'TOKEN') {
      // If the channel is token then take tokens from the pot

      // const userData = await getUser(message.author.id, null, null);
      const userData = await db.users.upsert({
        where: {
          discord_id: message.author.id,
        },
        create: {
          discord_id: message.author.id,
        },
        update: {},
      });

      // const personaData = await personaGet(userData.id);
      await db.personas.upsert({
        where: {
          user_id: userData.id,
        },
        create: {
          user_id: userData.id,
          tokens: totalPot,
        },
        update: {
          tokens: {
            increment: totalPot,
          },
        },
      });
    }

    let endingMessage = '';
    if (countingData.type === 'HARDCORE') {
      endingMessage = '\n\nThey were timed out for 24 hours for this transgression!';
    } else if (countingData.type === 'TOKEN') {
      endingMessage = `\n\nThey stole ${totalPot} tokens from the pot!`;
    } else {
      endingMessage = '\n\nMake sure to point and laugh at them!';
    }

    // Set this to -1 so that people can't start a new game while the countdown is playing
    countingData.current_number = -1;

    // Then update the DB with the user who broke the combo
    await db.counting.upsert({
      where: {
        guild_id_channel_id: {
          guild_id: message.guild.id,
          channel_id: message.channel.id,
        },
      },
      create: countingData,
      update: countingData,
    });


    // THIS IS WHERE I LEFT OFF. 

    await db.counting_breaks.upsert({
      where: {
        game_id: countingData.type,
      },
      create: {
        user_id: message.author.id,
        game_id: countingData.type,
        count: countingData.current_number,
      },
    });
    

    // Send a message to the channel
    await message.channel.send({
      embeds: [
        embedTemplate()
          .setTitle('Combo Broken!')
          .setColor(Colors.Red)
          .setDescription(stripIndents`Oh no, ${message.author} broke the combo...${recordMessage}${endingMessage}`),
      ],
    });

    // Send a message to the channel that the next game will start in 10 seconds.
    // Wait 10 seconds, and then edit the message to a line that says "Starting new game in {relative time}"

    const resetTime = new Date(new Date().getTime() + 10 * 1000);
    const newMessage = await message.channel.send(`Starting new game ${time(resetTime, 'R')}`);
    await sleep(10000);

    // Start a new counting game
    await countingSetup(
      message.channel as TextChannel,
      countingData.type,
      0,
      true,
      true,
    );

    await newMessage.delete();

    return;
  }

  // If the number is the next number in the sequence
  // Then update the DB with the user who got the number right

  countingData.current_number = number;
  countingData.current_number_message_id = message.id;
  countingData.current_number_message_date = new Date();
  countingData.current_number_message_author = message.author.id;
  await db.counting.upsert({
    where: {
      guild_id_channel_id: {
        guild_id: message.guild.id,
        channel_id: message.channel.id,
      },
    },
    create: countingData,
    update: countingData,
  });

  if (countingData.current_stakeholders) {
    if (!countingData.current_stakeholders.includes(message.author.id)) {
    // Take countingData.current_stakeholders, turn it into an array, add the user, turn it back into a string
      log.debug(F, `current_stakeholders: ${countingData.current_stakeholders}`);

      countingData.current_stakeholders = countingData.current_stakeholders
        .split(',')
        .concat(message.author.id)
        .join(',');
      log.debug(F, `Member ${message.member?.displayName} was added as a stakeholder`);
      let welcomeMessage = `Welcome to the counting game ${message.member?.displayName}!`;
      if (countingData.type === 'TOKEN') {
        welcomeMessage += '\nThis is a TOKEN game: Build the pot and get tokens every 10 levels, or break the combo and steal it all!'; // eslint-disable-line max-len
      } else if (countingData.type === 'HARDCORE') {
        welcomeMessage += '\nThis is a HARDCORE game: if you break the combo you will be timed out for 24 hours!';
      }

      await message.channel.send(welcomeMessage);
    } else {
      log.debug(F, `Member ${message.member?.displayName} was already a stakeholder`);
    }
  } else {
    countingData.current_stakeholders = message.author.id;
    log.debug(F, `Created new stakeholders: ${countingData.current_stakeholders}`);
  }

  // If the number is the next number in the sequence and a multiple of 10
  // Look up the persona of every user in the currentData.current_stakeholders string
  // Give each of those personas a fraction of the pot: (totalPot / currentData.current_stakeholders.length)
  // EG: (10 * 10) * (10 / 10) = 100
  // EG: (20 * 10) * (20 / 10) = 400
  // EG: (30 * 10) * (30 / 10) = 900
  // EG: (40 * 10) * (40 / 10) = 1600
  // EG: (50 * 10) * (50 / 10) = 2500

  if (number % 10 === 0 && countingData.type === 'TOKEN') {
    // If the number is a multiple of 10
    // Give each user a fraction of the pot
    const stakeholderNumber = countingData.current_stakeholders.split(',').length;
    const totalPot = calcTotalPot(countingData.current_number + 1, stakeholderNumber);
    const potPerUser = totalPot / stakeholderNumber;

    // Look up the persona of every user in the currentData.current_stakeholders string
    // Give each of those personas a fraction of the pot: (totalPot / currentData.current_stakeholders.length)
    const stakeholderIds = countingData.current_stakeholders.split(',');
    await Promise.all(stakeholderIds.map(async (discordId: any) => {
      // const userData = await getUser(message.author.id, null, null);
      const userData = await db.users.upsert({
        where: {
          discord_id: discordId,
        },
        create: {
          discord_id: discordId,
        },
        update: {},
      });

      // const personaData = await personaGet(userData.id);
      return db.personas.upsert({
        where: {
          user_id: userData.id,
        },
        create: {
          user_id: userData.id,
          tokens: potPerUser,
        },
        update: {
          tokens: {
            increment: potPerUser,
          },
        },
      });
    }));

    const embed = embedTemplate()
      .setTitle('Payday!')
      .setColor(Colors.Green)
      .setDescription(stripIndents`The pot of ${totalPot} tokens has been claimed by ${stakeholderNumber} users!
      Each user has been given ${potPerUser} tokens!

      The pot grows bigger the higher the combo gets, and the amount of people who have contributed to the combo!`)
      .setFooter({ text: 'totalPot = (currentNumber * 10)' });

    // Send a message to the channel
    await message.channel.send({
      embeds: [embed],
    });
  }

  await db.counting.upsert({
    where: {
      guild_id_channel_id: {
        guild_id: message.guild.id,
        channel_id: message.channel.id,
      },
    },
    create: countingData,
    update: countingData,
  });

  await message.react('👍');

  // log.debug(F, `countingData: ${JSON.stringify(countingData, null, 2)}`);
}

export const counting: SlashCommandBeta = {
  data: new SlashCommandBuilder()
    .setName('counting')
    .setDescription('All things with counting!')
    .addSubcommand((subcommand: { setName: (arg0: string) => { (): any; new(): any; setDescription: { (arg0: string): { (): any; new(): any; addStringOption: { (arg0: (option: any) => any): any; new(): any; }; }; new(): any; }; }; }) => subcommand
      .setName('setup')
      .setDescription('Set up a Counting channel!')
      .addStringOption((option: { setDescription: (arg0: string) => { (): any; new(): any; setName: { (arg0: string): { (): any; new(): any; addChoices: { (arg0: { name: string; value: string; }, arg1: { name: string; value: string; }, arg2: { name: string; value: string; }): any; new(): any; }; }; new(): any; }; }; }) => option
        .setDescription('What kind of counting game?')
        .setName('type')
        .addChoices(
          { name: 'Hardcore', value: 'HARDCORE' },
          { name: 'Token', value: 'TOKEN' },
          { name: 'Normal', value: 'NORMAL' },
        )))
    .addSubcommand((subcommand: { setName: (arg0: string) => { (): any; new(): any; setDescription: { (arg0: string): { (): any; new(): any; addBooleanOption: { (arg0: (option: any) => any): any; new(): any; }; }; new(): any; }; }; }) => subcommand
      .setName('scores')
      .setDescription('Get the scores for a Counting channel!')
      .addBooleanOption((option: { setName: (arg0: string) => { (): any; new(): any; setDescription: { (arg0: string): any; new(): any; }; }; }) => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')))
    .addSubcommand((subcommand: { setName: (arg0: string) => { (): any; new(): any; setDescription: { (arg0: string): { (): any; new(): any; addIntegerOption: { (arg0: (option: any) => any): { (): any; new(): any; addBooleanOption: { (arg0: (option: any) => any): { (): any; new(): any; addStringOption: { (arg0: (option: any) => any): any; new(): any; }; }; new(): any; }; }; new(): any; }; }; new(): any; }; }; }) => subcommand
      .setName('reset')
      .setDescription('Reset the counting channel!')
      .addIntegerOption((option: { setDescription: (arg0: string) => { (): any; new(): any; setName: { (arg0: string): any; new(): any; }; }; }) => option
        .setDescription('The number to set the channel to')
        .setName('number'))
      .addBooleanOption((option: { setName: (arg0: string) => { (): any; new(): any; setDescription: { (arg0: string): any; new(): any; }; }; }) => option
        .setName('purge')
        .setDescription('Set to "True" to start completely fresh'))
      .addStringOption((option: { setDescription: (arg0: string) => { (): any; new(): any; setName: { (arg0: string): { (): any; new(): any; addChoices: { (arg0: { name: string; value: string; }, arg1: { name: string; value: string; }, arg2: { name: string; value: string; }): any; new(): any; }; }; new(): any; }; }; }) => option
        .setDescription('What kind of counting game?')
        .setName('type')
        .addChoices(
          { name: 'Hardcore', value: 'HARDCORE' },
          { name: 'Token', value: 'TOKEN' },
          { name: 'Normal', value: 'NORMAL' },
        )))
    .addSubcommand((subcommand: { setName: (arg0: string) => { (): any; new(): any; setDescription: { (arg0: string): any; new(): any; }; }; }) => subcommand
      .setName('end')
      .setDescription('End the counting game!')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') !== false) });
    const command = interaction.options.getSubcommand();
    let response = { content: 'This command has not been setup yet!' } as InteractionEditReplyOptions;
    if (command === 'setup') {
      // Check if the user can manage the channel role
      if (!await checkChannelPermissions(
        (interaction.channel as TextChannel),
        [
          'ManageChannel' as PermissionResolvable,
        ],
      )) {
        // log.debug(`${PREFIX} bot does NOT has permission to post in !`);
        return interaction.editReply({
          embeds: [embedTemplate()
            .setTitle('You do not have permission to use this command!')
            .setColor(Colors.Red)],
        });
      }
      response = await countingSetup(
        interaction.channel as TextChannel,
        (interaction.options.getString('type') ?? 'NORMAL') as 'HARDCORE' | 'TOKEN' | 'NORMAL',
        0,
        false,
        true,
      );
    }
    if (command === 'scores') {
      response = await countingScores(interaction);
    }
    if (command === 'reset') {
      // Check if the user can manage the channel role
      if (!await checkChannelPermissions(
        (interaction.channel as TextChannel),
        [
          'ManageChannel' as PermissionResolvable,
        ],
      )) {
        // log.debug(`${PREFIX} bot does NOT has permission to post in !`);
        return interaction.editReply({
          embeds: [embedTemplate()
            .setTitle('You do not have permission to use this command!')
            .setColor(Colors.Red)],
        });
      }

      response = await countingReset(interaction);
    }
    return interaction.editReply(response);
  },
};

export default counting;
