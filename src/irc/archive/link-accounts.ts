const F = f(__filename);
const {verifyLink} = require('../../discord/commands/guild/link-accounts');

export default async function(
  from:string, 
  token:string,
  ) {
    log.debug(F, `start!`);
    log.debug(F, `PM token: ${token}`);
    global.ircClient.say(from, `Your token is ${token}`);
    await global.ircClient.whois(from, (info) => {
      if (info && !info.account) {
        global.ircClient.say(from, `${from} is not registered on IRC, please go ~register on IRC!`);
      }
      verifyLink('irc', info, token);
    });
};
