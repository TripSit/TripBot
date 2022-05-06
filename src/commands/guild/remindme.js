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
const { users_db_name: usersDbName } = process.env;

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

    const actorResults = await getUserInfo(actor);
    let [actorData] = actorResults;
    let actorFBID = '';
    global.user_db.forEach(doc => {
      if (doc.value.discord_id === actor.id) {
        logger.debug(`[${PREFIX}] Found a actor match!`);
        // console.log(doc.id, '=>', doc.value);
        actorFBID = doc.key;
        logger.debug(`[${PREFIX}] actorFBID: ${actorFBID}`);
        actorData = doc.value;
      }
    });

    // Check if the actor data exists, if not create a blank one
    if (Object.keys(actorData).length === 0) {
      logger.debug(`[${PREFIX}] No actor data found, creating a blank one`);
      actorFBID = actor.id;
      actorData = {
        discord_username: actor.username,
        discord_discriminator: actor.discriminator,
        discord_id: actor.id,
        isBanned: false,
        reminders: { [unixFutureTime]: reminder },
      };
    } else {
      logger.debug(`[${PREFIX}] Found actor data, updating it`);
      Object.assign(actorData.reminders, { [unixFutureTime]: reminder });
    }
    logger.debug(`[${PREFIX}] actorFBID: ${actorFBID}`);
    // Update firebase
    logger.debug(`[${PREFIX}] Updating firebase`);
    await db.collection(usersDbName).doc(actorFBID).update({
      reminders: actorData.reminders,
    });
    // Update global db
    global.user_db.forEach(doc => {
      if (doc.key === actorFBID) {
        logger.debug(`[${PREFIX}] Updating global DB!!`);
        logger.debug(`[${PREFIX}] All reminders:`, doc.value.reminders);
        logger.debug(`[${PREFIX}] actorData.reminders:`, actorData.reminders);
        doc.value.reminders = actorData.reminders; // eslint-disable-line
        logger.debug(`[${PREFIX}] New all reminders:`, doc.value.reminders);
      }
    });

    // Load actor data
    await setUserInfo(actorResults[1], actorData);

    // Update global reminder data
    const snapshotUser = await db.collection(usersDbName).get();
    const userDb = snapshotUser.map(doc => ({
      key: doc.id,
      value: doc.data(),
    }));
    global.user_db = userDb;
    logger.debug(`${PREFIX}: Updated global user data.`);

    const embed = template.embedTemplate()
      .setDescription(`In ${duration} ${units} I will remind you: ${reminder}`);
    interaction.reply({ embeds: [embed], ephemeral: true });
    logger.debug(`[${PREFIX}] finished!`);
  },
};
