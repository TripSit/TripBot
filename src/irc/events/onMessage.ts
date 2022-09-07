import env from '../../global/utils/env.config';
import logger from '../../global/utils/logger';
import {ircMessage} from '../@types/irc.d';
import {experience} from '../../global/utils/experience';
import {echo} from '../commands/echo';
const PREFIX = require('path').parse(__filename).name;

// const {moderate} = require('../archive/i.moderate.ts');
// const { thoughtPolice } = require('../utils/i.thoughtPolice');

// const modCommands = [
//   'w',
//   'warn',
//   'k',
//   'kill',
//   'kline',
//   'b',
//   'ban',
//   'nban',
//   'rb',
//   'ub',
//   'db',
//   'rmb',
//   'unb',
//   'deb',
//   'rmban',
//   'unban',
//   'deban',
//   'rk',
//   'uk',
//   'dk',
//   'rmk',
//   'unk',
//   'dek',
//   'rmkill',
//   'unkill',
//   'dekill',
//   'q',
//   'quiet',
//   't',
//   'timeout',
//   'rq',
//   'uq',
//   'dq',
//   'rmq',
//   'unq',
//   'deq',
//   'rmquiet',
//   'unquiet',
//   'dequiet',
//   'rt',
//   'ut',
//   'dt',
//   'rmt',
//   'unt',
//   'det',
//   'rmtimeout',
//   'untimeout',
//   'detimeout',
//   'v',
//   'voice',
//   'rv',
//   'uv',
//   'dv',
//   'rmv',
//   'unv',
//   'dev',
//   'rmvoice',
//   'unvoice',
//   'devoice',
//   'o',
//   'op',
//   'rop',
//   'uop',
//   'dop',
//   'rmop',
//   'unop',
//   'deop',
//   'kick',
//   'i',
//   'invite',
//   'rename',
//   'svsnick',
//   'sq',
//   'squiet',
//   'shadowquiet',
//   'uban',
//   'underban',
//   'underage',
//   'echo',
//   'say',
//   'announce',
//   'global',
// ];

/**
 *
 * @return {Promise<void>}
 */
module.exports = {
  async execute() {
    global.ircClient.addListener('message#', (
        nick:string,
        to:string,
        text:string,
        message:ircMessage,
    ) => {
      // Example 'message' event
      // logger.debug(`[${PREFIX}] nick: ${JSON.stringify(nick, null, 2)}`);
      // logger.debug(`[${PREFIX}] to ${JSON.stringify(to, null, 2)}`);
      // logger.debug(`[${PREFIX}] text ${JSON.stringify(text, null, 2)}`);
      // logger.debug(`[${PREFIX}] message ${JSON.stringify(message, null, 2)}`);

      if (message.command !== 'PRIVMSG') return;

      // logger.debug(`[${PREFIX}] ${nick} said ${text} in ${to}`);

      if (message.args[1].startsWith(env.IRC_BOTPREFIX)) {
        logger.debug(`[${PREFIX}] ${nick} sent a command`);
        const command = message.args[1].split(' ')[0].slice(1);
        logger.debug(`[${PREFIX}] ${nick} sent command: ${command}`);
        if (command === 'echo') {
          logger.debug(`[${PREFIX}] Running echo`);
          echo(message);
        } else {
          logger.debug(`[${PREFIX}] Unknown command: ${command}`);
          global.ircClient.say(message.args[0], `Unknown command: ${command}`);
        }
        // else if (modCommands.includes(command)) {
        //   moderate(command, message);
        // }
      }

      // thoughtPolice(message);
      experience(message);
    });
  },
};
