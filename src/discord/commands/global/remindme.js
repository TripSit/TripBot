'use strict';

// TODO: Luxon
const path = require('path');
const ms = require('ms');
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');
const { getUserInfo, setUserInfo } = require('../../../global/services/firebaseAPI');
const parseDuration = require('../../../global/utils/parseDuration');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remindme')
    .setDescription('Set a reminder!')
    .addStringOption(option => option.setName('offset')
      .setDescription('When? EG: 4 hours 32 mins')
      .setRequired(true))
    .addStringOption(option => option.setName('reminder')
      .setDescription('What do you want to be reminded?')
      .setRequired(true)),
  async execute(interaction) {
    const offset = interaction.options.getString('offset');
    const reminder = interaction.options.getString('reminder');
    const actor = interaction.user;

    const reminderDatetime = new Date();
    if (offset) {
      const out = await parseDuration.execute(offset);
      // logger.debug(`[${PREFIX}] out: ${out}`);
      reminderDatetime.setTime(reminderDatetime.getTime() + out);
    }
    logger.debug(`[${PREFIX}] reminderDatetime: ${reminderDatetime}`);

    // Extract actor data
    const [actorData, actorFbid] = await getUserInfo(actor);

    // Transform actor data
    if ('reminders' in actorData) {
      actorData.reminders[reminderDatetime] = reminder;
    } else {
      actorData.reminders = { [reminderDatetime]: reminder };
    }

    // Load actor data
    await setUserInfo(actorFbid, actorData);

    // logger.debug(`[${PREFIX}] userDb: ${JSON.stringify(global.userDb)}`);

    const timeBetween = reminderDatetime - new Date();

    const embed = template.embedTemplate()
      .setDescription(`In ${ms(timeBetween, { long: true })} I will remind you: ${reminder}`);

    interaction.reply({ embeds: [embed], ephemeral: true });

    logger.debug(`[${PREFIX}] finished!`);
  },
};
