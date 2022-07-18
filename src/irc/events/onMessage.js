'use strict';

// const PREFIX = require('path').parse(__filename).name;
// const logger = require('../../global/utils/logger');
const { experience } = require('../../global/utils/experience');
const { echo } = require('../commands/echo');

module.exports = {
  name: 'onReady',
  async execute() {
    global.ircClient.addListener('message#', (nick, to, text, message) => {
      // Example 'message' event
      // logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
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
      //     "test"
      //   ]
      // }

      // Honestly idk what other kinds of messages there are but might as well?
      if (message.command === 'PRIVMSG') {
        //
        if (message.args[1].startsWith(process.env.IRC_BOT_PREFIX)) {
          const command = message.args[1].split(' ')[0].slice(1);
          if (command === 'echo') {
            echo(message);
          }
        }
      }

      // This always runs
      experience(message);
    });
  },
};
