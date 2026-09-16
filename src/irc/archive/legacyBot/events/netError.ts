const F = f(__filename);

export default async function execute():Promise<void> {
  global.ircClient.addListener('netError', exception => {
    log.error(F, `${JSON.stringify(exception, null, 2)}`);
  });
}
