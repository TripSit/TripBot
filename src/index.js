const fs = require('node:fs');
const { Client, Collection, Intents } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const PREFIX = require('path').parse(__filename).name;
const logger = require('./utils/logger.js');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./assets/firebase_creds.json');
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
serviceAccount.private_key_id = process.env.FIREBASE_PRIVATE_KEY_ID;
serviceAccount.private_key = process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;
serviceAccount.client_email = process.env.FIREBASE_CLIENT_ID;
serviceAccount.client_id = process.env.FIREBASE_CLIENT_EMAIL;
const token = process.env.token;
const clientId = process.env.clientid;
const guildId = process.env.guildId;

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

// Initialize this for later
client.invites = new Collection();

// Set up guild commands
const guild_command_names = [
    'botmod',
    'button',
    'invite',
    'issue',
    'karma',
    'mod',
    'report',
    'tripsit',
];

// Set up global commands
const globl_command_names = [
    'about',
    'breathe',
    'bug',
    'calc_benzo',
    'calc_dxm',
    'calc_ketamine',
    'calc_psychedelics',
    'combo',
    'combochart',
    'contact',
    'ems',
    'help',
    'hydrate',
    'idose',
    'info',
    'joke',
    'kipp',
    'motivate',
    'pill_id',
    'reagents',
    'recovery',
    'remindme',
    'time',
    'topic',
    'triptoys',
    'urban_define',
];

// Add global commands to guild commands
// guild_command_names.push(...globl_command_names);

// This adds all commands to the bot globally
client.commands = new Collection();
// This is used down below to sync guild commands on startup
const globl_commands = [];
const guild_commands = [];
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`../src/commands/${file}`);
    client.commands.set(command.data.name, command);
    if (guild_command_names.includes(command.data.name)) {
        logger.debug(`[${PREFIX}] ${command.data.name} added to host guild`);
        guild_commands.push(command.data.toJSON());
    }
    if (globl_command_names.includes(command.data.name)) {
        logger.debug(`[${PREFIX}] ${command.data.name} added GLOBALLY`);
        globl_commands.push(command.data.toJSON());
    }
}

const guild_rest = new REST({ version: '9' }).setToken(token);
guild_rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: guild_commands })
    .then(() => logger.debug(`[${PREFIX}] Successfully registered application guild_commands on ${guildId}!`))
    .catch(console.error);

const globl_rest = new REST({ version: '9' }).setToken(token);
globl_rest.put(Routes.applicationCommands(clientId), { body: globl_commands })
    .then(() => logger.debug(`[${PREFIX}] Successfully registered application globl_commands!`))
    .catch(console.error);

// Set up events
const eventFiles = fs.readdirSync('./src/events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`../src/events/${file}`);
    logger.debug(`[${PREFIX}] Adding event: ${event.name} to bot`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    }
    else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}
logger.debug(`[${PREFIX}] Successfully registered application events!`);

client.login(token);