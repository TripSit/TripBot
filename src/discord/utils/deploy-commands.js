#!/usr/bin/env node
/* eslint-disable no-console, import/no-dynamic-require, global-require */

'use strict';

const path = require('path');
const PREFIX = require('path').parse(__filename).name;
const fs = require('fs/promises');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const logger = require('../../global/utils/logger');
const {
  discordClientId,
  discordToken,
  discordGuildId,
} = require('../../../env');

logger.debug(`[${PREFIX}] discordClientId: ${discordClientId}`);
logger.debug(`[${PREFIX}] discordToken: ${discordToken}`);
logger.debug(`[${PREFIX}] discordGuildId: ${discordGuildId}`);

const COMMANDS_PATH = path.resolve('./src/commands');

async function getCommands(commandType) {
  const files = await fs.readdir(path.join(COMMANDS_PATH, commandType));
  return files
    .filter(file => file.endsWith('.js') && !file.endsWith('index.js'))
    .map(file => require(`../commands/${commandType}/${file}`))
    .map(command => command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(discordToken);

Promise.all([
  getCommands('global').then(commands => rest.put(
    Routes.applicationCommands(discordClientId),
    { body: commands },
  )),
  getCommands('guild').then(commands => rest.put(
    Routes.applicationGuildCommands(discordClientId, discordGuildId),
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
