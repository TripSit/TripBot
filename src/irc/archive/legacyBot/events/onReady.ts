const F = f(__filename);

export default async function execute():Promise<void> {
  global.ircClient.addListener('registered', () => {
    const bootDuration = (new Date().getTime() - global.bootTime.getTime()) / 1000;
    log.info(F, `IRC bot initialized in ${bootDuration}s: ready to party like it's 2001!`);
  });
}
