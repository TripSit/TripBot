import {
  // ActionRowBuilder,
  // ModalBuilder,
  // TextInputBuilder,
  // Colors,
  SlashCommandBuilder,
  // ModalSubmitInteraction,
  ChatInputCommandInteraction,
  Message,
  TextChannel,
  InteractionEditReplyOptions,
  time,
  Colors,
  PermissionResolvable,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommandBeta } from '../../@types/commandDef';
// import { embedTemplate } from '../../utils/embedTemplate';
// import { globalTemplate } from '../../../global/commands/_g.template';
import { startLog } from '../../utils/startLog';
import { countingGetG, countingSetG } from '../../../global/commands/g.counting';
import { sleep } from './d.bottest';
import { embedTemplate } from '../../utils/embedTemplate';
import { Counting } from '../../../global/@types/database';
import { getUser, personaGet, personaSet } from '../../../global/utils/knex';
import { checkChannelPermissions } from '../../utils/checkPermissions';
// import { getUser } from '../../../global/utils/knex';

export default counting;

const F = f(__filename);

function calcTotalPot(
  number:number,
  users:number,
):number {
  log.debug(F, `number: ${number}, users: ${users}`);
  return Math.floor(((number * 10) * (number / 10)) * users);
}

export const counting: SlashCommandBeta = {
  data: new SlashCommandBuilder()
    .setName('counting')
    .setDescription('All things with counting!')
    .addSubcommand(subcommand => subcommand
      .setName('setup')
      .setDescription('Set up a Counting channel!')
      .addStringOption(option => option
        .setDescription('What kind of counting game?')
        .setName('type')
        .addChoices(
          { name: 'Hardcore', value: 'HARDCORE' },
          { name: 'Token', value: 'TOKEN' },
          { name: 'Normal', value: 'NORMAL' },
        )))
    .addSubcommand(subcommand => subcommand
      .setName('scores')
      .setDescription('Get the scores for a Counting channel!')
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')))
    .addSubcommand(subcommand => subcommand
      .setName('reset')
      .setDescription('Reset the counting channel!')
      .addIntegerOption(option => option
        .setDescription('The number to set the channel to')
        .setName('number'))
      .addStringOption(option => option
        .setDescription('What kind of counting game?')
        .setName('type')
        .addChoices(
          { name: 'Hardcore', value: 'HARDCORE' },
          { name: 'Token', value: 'TOKEN' },
          { name: 'Normal', value: 'NORMAL' },
        )))
    .addSubcommand(subcommand => subcommand
      .setName('end')
      .setDescription('End the counting game!')),
  async execute(interaction) {
    startLog(F, interaction);
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

export async function countingSetup(
  channel:TextChannel,
  type: 'HARDCORE' | 'TOKEN' | 'NORMAL',
  startingNumber:number,
  override:boolean,
):Promise<InteractionEditReplyOptions> {
  const data = await countingGetG(channel.id);
  log.debug(F, `data: ${JSON.stringify(data)}`);

  const embed = embedTemplate();

  if (data && !override) {
    return {
      embeds: [embed.setTitle('This channel is already set up for counting! Mods can /reset or /end it!')],
    };
  }

  let description = `

  The rules are simple:
  1. You must post a number in chat that is 1 higher than the last number.
  2. You must use numbers, I'm not smart enough to understand words can be numbers
  3. You can't count twice in a row`;

  if (type === 'HARDCORE') {
    description += `
    This is a HARDCORE game which means:
    4. If you say the wrong number the count resets and **you will be timed out for 24!**`;
  }

  if (type === 'TOKEN') {
    description += `
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

  await countingSetG({
    guild_id: channel.guild.id,
    channel_id: channel.id,
    type,

    current_number: startingNumber,
    current_number_message_id: countingMessage.id,
    current_number_message_date: new Date(),
    current_number_message_author: countingMessage.author.id,
    current_stakeholders: '',

    last_number: data?.last_number ?? null,
    last_number_message_id: data?.last_number_message_id ?? null,
    last_number_message_date: data?.last_number_broken_date ?? null,
    last_number_message_author: data?.last_number_message_author ?? null,
    last_number_broken_by: data?.last_number_broken_by ?? null,
    last_number_broken_date: data?.last_number_broken_date ?? null,

    record_number: data?.record_number ?? 0,
    record_number_message_id: data?.record_number_message_id ?? null,
    record_number_message_date: data?.record_number_message_date ?? null,
    record_number_message_author: data?.record_number_message_author ?? null,
    record_number_broken_by: data?.record_number_broken_by ?? null,
    record_number_broken_date: data?.record_number_broken_date ?? null,
  } as Counting);

  return { content: 'Counting channel set up!' };
}

export async function countingScores(
  interaction:ChatInputCommandInteraction,
):Promise<InteractionEditReplyOptions> {
  // This function gets the scores for the counting channel
  const channel = interaction.channel as TextChannel;
  const data = await countingGetG(channel.id);
  log.debug(F, `Data: ${JSON.stringify(data, null, 2)}`);
  if (!data) return { content: 'This channel is not set up for counting!' };

  const currentLink = `[${data.current_number}](https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${data.current_number_message_id})`; // eslint-disable-line max-len
  const currentMember = await interaction.guild?.members.fetch(data.current_number_message_author as string);
  let description = `
  **Current Combo**
  ${currentLink} - ${currentMember} ${time(data.current_number_message_date, 'R')}`;

  if (data.last_number) {
    const lastLink = `[${data.last_number}](https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${data.last_number_message_id})`; // eslint-disable-line max-len
    const lastMember = await interaction.guild?.members.fetch(data.last_number_message_author as string);
    const lastBreaker = await interaction.guild?.members.fetch(data.last_number_broken_by as string);
    description += `

    **Last Combo**
    ${lastLink} - ${lastMember ?? 'unknown'} ${time(data.last_number_message_date as Date, 'R')}
    Broken by ${lastBreaker ?? 'unknown'} ${time(data.last_number_broken_date as Date, 'R')}`;
  }

  if (data.record_number) {
    const recordLink = `[${data.record_number}](https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${data.record_number_message_id})`; // eslint-disable-line max-len
    const recordMember = await interaction.guild?.members.fetch(data.record_number_message_author as string);
    const recordBreaker = await interaction.guild?.members.fetch(data.record_number_broken_by as string);
    description += `

    **Record Combo**
    ${recordLink} - ${recordMember ?? 'unknown'} ${time(data.record_number_message_date as Date, 'R')}
    Broken by ${recordBreaker ?? 'unknown'} ${time(data.record_number_broken_date as Date, 'R')}`;
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
  const data = await countingGetG(channel.id);
  if (!data) return { content: 'This channel is not set up for counting!' };
  const number = interaction.options.getInteger('number') ?? 0;
  await countingSetup(
    channel,
    (interaction.options.getString('type') ?? 'NORMAL') as 'HARDCORE' | 'TOKEN' | 'NORMAL',
    number,
    true,
  );
  return { embeds: [embedTemplate().setTitle(`Counting channel reset to ${number}!`)] };
}

export async function countMessage(message: Message): Promise<void> {
  if (!message.guild) return; // If not in a guild then ignore all messages
  if (message.guild.id !== env.DISCORD_GUILD_ID) return; // If not in tripsit ignore all messages
  const countingData = await countingGetG(message.channel.id);
  if (!countingData) return; // If not a counting channel then ignore all messages

  log.debug(F, `countingData: ${JSON.stringify(countingData, null, 2)} `);

  // Process the new message. If it's the next number after current_number, then update the DB
  // If it's not the next number, then still update the db with the user who broke the combo

  // log.debug(F, `Message: ${message.cleanContent}`);
  const number = parseInt(message.cleanContent, 10);
  log.debug(F, `number: ${number}`);

  log.debug(F, `isnan: ${Number.isNaN(number)}`);

  if (Number.isNaN(number)) {
    // await message.delete();
    return;
  }

  if (countingData.current_number === -1) {
    await message.delete();
    return;
  }

  // log.debug(F, `Message.author.id: ${message.author.id}`);
  // log.debug(F, `countingData.current_number_message_author: ${countingData.current_number_message_author}`);
  // log.debug(F, `env.DISCORD_OWNER_ID: ${env.DISCORD_OWNER_ID}`);
  if (countingData.current_number_message_author === message.author.id
    && message.author.id.toString() !== env.DISCORD_OWNER_ID.toString()) { // Allow the owner to spam (for testing)
    await message.delete();
    return;
  }

  if (number !== countingData.current_number + 1) {
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
    const stakeholderNumber = countingData.current_stakeholders
      ? countingData.current_stakeholders.split(',').length
      : 1;
    const totalPot = calcTotalPot(countingData.current_number, stakeholderNumber);
    if (countingData.type === 'TOKEN') {
      // If the channel is token then take tokens from the pot

      const userData = await getUser(message.author.id, null);
      const personaData = await personaGet(userData.id);

      personaData.tokens += totalPot;
      await personaSet(personaData);
    }

    let endingMessage = '';
    if (countingData.type === 'HARDCORE') {
      endingMessage = '\n\nThey were kicked from the guild for this transgression!';
    } else if (countingData.type === 'TOKEN') {
      endingMessage = `\n\nThey stole ${totalPot} tokens from the pot!`;
    } else {
      endingMessage = '\n\nMake sure to point and laugh at them!';
    }

    // Set this to -1 so that people can't start a new game while the countdown is playing
    countingData.current_number = -1;

    // Then update the DB with the user who broke the combo
    await countingSetG(countingData);

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

  if (countingData.current_stakeholders) {
    if (!countingData.current_stakeholders.includes(message.author.id)) {
    // Take countingData.current_stakeholders, turn it into an array, add the user, turn it back into a string
      log.debug(F, `current_stakeholders: ${countingData.current_stakeholders}`);

      countingData.current_stakeholders = countingData.current_stakeholders
        .split(',')
        .concat(message.author.id)
        .join(',');
      log.debug(F, `Member ${message.author.username} was added as a stakeholder`);
      let welcomeMessage = `Welcome to the counting game ${message.author.username}!`;
      if (countingData.type === 'TOKEN') {
        welcomeMessage += '\nThis is a TOKEN game: Build the pot and get tokens every 10 levels, or break the combo and steal it all!'; // eslint-disable-line max-len
      } else if (countingData.type === 'HARDCORE') {
        welcomeMessage += '\nThis is a HARDCORE game: if you break the combo you will be kicked from the guild!';
      }

      await message.channel.send(welcomeMessage);
    } else {
      log.debug(F, `Member ${message.author.username} was already a stakeholder`);
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
      const userData = await getUser(discordId, null);
      const persona = await personaGet(userData.id);
      persona.tokens += potPerUser;
      await personaSet(persona);
      return persona;
    }));

    const embed = embedTemplate()
      .setTitle('Payday!')
      .setColor(Colors.Green)
      .setDescription(stripIndents`The pot of ${totalPot} tokens has been claimed by ${stakeholderNumber} users!
      Each user has been given ${potPerUser} tokens!

      The pot grows bigger the higher the combo gets, and the amount of people who have contributed to the combo!`)
      .setFooter({ text: 'totalPot = ((currentNumber * 10) * (currentNumber / 10)) * uniqueUsers' });

    // Send a message to the channel
    await message.channel.send({
      embeds: [embed],
    });
  }

  await countingSetG(countingData);

  await message.react('👍');

  // log.debug(F, `countingData: ${JSON.stringify(countingData, null, 2)}`);
}
