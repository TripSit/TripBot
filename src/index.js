'use strict';

const path = require('path');
const { Client, Intents } = require('discord.js');
const { initializeApp, cert } = require('firebase-admin/app'); // eslint-disable-line
const { getFirestore } = require('firebase-admin/firestore'); // eslint-disable-line
const discordIRC = require('discord-irc').default;
const logger = require('./utils/logger');
const registerCommands = require('./commands');
const registerEvents = require('./events');
const serviceAccount = require('./assets/firebase_creds.json');
const ircConfig = require('./assets/irc_config.json');

const {
  NODE_ENV,
  discordToken,
  channelModeratorsId,
  channelModeratorsWebhook,
  channelSandboxId,
  channelSandboxWebhook,
  ircServer,
  ircUsername,
  ircPassword,
  firebasePrivateKeyId,
  firebasePrivateKey,
  firebaseClientId,
  firebaseClientEmail,
} = require('../env');

const PREFIX = path.parse(__filename).name;

serviceAccount.private_key_id = firebasePrivateKeyId;
serviceAccount.private_key = firebasePrivateKey ? firebasePrivateKey.replace(/\\n/g, '\n') : undefined;
serviceAccount.client_email = firebaseClientEmail;
serviceAccount.client_id = firebaseClientId;

// logger.debug(`[${PREFIX}] private_key_id:  ${serviceAccount.private_key_id}`);
// logger.debug(`[${PREFIX}] client_email:    ${serviceAccount.client_email}`);
// logger.debug(`[${PREFIX}] client_id:       ${serviceAccount.client_id}`);

// IRC Connection, this takes a while so do it first
ircConfig[0].discordToken = discordToken;
ircConfig[0].server = ircServer;
ircConfig[0].nickname = 'TS';
ircConfig[0].ircOptions.username = ircUsername;
ircConfig[0].ircOptions.password = ircPassword;
if (NODE_ENV === 'production') {
  ircConfig[0].channelMapping = {
    [channelModeratorsId]: '#moderators',
    [channelSandboxId]: '#sandbox',
  };
} else {
  ircConfig[0].channelMapping = {
    [channelSandboxId]: '#sandbox-dev',
  };
}
const webhooks = {
  [channelModeratorsId]: channelModeratorsWebhook,
  [channelSandboxId]: channelSandboxWebhook,
};
// logger.debug(JSON.stringify(webhooks, null, 2));
ircConfig[0].webhooks = webhooks;
// logger.debug(JSON.stringify(ircConfig, null, 2));
if (NODE_ENV === 'production') {
  discordIRC(ircConfig);
}
// Initialize firebase app
if (serviceAccount.private_key_id) {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: 'https://tripsit-me-default-rtdb.firebaseio.com',
  });
  global.db = getFirestore();
}

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
    // Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_INVITES,
  ],
  partials: [
    'MESSAGE',
    'CHANNEL',
    'USER',
    'GUILD_MEMBER',
    'REACTION',
  ],
});

Promise.all([registerCommands(client), registerEvents(client)])
  .then(() => client.login(discordToken))
  .then(() => logger.info(`[${PREFIX}] Discord bot successfully started...`));

// Stop the bot when the process is closed (via Ctrl-C).
const destroy = () => {
  global.manager.teardown();
  client.destroy();
};
process.on('SIGINT', destroy);
process.on('SIGTERM', destroy);
