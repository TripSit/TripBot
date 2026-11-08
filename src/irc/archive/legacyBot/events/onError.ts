const F = f(__filename);

export default async function execute():Promise<void> {
  global.ircClient.addListener('error', message => {
    log.debug(F, 'start!');
    // It always seems to show this error first before actually working
    // The second error happens doing whois on a user
    if (message.args) {
      if (message.args[1] !== 'You have not registered'
        && message.args[1] !== 'No such nick/channel'
        && message.args[1].indexOf('is using a secure connection') === -1) {
        if (message.args[1] === 'You\'re not a channel operator') {
          global.ircClient.say(message.args[1], `Error: I am not an operator in ${message.args[1]}`);
          log.error(F, `I am not an operator in ${message.args[1]}`);
        } else {
          // global.ircClient.say(message.args[1], `Error: ${JSON.stringify(
          // message.args, null, 2).replace(/\n|\r/g, '')}`);
          log.error(F, `${JSON.stringify(message, null, 2).replace(/\n|\r/g, '')}`);
        }
      }
    } else {
      log.error(F, `${JSON.stringify(message, null, 2).replace(/\n|\r/g, '')}`);
    }
  });
}
