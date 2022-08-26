import {Client} from 'discord.js';
import {Collection} from 'discord.js';
import fs from 'fs/promises';
import path from 'path';
// import logger from '../../global/utils/logger';
// const PREFIX = path.parse(__filename).name;

/**
 * @param {client} client The discord client
 * @return {Promise<Command[]>} The list of commands
 */
export async function registerCommands(client: Client): Promise<void> {
  // logger.debug(`[${PREFIX}] command start!`);
  /**
     *
     * @param {string} commandType The type of command either global or guild
     */
  async function registerType(commandType:string) {
    client.commands = new Collection();

    const commandDir = path.join(__dirname, '../commands');
    const files = await fs.readdir(path.join(commandDir, commandType));
    files
        .filter((file) => file.endsWith('.ts') && !file.endsWith('index.ts'))
        .map((file) => require(`${commandDir}\\${commandType}\\${file}`))
        .forEach((command) => {
          // logger.debug(`[${PREFIX}] command: ${JSON.stringify(command, null, 2)}`);
          const fileName = Object.keys(command)[0];
          const functionName = command[fileName].data.name;
          client.commands.set(functionName, command[fileName]);
        });
  }
  Promise.all([registerType('global'), registerType('guild')]);
  // .then(() => logger.debug(`[${PREFIX}] command loaded!`));
};
