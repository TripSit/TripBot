import { Client, Collection } from 'discord.js';
import fs from 'fs/promises';
import path from 'path';

// import log from '../../global/utils/log';

// const F = f(__filename);

export default registerCommands;

/**
 * @param {client} client The discord client
 * @return {Promise<Command[]>} The list of commands
 */
export async function registerCommands(client: Client): Promise<void> {
  // log.debug(F, `command start!`);
  /**
     *
     * @param {string} commandType The type of command either global or guild
     */
  async function registerType(commandType:string) {
    client.commands = new Collection(); // eslint-disable-line no-param-reassign

    const commandDir = path.join(__dirname, '../commands');
    const files = await fs.readdir(path.join(commandDir, commandType));
    files
      .filter(file => file.endsWith('.ts') && !file.endsWith('index.ts'))
      .map(file => require(`${commandDir}/${commandType}/${file}`)) // eslint-disable-line global-require, import/no-dynamic-require, max-len
      .forEach(command => {
        // log.debug(F, `command: ${JSON.stringify(command, null, 2)}`);
        const goodKey = Object.keys(command).find(key => command[key].data !== undefined) as string;
        // const fileName = Object.keys(command)[0];
        const functionName = command[goodKey].data.name;
        client.commands.set(functionName, command[goodKey]);
      });
  }
  Promise.all([registerType('global'), registerType('guild')]);
  // .then(() => log.debug(F, `command loaded!`));
}
