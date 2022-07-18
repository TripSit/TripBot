'use strict';

const { watcher } = require('../utils/uatu');

module.exports = {
  async execute() {
    global.ircClient.addListener('nick', (oldnick, newnick, channels, message) => {
      // {
      //   "prefix": "Moony!~teknos@tripsit/founder/Teknos",
      //   "nick": "Moony",
      //   "user": "~teknos",
      //   "host": "tripsit/founder/Teknos",
      //   "command": "NICK",
      //   "rawCommand": "NICK",
      //   "commandType": "normal",
      //   "args": [
      //     "Moonpie"
      //   ]
      // }
      watcher(message, newnick);
    });
  },
};
