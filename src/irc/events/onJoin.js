'use strict';

const { watcher } = require('../utils/uatu');

module.exports = {
  async execute() {
    global.ircClient.addListener('join', (channel, nick, message) => {
      // {
      //   "prefix": "TSDev!~TSDev@tripsit/bridge/TS1",
      //   "nick": "TSDev",
      //   "user": "~TSDev",
      //   "host": "tripsit/bridge/TS1",
      //   "command": "JOIN",
      //   "rawCommand": "JOIN",
      //   "commandType": "normal",
      //   "args": [
      //     "#sandbox-dev"
      //   ]
      // }
      watcher(message);
    });
  },
};
