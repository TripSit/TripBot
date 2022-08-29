import {
  ModalSubmitInteraction,
} from 'discord.js';
import logger from '../../global/utils/logger';

const PREFIX = require('path').parse(__filename).name;

import {tripsitmeSubmit} from '../utils/tripsitme';
// const bug = require('../commands/global/bug');
// const uBan = require('../commands/guild/u_ban');
// const uKick = require('../commands/guild/u_kick');
// const uNote = require('../commands/guild/u_note');
// const mTimeout = require('../commands/guild/m_timeout');
// const mWarn = require('../commands/guild/m_warn');
// const mReport = require('../commands/guild/m_report');
// const modmail = require('../commands/guild/modmail');
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
  // if (interaction.customId === 'tripsitModmailModal') {
  //   return modmail.modmailTripsitterSubmit(interaction);
  // }
  // if (interaction.customId === 'modmailFeedbackModal') {
  //   return modmail.modmailFeedbackSubmit(interaction);
  // }
  // if (interaction.customId === 'ircModmailIssueModal') {
  //   return modmail.modmailIssueSubmit(interaction, 'irc');
  // }
  // if (interaction.customId === 'discordModmailIssueModal') {
  //   return modmail.modmailIssueSubmit(interaction, 'discord');
  // }
  if (interaction.customId === 'tripsitModal') {
    tripsitmeSubmit(interaction);
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
  // if (interaction.customId === 'reportModal') {
  //   return mReport.submit(interaction);
  // }
  // if (interaction.customId === 'bugReportModal') {
  //   return bug.submit(interaction);
  // }
  // logger.debug(`[${PREFIX}] finished!`);
};
