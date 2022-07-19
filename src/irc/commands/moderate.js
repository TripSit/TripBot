'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');

const {
  NODE_ENV,
} = require('../../../env');

let generalChannels = [];
let hrChannels = [];
let allChannels = [];

if (NODE_ENV === 'production') {
  generalChannels = [
    '#tripsitters',
    '#music',
    '#science',
    '#gaming',
    '#cooking',
    '#pets',
    '#creative',
    '#movies',
    '#opiates',
    '#depressants',
    '#dissociatives',
    '#psychedelics',
    '#stimulants',
    '#lounge',
    '#tripsitvip',
    '#gold-lounge',
    '#psychonaut',
    '#dissonaut',
    '#minecraft',
    '#recovery',
    '#compsci',
    '#tripsit-dev',
    '#content',
    '#teamtripsit',
    '#moderators',
    '#tripsit.me',
    '#modhaven',
    '#operations',
    '#emergency',
    '#meeting-room',
    '#drugs',
  ];
  hrChannels = [
    '#sanctuary',
    '#tripsit',
    '#tripsit1',
    '#tripsit2',
    '#tripsit3',
  ];
  allChannels = generalChannels.concat(hrChannels);
} else {
  generalChannels = [
    '#sandbox-dev',
  ];
  hrChannels = [];
  allChannels = generalChannels.concat(hrChannels);
}

async function ban(target, reason) {
  global.ircClient.say('operserv', `akill add ${target.host} !P 1 ${reason}`);
  global.ircClient.say('#sandbox-dev', `akill add ${target.host} !P 1 ${reason}`);
  // eslint-disable-next-line no-restricted-syntax
  // for (const channel of allChannels) {
  //   try {
  //     global.ircClient.send('KICK', channel, target);
  //     global.ircClient.send('MODE', channel, '+b', target.host);
  //     // global.ircClient.say('#sandbox-dev', `AKILL ADD ${target.host}}`);
  //     // global.ircClient.say('operserv', `AKILL ADD ${target.host}}`);
  //   } catch (err) {
  //     logger.error(`[${PREFIX}] ${err}`);
  //   }
  // }
}

async function unban(target) {
  // eslint-disable-next-line no-restricted-syntax
  for (const channel of allChannels) {
    try {
      global.ircClient.send('MODE', channel, '-b', target.host);
    } catch (err) {
      logger.error(`[${PREFIX}] ${err}`);
    }
  }
}

async function timeout(target) {
  // eslint-disable-next-line no-restricted-syntax
  for (const channel of allChannels) {
    try {
      global.ircClient.send('MODE', channel, '+q', target.host);
    } catch (err) {
      logger.error(`[${PREFIX}] ${err}`);
    }
  }
}

async function untimeout(target) {
  // eslint-disable-next-line no-restricted-syntax
  for (const channel of allChannels) {
    try {
      global.ircClient.send('MODE', channel, '-q', target.host);
    } catch (err) {
      logger.error(`[${PREFIX}] ${err}`);
    }
  }
}

async function voice(target) {
  // eslint-disable-next-line no-restricted-syntax
  for (const channel of allChannels) {
    try {
      global.ircClient.send('MODE', channel, '+v', target.host);
    } catch (err) {
      logger.error(`[${PREFIX}] ${err}`);
    }
  }
}

async function unvoice(target) {
  // eslint-disable-next-line no-restricted-syntax
  for (const channel of allChannels) {
    try {
      global.ircClient.send('MODE', channel, '-v', target.host);
    } catch (err) {
      logger.error(`[${PREFIX}] ${err}`);
    }
  }
}

async function operator(target) {
  // eslint-disable-next-line no-restricted-syntax
  for (const channel of allChannels) {
    try {
      global.ircClient.send('MODE', channel, '+o', target.nick);
    } catch (err) {
      logger.error(`[${PREFIX}] ${err}`);
    }
  }
}

async function unoperator(target) {
  // eslint-disable-next-line no-restricted-syntax
  for (const channel of allChannels) {
    try {
      global.ircClient.send('MODE', channel, '-o', target.nick);
    } catch (err) {
      logger.error(`[${PREFIX}] ${err}`);
    }
  }
}

async function kick(target, channel) {
  // eslint-disable-next-line no-restricted-syntax
  global.ircClient.send('KICK', channel, target);
}

async function invite(target, channel) {
  global.ircClient.send('INVITE', channel, target);
  // global.ircClient.say('#sandbox-dev', `'INVITE', ${channel}, ${target}`);
}

async function rename(target, newNick) {
  global.ircClient.say('operserv', `SVSNICK ${target} ${newNick}`);
  global.ircClient.say('#sandbox-dev', `SVSNICK ${target} ${newNick}`);
}

async function shadowquiet(target) {
  // eslint-disable-next-line no-restricted-syntax
  for (const channel of allChannels) {
    // global.ircClient.send('MODE', channel, '+b', target);
    global.ircClient.say('#sandbox-dev', `'MODE', ${channel}, '+q', ${target}`);
    // global.ircClient.send('MODE', channel, '+z', target);
    global.ircClient.say('#sandbox-dev', `'MODE', ${channel}, '+z'`);
  }
}

async function underban(target) {
  // eslint-disable-next-line no-restricted-syntax
  for (const channel of hrChannels) {
    // global.ircClient.send('MODE', channel, '+b', target);
    global.ircClient.say('#sandbox-dev', `'MODE', ${channel}, '+q', ${target}`);
    // global.ircClient.send('MODE', channel, '+z', target);
    global.ircClient.say('#sandbox-dev', `'MODE', ${channel}, '+z'`);
  }
}

async function say(actor, target, quote) {
  global.ircClient.say(target, quote);
  global.ircClient.say('#sandbox-dev', `${actor} said ${quote} in ${target}!`);
}

module.exports = {
  async moderate(command, message) {
    logger.debug(`[${PREFIX}] start!`);
    const actor = message.nick;
    logger.debug(`[${PREFIX}] actor: ${actor}`);

    let reason = message.args[1].trim();

    const duration = reason.match(/\d+[ywdhms]/);
    logger.debug(`[${PREFIX}] duration: ${duration}`);
    logger.debug(`[${PREFIX}] reason: ${typeof duration}`);

    reason = reason.replace(`${duration}`, '');
    reason = reason.replace('  ', ' ').trim();

    let action = reason.slice(0, reason.indexOf(' '));
    logger.debug(`[${PREFIX}] action: ${action}`);

    reason = reason.replace(`${action} `, '').trim();

    let target = reason;
    if (reason.indexOf(' ') > 0) {
      target = reason.slice(0, reason.indexOf(' '));
    }

    reason = reason.replace(`${target} `, '').trim();
    if (reason === target) {
      reason = '';
    }
    logger.debug(`[${PREFIX}] reason: ${reason}`);
    logger.debug(`[${PREFIX}] reason: ${typeof reason}`);

    const channel = 'testChannel';
    const newNick = 'newNick';
    const quote = 'quote';

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

    if (!data.host) {
      global.ircClient.say(message.args[0], `${target} not found on IRC! Did you spell that right?`);
      logger.debug(`[${PREFIX}] ${target} not found on IRC! Did you spell that right? (Capitalization Counts!)`);
      return;
    }

    target = data;
    // logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);
    switch (command) {
      default:
        logger.debug(`[${PREFIX}] default`);
        break;
      case 'k':
      case 'kill':
      case 'kline':
      case 'b':
      case 'ban':
      case 'nban':
        ban(target);
        action = 'banned';
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
      case 'rk':
      case 'uk':
      case 'dk':
      case 'rmk':
      case 'unk':
      case 'dek':
      case 'rmkill':
      case 'unkill':
      case 'dekill':
        unban(target);
        action = 'unbanned';
        break;
      case 'q':
      case 'quiet':
      case 't':
      case 'timeout':
        timeout(target);
        action = 'quieted';
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
        untimeout(target);
        action = 'unqieted';
        break;
      case 'v':
      case 'voice':
        voice(target);
        action = 'voiced';
        break;
      case 'rv':
      case 'uv':
      case 'dv':
      case 'rmv':
      case 'unv':
      case 'dev':
      case 'rmvoice':
      case 'unvoice':
      case 'devoice':
        unvoice(target);
        action = 'devoiced';
        break;
      case 'o':
      case 'op':
        operator(target);
        action = 'opped';
        break;
      case 'rop':
      case 'uop':
      case 'dop':
      case 'rmop':
      case 'unop':
      case 'deop':
        unoperator(target);
        action = 'deopped';
        break;
      case 'kick':
        kick(target, channel);
        action = 'kicked';
        break;
      case 'invite':
        invite(target, channel);
        action = 'invited';
        break;
      case 'rename':
      case 'svsnick':
        rename(target, newNick);
        action = 'renamed';
        break;
      case 'sq':
      case 'squiet':
      case 'shadowquiet':
        shadowquiet(target);
        action = 'shadowquieted';
        break;
      case 'uban':
      case 'underban':
      case 'underage':
        underban(target);
        action = 'underbanned';
        break;
      case 'echo':
      case 'say':
        say(channel, quote);
        action = 'said';
        break;
    }
    global.ircClient.say(message.args[0], `${actor} has ${action} ${data.nick}${duration !== null ? ` for ${duration}` : ''}${reason !== '' ? ` because ${reason}` : ''}!`);

    // Send the message back to the channel
  },
};
