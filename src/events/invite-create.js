'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger');

const {
  discordGuildId,
} = require('../../env');

module.exports = {
  name: 'inviteCreate',

  async execute(invite) {
    // Only run on Tripsit
    if (invite.guild.id !== discordGuildId) { return; }
    logger.info(`[${PREFIX}] Invite created: ${invite}`);
    /* Start *INVITE* code */
    // https://stackoverflow.com/questions/69521374/discord-js-v13-invite-tracker
    const invites = await invite.guild.invites.fetch();

    const codeUses = new Map();
    invites.each(inv => codeUses.set(inv.code, inv.uses));

    global.guildInvites.set(invite.guild.id, codeUses);
  },
};
