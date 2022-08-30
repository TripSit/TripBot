'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');
const { getUserInfo } = require('../../global/services/firebaseAPI');
const {
  CHANNEL_SANCTUARY,
  CHANNEL_TRIPSITTERS,
  CHANNEL_OPENTRIPSIT,
  CHANNEL_OPENTRIPSIT1,
  CHANNEL_OPENTRIPSIT2,
  CHANNEL_CLOSEDTRIPSIT,

  CHANNEL_DEVELOPMENT,
  CHANNEL_WIKICONTENT,
  channelSandboxId,

  channelMeetingroomId,
  CHANNEL_MODERATORS,
  channelTeamtripsitId,
  channelOperatorsId,
  channelModhavenId,
  channelTripsitmeId,
  channelLoungeId,
  channelOpiatesId,
  channelStimulantsId,
  channelDepressantsId,
  channelDissociativesId,
  channelPsychedelicsId,
} = require('../../../env');

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
  'tripbot_',
  'TSDev_',
  'TS',
  'TS_',
  'TS1_',
  'TSTelegram_',
  'TSDiscord_',
  'TSModRelay_',
  'tripbot1_',
  'TSDev1_',
  'TS11_',
  'TSTelegram1_',
  'TSDiscord1_',
  'TSModRelay1_',
];

const channels = {
  sandbox: channelSandboxId,
  sandboxdev: channelSandboxId,
  sanctuary: CHANNEL_SANCTUARY,
  tripsitters: CHANNEL_TRIPSITTERS,
  tripsit: CHANNEL_OPENTRIPSIT,
  tripsit1: CHANNEL_OPENTRIPSIT1,
  tripsit2: CHANNEL_OPENTRIPSIT2,
  tripsit3: CHANNEL_CLOSEDTRIPSIT,
  tripsitdev: CHANNEL_DEVELOPMENT,
  meetingroom: channelMeetingroomId,
  content: CHANNEL_WIKICONTENT,
  moderators: CHANNEL_MODERATORS,
  teamtripsit: channelTeamtripsitId,
  operations: channelOperatorsId,
  modhaven: channelModhavenId,
  tripsitme: channelTripsitmeId,
  lounge: channelLoungeId,
  opiates: channelOpiatesId,
  stims: channelStimulantsId,
  depressants: channelDepressantsId,
  dissociatives: channelDissociativesId,
  psychedelics: channelPsychedelicsId,
};

module.exports = {
  async watcher(message, newNick) {
    if (botNicknames.includes(message.nick)) {
      // logger.debug(`[${PREFIX}] ${message.nick} is a bot!`);
      return;
    }

    logger.debug(`[${PREFIX}] (${message.nick}!${message.user}@${message.host}) ${message.command}ed}`);

    let user = null;
    if (message.command === 'KICK') {
      // logger.debug(`[${PREFIX}] Whoising ${message.args[1]}`);
      await global.ircClient.whois(message.args[1], async resp => {
        // logger.debug(`[${PREFIX}] Whoised ${JSON.stringify(resp, null, 2)}`);
        user = resp;
      });
      while (user === null) {
        await new Promise(resolve => setTimeout(resolve, 100)); // eslint-disable-line
      }
    } else {
      user = message;
    }

    // Get user data
    const [actorData] = await getUserInfo(user);
    // logger.debug(`[${PREFIX}] Actor data: ${JSON.stringify(actorData, null, 2)}`);

    if ('experience' in actorData) {
      logger.debug(`[${PREFIX}] Actor has experience!`);
      let lastMessageDate = 0;
      try {
        lastMessageDate = actorData.experience.general.lastMessageDate;
      } catch (e) {
        logger.debug(`[${PREFIX}] No lastMessageDate found for ${message.author ? message.author.username : message.nick}`);
      }
      logger.debug(`[${PREFIX}] Last message date: ${lastMessageDate}`);
      const now = new Date();
      logger.debug(`[${PREFIX}] now: ${now}`);
      const diff = now - lastMessageDate;
      logger.debug(`[${PREFIX}] diff: ${diff} < ${10 * 60 * 1000}`);
      // If the user has sent a message in the last 10 minutes/nick
      if (diff < 10 * 60 * 1000) {
        logger.debug(`[${PREFIX}] ${message.nick} has sent a message in the last 10 minutes!`);

        let verbage = '';
        // if (message.command === 'JOIN') {
        //   verbage = `${message.nick} has joined ${message.args[0]}!`;
        // } else if (message.command === 'PART') {
        //   verbage = `${message.nick} has left ${message.args[0]}!`;
        // } else if (message.command === 'KICK') {
        //   verbage = `${message.nick} has been kicked from ${message.args[0]}!`;
        // } else
        if (message.command === 'QUIT') {
          verbage = `${message.nick} has quit the server!`;
        } else if (message.command === 'KILL') {
          verbage = `${message.nick} has been removed from the server!`;
        } else if (message.command === 'NICK') {
          verbage = `${message.nick} has changed their nick to ${newNick}!`;
        }

        logger.debug(`[${PREFIX}] lastMessageChannelName: ${actorData.experience.general.lastMessageChannel}`);
        const channelId = channels[actorData.experience.general.lastMessageChannel];
        logger.debug(`[${PREFIX}] channelId: ${channelId} (${typeof channelId})`);
        logger.debug(`[${PREFIX}] channelId: ${JSON.stringify(channelId, null, 2)}`);

        if (global.client) {
          const lastMessageChannel = await global.client.channels.fetch(channelId);
          logger.debug(`[${PREFIX}] lastMessageChannel: ${lastMessageChannel}`);
          lastMessageChannel.send(verbage);
        } else {
          logger.debug(`[${PREFIX}] No discord client found!`);
        }
      }
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
