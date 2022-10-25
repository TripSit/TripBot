/* eslint-disable no-unused-vars */
import {
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
import env from '../../../global/utils/env.config';
import logger from '../../../global/utils/logger';
import * as path from 'path';
import {userDbEntry} from '../../../global/@types/database.d';
const PREFIX = path.parse(__filename).name;

export const leaderboard: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the experience leaderboard'),
  async execute(interaction) {
    logger.debug(`[${PREFIX}] starting!`);

    const expLeaderboard = {
      'total': {
        '1': {'name': '', 'exp': 0},
        '2': {'name': '', 'exp': 0},
        '3': {'name': '', 'exp': 0},
      },
      'general': {
        '1': {'name': '', 'exp': 0},
        '2': {'name': '', 'exp': 0},
        '3': {'name': '', 'exp': 0},
      },
      'tripsitter': {
        '1': {'name': '', 'exp': 0},
        '2': {'name': '', 'exp': 0},
        '3': {'name': '', 'exp': 0},
      },
      'developer': {
        '1': {'name': '', 'exp': 0},
        '2': {'name': '', 'exp': 0},
        '3': {'name': '', 'exp': 0},
      },
      'team': {
        '1': {'name': '', 'exp': 0},
        '2': {'name': '', 'exp': 0},
        '3': {'name': '', 'exp': 0},
      },
      'ignored': {
        '1': {'name': '', 'exp': 0},
        '2': {'name': '', 'exp': 0},
        '3': {'name': '', 'exp': 0},
      },
    };

    const topTotal = [];

    if (global.db) {
      const ref = db.ref(`${env.FIREBASE_DB_USERS}`);
      await ref.once('value', (data) => {
        if (data.val() !== null) {
          const allUsers = data.val();
          Object.keys(allUsers).forEach((userID) => {
            const userInfo = allUsers[userID] as userDbEntry;
            // Loop through each user in the database and find out who has the highest Total level
            if (userInfo.experience) {
              if (userInfo.experience.total) {
                if (userInfo.experience.total.level > expLeaderboard.total['1'].exp) {
                  expLeaderboard.total['3'].name = expLeaderboard.total['2'].name;
                  expLeaderboard.total['3'].exp = expLeaderboard.total['2'].exp;
                  expLeaderboard.total['2'].name = expLeaderboard.total['1'].name;
                  expLeaderboard.total['2'].exp = expLeaderboard.total['1'].exp;
                  expLeaderboard.total['1'].name = userInfo.discord?.id ?? 'Unknown';
                  expLeaderboard.total['1'].exp = userInfo.experience.total.level;
                } else if (userInfo.experience.total.level > expLeaderboard.total['2'].exp) {
                  expLeaderboard.total['3'].name = expLeaderboard.total['2'].name;
                  expLeaderboard.total['3'].exp = expLeaderboard.total['2'].exp;
                  expLeaderboard.total['2'].name = userInfo.discord?.id ?? 'Unknown';
                  expLeaderboard.total['2'].exp = userInfo.experience.total.level;
                } else if (userInfo.experience.total.level > expLeaderboard.total['3'].exp) {
                  expLeaderboard.total['3'].name = userInfo.discord?.id ?? 'Unknown';
                  expLeaderboard.total['3'].exp = userInfo.experience.total.level;
                }
              }
            }
          });
        }
      });
    }

    interaction.reply({
      content: `${JSON.stringify(expLeaderboard, null, 2)}`,
    });

    logger.debug(`[${PREFIX}] finished!`);
  },
};
