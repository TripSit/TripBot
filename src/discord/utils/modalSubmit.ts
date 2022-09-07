import {
  ModalSubmitInteraction,
} from 'discord.js';
import logger from '../../global/utils/logger';
import {
  ircSubmit,
} from '../commands/guild/prompt';
import {
  modmailTripsitterSubmit,
  modmailFeedbackSubmit,
  modmailIssueSubmit,
} from '../commands/guild/modmail';

const PREFIX = require('path').parse(__filename).name;

import {tripsitme} from '../utils/tripsitme';
import {bug} from '../commands/global/bug';
import {uKick} from '../commands/guild/u_kick';
import {uBan} from '../commands/guild/u_ban';
import {uNote} from '../commands/guild/u_note';
import {mTimeout} from '../commands/guild/m_timeout';
import {mWarn} from '../commands/guild/m_warn';
import {
  report,
} from '../commands/guild/m_report';
// const ircButton = require('../commands/guild/prompt');

/**
 * This runs whenever a modal is submitted
 * @param {ModalSubmitInteraction} interaction Reaction used
 */
export async function modalSubmit(interaction:ModalSubmitInteraction): Promise<void> {
  logger.debug(`[${PREFIX}] interaction: ${interaction.customId}`);
  if (interaction.customId === 'ircConnectModmailIssueModal') {
    ircSubmit(interaction, 'ircConnect');
    return;
  }
  if (interaction.customId === 'discordIssueModmailIssueModal') {
    ircSubmit(interaction, 'discordIssue');
    return;
  }
  if (interaction.customId === 'ircAppealModmailIssueModal') {
    ircSubmit(interaction, 'ircAppeal');
    return;
  }
  if (interaction.customId === 'ircOtherModmailIssueModal') {
    ircSubmit(interaction, 'ircOther');
    return;
  }
  if (interaction.customId === 'tripsitModmailModal') {
    modmailTripsitterSubmit(interaction);
    return;
  }
  if (interaction.customId === 'modmailFeedbackModal') {
    modmailFeedbackSubmit(interaction);
    return;
  }
  if (interaction.customId === 'ircModmailIssueModal') {
    modmailIssueSubmit(interaction, 'irc');
    return;
  }
  if (interaction.customId === 'discordModmailIssueModal') {
    modmailIssueSubmit(interaction, 'discord');
    return;
  }
  if (interaction.customId === 'tripsitModal') {
    tripsitme(interaction);
    return;
  }
  if (interaction.customId === 'banModal') {
    return uBan.submit!(interaction);
  }
  if (interaction.customId === 'kickModal') {
    return uKick.submit!(interaction);
  }
  if (interaction.customId === 'noteModal') {
    return uNote.submit!(interaction);
  }
  if (interaction.customId === 'timeoutModal') {
    return mTimeout.submit!(interaction);
  }
  if (interaction.customId === 'warnModal') {
    return mWarn.submit!(interaction);
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
