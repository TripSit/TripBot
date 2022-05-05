#!/usr/bin/env node

'use strict';

const path = require('path');
const fs = require('fs/promises');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { DISCORD_CLIENT_ID, DISCORD_TOKEN, TRIPSIT_GUILD_ID } = require('./env');

const COMMANDS_PATH = path.resolve('src/commands');

async function getCommands(commandType) {
    const files = await fs.readdir(path.join(COMMANDS_PATH, commandType));
    return files
        .filter(file => file.endsWith('.js') && !file.endsWith('index.js'))
        .map(file => require(`./src/commands/${commandType}/${file}`))
        .map(command => command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(DISCORD_TOKEN);

Promise.all([
    getCommands('global').then(commands => rest.put(
        Routes.applicationCommands(DISCORD_CLIENT_ID),
        { body: commands },
    )),
    getCommands('guild').then(commands => rest.put(
        Routes.applicationGuildCommands(DISCORD_CLIENT_ID, TRIPSIT_GUILD_ID),
        { body: commands },
    )),
])
    .then(() => {
        console.log('Commands successfully registered!');
    })
    .catch(ex => {
        console.error('Error in registering commands:', ex);
        process.exit(1);
    });
