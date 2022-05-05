'use strict';

require('dotenv').config();

exports.NODE_ENV = process.env.NODE_ENV;

exports.DISCORD_TOKEN = process.env.token;
exports.DISCORD_CLIENT_ID = process.env.clientId;
exports.TRIPSIT_GUILD_ID = process.env.guildId;

exports.IRC_SERVER = process.env.IRC_SERVER;
exports.IRC_USERNAME = process.env.IRC_USERNAME;
exports.IRC_PASSWORD = process.env.IRC_PASSWORD;

exports.FIREBASE_PRIVATE_KEY_ID = process.env.FIREBASE_PRIVATE_KEY_ID;
exports.FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY;
exports.FIREBASE_CLIENT_ID = process.env.FIREBASE_CLIENT_ID;
exports.FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
