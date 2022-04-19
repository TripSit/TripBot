const fs = require('node:fs');
const { Client, Collection, Intents } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
// const Fuse = require('fuse.js');
const winston = require('winston');
const PREFIX = require('path').parse(__filename).name;

// Check if we're in production and if not, use the .env file
const production = process.env.NODE_ENV === 'production';
if (!production) {
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
    const command = require(`./src/commands/${file}`);
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
    const event = require(`./src/events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, logger));
    }
    else {
        client.on(event.name, (...args) => event.execute(...args, logger, client));
    }
}

const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    modules: 3,
    modwarn: 4,
    modinfo: 5,
    debug: 6,
};

Object.defineProperty(global, '__stack', {
    get: function() {
        const orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function(_, stack) {
            return stack;
        };
        const err = new Error;
        Error.captureStackTrace(err, arguments.callee);
        const stack = err.stack;
        Error.prepareStackTrace = orig;
        return stack;
    },
});

Object.defineProperty(global, '__line', {
    get: function() {
        return __stack[1].getLineNumber();
    },
});

Object.defineProperty(global, '__function', {
    get: function() {
        return __stack[1].getFunctionName();
    },
});

const logger = winston.createLogger({
    levels: logLevels,
    transports: [new winston.transports.Console({ colorize: true, timestamp: true })],
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.padLevels({ levels: logLevels }),
        winston.format.timestamp(),
        winston.format.printf(info => `${info.timestamp} ${info.level}:${info.message} ${info.stack ? `\n${info.stack}` : ''}`),
    ),
    level: 'debug',
});

winston.addColors({
    error: 'red',
    warn: 'yellow',
    info: 'green',
    modules: 'cyan',
    modwarn: 'yellow',
    modinfo: 'green',
    debug: 'blue',
});

client.login(token);