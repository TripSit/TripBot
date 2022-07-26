'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');
const { moderate } = require('../../global/utils/moderate');

module.exports = {
  async moderate(command, message) {
    logger.debug(`[${PREFIX}] start!`);
    const actor = message.nick;
    logger.debug(`[${PREFIX}] actor: ${actor}`);

    const actorRole = message.host.split('/')[1];
    logger.debug(`[${PREFIX}] actorRole: ${actorRole}`);

    let commandText = message.args[1].trim();

    const duration = commandText.match(/\d+[ywdhms]/);
    logger.debug(`[${PREFIX}] duration: ${duration}`);

    commandText = commandText.replace(`${duration}`, '');
    commandText = commandText.replace('  ', ' ').trim();
    logger.debug(`[${PREFIX}] commandText: ${commandText}`);

    const action = commandText.slice(0, commandText.indexOf(' ') > -1 ? commandText.indexOf(' ') : commandText.length);
    logger.debug(`[${PREFIX}] action: ${action}`);

    commandText = commandText.replace(`${action}`, '').trim();
    commandText = commandText.replace('  ', ' ').trim();
    logger.debug(`[${PREFIX}] commandText: ${commandText}`);

    const target = commandText.indexOf(' ') > 0 ? commandText.slice(0, commandText.indexOf(' ')) : commandText;
    logger.debug(`[${PREFIX}] target: ${target}`);
    if (target.length === 0) {
      global.ircClient.say(message.args[0], 'You must supply a target!');
      return;
    }

    commandText = commandText.replace(`${target}`, '').trim();
    commandText = commandText.replace('  ', ' ').trim();
    logger.debug(`[${PREFIX}] commandText: ${commandText}`);

    const reason = commandText === target ? 'No reason given.' : commandText;
    logger.debug(`[${PREFIX}] reason: ${reason}`);

    const channel = reason.includes('#') ? reason : null;

    // Do a whois on the user to get their host name
    let data = null;
    await global.ircClient.whois(target, async resp => {
      // logger.debug(`[${PREFIX}] resp: ${JSON.stringify(resp, null, 2)}`);
      data = resp;
    });

    // This is a hack substanc3 helped create to get around the fact that the whois command
    // is asyncronous by default, so we need to make this syncronous
    while (data === null) {
      await new Promise(resolve => setTimeout(resolve, 100)); // eslint-disable-line
    }

    if (!data.host
      && command !== 'say'
      && command !== 'echo'
      && command !== 'announce'
      && command !== 'global'
    ) {
      const errorMsg = `${target} not found on IRC! Did you spell that right? (Capitalization Counts!)`;
      global.ircClient.say(message.args[0], errorMsg);
      logger.debug(`[${PREFIX}] ${errorMsg}`);
      return;
    }

    const announcement = message.args[1].slice(message.args[1].indexOf(' ')).trim();
    logger.debug(`[${PREFIX}] announcement: ${announcement}`);

    logger.debug(`[${PREFIX}] target: ${JSON.stringify(data, null, 2)}`);
    let response = '';
    switch (command) {
      case 'w':
      case 'warn':
        response = await moderate(actor, 'warn', target, channel, null, reason, duration);
        break;
      case 'b':
      case 'ban':
      case 'nban':
        response = await moderate(actor, 'ban', target, channel, 'on', reason, duration);
        break;
      case 'k':
      case 'kill':
      case 'kline':
      case 'specialkline':
      case 'specialkill':
        response = await moderate(actor, 'ban', target, channel, 'on', reason, duration);
        break;
      case 'rb':
      case 'ub':
      case 'db':
      case 'rmb':
      case 'unb':
      case 'deb':
      case 'rmban':
      case 'unban':
      case 'deban':
        response = await moderate(actor, 'ban', target, channel, 'off', reason, duration);
        break;
      case 'rk':
      case 'uk':
      case 'dk':
      case 'rmk':
      case 'unk':
      case 'dek':
      case 'rmkill':
      case 'unkill':
      case 'dekill':
        response = await moderate(actor, 'ban', target, channel, 'off', reason, duration);
        break;
      case 'q':
      case 'quiet':
      case 't':
      case 'timeout':
        response = await moderate(actor, 'timeout', target, channel, 'on', reason, duration);
        break;
      case 'rq':
      case 'uq':
      case 'dq':
      case 'rmq':
      case 'unq':
      case 'deq':
      case 'rmquiet':
      case 'unquiet':
      case 'dequiet':
      case 'rt':
      case 'ut':
      case 'dt':
      case 'rmt':
      case 'unt':
      case 'det':
      case 'rmtimeout':
      case 'untimeout':
      case 'detimeout':
        response = await moderate(actor, 'timeout', target, channel, 'off', reason, duration);
        break;
      case 'invite':
        if (channel === null) {
          global.ircClient.say(message.args[0], 'You must supply a channel! (Remember the #)');
          return;
        }
        response = await moderate(actor, 'invite', target, channel, null, reason, duration);
        break;
      case 'rename':
      case 'svsnick':
        if (channel === null) {
          global.ircClient.say(message.args[0], 'You must supply a new nickname!');
          return;
        }
        response = await moderate(actor, 'rename', target, channel, 'on', reason, duration);
        break;
      case 'sq':
      case 'squiet':
      case 'shadowquiet':
        response = await moderate(actor, 'shadowquiet', target, channel, 'on', reason, duration);
        break;
      case 'uban':
      case 'underban':
      case 'underage':
        response = await moderate(actor, 'underban', target, channel, 'on', reason, duration);
        break;
      case 'echo':
      case 'say':
        if (target === null) {
          global.ircClient.say(message.args[0], 'You must supply a channel! (Remember the #)');
          return;
        }
        if (reason === null) {
          global.ircClient.say(message.args[0], 'You must supply a what you want to say!');
          return;
        }
        response = await moderate(actor, 'say', target, channel, null, reason, duration);
        break;
      case 'announce':
      case 'global':
        if (target === null) {
          global.ircClient.say(message.args[0], 'You must supply what you want to say!');
          return;
        }
        response = await moderate(actor, 'say', target, channel, null, announcement, duration);
        break;
      default:
        break;
    }
    global.ircClient.say(message.args[0], response);

    // Send the message back to the channel
  },
};
