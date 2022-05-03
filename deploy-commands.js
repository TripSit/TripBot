#!/usr/bin/env node

'use strict';

require('dotenv').config();
const path = require('path');
const fs = require('fs/promises');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

async function getCommands(commandType) {
    const files = await fs.readdir(path.resolve('src/commands'));
    return files
        .filter(file => file.endsWith('.js') && !file.endsWith('index.js'))
        .map(file => require(`./src/commands/${commandType}/${file}`))
        .map(command => command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(process.env.token);

Promise.all([
    getCommands('global').then(commands => rest.put(
        Routes.applicationCommands(process.env.clientid),
        { body: commands },
    )),
    getCommands('guild').then(commands => rest.put(
        Routes.applicationGuildCommands(process.env.clientid, process.env.guildId),
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
