'use strict';

const F = f(__filename);
const {stripIndents} = require('common-tags');
const logger = require('../../global/utils/logger');
const {bigBrother} = require('../../global/utils/thoughtPolice');
const {moderate} = require('../../global/utils/moderate');

const {
  NODE_ENV,
} = require('../../../env');

module.exports = {
  async thoughtPolice(message) {
    log.debug(F, `started!`);
    log.debug(F, `message: ${JSON.stringify(message, null, 2)}`);
    // {
    //   "prefix": "Moonbear!~teknos@tripsit/founder/Teknos",
    //   "nick": "Moonbear",
    //   "user": "~teknos",
    //   "host": "tripsit/founder/Teknos",
    //   "command": "PRIVMSG",
    //   "rawCommand": "PRIVMSG",
    //   "commandType": "normal",
    //   "args": [
    //     "#sandbox-dev",
    //     "lkasjdl;kfj;alksdjfl;kajsl;dkfjal;ksdjfl;kajs;ldfjl;kj;lkj"
    //   ]
    // }

    const result = await bigBrother(message.args[1]);

    log.debug(F, `result: ${result}`);

    if (result) {
      switch (result[0]) {
        case 'offensive':
          global.ircClient.say(message.args[0], result[1]);
          await moderate('TripBot', 'timeout', message.nick, null, 'on', 'Said offensive word', null);
          break;
        case 'harm':
          global.ircClient.say(NODE_ENV === 'production' ? '#moderators' : '#sandbox-dev', stripIndents`
            ${message.nick} is talking about something harmful in ${message.args[0]}!
          `);
          break;
        case 'horny':
          global.ircClient.say(message.args[0], result[1]);
          break;
        case 'meme':
          global.ircClient.say(message.args[0], result[1]);
          break;
        case 'pg13':
          global.ircClient.say(NODE_ENV === 'production' ? '#moderators' : '#sandbox-dev', stripIndents`
            ${message.nick} is talking about something PG13 in ${message.args[0]}!
          `);
          break;
        default:
          break;
      }
    }
    log.debug(F, `finished!`);
  },
};
