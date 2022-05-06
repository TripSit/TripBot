'use strict';

// TODO: Luxon
const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');
const { getUserInfo } = require('../../utils/get-user-info');
const { setUserInfo } = require('../../utils/set-user-info');

const PREFIX = path.parse(__filename).name;

const { db } = global;
const { users_db_name: users_db_name } = process.env;

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
    const unix_future_time = Math.floor(Date.now() / 1000) + seconds;

    // Extract actor data
    const actor_results = await getUserInfo(actor);
    const actor_data = actor_results[0];

    // Transform actor data
    if ('reminders' in actor_data) {
      actor_data.reminders[unix_future_time] = reminder;
    }
    else {
      actor_data.reminders = { [unix_future_time]: reminder };
    }

    // Load actor data
    await setUserInfo(actor_results[1], actor_data);

    // Update global reminder data
    // logger.debug(`[${PREFIX}] updating global reminder data`);
    // logger.debug(`[${PREFIX}] global reminder data: ${users_db_name}`);
    // const snapshotUser = await db.collection(users_db_name).get();
    // const userDb = snapshotUser.map(doc => ({
    //   key: doc.id,
    //   value: doc.data(),
    // }));
    // global.user_db = userDb;

    // Reverting to previous forEach()
    const user_db = [];
    const snapshot_user = await db.collection(users_db_name).get();
    snapshot_user.forEach((doc) => {
        user_db.push({
            key: doc.id,
            value: doc.data(),
        });
    });
    global.user_db = user_db;
    logger.debug(`${PREFIX}: Updated global user data.`);

    const embed = template.embedTemplate()
      .setDescription(`In ${duration} ${units} I will remind you: ${reminder}`);
    interaction.reply({ embeds: [embed], ephemeral: true });
    logger.debug(`[${PREFIX}] finished!`);
  },
};
