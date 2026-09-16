const F = f(__filename);

export default async function execute():Promise<void> {
  global.ircClient.addListener('join', (channel, nick, message) => {
    log.debug(F, `${JSON.stringify(message, null, 2)}`);
    log.debug(F, `${JSON.stringify(channel, null, 2)}`);
    log.debug(F, `${JSON.stringify(nick, null, 2)}`);
  });
}
