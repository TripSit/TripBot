'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger');

module.exports = {
  name: 'inviteCreate',

  async execute(invite) {
    logger.info(`[${PREFIX}] Invite created: ${invite}`);
    /* Start *INVITE* code */
    // https://stackoverflow.com/questions/69521374/discord-js-v13-invite-tracker
    const invites = await invite.guild.invites.fetch();

    const codeUses = new Map();
    invites.each(inv => codeUses.set(inv.code, inv.uses));

    global.guildInvites.set(invite.guild.id, codeUses);

    // const invitesA = client.invites.get(invite.guild.id);
    // const arrayA = invitesA.map((value, key) => `${key} => ${value}`);
    // logger.debug(`[${PREFIX}] invitesA:`, arrayA);
    // client.invites.get(invite.guild.id).set(invite.code, invite.uses);
    // const invitesB = client.invites.get(invite.guild.id);
    // const arrayB = invitesB.map((value, key) => `${key} => ${value}`);
    // logger.debug(`[${PREFIX}] invitesB:`, arrayB);
  },
};
