import {
  ModalSubmitInteraction,
} from 'discord.js';
import logger from '../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

import {bug} from '../commands/global/bug';
import {uKick} from '../commands/guild/u_kick';
import {uBan} from '../commands/guild/u_ban';
import {uNote} from '../commands/guild/u_note';
import {mTimeout} from '../commands/guild/m_timeout';
import {mWarn} from '../commands/guild/m_warn';
import {report} from '../commands/guild/m_report';

/**
 * This runs whenever a modal is submitted
 * @param {ModalSubmitInteraction} interaction Reaction used
 */
export async function modalSubmit(interaction:ModalSubmitInteraction): Promise<void> {
  logger.debug(`[${PREFIX}] interaction: ${interaction.customId}`);
  if (interaction.customId === 'banModal') {
    uBan.submit!(interaction);
    return;
  }
  if (interaction.customId === 'kickModal') {
    uKick.submit!(interaction);
    return;
  }
  if (interaction.customId === 'noteModal') {
    uNote.submit!(interaction);
    return;
  }
  if (interaction.customId === 'timeoutModal') {
    mTimeout.submit!(interaction);
    return;
  }
  if (interaction.customId === 'warnModal') {
    mWarn.submit!(interaction);
    return;
  }
  if (interaction.customId === 'reportModal') {
    report.submit!(interaction);
    return;
  }
  if (interaction.customId === 'bugReportModal') {
    bug.submit!(interaction);
    return;
  }
  // logger.debug(`[${PREFIX}] finished!`);
};
