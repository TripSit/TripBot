import {
  SlashCommandBuilder,
  GuildMember,
  ChatInputCommandInteraction,
  MessageFlags,
} from 'discord.js';
import { DateTime } from 'luxon';
import { SlashCommand } from '../../@types/commandDef';
import { birthday } from '../../../global/commands/g.birthday';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';
// import log from '../../../global/utils/log';

const F = f(__filename);

async function birthdayGet(
  interaction:ChatInputCommandInteraction,
  member:GuildMember,
  locale: string,
) {
  log.info(F, await commandContext(interaction));
  const embed = embedTemplate();

  const response = await birthday('get', member.id, null, null);

  if (response === null) {
    embed.setTitle(t(locale, 'birthday', 'immortalTitle', { name: member.displayName }));
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  embed.setTitle(t(locale, 'birthday', 'birthdayTitle', { name: member.displayName, date: response.toFormat('LLLL d') }));
  const now = DateTime.utc();
  const birthdayDate = response;
  const birthdayThisYear = birthdayDate.set({ year: now.year });
  const birthdayNextYear = birthdayDate.set({ year: now.year + 1 });
  const daysUntilBirthday = birthdayThisYear.diff(now, 'days').toObject().days as number;
  const daysUntilBirthdayNextYear = birthdayNextYear.diff(now, 'days').toObject().days as number;
  let daysUntil = daysUntilBirthday;
  if (daysUntilBirthday < 0) {
    daysUntil = daysUntilBirthdayNextYear;
  }
  if (daysUntil === 0) {
    embed.setDescription(t(locale, 'birthday', 'happyBirthday'));
  } else {
    embed.setDescription(t(locale, 'birthday', 'daysLeft', { days: daysUntil.toFixed(0) }));
  }
  await interaction.editReply({ embeds: [embed] });
}

async function birthdaySet(
  interaction:ChatInputCommandInteraction,
  member:GuildMember,
  monthInput:string | null,
  day:number | null,
  locale: string,
) {
  let month = 0 as number;

  if (!monthInput) {
    await interaction.editReply({ content: t(locale, 'birthday', 'noMonthError') });
    return;
  }

  if (!day || day < 1) {
    await interaction.editReply({ content: t(locale, 'birthday', 'noDayError') });
    return;
  }

  const month30 = ['april', 'june', 'september', 'november'];
  const month31 = ['january', 'march', 'may', 'july', 'august', 'october', 'december'];
  if (month30.includes(monthInput.toLowerCase()) && day > 30) {
    await interaction.editReply({ content: t(locale, 'birthday', 'tooManyDays30Error', { month: monthInput }) });
    return;
  }
  if (month31.includes(monthInput.toLowerCase()) && day > 31) {
    await interaction.editReply({ content: t(locale, 'birthday', 'tooManyDays31Error', { month: monthInput }) });
    return;
  }
  if (monthInput.toLowerCase() === 'february' && day > 28) {
    await interaction.editReply({ content: t(locale, 'birthday', 'februaryError') });
    return;
  }
  // const monthDict = {
  //   'january': 0,
  //   'february': 1,
  //   'march': 2,
  //   'april': 3,
  //   'may': 4,
  //   'june': 5,
  //   'july': 6,
  //   'august': 7,
  //   'september': 8,
  //   'october': 9,
  //   'november': 10,
  //   'december': 11,
  // };

  const monthDict = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12,
  };

  month = monthDict[monthInput.toLowerCase() as keyof typeof monthDict];

  const response = await birthday('set', member.id, month, day);
  const embed = embedTemplate();
  embed.setTitle(t(locale, 'birthday', 'setBirthdayTitle', { date: (response as DateTime).toFormat('LLLL d') }));
  await interaction.editReply({ embeds: [embed] });
}

export const dBirthday: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('birthday')
    .setNameLocalizations(getCommandLocalizations('birthday', 'commandName'))
    .setDescription(t('en-US', 'birthday', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('birthday', 'commandDescription'))
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('get')
      .setDescription(t('en-US', 'birthday', 'getSubcommand'))
      .addUserOption(option => option
        .setName('user')
        .setDescription(t('en-US', 'birthday', 'userOption'))
        .setDescriptionLocalizations(getCommandLocalizations('birthday', 'userOption')))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(t('en-US', 'birthday', 'ephemeralOption'))
        .setDescriptionLocalizations(getCommandLocalizations('birthday', 'ephemeralOption'))))
    .addSubcommand(subcommand => subcommand
      .setName('set')
      .setDescription(t('en-US', 'birthday', 'setSubcommand'))
      .addStringOption(option => option
        .setRequired(true)
        .setDescription(t('en-US', 'birthday', 'monthOption'))
        .setDescriptionLocalizations(getCommandLocalizations('birthday', 'monthOption'))
        .addChoices(
          { name: 'January', value: 'January' },
          { name: 'February', value: 'February' },
          { name: 'March', value: 'March' },
          { name: 'April', value: 'April' },
          { name: 'May', value: 'May' },
          { name: 'June', value: 'June' },
          { name: 'July', value: 'July' },
          { name: 'August', value: 'August' },
          { name: 'September', value: 'September' },
          { name: 'October', value: 'October' },
          { name: 'November', value: 'November' },
          { name: 'December', value: 'December' },
        )
        .setName('month'))
      .addIntegerOption(option => option
        .setRequired(true)
        .setDescription(t('en-US', 'birthday', 'dayOption'))
        .setDescriptionLocalizations(getCommandLocalizations('birthday', 'dayOption'))
        .setName('day'))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'birthday');
    let command = interaction.options.getSubcommand() as 'get' | 'set' | undefined;
    if (command === 'set') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    } else {
      const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
      await interaction.deferReply({ flags: ephemeral });
    }
    let member = interaction.options.getMember('user');
    const monthInput = interaction.options.getString('month');
    const day = interaction.options.getInteger('day');

    if (command === undefined) {
      command = 'get';
    }

    if (command === 'set') {
      if (member === null) {
        member = interaction.member as GuildMember;
      } else {
        member = member as GuildMember;
      }
      await birthdaySet(interaction, member, monthInput, day, locale);
    }

    if (command === 'get') {
      if (member === null) {
        member = interaction.member as GuildMember;
      } else {
        member = member as GuildMember;
      }
      await birthdayGet(interaction, member, locale);
    }
    return true;
  },
};

export default dBirthday;
