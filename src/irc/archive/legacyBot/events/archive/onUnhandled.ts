import { IRCMessage } from '../../@types/irc';

const F = f(__filename);

export default async function execute():Promise<void> {
  global.ircClient.addListener('unhandled', (message:IRCMessage) => {
    if (message.args[2].indexOf('is using a secure connection') === -1) {
      log.debug(F, `${JSON.stringify(message, null, 2)}`);
    }
  });
}
