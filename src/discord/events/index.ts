import type { Client } from 'discord.js';

import fs from 'node:fs/promises';
import path from 'node:path';
// import log from '../../global/utils/log';
const F = f(__filename); // eslint-disable-line

export default registerEvents;

/**
 * @param {client} discordClient The discord discordClient
 * @return {Promise<Command[]>} The list of commands
 */
export async function registerEvents(discordClient: Client): Promise<void> {
  const eventDir = path.join(__dirname, '../events');
  // log.debug(F, `eventDir: ${eventDir}`);
  const eventFiles = await fs.readdir(eventDir);
  for (const event of eventFiles
    .filter((file) => (file.endsWith('.ts') || file.endsWith('.js')) && !file.startsWith('index'))
    .map((file) => require(`${eventDir}/${file}`))) {
    const fileName = Object.keys(event)[0];
    if (event[fileName].once) {
      discordClient.once(event[fileName].name, (...arguments_) =>
        event[fileName].execute(...arguments_),
      );
    } else {
      discordClient.on(event[fileName].name, (...arguments_) =>
        event[fileName].execute(...arguments_, discordClient),
      );
    }
  }
}
