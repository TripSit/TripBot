const F = f(__filename);

export default async function execute():Promise<void> {
  global.ircClient.addListener('invite', message => {
    log.debug(F, `${JSON.stringify(message, null, 2)}`);
  });
}
