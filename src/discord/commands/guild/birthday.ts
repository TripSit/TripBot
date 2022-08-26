import {
  // EmbedBuilder,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import env from '../../../env.config';
import {SlashCommand} from '../../utils/commandDef';
import logger from '../../../global/utils/logger';
import {embedTemplate} from '../../utils/embedTemplate';
const PREFIX = require('path').parse(__filename).name;

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

    // TODO: Use luxon
    const month30 = ['April', 'June', 'September', 'November'];
    const month31 = ['January', 'March', 'May', 'July', 'August', 'October', 'December'];
    if (month !== null && day !== null) {
      if (month30.includes(month) && day > 30) {
        embed.setDescription(`${month} only has 30 days!`);
        interaction.reply({embeds: [embed], ephemeral: true});
        return;
      }
      if (month31.includes(month) && day > 31) {
        embed.setDescription(`${month} only has 31 days!`);
        interaction.reply({embeds: [embed], ephemeral: true});
        return;
      }
      if (month === 'February' && day > 28) {
        embed.setDescription('February only has 28 days!');
        interaction.reply({embeds: [embed], ephemeral: true});
        return;
      }
    }
    const birthday = [month, day];

    logger.debug(`[${PREFIX}] Setting ${interaction.user.id}/birthday = ${birthday}`);
    const ref = db.ref(`${env.FIREBASE_DB_USERS}/${interaction.user.id}/birthday`);
    ref.set(birthday);
    embed.setDescription(`${birthday[0]} ${birthday[1]} is your new birthday!`);
    interaction.reply({embeds: [embed], ephemeral: true});
    logger.debug(`[${PREFIX}] finished!`);
  },
};
