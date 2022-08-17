'use strict';

const path = require('path');
const fs = require('fs/promises');
const { Collection } = require('discord.js');

module.exports = async function registerCommands(client) {
  client.commands = new Collection(); // eslint-disable-line
  client.commandScopes = new Collection(); //eslint-disable-line

  async function registerType(commandType) {
    const files = await fs.readdir(path.join(__dirname, commandType));
    files
      .filter(file => file.endsWith('.js'))
      .map(file => require(`./${commandType}/${file}`)) // eslint-disable-line
      .forEach(command => {
        client.commands.set(command.data.name, command);
        client.commandScopes.set(command.data.name, commandType);
      });
  }

  return Promise.all([registerType('global'), registerType('guild')]);
};
