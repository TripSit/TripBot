'use strict';

const PREFIX = require('path').parse(__filename).name;
const { Client, Intents } = require('discord.js');
const logger = require('../global/utils/logger');
const registerCommands = require('./commands');
const registerEvents = require('./events');

const {
  discordToken,
} = require('../../env');

module.exports = {
  discordConnect: async () => {
    const discordClient = new Client({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS,
        // Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_INVITES,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_TYPING,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
      ],
      partials: [
        'MESSAGE',
        'CHANNEL',
        'USER',
        'GUILD_MEMBER',
        'REACTION',
      ],
    });

    Object.assign(global, { discordClient });

    Promise.all([registerCommands(discordClient), registerEvents(discordClient)])
      .then(() => discordClient.login(discordToken))
      .then(() => logger.info(`[${PREFIX}] Discord bot successfully started...`));
  },
};
