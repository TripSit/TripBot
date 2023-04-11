// import { experience } from '../../global/utils/experience';
import echo from '../commands/echo';

const F = f(__filename);

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
export default async function execute():Promise<void> {
  global.ircClient.addListener('message', (nick, to, text, message) => {
    // Example 'message' event
    log.debug(F, `nick: ${JSON.stringify(nick, null, 2)}`);
    log.debug(F, `to ${JSON.stringify(to, null, 2)}`);
    log.debug(F, `text ${JSON.stringify(text, null, 2)}`);
    log.debug(F, `message ${JSON.stringify(message, null, 2)}`);

    if (message.command !== 'PRIVMSG') return;

    // log.debug(F, `${nick} said ${text} in ${to}`);

    if (message.args[1].startsWith(env.IRC_BOTPREFIX)) {
      log.debug(F, `${nick} sent a command`);
      const command = message.args[1].split(' ')[0].slice(1);
      log.debug(F, `${nick} sent command: ${command}`);
      if (command === 'echo') {
        log.debug(F, 'Running echo');
        echo(message);
      } else {
        log.debug(F, `Unknown command: ${command}`);
        global.ircClient.say(message.args[0], `Unknown command: ${command}`);
      }
      // else if (modCommands.includes(command)) {
      //   moderate(command, message);
      // }
    }

    // thoughtPolice(message);
    // experience(message);
  });
}
