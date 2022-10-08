/* eslint-disable no-unused-vars */
import env from '../utils/env.config';
import logger from '../utils/logger';
import * as path from 'path';
import fs from 'fs';
import * as firebase from 'firebase-admin';
import firebaseCreds from '../assets/config/firebase_creds.json';
const PREFIX = path.parse(__filename).name;

/**
 * Backup production RTDB to development RTDB
 */
// async function etl() {
//   const prodDbName = 'users_v5';
//   const devDbName = 'users_dev';
//   const legacyfile = `./backups/legacy.json`;
//   const legacydata = fs.readFileSync(legacyfile);
//   const legacyjson = JSON.parse(legacydata.toString());

//   Object.keys(legacyjson).forEach((key) => {
//     const userid = legacyjson[key];
//     const user = legacyjson[userid];
//     const exp = user.exp;

// const dbFilename = `./backups/mee6-leaderboard.csv`;
// const data = fs.readFileSync(dbFilename, 'utf8');
// const dataarray = data.split('\r\n');
// dataarray.forEach(async (line, index) => {
//   if (index === 0) {
//     return;
//   }
//   const linearray = line.split(',');
//   const username = linearray[0];
//   const discriminator = linearray[1];
//   const exp = linearray[2];
//   const level = linearray[3];
//   const messages = linearray[4];
//   // logger.debug(`[${PREFIX}] ${username}#${discriminator} - Exp: ${exp} - Lvl: ${level} - Msg: ${messages}`);
//   const tag = `${username}${discriminator}`;
//   logger.debug(`[${PREFIX}] Looking up ${tag}`);
//   index++;
// });

// await db.ref(prodDbName).once('value', (data) => {
//   if (data.val() !== null) {
//     const filename = `./backups/${prodDbName}_backup_${Date.now().valueOf()}`;
//     const filedata = JSON.stringify(data.val(), null, 2);
//     fs.writeFileSync(filename, filedata);
//     logger.info(`[${PREFIX}] Backup saved locally to ${filename}`);
//     const remotedbname = 'users_backup';
//     db.ref(remotedbname).update(data.val());
//     logger.info(`[${PREFIX}] Backup saved remotely to ${remotedbname}`);
//     return;
//   }
// });
// }

// etl();

/**
 * Controls connections to the database
 */
// export async function firebaseConnect(): Promise<void> {
//   logger.debug(`[${PREFIX}] Connecting to firebase...`);
//   // Initialize firebase app
//   firebaseCreds.private_key_id = env.FIREBASE_PRIVATE_KEY_ID;
//   firebaseCreds.private_key = env.FIREBASE_PRIVATE_KEY ? env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : '';
//   firebaseCreds.client_email = env.FIREBASE_CLIENT_EMAIL;
//   firebaseCreds.client_id = env.FIREBASE_CLIENT_ID.toString();
//   firebaseCreds.databaseURL = env.FIREBASE_DB_URL;

//   const serviceAccount = firebaseCreds as firebase.ServiceAccount;

//   firebase.initializeApp({
//     credential: firebase.credential.cert(serviceAccount),
//     databaseURL: env.FIREBASE_DB_URL,
//   });

//   global.db = firebase.database();
//   logger.info(`[${PREFIX}] firebase connected!`);
// }

// Promise.all([
//   // firebaseConnect(),
//   etl(),
// ])
//   .then(() => {
//     logger.info(`[${PREFIX}] ETL complete!`);
//     process.exit(0);
//   })
//   .catch((ex) => {
//     logger.error(`[${PREFIX}] Error in registering commands:`, ex);
//     process.exit(1);
//   });
