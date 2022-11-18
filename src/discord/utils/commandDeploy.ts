import {
  REST,
} from 'discord.js';
import {
  Routes,
} from 'discord-api-types/v10';
import fs from 'fs/promises';
import path, { parse } from 'path';
import { SlashCommand } from '../@types/commandDef';
import env from '../../global/utils/env.config';
import { validateEnv } from '../../global/utils/env.validate';
import log from '../../global/utils/log';

const PREFIX = parse(__filename).name;

/**
 * @param {string} commandType Either Global or Guild
 * @return {Promise<SlashCommand[]>} The list of commands
 */
async function getCommands(commandType: string): Promise<SlashCommand[]> {
  const commandDir = path.join(__dirname, '../commands');
  const files = await fs.readdir(path.join(commandDir, commandType));
  // log.debug(`[${PREFIX}] ${commandType} command files: ${files}`);
  return files
    .filter((file) => file.endsWith('.ts') && !file.endsWith('index.ts'))
    .map((file) =>
      // log.debug(`[${PREFIX}] ${commandType} command file: ${file}`);
       require(`${commandDir}/${commandType}/${file}`)) // eslint-disable-line
    .map((command) => command[Object.keys(command).find((key) => command[key].data !== undefined) as string].data.toJSON());
}

if (validateEnv()) {
  log.debug(`[${PREFIX}] discordClientId: ${env.DISCORD_CLIENT_ID}`);
  log.debug(`[${PREFIX}] discordGuildId: ${env.DISCORD_GUILD_ID}`);

  const rest = new REST({ version: '9' }).setToken(
    env.DISCORD_CLIENT_TOKEN as string,
  );

  Promise.all([
    getCommands('global').then((commands) => rest.put(
      Routes.applicationCommands(env.DISCORD_CLIENT_ID.toString()),
      { body: commands },
    )),
    getCommands('guild').then((commands) => rest.put(
      Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID.toString(), env.DISCORD_GUILD_ID),
      { body: commands },
    )),
  ])
    .then(() => {
      log.info('Commands successfully registered!');
    })
    .catch((ex) => {
      log.error('Error in registering commands:', ex);
      process.exit(1);
    });
}
