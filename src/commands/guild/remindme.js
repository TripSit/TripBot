'use strict';

// TODO: Luxon
const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');
const { getUserInfo, setUserInfo } = require('../../utils/firebase');

const PREFIX = path.parse(__filename).name;

const { db } = global;
const { usersDbName } = require('../../../env');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remindme')
    .setDescription('Set a reminder!')
    .addIntegerOption(option => option.setName('duration')
      .setDescription('How long?')
      .setRequired(true))
    .addStringOption(option => option.setName('units')
      .setDescription('What units?')
      .setRequired(true)
      .addChoice('Minutes', 'minute')
      .addChoice('Hours', 'hour')
      .addChoice('Days', 'day')
      .addChoice('Weeks', 'week')
      .addChoice('Months', 'month')
      .addChoice('Years', 'year'))
    .addStringOption(option => option.setName('reminder')
      .setDescription('What do you want to be reminded?')
      .setRequired(true)),

  async execute(interaction) {
    const duration = interaction.options.getInteger('duration');
    const units = interaction.options.getString('units');
    const reminder = interaction.options.getString('reminder');
    const actor = interaction.user;

    const seconds = duration * (units === 'minute' ? 60 : units === 'hour' ? 3600 : units === 'day' ? 86400 : units === 'week' ? 604800 : units === 'month' ? 2592000 : units === 'year' ? 31536000 : 0); // eslint-disable-line
    const unixFutureTime = Math.floor(Date.now() / 1000) + seconds;

    // Extract actor data
    const [actorData, actorFbid] = await getUserInfo(actor);

    // Transform actor data
    if ('reminders' in actorData) {
      actorData.reminders[unixFutureTime] = reminder;
    } else {
      actorData.reminders = { [unixFutureTime]: reminder };
    }

    // Load actor data
    await setUserInfo(actorFbid, actorData);

    // Update global reminder data
    // logger.debug(`[${PREFIX}] updating global reminder data`);
    // logger.debug(`[${PREFIX}] global reminder data: ${usersDbName}`);
    // const snapshotUser = await db.collection(usersDbName).get();
    // const userDb = snapshotUser.map(doc => ({
    //   key: doc.id,
    //   value: doc.data(),
    // }));
    // global.userDb = userDb;

    // Reverting to previous forEach()
    const userDb = [];
    const snapshotUser = await db.collection(usersDbName).get();
    snapshotUser.forEach(doc => {
      userDb.push({
        key: doc.id,
        value: doc.data(),
      });
    });
    global.userDb = userDb;
    logger.debug(`${PREFIX}: Updated global user data.`);

    const embed = template.embedTemplate()
      .setDescription(`In ${duration} ${units} I will remind you: ${reminder}`);
    interaction.reply({ embeds: [embed], ephemeral: true });
    logger.debug(`[${PREFIX}] finished!`);
  },
};
