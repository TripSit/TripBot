'use strict';

const PREFIX = require('path').parse(__filename).name;
const { initializeApp, cert } = require('firebase-admin/app'); // eslint-disable-line
const { getFirestore } = require('firebase-admin/firestore'); // eslint-disable-line
const logger = require('./global/logger');
const serviceAccount = require('./assets/config/firebase_creds.json');
const { discordConnect } = require('./discord/discordAPI');

const {
  firebasePrivateKeyId,
  firebasePrivateKey,
  firebaseClientId,
  firebaseClientEmail,
} = require('../env');

serviceAccount.private_key_id = firebasePrivateKeyId;
serviceAccount.private_key = firebasePrivateKey ? firebasePrivateKey.replace(/\\n/g, '\n') : undefined;
serviceAccount.client_email = firebaseClientEmail;
serviceAccount.client_id = firebaseClientId;

// Initialize firebase app
if (serviceAccount.private_key_id) {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: 'https://tripsit-me-default-rtdb.firebaseio.com',
  });
  global.db = getFirestore();
}

// Initialize discord bot
discordConnect();

// Stop the bot when the process is closed (via Ctrl-C).
const destroy = () => {
  global.manager.teardown();
};

process.on('unhandledRejection', error => {
  const errorObj = error;
  errorObj.stackTraceLimit = Infinity;
  logger.error(`[${PREFIX}] error.name: ${errorObj.name} on line ${errorObj.stack.split('\n')[4]}`);
  logger.error(`[${PREFIX}] error.message: ${errorObj.message}`);
  logger.error(`[${PREFIX}] error.stack: ${errorObj.stack}`);
  logger.error(`[${PREFIX}] error.code: ${errorObj.code}`);
});

process.on('SIGINT', destroy);
process.on('SIGTERM', destroy);
