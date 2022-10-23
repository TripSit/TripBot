import env from '../utils/env.config';
import logger from '../utils/logger';
import * as path from 'path';
// import fs from 'fs';
import * as firebase from 'firebase-admin';
import firebaseCreds from '../assets/config/firebase_creds.json';
const PREFIX = path.parse(__filename).name;

Promise.all([
  firebaseConnect(),
  backup('users_v5', 'users_dev'),
])
  .then(() => {
    logger.info(`[${PREFIX}] Backup complete!`);
    process.exit(0);
  })
  .catch((ex) => {
    logger.error(`[${PREFIX}] Error in registering commands:`, ex);
    process.exit(1);
  });

/**
 * Backup production RTDB to development RTDB
 * @param {string } fromDB
 * @param {string } toDB
 */
export async function backup(fromDB: string, toDB: string) {
  // const ref = db.ref(`${env.FIREBASE_DB_USERS}/177537158419054592/birthday`);
  // await ref.once('value', (data) => {
  //   if (data.val() !== null) {
  //     const birthday = data.val();
  //     logger.debug(`[${PREFIX}] birthday: ${JSON.stringify(birthday)}`);
  //   } else {
  //     logger.debug(`[${PREFIX}] data is NULL`);
  //   }
  // });

  // const info =
  // {
  //   '177537158419054592': {
  //     'birthday': {
  //       month: 'June',
  //       day: 13,
  //     },
  //   },
  // };

  // logger.debug(`[${PREFIX}] Setting ${userId}/birthday = ${birthday}`);
  // if (global.db) {
  //   const ref = db.ref(`users_dev2`);
  //   await ref.set(info);
  // }

  let filedata = {};
  logger.debug(`[${PREFIX}] Backing up from ${fromDB} to ${toDB}`);
  await db.ref(fromDB).once('value', async (data) => {
    if (data.val() !== null) {
      filedata = data.val();
      logger.debug(`[${PREFIX}] filedata: ${JSON.stringify(filedata).length}`);

      // const filename = `./backups/${fromDB}_backup_${Date.now().valueOf()}`;
      // fs.writeFileSync(filename, JSON.stringify(filedata, null, 2));
      // logger.info(`[${PREFIX}] Backup saved locally to ${filename}`);
    } else {
      logger.debug(`[${PREFIX}] data is NULL`);
    }
  });

  const ref = db.ref(toDB);
  await ref.update(filedata);
  logger.info(`[${PREFIX}] Backup saved remotely to ${toDB}`);
}

/**
 * Controls connections to the database
 */
async function firebaseConnect(): Promise<void> {
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
