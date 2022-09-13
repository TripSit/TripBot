import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import {SlashCommand} from '../../utils/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import logger from '../../../global/utils/logger';
import env from '../../../global/utils/env.config';
import timezones from '../../../global/assets/data/timezones.json';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const time: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('time')
      .setDescription('Set your own timezone')
      .addStringOption((option) => option
          .setName('timezone')
          .setDescription('Timezone value')
          .setRequired(true)
          .setAutocomplete(true)),
  async execute(interaction:ChatInputCommandInteraction) {
    const timezone = interaction.options.getString('timezone');

    logger.debug(`[${PREFIX}] timezone: ${timezone}`);
    // define offset as the value from the timezones array
    let tzCode = '';
    for (let i = 0; i < timezones.length; i += 1) {
      if (timezones[i].label === timezone) {
        tzCode = timezones[i].tzCode;
        logger.debug(`[${PREFIX}] tzCode: ${tzCode}`);
      }
    }
    // logger.debug(`[${PREFIX}] actor.id: ${actor.id}`);

    if (global.db) {
      const ref = db.ref(`${env.FIREBASE_DB_USERS}/${interaction.user.id}/timezone`);
      await ref.once('value', (data:any) => {
        if (data.val() !== null) {
          logger.debug(`[${PREFIX}] data.val(): ${data.val()}`);

          if (data.val() === tzCode) {
            const embed = embedTemplate()
                .setDescription(`${timezone} already is your timezone, you don't need to update it!`);
            interaction.reply({embeds: [embed], ephemeral: true});
            logger.debug(`[${PREFIX}] finished!`);
            return;
          }
          ref.update(tzCode);
          const embed = embedTemplate().setDescription(`I updated your timezone to ${timezone}`);
          interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
          logger.debug(`[${PREFIX}] finished!`);
          return;
        }
        logger.debug(`[${PREFIX}] tzCode: ${tzCode}`);
        ref.set(tzCode);
        const embed = embedTemplate().setDescription(`I set your timezone to ${timezone}`);
        interaction.reply({
          embeds: [embed],
          ephemeral: true,
        });
        logger.debug(`[${PREFIX}] finished!`);
        return;
      });
    }
  },
};
