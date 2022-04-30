const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger.js');

module.exports = {
    name: 'inviteCreate',
    async execute(invite, client) {
        logger.info(`[${PREFIX}] Invite created: ${invite}`);
        const invitesA = client.invites.get(invite.guild.id);
        const arrayA = invitesA.map((value, key) => `${key} => ${value}`);
        logger.debug(`[${PREFIX}] invitesA: ${arrayA}`);
        client.invites.get(invite.guild.id).set(invite.code, invite.uses);
        const invitesB = client.invites.get(invite.guild.id);
        const arrayB = invitesB.map((value, key) => `${key} => ${value}`);
        logger.debug(`[${PREFIX}] invitesB: ${arrayB}`);
    },
};