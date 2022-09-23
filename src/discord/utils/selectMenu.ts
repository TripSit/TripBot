import {
  SelectMenuInteraction,
  Client,
} from 'discord.js';
import logger from '../../global/utils/logger';
import {applicationReject} from './application';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

/**
 * This runs whenever a buttion is clicked
 * @param {SelectMenuInteraction} interaction The interaction that started this
 * @param {Client} client The client that manages it
 * @return {Promise<void>}
 */
export async function selectMenu(interaction:SelectMenuInteraction, client:Client) {
  logger.debug(`[${PREFIX}] finished!`);
  const buttonID = interaction.customId;

  if (buttonID.startsWith('applicationReject')) {
    applicationReject(interaction);
  }

  logger.debug(`[${PREFIX}] finished!`);
};
