const F = f(__filename);

export default async function execute():Promise<void> {
  global.ircClient.addListener('pm', async (from, message) => {
    log.debug(F, `PM from ${from}: ${message}`);
    // If the message matches the format of a token
    // const token = message.match(/\S{6}-\S{6}-\S{6}/);
    // if (token !== null) {
    //   linkAccounts(from, token);
    // }
  });
}
