/* eslint-disable no-unused-vars */
import {
  time,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Colors,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {parseDuration} from '../../../global/utils/parseDuration';
import env from '../../../global/utils/env.config';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const bug: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('dramacounter')
      .setDescription('How long since the last drama incident?!')
      .addSubcommand((subcommand) => subcommand
          .setName('get')
          .setDescription('Get the time since last drama.'),
      )
      .addSubcommand((subcommand) => subcommand
          .setName('reset')
          .setDescription('Reset the dramacounter >.<')
          .addStringOption((option) => option
              .setName('dramatime')
              .setDescription('When did the drama happen? "3 hours (ago)"')
              .setRequired(true),
          )
          .addStringOption((option) => option
              .setName('dramaissue')
              .setDescription('What was the drama? Be descriptive, or cryptic.')
              .setRequired(true),
          ),
      ),
  async execute(interaction) {
    logger.debug(`[${PREFIX}] starting!`);
    const command = interaction.options.getSubcommand() as 'get' | 'reset';

    const ref = db.ref(`${env.FIREBASE_DB_GUILDS}/${interaction.guild!.id}/dramacounter`);
    if (command === 'get') {
      if (global.db) {
        await ref.once('value', (data) => {
          if (data.val() !== null) {
            const timeVal = data.val().time;
            const issue = data.val().issue;
            const embed = embedTemplate()
                .setTitle('Drama Counter')
                .setDescription(
                    `The last drama was ${time(new Date(timeVal), 'R')}: ${issue}`);
            interaction.reply({embeds: [embed]});
          } else {
            interaction.reply('No drama has been reported yet! Be thankful while it lasts...');
          }
        });
      }
    } else if (command === 'reset') {
      if (global.db) {
        const dramaVal = interaction.options.getString('dramatime')!;
        logger.debug(`[${PREFIX}] dramaVal: ${JSON.stringify(dramaVal, null, 2)}`);
        const dramatimeValue = await parseDuration(dramaVal);
        logger.debug(`[${PREFIX}] dramatimeValue: ${JSON.stringify(dramatimeValue, null, 2)}`);
        const dramaIssue = interaction.options.getString('dramaissue')!;
        logger.debug(`[${PREFIX}] dramaIssue: ${JSON.stringify(dramaIssue, null, 2)}`);
        await ref.set({
          time: Date.now().valueOf() - dramatimeValue,
          issue: dramaIssue,
        });
        const timeDate = time(new Date(Date.now().valueOf() - dramatimeValue), 'R');
        const embed = embedTemplate()
            .setTitle('Drama Counter')
            .setDescription(`The drama counter has been reset to ${timeDate} ago, \
and the issue was: ${dramaIssue}`);
        interaction.reply({embeds: [embed]});
      }
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
