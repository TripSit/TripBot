import {
  SlashCommandBuilder,
  GuildMember,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {birthday} from '../../../global/commands/g.birthday';
import {startLog} from '../../utils/startLog';
// import log from '../../../global/utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

export const dbirthday: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('birthday')
    .setDescription('Birthday info!')
    .addSubcommand((subcommand) => subcommand
      .setName('get')
      .setDescription('Get someone\'s birthday!')
      .addUserOption((option) => option
        .setName('user')
        .setDescription('User to lookup'),
      ),
    )
    .addSubcommand((subcommand) => subcommand
      .setName('set')
      .setDescription('Set your birthday!')
      .addStringOption((option) => option
        .setRequired(true)
        .setDescription('Month value')
        .addChoices(
          {name: 'January', value: 'January'},
          {name: 'February', value: 'February'},
          {name: 'March', value: 'March'},
          {name: 'April', value: 'April'},
          {name: 'May', value: 'May'},
          {name: 'June', value: 'June'},
          {name: 'July', value: 'July'},
          {name: 'August', value: 'August'},
          {name: 'September', value: 'September'},
          {name: 'October', value: 'October'},
          {name: 'November', value: 'November'},
          {name: 'December', value: 'December'},
        )
        .setName('month'))
      .addIntegerOption((option) => option
        .setRequired(true)
        .setDescription('Day value')
        .setName('day')),
    ),
  async execute(interaction) {
    startLog(PREFIX, interaction);
    let command = interaction.options.getSubcommand() as 'get' | 'set' | undefined;
    let member = interaction.options.getMember('user') as GuildMember;
    const month = interaction.options.getString('month');
    const day = interaction.options.getInteger('day');

    if (command === 'set' && (month === null || day === null)) {
      await interaction.reply({content: 'You need to specify a month and day!', ephemeral: true});
      return false;
    }

    if (command === undefined) {
      command = 'get';
    }

    if (member === null) {
      member = interaction.member as GuildMember;
    }

    const response = await birthday(command, (member as GuildMember).id, month, day);

    if (command === 'get') {
      await interaction.reply(`${member.displayName} ${response}`);
    } else {
      await interaction.reply({content: `${member.displayName} ${response}`, ephemeral: true});
    }
    return true;
  },
};
