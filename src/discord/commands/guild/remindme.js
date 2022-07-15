'use strict';

// TODO: Luxon
const path = require('path');
const ms = require('ms');
const { SlashCommandBuilder } = require('@discordjs/builders');
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
    const set = await setUserInfo(actorFbid, actorData);

    logger.debug(`[${PREFIX}] global.userDb: ${JSON.stringify(global.userDb)}`);
    const userDb = [];
    if (Object.keys(global.userDb).length > 0) {
      global.userDb.forEach(doc => {
        if (doc.key === actorFbid) {
          userDb.push({
            key: doc.key,
            value: actorData,
          });
          logger.debug(`[${PREFIX}] Updated actor in userDb`);
        } else {
          userDb.push({
            key: doc.key,
            value: doc.value,
          });
        }
      });
    } else {
      const keyString = Math.random().toString(36).substring(2, 10);
      userDb.push({
        // Get random string of 8 characters
        key: keyString,
        value: actorData,
      });
    }
    Object.assign(global, { userDb });
    logger.debug(`[${PREFIX}] Updated global user data.`);

    logger.debug(`[${PREFIX}] userDb: ${JSON.stringify(global.userDb)}`);

    const timeBetween = reminderDatetime - new Date();

    const embed = template.embedTemplate()
      .setDescription(`In ${ms(timeBetween, { long: true })} I will remind you: ${reminder}`)

    if (!set) {
      embed.addFields(
        { name: 'Warning', value: 'Could not connec to firebase', inline: true },
      );
    }

    interaction.reply({ embeds: [embed], ephemeral: true });

    logger.debug(`[${PREFIX}] finished!`);
  },
};
