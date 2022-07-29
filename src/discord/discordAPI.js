'use strict';

const PREFIX = require('path').parse(__filename).name;
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const logger = require('../global/utils/logger');
const registerCommands = require('./commands');
const registerEvents = require('./events');

const {
  discordToken,
} = require('../../env');

module.exports = {
  discordConnect: async () => {
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        // GatewayIntentBits.GUILD_MEMBERS,
        // GatewayIntentBits.GUILD_BANS,
        // GatewayIntentBits.GUILD_EMOJIS_AND_STICKERS,
        // GatewayIntentBits.GUILD_INTEGRATIONS,
        // GatewayIntentBits.GUILD_WEBHOOKS,
        // GatewayIntentBits.GUILD_INVITES,
        // GatewayIntentBits.GUILD_VOICE_STATES,
        // GatewayIntentBits.GUILD_PRESENCES,
        // GatewayIntentBits.GUILD_MESSAGES,
        // GatewayIntentBits.GUILD_MESSAGE_REACTIONS,
        // GatewayIntentBits.GUILD_MESSAGE_TYPING,
        // GatewayIntentBits.DIRECT_MESSAGES,
        // GatewayIntentBits.DIRECT_MESSAGE_REACTIONS,
        // GatewayIntentBits.DIRECT_MESSAGE_TYPING,
        // GatewayIntentBits.GUILD_SCHEDULED_EVENTS,
      ],
      partials: [
        // Partials.USER,
        Partials.Channel,
        // Partials.GUILD_MEMBER,
        // Partials.MESSAGE,
        // Partials.REACTION,
        // Partials.GUILD_SCHEDULED_EVENT,
      ],
    });

    Object.assign(global, { client });

    Promise.all([registerCommands(client), registerEvents(client)])
      .then(() => client.login(discordToken))
      .then(() => logger.info(`[${PREFIX}] Discord bot successfully started...`));
  },
};
