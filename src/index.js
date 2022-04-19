const fs = require('node:fs');
const { Client, Collection, Intents } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const PREFIX = require('path').parse(__filename).name;
const logger = require('./utils/logger.js');

// Check if we're in production and if not, use the .env file
const production = process.env.production === 'true';
if (!production) {
    logger.info(`[${PREFIX}] Using .env file`);
    require('dotenv').config();
}

const token = process.env.token;
const clientId = process.env.clientid;
const guildId = process.env.guildId;

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    ],
    partials: [
        'MESSAGE',
        'CHANNEL',
        'USER',
        'GUILD_MEMBER',
        'REACTION',
    ],
});

// Set up commands
const commands = [];
client.commands = new Collection();
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`../src/commands/${file}`);
    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
}
const rest = new REST({ version: '9' }).setToken(token);
rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
    .then(() => logger.info(`[${PREFIX}] Successfully registered application commands on ${guildId}!`))
    .catch(console.error);

// Set up events
const eventFiles = fs.readdirSync('./src/events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`../src/events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    }
    else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

client.login(token);