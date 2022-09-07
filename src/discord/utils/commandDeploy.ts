import {
  REST,
} from 'discord.js';
import {SlashCommand} from './commandDef';
import {
  Routes,
} from 'discord-api-types/v10';
import fs from 'fs/promises';
import env from '../../global/utils/env.config';
import path from 'path';
import logger from '../../global/utils/logger';
const PREFIX = path.parse(__filename).name;

logger.debug(`[${PREFIX}] discordClientId: ${env.DISCORD_CLIENT_ID}`);
// logger.debug(`[${PREFIX}] discordToken: ${env.DISCORD_CLIENT_TOKEN}`);
logger.debug(`[${PREFIX}] discordGuildId: ${env.DISCORD_GUILD_ID}`);


/**
 * @param {string} commandType Either Global or Guild
 * @return {Promise<SlashCommand[]>} The list of commands
 */
async function getCommands(commandType: string): Promise<SlashCommand[]> {
  const commandDir = path.join(__dirname, '../commands');
  const files = await fs.readdir(path.join(commandDir, commandType));
  return files
      .filter((file) => file.endsWith('.ts') && !file.endsWith('index.ts'))
      .map((file) => require(`${commandDir}/${commandType}/${file}`))
      .map((command) => command[Object.keys(command)[0]].data.toJSON());
}

const rest = new REST({version: '9'}).setToken(
  env.DISCORD_CLIENT_TOKEN as string,
);

Promise.all([
  getCommands('global').then((commands) => rest.put(
      Routes.applicationCommands(env.DISCORD_CLIENT_ID.toString()),
      {body: commands},
  )),
  getCommands('guild').then((commands) => rest.put(
      Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID.toString(), env.DISCORD_GUILD_ID.toString()),
      {body: commands},
  )),
])
    .then(() => {
      console.log('Commands successfully registered!');
    })
    .catch((ex) => {
      console.error('Error in registering commands:', ex);
      process.exit(1);
    });
