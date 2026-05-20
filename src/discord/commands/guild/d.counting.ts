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
  MessageFlags,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommandBeta } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';
import { checkChannelPermissions } from '../../utils/checkPermissions';
import { sleep } from '../../utils/sleep';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

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
  locale = 'en-US',
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
      embeds: [embed.setTitle(t(locale, 'counting', 'alreadySetupError'))],
    };
  }

  let description = `\n\n${t(locale, 'counting', 'setupRules')}`;

  if (type === 'HARDCORE') {
    description += `\n${t(locale, 'counting', 'hardcoreRule')}`;
  }

  if (type === 'TOKEN') {
    description += `, **and you can only count once every hour!**\n${t(locale, 'counting', 'tokenRule')}`;
  }

  if (type === 'NORMAL') {
    description += `\n${t(locale, 'counting', 'normalRule')}`;
  }

  description += `\n\n${t(locale, 'counting', 'setupFooter')}`;

  embed
    .setTitle(t(locale, 'counting', 'gameTitle', { type: type.toLowerCase() }))
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

  return { content: t(locale, 'counting', 'setupComplete') };
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
  if (!countingData) return { content: t('en-US', 'counting', 'notSetupError') };

  const currentLink = `[${countingData.current_number}](https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${countingData.current_number_message_id})`; // eslint-disable-line max-len
  const currentMember = await interaction.guild?.members.fetch(countingData.current_number_message_author as string);
  let description = `
  ${t('en-US', 'counting', 'currentCombo')}
  ${currentLink} - ${currentMember} ${time(countingData.current_number_message_date, 'R')}`;

  if (countingData.last_number) {
    const lastLink = `[${countingData.last_number}](https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${countingData.last_number_message_id})`; // eslint-disable-line max-len
    const lastMember = await interaction.guild?.members.fetch(countingData.last_number_message_author as string);
    const lastBreaker = await interaction.guild?.members.fetch(countingData.last_number_broken_by as string);
    description += `

    ${t('en-US', 'counting', 'lastCombo')}
    ${lastLink} - ${lastMember ?? 'unknown'} ${time(countingData.last_number_message_date as Date, 'R')}
    ${t('en-US', 'counting', 'brokenBy', { user: String(lastBreaker ?? 'unknown'), time: time(countingData.last_number_broken_date as Date, 'R') })}`;
  }

  if (countingData.record_number) {
    const recordLink = `[${countingData.record_number}](https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${countingData.record_number_message_id})`; // eslint-disable-line max-len
    const recordMember = await interaction.guild?.members.fetch(countingData.record_number_message_author as string);
    const recordBreaker = await interaction.guild?.members.fetch(countingData.record_number_broken_by as string);
    description += `

    ${t('en-US', 'counting', 'recordCombo')}
    ${recordLink} - ${recordMember ?? 'unknown'} ${time(countingData.record_number_message_date as Date, 'R')}
    ${t('en-US', 'counting', 'brokenBy', { user: String(recordBreaker ?? 'unknown'), time: time(countingData.record_number_broken_date as Date, 'R') })}`;
  }

  const embed = embedTemplate()
    .setTitle(t('en-US', 'counting', 'scoresTitle'))
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
  if (!countingData) return { content: t('en-US', 'counting', 'notSetupError') };
  const number = interaction.options.getInteger('number') ?? 0;
  await countingSetup(
    channel,
    (interaction.options.getString('type') ?? 'NORMAL') as 'HARDCORE' | 'TOKEN' | 'NORMAL',
    number,
    true,
    interaction.options.getBoolean('purge') ?? false,
  );
  return { embeds: [embedTemplate().setTitle(t('en-US', 'counting', 'resetComplete', { number: String(number) }))] };
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

  if (!(message.channel instanceof TextChannel)) return;

  if (countingData.current_number === -1) {
    await message.reply(t('en-US', 'counting', 'waitForGame'));
    return;
  }

  // log.debug(F, `Message.author.id: ${message.author.id}`);
  // log.debug(F, `countingData.current_number_message_author: ${countingData.current_number_message_author}`);
  // log.debug(F, `env.DISCORD_OWNER_ID: ${env.DISCORD_OWNER_ID}`);
  if (countingData.current_number_message_author === message.author.id
    && message.author.id.toString() !== env.DISCORD_OWNER_ID.toString()) { // Allow the owner to spam (for testing)
    log.debug(F, 'Deleting message because the author is the same as the current number message author');
    await message.reply(t('en-US', 'counting', 'selfCountError'));
    return;
  }

  // Determine if the user has said a number in the last {timeout} period
  const channelMessages = await message.channel.messages.fetch(
    { before: message.id },
  ) as Collection<string, Message<true>>;
  const lastMessage = channelMessages
    .filter(m => m.author.id === message.author.id) // Messages sent by the user
    .filter(m => !Number.isNaN(parseInt(m.cleanContent, 10))) // That are numbers
    .filter(m => m.createdTimestamp > Date.now() - (1000 * 60 * 60)) // That are within one hour
    .sort((a, b) => b.createdTimestamp - a.createdTimestamp) // Sorted by most recent
    .first(); // Get the first one

  if (lastMessage && countingData.type === 'TOKEN'
    && message.author.id.toString() !== env.DISCORD_OWNER_ID.toString()) {
    await message.reply(t('en-US', 'counting', 'tokenCooldownError'));
    return;
  }

  if (number !== countingData.current_number + 1) {
    await message.channel.messages.fetch(countingData.current_number_message_id);

    const stakeholderNumber = countingData.current_stakeholders
      ? countingData.current_stakeholders.split(',').length
      : 1;
    const totalPot = calcTotalPot(countingData.current_number, stakeholderNumber);

    // If the user does not exist in the stakeholders and has not been warned before
    // warn them that they're breaking the combo and add them to the warned users list
    if (countingData.current_stakeholders
      && !countingData.current_stakeholders.split(',').includes(message.author.id)
      && !warnedUsers.includes(message.author.id)) {
      let messageReply = t('en-US', 'counting', 'newPlayerWarningBase', {
        name: message.member?.displayName ?? '',
        number: String(countingData.current_number),
      });
      if (countingData.type === 'HARDCORE') {
        messageReply += t('en-US', 'counting', 'newPlayerWarningHardcore');
      } else if (countingData.type === 'TOKEN') {
        messageReply += t('en-US', 'counting', 'newPlayerWarningToken', { tokens: String(totalPot) });
      } else {
        messageReply += t('en-US', 'counting', 'newPlayerWarningNormal');
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

      await message.channel.send({
        content: messageReply,
        allowedMentions: { parse: [] },
      });
      return;
    }

    countingData.last_number = countingData.current_number;
    countingData.last_number_message_id = countingData.current_number_message_id;
    countingData.last_number_message_date = countingData.current_number_message_date;
    countingData.last_number_message_author = countingData.current_number_message_author;
    countingData.last_number_broken_by = message.author.id;
    countingData.last_number_broken_date = new Date();

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
      recordMessage = t('en-US', 'counting', 'newRecord', {
        number: String(countingData.current_number),
        user: String(recordUser),
        breaker: String(message.author),
      });
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
      endingMessage = t('en-US', 'counting', 'hardcoreTimeout');
    } else if (countingData.type === 'TOKEN') {
      endingMessage = t('en-US', 'counting', 'tokenSteal', { tokens: String(totalPot) });
    } else {
      endingMessage = t('en-US', 'counting', 'normalEnding');
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

    await message.channel.send({
      embeds: [
        embedTemplate()
          .setTitle(t('en-US', 'counting', 'comboTitle'))
          .setColor(Colors.Red)
          .setDescription(stripIndents`${t('en-US', 'counting', 'comboDesc', { user: String(message.author), record: recordMessage, ending: endingMessage })}`),
      ],
    });

    const resetTime = new Date(new Date().getTime() + 10 * 1000);
    const newMessage = await message.channel.send(t('en-US', 'counting', 'startingGame', { time: time(resetTime, 'R') }));
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
      let welcomeMessage = t('en-US', 'counting', 'welcomeBase', { name: message.member?.displayName ?? '' });
      if (countingData.type === 'TOKEN') {
        welcomeMessage += t('en-US', 'counting', 'welcomeToken');
      } else if (countingData.type === 'HARDCORE') {
        welcomeMessage += t('en-US', 'counting', 'welcomeHardcore');
      }

      await message.channel.send({
        content: welcomeMessage,
        allowedMentions: { parse: [] },
      });
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
    await Promise.all(stakeholderIds.map(async discordId => {
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
      .setTitle(t('en-US', 'counting', 'paydayTitle'))
      .setColor(Colors.Green)
      .setDescription(stripIndents`${t('en-US', 'counting', 'paydayDesc', { total: String(totalPot), users: String(stakeholderNumber), perUser: String(potPerUser) })}`)
      .setFooter({ text: t('en-US', 'counting', 'paydayFooter') });

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
    .setNameLocalizations(getCommandLocalizations('counting', 'commandName'))
    .setDescription(t('en-US', 'counting', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('counting', 'commandDescription'))
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('setup')
      .setDescription(t('en-US', 'counting', 'setupSubcommand'))
      .addStringOption(option => option
        .setDescription(t('en-US', 'counting', 'typeOption'))
        .setDescriptionLocalizations(getCommandLocalizations('counting', 'typeOption'))
        .setName('type')
        .addChoices(
          { name: 'Hardcore', value: 'HARDCORE' },
          { name: 'Token', value: 'TOKEN' },
          { name: 'Normal', value: 'NORMAL' },
        )))
    .addSubcommand(subcommand => subcommand
      .setName('scores')
      .setDescription(t('en-US', 'counting', 'scoresSubcommand'))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(t('en-US', 'counting', 'ephemeralOption'))
        .setDescriptionLocalizations(getCommandLocalizations('counting', 'ephemeralOption'))))
    .addSubcommand(subcommand => subcommand
      .setName('reset')
      .setDescription(t('en-US', 'counting', 'resetSubcommand'))
      .addIntegerOption(option => option
        .setDescription(t('en-US', 'counting', 'numberOption'))
        .setDescriptionLocalizations(getCommandLocalizations('counting', 'numberOption'))
        .setName('number'))
      .addBooleanOption(option => option
        .setName('purge')
        .setDescription(t('en-US', 'counting', 'purgeOption'))
        .setDescriptionLocalizations(getCommandLocalizations('counting', 'purgeOption')))
      .addStringOption(option => option
        .setDescription(t('en-US', 'counting', 'typeOption'))
        .setDescriptionLocalizations(getCommandLocalizations('counting', 'typeOption'))
        .setName('type')
        .addChoices(
          { name: 'Hardcore', value: 'HARDCORE' },
          { name: 'Token', value: 'TOKEN' },
          { name: 'Normal', value: 'NORMAL' },
        )))
    .addSubcommand(subcommand => subcommand
      .setName('end')
      .setDescription(t('en-US', 'counting', 'endSubcommand'))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'counting');
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const command = interaction.options.getSubcommand();
    let response = { content: t(locale, 'counting', 'notSetupYet') } as InteractionEditReplyOptions;
    if (command === 'setup') {
      if (!await checkChannelPermissions(
        (interaction.channel as TextChannel),
        [
          'ManageChannel' as PermissionResolvable,
        ],
      )) {
        return interaction.editReply({
          embeds: [embedTemplate()
            .setTitle(t(locale, 'counting', 'noPermissionError'))
            .setColor(Colors.Red)],
        });
      }
      response = await countingSetup(
        interaction.channel as TextChannel,
        (interaction.options.getString('type') ?? 'NORMAL') as 'HARDCORE' | 'TOKEN' | 'NORMAL',
        0,
        false,
        true,
        locale,
      );
    }
    if (command === 'scores') {
      response = await countingScores(interaction);
    }
    if (command === 'reset') {
      if (!await checkChannelPermissions(
        (interaction.channel as TextChannel),
        [
          'ManageChannel' as PermissionResolvable,
        ],
      )) {
        return interaction.editReply({
          embeds: [embedTemplate()
            .setTitle(t(locale, 'counting', 'noPermissionError'))
            .setColor(Colors.Red)],
        });
      }

      response = await countingReset(interaction);
    }
    return interaction.editReply(response);
  },
};

export default counting;
