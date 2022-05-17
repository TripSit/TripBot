'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');
const { getUserInfo, setUserInfo } = require('../../utils/firebase');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('birthday')
    .setDescription('Get birthday info!')
    .addSubcommand(subcommand => subcommand
      .setName('set')
      .setDescription('Set your own birthday')
      .addStringOption(option => option
        .setRequired(true)
        .setName('month')
        .setDescription('Month value')
        .addChoice('January', 'January')
        .addChoice('February', 'February')
        .addChoice('March', 'March')
        .addChoice('April', 'April')
        .addChoice('May', 'May')
        .addChoice('June', 'June')
        .addChoice('July', 'July')
        .addChoice('August', 'August')
        .addChoice('September', 'September')
        .addChoice('October', 'October')
        .addChoice('November', 'November')
        .addChoice('December', 'December'))
      .addIntegerOption(option => option
        .setName('day')
        .setDescription('Day value')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('get')
      .setDescription('Get someone\'s birthday!')
      .addUserOption(option => option
        .setName('user')
        .setDescription('User to lookup!')
        .setRequired(true))),

  async execute(interaction) {
    const embed = template.embedTemplate();
    const month = interaction.options.getString('month');
    const day = interaction.options.getInteger('day');

    // TODO: Use luxon
    const month30 = ['April', 'June', 'September', 'November'];
    const month31 = ['January', 'March', 'May', 'July', 'August', 'October', 'December'];
    if (month30.includes(month) && day > 30) {
      embed.setDescription(`${month} only has 30 days!`);
      interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }
    if (month31.includes(month) && day > 31) {
      embed.setDescription(`${month} only has 31 days!`);
      interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }
    if (month === 'February' && day > 28) {
      embed.setDescription('February only has 28 days!');
      interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }
    const birthday = [month, day];

    let target = interaction.options.getMember('user');
    if (!target) { target = interaction.member; }
    const actor = interaction.member;

    let command = '';
    try {
      command = interaction.options.getSubcommand();
    } catch (err) {
      command = 'get';
    }

    if (command === 'set') {
      logger.debug(`${PREFIX} Birthday: ${month} ${day}`);

      const actorResults = await getUserInfo(actor);
      const actorData = actorResults[0];
      if ('birthday' in actorData) {
        if (actorData.birthday === birthday) {
          embed.setDescription(`${birthday[0]} ${birthday[1]} already is your birthday, you don't need to update it!`);
          interaction.reply({ embeds: [embed], ephemeral: true });
          logger.debug(`[${PREFIX}] Done!!`);
          return;
        }
      }

      actorData.birthday = birthday;

      await setUserInfo(actorResults[1], actorData);

      embed.setDescription(`I set your birthday to ${birthday[0]} ${birthday[1]}`);
      interaction.reply({ embeds: [embed], ephemeral: true });
      logger.debug(`[${PREFIX}] Done!!`);
      return;
    }
    if (command === 'get') {
      let storedDate = [];

      const targetResults = await getUserInfo(target);
      const targetData = targetResults[0];

      if ('birthday' in targetData) {
        storedDate = targetData.birthday;
      }
      logger.debug(`[${PREFIX}] Birthday: ${storedDate}`);

      if (!storedDate[0]) {
        embed.setDescription(`${target.user.username} is ageless (and has not set a birthday)!`);
        interaction.reply({ embeds: [embed], ephemeral: false });
        logger.debug(`[${PREFIX}] Done!!`);
        return;
      }

      // get the user's timezone from the database
      embed.setDescription(`${target.user.username} was born on ${storedDate[0]} ${storedDate[1]}`);
      if (!interaction.replied) {
        interaction.reply({ embeds: [embed], ephemeral: false });
      } else {
        interaction.followUp({ embeds: [embed], ephemeral: false });
      }
      logger.debug(`[${PREFIX}] finished!`);
    }
  },
};
