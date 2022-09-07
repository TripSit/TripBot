// import {Client} from 'discord.js';
import env from './env.config';
import logger from './logger';
import * as firebase from 'firebase-admin';
import firebaseCreds from '../assets/config/firebase_creds.json';

const PREFIX = require('path').parse(__filename).name;

/**
 * Controls connections to the database
 */
export async function firebaseConnect(): Promise<void> {
  // logger.info(`[${PREFIX}] connecting...`);
  // Initialize firebase app
  firebaseCreds.private_key_id = env.FIREBASE_PRIVATE_KEY_ID;
  firebaseCreds.private_key = env.FIREBASE_PRIVATE_KEY ? env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : '';
  firebaseCreds.client_email = env.FIREBASE_CLIENT_EMAIL;
  firebaseCreds.client_id = env.FIREBASE_CLIENT_ID.toString();
  firebaseCreds.databaseURL = env.FIREBASE_DB_URL;

  const serviceAccount = firebaseCreds as firebase.ServiceAccount;

  firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: env.FIREBASE_DB_URL,
  });

  global.db = firebase.database();
  logger.info(`[${PREFIX}] connected!`);
}
