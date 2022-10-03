import {
  SlashCommandBuilder,
  GuildMember,
} from 'discord.js';
import {SlashCommand1} from '../../@types/commandDef';
import {birthday} from '../../../global/commands/g.birthday';
// import logger from '../../../global/utils/logger';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

export const dbirthday: SlashCommand1 = {
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
  execute: async (interaction) => {
    let command = interaction.options.getSubcommand() as 'get' | 'set' | undefined;
    let user = interaction.options.getMember('user');
    const month = interaction.options.getString('month')!;
    const day = interaction.options.getInteger('day')!;

    if (command === undefined) {
      command = 'get';
    }

    if (user === null) {
      user = interaction.member;
    }

    const response = await birthday(command, (user as GuildMember), month, day);

    if (command === 'get') {
      await interaction.reply(response);
    } else {
      await interaction.reply({content: response, ephemeral: true});
    }
    return true;
  },
};
