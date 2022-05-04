'use strict';

const path = require('path');
const fs = require('fs/promises');
const { Collection } = require('discord.js');

module.exports = async function registerCommands(client) {
    client.commands = new Collection();

    async function registerType(commandType) {
        const files = await fs.readdir(path.join(__dirname, commandType));
        files
            .filter(file => file.endsWith('.js'))
            .map(file => require(`./${commandType}/${file}`))
            .forEach(command => {
                client.commands.set(command.data.name, command);
            });
    }

    return Promise.all([registerType('global'), registerType('guild')]);
};
