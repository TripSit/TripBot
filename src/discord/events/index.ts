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
      .map((file) => require(`${eventDir}\\${file}`))
      .forEach((event) => {
        // logger.debug(`[${PREFIX}] event: ${JSON.stringify(event, null, 2)}`);
        if (event.once) client.once(event.name, (...args) => event.execute(...args));
        else client.on(event.name, (...args) => event.execute(...args, client));
      });
  // logger.debug(`[${PREFIX}] events loaded!`);
};
