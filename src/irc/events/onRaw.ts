const F = f(__filename);

export default async function execute():Promise<void> {
  global.ircClient.addListener('raw', message => {
    log.debug(F, `${JSON.stringify(message, null, 2)}`);
  });
}
