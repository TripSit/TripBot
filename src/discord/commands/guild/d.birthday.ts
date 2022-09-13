import {
  // EmbedBuilder,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {setBirthday} from '../../../global/commands/g.birthday';
import logger from '../../../global/utils/logger';
import {embedTemplate} from '../../utils/embedTemplate';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const birthday: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('birthday')
      .setDescription('Set your birthday info!')
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
  execute: async (interaction: ChatInputCommandInteraction) => {
    const embed = embedTemplate();
    const month = interaction.options.getString('month');
    const day = interaction.options.getInteger('day');

    const response = await setBirthday(interaction.user.id, month!, day!);

    embed.setDescription(response);
    interaction.reply({embeds: [embed], ephemeral: true});
    logger.debug(`[${PREFIX}] finished!`);
  },
};
