import {
  SelectMenuInteraction,
  Client,
} from 'discord.js';
import logger from '../../global/utils/logger';
import {applicationStart} from '../utils/application';
import {applicationReject} from './application';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

/**
 * This runs whenever a buttion is clicked
 * @param {SelectMenuInteraction} interaction The interaction that started this
 * @param {Client} client The client that manages it
 * @return {Promise<void>}
 */
export async function selectMenu(interaction:SelectMenuInteraction, client:Client): Promise<void> {
  logger.debug(`[${PREFIX}] started!`);
  const customId = interaction.customId;
  logger.debug(`[${PREFIX}] customId: ${customId}`);

  if (customId.startsWith('applicationReject')) {
    await applicationReject(interaction);
  }
  if (customId.startsWith('applicationRoleSelectMenu')) {
    await applicationStart(interaction);
  }

  logger.debug(`[${PREFIX}] finished!`);
};
