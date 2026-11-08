const F = f(__filename);
export default async function execute():Promise<void> {
  global.ircClient.addListener('action', (/* from, to, text, message */) => {
    log.debug(F, 'starting!');
    // log.debug(F, `${JSON.stringify(message, null, 2)}`);
    // {
    //   "prefix": "phusion!~phusion@tripsit/moderator/phusion",
    //   "nick": "phusion",
    //   "user": "~phusion",
    //   "host": "tripsit/moderator/phusion",
    //   "command": "PRIVMSG",
    //   "rawCommand": "PRIVMSG",
    //   "commandType": "normal",
    //   "args": [
    //     "#opiates",
    //     "\u0001ACTION flexes\u0001
    //   ]
    // }
  });
}
