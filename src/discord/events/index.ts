import { Client } from 'discord.js';
import fs from 'fs/promises';
import path from 'path';
// import log from '../../global/utils/log';
// const F = f(__filename);

export default registerEvents;

/**
 * @param {client} client The discord client
 * @return {Promise<Command[]>} The list of commands
 */
export async function registerEvents(client: Client): Promise<void> {
  const eventDir = path.join(__dirname, '../events');
  // log.debug(F, `eventDir: ${eventDir}`);
  const eventFiles = await fs.readdir(eventDir);
  eventFiles
    .filter(file => file.endsWith('.ts') && !file.endsWith('index.ts'))
    .map((file) => require(`${eventDir}/${file}`)) // eslint-disable-line
    .forEach(event => {
      const fileName = Object.keys(event)[0];
      if (event[fileName].once) client.once(event[fileName].name, (...args) => event[fileName].execute(...args));
      else client.on(event[fileName].name, (...args) => event[fileName].execute(...args, client));
    });
}
