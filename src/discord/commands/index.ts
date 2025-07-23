import fs from 'fs/promises';
import path from 'path';
import { Client, Collection } from 'discord.js';

// import log from '../../global/utils/log';

const F = f(__filename);  // eslint-disable-line

export default registerCommands;

/**
 * @param {discordClient} discordClient The discord discordClient
 * @return {Promise<Command[]>} The list of commands
 */
export async function registerCommands(discordClient: Client): Promise<void> {
  // log.debug(F, `command start!`);
  /**
     *
     * @param {string} commandType The type of command either global or guild
     */
  async function registerType(commandType: 'global' | 'guild') {
    discordClient.commands = new Collection(); // eslint-disable-line no-param-reassign
    const commandDir = path.join(__dirname, '../commands');
    const dirEntries = await fs.readdir(path.join(commandDir, commandType), { withFileTypes: true });

    dirEntries
      .filter(entry => entry.isFile()
        && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))
        && !entry.name.startsWith('index'))
      .map(entry => require(`${commandDir}/${commandType}/${entry.name}`)) // eslint-disable-line global-require, import/no-dynamic-require
      .forEach(command => {
        const goodKey = Object.keys(command).find(key => command[key]?.data !== undefined) as string;
        if (goodKey) {
          const functionName = command[goodKey].data.name;
          discordClient.commands.set(functionName, command[goodKey]);
        }
      });
  }
  await Promise.all([registerType('global'), registerType('guild')]);
}
