import echo from '../commands/echo';

const F = f(__filename);

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
  });
}
