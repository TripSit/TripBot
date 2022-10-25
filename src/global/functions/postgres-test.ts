// import env from '../utils/env.config';
// import logger from '../utils/logger';
// import * as path from 'path';
// import fs from 'fs';
// import * as firebase from 'firebase-admin';
// import firebaseCreds from '../assets/config/firebase_creds.json';
// const PREFIX = path.parse(__filename).name;
import db, {sql} from '../utils/database';

// https://www.atdatabases.org/docs/pg

/**
 * Controls connections to the database
 * @param {string} email
 * @param {string} favoriteColor
 */
async function insertUser(email: string, favoriteColor: string) {
  await db.query(sql`
    INSERT INTO users (email, favorite_color)
    VALUES (${email}, ${favoriteColor})
  `);
}

/**
 * Controls connections to the database
 * @param {string} email
 * @param {string} favoriteColor
 */
async function updateUser(email: string, favoriteColor: string) {
  await db.query(sql`
    UPDATE users
    SET favorite_color=${favoriteColor}
    WHERE email=${email}
  `);
}

/**
 * Controls connections to the database
 * @param {string} email test
 */
async function deleteUser(email: string) {
  await db.query(sql`
    DELETE FROM users
    WHERE email=${email}
  `);
}

/**
 * Controls connections to the database
 * @param {string} email
 */
async function getUser(email: string) {
  const users = await db.query(sql`
    SELECT * FROM users
    WHERE email=${email}
  `);
  if (users.length === 0) {
    return null;
  }
  return users[0];
}

/**
 * Controls connections to the database
 */
async function run() {
  await db.query(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL NOT NULL PRIMARY KEY,
      email TEXT NOT NULL,
      favorite_color TEXT NOT NULL,
      UNIQUE(email)
    )
  `);

  await insertUser('me@example.com', 'red');
  await updateUser('me@example.com', 'blue');

  const user = await getUser('me@example.com');
  console.log('user =', user);

  await deleteUser('me@example.com');

  await db.dispose();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
