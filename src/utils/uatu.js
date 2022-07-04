'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('./logger');
const { getUserInfo } = require('./firebase');
const {
  channelSanctuaryId,
  channelTripsittersId,
  channelOpentripsitId,
  channelOpentripsit1Id,
  channelOpentripsit2Id,
  channelClosedtripsitId,

  channelDevelopmentId,
  channelWikicontentId,
  channelSandboxId,

  channelMeetingroomId,
  channelModeratorsId,
  channelTeamtripsitId,
  channelOperatorsId,
  channelModhavenId,
  channelTripsitmeId,
} = require('../../env');

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

const botNicknames = [
  'tripbot',
  'TSDev',
  'TS1',
  'TSTelegram',
  'TSDiscord',
  'TSModRelay',
  'tripbot1',
  'TSDev1',
  'TS11',
  'TSTelegram1',
  'TSDiscord1',
  'TSModRelay1',
  'Github',
];

logger.debug(`${PREFIX} - channelSandboxId: ${channelSandboxId}`);
const channels = {
  '#sandbox': channelSandboxId,
  '#sandbox-dev': channelSandboxId,
  '#sanctuary': channelSanctuaryId,
  '#tripsitters': channelTripsittersId,
  '#tripsit': channelOpentripsitId,
  '#tripsit1': channelOpentripsit1Id,
  '#tripsit2': channelOpentripsit2Id,
  '#tripsit3': channelClosedtripsitId,
  '#tripsit-dev': channelDevelopmentId,
  '#meeting-room': channelMeetingroomId,
  '#content': channelWikicontentId,
  '#moderators': channelModeratorsId,
  '#teamtripsit': channelTeamtripsitId,
  '#operations': channelOperatorsId,
  '#modhaven': channelModhavenId,
  '#tripsit.me': channelTripsitmeId,
};

module.exports = {
  async watcher(client, message, newNick) {
    if (botNicknames.includes(message.nick)) {
      // logger.debug(`[${PREFIX}] ${message.nick} is a bot!`);
      return;
    }

    logger.debug(`[${PREFIX}] (${message.nick}!${message.user}@${message.host}) ${message.command}ed : ${message.args.join(' ')}`);

    // Get user data
    const [actorData] = await getUserInfo(message);

    if ('experience' in actorData) {
      const lastMessageDate = actorData.experience.general.lastMessageDate;
      const now = new Date();
      const diff = now - lastMessageDate;
      // If the user has sent a message in the last 10 minutes
      if (diff < 10 * 60 * 1000) {
        logger.debug(`[${PREFIX}] ${message.nick} has sent a message in the last 10 minutes!`);

        let verbage = '';
        if (message.command === 'JOIN') {
          verbage = `${message.nick} has rejoined ${message.args[0]}!`;
        } else if (message.command === 'PART') {
          verbage = `${message.nick} has left ${message.args[0]}!`;
        } else if (message.command === 'KICK') {
          verbage = `${message.nick} has been kicked from ${message.args[0]}!`;
        } else if (message.command === 'QUIT') {
          verbage = `${message.nick} has quit the server!`;
        } else if (message.command === 'KILL') {
          verbage = `${message.nick} has been removed from the server!`;
        } else if (message.command === 'NICK') {
          verbage = `${message.nick} has changed their nick to ${newNick}!`;
        }

        logger.debug(`[${PREFIX}] lastMessageChannel: ${actorData.experience.general.lastMessageChannel}`);
        const channelId = channels[actorData.experience.general.lastMessageChannel];
        logger.debug(`[${PREFIX}] channelId: ${channelId} (${typeof channelId})`);
        logger.debug(`[${PREFIX}] channelId: ${JSON.stringify(channelId, null, 2)}`);

        const lastMessageChannel = client.channels.cache.get(channelId);
        logger.debug(`[${PREFIX}] lastMessageChannel: ${lastMessageChannel}`);
        lastMessageChannel.send(verbage);
      }
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
