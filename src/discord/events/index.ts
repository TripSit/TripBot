import {Client} from 'discord.js';
import fs from 'fs/promises';
import path from 'path';
// import logger from '../../global/utils/logger';
// const PREFIX = path.parse(__filename).name;

/**
 * @param {client} client The discord client
 * @return {Promise<Command[]>} The list of commands
 */
export async function registerEvents(client: Client): Promise<void> {
  // logger.debug(`[${PREFIX}] events started!`);
  const eventDir = path.join(__dirname, '../events');
  // logger.debug(`[${PREFIX}] eventDir: ${eventDir}`);
  const eventFiles = await fs.readdir(eventDir);
  eventFiles
    .filter((file) => file.endsWith('.ts') && !file.endsWith('index.ts'))
    .map((file) => require(`${eventDir}/${file}`))
    .forEach((event) => {
      const fileName = Object.keys(event)[0];
      if (event[fileName].once) client.once(event[fileName].name, (...args) => event[fileName].execute(...args));
      else client.on(event[fileName].name, (...args) => event[fileName].execute(...args, client));
    });
};
