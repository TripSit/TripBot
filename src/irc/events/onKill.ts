const F = f(__filename);

export default async function execute():Promise<void> {
  global.ircClient.addListener('kill', async (nick, reason, channels, message) => {
    log.debug(F, `${JSON.stringify(message, null, 2)}`);
    log.debug(F, `${JSON.stringify(nick, null, 2)}`);
    log.debug(F, `${JSON.stringify(reason, null, 2)}`);
    log.debug(F, `${JSON.stringify(channels, null, 2)}`);
  });
}
