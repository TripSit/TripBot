const F = f(__filename);

export default async function execute():Promise<void> {
  global.ircClient.addListener('kick', (channel, nick, by, reason, message) => {
    log.debug(F, `${JSON.stringify(message, null, 2)}`);
    log.debug(F, `${JSON.stringify(channel, null, 2)}`);
    log.debug(F, `${JSON.stringify(nick, null, 2)}`);
    log.debug(F, `${JSON.stringify(by, null, 2)}`);
    log.debug(F, `${JSON.stringify(reason, null, 2)}`);
  });
}
