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
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        // GatewayIntentBits.GuildIntegrations,
        // GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        // GatewayIntentBits.GuildVoiceStates,
        // GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        // GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        // GatewayIntentBits.DirectMessageTyping,
        // GatewayIntentBits.GuildScheduledEvents,
      ],
      partials: [
        Partials.User,
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
        Partials.Reaction,
        // Partials.GuildScheduledEvent,
      ],
    });

    Object.assign(global, { client });

    Promise.all([registerCommands(client), registerEvents(client)])
      .then(() => client.login(discordToken))
      .then(() => logger.info(`[${PREFIX}] Discord bot logged in!`));
  },
};
