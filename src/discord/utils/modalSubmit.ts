import {
  ModalSubmitInteraction,
} from 'discord.js';
import logger from '../../global/utils/logger';
import {
  modmailTripsitterSubmit,
  modmailFeedbackSubmit,
  modmailIssueSubmit,
} from '../commands/guild/modmail';

const PREFIX = require('path').parse(__filename).name;

import {tripsitme} from '../utils/tripsitme';
// const bug = require('../commands/global/bug');
// const uBan = require('../commands/guild/u_ban');
// const uKick = require('../commands/guild/u_kick');
// const uNote = require('../commands/guild/u_note');
// const mTimeout = require('../commands/guild/m_timeout');
// const mWarn = require('../commands/guild/m_warn');
import {
  report,
} from '../commands/guild/m_report';
// const ircButton = require('../commands/guild/prompt');

/**
 * This runs whenever a modal is submitted
 * @param {ModalSubmitInteraction} interaction Reaction used
 */
export async function modalSubmit(interaction:ModalSubmitInteraction): Promise<void> {
  logger.debug(`[${PREFIX}] interaction: ${interaction}`);
  logger.debug(`[${PREFIX}] interaction: ${interaction.customId}`);
  // if (interaction.customId === 'ircConnectModmailIssueModal') {
  //   return ircButton.ircSubmit(interaction, 'ircConnect');
  // }
  // if (interaction.customId === 'discordIssueModmailIssueModal') {
  //   return ircButton.ircSubmit(interaction, 'discordIssue');
  // }
  // if (interaction.customId === 'ircAppealModmailIssueModal') {
  //   return ircButton.ircSubmit(interaction, 'ircAppeal');
  // }
  // if (interaction.customId === 'ircOtherModmailIssueModal') {
  //   return ircButton.ircSubmit(interaction, 'ircOther');
  // }
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
  // if (interaction.customId === 'banModal') {
  //   return uBan.submit(interaction);
  // }
  // if (interaction.customId === 'kickModal') {
  //   return uKick.submit(interaction);
  // }
  // if (interaction.customId === 'noteModal') {
  //   return uNote.submit(interaction);
  // }
  // if (interaction.customId === 'timeoutModal') {
  //   return mTimeout.submit(interaction);
  // }
  // if (interaction.customId === 'warnModal') {
  //   return mWarn.submit(interaction);
  // }
  if (interaction.customId === 'reportModal') {
    return report.submit(interaction);
  }
  // if (interaction.customId === 'bugReportModal') {
  //   return bug.submit(interaction);
  // }
  // logger.debug(`[${PREFIX}] finished!`);
};
