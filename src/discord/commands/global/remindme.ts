import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../utils/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {parseDuration} from '../../../global/utils/parseDuration';
import ms from 'ms';
import env from '../../../global/utils/env.config';
import logger from '../../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

export const discordTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('remindme')
      .setDescription('Set a reminder!')
      .addStringOption((option) => option.setName('offset')
          .setDescription('When? EG: 4 hours 32 mins')
          .setRequired(true))
      .addStringOption((option) => option.setName('reminder')
          .setDescription('What do you want to be reminded?')
          .setRequired(true)),
  async execute(interaction) {
    const offset = interaction.options.getString('offset');
    const reminder = interaction.options.getString('reminder');
    const actor = interaction.user;

    const reminderDatetime = new Date();
    if (offset) {
      const out = await parseDuration(offset);
      // logger.debug(`[${PREFIX}] out: ${out}`);
      reminderDatetime.setTime(reminderDatetime.getTime() + out);
    }
    logger.debug(`[${PREFIX}] reminderDatetime: ${reminderDatetime}`);

    if (global.db) {
      const ref = db.ref(`${env.FIREBASE_DB_TIMERS}/${actor.id}`);
      ref.update({
        [reminderDatetime.valueOf()]: {
          type: 'reminder',
          value: reminder,
        },
      });
    }

    const timeBetween = reminderDatetime.valueOf() - new Date().valueOf();

    const embed = embedTemplate()
        .setDescription(`In ${ms(timeBetween, {long: true})} I will remind you: ${reminder}`);

    interaction.reply({embeds: [embed], ephemeral: true});

    logger.debug(`[${PREFIX}] finished!`);
  },
};
