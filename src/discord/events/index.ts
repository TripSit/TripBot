import { Client } from 'discord.js';
import fs from 'fs/promises';
import path from 'path';
// import log from '../../global/utils/log';
const F = f(__filename);

export default registerEvents;

/**
 * @param {client} discordClient The discord discordClient
 * @return {Promise<Command[]>} The list of commands
 */
export async function registerEvents(discordClient: Client): Promise<void> {
  const eventDir = path.join(__dirname, '../events');
  log.debug(F, `eventDir: ${eventDir}`);
  const eventFiles = await fs.readdir(eventDir);
  eventFiles
    .filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.startsWith('index'))
    .map((file) => require(`${eventDir}/${file}`)) // eslint-disable-line
    .forEach(event => {
      const fileName = Object.keys(event)[0];
      if (event[fileName].once) discordClient.once(event[fileName].name, (...args) => event[fileName].execute(...args));
      else discordClient.on(event[fileName].name, (...args) => event[fileName].execute(...args, discordClient));
    });
}
