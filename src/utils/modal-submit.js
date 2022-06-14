'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('./logger');
const tripsitme = require('./tripsitme');
const bug = require('../commands/global/bug');
const uBan = require('../commands/guild/u_ban');
const uKick = require('../commands/guild/u_kick');
const uNote = require('../commands/guild/u_note');
const mTimeout = require('../commands/guild/m_timeout');
const mWarn = require('../commands/guild/m_warn');
const mReport = require('../commands/guild/m_report');
const modmail = require('../commands/guild/modmail');

module.exports = {
  async execute(interaction) {
    // logger.debug(`[${PREFIX}] interaction: ${interaction}`);
    logger.debug(`[${PREFIX}] interaction: ${interaction.customId}`);
    if (interaction.customId === 'modmailFeedbackModal') { return modmail.modmailFeedbackSubmit(interaction); }
    if (interaction.customId === 'modmailIrcissueModal') { return modmail.modmailIrcissueSubmit(interaction); }
    if (interaction.customId === 'modmailDiscordissueModal') { return modmail.modmailDiscordissueSubmit(interaction); }
    if (interaction.customId === 'tripsitModal') { return tripsitme.submit(interaction); }
    if (interaction.customId === 'banModal') { return uBan.submit(interaction); }
    if (interaction.customId === 'kickModal') { return uKick.submit(interaction); }
    if (interaction.customId === 'noteModal') { return uNote.submit(interaction); }
    if (interaction.customId === 'timeoutModal') { return mTimeout.submit(interaction); }
    if (interaction.customId === 'warnModal') { return mWarn.submit(interaction); }
    if (interaction.customId === 'reportModal') { return mReport.submit(interaction); }
    if (interaction.customId === 'bugReportModal') { return bug.submit(interaction); }
    // logger.debug(`[${PREFIX}] finished!`);
  },
};
