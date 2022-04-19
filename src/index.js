const fs = require('node:fs');
const { Client, Collection, Intents } = require('discord.js');
const {
    TRIPSITMEBOT_CLIENTID,
    GUILD_ID_PRD,
    TRIPSITMEBOT,
    TRIPSITME2BOT_CLIENTID,
    GUILD_ID_DEV,
    TRIPSITME2BOT,
} = require('./data/config.json');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
// const Fuse = require('fuse.js');
const winston = require('winston');
const PREFIX = require('path').parse(__filename).name;

const development = true;
if (development) {
    const commands = [];
    const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`../src/commands/${file}`);
        commands.push(command.data.toJSON());
    }
    const rest = new REST({ version: '9' }).setToken(TRIPSITMEBOT);
    rest.put(Routes.applicationGuildCommands(TRIPSITMEBOT_CLIENTID, GUILD_ID_PRD), { body: commands })
        .then(() => logger.info(`[${PREFIX}] Successfully registered application commands!`))
        .catch(console.error);
    rest.put(Routes.applicationGuildCommands(TRIPSITMEBOT_CLIENTID, GUILD_ID_DEV), { body: commands })
        .then(() => logger.info(`[${PREFIX}] Successfully registered application commands!`))
        .catch(console.error);
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
client.commands = new Collection();
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

// Set up events
const eventFiles = fs.readdirSync('./src/events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, logger));
    }
    else {
        client.on(event.name, (...args) => event.execute(...args, logger, client));
    }
}

client.login(TRIPSITMEBOT);