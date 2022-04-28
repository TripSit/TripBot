const fs = require('node:fs');
const { Client, Collection, Intents } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const PREFIX = require('path').parse(__filename).name;
const logger = require('./utils/logger.js');
const { initializeApp, cert } = require('firebase-admin/app');
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
initializeApp({
    credential: cert(serviceAccount),
    databaseURL: 'https://tripsit-me-default-rtdb.firebaseio.com',
});

// async function backup() {
//     if (process.env.NODE_ENV === 'production') {
//         return;
//     }
//     const db = getFirestore();
//     const snapshot = await db.collection('users').get();
//     const users = [];
//     // Get today's date in unix tiemstamp
//     const today = Math.floor(Date.now() / 1000);
//     snapshot.forEach((doc) => {
//         users.push(doc.data());
//     });
//     fs.writeFileSync(`./src/backups/fb_db_backup(${today}).json`, JSON.stringify(users, null, 2));
// }
// backup();

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_PRESENCES,
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

client.invites = new Collection();

// Set up commands
const guild_commands = [];
const guild_command_names = ['reagents', 'dxm_calc', 'keta_calc', 'pill_id', 'invite', 'issue', 'botmod', 'tripsit', 'karma', 'tripsitme', 'report', 'mod', 'button'];
const globl_commands = [];
const globl_command_names = ['reagents', 'keta_calc', 'remindme', 'joke', 'motivate', 'urban_define', 'triptoys', 'benzo_calc', 'dxm_calc', 'ems', 'recovery', 'help', 'bug', 'about', 'breathe', 'combo', 'contact', 'hydrate', 'info', 'kipp', 'topic', 'idose'];

client.commands = new Collection();
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`../src/commands/${file}`);
    client.commands.set(command.data.name, command);
    if (guild_command_names.includes(command.data.name)) {
        logger.debug(`[${PREFIX}] Adding command: ${command.data.name} to guild_commands`);
        guild_commands.push(command.data.toJSON());
    }
    else if (globl_command_names.includes(command.data.name)) {
        logger.debug(`[${PREFIX}] Adding command: ${command.data.name} to globl_commands`);
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

// client.on('guildMemberAdd', member => {
//     console.log(member);
// });

// client.on('guildMemberRemove', member => {
//     console.log(member);
// });

client.login(token);