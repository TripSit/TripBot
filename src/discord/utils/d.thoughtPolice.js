'use strict';

const path = require('path');
const { stripIndents } = require('common-tags');
const logger = require('../../global/utils/logger');
const { bigBrother } = require('../../global/utils/thoughtPolice');

const PREFIX = path.parse(__filename).name;

const {
  channelTripsittersId,
  roleTripsitterId,
  roleHelperId,
} = require('../../../env');

module.exports = {
  async thoughtPolice(message) {
    logger.debug(`[${PREFIX}] started!`);
    // logger.debug(`[${PREFIX}] ${message.member.displayName} said "${message.cleanContent}"`);
    const channelTripsitters = message.client.channels.cache.get(channelTripsittersId);
    const roleHelper = message.guild.roles.cache.find(role => role.id === roleHelperId);
    const roleTripsitter = message.guild.roles.cache.find(role => role.id === roleTripsitterId);

    const result = await bigBrother(message.cleanContent.toLowerCase());

    logger.debug(`[${PREFIX}] result: ${result}`);

    if (result) {
      switch (result[0]) {
        case 'offensive':
          message.channel.send(result[1]);
          message.delete();
          break;
        case 'harm':
          channelTripsitters.send(stripIndents`
          Hey ${roleTripsitter} and ${roleHelper}
          ${message.member.displayName} is talking about something harmful in ${message.channel.name}!
          `);
          break;
        case 'horny':
          message.channel.send(result[1]);
          break;
        case 'meme':
          message.channel.send(result[1]);
          break;
        case 'pg13':
          channelTripsitters.send(stripIndents`
          ${message.member.displayName} is talking about something PG13 in ${message.channel.name}!
          `);
          break;
        default:
          break;
      }
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
