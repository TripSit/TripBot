const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger.js');
const { MessageEmbed, Collection } = require('discord.js');

module.exports = {
    name: 'inviteDelete',
    async execute(invite, client) {
        logger.info(`[${PREFIX}] Invite deleted: ${invite}`);
        client.invites.get(invite.guild.id).delete(invite.code);
    },
};