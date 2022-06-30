'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('./logger');
const { getUserInfo } = require('./firebase');

module.exports = {
  async watcher(client, action, nick, channel, newNick) {
    logger.debug(`[${PREFIX}] ${nick} ${action}ed!`);

    // Do a whois on the user to get their account name
    let data = null;
    await global.ircClient.whois(newNick || nick, async resp => {
      data = resp;
    });

    // This is a hack substanc3 helped create to get around the fact that the whois command
    // is asyncronous by default, so we need to make this syncronous
    while (data === null) {
          await new Promise(resolve => setTimeout(resolve, 100)); // eslint-disable-line
    }

    // Check if the user is FOUND on IRC, if not, ignore it
    if (!data.host) {
      logger.debug(`[${PREFIX}] ${newNick || nick} not found on IRC, ignoring!`);
      return;
    }

    // Get user data
    const [actorData] = await getUserInfo(data);

    if ('experience' in actorData) {
      const lastMessageDate = actorData.experience.general.lastMessageDate;
      const now = new Date();
      const diff = now - lastMessageDate;
      // If the user has sent a message in the last 10 minutes
      if (diff < 10 * 60 * 1000) {
        logger.debug(`[${PREFIX}] ${nick} has sent a message in the last 10 minutes!`);

        let verbage = '';
        if (action === 'join') {
          verbage = `${nick} has rejoined!`;
        } else if (action === 'part') {
          verbage = `${nick} has left the channel!`;
        } else if (action === 'kick') {
          verbage = `${nick} has been kicked from the channel!`;
        } else if (action === 'quit') {
          verbage = `${nick} has quit the server!`;
        } else if (action === 'kill') {
          verbage = `${nick} has been removed from the server!`;
        } else if (action === 'nick') {
          verbage = `${nick} has changed their nick to ${newNick}!`;
        }

        const lastMessageChannel = client.channels.cache.get(
          actorData.experience.general.lastMessageChannel,
        );
        lastMessageChannel.send(verbage);
      }
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
