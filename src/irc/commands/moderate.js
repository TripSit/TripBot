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

const teamRoles = [
  'operator',
  'moderator',
  'tripsitter',
  'founder',
  'guardian',
  'helper',
];

async function ban(target) {
  // eslint-disable-next-line no-restricted-syntax
  for (const channel of allChannels) {
    try {
      global.ircClient.send('KICK', channel, target.nick);
      global.ircClient.send('MODE', channel, '+b', `*@${target.host}`);
    } catch (err) {
      logger.error(`[${PREFIX}] ${err}`);
    }
  }
}

async function unban(target) {
  // eslint-disable-next-line no-restricted-syntax
  for (const channel of allChannels) {
    try {
      global.ircClient.send('MODE', channel, '-b', `*@${target.host}`);
    } catch (err) {
      logger.error(`[${PREFIX}] ${err}`);
    }
  }
}

async function kill(target, reason) {
  const command = `akill add ${target.host} !P ${reason}`;
  global.ircClient.say('operserv', command);
  global.ircClient.say('#sandbox-dev', command);
}

async function unkill(target) {
  const command = `akill del ${target}`;
  global.ircClient.say('operserv', command);
  global.ircClient.say('#sandbox-dev', command);
}

async function timeout(target) {
  // eslint-disable-next-line no-restricted-syntax
  for (const channel of allChannels) {
    try {
      global.ircClient.send('MODE', channel, '+q', `*@${target.host}`);
    } catch (err) {
      logger.error(`[${PREFIX}] ${err}`);
    }
  }
}

async function untimeout(target) {
  // eslint-disable-next-line no-restricted-syntax
  for (const channel of allChannels) {
    try {
      global.ircClient.send('MODE', channel, '-q', `*@${target.host}`);
    } catch (err) {
      logger.error(`[${PREFIX}] ${err}`);
    }
  }
}

async function voice(target) {
  // eslint-disable-next-line no-restricted-syntax
  for (const channel of allChannels) {
    try {
      global.ircClient.send('MODE', channel, '+v', `${target.nick}`);
    } catch (err) {
      logger.error(`[${PREFIX}] ${err}`);
    }
  }
}

async function unvoice(target) {
  // eslint-disable-next-line no-restricted-syntax
  for (const channel of allChannels) {
    try {
      global.ircClient.send('MODE', channel, '-v', `${target.nick}`);
    } catch (err) {
      logger.error(`[${PREFIX}] ${err}`);
    }
  }
}

async function operator(target) {
  // eslint-disable-next-line no-restricted-syntax
  for (const channel of allChannels) {
    try {
      global.ircClient.send('MODE', channel, '+o', `${target.nick}`);
    } catch (err) {
      logger.error(`[${PREFIX}] ${err}`);
    }
  }
}

async function unoperator(target) {
  // eslint-disable-next-line no-restricted-syntax
  for (const channel of allChannels) {
    try {
      global.ircClient.send('MODE', channel, '-o', `${target.nick}`);
    } catch (err) {
      logger.error(`[${PREFIX}] ${err}`);
    }
  }
}

async function kick(target, channel) {
  global.ircClient.send('KICK', channel, target.nick);
}

async function invite(target, channel) {
  global.ircClient.send('INVITE', target.nick, channel);
  // global.ircClient.say('#sandbox-dev', `'INVITE', ${channel}, ${target.host}`);
}

// Needs operator privileges
// async function rename(target, newNick) {
//   const command = `SVSNICK ${target.nick} ${newNick}`;
//   global.ircClient.say('operserv', command);
//   global.ircClient.say('#sandbox-dev', command);
// }

async function shadowquiet(target) {
  // eslint-disable-next-line no-restricted-syntax
  for (const channel of allChannels) {
    global.ircClient.send('MODE', channel, '+q', `*@${target.host}`);
    global.ircClient.send('MODE', channel, '+z', `*@${target.host}`);
  }
}

async function underban(target) {
  // eslint-disable-next-line no-restricted-syntax
  for (const channel of hrChannels) {
    global.ircClient.send('KICK', channel, target);
    global.ircClient.send('MODE', channel, '+b', `*@${target.host}`);
  }
}

async function say(target, quote) {
  logger.debug(`[${PREFIX}] Saying ${quote} to ${target}`);
  global.ircClient.say(target, quote);
}

async function announce(quote) {
  // eslint-disable-next-line no-restricted-syntax
  for (const channel of allChannels) {
    global.ircClient.say(channel, '<><><> Global message from Team TripSit! <><><>');
    global.ircClient.say(channel, quote);
  }
}

module.exports = {
  async moderate(command, message) {
    logger.debug(`[${PREFIX}] start!`);
    const actor = message.nick;
    logger.debug(`[${PREFIX}] actor: ${actor}`);

    const actorRole = message.host.split('/')[1];
    logger.debug(`[${PREFIX}] actorRole: ${actorRole}`);

    if (!teamRoles.includes(actorRole)) {
      global.ircClient.say(message.args[0], 'Only team members may perform this action!');
      return;
    }

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

    const channel = reason;
    // const newNick = reason;
    const quote = reason;

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

    if (data.host) {
      const targetRole = data.host.split('/')[1];
      logger.debug(`[${PREFIX}] targetRole: ${targetRole}`);
      if (teamRoles.includes(targetRole)) {
        global.ircClient.say(message.args[0], 'You cannot moderate a team member!');
        return;
      }
    }

    const announcement = message.args[1].slice(message.args[1].indexOf(' ')).trim();
    logger.debug(`[${PREFIX}] announcement: ${announcement}`);

    let actionVerb = '';
    logger.debug(`[${PREFIX}] target: ${JSON.stringify(data, null, 2)}`);
    switch (command) {
      default:
        logger.debug(`[${PREFIX}] default`);
        break;
      case 'b':
      case 'ban':
      case 'nban':
        ban(data);
        actionVerb = 'banned';
        break;
      case 'k':
      case 'kill':
      case 'kline':
      case 'specialkline':
      case 'specialkill':
        kill(data);
        actionVerb = 'killed';
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
        unban(data);
        actionVerb = 'unbanned';
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
        unkill(data);
        actionVerb = 'unbanned';
        break;
      case 'q':
      case 'quiet':
      case 't':
      case 'timeout':
        timeout(data);
        actionVerb = 'quieted';
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
        untimeout(data);
        actionVerb = 'unqieted';
        break;
      case 'v':
      case 'voice':
        voice(data);
        actionVerb = 'voiced';
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
        unvoice(data);
        actionVerb = 'devoiced';
        break;
      case 'o':
      case 'op':
        operator(data);
        actionVerb = 'opped';
        break;
      case 'rop':
      case 'uop':
      case 'dop':
      case 'rmop':
      case 'unop':
      case 'deop':
        unoperator(data);
        actionVerb = 'deopped';
        break;
      case 'kick':
        if (channel === '' || channel.includes('#') === false) {
          global.ircClient.say(message.args[0], 'You must supply a channel! (Remember the #)');
          actionVerb = 'kicked';
          return;
        }
        kick(data, channel);
        actionVerb = 'kicked';
        break;
      case 'invite':
        if (channel === null) {
          global.ircClient.say(message.args[0], 'You must supply a channel! (Remember the #)');
          return;
        }
        invite(data, channel);
        actionVerb = 'invited';
        break;
      // case 'rename':
      // case 'svsnick':
      //   if (channel === null) {
      //     global.ircClient.say(message.args[0], 'You must supply a new nickname!');
      //     return;
      //   }
      //   rename(data, newNick);
      //   actionVerb = 'renamed';
      //   break;
      case 'sq':
      case 'squiet':
      case 'shadowquiet':
        shadowquiet(data);
        actionVerb = 'shadowquieted';
        break;
      case 'uban':
      case 'underban':
      case 'underage':
        underban(data);
        actionVerb = 'underbanned';
        break;
      case 'echo':
      case 'say':
        if (target === null) {
          global.ircClient.say(message.args[0], 'You must supply a channel! (Remember the #)');
          return;
        }
        if (quote === null) {
          global.ircClient.say(message.args[0], 'You must supply a what you want to say!');
          return;
        }
        say(target, quote);
        actionVerb = 'said';
        break;
      case 'announce':
      case 'global':
        if (target === null) {
          global.ircClient.say(message.args[0], 'You must supply what you want to say!');
          return;
        }
        announce(announcement);
        actionVerb = 'announced';
        break;
    }
    global.ircClient.say(message.args[0], `${actor} has ${actionVerb} ${data.nick}${duration !== null ? ` for ${duration}` : ''}${reason !== '' ? ` because ${reason}` : ''}!`);

    // Send the message back to the channel
  },
};
