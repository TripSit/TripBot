import env from '../utils/env.config';
import logger from '../utils/logger';
import * as path from 'path';
import fs from 'fs';
import * as firebase from 'firebase-admin';
import firebaseCreds from '../assets/config/firebase_creds.json';
const PREFIX = path.parse(__filename).name;

const prodDbName = 'users_v5';
const devDbName = 'users_dev';

/**
 * Controls connections to the database
 */
export async function firebaseConnect(): Promise<void> {
  logger.debug(`[${PREFIX}] Connecting to firebase...`);
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
  logger.info(`[${PREFIX}] firebase connected!`);
}

/**
 * Backup production RTDB to development RTDB
 */
async function backup() {
  logger.debug(`[${PREFIX}] Backing up from ${prodDbName} to ${devDbName}`);
  await db.ref(prodDbName).once('value', (data) => {
    if (data.val() !== null) {
      const filename = `./backups/${prodDbName}_backup_${Date.now().valueOf()}`;
      const filedata = JSON.stringify(data.val(), null, 2);
      fs.writeFileSync(filename, filedata);
      logger.info(`[${PREFIX}] Backup saved locally to ${filename}`);
      const remotedbname = 'users_backup';
      db.ref(remotedbname).update(data.val());
      logger.info(`[${PREFIX}] Backup saved remotely to ${remotedbname}`);
      return;
    }
  });
}

Promise.all([
  firebaseConnect(),
  backup(),
])
  .then(() => {
    logger.info(`[${PREFIX}] Backup complete!`);
    process.exit(0);
  })
  .catch((ex) => {
    logger.error(`[${PREFIX}] Error in registering commands:`, ex);
    process.exit(1);
  });
