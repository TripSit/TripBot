const F = f(__filename);

export default async function execute():Promise<void> {
  global.ircClient.addListener('nick', (oldNick, newNick, channels, message) => {
    log.debug(F, `${JSON.stringify(message, null, 2)}`);
    log.debug(F, `${JSON.stringify(oldNick, null, 2)}`);
    log.debug(F, `${JSON.stringify(newNick, null, 2)}`);
    log.debug(F, `${JSON.stringify(channels, null, 2)}`);
  });
}
