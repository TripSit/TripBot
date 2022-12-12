import {
  SlashCommandBuilder,
  GuildMember,
  ChatInputCommandInteraction,
} from 'discord.js';
import { DateTime } from 'luxon';
import { SlashCommand } from '../../@types/commandDef';
import { birthday } from '../../../global/commands/g.birthday';
import { startLog } from '../../utils/startLog';
import { embedTemplate } from '../../utils/embedTemplate';
// import log from '../../../global/utils/log';

const F = f(__filename);

async function birthdayGet(
  interaction:ChatInputCommandInteraction,
  member:GuildMember,
) {
  const embed = embedTemplate();

  const response = await birthday('get', (member as GuildMember).id, null, null);

  if (response === null) {
    embed.setTitle(`${member.displayName} is immortal! (Or has not set their birthday...)`);
    await interaction.reply({ embeds: [embed] });
    return;
  }
  embed.setTitle(`${member.displayName}'s birthday is ${(response as DateTime).toFormat('LLLL d')}`);
  // Determine how long until the birthday, even if the year is different
  const now = DateTime.utc();
  const birthdayDate = response as DateTime;
  const birthdayThisYear = birthdayDate.set({ year: now.year });
  const birthdayNextYear = birthdayDate.set({ year: now.year + 1 });
  const daysUntilBirthday = birthdayThisYear.diff(now, 'days').toObject().days as number;
  const daysUntilBirthdayNextYear = birthdayNextYear.diff(now, 'days').toObject().days as number;
  let daysUntil = daysUntilBirthday;
  if (daysUntilBirthday < 0) {
    daysUntil = daysUntilBirthdayNextYear;
  }
  if (daysUntil === 0) {
    embed.setDescription('Happy birthday!');
  } else {
    embed.setDescription(`Only ${daysUntil.toFixed(0)} days left!`);
  }
  await interaction.reply({ embeds: [embed] });
}

async function birthdaySet(
  interaction:ChatInputCommandInteraction,
  member:GuildMember,
  monthInput:string | null,
  day:number | null,
) {
  let month = 0 as number;

  if (!monthInput) {
    await interaction.reply({ content: 'You need to specify a month!', ephemeral: true });
    return;
  }

  if (!day) {
    await interaction.reply({ content: 'You need to specify a day!', ephemeral: true });
    return;
  }

  const month30 = ['april', 'june', 'september', 'november'];
  const month31 = ['january', 'march', 'may', 'july', 'august', 'october', 'december'];
  if (monthInput !== undefined && day !== undefined) {
    if (month30.includes(monthInput.toLowerCase()) && day > 30) {
      const response = `${monthInput} only has 30 days!` as string;
      // log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
      interaction.reply({ content: response, ephemeral: true });
      return;
    }
    if (month31.includes(monthInput.toLowerCase()) && day > 31) {
      const response = `${monthInput} only has 31 days!` as string;
      // log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
      interaction.reply({ content: response, ephemeral: true });
      return;
    }
    if (monthInput.toLowerCase() === 'february' && day > 28) {
      const response = 'February only has 28 days!' as string;
      // log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
      interaction.reply({ content: response, ephemeral: true });
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

    const response = await birthday('set', (member as GuildMember).id, month, day);
    const embed = embedTemplate();
    embed.setTitle(`Set your birthday to ${(response as DateTime).toFormat('LLLL d')}`);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}

export default dBirthday;

export const dBirthday: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('birthday')
    .setDescription('Birthday info!')
    .addSubcommand(subcommand => subcommand
      .setName('get')
      .setDescription('Get someone\'s birthday!')
      .addUserOption(option => option
        .setName('user')
        .setDescription('User to lookup')))
    .addSubcommand(subcommand => subcommand
      .setName('set')
      .setDescription('Set your birthday!')
      .addStringOption(option => option
        .setRequired(true)
        .setDescription('Month value')
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
        .setDescription('Day value')
        .setName('day'))),
  async execute(interaction) {
    startLog(F, interaction);
    let command = interaction.options.getSubcommand() as 'get' | 'set' | undefined;
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
      await birthdaySet(interaction, member, monthInput, day);
    }

    if (command === 'get') {
      if (member === null) {
        member = interaction.member as GuildMember;
      } else {
        member = member as GuildMember;
      }
      await birthdayGet(interaction, member);
    }
    return true;
  },
};
