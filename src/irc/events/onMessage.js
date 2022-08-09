'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');
const { experience } = require('../../global/utils/experience');
const { echo } = require('../commands/echo');
const { moderate } = require('../commands/i.moderate');

const modCommands = [
  'w',
  'warn',
  'k',
  'kill',
  'kline',
  'b',
  'ban',
  'nban',
  'rb',
  'ub',
  'db',
  'rmb',
  'unb',
  'deb',
  'rmban',
  'unban',
  'deban',
  'rk',
  'uk',
  'dk',
  'rmk',
  'unk',
  'dek',
  'rmkill',
  'unkill',
  'dekill',
  'q',
  'quiet',
  't',
  'timeout',
  'rq',
  'uq',
  'dq',
  'rmq',
  'unq',
  'deq',
  'rmquiet',
  'unquiet',
  'dequiet',
  'rt',
  'ut',
  'dt',
  'rmt',
  'unt',
  'det',
  'rmtimeout',
  'untimeout',
  'detimeout',
  'v',
  'voice',
  'rv',
  'uv',
  'dv',
  'rmv',
  'unv',
  'dev',
  'rmvoice',
  'unvoice',
  'devoice',
  'o',
  'op',
  'rop',
  'uop',
  'dop',
  'rmop',
  'unop',
  'deop',
  'kick',
  'i',
  'invite',
  'rename',
  'svsnick',
  'sq',
  'squiet',
  'shadowquiet',
  'uban',
  'underban',
  'underage',
  'echo',
  'say',
  'announce',
  'global',
];

module.exports = {
  name: 'onReady',
  async execute() {
    global.ircClient.addListener('message#', (nick, to, text, message) => {
      // Example 'message' event
      logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
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
          } else if (modCommands.includes(command)) {
            moderate(command, message);
          } else {
            logger.debug(`[${PREFIX}] Unknown command: ${command}`);
            global.ircClient.say(message.args[0], `Unknown command: ${command}`);
          }
        }
      } else {
        logger.debug(`[${PREFIX}] Unknown command: ${message}`);
      }

      // This always runs
      experience(message);
    });
  },
};
